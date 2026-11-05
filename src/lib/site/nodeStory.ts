/**
 * Apresentação dos três nós da Noden, guiada pela rolagem.
 *
 * Atos: 0 logo unida · 1 nós separados em rede · 2 Home · 3 Game · 4 Data ·
 * 5 reconexão em NODEN HUB. Entre as divisões o triângulo gira 120°, e a
 * divisão da vez sobe para o centro; no fim a volta completa recompõe a logo.
 *
 * Nos atos 0 e 5 a logo é a imagem oficial (fita contínua); os nós vetoriais
 * repetem os mesmos anéis (lib/site/brand.ts) e assumem quando a fita se abre.
 *
 * Sem JavaScript, com movimento reduzido, em tela baixa, quando algum texto
 * não cabe ou no modo de edição, a página segue em leitura normal.
 */
import type { ServiceDivision } from "../../types/services";
import { RINGS, SYMBOL } from "./brand";

type Vec = [number, number];
interface NodeState {
	/** Ângulo (graus) e distância em relação ao centro da cena. */
	a: number;
	d: number;
	/** Raio do anel na cena. */
	r: number;
	fill: number;
	icon: number;
	label: number;
	spot: number;
}
interface Frame {
	tx: number;
	ty: number;
	k: number;
}
interface SceneState {
	frame: Frame;
	nodes: Record<ServiceDivision, NodeState>;
	/** Imagem oficial da logo (0–1); os anéis vetoriais usam o complemento. */
	symbol: number;
	edges: number;
	wordmark: number;
}

const ids: ServiceDivision[] = ["home", "game", "data"];
const CENTER: Vec = [600, 500];
const INTRO: Frame = { tx: CENTER[0] - (SYMBOL.width / 2) * 0.9, ty: CENTER[1] - (SYMBOL.height / 2) * 0.9, k: 0.9 };
const FINAL: Frame = { tx: CENTER[0] - (SYMBOL.width / 2) * 0.38, ty: CENTER[1] - (SYMBOL.height / 2) * 0.38, k: 0.38 };

const toPolar = ([x, y]: Vec): { a: number; d: number } => ({
	a: (Math.atan2(y - CENTER[1], x - CENTER[0]) * 180) / Math.PI,
	d: Math.hypot(x - CENTER[0], y - CENTER[1]),
});
const fromPolar = (a: number, d: number): Vec => [
	CENTER[0] + d * Math.cos((a * Math.PI) / 180),
	CENTER[1] + d * Math.sin((a * Math.PI) / 180),
];

function assembled(frame: Frame): Record<ServiceDivision, NodeState> {
	const out = {} as Record<ServiceDivision, NodeState>;
	for (const id of ids) {
		const ring = RINGS[id];
		const { a, d } = toPolar([ring.cx * frame.k + frame.tx, ring.cy * frame.k + frame.ty]);
		out[id] = { a, d, r: ring.r * frame.k, fill: 0, icon: 0, label: 0, spot: 0 };
	}
	return out;
}

// Ângulos do triângulo: topo, baixo-esquerda, baixo-direita (como na logo).
const TOP = -90;
const LEFT = 150;
const RIGHT = 30;

function spread(): Record<ServiceDivision, NodeState> {
	const angle: Record<ServiceDivision, number> = { home: TOP, game: LEFT, data: RIGHT };
	const out = {} as Record<ServiceDivision, NodeState>;
	for (const id of ids) out[id] = { a: angle[id], d: 300, r: 120, fill: 1, icon: 1, label: 1, spot: 0 };
	return out;
}

/** A divisão ativa no topo/centro; as outras nos cantos de baixo. */
function focus(order: [ServiceDivision, ServiceDivision, ServiceDivision]): Record<ServiceDivision, NodeState> {
	const [active, left, right] = order;
	return {
		[active]: { a: TOP, d: 40, r: 205, fill: 1, icon: 1, label: 0, spot: 1 },
		[left]: { a: LEFT, d: 360, r: 82, fill: 1, icon: 1, label: 1, spot: 0 },
		[right]: { a: RIGHT, d: 360, r: 82, fill: 1, icon: 1, label: 1, spot: 0 },
	} as Record<ServiceDivision, NodeState>;
}

const states: SceneState[] = [
	{ frame: INTRO, nodes: assembled(INTRO), symbol: 1, edges: 0, wordmark: 0 },
	{ frame: INTRO, nodes: spread(), symbol: 0, edges: 1, wordmark: 0 },
	{ frame: INTRO, nodes: focus(["home", "game", "data"]), symbol: 0, edges: 0.6, wordmark: 0 },
	{ frame: INTRO, nodes: focus(["game", "data", "home"]), symbol: 0, edges: 0.6, wordmark: 0 },
	{ frame: INTRO, nodes: focus(["data", "home", "game"]), symbol: 0, edges: 0.6, wordmark: 0 },
	{ frame: FINAL, nodes: assembled(FINAL), symbol: 1, edges: 0, wordmark: 1 },
];
const ACTS = states.length;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Menor giro entre dois ângulos (-180, 180]. */
const turn = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

