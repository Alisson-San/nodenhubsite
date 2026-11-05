import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSpecs, specsToText, validateShowcaseItem } from "./types";

const base = {
	id: "11111111-1111-4111-8111-111111111111",
	division: "game",
	title: "Setup branco",
	summary: "",
	category: "Setup",
	tags: ["RGB"],
	specs: [{ label: "GPU", value: "RTX" }],
	linkUrl: "",
	media: [{ path: "22222222-2222-4222-8222-222222222222.webp", alt: "Gabinete aberto" }],
	isPublished: true,
	sortOrder: 0,
};

test("item válido é normalizado", () => {
	const { item, errors } = validateShowcaseItem({ ...base, title: "  Setup branco  ", linkUrl: "" });
	assert.deepEqual(errors, []);
	assert.equal(item?.title, "Setup branco");
	assert.equal(item?.linkUrl, null);
});

test("recusa divisão Home, link sem HTTPS, imagem sem descrição e caminho estranho", () => {
	assert.ok(validateShowcaseItem({ ...base, division: "home" }).errors.length);
	assert.ok(validateShowcaseItem({ ...base, linkUrl: "http://x.com" }).errors.length);
	assert.ok(validateShowcaseItem({ ...base, media: [{ path: base.media[0].path, alt: "" }] }).errors.length);
	assert.ok(validateShowcaseItem({ ...base, media: [{ path: "../segredo.png", alt: "x" }] }).errors.length);
	assert.ok(validateShowcaseItem({ ...base, title: " " }).errors.length);
});

test("especificações em texto 'Nome: valor'", () => {
	const specs = parseSpecs("GPU: RTX 4070\nCPU:  Ryzen 7 \n\nRAM: 32 GB: DDR5");
	assert.deepEqual(specs, [
		{ label: "GPU", value: "RTX 4070" },
		{ label: "CPU", value: "Ryzen 7" },
		{ label: "RAM", value: "32 GB: DDR5" },
	]);
	assert.equal(specsToText(specs).split("\n").length, 3);
	assert.ok(validateShowcaseItem({ ...base, specs: parseSpecs("Só o nome") }).errors.length);
});
