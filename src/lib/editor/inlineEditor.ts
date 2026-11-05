import type { CatalogDocument, CatalogEditorItem, CatalogServiceCard, PageTextKey, PageTexts } from "../catalog/editorTypes";
import type { DivisionExtras, Promise as NodenPromise } from "../site/divisionContent";
import type { EditorBootstrap } from "../site/divisionView";
import { canMove, moveWithinGroup, newItem, newServiceCard, parsePrice, removeItem, splitLines, upsertItem, upsertServiceCard } from "./inlineDocument";

type FieldMeta = { label: string; max: number; required: boolean; multiline?: boolean };
type State = EditorBootstrap & {
	fields: Record<PageTextKey, FieldMeta>;
	highlightLimits: { maxItems: number; maxLength: number };
	/** Textos de venda sugeridos para a divisão. */
	suggested?: PageTexts;
};
type Doc = CatalogDocument & { page: PageTexts; extras: DivisionExtras };

const FLASH_KEY = "noden:editor:flash";
const SCROLL_KEY = "noden:editor:scroll";

/** Cola somente texto, sem formatação. */
function insertPlainText(text: string) {
	const selection = window.getSelection();
	if (!selection?.rangeCount) return;
	const range = selection.getRangeAt(0);
	range.deleteContents();
	const node = document.createTextNode(text);
	range.insertNode(node);
	range.setStartAfter(node);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
	node.parentElement?.closest("[data-ne-inline]")?.dispatchEvent(new Event("input", { bubbles: true }));
}

const esc = (value: unknown) =>
	String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const kindOptions: [string, string][] = [
	["service", "Serviço"],
	["package", "Pacote"],
	["product", "Produto"],
	["consulting", "Consultoria"],
];
const priceTypes: [string, string][] = [
	["fixed", "Valor fixo"],
	["starting_at", "A partir de"],
	["free", "Gratuito"],
	["consultation", "Sob consulta"],
];

