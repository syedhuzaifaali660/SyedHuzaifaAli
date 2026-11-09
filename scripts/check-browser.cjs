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
  const skillTitles = [
   'Spatial Computing & XR', 'AI, Computer Vision & Automation', 'Architecture & Engineering',
   'Technical Leadership & Product Management', 'Multiplayer & Real-Time', 'Platforms & Monetization'
  ];
  assert.deepEqual(await page.locator('.skill-topic h3').allTextContents(),skillTitles);
  assert.deepEqual(await page.locator('.skill-topic').evaluateAll(cards=>cards.map(card=>card.querySelectorAll('.skill-names li').length)),[9,9,9,9,9,8]);
  for (const width of [1440,768,390,320]) {
   await page.setViewportSize({width,height:1000});
   await page.evaluate(()=>window.scrollTo(0,0));
   const layout=await page.evaluate(()=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
    const cards=Array.from(document.querySelectorAll('.skill-topic'));
    const clipped=Array.from(document.querySelectorAll('.hero-roles,.hero-specialty,.skill-topic,.skill-topic h3,.skill-names li,.profile-about p'))
     .filter(node=>node.scrollWidth>node.clientWidth+1 || node.scrollHeight>node.clientHeight+1)
     .map(node=>node.textContent.trim());
    const outside=cards.flatMap(card=>Array.from(card.querySelectorAll('h3,li')).filter(node=>{
     const child=rect(node),parent=rect(card);
     return child.left<parent.left-1 || child.right>parent.right+1 || child.bottom>parent.bottom+1;
    }).map(node=>node.textContent.trim()));
    const about=Array.from(document.querySelectorAll('.profile-about p')).map(node=>({
     ...rect(node),fontSize:parseFloat(getComputedStyle(node).fontSize),marginBottom:parseFloat(getComputedStyle(node).marginBottom)
    }));
    return {cards:cards.map(rect),about,tagFontSizes:cards.map(card=>parseFloat(getComputedStyle(card.querySelector('li')).fontSize)),
     clipped,outside,overflow:document.documentElement.scrollWidth>innerWidth,
     name:rect(document.querySelector('.slider-heading')),roles:rect(document.querySelector('.hero-roles')),
     specialty:rect(document.querySelector('.hero-specialty')),visits:rect(document.querySelector('.portfolio-visits')),
     actions:rect(document.querySelector('.hero-actions')),hero:rect(document.querySelector('#home'))};
   });
   assert.deepEqual(layout.clipped,[],`clipped content at ${width}px`);
   assert.deepEqual(layout.outside,[],`content outside cards at ${width}px`);
   assert.equal(layout.overflow,false,`horizontal overflow at ${width}px`);
   assert.ok(layout.tagFontSizes.every(size=>size>=14),`readable tags at ${width}px`);
   assert.equal(layout.about.length,3);
   layout.about.forEach((paragraph,index)=>{
    assert.ok(paragraph.fontSize>=16 && paragraph.marginBottom>=16,`readable About me text at ${width}px`);
    if (width===1440) assert.ok(paragraph.width<1000,'constrained About me line length');
    if (index) assert.ok(paragraph.top>=layout.about[index-1].bottom+16,'About me paragraph spacing');
   });
   assert.ok(layout.name.bottom<=layout.roles.top && layout.roles.bottom<=layout.specialty.top &&
    layout.specialty.bottom<=layout.visits.top && layout.visits.bottom<=layout.actions.top &&
    layout.actions.bottom<=layout.hero.bottom,`hero overlap at ${width}px`);
   layout.cards.forEach((card,index)=>{
    if (width>=768) {
     if (index%2) {
      assert.equal(card.top,layout.cards[index-1].top);
      assert.ok(card.left>=layout.cards[index-1].right);
     } else if (index>=2) assert.ok(card.top>=layout.cards[index-2].bottom);
    } else if (index) {
     assert.equal(card.left,layout.cards[index-1].left);
     assert.ok(card.top>=layout.cards[index-1].bottom);
    }
   });
   await page.screenshot({path:path.join(screenshots,`homepage-hero-${width}.png`)});
   await page.locator('.header_area').evaluate(header=>header.hidden=true);
   await page.locator('.skills-directory').screenshot({path:path.join(screenshots,`homepage-skills-${width}.png`)});
   await page.locator('.profile-about').screenshot({path:path.join(screenshots,`homepage-about-${width}.png`)});
   await page.locator('.header_area').evaluate(header=>header.hidden=false);
  }
  await page.setViewportSize({width:1440,height:1000});
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
  console.log('PASS: hero and six skills cards at 1440/768/390/320px, reading order, tag counts, no clipping/overlap; 53 project cards, filtering, literal hostile text, URL blocking, mobile navigation, 3 briefs, private URL 404s, no JS/CSP errors.');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
