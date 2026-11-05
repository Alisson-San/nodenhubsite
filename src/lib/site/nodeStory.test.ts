import assert from "node:assert/strict";
import { test } from "node:test";
import { sceneAt } from "./nodeStory";

test("começa com a logo unida e termina formando NODEN HUB", () => {
	const start = sceneAt(0).state;
	const end = sceneAt(1).state;
	assert.equal(start.draw, 1);
	assert.equal(start.wordmark, 0);
	assert.equal(end.draw, 1);
	assert.equal(end.wordmark, 1);
	assert.equal(start.edges, 0);
});

test("nós separados mostram ícones, rótulos e a rede, sem os conectores", () => {
	const { state, act } = sceneAt(0.2);
	assert.equal(act, 1);
	assert.equal(state.draw, 0);
	assert.equal(state.edges, 1);
	for (const node of Object.values(state.nodes)) {
		assert.equal(node.icon, 1);
		assert.equal(node.label, 1);
	}
});

test("cada divisão ganha o centro no seu ato", () => {
	for (const [progress, active] of [[0.4, "home"], [0.6, "game"], [0.8, "data"]] as const) {
		const { state, act } = sceneAt(progress);
		assert.equal(act, Math.round(progress * 5));
		const sizes = Object.entries(state.nodes).sort((a, b) => b[1].s - a[1].s);
		assert.equal(sizes[0][0], active);
		assert.equal(state.nodes[active].fill, 1);
	}
});

test("progresso fora do intervalo é limitado", () => {
	assert.deepEqual(sceneAt(-1), sceneAt(0));
	assert.deepEqual(sceneAt(2), sceneAt(1));
});
