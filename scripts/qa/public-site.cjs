// Verificações do site público. Não envia mensagens nem grava dados.
// 1) npx astro dev --background   (ou um build de produção servido localmente)
// 2) node scripts/qa/public-site.cjs [http://localhost:4321] [pasta-de-saída]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const base = process.argv[2] || 'http://localhost:4321';
const out = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), 'noden-site-'));
const pages = ['/', '/noden-home', '/noden-game', '/noden-data', '/links'];
const sizes = [[320, 740], [390, 844], [768, 1024], [910, 698], [1440, 900], [740, 360]];
let failures = 0;
const check = (ok, label) => {
	console.log(ok ? 'OK  ' : 'FAIL', label);
	if (!ok) failures++;
};

(async () => {
	const browser = await chromium.launch();

	// Sem rolagem horizontal em nenhuma largura
	for (const [width, height] of sizes) {
		const page = await browser.newPage({ viewport: { width, height } });
		for (const route of pages) {
			await page.goto(base + route, { waitUntil: 'networkidle' });
			const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
			check(overflow <= 0, `${route} ${width}x${height} sem rolagem horizontal (${overflow}px)`);
			if (route === '/' || route === '/noden-game') {
				await page.screenshot({ path: path.join(out, `${width}x${height}${route.replace(/\//g, '_') || '_'}.png`) });
			}
		}
		await page.close();
	}

	// Menu móvel: fechado não recebe foco; abre, Escape fecha e devolve o foco
	const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
	await mobile.goto(base + '/noden-home', { waitUntil: 'networkidle' });
	const focusables = [];
	for (let i = 0; i < 8; i++) {
		await mobile.keyboard.press('Tab');
		focusables.push(await mobile.evaluate(() => document.activeElement?.closest('[data-menu]') ? 'menu' : document.activeElement?.textContent?.trim().slice(0, 30)));
	}
	check(!focusables.includes('menu'), 'menu fechado fora da ordem de foco');
	await mobile.click('[data-menu-toggle]');
	check(await mobile.isVisible('#site-menu'), 'menu abre pelo botão');
	check(await mobile.evaluate(() => !!document.activeElement?.closest('#site-menu')), 'foco vai para o menu aberto');
	await mobile.keyboard.press('Escape');
	check(await mobile.isHidden('#site-menu'), 'Escape fecha o menu');
	check(await mobile.evaluate(() => document.activeElement?.matches('[data-menu-toggle]')), 'foco volta ao botão do menu');

	// Busca e filtro do catálogo
	await mobile.fill('[data-catalog-search]', 'zzzz-inexistente');
	check(await mobile.isVisible('[data-catalog-empty]'), 'busca sem resultado mostra aviso');
	await mobile.click('[data-catalog-clear]');
	check(await mobile.isHidden('[data-catalog-empty]'), 'limpar busca restaura itens');
	await mobile.fill('[data-catalog-search]', 'formatacao');
	const shown = await mobile.locator('[data-catalog-item]:visible').count();
	check(shown > 0, `busca sem acento encontra itens (${shown})`);

	// Botão fixo de WhatsApp só depois da abertura
	await mobile.goto(base + '/noden-game', { waitUntil: 'networkidle' });
	check(!(await mobile.locator('[data-sticky-cta]').evaluate((el) => el.classList.contains('is-visible'))), 'botão fixo oculto no topo');
	await mobile.mouse.wheel(0, 2000);
	await mobile.waitForTimeout(400);
	check(await mobile.locator('[data-sticky-cta]').evaluate((el) => el.classList.contains('is-visible')), 'botão fixo aparece ao rolar');

	// Link de pular conteúdo
	await mobile.goto(base + '/', { waitUntil: 'networkidle' });
	await mobile.keyboard.press('Tab');
	check(await mobile.evaluate(() => document.activeElement?.classList.contains('skip-link')), 'primeiro Tab no link "Pular para o conteúdo"');

	// Redirecionamentos e 404
	for (const [from, to] of [['/home', '/noden-home'], ['/game', '/noden-game'], ['/data', '/noden-data'], ['/mobile', '/']]) {
		const response = await fetch(base + from, { redirect: 'manual' });
		check(response.status === 301 && new URL(response.headers.get('location'), base).pathname === to, `${from} → ${to} (301)`);
	}
	check((await fetch(base + '/pagina-que-nao-existe')).status === 404, 'página inexistente responde 404');

	// Movimento reduzido: sem transições longas
	const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
	await reduced.goto(base + '/', { waitUntil: 'networkidle' });
	const duration = await reduced.locator('.ring-link').first().evaluate((el) => getComputedStyle(el).transitionDuration);
	check(parseFloat(duration) < 0.01, `movimento reduzido respeitado (${duration})`);

	await browser.close();
	console.log(`\n${failures} falha(s). Capturas em ${out}`);
	process.exitCode = failures ? 1 : 0;
})();
