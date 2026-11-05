import assert from "node:assert/strict";
import { test } from "node:test";
import { divisions, modernizePath } from "./divisions";
import { defaultDivisionExtras, readDivisionExtras, validateDivisionExtras } from "./divisionContent";
import { validatePageTexts, pageTextsToUpdate } from "./pageTexts";
import { validateEditorExtras } from "./editorExtrasValidation";
import { pageTextKeys, type PageTexts } from "../catalog/editorTypes";
import { normalizeCampaignPages } from "../campaigns/types";
import { eligibleCampaigns } from "../campaigns/eligibility";
import { validateHomeContent, defaultHomeContent } from "./homeContent";

const texts = (): PageTexts => {
	const t = {} as PageTexts;
	for (const key of pageTextKeys) t[key] = "Texto";
	t.hero_highlights = ["Um"];
	return t;
};

test("rotas novas e conversão de caminhos antigos", () => {
	assert.equal(divisions.home.path, "/noden-home");
	assert.equal(modernizePath("/game"), "/noden-game");
	assert.equal(modernizePath("/home#precos"), "/noden-home#precos");
	assert.equal(modernizePath("/homepage"), "/homepage");
	assert.equal(modernizePath("#servicos"), "#servicos");
});

test("campanhas antigas continuam valendo nas rotas novas", () => {
	assert.deepEqual(normalizeCampaignPages(["/mobile", "/", "/data"]), ["/", "/noden-data"]);
	const campaign = {
		id: "a", title: "T", description: "", pages: ["/game"], format: "banner" as const, active: true,
		startsAt: null, endsAt: null, priority: 0, frequency: "visit" as const, intervalDays: 1, displayVersion: 1,
		productId: null, href: "/", buttonLabel: "Ver", imageUrl: "", imageAlt: "",
	};
	assert.equal(eligibleCampaigns([campaign], "/noden-game").length, 1);
});

test("promessas: leitura com fallback e validação de limites", () => {
	assert.deepEqual(readDivisionExtras(null, "game"), defaultDivisionExtras.game);
	const custom = readDivisionExtras({ home: { promises: [{ title: "X", text: "Y" }] } }, "home");
	assert.equal(custom.promises.length, 1);
	assert.deepEqual(custom.steps, defaultDivisionExtras.home.steps);
	assert.equal(validateDivisionExtras(defaultDivisionExtras.data), null);
	assert.ok(validateDivisionExtras({ promises: [], steps: [{ title: "a", text: "" }] }));
	assert.ok(validateDivisionExtras({ promises: Array(7).fill({ title: "a", text: "" }), steps: [{ title: "a", text: "" }] }));
});

test("textos da página: obrigatórios, limites e conversão para o banco", () => {
	assert.deepEqual(validatePageTexts(texts()), {});
	const missing = { ...texts(), hero_title: " " };
	assert.ok(validatePageTexts(missing)["page.hero_title"]);
	const long = { ...texts(), seo_title: "x".repeat(91) };
	assert.ok(validatePageTexts(long)["page.seo_title"]);
	const optional = { ...texts(), pricing_disclaimer: "" };
	assert.deepEqual(validatePageTexts(optional), {});
	assert.equal(pageTextsToUpdate(optional).pricing_disclaimer, null);
	assert.ok(validatePageTexts({ ...texts(), hero_highlights: Array(7).fill("a") })["page.hero_highlights"]);
});

test("documento sem campos novos continua válido (rascunhos antigos)", () => {
	assert.deepEqual(validateEditorExtras({ items: [] }), {});
	assert.ok(validateEditorExtras({ page: { hero_title: 1 } })["page.hero_title"]);
});

test("conteúdo da inicial: aceita padrão e recusa vazio ou longo", () => {
	assert.ok(validateHomeContent(defaultHomeContent));
	assert.equal(validateHomeContent({ ...defaultHomeContent, title: "" }), null);
	assert.equal(validateHomeContent({ ...defaultHomeContent, title: "x".repeat(200) }), null);
	assert.equal(validateHomeContent({ ...defaultHomeContent, homeHighlights: Array(7).fill("a").join("\n") }), null);
});

test("textos de marketing respeitam os limites do editor", async () => {
	const { marketingCopy } = await import("../../data/marketingCopy");
	for (const [division, copy] of Object.entries(marketingCopy)) {
		assert.deepEqual(validatePageTexts(copy), {}, division);
	}
});
