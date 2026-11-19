const {chromium} = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
const screenshots = path.resolve(__dirname, '../output/playwright');
fs.mkdirSync(screenshots, {recursive: true});
const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.pdf':'application/pdf'};
async function checkArchive(page,width,data) {
 const all=page.locator('[data-filter="all"]'),more=page.locator('#archive-load-more');
 const visible=page.locator('#project-grid > div:visible');
 const titles=()=>visible.locator('h3').allTextContents();
 const expected=data.map(project=>project.title);
 await all.focus();await page.keyboard.press('Enter');
 assert.deepEqual(await titles(),expected.slice(0,6),`initial order ${width}`);
 assert.equal(await page.locator('#archive-status').textContent(),'Showing 6 of 53 projects in the archive');
 assert.equal(await more.textContent(),'Show 6 more projects');
 assert.equal(await page.locator('#project-grid > [hidden] a:visible').count(),0);
 const hiddenFocus=await page.locator('#project-grid > [hidden] a').first().evaluate(link=>{link.focus();return document.activeElement===link;});
 assert.equal(hiddenFocus,false,'hidden projects cannot receive focus');
 const ids=await page.locator('#project-grid article').evaluateAll(cards=>cards.map(card=>card.dataset.projectId));
 assert.equal(new Set(ids).size,data.length);
 async function reveal(previous,matching) {
  const nextBatch=Math.min(6,matching.length-previous);
  assert.equal(await more.textContent(),`Show ${nextBatch} more ${nextBatch===1?'project':'projects'}`);
  await more.focus();await page.keyboard.press(previous===6?'Enter':'Space');
  const count=Math.min(previous+6,matching.length);
  assert.deepEqual(await titles(),matching.slice(0,count));
  const focused=await page.evaluate(()=>{
   const card=document.activeElement,r=card.getBoundingClientRect(),header=document.querySelector('.header_area').getBoundingClientRect(),css=getComputedStyle(card);
   return {tag:card.tagName,title:card.querySelector('h3')?.textContent,tabindex:card.tabIndex,top:r.top,bottom:r.bottom,header:header.bottom,outline:css.outlineWidth,style:css.outlineStyle};
  });
  assert.equal(focused.tag,'ARTICLE');assert.equal(focused.title,matching[previous]);assert.equal(focused.tabindex,-1);
  assert.ok(focused.top>=focused.header-1 && focused.top<await page.evaluate(()=>innerHeight),`revealed focus unobscured at ${width}: ${JSON.stringify(focused)}`);
  assert.equal(focused.outline,'3px');assert.equal(focused.style,'solid');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement===document.activeElement.closest('article')?.querySelector('a')),true,'Tab reaches first newly revealed project link');
 }
 for(let count=6;count<data.length;count+=6)await reveal(count,expected);
 assert.equal(await more.isVisible(),false);assert.deepEqual(await titles(),expected);
 assert.equal(await page.locator('#archive-status').textContent(),'Showing 53 of 53 projects in the archive');
 assert.deepEqual(await page.locator('#project-grid article').evaluateAll(cards=>cards.map(card=>card.dataset.projectId)),ids);
 const geometry=await page.locator('#project-grid article').evaluateAll(cards=>cards.flatMap(card=>{
  const bounds=card.getBoundingClientRect(),body=card.querySelector('.project-body'),p=body.querySelector(':scope > p'),heading=body.querySelector('h3'),buttons=body.querySelector('.btn-group');
  // The restored standard card deliberately clamps descriptions to three lines.
  const overflowsHorizontally=node=>{
   if(node.scrollWidth<=node.clientWidth+1)return false;
   if(node!==p)return true;
   // Chromium may include the clamp ellipsis in scrollWidth; check actual text bounds.
   const range=document.createRange(),r=node.getBoundingClientRect();range.selectNodeContents(node);
   return Array.from(range.getClientRects()).some(line=>line.left<r.left-1 || line.right>r.right+1);
  };
  const nodes=[heading,p,...buttons.querySelectorAll('a,p')],bad=nodes.filter(node=>{const r=node.getBoundingClientRect();return overflowsHorizontally(node) || (node!==p && node.scrollHeight>node.clientHeight+1) || r.left<bounds.left-1 || r.right>bounds.right+1 || r.bottom>bounds.bottom+1;}).map(node=>node.textContent);
  const cardStyle=getComputedStyle(card),bodyStyle=getComputedStyle(body),description=getComputedStyle(p),header=getComputedStyle(card.querySelector('.project-header'));
  if(cardStyle.height!=='482px' || cardStyle.textAlign!=='center' || header.height!=='200px' || bodyStyle.height!=='280px' || bodyStyle.padding!=='20px' || bodyStyle.display!=='grid')bad.push('standard dimensions '+heading.textContent);
  const exception=['golf-game','dolphin-game','kinect-bubble-game'].includes(card.dataset.projectId);
  if(!exception && bodyStyle.gridTemplateRows!=='72px 63px 81px')bad.push('standard rows '+heading.textContent);
  if(exception){const rows=bodyStyle.gridTemplateRows.split(' ').map(parseFloat);if(rows.length!==3 || Math.abs(rows[0]-heading.getBoundingClientRect().height)>1 || Math.abs(rows[2]-buttons.getBoundingClientRect().height)>1 || Math.abs(rows.reduce((a,b)=>a+b,0)-216)>1)bad.push('baseline auto rows '+heading.textContent);}
  if(p.getBoundingClientRect().top<heading.getBoundingClientRect().bottom || buttons.getBoundingClientRect().top<p.getBoundingClientRect().bottom || description.webkitLineClamp!=='3' || description.height!=='63px' || description.lineHeight!=='21px' || description.fontSize!=='14px' || description.overflow!=='hidden')bad.push('standard clamp/layout '+heading.textContent);
  for(const a of buttons.querySelectorAll('a'))if(getComputedStyle(a).minHeight!=='36px' || getComputedStyle(a.querySelector('p')).whiteSpace!=='nowrap')bad.push('standard link '+a.textContent);
  if(buttons.children.length===1 && getComputedStyle(buttons.firstElementChild).justifySelf!=='center')bad.push('single-link centering '+heading.textContent);
  return bad;
 }));assert.deepEqual(geometry,[],`standard archive card geometry ${width}`);
 assert.deepEqual(await page.locator('#project-grid .project-body > p').allTextContents(),data.map(project=>project.description||''));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const filter of await page.locator('#project-archive .category-button').all()){
  const category=await filter.getAttribute('data-filter'),name=(await filter.textContent()).trim(),matching=data.filter(project=>category==='all'||project.categories.includes(category)).map(project=>project.title);
  await filter.focus();await page.keyboard.press('Space');
  assert.equal(await filter.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#project-archive [aria-pressed="true"]').count(),1);
  assert.deepEqual(await titles(),matching.slice(0,6));
  const location=category==='all'?'the archive':name;
  assert.equal(await page.locator('#archive-status').textContent(),matching.length?`Showing ${Math.min(6,matching.length)} of ${matching.length} ${matching.length===1?'project':'projects'} in ${location}`:`No projects found in ${location}`);
  assert.equal(await more.isVisible(),matching.length>6);
  if(category!=='all')for(let count=6;count<matching.length;count+=6)await reveal(count,matching);
 }
 await all.click();assert.equal(await visible.count(),6);
 // Preserve the full-record image check later in the suite.
 while(await more.isVisible())await more.click();
 console.log(`PASS archive batches, filters, keyboard focus and standard cards at ${width}px`);
}

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
  assert.equal(await page.locator('.hero-motion-toggle').count(),0);
  await page.waitForFunction(()=>!document.querySelector('#home video').paused);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#home video').paused);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#home video').evaluate(video=>video.paused),true);
  await page.waitForSelector('#project-grid article');
  assert.equal(await page.locator('footer #portfolio-visit-count').textContent(),'1,023');
  assert.equal(await page.locator('#home .portfolio-visits').count(),0);
  assert.equal(await page.locator('#project-grid article').count(),53);
  assert.equal(await page.locator('#project-grid > div:visible').count(),6,'initial archive batch');
  assert.equal(await page.locator('#featured-projects article').count(),3);
  const archiveData=JSON.parse(fs.readFileSync(path.join(root,'projects.json'),'utf8'));
  const skillTitles = [
   'Spatial Computing & XR', 'AI, Computer Vision & Automation', 'Architecture & Engineering',
   'Technical Leadership & Product Management', 'Multiplayer & Real-Time', 'Platforms & Monetization'
  ];
  assert.deepEqual(await page.locator('.skill-topic h3').allTextContents(),skillTitles);
  assert.deepEqual(await page.locator('.skill-topic').evaluateAll(cards=>cards.map(card=>card.querySelectorAll('.skill-names li').length)),[9,9,9,9,9,8]);
  for (const width of [1440,768,390,320]) {
   await page.setViewportSize({width,height:width<768?844:1000});
   await page.evaluate(()=>window.scrollTo(0,0));
   const layout=await page.evaluate(()=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
    const cards=Array.from(document.querySelectorAll('.skill-topic'));
    const clipped=Array.from(document.querySelectorAll('.hero-roles,.hero-specialty,.skill-topic,.skill-topic h3,.skill-description,.skill-details summary,.profile-about p'))
     .filter(node=>node.scrollWidth>node.clientWidth+1 || node.scrollHeight>node.clientHeight+1)
     .map(node=>node.textContent.trim());
    const outside=cards.flatMap(card=>Array.from(card.querySelectorAll('h3,.skill-description,summary')).filter(node=>{
     const child=rect(node),parent=rect(card);
     return child.left<parent.left-1 || child.right>parent.right+1 || child.bottom>parent.bottom+1;
    }).map(node=>node.textContent.trim()));
    const about=Array.from(document.querySelectorAll('.profile-about p')).map(node=>({
     ...rect(node),fontSize:parseFloat(getComputedStyle(node).fontSize),marginBottom:parseFloat(getComputedStyle(node).marginBottom)
    }));
    return {cards:cards.map(rect),about,closed:cards.every(card=>!card.querySelector('details').open),
     clipped,outside,overflow:document.documentElement.scrollWidth>innerWidth,
     name:rect(document.querySelector('.slider-heading')),roles:rect(document.querySelector('.hero-roles')),
     specialty:rect(document.querySelector('.hero-specialty')),header:rect(document.querySelector('.header_area')),
     actions:rect(document.querySelector('.hero-actions')),hero:rect(document.querySelector('#home'))};
   });
   assert.deepEqual(layout.clipped,[],`clipped content at ${width}px`);
   assert.deepEqual(layout.outside,[],`content outside cards at ${width}px`);
   assert.equal(layout.overflow,false,`horizontal overflow at ${width}px`);
   assert.equal(layout.closed,true,`native disclosures initially closed at ${width}px`);
   assert.equal(layout.about.length,3);
   layout.about.forEach((paragraph,index)=>{
    assert.ok(paragraph.fontSize>=16 && paragraph.marginBottom>=16,`readable About me text at ${width}px`);
    if (width===1440) assert.ok(paragraph.width<1000,'constrained About me line length');
    if (index) assert.ok(paragraph.top>=layout.about[index-1].bottom+16,'About me paragraph spacing');
   });
   assert.ok(layout.name.top>=layout.header.bottom && layout.name.bottom<=layout.roles.top && layout.roles.bottom<=layout.specialty.top &&
    layout.specialty.bottom<=layout.actions.top && layout.actions.left>=layout.hero.left && layout.actions.right<=layout.hero.right &&
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
   for (const summary of await page.locator('.skill-details summary').all()) {
    await summary.focus();
    await page.keyboard.press('Enter');
    assert.equal(await summary.evaluate(node=>node.parentElement.open),true);
    const list=await summary.evaluate(node=>{
     const card=node.closest('.skill-topic'), bounds=card.getBoundingClientRect(), focus=node.getBoundingClientRect();
     const style=getComputedStyle(node), expansion=parseFloat(style.outlineWidth)+Math.max(0,parseFloat(style.outlineOffset));
     return {marker:style.display,focus:style.outlineStyle==='solid' && focus.left-expansion>=bounds.left && focus.right+expansion<=bounds.right && focus.top-expansion>=bounds.top && focus.bottom+expansion<=bounds.bottom,
      invalid:Array.from(card.querySelectorAll('li')).filter(li=>{
       const r=li.getBoundingClientRect(),css=getComputedStyle(li);
       return !r.height || parseFloat(css.fontSize)<14 || css.listStyleType!=='disc' || li.scrollWidth>li.clientWidth+1 || li.scrollHeight>li.clientHeight+1 || r.left<bounds.left || r.right>bounds.right+1 || r.bottom>bounds.bottom+1;
      }).map(li=>li.textContent)};
    });
    assert.equal(list.marker,'list-item');assert.equal(list.focus,true,`summary focus containment at ${width}px`);
    assert.deepEqual(list.invalid,[],`expanded list geometry at ${width}px`);
    await page.keyboard.press('Space');
    assert.equal(await summary.evaluate(node=>node.parentElement.open),false);
   }
   const tools=await page.locator('.technology-icons li').evaluateAll(items=>items.map(item=>{
    const r=item.getBoundingClientRect(),label=item.querySelector('span'),lr=label.getBoundingClientRect(),css=getComputedStyle(label);
    return {text:label.textContent,visible:r.height>0,font:parseFloat(css.fontSize),fits:label.scrollWidth<=label.clientWidth+1 && label.scrollHeight<=label.clientHeight+1 && lr.left>=r.left && lr.right<=r.right && lr.bottom<=r.bottom};
   }));
   assert.equal(tools.length,31);assert.ok(tools.every(tool=>tool.visible && tool.font>=14 && tool.fits),`readable visible tools at ${width}px: ${JSON.stringify(tools.filter(tool=>!tool.fits))}`);
   const panel=await page.locator('.technology-bar').evaluate(panel=>{
    const css=getComputedStyle(panel),groups=[...panel.querySelectorAll('.technology-group')];
    const fits=(node,parent)=>{const r=node.getBoundingClientRect(),p=parent.getBoundingClientRect();return r.left>=p.left && r.right<=p.right+1 && r.top>=p.top && r.bottom<=p.bottom+1 && node.scrollWidth<=node.clientWidth+1 && node.scrollHeight<=node.clientHeight+1;};
    const accents={'.fa-filter':'rgb(75, 143, 180)','.fa-plug':'rgb(51, 127, 141)','.fa-database':'rgb(55, 100, 130)','.fa-arrows-rotate':'rgb(82, 103, 119)','.fa-app-store-ios':'rgb(25, 127, 188)','.fa-google-play':'rgb(36, 167, 120)'};
    return {count:groups.length,columns:getComputedStyle(panel.querySelector('.technology-groups')).gridTemplateColumns.split(' ').length,padding:css.padding,title:getComputedStyle(panel.querySelector('h3')).fontSize,subtitle:getComputedStyle(panel.querySelector('.technology-subtitle')).fontSize,
     groups:groups.every(group=>getComputedStyle(group).backgroundColor==='rgb(255, 255, 255)' && fits(group,panel) && fits(group.querySelector('h4'),group)),
     chips:groups.every(group=>{
      const items=[...group.querySelectorAll('li')];
      return getComputedStyle(group.querySelector('ul')).display==='flex' && items.every((item,i)=>{const c=getComputedStyle(item),r=item.getBoundingClientRect();return fits(item,group) && c.backgroundColor==='rgb(238, 243, 247)' && c.color==='rgb(18, 51, 71)' && c.borderRadius==='999px' && r.height>=32 && items.slice(i+1).every(other=>{const o=other.getBoundingClientRect();return r.right<=o.left+1 || o.right<=r.left+1 || r.bottom<=o.top+1 || o.bottom<=r.top+1;});});
     }),
     icons:[...panel.querySelectorAll('.technology-icons img,.technology-icons i')].every(icon=>{const c=getComputedStyle(icon);return c.width==='18px' && c.height==='18px' && c.filter==='none';}),
     accents:Object.entries(accents).every(([selector,color])=>getComputedStyle(panel.querySelector(selector)).color===color)};
   });
   assert.equal(panel.count,4);assert.equal(panel.columns,width>=768?2:1);assert.equal(panel.padding,width>=768?'24px':'16px');
   assert.equal(panel.title,'24px');assert.equal(panel.subtitle,'16px');
   assert.ok(panel.groups && panel.chips && panel.icons && panel.accents,`reference tools layout at ${width}px: ${JSON.stringify(panel)}`);
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.screenshot({path:path.join(screenshots,`homepage-hero-${width}.png`)});
   await page.locator('.header_area').evaluate(header=>header.hidden=true);
   await page.locator('.skills-directory').screenshot({path:path.join(screenshots,`homepage-skills-${width}.png`)});
   await page.locator('.profile-about').screenshot({path:path.join(screenshots,`homepage-about-${width}.png`)});
   await page.locator('.header_area').evaluate(header=>header.hidden=false);
   await checkArchive(page,width,archiveData);
  }
  await page.setViewportSize({width:1440,height:1000});
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
  for (const scenario of ['empty','failure']) {
   const isolated=await browser.newPage();
   await isolated.route('**/projects.json',route=>route.fulfill({status:scenario==='empty'?200:503,contentType:'application/json',body:scenario==='empty'?'[]':'{}'}));
   await isolated.goto(base,{waitUntil:'networkidle'});
   assert.equal(await isolated.locator('#archive-status').textContent(),scenario==='empty'?'No projects found in the archive':'The project archive could not be loaded.');
   assert.equal(await isolated.locator('#archive-load-more').isVisible(),false);
   assert.equal(await isolated.locator('#project-grid article').count(),0);
   if(scenario==='empty'){
    await isolated.locator('[data-filter="category1"]').click();
    assert.equal(await isolated.locator('#archive-status').textContent(),'No projects found in Games');
   }
   await isolated.close();
  }
  const unavailable=await browser.newPage();
  await unavailable.route('https://syedhuzaifaali.goatcounter.com/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await unavailable.goto(base,{waitUntil:'networkidle'});
  assert.equal(await unavailable.locator('footer #portfolio-visit-count').textContent(),'1,000');
  assert.equal(await unavailable.locator('footer .portfolio-visits').getAttribute('title'),'Historical baseline. Tracked visits are temporarily unavailable.');
  await unavailable.close();
  const reduced=await browser.newPage({reducedMotion:'reduce'});
  await reduced.route('https://syedhuzaifaali.goatcounter.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{"count":"23"}'}));
  await reduced.goto(base,{waitUntil:'networkidle'});
  assert.equal(await reduced.locator('#home video').evaluate(video=>video.paused),true);
  await reduced.close();
  const rejected=await browser.newPage();
  const rejectedErrors=[];
  rejected.on('pageerror',error=>rejectedErrors.push(error.message));
  await rejected.route('https://syedhuzaifaali.goatcounter.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{"count":"23"}'}));
  await rejected.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Playback unavailable','NotAllowedError'));};});
  await rejected.goto(base,{waitUntil:'networkidle'});
  assert.equal(await rejected.locator('#home video').evaluate(video=>video.paused),true);
  assert.deepEqual(rejectedErrors,[],'rejected background playback is handled');
  await rejected.close();
  const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await noJS.goto(base,{waitUntil:'networkidle'});
  const nativeSummary=noJS.locator('.skill-details summary').first();
  assert.equal(await nativeSummary.evaluate(node=>node.parentElement.open),false);
  await nativeSummary.focus();await noJS.keyboard.press('Enter');
  assert.equal(await nativeSummary.evaluate(node=>node.parentElement.open),true);
  assert.equal(await noJS.locator('.skill-details').first().locator('li:visible').count(),9);
  await noJS.keyboard.press('Space');assert.equal(await nativeSummary.evaluate(node=>node.parentElement.open),false);
  await noJS.close();
  console.log('PASS: hero and six skills cards at 1440/768/390/320px, native closed/open disclosures, Enter/Space/no-JS, 31 readable tools, reading order, tag counts, no clipping/overlap; 53 project cards, filtering, literal hostile text, URL blocking, mobile navigation, 3 briefs, private URL 404s, no JS/CSP errors.');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
