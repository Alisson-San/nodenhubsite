import type { HomeContent } from "../site/homeContent";
import type { HomeEditorState } from "../site/homeView";

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

const groupLabels: Record<string, string> = { Home: "Noden Home", Game: "Noden Game", Data: "Noden Data" };

export function startHomeEditor(): void {
	const stateNode = document.getElementById("noden-home-editor-state");
	const bar = document.querySelector<HTMLElement>("[data-ne-bar]");
	const modal = document.querySelector<HTMLDialogElement>("[data-ne-modal]");
	if (!stateNode || !bar || !modal) return;

	const state = JSON.parse(stateNode.textContent || "{}") as HomeEditorState;
	let content: HomeContent = { ...state.content };
	let saved = JSON.stringify(content);
	let busy = false;
	let editing = true;

	const q = <T extends HTMLElement>(root: ParentNode, selector: string) => root.querySelector<T>(selector)!;
	const statusEl = q<HTMLElement>(bar, "[data-ne-status]");
	const saveBtn = q<HTMLButtonElement>(bar, "[data-ne-save]");
	const publishBtn = q<HTMLButtonElement>(bar, "[data-ne-publish]");
	const discardBtn = q<HTMLButtonElement>(bar, "[data-ne-discard]");
	const modeBtn = q<HTMLButtonElement>(bar, "[data-ne-mode]");
	const pageBtn = q<HTMLButtonElement>(bar, "[data-ne-page]");
	const toastEl = q<HTMLElement>(document, "[data-ne-toast]");
	const form = q<HTMLFormElement>(modal, "[data-ne-form]");
	const bodyEl = q<HTMLElement>(modal, "[data-ne-body]");
	const errorEl = q<HTMLElement>(modal, "[data-ne-error]");
	const submitBtn = q<HTMLButtonElement>(modal, "[data-ne-submit]");
	const fieldsByKey = new Map(state.fields.map((f) => [f.key, f]));

	const dirty = () => JSON.stringify(content) !== saved;

	function toast(message: string, ms = 5000) {
		toastEl.textContent = message;
		toastEl.hidden = false;
		window.clearTimeout(Number(toastEl.dataset.timer));
		toastEl.dataset.timer = String(window.setTimeout(() => (toastEl.hidden = true), ms));
	}

	function refresh() {
		const isDirty = dirty();
		bar!.dataset.dirty = String(isDirty);
		bar!.dataset.draft = String(state.hasDraft);
		saveBtn.disabled = busy || !isDirty;
		publishBtn.disabled = busy || (!state.hasDraft && !isDirty);
		discardBtn.disabled = busy || (!state.hasDraft && !isDirty);
		statusEl.textContent = busy
			? "Salvando…"
			: isDirty
				? "Alterações não salvas."
				: state.hasDraft
					? "Rascunho salvo. O público ainda vê a versão publicada."
					: "Tudo publicado. Clique em um texto para editar.";
	}

	async function call(action: string, payload: Record<string, unknown> = {}) {
		busy = true;
		refresh();
		try {
			const response = await fetch("/api/admin/editor/home", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action, ...payload }),
			});
			const result = (await response.json().catch(() => ({}))) as { error?: string };
			if (!response.ok) throw new Error(result.error || "Não foi possível concluir.");
			return result;
		} finally {
			busy = false;
			refresh();
		}
	}

	function reloadWith(message: string) {
		try {
			sessionStorage.setItem(FLASH_KEY, message);
			sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
		} catch {
			/* indisponível */
		}
		saved = JSON.stringify(content);
		window.location.reload();
	}

	async function saveDraft(message = "Rascunho salvo.") {
		await call("save", { content });
		state.hasDraft = true;
		reloadWith(message);
	}

	// Modal
	let onSubmit: ((data: FormData) => Promise<void>) | null = null;
	let returnFocus: HTMLElement | null = null;
	function openModal(title: string, html: string, handler: (data: FormData) => Promise<void>, label = "Salvar", danger = false) {
		returnFocus = document.activeElement as HTMLElement | null;
		q<HTMLElement>(modal!, "[data-ne-title]").textContent = title;
		bodyEl.innerHTML = html;
		errorEl.hidden = true;
		submitBtn.textContent = label;
		submitBtn.classList.toggle("ne-btn--danger", danger);
		onSubmit = handler;
		modal!.showModal();
		bodyEl.querySelector<HTMLElement>("input,textarea")?.focus();
	}
	modal.addEventListener("close", () => {
		onSubmit = null;
		returnFocus?.focus?.();
	});
	modal.querySelectorAll("[data-ne-close]").forEach((b) => b.addEventListener("click", () => modal.close()));
	modal.addEventListener("click", (e) => e.target === modal && modal.close());
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (!onSubmit) return;
		submitBtn.disabled = true;
		errorEl.hidden = true;
		try {
			await onSubmit(new FormData(form));
		} catch (error) {
			errorEl.textContent = (error as Error).message;
			errorEl.hidden = false;
		} finally {
			submitBtn.disabled = false;
		}
	});

	const input = (key: keyof HomeContent) => {
		const meta = fieldsByKey.get(key)!;
		const hint = meta.list ? "Um por linha, de 1 a 6 itens com até 100 caracteres." : `Até ${meta.max} caracteres.`;
		const tag =
			meta.list || meta.max > 120
				? `<textarea name="${key}" maxlength="${meta.max}" required>${esc(content[key])}</textarea>`
				: `<input name="${key}" value="${esc(content[key])}" maxlength="${meta.max}" required>`;
		return `<label class="ne-field">${esc(meta.label)}<small>${esc(hint)}</small>${tag}</label>`;
	};

	function applyForm(data: FormData, keys: (keyof HomeContent)[]) {
		const next = { ...content };
		for (const key of keys) {
			const meta = fieldsByKey.get(key)!;
			const value = String(data.get(key) ?? "").trim();
			if (!value) throw new Error(`${meta.label}: obrigatório.`);
			if (meta.list) {
				const items = value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
				if (items.length > 6 || items.some((x) => x.length > 100)) throw new Error(`${meta.label}: 1 a 6 itens de até 100 caracteres.`);
				next[key] = items.join("\n");
			} else {
				if (value.length > meta.max) throw new Error(`${meta.label}: até ${meta.max} caracteres.`);
				next[key] = value;
			}
		}
		return next;
	}

	function editAll() {
		const groups = new Map<string, (keyof HomeContent)[]>();
		for (const field of state.fields) {
			const group = field.group ? groupLabels[field.group] ?? field.group : "Abertura, seções e contato";
			groups.set(group, [...(groups.get(group) ?? []), field.key]);
		}
		const html = [...groups]
			.map(([legend, keys]) => `<fieldset class="ne-fieldset"><legend>${esc(legend)}</legend>${keys.map(input).join("")}</fieldset>`)
			.join("");
		openModal("Textos da página inicial", html, async (data) => {
			content = applyForm(data, state.fields.map((f) => f.key));
			await saveDraft("Textos salvos no rascunho.");
		});
	}

	function editList(key: keyof HomeContent) {
		openModal(fieldsByKey.get(key)!.label, input(key), async (data) => {
			content = applyForm(data, [key]);
			await saveDraft("Destaques salvos no rascunho.");
		});
	}

	// Montagem
	document.querySelectorAll<HTMLElement>("[data-home-field]").forEach((el) => {
		const key = el.dataset.homeField as keyof HomeContent;
		const meta = fieldsByKey.get(key);
		if (!meta) return;
		if (meta.list || el.hasAttribute("data-home-list")) {
			el.tabIndex = 0;
			el.setAttribute("role", "button");
			el.setAttribute("aria-label", `Editar ${meta.label}`);
			el.dataset.editField = key;
			el.dataset.editType = "list";
			el.addEventListener("click", () => editing && editList(key));
			el.addEventListener("keydown", (e) => {
				if (editing && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					editList(key);
				}
			});
			return;
		}
		el.dataset.editField = key;
		el.dataset.neInline = "true";
		el.addEventListener("input", () => {
			content[key] = el.innerText.trim();
			refresh();
		});
		el.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				el.blur();
			}
			if (e.key === "Escape") {
				el.textContent = content[key];
				el.blur();
			}
		});
		el.addEventListener("blur", () => {
			if (!content[key]) {
				toast(`${meta.label} não pode ficar vazio.`);
				content[key] = (JSON.parse(saved) as HomeContent)[key];
				el.textContent = content[key];
			} else if (content[key].length > meta.max) {
				toast(`${meta.label}: até ${meta.max} caracteres (atual: ${content[key].length}).`);
			}
			refresh();
		});
		el.addEventListener("paste", (e) => {
			e.preventDefault();
			insertPlainText(e.clipboardData?.getData("text/plain") ?? "");
		});
	});

	document.addEventListener(
		"click",
		(event) => {
			const target = event.target as HTMLElement;
			if (editing && target.closest("[data-ne-inline]") && target.closest("a")) event.preventDefault();
		},
		true,
	);

	function setEditing(on: boolean) {
		editing = on;
		document.body.classList.toggle("ne-editing", on);
		modeBtn.textContent = on ? "Ver como visitante" : "Voltar a editar";
		modeBtn.setAttribute("aria-pressed", String(!on));
		document.querySelectorAll<HTMLElement>("[data-ne-inline]").forEach((el) => {
			if (on) {
				el.contentEditable = "plaintext-only";
				if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
			} else el.removeAttribute("contenteditable");
		});
	}

	const run = (task: () => Promise<void>) => () => task().catch((e: Error) => toast(e.message, 8000));
	saveBtn.addEventListener("click", run(() => saveDraft()));
	modeBtn.addEventListener("click", () => setEditing(!editing));
	pageBtn.addEventListener("click", editAll);
	discardBtn.addEventListener("click", () =>
		openModal(
			"Descartar alterações?",
			"<p>O rascunho da inicial será apagado. O site público não muda.</p>",
			async () => {
				if (state.hasDraft) await call("discard");
				content = JSON.parse(saved);
				reloadWith("Rascunho descartado.");
			},
			"Descartar",
			true,
		),
	);
	publishBtn.addEventListener("click", () =>
		openModal(
			"Publicar a inicial?",
			"<p>Os textos da página inicial vão para o ar agora.</p>",
			async () => {
				if (dirty()) await call("save", { content });
				await call("publish");
				reloadWith("Publicado! A inicial já mostra a nova versão.");
			},
			"Publicar agora",
		),
	);
	window.addEventListener("beforeunload", (e) => {
		if (dirty() && !busy) e.preventDefault();
	});

	setEditing(true);
	refresh();
	try {
		const flash = sessionStorage.getItem(FLASH_KEY);
		const scroll = Number(sessionStorage.getItem(SCROLL_KEY));
		sessionStorage.removeItem(FLASH_KEY);
		sessionStorage.removeItem(SCROLL_KEY);
		if (flash) toast(flash);
		if (scroll) window.scrollTo({ top: scroll, behavior: "instant" as ScrollBehavior });
	} catch {
		/* indisponível */
	}
}
