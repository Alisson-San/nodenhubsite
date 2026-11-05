import assert from "node:assert/strict";
import test from "node:test";
import { validateCatalogDocument,validateProductDetail } from "./editorValidation";
import type { CatalogDocument, ProductDetail } from "./editorTypes";
const id="22222222-2222-4222-8222-222222222222";
const detail=():ProductDetail=>({slug:"visual-power-bi",summary:"Visual",body:"Ajuda",media:[],features:[],steps:[],faq:[],version:"1",updatedAt:"",status:"available",modality:"digital",ctaKind:"microsoft",microsoftUrl:"https://appsource.microsoft.com/product/test",externalUrl:""});
const document=():CatalogDocument=>({schemaVersion:1,division:"data",items:[{id,service_page_id:"11111111-1111-4111-8111-111111111111",name:"Visual",description:"Descrição",price_type:"free",price:null,compare_at_price:null,price_prefix:null,price_label:null,price_suffix:null,features:[],badge:null,note:null,is_featured:false,is_active:true,sort_order:0,cta_label:null,cta_message:null,category_id:null,tier_id:null,item_kind:"product",badge_ids:[],created_at:"",updated_at:"",updated_by:null}],serviceCards:[],details:{[id]:detail()}});
test("free and consultation omit price; fixed zero remains valid",()=>{
 const d=document();assert.deepEqual(validateCatalogDocument(d),{});
 d.items[0].price_type="fixed";d.items[0].price=0;assert.deepEqual(validateCatalogDocument(d),{});
 d.items[0].price_type="consultation";assert.ok(validateCatalogDocument(d)["items.0.price"]);
 d.items[0].price=null;assert.deepEqual(validateCatalogDocument(d),{});
});
test("invalid rows, unknown detail IDs and duplicate slugs are rejected",()=>{
 const d=document();d.items.push({...d.items[0]});assert.ok(validateCatalogDocument(d)["items.1.id"]);
 d.details["other"]=detail();assert.ok(validateCatalogDocument(d)["details.other"]);
});
test("unsafe and misleading Microsoft destinations are rejected",()=>{
 for(const url of ["javascript:alert(1)","https://appsource.microsoft.com.evil.test/x","https://user@appsource.microsoft.com/x","http://appsource.microsoft.com/x"]) {
  const d=detail();d.microsoftUrl=url;assert.ok(validateProductDetail(d)["detail.microsoftUrl"]);
 }
});
test("video must be playable by selected provider and media is limited to twelve",()=>{
 const d=detail();d.media=[{id:"v",type:"youtube",url:"https://youtube.com/channel/foo",alt:""}];assert.ok(validateProductDetail(d)["detail.media.0.url"]);
 d.media[0].url="https://youtu.be/dQw4w9WgXcQ";assert.deepEqual(validateProductDetail(d),{});
 d.media[0].type="vimeo";assert.ok(validateProductDetail(d)["detail.media.0.url"]);
 d.media=Array.from({length:13},(_,i)=>({id:String(i),type:"image",url:"https://example.com/cover.png",alt:"Capa"}));assert.ok(validateProductDetail(d)["detail.media"]);
});
test("private staged image references are allowed while unsupported schemes and empty alt are rejected",()=>{
 const d=detail();d.media=[{id:"image",type:"image",url:"storage://catalog-media/22222222-2222-4222-8222-222222222222.png",alt:"Visual de vendas"}];assert.deepEqual(validateProductDetail(d),{});
 d.media[0].alt="";assert.ok(validateProductDetail(d)["detail.media.0.alt"]);
 d.media[0].url="data:image/svg+xml,test";assert.ok(validateProductDetail(d)["detail.media.0.url"]);
});
