const {chromium} = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
const screenshots = path.resolve(__dirname, '../output/playwright');
fs.mkdirSync(screenshots, {recursive: true});
const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.pdf':'application/pdf'};
(async () => {
 const server = http.createServer((req,res) => {
  const name = new URL(req.url,'http://localhost').pathname;
  const file = path.join(root,name === '/' ? 'index.html' : name);
  if (!file.startsWith(root+'/') || !fs.existsSync(file)) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = []; const csp = [];
  page.on('pageerror', e=>errors.push(e.message));
  page.on('console', msg=>{if(msg.type()==='error' && /Content Security Policy/.test(msg.text())) csp.push(msg.text());});
  await page.route('https://syedhuzaifaali.goatcounter.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{"count":"23"}'}));
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForSelector('#project-grid article');
  assert.equal(await page.locator('#project-grid article').count(),53);
  assert.equal(await page.locator('#featured-projects article').count(),3);
  await page.locator('[data-filter="category1"]').click();
  const shown=await page.locator('#project-grid > div:visible').count();
  assert.ok(shown>0 && shown<53);
  await page.locator('[data-filter="all"]').click();
  assert.equal(await page.locator('#project-grid > div:visible').count(),53);
  const injection=await page.evaluate(()=>{
   window.injected=false;
   const payload='<img src=x onerror="window.injected=true">';
   const node=window.portfolioProjects.renderProject({id:'" onclick="window.injected=true',title:payload,description:payload,
     imageUrl:'img/x.jpg" onerror="window.injected=true',altText:payload,imageCredit:payload,
     thumbnailPosition:'50% 50%;background:url(https://evil.example)',categories:['category1','" onclick="window.injected=true'],
     links:[{url:'javascript:window.injected=true',text:payload,icon:payload},{url:'https://example.com/',text:payload,icon:payload}]});
   document.body.appendChild(node);
   const result={images:node.querySelectorAll('img').length,anchors:node.querySelectorAll('a').length,
    events:node.querySelectorAll('[onerror],[onclick]').length,title:node.querySelector('h3').textContent,
    position:node.querySelector('.project-header').style.getPropertyValue('--thumbnail-position'),injected:window.injected};
   node.remove();return result;
  });
  assert.equal(injection.images,0);assert.equal(injection.events,0);assert.equal(injection.anchors,1);
  assert.equal(injection.position,'');assert.equal(injection.injected,false);assert.ok(injection.title.startsWith('<img'));
  assert.equal(await page.evaluate(()=>typeof window.jQuery),'undefined');
  assert.equal(csp.length,0,csp.join('\n'));
  await page.locator('img').evaluateAll(images=>images.forEach(image=>image.loading='eager'));
  await page.waitForFunction(()=>Array.from(document.images).every(image=>image.complete));
  assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(image=>!image.naturalWidth).map(image=>image.src)),[]);
  await page.screenshot({path:path.join(screenshots,'security-desktop.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});
  await page.goto(base,{waitUntil:'networkidle'});
  const toggle=page.locator('.navbar-toggler');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  await page.locator('#nav a[href="#skills"]').click();
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(screenshots,'security-mobile.png')});
  for (const file of ['heat-pump-planar','spirometry-golf-dolphin','pokemon-synthetic-detector']) {
   await page.goto(base+'/briefs/'+file+'.html',{waitUntil:'networkidle'});
   assert.equal(await page.locator('h1').count(),1);
   assert.ok(await page.locator('meta[http-equiv="Content-Security-Policy"]').count());
  }
  for (const file of ['briefs/scenic.md','analytics-setup.md','tests/security.test.js','ProfilePicture/IMG_1802.JPG','img/projects/thumbnails/generation-manifest.json']) {
   const res=await page.request.get(base+'/'+file);assert.equal(res.status(),404,file);
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(csp,[]);
  console.log('PASS: 53 cards, filtering, literal hostile text, URL blocking, mobile navigation, 3 briefs, private URL 404s, no JS/CSP errors.');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
