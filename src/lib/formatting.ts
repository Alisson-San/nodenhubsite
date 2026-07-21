export function formatCurrency(
	value: number,
	locale = "pt-BR",
	currency = "BRL",
) {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(value);
}

export function formatPhoneDisplay(phone: string) {
	const digits = phone.replace(/\D/g, "");

	if (digits.length !== 11) {
		return phone;
	}

	return `(${digits.slice(0, 2)}) ${digits.slice(
		2,
		7,
	)}-${digits.slice(7)}`;
}
