import { validateDivisionExtras } from "./divisionContent";
import { validatePageTexts } from "./pageTexts";

/** Valida os campos opcionais que a edição no site acrescenta ao documento. */
export function validateEditorExtras(document: unknown): Record<string, string> {
	if (!document || typeof document !== "object") return {};
	const record = document as Record<string, unknown>;
	const errors: Record<string, string> = {};
	if (record.page !== undefined) Object.assign(errors, validatePageTexts(record.page));
	if (record.extras !== undefined) {
		const problem = validateDivisionExtras(record.extras);
		if (problem) errors.extras = problem;
	}
	return errors;
}
