#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path


ROOT = Path.cwd()
INDEX_PATH = ROOT / "src/pages/index.astro"
MOBILE_PATH = ROOT / "src/pages/mobile.astro"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Trecho não encontrado: {label}")
    return text.replace(old, new, 1)


def sub_once(
    text: str,
    pattern: str,
    replacement: str,
    label: str,
    *,
    flags: int = re.MULTILINE | re.DOTALL,
) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(
            f"Esperava alterar 1 trecho em '{label}', mas alterei {count}."
        )
    return updated


def update_desktop_index(text: str) -> str:
    text = replace_once(
        text,
        '''---
import NodenSymbol from "../components/NodenSymbol.astro";
import NodenMarkStatic from "../components/NodenMarkStatic-conectores-visiveis.astro";
---''',
        '''---
export const prerender = false;

import NodenSymbol from "../components/NodenSymbol.astro";
import NodenMarkStatic from "../components/NodenMarkStatic-conectores-visiveis.astro";

import {
	getWhatsAppUrl,
} from "../config/site";

import {
	loadSiteConfig,
} from "../lib/site/siteRepository";

const site = await loadSiteConfig();

const whatsappUrl =
	getWhatsAppUrl(
		undefined,
		site,
	);
---''',
        "frontmatter da index desktop",
    )

    text = replace_once(
        text,
        '''content="Noden Technology Hub — tecnologia, performance e dados conectados."''',
        '''content={site.description}''',
        "descrição da index desktop",
    )

    text = replace_once(
        text,
        '''<title>NODEN — Technology Hub</title>''',
        '''<title>{site.name} — Technology Hub</title>''',
        "título da index desktop",
    )

    text = sub_once(
        text,
        r'''<div class="coverage-cities">\s*<span>Barão</span>\s*<span>Carlos Barbosa</span>\s*<span>Salvador do Sul</span>\s*<span>São Pedro da Serra</span>\s*</div>''',
        '''<div class="coverage-cities">
											{
												site.serviceAreas.map(
													(area) => (
														<span>{area}</span>
													),
												)
											}
										</div>''',
        "cidades da index desktop",
    )

    desktop_links = {
        "home": (
            "Atendimento local · Diagnóstico · Solução prática",
            "/home",
            "Noden Home",
        ),
        "game": (
            "Hardware · Performance · Otimização",
            "/game",
            "Noden Game",
        ),
        "data": (
            "Data Engineering · BI · Analytics · Developer",
            "/data",
            "Noden Data",
        ),
    }

    for division, (meta, href, label) in desktop_links.items():
        pattern = rf'''(<p class="division-meta">\s*{re.escape(meta)}\s*</p>)'''
        replacement = rf'''\1

							<a
								class="division-link"
								href="{href}"
								aria-label="Ver serviços e preços da {label}"
							>
								Ver serviços e preços

								<svg
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										d="M5 12h14M13 6l6 6-6 6"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>'''
        text = sub_once(
            text,
            pattern,
            replacement,
            f"botão desktop da divisão {division}",
        )

    text = replace_once(
        text,
        '''<a href="whatsapp://send?phone=5554996306632&text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20Noden." rel="noopener noreferrer" class="final-contact-link" aria-label="Entre em contato pelo WhatsApp">''',
        '''<a
							href={whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="final-contact-link"
							aria-label="Entre em contato pelo WhatsApp"
						>''',
        "WhatsApp final da index desktop",
    )

    text = replace_once(
        text,
        '''			gsap.set(".division-copy", {
				x: 24,
			});''',
        '''			gsap.set(".division-copy", {
				autoAlpha: 0,
				x: 24,
			});''',
        "estado inicial dos cards desktop",
    )

    for division in ("home", "game", "data"):
        text = replace_once(
            text,
            f'''"#{division}-copy",
					{{
						opacity: 1,''',
            f'''"#{division}-copy",
					{{
						autoAlpha: 1,''',
            f"exibição GSAP de {division}",
        )

        text = replace_once(
            text,
            f'''"#{division}-copy",
					{{
						opacity: 0,''',
            f'''"#{division}-copy",
					{{
						autoAlpha: 0,''',
            f"ocultação GSAP de {division}",
        )

    text = replace_once(
        text,
        '''	.division-copy .division-meta {
		margin: 22px 0 0;
		color: #7487a3;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.26em;
		text-transform: uppercase;
	}
''',
        '''	.division-copy .division-meta {
		margin: 22px 0 0;
		color: #7487a3;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.26em;
		text-transform: uppercase;
	}

	.division-link {
		position: relative;
		z-index: 3;
		display: inline-flex;
		min-height: 44px;
		margin-top: 24px;
		padding: 0 17px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 1px solid rgba(108, 159, 234, 0.32);
		border-radius: 12px;
		background: rgba(30, 88, 177, 0.16);
		color: #f7faff;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.045em;
		text-decoration: none;
		pointer-events: auto;
		touch-action: manipulation;
		transition:
			border-color 180ms ease,
			background-color 180ms ease,
			transform 180ms ease;
	}

	.division-link svg {
		width: 17px;
		height: 17px;
		flex-shrink: 0;
	}

	.division-link:hover {
		border-color: rgba(73, 154, 255, 0.58);
		background: rgba(35, 105, 215, 0.25);
		transform: translateY(-2px);
	}

	.division-link:focus-visible {
		outline: 2px solid rgba(70, 147, 255, 0.78);
		outline-offset: 4px;
	}

	@media (max-width: 520px) {
		.division-link {
			width: 100%;
		}
	}
''',
        "estilos do botão desktop",
    )

    return text