export interface Rendered {
	act: number;
	symbol: number;
	edges: number;
	wordmark: number;
	frame: Frame;
	nodes: Record<ServiceDivision, { x: number; y: number; r: number; fill: number; icon: number; label: number; spot: number; ring: number }>;
}

/** Estado da cena para um progresso 0–1 (exportado para testes). */
export function sceneAt(progress: number): Rendered {
	const position = clamp(progress) * (ACTS - 1);
	const index = Math.min(ACTS - 2, Math.floor(position));
	const local = position - index;
	// Pausa no começo e no fim de cada ato; o movimento ocupa o meio.
	const t = ease(clamp((local - 0.16) / 0.68));
	const a = states[index];
	const b = states[index + 1];

	// A fita oficial some logo que os nós começam a se abrir e só volta
	// quando eles já estão de novo nas posições da logo.
	const symbol = b.symbol > a.symbol ? lerp(a.symbol, b.symbol, clamp((t - 0.82) / 0.18)) : lerp(a.symbol, b.symbol, clamp(t / 0.12));

	const nodes = {} as Rendered["nodes"];
	for (const id of ids) {
		const na = a.nodes[id];
		const nb = b.nodes[id];
		const angle = na.a + turn(na.a, nb.a) * t;
		const [x, y] = fromPolar(angle, lerp(na.d, nb.d, t));
		nodes[id] = {
			x,
			y,
			r: lerp(na.r, nb.r, t),
			fill: lerp(na.fill, nb.fill, t),
			icon: lerp(na.icon, nb.icon, t),
			label: lerp(na.label, nb.label, t),
			spot: lerp(na.spot, nb.spot, t),
			ring: 1 - symbol,
		};
	}
	return {
		act: Math.round(position),
		symbol,
		edges: lerp(a.edges, b.edges, t),
		wordmark: lerp(a.wordmark, b.wordmark, clamp(t * 2 - 1)),
		frame: { tx: lerp(a.frame.tx, b.frame.tx, t), ty: lerp(a.frame.ty, b.frame.ty, t), k: lerp(a.frame.k, b.frame.k, t) },
		nodes,
	};
}

