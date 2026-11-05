/**
 * Apresentação dos três nós da Noden, guiada pela rolagem.
 *
 * Atos: 0 logo unida · 1 nós separados · 2 Home · 3 Game · 4 Data · 5 reconexão.
 * Sem JavaScript, com movimento reduzido, em tela baixa ou quando algum texto
 * não couber, a página continua em leitura normal (sem fixar a cena).
 */
import type { ServiceDivision } from "../../types/services";

type Vec = [number, number];
interface NodeState {
	x: number;
	y: number;
	s: number;
	fill: number;
	icon: number;
	label: number;
	op: number;
}
interface Frame {
	tx: number;
	ty: number;
	k: number;
}
interface SceneState {
	frame: Frame;
	nodes: Record<ServiceDivision, NodeState>;
	edges: number;
	draw: number;
	wordmark: number;
}

const ids: ServiceDivision[] = ["home", "game", "data"];
// Centro dos anéis na logo oficial (viewBox 1024).
const LOGO: Record<ServiceDivision, Vec> = { home: [525, 310], game: [305, 706], data: [750, 706] };
const RING = 180;
const SPREAD: Record<ServiceDivision, Vec> = { home: [550, 190], game: [225, 790], data: [875, 790] };
const FOCUS: Vec = [560, 470];

const frameIntro: Frame = { tx: 23, ty: -64, k: 1 };
const frameFinal: Frame = { tx: 249, ty: 259, k: 0.42 };

function assembled(frame: Frame): Record<ServiceDivision, NodeState> {
	const out = {} as Record<ServiceDivision, NodeState>;
	for (const id of ids) {
		out[id] = { x: LOGO[id][0] * frame.k + frame.tx, y: LOGO[id][1] * frame.k + frame.ty, s: frame.k, fill: 0, icon: 0, label: 0, op: 1 };
	}
	return out;
}

function spread(): Record<ServiceDivision, NodeState> {
	const out = {} as Record<ServiceDivision, NodeState>;
	for (const id of ids) out[id] = { x: SPREAD[id][0], y: SPREAD[id][1], s: 120 / RING, fill: 0.7, icon: 1, label: 1, op: 1 };
	return out;
}

function focus(active: ServiceDivision): Record<ServiceDivision, NodeState> {
	const out = {} as Record<ServiceDivision, NodeState>;
	for (const id of ids) {
		out[id] =
			id === active
				? { x: FOCUS[0], y: FOCUS[1], s: 250 / RING, fill: 1, icon: 1, label: 0, op: 1 }
				: { x: SPREAD[id][0], y: SPREAD[id][1], s: 72 / RING, fill: 0.5, icon: 1, label: 0, op: 0.45 };
	}
	return out;
}

const states: SceneState[] = [
	{ frame: frameIntro, nodes: assembled(frameIntro), edges: 0, draw: 1, wordmark: 0 },
	{ frame: frameIntro, nodes: spread(), edges: 1, draw: 0, wordmark: 0 },
	{ frame: frameIntro, nodes: focus("home"), edges: 0.55, draw: 0, wordmark: 0 },
	{ frame: frameIntro, nodes: focus("game"), edges: 0.55, draw: 0, wordmark: 0 },
	{ frame: frameIntro, nodes: focus("data"), edges: 0.55, draw: 0, wordmark: 0 },
	{ frame: frameFinal, nodes: assembled(frameFinal), edges: 0, draw: 1, wordmark: 1 },
];
const ACTS = states.length;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Estado da cena para um progresso 0–1 (exportado para testes). */
export function sceneAt(progress: number): { state: SceneState; act: number } {
	const position = clamp(progress) * (ACTS - 1);
	const index = Math.min(ACTS - 2, Math.floor(position));
	const local = position - index;
	// Pausa no começo e no fim de cada ato; a transição ocupa o meio.
	const t = ease(clamp((local - 0.18) / 0.64));
	const a = states[index];
	const b = states[index + 1];
	const nodes = {} as Record<ServiceDivision, NodeState>;
	for (const id of ids) {
		const na = a.nodes[id];
		const nb = b.nodes[id];
		nodes[id] = {
			x: lerp(na.x, nb.x, t),
			y: lerp(na.y, nb.y, t),
			s: lerp(na.s, nb.s, t),
			fill: lerp(na.fill, nb.fill, t),
			icon: lerp(na.icon, nb.icon, t),
			label: lerp(na.label, nb.label, t),
			op: lerp(na.op, nb.op, t),
		};
	}
	return {
		act: Math.round(position),
		state: {
			frame: { tx: lerp(a.frame.tx, b.frame.tx, t), ty: lerp(a.frame.ty, b.frame.ty, t), k: lerp(a.frame.k, b.frame.k, t) },
			nodes,
			// Conectores: recolhem logo no início da separação e só se desenham
			// quando os nós já chegaram às posições da logo.
			draw: lerp(a.draw, b.draw, b.draw > a.draw ? clamp((t - 0.72) / 0.28) : clamp(t / 0.25)),
			edges: lerp(a.edges, b.edges, t),
			wordmark: lerp(a.wordmark, b.wordmark, clamp(t * 2 - 1)),
		},
	};
}

