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
// A apresentação da inicial é longa por definição (rolagem guiada); a verificação
// de rolagem horizontal vale para todas as páginas.
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

	// Apresentação dos três nós
	const story = await browser.newPage({ viewport: { width: 1440, height: 900 } });
	await story.goto(base + '/', { waitUntil: 'networkidle' });
	check(await story.locator('[data-story]').evaluate((el) => el.classList.contains('story--live')), 'apresentação animada ativa no desktop');
	await story.click('[data-story-rail] [data-story-goto="3"]');
	await story.waitForTimeout(1500);
	check(await story.locator('#apresentacao-game').evaluate((el) => el.classList.contains('is-active')), 'trilha lateral leva ao ato Noden Game');
	await story.evaluate(() => window.scrollTo(0, 0));
	await story.waitForTimeout(400);
	await story.locator('#apresentacao-data a.btn').focus();
	await story.waitForTimeout(600);
	check(await story.locator('#apresentacao-data').evaluate((el) => el.classList.contains('is-active')), 'foco por teclado leva a cena ao ato do link');
	const storyEnd = await story.evaluate(() => { const r = document.querySelector('[data-story]'); return r.offsetTop + r.offsetHeight - window.innerHeight; });
	await story.evaluate((y) => window.scrollTo(0, y), storyEnd);
	await story.waitForTimeout(800);
	const wordmark = Number(await story.locator('[data-wordmark]').getAttribute('opacity'));
	check(wordmark > 0.95, `fim da apresentação forma NODEN HUB (opacidade ${wordmark})`);
	await story.close();

	for (const [label, options] of [['movimento reduzido', { reducedMotion: 'reduce' }], ['sem JavaScript', { javaScriptEnabled: false }]]) {
		const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options });
		await page.goto(base + '/', { waitUntil: 'networkidle' });
		const live = await page.locator('[data-story]').evaluate((el) => el.classList.contains('story--live'));
		const visible = await page.locator('[data-act]').evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity === '1' && el.getBoundingClientRect().height > 0).length);
		check(!live && visible === 6, `${label}: leitura normal com os 6 atos visíveis (${visible})`);
		await page.close();
	}

	// Jornada: as paradas acendem conforme a van passa
	const journey = await browser.newPage({ viewport: { width: 1440, height: 900 } });
	await journey.goto(base + '/', { waitUntil: 'networkidle' });
	const routeTop = await journey.evaluate(() => document.querySelector('[data-journey]').getBoundingClientRect().top + scrollY);
	await journey.evaluate((y) => window.scrollTo(0, y - 700), routeTop);
	await journey.waitForTimeout(400);
	const early = await journey.locator('[data-journey-stop].is-reached').count();
	await journey.evaluate((y) => window.scrollTo(0, y + 500), routeTop);
	await journey.waitForTimeout(400);
	const late = await journey.locator('[data-journey-stop].is-reached').count();
	check(early < late && late === 4, `jornada acende as paradas com a rolagem (${early} → ${late})`);

	// Conversa da chamada final
	await journey.evaluate(() => document.querySelector('#contato').scrollIntoView({ block: 'center' }));
	await journey.waitForTimeout(5500);
	const shownMessages = await journey.locator('[data-chat-msg].is-shown').count();
	const total = await journey.locator('[data-chat-msg]').count();
	check(shownMessages === total && total > 0, `conversa aparece inteira (${shownMessages}/${total})`);
	await journey.close();

	const calm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
	await calm.goto(base + '/', { waitUntil: 'networkidle' });
	const calmStops = await calm.locator('[data-journey-stop].is-reached').count();
	const calmChat = await calm.locator('[data-chat-msg]').evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1'));
	check(calmStops === 4 && calmChat, 'movimento reduzido: jornada e conversa já completas');
	await calm.close();

	// Tela baixa: texto não cabe na cena fixa → leitura normal
	const low = await browser.newPage({ viewport: { width: 360, height: 560 } });
	await low.goto(base + '/', { waitUntil: 'networkidle' });
	check(!(await low.locator('[data-story]').evaluate((el) => el.classList.contains('story--live'))), 'tela baixa usa leitura normal');
	await low.close();

	await browser.close();
	console.log(`\n${failures} falha(s). Capturas em ${out}`);
	process.exitCode = failures ? 1 : 0;
})();
