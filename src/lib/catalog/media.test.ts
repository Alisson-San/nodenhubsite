import {test} from 'node:test';import assert from 'node:assert/strict';import {videoEmbedUrl,validateImageUpload,productAction,isPlayableVideo,productUpdatedDate} from './media';
test('video providers reject disguised hosts and active URLs',()=>{assert.equal(videoEmbedUrl('https://youtube.com.evil.test/watch?v=abcdefghijk'),null);assert.equal(videoEmbedUrl('javascript:alert(1)'),null);assert.equal(videoEmbedUrl('https://youtu.be/abcdefghijk'),'https://www.youtube-nocookie.com/embed/abcdefghijk');assert.equal(videoEmbedUrl('https://vimeo.com/123456'),'https://player.vimeo.com/video/123456');});
test('upload checks actual signature, MIME and size',()=>{assert.equal(validateImageUpload(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png'),null);assert.ok(validateImageUpload(new Uint8Array([60,115,118,103]),'image/png'));assert.ok(validateImageUpload(new Uint8Array(8*1024*1024+1),'image/png'));});
test('sold disables every destination; microsoft requires exact official host',()=>{assert.equal(productAction({status:'sold',ctaKind:'microsoft',microsoftUrl:'https://appsource.microsoft.com/product/test'} as any,'https://wa.me/1'),null);assert.equal(productAction({status:'available',ctaKind:'microsoft',microsoftUrl:'https://appsource.microsoft.com.evil.test'} as any,'https://wa.me/1'),null);assert.equal(productAction({status:'available',ctaKind:'microsoft',microsoftUrl:'https://appsource.microsoft.com/product/test'} as any,'https://wa.me/1')?.label,'Ver no catálogo Microsoft');});
test('custom labels are respected except Microsoft destination',()=>{
 const detail={status:'available',ctaKind:'contact'} as any;
 assert.equal(productAction(detail,'https://wa.me/1','Consultar equipamento')?.label,'Consultar equipamento');
 assert.equal(productAction({...detail,ctaKind:'external',externalUrl:'https://example.com'},'https://wa.me/1','Conhecer o produto')?.label,'Conhecer o produto');
 assert.equal(productAction({...detail,ctaKind:'microsoft',microsoftUrl:'https://marketplace.microsoft.com/product/test'},'https://wa.me/1','Baixar grátis')?.label,'Ver no catálogo Microsoft');
});
test('video validation requires playable URL and matching provider',()=>{
 assert.equal(isPlayableVideo('https://youtube.com/playlist?list=123','youtube'),false);
 assert.equal(isPlayableVideo('https://vimeo.com/123456','youtube'),false);
 assert.equal(isPlayableVideo('https://www.youtube.com/watch?v=abcdefghijk','youtube'),true);
 assert.equal(isPlayableVideo('https://vimeo.com/123456','vimeo'),true);
});

test('update dates use readable Brazilian date and omit invalid values',()=>{assert.equal(productUpdatedDate('2026-09-24T12:00:00Z'),'24/09/2026');assert.equal(productUpdatedDate('bad'),'');});