export function startNodeStory(): void {
	const found = document.querySelector<HTMLElement>("[data-story]");
	if (!found) return;
	const root: HTMLElement = found;
	const stage = root.querySelector<HTMLElement>("[data-story-stage]")!;
	const panels = [...root.querySelectorAll<HTMLElement>("[data-act]")];
	const railLinks = [...root.querySelectorAll<HTMLAnchorElement>("[data-story-rail] [data-story-goto]")];
	const frameEl = root.querySelector<SVGGElement>("[data-frame]")!;
	const symbolEl = root.querySelector<SVGImageElement>("[data-symbol]")!;
	const edgesEl = root.querySelector<SVGGElement>("[data-edges]")!;
	const edgeLines = [...root.querySelectorAll<SVGLineElement>("[data-edge]")];
	const packets = [...root.querySelectorAll<SVGCircleElement>("[data-packet]")];
	const wordmark = root.querySelector<SVGGElement>("[data-wordmark]")!;
	const nodes = Object.fromEntries(
		ids.map((id) => {
			const el = root.querySelector<SVGGElement>(`[data-node="${id}"]`)!;
			const part = (name: string) => el.querySelector(`[data-${name}]`)!;
			return [id, { el, ring: part("ring"), fill: part("fill"), icon: part("icon"), label: part("label"), spot: part("spot") }];
		}),
	) as Record<ServiceDivision, { el: SVGGElement; ring: Element; fill: Element; icon: Element; label: Element; spot: Element }>;

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	let live = false;
	let visible = false;
	let frame = 0;
	let currentAct = -1;

	const editing = () => root.hasAttribute("data-story-editing") || Boolean(document.getElementById("noden-home-editor-state"));
	const canLive = () => !reduced.matches && !editing() && window.innerWidth >= 360 && window.innerHeight >= 600;
	const scrollRange = () => Math.max(1, root.offsetHeight - stage.offsetHeight);
	const progress = () => clamp(-root.getBoundingClientRect().top / scrollRange());
	const actTop = (act: number) => window.scrollY + root.getBoundingClientRect().top + (act / (ACTS - 1)) * scrollRange();
	const fixed = (v: number, digits = 2) => v.toFixed(digits);

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

	function paint(scene: Rendered, time: number) {
		frameEl.setAttribute("transform", `translate(${fixed(scene.frame.tx, 1)} ${fixed(scene.frame.ty, 1)}) scale(${fixed(scene.frame.k, 4)})`);
		symbolEl.setAttribute("opacity", fixed(scene.symbol, 3));
		wordmark.setAttribute("opacity", fixed(scene.wordmark, 3));

		for (const id of ids) {
			const n = scene.nodes[id];
			const part = nodes[id];
			part.el.setAttribute("transform", `translate(${fixed(n.x, 1)} ${fixed(n.y, 1)}) scale(${fixed(n.r / RINGS[id].r, 4)})`);
			part.ring.setAttribute("opacity", fixed(n.ring, 3));
			part.fill.setAttribute("opacity", fixed(n.fill * n.ring, 3));
			part.icon.setAttribute("opacity", fixed(n.icon, 3));
			part.label.setAttribute("opacity", fixed(n.label, 3));
			part.spot.setAttribute("opacity", fixed(n.spot, 3));
		}

		edgesEl.setAttribute("opacity", fixed(scene.edges, 3));
		if (scene.edges > 0.01) {
			const pairs: [ServiceDivision, ServiceDivision][] = [
				["home", "game"],
				["game", "data"],
				["data", "home"],
			];
			pairs.forEach(([from, to], index) => {
				const p = scene.nodes[from];
				const q = scene.nodes[to];
				// A linha começa e termina na borda dos anéis, não no centro.
				const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
				const ux = (q.x - p.x) / length;
				const uy = (q.y - p.y) / length;
				const x1 = p.x + ux * (p.r + 30);
				const y1 = p.y + uy * (p.r + 30);
				const x2 = q.x - ux * (q.r + 30);
				const y2 = q.y - uy * (q.r + 30);
				const line = edgeLines[index];
				line.setAttribute("x1", fixed(x1, 1));
				line.setAttribute("y1", fixed(y1, 1));
				line.setAttribute("x2", fixed(x2, 1));
				line.setAttribute("y2", fixed(y2, 1));
				const t = (((time / 2400 + index / 3) % 1) + 1) % 1;
				packets[index].setAttribute("cx", fixed(lerp(x1, x2, t), 1));
				packets[index].setAttribute("cy", fixed(lerp(y1, y2, t), 1));
			});
		}

		// No topo, a logo "respira" por CSS (.story--at-start), sem redesenhar a cena.
		root.classList.toggle("story--at-start", scene.act === 0 && progress() < 0.02);
	}

	// Só redesenha enquanto há rolagem recente ou pacotes circulando na rede;
	// parada, a cena não consome processamento.
	let lastScroll = 0;
	function loop(time: number) {
		const scene = sceneAt(progress());
		setAct(scene.act);
		paint(scene, time);
		const moving = time - lastScroll < 500 || scene.edges > 0.01;
		frame = visible && live && moving ? requestAnimationFrame(loop) : 0;
	}

	function start() {
		if (!frame && live && visible) frame = requestAnimationFrame(loop);
	}
	window.addEventListener(
		"scroll",
		() => {
			lastScroll = performance.now();
			start();
		},
		{ passive: true },
	);

	function resetStatic() {
		currentAct = -1;
		panels.forEach((panel) => panel.classList.remove("is-active", "is-before"));
		paint(sceneAt(0), 0);
		root.classList.remove("story--at-start");
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
		// Sem transições enquanto o modo é decidido; voltam após a cena montada.
		root.classList.remove("story--ready");
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
		loop(performance.now());
		requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("story--ready")));
	}

	const goTo = (act: number, smooth = true) => {
		window.scrollTo({ top: actTop(act) + 2, behavior: smooth && !reduced.matches ? "smooth" : "auto" });
	};

	root.querySelectorAll<HTMLAnchorElement>("[data-story-goto]").forEach((link) => {
		link.addEventListener("click", (event) => {
			if (!live) return;
			event.preventDefault();
			goTo(Number(link.dataset.storyGoto));
			history.replaceState(null, "", link.hash);
		});
	});

	// Teclado e leitores de tela: o foco em um ato leva a cena até ele.
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
	// Avisa o script inline (NodeStory.astro) que o controlador assumiu.
	root.dataset.storyStarted = "";
	document.fonts?.ready.then(evaluate);

	const target = location.hash ? panels.findIndex((panel) => `#${panel.id}` === location.hash) : -1;
	if (live && target > 0) requestAnimationFrame(() => goTo(target, false));
}