def update_mobile_index(text: str) -> str:
    text = replace_once(
        text,
        '''---
import NodenMarkStatic from "../components/NodenMarkStatic-conectores-visiveis.astro";

const whatsappUrl =
	"whatsapp://send?phone=5554996306632&text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20Noden.";
---''',
        '''---
export const prerender = false;

import NodenMarkStatic from "../components/NodenMarkStatic-conectores-visiveis.astro";

import {
	getWhatsAppUrl,
} from "../config/site";

import {
	loadSiteConfig,
} from "../lib/site/siteRepository";

const site = await loadSiteConfig();

const whatsappUrl =
	getWhatsAppUrl(
		undefined,
		site,
	);
---''',
        "frontmatter da index mobile",
    )

    text = replace_once(
        text,
        '''content="Noden Technology Hub — suporte residencial, setups gamer e soluções em dados."''',
        '''content={site.description}''',
        "descrição da index mobile",
    )

    text = replace_once(
        text,
        '''<title>NODEN — Technology Hub</title>''',
        '''<title>{site.name} — Technology Hub</title>''',
        "título da index mobile",
    )

    text = sub_once(
        text,
        r'''<div class="coverage-list">\s*<span>Barão</span>\s*<span>Carlos Barbosa</span>\s*<span>Salvador do Sul</span>\s*<span>São Pedro da Serra</span>\s*</div>''',
        '''<div class="coverage-list">
						{
							site.serviceAreas.map(
								(area) => (
									<span>{area}</span>
								),
							)
						}
					</div>''',
        "cidades da index mobile",
    )

    mobile_links = [
        (
            "Consultoria para dúvidas e problemas",
            "/home",
            "Noden Home",
        ),
        (
            "Consultoria de peças e compatibilidade",
            "/game",
            "Noden Game",
        ),
        (
            "BI, analytics e apoio à decisão",
            "/data",
            "Noden Data",
        ),
    ]

    for last_item, href, label in mobile_links:
        pattern = rf'''(<li>{re.escape(last_item)}</li>\s*</ul>)'''
        replacement = rf'''\1

							<a
								class="service-page-link"
								href="{href}"
								aria-label="Ver serviços e preços da {label}"
							>
								Ver serviços e preços

								<svg
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										d="M5 12h14M13 6l6 6-6 6"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>'''
        text = sub_once(
            text,
            pattern,
            replacement,
            f"botão mobile da divisão {label}",
        )

    text = replace_once(
        text,
        '''<a class="header-contact" href={whatsappUrl}>''',
        '''<a
				class="header-contact"
				href={whatsappUrl}
				target="_blank"
				rel="noopener noreferrer"
			>''',
        "WhatsApp do header mobile",
    )

    text = replace_once(
        text,
        '''<a class="secondary-action" href={whatsappUrl}>''',
        '''<a
							class="secondary-action"
							href={whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
						>''',
        "WhatsApp secundário mobile",
    )

    text = replace_once(
        text,
        '''<a class="contact-button" href={whatsappUrl}>''',
        '''<a
						class="contact-button"
						href={whatsappUrl}
						target="_blank"
						rel="noopener noreferrer"
					>''',
        "WhatsApp final mobile",
    )

    text = replace_once(
        text,
        '''	.service-copy li::before {
		position: absolute;
		top: 0.5em;
		left: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: linear-gradient(135deg, #ba39ff, #28a3ff);
		content: "";
	}
''',
        '''	.service-copy li::before {
		position: absolute;
		top: 0.5em;
		left: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: linear-gradient(135deg, #ba39ff, #28a3ff);
		content: "";
	}

	.service-page-link {
		position: relative;
		z-index: 2;
		display: flex;
		width: 100%;
		min-height: 46px;
		margin-top: 22px;
		padding: 0 16px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 1px solid rgba(92, 151, 238, 0.3);
		border-radius: 12px;
		background: rgba(31, 91, 181, 0.17);
		color: #f7faff;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.035em;
		text-decoration: none;
		touch-action: manipulation;
		transition:
			border-color 180ms ease,
			background-color 180ms ease,
			transform 180ms ease;
	}

	.service-page-link svg {
		width: 17px;
		height: 17px;
		flex-shrink: 0;
	}

	.service-page-link:active {
		transform: scale(0.985);
	}

	.service-page-link:focus-visible {
		outline: 2px solid rgba(70, 147, 255, 0.78);
		outline-offset: 4px;
	}
''',
        "estilos do botão mobile",
    )

    return text


def main() -> None:
    if not INDEX_PATH.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {INDEX_PATH}")

    if not MOBILE_PATH.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {MOBILE_PATH}")

    desktop = INDEX_PATH.read_text(encoding="utf-8")
    mobile = MOBILE_PATH.read_text(encoding="utf-8")

    INDEX_PATH.write_text(
        update_desktop_index(desktop),
        encoding="utf-8",
    )

    MOBILE_PATH.write_text(
        update_mobile_index(mobile),
        encoding="utf-8",
    )

    print("Index desktop atualizada:", INDEX_PATH)
    print("Index mobile atualizada:", MOBILE_PATH)
    print("Agora execute: npm run validate")


if __name__ == "__main__":
    main()
