import type {
	ServiceDivision,
} from "../../types/services";

export const serviceDivisions = [
	"home",
	"game",
	"data",
] as const satisfies readonly ServiceDivision[];

export const divisionLabels:
	Record<ServiceDivision, string> = {
	home: "Noden Home",
	game: "Noden Game",
	data: "Noden Data",
};

export function isServiceDivision(
	value: string | undefined,
): value is ServiceDivision {
	return serviceDivisions.includes(
		value as ServiceDivision,
	);
}