export function startNodeStory(): void {
	const found = document.querySelector<HTMLElement>("[data-story]");
	if (!found) return;
	const root: HTMLElement = found;
	const stage = root.querySelector<HTMLElement>("[data-story-stage]")!;
	const panels = [...root.querySelectorAll<HTMLElement>("[data-act]")];
	const railLinks = [...root.querySelectorAll<HTMLAnchorElement>("[data-story-rail] [data-story-goto]")];
	const nodeEls = Object.fromEntries(ids.map((id) => [id, root.querySelector<SVGGElement>(`[data-node="${id}"]`)!])) as Record<ServiceDivision, SVGGElement>;
	const parts = Object.fromEntries(
		ids.map((id) => {
			const el = nodeEls[id];
			return [id, { fill: el.querySelector("[data-fill]")!, icon: el.querySelector("[data-icon]")!, label: el.querySelector("[data-label]")! }];
		}),
	) as Record<ServiceDivision, { fill: Element; icon: Element; label: Element }>;
	const frameEl = root.querySelector<SVGGElement>("[data-frame]")!;
	const connectors = [...root.querySelectorAll<SVGPathElement>("[data-connector]")];
	const edgesEl = root.querySelector<SVGGElement>("[data-edges]")!;
	const edgeLines = {
		"home-game": root.querySelector<SVGLineElement>('[data-edge="data-game"]')!,
		"home-data": root.querySelector<SVGLineElement>('[data-edge="data-home"]')!,
		"game-data": root.querySelector<SVGLineElement>('[data-edge="game-home"]')!,
	};
	const packets = [...root.querySelectorAll<SVGCircleElement>("[data-packet]")];
	const wordmark = root.querySelector<SVGGElement>("[data-wordmark]")!;

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	let live = false;
	let visible = false;
	let frame = 0;
	let currentAct = -1;

	const editing = () => Boolean(document.getElementById("noden-home-editor-state"));
	const canLive = () => !reduced.matches && !editing() && window.innerWidth >= 360 && window.innerHeight >= 600;

	const scrollRange = () => Math.max(1, root.offsetHeight - stage.offsetHeight);
	const progress = () => clamp(-root.getBoundingClientRect().top / scrollRange());
	const actTop = (act: number) => window.scrollY + root.getBoundingClientRect().top + (act / (ACTS - 1)) * scrollRange();

	function setAct(act: number) {
		if (act === currentAct) return;
		currentAct = act;
		panels.forEach((panel, index) => {
			panel.classList.toggle("is-active", index === act);
			panel.classList.toggle("is-before", index < act);
		});
		railLinks.forEach((link, index) => {
			if (index === act) link.setAttribute("aria-current", "step");
			else link.removeAttribute("aria-current");
		});
	}

	function render(time: number) {
		const { state, act } = sceneAt(progress());
		setAct(act);

		for (const id of ids) {
			const n = state.nodes[id];
			nodeEls[id].setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)}) scale(${n.s.toFixed(4)})`);
			nodeEls[id].setAttribute("opacity", n.op.toFixed(3));
			parts[id].fill.setAttribute("opacity", n.fill.toFixed(3));
			parts[id].icon.setAttribute("opacity", n.icon.toFixed(3));
			parts[id].label.setAttribute("opacity", n.label.toFixed(3));
		}

		frameEl.setAttribute("transform", `translate(${state.frame.tx.toFixed(1)} ${state.frame.ty.toFixed(1)}) scale(${state.frame.k.toFixed(4)})`);
		for (const path of connectors) path.style.strokeDashoffset = String(1 - state.draw);
		wordmark.setAttribute("opacity", state.wordmark.toFixed(3));

		edgesEl.setAttribute("opacity", state.edges.toFixed(3));
		if (state.edges > 0.01) {
			const pos = (id: ServiceDivision): Vec => [state.nodes[id].x, state.nodes[id].y];
			const pairs: [keyof typeof edgeLines, ServiceDivision, ServiceDivision][] = [
				["home-game", "home", "game"],
				["home-data", "home", "data"],
				["game-data", "game", "data"],
			];
			pairs.forEach(([key, a, b], index) => {
				const [x1, y1] = pos(a);
				const [x2, y2] = pos(b);
				const line = edgeLines[key];
				line.setAttribute("x1", x1.toFixed(1));
				line.setAttribute("y1", y1.toFixed(1));
				line.setAttribute("x2", x2.toFixed(1));
				line.setAttribute("y2", y2.toFixed(1));
				// Pacotes de dados circulando entre os nós.
				const t = ((time / 2600 + index / 3) % 1 + 1) % 1;
				const forward = index % 2 === 0 ? t : 1 - t;
				packets[index].setAttribute("cx", lerp(x1, x2, forward).toFixed(1));
				packets[index].setAttribute("cy", lerp(y1, y2, forward).toFixed(1));
			});
		}
	}

	function loop(time: number) {
		render(time);
		frame = visible && live ? requestAnimationFrame(loop) : 0;
	}

	function start() {
		if (!frame && live && visible) frame = requestAnimationFrame(loop);
	}

	function resetStatic() {
		currentAct = -1;
		panels.forEach((panel) => panel.classList.remove("is-active", "is-before"));
		for (const id of ids) {
			const n = states[0].nodes[id];
			nodeEls[id].setAttribute("transform", `translate(${n.x} ${n.y}) scale(1)`);
			nodeEls[id].setAttribute("opacity", "1");
			parts[id].fill.setAttribute("opacity", "0");
			parts[id].icon.setAttribute("opacity", "0");
			parts[id].label.setAttribute("opacity", "0");
		}
		frameEl.setAttribute("transform", "translate(23 -64)");
		for (const path of connectors) path.style.strokeDashoffset = "0";
		wordmark.setAttribute("opacity", "0");
		edgesEl.setAttribute("opacity", "0");
	}

	/** O texto de algum ato não cabe na tela fixa? Então lemos em fluxo normal. */
	function overflows(): boolean {
		const box = stage.getBoundingClientRect();
		return panels.some((panel) => {
			const r = panel.getBoundingClientRect();
			return r.height > box.height - 16 || r.bottom > box.bottom + 1;
		});
	}

	function evaluate() {
		const want = canLive();
		root.style.setProperty("--story-acts", String(ACTS));
		root.classList.toggle("story--live", want);
		live = want && !overflows();
		if (!live) {
			root.classList.remove("story--live");
			cancelAnimationFrame(frame);
			frame = 0;
			resetStatic();
			return;
		}
		currentAct = -1;
		render(performance.now());
		start();
	}

	const goTo = (act: number, smooth = true) => {
		window.scrollTo({ top: actTop(act) + 2, behavior: smooth && !reduced.matches ? "smooth" : "auto" });
	};

	root.querySelectorAll<HTMLAnchorElement>("[data-story-goto]").forEach((link) => {
		link.addEventListener("click", (event) => {
			if (!live) return;
			event.preventDefault();
			const act = Number(link.dataset.storyGoto);
			goTo(act);
			history.replaceState(null, "", link.hash);
		});
	});

	// Teclado: um link de um ato escondido recebe foco → a cena vai até ele.
	root.addEventListener("focusin", (event) => {
		if (!live) return;
		const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-act]");
		if (panel && !panel.classList.contains("is-active")) goTo(Number(panel.dataset.act), false);
	});

	new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		start();
	}).observe(root);

	let resizeTimer = 0;
	window.addEventListener("resize", () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(evaluate, 150);
	});
	reduced.addEventListener("change", evaluate);

	evaluate();
	// As fontes mudam a altura dos textos: reavalia quando carregarem.
	document.fonts?.ready.then(evaluate);

	// Link direto para um ato (ex.: /#apresentacao-game).
	const target = location.hash ? panels.findIndex((panel) => `#${panel.id}` === location.hash) : -1;
	if (live && target > 0) requestAnimationFrame(() => goTo(target, false));
}
