import type { Tables } from "../../types/database.types";
import type { ServiceDivision } from "../../types/services";
import type { DivisionExtras } from "../site/divisionContent";

export interface ProductMedia {
 id:string; type:"image"|"youtube"|"vimeo"; url:string; alt:string;
 caption?:string; width?:number; height?:number; poster?:string; storagePath?:string;
}
export interface ProductDetail {
 slug:string; summary:string; body:string; media:ProductMedia[]; features:string[];
 steps:{title:string;body:string}[]; faq:{question:string;answer:string}[];
 version:string; updatedAt:string; status:"available"|"reserved"|"sold"|"unavailable";
 modality:"physical"|"digital"|"service"; ctaKind:"contact"|"microsoft"|"external";
 microsoftUrl:string; externalUrl:string;
}
export type CatalogEditorItem = Tables<"pricing_items"> & {badge_ids:string[]};
export type CatalogServiceCard = Tables<"services">;
/** Textos da página editáveis no site; aplicados em service_pages ao publicar. */
export const pageTextKeys = [
 "hero_eyebrow","hero_title","hero_description","hero_primary_label","hero_primary_message","hero_secondary_label",
 "services_title","services_description","pricing_title","pricing_description","pricing_disclaimer",
 "cta_title","cta_description","cta_button_label","cta_message","seo_title","seo_description",
] as const;
export type PageTextKey = typeof pageTextKeys[number];
export type PageTexts = Record<PageTextKey,string> & {hero_highlights:string[]};
export interface CatalogDocument {
 schemaVersion:1; division:ServiceDivision; items:CatalogEditorItem[];
 serviceCards:CatalogServiceCard[]; details:Record<string,ProductDetail>;
 /** Edição no site: textos da página (opcional em rascunhos antigos). */
 page?:PageTexts;
 /** Edição no site: promessas e etapas (opcional em rascunhos antigos). */
 extras?:DivisionExtras;
}
export interface CatalogDraft {
 id:string; division:ServiceDivision; revision:number; baseRevision:number;
 document:CatalogDocument; updatedAt:string;
}
export interface EditorSnapshot {
 ready:boolean; draft:CatalogDraft|null; published:CatalogDocument; sourceRevision:number;
 pageId:string|null; categories:Tables<"catalog_categories">[];
 tiers:Tables<"catalog_tiers">[]; badges:Tables<"catalog_badges">[];
 message?:string;
}
