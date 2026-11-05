import assert from "node:assert/strict";
import { test } from "node:test";
import { sceneAt } from "./nodeStory";
import { RINGS } from "./brand";

const angle = (n: { x: number; y: number }) => (Math.atan2(n.y - 500, n.x - 600) * 180) / Math.PI;

test("abre e fecha com a logo oficial; anéis vetoriais só com os nós separados", () => {
	const start = sceneAt(0);
	const end = sceneAt(1);
	assert.equal(start.symbol, 1);
	assert.equal(end.symbol, 1);
	assert.equal(end.wordmark, 1);
	assert.equal(start.nodes.home.ring, 0);
	assert.equal(sceneAt(0.2).symbol, 0);
	assert.equal(sceneAt(0.2).nodes.game.ring, 1);
});

test("os anéis vetoriais coincidem com os da logo nas posições unidas", () => {
	const { nodes, frame } = sceneAt(0);
	for (const id of ["home", "game", "data"] as const) {
		assert.ok(Math.abs(nodes[id].x - (RINGS[id].cx * frame.k + frame.tx)) < 0.01, id);
		assert.ok(Math.abs(nodes[id].y - (RINGS[id].cy * frame.k + frame.ty)) < 0.01, id);
		assert.ok(Math.abs(nodes[id].r - RINGS[id].r * frame.k) < 0.01, id);
	}
});

test("cada divisão ocupa o topo e é a maior no seu ato", () => {
	for (const [progress, active] of [[0.4, "home"], [0.6, "game"], [0.8, "data"]] as const) {
		const scene = sceneAt(progress);
		assert.equal(scene.act, Math.round(progress * 5));
		const biggest = Object.entries(scene.nodes).sort((a, b) => b[1].r - a[1].r)[0][0];
		assert.equal(biggest, active);
		assert.ok(scene.nodes[active].y < 500, `${active} no alto`);
		for (const node of Object.values(scene.nodes)) assert.equal(node.icon, 1);
	}
});

test("entre divisões o triângulo gira sempre no mesmo sentido", () => {
	const steps = [0.4, 0.5, 0.6, 0.7, 0.8];
	for (const id of ["home", "game", "data"] as const) {
		for (let i = 1; i < steps.length; i++) {
			const before = angle(sceneAt(steps[i - 1]).nodes[id]);
			const after = angle(sceneAt(steps[i]).nodes[id]);
			const delta = ((((after - before) % 360) + 540) % 360) - 180;
			assert.ok(delta >= -0.5, `${id} ${steps[i - 1]}→${steps[i]} girou ${delta.toFixed(1)}°`);
		}
	}
});

test("progresso fora do intervalo é limitado", () => {
	assert.deepEqual(sceneAt(-1), sceneAt(0));
	assert.deepEqual(sceneAt(2), sceneAt(1));
});
