// @ts-check

import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// Rotas antigas continuam funcionando com redirecionamento permanente.
// O fragmento (#precos etc.) é preservado pelo navegador.

export default defineConfig({
	site: "https://nodenhub.com.br",
	adapter: vercel(),
	// A barra de desenvolvimento cobria a barra de edição do site.
	devToolbar: { enabled: false },
	redirects: {
		"/home": { status: 301, destination: "/noden-home" },
		"/game": { status: 301, destination: "/noden-game" },
		"/data": { status: 301, destination: "/noden-data" },
		"/mobile": { status: 301, destination: "/" },
	},
});
