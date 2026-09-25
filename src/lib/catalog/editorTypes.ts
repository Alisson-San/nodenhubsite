import type { Tables } from "../../types/database.types";
import type { ServiceDivision } from "../../types/services";

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
export interface CatalogDocument {
 schemaVersion:1; division:ServiceDivision; items:CatalogEditorItem[];
 serviceCards:CatalogServiceCard[]; details:Record<string,ProductDetail>;
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
