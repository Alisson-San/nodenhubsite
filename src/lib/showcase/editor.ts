/**
 * Edição da vitrine no próprio site (somente admin). Usa os estilos do
 * modo de edição (styles/inline-editor.css) e grava direto na tabela
 * showcase_items: "Publicado" controla o que o visitante vê.
 */
import { parseSpecs, showcaseLimits, specsToText, type ShowcaseItem, type ShowcaseMedia } from "./types";

const FLASH_KEY = "noden:editor:flash";
const SCROLL_KEY = "noden:editor:scroll";

const esc = (value: unknown) =>
	String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function post(path: string, payload: unknown) {
	const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
	const result = (await response.json().catch(() => ({}))) as { error?: string };
	if (!response.ok) throw new Error(result.error || "Não foi possível concluir.");
	return result;
}

function reloadWith(message: string) {
	try {
		sessionStorage.setItem(FLASH_KEY, message);
		sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
	} catch {
		/* indisponível */
	}
	window.location.reload();
}

export function startShowcaseEditor(root: HTMLElement, items: ShowcaseItem[]): void {
	if (root.dataset.ready !== "true") return;
	const division = root.dataset.showcase as ShowcaseItem["division"];
	const noun = division === "data" ? "projeto" : "setup";

	// ---------- Modal ----------
	const dialog = document.createElement("dialog");
	dialog.className = "ne-modal";
	dialog.innerHTML = `<form method="dialog" class="ne-modal__form" novalidate>
		<header class="ne-modal__head"><h2 data-title></h2><button type="button" class="ne-icon" data-close aria-label="Fechar">✕</button></header>
		<div class="ne-modal__body" data-body></div>
		<p class="ne-modal__error" role="alert" data-error hidden></p>
		<footer class="ne-modal__foot"><button type="button" class="ne-btn" data-close>Cancelar</button><button type="submit" class="ne-btn ne-btn--primary" data-submit>Salvar</button></footer>
	</form>`;
	document.body.append(dialog);
	const form = dialog.querySelector("form")!;
	const body = dialog.querySelector<HTMLElement>("[data-body]")!;
	const errorEl = dialog.querySelector<HTMLElement>("[data-error]")!;
	const submit = dialog.querySelector<HTMLButtonElement>("[data-submit]")!;
	let onSubmit: (() => Promise<void>) | null = null;
	let returnFocus: HTMLElement | null = null;
	dialog.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dialog.close()));
	dialog.addEventListener("close", () => returnFocus?.focus?.());
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (!onSubmit) return;
		errorEl.hidden = true;
		submit.disabled = true;
		try {
			await onSubmit();
		} catch (error) {
			errorEl.textContent = (error as Error).message;
			errorEl.hidden = false;
		} finally {
			submit.disabled = false;
		}
	});
	const openModal = (title: string, html: string, handler: () => Promise<void>, label = "Salvar", danger = false) => {
		returnFocus = document.activeElement as HTMLElement | null;
		dialog.querySelector("[data-title]")!.textContent = title;
		body.innerHTML = html;
		errorEl.hidden = true;
		submit.textContent = label;
		submit.classList.toggle("ne-btn--danger", danger);
		onSubmit = handler;
		dialog.showModal();
		body.querySelector<HTMLElement>("input,textarea")?.focus();
	};

	// ---------- Formulário do item ----------
	function editItem(original: ShowcaseItem | null) {
		const item: ShowcaseItem = original
			? structuredClone(original)
			: {
					id: crypto.randomUUID(),
					division,
					title: "",
					summary: "",
					category: "",
					tags: [],
					specs: [],
					linkUrl: null,
					media: [],
					isPublished: false,
					sortOrder: Math.max(-10, ...items.map((x) => x.sortOrder)) + 10,
				};
		let media: ShowcaseMedia[] = item.media.map((m) => ({ ...m }));

		const mediaHtml = () =>
			media
				.map(
					(m, i) => `<div class="sc-edit-media" data-index="${i}">
						<img src="${esc(m.url)}" alt="" width="96" height="72">
						<label class="ne-field">Descrição da imagem *<input data-alt value="${esc(m.alt)}" maxlength="${showcaseLimits.alt}" placeholder="${division === "data" ? "Ex.: Tela inicial do painel de vendas" : "Ex.: Gabinete branco com fans RGB e cabos organizados"}"></label>
						<div class="sc-edit-media__tools">
							<button type="button" class="ne-btn" data-up ${i === 0 ? "disabled" : ""} aria-label="Mover imagem para antes">↑</button>
							<button type="button" class="ne-btn" data-remove aria-label="Remover imagem">Remover</button>
						</div>
					</div>`,
				)
				.join("") || `<p class="ne-hint">Nenhuma imagem ainda. A primeira vira a capa.</p>`;

		const html = `
			<label class="ne-field">Título *<input name="title" value="${esc(item.title)}" maxlength="${showcaseLimits.title}" required></label>
			<div class="ne-row">
				<label class="ne-field">Tipo<small>${division === "data" ? "Ex.: Site, Sistema, Dashboard" : "Ex.: Setup gamer, Upgrade, Workstation"}</small><input name="category" value="${esc(item.category)}" maxlength="${showcaseLimits.category}"></label>
				${division === "data" ? `<label class="ne-field">Link do projeto<small>Opcional, começa com https://</small><input name="link" value="${esc(item.linkUrl ?? "")}" inputmode="url"></label>` : ""}
			</div>
			<label class="ne-field">Descrição<textarea name="summary" maxlength="${showcaseLimits.summary}">${esc(item.summary)}</textarea></label>
			${
				division === "data"
					? `<label class="ne-field">Tecnologias<small>Separadas por vírgula. Ex.: Power BI, Astro, Supabase</small><input name="tags" value="${esc(item.tags.join(", "))}"></label>`
					: `<label class="ne-field">Ficha técnica<small>Uma por linha, "Nome: valor". Ex.: GPU: RTX 4070</small><textarea name="specs">${esc(specsToText(item.specs))}</textarea></label>`
			}
			<fieldset class="ne-fieldset"><legend>Imagens (até ${showcaseLimits.media})</legend>
				<div data-media>${mediaHtml()}</div>
				<label class="ne-field">Adicionar imagens<small>JPEG, PNG ou WebP até 8 MB cada.</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple data-upload></label>
				<p class="ne-hint" data-upload-status role="status" aria-live="polite"></p>
			</fieldset>
			<label class="ne-check"><input type="checkbox" name="published" ${item.isPublished ? "checked" : ""}>Publicado (visível para visitantes)</label>`;

		openModal(original ? `Editar ${noun}` : `Novo ${noun}`, html, async () => {
			const value = (name: string) => (form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? "").trim();
			body.querySelectorAll<HTMLElement>(".sc-edit-media").forEach((row) => {
				media[Number(row.dataset.index)].alt = row.querySelector<HTMLInputElement>("[data-alt]")!.value.trim();
			});
			const next: ShowcaseItem = {
				...item,
				title: value("title"),
				category: value("category"),
				summary: value("summary"),
				linkUrl: division === "data" ? value("link") || null : null,
				tags: division === "data" ? value("tags").split(",").map((t) => t.trim()).filter(Boolean) : [],
				specs: division === "game" ? parseSpecs(value("specs")) : [],
				media,
				isPublished: form.querySelector<HTMLInputElement>('[name="published"]')!.checked,
			};
			if (!next.title) throw new Error("Informe o título.");
			if (next.media.some((m) => !m.alt)) throw new Error("Descreva cada imagem (acessibilidade e Google).");
			await post("/api/admin/showcase", { action: "save", item: next });
			reloadWith(original ? `${noun[0].toUpperCase() + noun.slice(1)} atualizado.` : `${noun[0].toUpperCase() + noun.slice(1)} cadastrado.`);
		});

		const mediaBox = body.querySelector<HTMLElement>("[data-media]")!;
		const status = body.querySelector<HTMLElement>("[data-upload-status]")!;
		const syncAlt = () =>
			mediaBox.querySelectorAll<HTMLElement>(".sc-edit-media").forEach((row) => {
				media[Number(row.dataset.index)].alt = row.querySelector<HTMLInputElement>("[data-alt]")!.value;
			});
		mediaBox.addEventListener("click", (event) => {
			const target = event.target as HTMLElement;
			const row = target.closest<HTMLElement>(".sc-edit-media");
			if (!row) return;
			syncAlt();
			const index = Number(row.dataset.index);
			if (target.closest("[data-remove]")) media.splice(index, 1);
			if (target.closest("[data-up]") && index > 0) [media[index - 1], media[index]] = [media[index], media[index - 1]];
			mediaBox.innerHTML = mediaHtml();
		});
		body.querySelector<HTMLInputElement>("[data-upload]")!.addEventListener("change", async (event) => {
			const input = event.target as HTMLInputElement;
			const files = [...(input.files ?? [])];
			syncAlt();
			for (const [n, file] of files.entries()) {
				if (media.length >= showcaseLimits.media) {
					status.textContent = `Limite de ${showcaseLimits.media} imagens atingido.`;
					break;
				}
				status.textContent = `Enviando ${n + 1} de ${files.length}…`;
				const data = new FormData();
				data.append("file", file);
				try {
					const response = await fetch("/api/admin/showcase/media", { method: "POST", body: data });
					const result = (await response.json().catch(() => ({}))) as { path?: string; url?: string; error?: string };
					if (!response.ok || !result.path) throw new Error(result.error || "Falha no envio.");
					media.push({ path: result.path, url: result.url, alt: "" });
					mediaBox.innerHTML = mediaHtml();
				} catch (error) {
					status.textContent = `${file.name}: ${(error as Error).message}`;
					return;
				}
			}
			status.textContent = files.length ? "Imagens enviadas. Descreva cada uma e salve." : "";
			input.value = "";
		});
	}

	// ---------- Ferramentas em cada cartão ----------
	const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
	root.querySelectorAll<HTMLElement>("[data-sc-id]").forEach((card) => {
		const item = items.find((x) => x.id === card.dataset.scId);
		if (!item) return;
		const position = ordered.findIndex((x) => x.id === item.id);
		const tools = document.createElement("div");
		tools.className = "ne-tools sc-tools";
		tools.setAttribute("role", "group");
		tools.setAttribute("aria-label", `Editar ${item.title}`);
		const button = (label: string, aria: string, action: () => void, disabled = false) => {
			const el = document.createElement("button");
			el.type = "button";
			el.textContent = label;
			el.setAttribute("aria-label", aria);
			el.disabled = disabled;
			el.addEventListener("click", (event) => {
				event.stopPropagation();
				action();
			});
			tools.append(el);
		};
		const run = (task: () => Promise<unknown>, message: string) => () =>
			task()
				.then(() => reloadWith(message))
				.catch((error: Error) => alert(error.message));
		const move = (delta: -1 | 1) => {
			const ids = ordered.map((x) => x.id);
			const [moved] = ids.splice(position, 1);
			ids.splice(position + delta, 0, moved);
			return run(() => post("/api/admin/showcase", { action: "order", division, ids }), "Ordem atualizada.");
		};
		button("Editar", `Editar ${item.title}`, () => editItem(item));
		button("←", `Mover ${item.title} para antes`, move(-1), position === 0);
		button("→", `Mover ${item.title} para depois`, move(1), position === ordered.length - 1);
		button(
			item.isPublished ? "Ocultar" : "Publicar",
			`${item.isPublished ? "Ocultar" : "Publicar"} ${item.title}`,
			run(() => post("/api/admin/showcase", { action: "save", item: { ...item, isPublished: !item.isPublished } }), item.isPublished ? "Oculto do público." : "Publicado."),
		);
		button("Excluir", `Excluir ${item.title}`, () =>
			openModal(
				`Excluir ${noun}?`,
				`<p>“${esc(item.title)}” sai do site. Prefere só esconder? Use <strong>Ocultar</strong>.</p>`,
				async () => {
					await post("/api/admin/showcase", { action: "delete", id: item.id });
					reloadWith("Excluído.");
				},
				"Excluir",
				true,
			),
		);
		card.prepend(tools);
	});

	root.querySelector("[data-sc-add]")?.addEventListener("click", () => editItem(null));
}