export function startInlineEditor(): void {
	const stateNode = document.getElementById("noden-editor-state");
	const bar = document.querySelector<HTMLElement>("[data-ne-bar]");
	const modal = document.querySelector<HTMLDialogElement>("[data-ne-modal]");
	if (!stateNode || !bar || !modal) return;

	const state = JSON.parse(stateNode.textContent || "{}") as State;
	let doc = structuredClone(state.document) as Doc;
	let saved = JSON.stringify(doc);
	let busy = false;
	let editing = true;

	const statusEl = bar.querySelector<HTMLElement>("[data-ne-status]")!;
	const saveBtn = bar.querySelector<HTMLButtonElement>("[data-ne-save]")!;
	const publishBtn = bar.querySelector<HTMLButtonElement>("[data-ne-publish]")!;
	const discardBtn = bar.querySelector<HTMLButtonElement>("[data-ne-discard]")!;
	const modeBtn = bar.querySelector<HTMLButtonElement>("[data-ne-mode]")!;
	const pageBtn = bar.querySelector<HTMLButtonElement>("[data-ne-page]")!;
	const toastEl = document.querySelector<HTMLElement>("[data-ne-toast]")!;
	const form = modal.querySelector<HTMLFormElement>("[data-ne-form]")!;
	const titleEl = modal.querySelector<HTMLElement>("[data-ne-title]")!;
	const bodyEl = modal.querySelector<HTMLElement>("[data-ne-body]")!;
	const errorEl = modal.querySelector<HTMLElement>("[data-ne-error]")!;
	const submitBtn = modal.querySelector<HTMLButtonElement>("[data-ne-submit]")!;

	const dirty = () => JSON.stringify(doc) !== saved;

	function toast(message: string, ms = 5000) {
		toastEl.textContent = message;
		toastEl.hidden = false;
		window.clearTimeout(Number(toastEl.dataset.timer));
		toastEl.dataset.timer = String(window.setTimeout(() => (toastEl.hidden = true), ms));
	}

	function refreshBar() {
		const isDirty = dirty();
		bar!.dataset.dirty = String(isDirty);
		bar!.dataset.draft = String(state.hasDraft);
		saveBtn.disabled = busy || !state.ready || !isDirty;
		publishBtn.disabled = busy || !state.ready || (!state.hasDraft && !isDirty);
		discardBtn.disabled = busy || (!state.hasDraft && !isDirty);
		pageBtn.disabled = busy;
		if (!state.ready) statusEl.textContent = state.message || "Edição indisponível nesta divisão.";
		else if (busy) statusEl.textContent = "Salvando…";
		else if (isDirty) statusEl.textContent = "Alterações não salvas.";
		else if (state.hasDraft) statusEl.textContent = "Rascunho salvo. O público ainda vê a versão publicada.";
		else statusEl.textContent = "Tudo publicado. Clique em um texto ou card para editar.";
	}

	function setBusy(value: boolean) {
		busy = value;
		refreshBar();
	}

	async function request(path: string, payload: unknown) {
		const response = await fetch(path, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		let result: { error?: string; errors?: Record<string, string>; warning?: string; revision?: number } = {};
		try {
			result = await response.json();
		} catch {
			/* resposta vazia */
		}
		if (!response.ok) {
			const details = result.errors ? Object.values(result.errors).join("\n") : "";
			throw new Error([result.error || "Não foi possível concluir.", details].filter(Boolean).join("\n"));
		}
		return result;
	}

	function reloadWith(message: string) {
		try {
			sessionStorage.setItem(FLASH_KEY, message);
			sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
		} catch {
			/* armazenamento indisponível */
		}
		saved = JSON.stringify(doc);
		window.location.reload();
	}

	async function saveDraft(message = "Rascunho salvo.") {
		if (!state.ready) throw new Error(state.message || "Edição indisponível.");
		setBusy(true);
		try {
			await request("/api/admin/editor/drafts", {
				division: state.division,
				expectedRevision: state.revision,
				baseRevision: state.baseRevision,
				document: doc,
			});
			reloadWith(message);
		} finally {
			setBusy(false);
		}
	}

	/** Aplica uma mudança estrutural e grava o rascunho na hora. */
	async function commit(next: Doc, message: string) {
		const previous = doc;
		doc = next;
		try {
			await saveDraft(message);
		} catch (error) {
			doc = previous;
			refreshBar();
			throw error;
		}
	}

	// ---------- Modal genérico ----------
	let onSubmit: ((data: FormData) => Promise<void> | void) | null = null;
	let returnFocus: HTMLElement | null = null;

	function openModal(title: string, html: string, handler: (data: FormData) => Promise<void> | void, submitLabel = "Salvar", danger = false) {
		returnFocus = document.activeElement as HTMLElement | null;
		titleEl.textContent = title;
		bodyEl.innerHTML = html;
		errorEl.hidden = true;
		submitBtn.textContent = submitLabel;
		submitBtn.classList.toggle("ne-btn--danger", danger);
		onSubmit = handler;
		modal!.showModal();
		bodyEl.querySelector<HTMLElement>("input:not([type=hidden]),textarea,select")?.focus();
	}

	function closeModal() {
		modal!.close();
	}

	modal.addEventListener("close", () => {
		onSubmit = null;
		returnFocus?.focus?.();
	});
	modal.querySelectorAll("[data-ne-close]").forEach((button) => button.addEventListener("click", closeModal));
	modal.addEventListener("click", (event) => {
		if (event.target === modal) closeModal();
	});
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (!onSubmit) return;
		errorEl.hidden = true;
		submitBtn.disabled = true;
		try {
			await onSubmit(new FormData(form));
		} catch (error) {
			errorEl.textContent = (error as Error).message;
			errorEl.hidden = false;
		} finally {
			submitBtn.disabled = false;
		}
	});

	const field = (label: string, name: string, value: unknown, opts: { type?: string; hint?: string; max?: number; required?: boolean } = {}) =>
		`<label class="ne-field">${esc(label)}${opts.required ? " *" : ""}${opts.hint ? `<small>${esc(opts.hint)}</small>` : ""}<input name="${name}" type="${opts.type ?? "text"}" value="${esc(value)}"${opts.max ? ` maxlength="${opts.max}"` : ""}${opts.required ? " required" : ""}${opts.type === "text" || !opts.type ? "" : ' inputmode="decimal"'}></label>`;
	const area = (label: string, name: string, value: unknown, opts: { hint?: string; max?: number; required?: boolean } = {}) =>
		`<label class="ne-field">${esc(label)}${opts.required ? " *" : ""}${opts.hint ? `<small>${esc(opts.hint)}</small>` : ""}<textarea name="${name}"${opts.max ? ` maxlength="${opts.max}"` : ""}${opts.required ? " required" : ""}>${esc(value)}</textarea></label>`;
	const select = (label: string, name: string, value: unknown, options: [string, string][]) =>
		`<label class="ne-field">${esc(label)}<select name="${name}">${options
			.map(([v, l]) => `<option value="${esc(v)}"${v === (value ?? "") ? " selected" : ""}>${esc(l)}</option>`)
			.join("")}</select></label>`;
	const check = (label: string, name: string, checked: boolean) =>
		`<label class="ne-check"><input type="checkbox" name="${name}"${checked ? " checked" : ""}>${esc(label)}</label>`;
	const text = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
	const optional = (data: FormData, name: string) => text(data, name) || null;
	const lines = (value: unknown) => (Array.isArray(value) ? value.join("\n") : "");

	function require(data: FormData, names: [string, string][]) {
		const missing = names.filter(([name]) => !text(data, name)).map(([, label]) => label);
		if (missing.length) throw new Error("Preencha: " + missing.join(", ") + ".");
	}

	// ---------- Itens de preço ----------
	function editItem(item: CatalogEditorItem, isNew: boolean) {
		const categories: [string, string][] = [["", "Sem categoria"], ...state.categories.map((c): [string, string] => [c.id, c.name])];
		const tiers: [string, string][] = [["", "Nenhum"], ...state.tiers.map((t): [string, string] => [t.id, t.name])];
		const badges = state.badges.length
			? `<fieldset class="ne-fieldset"><legend>Selos</legend><div class="ne-row">${state.badges
					.map((b) => `<label class="ne-check"><input type="checkbox" name="badge_ids" value="${esc(b.id)}"${item.badge_ids.includes(b.id) ? " checked" : ""}>${esc(b.name)}</label>`)
					.join("")}</div></fieldset>`
			: "";
		openModal(
			isNew ? "Novo item de preço" : "Editar item",
			[
				field("Nome", "name", item.name, { max: 140, required: true }),
				area("Descrição", "description", item.description, { max: 1200, required: true }),
				`<div class="ne-row">${select("Categoria", "category_id", item.category_id, categories)}${select("Tipo", "item_kind", item.item_kind, kindOptions)}${select("Nível", "tier_id", item.tier_id, tiers)}</div>`,
				`<fieldset class="ne-fieldset"><legend>Preço</legend><div class="ne-row">${select("Como cobrar", "price_type", item.price_type, priceTypes)}${field("Valor (R$)", "price", item.price ?? "", { type: "text", hint: "Ex.: 90 ou 1.250,00" })}${field("Valor antigo (R$)", "compare_at_price", item.compare_at_price ?? "", { hint: "Opcional, para mostrar desconto" })}</div><div class="ne-row">${field("Texto antes do valor", "price_prefix", item.price_prefix ?? "", { hint: "Ex.: A partir de", max: 40 })}${field("Texto no lugar do valor", "price_label", item.price_label ?? "", { hint: "Ex.: Sob consulta", max: 40 })}${field("Texto depois do valor", "price_suffix", item.price_suffix ?? "", { hint: "Ex.: por hora", max: 40 })}</div></fieldset>`,
				area("O que inclui", "features", lines(item.features), { hint: "Um item por linha." }),
				badges,
				field("Observação", "note", item.note ?? "", { max: 400 }),
				`<div class="ne-row">${field("Texto do botão", "cta_label", item.cta_label ?? "", { hint: "Padrão: Quero esse", max: 50 })}</div>`,
				area("Mensagem do WhatsApp", "cta_message", item.cta_message ?? "", { hint: "Opcional. Padrão: mensagem com o nome do item.", max: 500 }),
				`<div class="ne-row">${check("Destaque", "is_featured", item.is_featured)}${check("Visível no site", "is_active", item.is_active)}</div>`,
			].join(""),
			async (data) => {
				require(data, [
					["name", "Nome"],
					["description", "Descrição"],
				]);
				const priceType = text(data, "price_type") as CatalogEditorItem["price_type"];
				const needsValue = priceType === "fixed" || priceType === "starting_at";
				const price = needsValue ? parsePrice(text(data, "price")) : null;
				if (needsValue && price === null) throw new Error("Informe o valor em reais.");
				const compare = needsValue ? parsePrice(text(data, "compare_at_price")) : null;
				if (compare !== null && price !== null && compare <= price) throw new Error("O valor antigo precisa ser maior que o atual.");
				const categoryId = optional(data, "category_id");
				const next: CatalogEditorItem = {
					...item,
					name: text(data, "name"),
					description: text(data, "description"),
					category_id: categoryId,
					item_kind: text(data, "item_kind") as CatalogEditorItem["item_kind"],
					tier_id: optional(data, "tier_id"),
					price_type: priceType,
					price,
					compare_at_price: compare,
					price_prefix: optional(data, "price_prefix"),
					price_label: optional(data, "price_label"),
					price_suffix: optional(data, "price_suffix"),
					features: splitLines(text(data, "features")),
					badge_ids: data.getAll("badge_ids").map(String),
					note: optional(data, "note"),
					cta_label: optional(data, "cta_label"),
					cta_message: optional(data, "cta_message"),
					is_featured: data.get("is_featured") === "on",
					is_active: data.get("is_active") === "on",
					updated_at: new Date().toISOString(),
				};
				if (!isNew && categoryId !== item.category_id) {
					next.sort_order = newItem(doc, item.service_page_id, categoryId).sort_order;
				}
				await commit(upsertItem(doc, next) as Doc, isNew ? "Item criado no rascunho." : "Item atualizado no rascunho.");
			},
		);
	}

	// ---------- Cards de soluções ----------
	function editService(card: CatalogServiceCard, isNew: boolean) {
		openModal(
			isNew ? "Nova solução" : "Editar solução",
			[
				field("Título", "title", card.title, { max: 140, required: true }),
				area("Descrição", "description", card.description, { max: 1200, required: true }),
				area("Destaques", "features", lines(card.features), { hint: "Um por linha. Aparecem como etiquetas." }),
				field("Selo", "badge", card.badge ?? "", { hint: "Opcional. Ex.: Primeiro passo", max: 40 }),
				check("Visível no site", "is_active", card.is_active),
			].join(""),
			async (data) => {
				require(data, [
					["title", "Título"],
					["description", "Descrição"],
				]);
				const next: CatalogServiceCard = {
					...card,
					title: text(data, "title"),
					description: text(data, "description"),
					features: splitLines(text(data, "features")),
					badge: optional(data, "badge"),
					is_active: data.get("is_active") === "on",
					updated_at: new Date().toISOString(),
				};
				await commit(upsertServiceCard(doc, next) as Doc, isNew ? "Solução criada no rascunho." : "Solução atualizada no rascunho.");
			},
		);
	}

	function confirmDelete(id: string, name: string) {
		openModal(
			"Excluir do site?",
			`<p>“${esc(name)}” será removido no rascunho. O público continua vendo a versão atual até você publicar.</p><p>Prefere só esconder? Use <strong>Ocultar</strong>.</p>`,
			async () => {
				await commit(removeItem(doc, id) as Doc, "Removido do rascunho.");
			},
			"Excluir",
			true,
		);
	}

	// ---------- Listas: promessas e etapas ----------
	function editList(key: keyof DivisionExtras) {
		const title = key === "promises" ? "Promessas" : "Como funciona";
		const rowHtml = (item: NodenPromise, index: number) =>
			`<div class="ne-repeat" data-row>${field("Título", `title_${index}`, item.title, { max: 80, required: true })}${field("Texto", `text_${index}`, item.text, { max: 200 })}<button type="button" class="ne-btn" data-remove-row>Remover</button></div>`;
		const render = (items: NodenPromise[]) =>
			`<p>De 1 a 6 itens. Só use promessas que a Noden cumpre.</p><div data-rows>${items.map(rowHtml).join("")}</div><button type="button" class="ne-btn" data-add-row>+ Adicionar item</button>`;
		const read = (): NodenPromise[] =>
			[...bodyEl.querySelectorAll<HTMLElement>("[data-row]")].map((row) => {
				const inputs = row.querySelectorAll<HTMLInputElement>("input");
				return { title: inputs[0].value.trim(), text: inputs[1].value.trim() };
			});
		openModal(title, render(doc.extras[key]), async () => {
			const items = read().filter((x) => x.title || x.text);
			if (!items.length || items.length > 6) throw new Error("Use de 1 a 6 itens.");
			if (items.some((x) => !x.title)) throw new Error("Todo item precisa de título.");
			await commit({ ...doc, extras: { ...doc.extras, [key]: items } }, `${title} atualizadas no rascunho.`);
		});
		bodyEl.addEventListener("click", function handler(event) {
			const target = event.target as HTMLElement;
			if (!modal!.open) return bodyEl.removeEventListener("click", handler);
			if (target.closest("[data-remove-row]")) target.closest("[data-row]")?.remove();
			if (target.closest("[data-add-row]")) {
				const rows = read();
				if (rows.length >= 6) return toast("Máximo de 6 itens.");
				bodyEl.querySelector("[data-rows]")!.insertAdjacentHTML("beforeend", rowHtml({ title: "", text: "" }, rows.length + Date.now()));
				bodyEl.querySelector<HTMLInputElement>("[data-row]:last-child input")?.focus();
			}
		});
	}

	// ---------- Textos da página ----------
	function editPageTexts() {
		const groups: [string, PageTextKey[]][] = [
			["Abertura", ["hero_eyebrow", "hero_title", "hero_description", "hero_primary_label", "hero_primary_message", "hero_secondary_label"]],
			["Soluções e preços", ["services_title", "services_description", "pricing_title", "pricing_description", "pricing_disclaimer"]],
			["Chamada final", ["cta_title", "cta_description", "cta_button_label", "cta_message"]],
			["Google", ["seo_title", "seo_description"]],
		];
		const html = groups
			.map(
				([legend, keys]) =>
					`<fieldset class="ne-fieldset"><legend>${esc(legend)}</legend>${keys
						.map((key) => {
							const meta = state.fields[key];
							return meta.multiline
								? area(meta.label, key, doc.page[key], { max: meta.max, required: meta.required })
								: field(meta.label, key, doc.page[key], { max: meta.max, required: meta.required });
						})
						.join("")}${legend === "Abertura" ? area("Destaques da abertura", "hero_highlights", doc.page.hero_highlights.join("\n"), { hint: `Um por linha, até ${state.highlightLimits.maxItems}.` }) : ""}</fieldset>`,
			)
			.join("");
		const suggestion = state.suggested
			? `<p class="ne-suggest"><button type="button" class="ne-btn" data-fill-suggested>Preencher com textos sugeridos</button> <small>Substitui os campos abaixo. Revise antes de salvar.</small></p>`
			: "";
		openModal("Textos da página e Google", suggestion + html, async (data) => {
			const page = { ...doc.page };
			const missing: string[] = [];
			for (const key of Object.keys(state.fields) as PageTextKey[]) {
				page[key] = text(data, key);
				if (state.fields[key].required && !page[key]) missing.push(state.fields[key].label);
			}
			if (missing.length) throw new Error("Preencha: " + missing.join(", ") + ".");
			page.hero_highlights = splitLines(text(data, "hero_highlights"));
			if (page.hero_highlights.length > state.highlightLimits.maxItems) throw new Error(`Use até ${state.highlightLimits.maxItems} destaques.`);
			await commit({ ...doc, page }, "Textos atualizados no rascunho.");
		});
		bodyEl.querySelector("[data-fill-suggested]")?.addEventListener("click", () => {
			const suggested = state.suggested!;
			for (const key of Object.keys(state.fields) as PageTextKey[]) {
				const input = bodyEl.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${key}"]`);
				if (input) input.value = suggested[key];
			}
			const highlights = bodyEl.querySelector<HTMLTextAreaElement>('[name="hero_highlights"]');
			if (highlights) highlights.value = suggested.hero_highlights.join("\n");
			toast("Textos sugeridos preenchidos. Revise e clique em Salvar.");
		});
	}

	function editHighlights() {
		openModal(
			"Destaques da abertura",
			area("Destaques", "hero_highlights", doc.page.hero_highlights.join("\n"), { hint: `Um por linha, até ${state.highlightLimits.maxItems} itens de ${state.highlightLimits.maxLength} caracteres.` }),
			async (data) => {
				const items = splitLines(text(data, "hero_highlights"));
				if (items.length > state.highlightLimits.maxItems || items.some((x) => x.length > state.highlightLimits.maxLength)) {
					throw new Error(`Use até ${state.highlightLimits.maxItems} itens de ${state.highlightLimits.maxLength} caracteres.`);
				}
				await commit({ ...doc, page: { ...doc.page, hero_highlights: items } }, "Destaques atualizados no rascunho.");
			},
		);
	}

	// ---------- Montagem da interface na página ----------
	const run = (task: () => Promise<void>) => () => {
		task().catch((error: Error) => toast(error.message, 8000));
	};

	function toolsFor(kind: "item" | "service", id: string) {
		const list: { id: string; sort_order: number; category_id?: string | null; is_active: boolean }[] =
			kind === "item" ? doc.items : doc.serviceCards;
		const entry = list.find((x) => x.id === id);
		if (!entry) return null;
		const name = kind === "item" ? (entry as CatalogEditorItem).name : (entry as CatalogServiceCard).title;
		const tools = document.createElement("div");
		tools.className = "ne-tools";
		tools.setAttribute("role", "group");
		tools.setAttribute("aria-label", `Editar ${name}`);
		const button = (label: string, aria: string, action: () => void, disabled = false) => {
			const el = document.createElement("button");
			el.type = "button";
			el.textContent = label;
			el.setAttribute("aria-label", aria);
			el.disabled = disabled || !state.ready;
			el.addEventListener("click", (event) => {
				event.preventDefault();
				event.stopPropagation();
				action();
			});
			tools.append(el);
		};
		button("Editar", `Editar ${name}`, () =>
			kind === "item" ? editItem(structuredClone(entry as CatalogEditorItem), false) : editService(structuredClone(entry as CatalogServiceCard), false),
		);
		const move = (direction: -1 | 1) =>
			run(async () => {
				const next =
					kind === "item"
						? { ...doc, items: moveWithinGroup(doc.items, id, direction) }
						: { ...doc, serviceCards: moveWithinGroup(doc.serviceCards, id, direction) };
				await commit(next, "Ordem alterada no rascunho.");
			});
		button("↑", `Mover ${name} para cima`, move(-1), !canMove(list, id, -1));
		button("↓", `Mover ${name} para baixo`, move(1), !canMove(list, id, 1));
		button(entry.is_active ? "Ocultar" : "Mostrar", `${entry.is_active ? "Ocultar" : "Mostrar"} ${name}`, run(async () => {
			const toggled = { ...entry, is_active: !entry.is_active };
			const next = kind === "item" ? upsertItem(doc, toggled as CatalogEditorItem) : upsertServiceCard(doc, toggled as CatalogServiceCard);
			await commit(next as Doc, entry.is_active ? "Oculto no rascunho." : "Visível no rascunho.");
		}));
		button("Excluir", `Excluir ${name}`, () => confirmDelete(id, name));
		return tools;
	}

	function addButton(label: string, action: () => void) {
		const el = document.createElement("button");
		el.type = "button";
		el.className = "ne-add";
		el.textContent = label;
		el.disabled = !state.ready || !state.pageId;
		el.addEventListener("click", action);
		return el;
	}

	function mount() {
		// Cards com ferramentas
		document.querySelectorAll<HTMLElement>("[data-edit][data-id]").forEach((el) => {
			const tools = toolsFor(el.dataset.edit as "item" | "service", el.dataset.id!);
			if (tools) el.prepend(tools);
		});

		// Nova solução
		const servicesList = document.querySelector<HTMLElement>("[data-edit-collection='service']");
		servicesList?.after(
			addButton("+ Nova solução", () => editService(newServiceCard(doc, state.pageId!), true)),
		);

		// Novo item por categoria
		document.querySelectorAll<HTMLElement>("[data-catalog-group]").forEach((group) => {
			const key = group.dataset.catalogGroup ?? "";
			const categoryId = state.categories.some((c) => c.id === key) ? key : null;
			const name = group.querySelector("h3")?.textContent?.trim() ?? "";
			const li = document.createElement("li");
			li.className = "ne-add-slot";
			li.append(addButton(`+ Novo item${name ? ` em ${name}` : ""}`, () => editItem(newItem(doc, state.pageId!, categoryId), true)));
			group.querySelector(".catalog__grid")?.append(li);
		});
		const catalogHead = document.querySelector<HTMLElement>(".catalog__head");
		if (catalogHead && !document.querySelector("[data-catalog-group]")) {
			catalogHead.after(addButton("+ Primeiro item de preço", () => editItem(newItem(doc, state.pageId!, null), true)));
		}

		// Promessas e etapas
		document.querySelectorAll<HTMLElement>("[data-edit-list]").forEach((list) => {
			const key = list.dataset.editList as keyof DivisionExtras;
			const button = document.createElement("button");
			button.type = "button";
			button.className = "ne-btn ne-list-edit";
			button.style.background = "var(--ink)";
			button.style.color = "var(--white)";
			button.textContent = key === "promises" ? "Editar promessas" : "Editar etapas";
			button.addEventListener("click", () => editList(key));
			list.before(button);
		});

		// Destaques da abertura
		document.querySelectorAll<HTMLElement>("[data-edit-type='list']").forEach((el) => {
			el.tabIndex = 0;
			el.setAttribute("role", "button");
			el.setAttribute("aria-label", "Editar destaques da abertura");
			el.addEventListener("click", () => editing && editHighlights());
			el.addEventListener("keydown", (event) => {
				if (editing && (event.key === "Enter" || event.key === " ")) {
					event.preventDefault();
					editHighlights();
				}
			});
		});

		// Textos editáveis no lugar
		document.querySelectorAll<HTMLElement>("[data-edit-field]:not([data-edit-type])").forEach((el) => {
			const key = el.dataset.editField as PageTextKey;
			const meta = state.fields[key];
			if (!meta) return;
			el.dataset.neInline = "true";
			el.setAttribute("aria-label", `${meta.label} (editável)`);
			el.addEventListener("input", () => {
				doc.page[key] = el.innerText.replace(/\s+\n/g, "\n").trim();
				refreshBar();
			});
			el.addEventListener("keydown", (event) => {
				if (event.key === "Enter" && !meta.multiline) {
					event.preventDefault();
					el.blur();
				}
				if (event.key === "Escape") {
					el.textContent = doc.page[key];
					el.blur();
				}
			});
			el.addEventListener("blur", () => {
				const value = doc.page[key];
				if (meta.required && !value) {
					toast(`${meta.label} não pode ficar vazio.`);
					el.textContent = (JSON.parse(saved) as Doc).page[key];
					doc.page[key] = el.textContent ?? "";
				} else if (value.length > meta.max) {
					toast(`${meta.label}: até ${meta.max} caracteres (atual: ${value.length}).`);
				}
				refreshBar();
			});
			el.addEventListener("paste", (event) => {
				event.preventDefault();
				const plain = event.clipboardData?.getData("text/plain") ?? "";
				insertPlainText(plain);
			});
		});

		// Links e botões com texto editável não navegam durante a edição
		document.addEventListener(
			"click",
			(event) => {
				if (!editing) return;
				const target = event.target as HTMLElement;
				const link = target.closest("a");
				if (link && link.querySelector("[data-ne-inline]") && target.closest("[data-ne-inline]")) {
					event.preventDefault();
				}
			},
			true,
		);
	}

	function setEditing(on: boolean) {
		editing = on;
		document.body.classList.toggle("ne-editing", on);
		modeBtn.setAttribute("aria-pressed", String(!on));
		modeBtn.textContent = on ? "Ver como visitante" : "Voltar a editar";
		document.querySelectorAll<HTMLElement>("[data-ne-inline]").forEach((el) => {
			if (on) {
				el.contentEditable = "plaintext-only";
				if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
				el.spellcheck = true;
			} else {
				el.removeAttribute("contenteditable");
			}
		});
	}

	// ---------- Barra ----------
	saveBtn.addEventListener("click", run(() => saveDraft()));
	modeBtn.addEventListener("click", () => setEditing(!editing));
	pageBtn.addEventListener("click", editPageTexts);

	discardBtn.addEventListener("click", () => {
		openModal(
			"Descartar alterações?",
			"<p>Tudo o que está no rascunho e ainda não foi publicado será perdido. O site público não muda.</p>",
			async () => {
				if (state.hasDraft) {
					await request("/api/admin/editor/drafts", { action: "discard", division: state.division, expectedRevision: state.revision });
				}
				doc = structuredClone(state.document) as Doc;
				reloadWith("Rascunho descartado.");
			},
			"Descartar",
			true,
		);
	});

	publishBtn.addEventListener("click", () => {
		openModal(
			"Publicar no site?",
			"<p>Textos, soluções, preços, promessas e etapas desta página vão para o ar agora, para todos os visitantes.</p>",
			async () => {
				if (dirty()) {
					await request("/api/admin/editor/drafts", {
						division: state.division,
						expectedRevision: state.revision,
						baseRevision: state.baseRevision,
						document: doc,
					}).then((result) => {
						state.revision = result.revision ?? state.revision + 1;
						state.hasDraft = true;
						saved = JSON.stringify(doc);
					});
				}
				const result = await request("/api/admin/editor/publish", { division: state.division, expectedRevision: state.revision });
				reloadWith(result.warning || "Publicado! O site já mostra a nova versão.");
			},
			"Publicar agora",
		);
	});

	window.addEventListener("beforeunload", (event) => {
		if (dirty() && !busy) {
			event.preventDefault();
		}
	});

	mount();
	setEditing(true);
	refreshBar();

	try {
		const flash = sessionStorage.getItem(FLASH_KEY);
		const scroll = Number(sessionStorage.getItem(SCROLL_KEY));
		sessionStorage.removeItem(FLASH_KEY);
		sessionStorage.removeItem(SCROLL_KEY);
		if (flash) toast(flash);
		if (scroll) window.scrollTo({ top: scroll, behavior: "instant" as ScrollBehavior });
	} catch {
		/* armazenamento indisponível */
	}
}
