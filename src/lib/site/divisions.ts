import type { ServiceDivision } from "../../types/services";

export interface DivisionMeta {
	id: ServiceDivision;
	/** Rota pública atual. */
	path: string;
	/** Rota antiga, mantida apenas como redirecionamento permanente. */
	legacyPath: string;
	name: string;
	/** Para quem é, em uma palavra. */
	audience: string;
	/** Frase curta usada em menus e cartões. */
	pitch: string;
}

export const divisions: Record<ServiceDivision, DivisionMeta> = {
	home: {
		id: "home",
		path: "/noden-home",
		legacyPath: "/home",
		name: "Noden Home",
		audience: "Casa e dia a dia",
		pitch: "Tecnologia do dia a dia, para sua casa e para você: computador, notebook, internet e Wi-Fi.",
	},
	game: {
		id: "game",
		path: "/noden-game",
		legacyPath: "/game",
		name: "Noden Game",
		audience: "Para seu setup",
		pitch: "PC gamer montado, limpo e ajustado para rodar liso.",
	},
	data: {
		id: "data",
		path: "/noden-data",
		legacyPath: "/data",
		name: "Noden Data",
		audience: "Para sua empresa",
		pitch: "Dados, sistemas, sites e plataformas sob medida para o seu negócio.",
	},
};

export const divisionOrder: ServiceDivision[] = ["home", "game", "data"];

export function divisionPath(division: ServiceDivision, hash = ""): string {
	return divisions[division].path + hash;
}

/** Converte um caminho antigo (/home, /game, /data) para o atual. */
export function modernizePath(path: string): string {
	for (const meta of Object.values(divisions)) {
		if (path === meta.legacyPath || path.startsWith(meta.legacyPath + "#")) {
			return meta.path + path.slice(meta.legacyPath.length);
		}
	}
	return path;
}
