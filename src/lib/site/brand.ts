import type { ServiceDivision } from "../../types/services";

/**
 * Geometria da logo oficial, medida em public/Design sem nome.png e
 * recortada em public/brand/noden-symbol.webp (984 × 975 px, origem 126,127).
 * Os anéis não são fechados na logo: eles se abrem e viram uma fita
 * contínua. Por isso a logo unida usa a imagem oficial, e os nós vetoriais
 * repetem exatamente estes anéis quando se separam.
 */
export const SYMBOL = { width: 984, height: 975, src: "/brand/noden-symbol.webp" } as const;

export interface Ring {
	cx: number;
	cy: number;
	/** Raio no meio do traço. */
	r: number;
	width: number;
	/** Degradê horizontal (esquerda → direita) medido no anel. */
	stops: [string, string, string];
}

export const RINGS: Record<ServiceDivision, Ring> = {
	home: { cx: 525.1, cy: 257.9, r: 220.5, width: 66, stops: ["#2d2ffc", "#0d7dfc", "#01ccfe"] },
	game: { cx: 255.6, cy: 683.4, r: 224.5, width: 65, stops: ["#b231fb", "#9338fb", "#4546fb"] },
	data: { cx: 723.6, cy: 684.5, r: 223.5, width: 63, stops: ["#3e4afc", "#089efd", "#01d4fe"] },
};

/**
 * Ícones de cada divisão (casinha, controle, banco de dados) no sistema do
 * anel: centro em 0,0, cabem num anel de raio ~220.
 */
export const ICONS: Record<ServiceDivision, { paths: string[]; dots?: [number, number, number][] }> = {
	home: {
		paths: ["M -75 6 L 0 -60 L 75 6", "M -55 -2 V 82 H 55 V -2", "M -18 82 V 34 H 18 V 82"],
	},
	game: {
		paths: [
			"M -68 -54 H 68 C 97 -54 113 -27 106 5 L 98 36 C 92 60 66 67 47 48 L 24 19 H -24 L -47 48 C -66 67 -92 60 -98 36 L -106 5 C -113 -27 -97 -54 -68 -54 Z",
			"M -56 -20 V 16 M -74 -2 H -38",
		],
		dots: [
			[55, -16, 9],
			[74, 10, 9],
		],
	},
	data: {
		paths: [
			"M -64 -62 A 64 24 0 1 0 64 -62 A 64 24 0 1 0 -64 -62 Z",
			"M -64 -62 V -10 C -64 12 -35 30 0 30 C 35 30 64 12 64 -10 V -62",
			"M -64 -10 V 42 C -64 64 -35 82 0 82 C 35 82 64 64 64 42 V -10",
		],
	},
};
