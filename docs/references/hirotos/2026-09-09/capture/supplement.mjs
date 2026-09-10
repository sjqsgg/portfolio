import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const out=new URL('../evidence',import.meta.url).pathname
const browser=await chromium.launch({channel:'chrome',headless:true})
const props=['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textAlign','color','backgroundColor','backgroundImage','opacity','display','position','zIndex','width','height','maxWidth','minWidth','maxHeight','minHeight','padding','margin','gap','rowGap','columnGap','gridTemplateColumns','gridTemplateRows','alignItems','justifyContent','border','borderTop','borderRadius','boxShadow','filter','backdropFilter','overflow','overflowX','overflowY','objectFit','objectPosition','transform','transformOrigin','transition','animation','cursor','pointerEvents','touchAction','clipPath']
const summary=[]

for(const mode of ['supplement-desktop','wide','tablet']) {
 const viewport=mode==='wide'?{width:1920,height:1080}:mode==='tablet'?{width:768,height:1024}:{width:1512,height:820}
 const context=await browser.newContext({viewport,deviceScaleFactor:1});const page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable')
 async function stable(){await page.waitForFunction(()=>document.documentElement.classList.contains('is-entered')&&(!document.querySelector('.preloader')||getComputedStyle(document.querySelector('.preloader')).display==='none'),{timeout:30000});await page.waitForTimeout(1800)}
 async function snap(name){
  const data=await page.evaluate(props=>{
   const all=[...document.querySelectorAll('body,main,section,nav,h1,h2,h3,p,dt,dd,a,button,label,input,textarea,canvas,img,video,[class]')].filter(el=>!['SCRIPT','STYLE','LINK'].includes(el.tagName))
   const elements=all.map((el,index)=>{
    const c=getComputedStyle(el),r=el.getBoundingClientRect();if(c.display==='none'||r.width===0||r.height===0)return null
    const before=getComputedStyle(el,'::before'),after=getComputedStyle(el,'::after')
    return {index,tag:el.tagName,class:typeof el.className==='string'?el.className:el.getAttribute('class'),text:(el.children.length? [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(''):el.textContent)?.trim().slice(0,500),rect:{x:r.x,y:r.y,width:r.width,height:r.height},visible:c.visibility!=='hidden'&&Number(c.opacity)>0,styles:Object.fromEntries(props.map(p=>[p,c[p]])),attributes:Object.fromEntries([...el.attributes].filter(a=>/^(aria-|data-|href$|src$|alt$|type$|tabindex$|target$|rel$)/.test(a.name)).map(a=>[a.name,a.value])),pseudo:{before:{content:before.content,background:before.backgroundColor,transform:before.transform},after:{content:after.content,background:after.backgroundColor,transform:after.transform}}}
   }).filter(Boolean)
   return {url:location.href,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},title:document.title,bodyText:document.body.innerText,html:document.querySelector('.persistent-experience')?.outerHTML,elements,fonts:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),animations:document.getAnimations().map(a=>({timing:a.effect.getTiming(),keyframes:a.effect.getKeyframes(),playState:a.playState})),pageScroll:{x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},media:{reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,coarse:matchMedia('(pointer:coarse)').matches},links:[...document.querySelectorAll('a')].map(a=>({text:a.innerText,href:a.href})),buttons:[...document.querySelectorAll('button')].map(b=>({text:b.innerText,label:b.getAttribute('aria-label'),class:b.className}))}
  },props)
  const doc=await cdp.send('DOM.getDocument');data.platformFonts={}
  for(const selector of ['h1','h2','.site-nav a','.home-profile p','.about-page__body p','.projects-zoom__content p']) {
   const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector})
   if(nodeId)try{data.platformFonts[selector]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts}catch{}
  }
  await writeFile(`${out}/${name}-${mode}.json`,JSON.stringify(data,null,2))
  await page.screenshot({path:`${out}/${name}-${mode}.png`})
  summary.push({name,mode,url:data.url,links:data.links,buttons:data.buttons,body:data.bodyText,fonts:data.platformFonts})
  console.log('CAPTURE',name,mode,JSON.stringify({url:data.url,buttons:data.buttons,links:data.links}))
 }

 await page.goto('https://www.hirotos.com/',{waitUntil:'domcontentloaded',timeout:60000});
 if(mode==='supplement-desktop')await snap('loading')
 await stable();await snap('home')
 if(mode==='supplement-desktop') {
  await page.mouse.move(755,525);await page.waitForTimeout(500);await snap('sticker-hover');await page.mouse.click(755,525);await page.waitForTimeout(350);await snap('sticker-placed')
  const started=Date.now();await page.locator('.site-nav a[href="/projects"]').click();const frames=[]
  for(const ms of [100,400,800,1200,1700,2300]){await page.waitForTimeout(Math.max(0,ms-(Date.now()-started)));frames.push({targetMs:ms,actualMs:Date.now()-started,html:await page.locator('.page-transition').count()?await page.locator('.page-transition').evaluate(e=>e.outerHTML):null});await page.screenshot({path:`${out}/transition-${String(ms).padStart(4,'0')}.png`})}
  await writeFile(out+'/transition-frames.json',JSON.stringify(frames,null,2));await page.waitForTimeout(1600)
 } else {await page.locator('.site-nav a[href="/projects"]').click();await page.waitForTimeout(4000)}
 await snap('projects')
 const cards=page.locator('.projects-marquee__item');const ci=await cards.evaluateAll(ns=>ns.findIndex(n=>{const r=n.getBoundingClientRect();return r.x>0&&r.right<innerWidth}));await cards.nth(ci).click({force:true});await page.waitForTimeout(1800);await snap('project-detail')
 if(mode==='supplement-desktop'){
  await page.keyboard.press('Escape');await page.waitForTimeout(300);await writeFile(out+'/keyboard-escape.json',JSON.stringify({overlayStillOpen:await page.locator('.projects-zoom').count(),url:page.url()},null,2))
  for(let i=0;i<8;i++){await page.locator('.projects-zoom__map button').nth(i).click();await page.waitForTimeout(1200);await page.locator('.projects-zoom__header button').filter({hasText:'JA'}).click();await page.waitForTimeout(800);await snap(`project-detail-ja-${String(i+1).padStart(2,'0')}`)}
 }
 await page.locator('.projects-zoom__back').click();await page.waitForTimeout(1600)
 for(const route of ['about','contact']){await page.locator(`.site-nav a[href="/${route}"]`).click();await page.waitForTimeout(3800);await snap(route);if(route==='about'){await page.locator('.about-language-toggle button').filter({hasText:'JA'}).click();await page.waitForTimeout(500);await snap('about-ja')}}
 if(mode==='supplement-desktop'){
  await page.goBack();await page.waitForTimeout(3800);await snap('history-back');await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});await page.locator('.site-nav a[href="/projects"]').click();await page.waitForTimeout(3800)
  const x=()=>page.locator('.projects-marquee__track').evaluate(e=>getComputedStyle(e).transform);const t0=await x();await page.waitForTimeout(1100);const t1=await x();await snap('reduced-dark');await writeFile(out+'/preferences-check.json',JSON.stringify({reduced:true,dark:true,trackAtT0:t0,trackAfter1100ms:t1,stillMoves:t0!==t1},null,2))
 }
 await context.close()
}
await writeFile(out+'/supplement-inventory.json',JSON.stringify(summary,null,2));await browser.close()
