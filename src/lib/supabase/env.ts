export function requireEnvironmentVariable(
	value: string | undefined,
	name: string,
): string {
	if (!value) {
		throw new Error(
			`A variável de ambiente "${name}" não foi configurada.`,
		);
	}

	return value;
}