import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const out=new URL('../evidence',import.meta.url).pathname
const browser=await chromium.launch({channel:'chrome',headless:true})
const props=['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textAlign','color','backgroundColor','backgroundImage','opacity','display','position','zIndex','width','height','maxWidth','minWidth','maxHeight','minHeight','padding','margin','gap','rowGap','columnGap','gridTemplateColumns','gridTemplateRows','alignItems','justifyContent','border','borderTop','borderRadius','boxShadow','filter','backdropFilter','overflow','overflowX','overflowY','objectFit','objectPosition','transform','transformOrigin','transition','animation','cursor','pointerEvents','touchAction','clipPath']
const summary=[]
for(const mode of ['desktop','mobile']) {
 const viewport=mode==='desktop'?{width:1512,height:820}:{width:390,height:844}
 const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:mode==='mobile',hasTouch:mode==='mobile',recordVideo:{dir:out+'/recordings',size:viewport}})
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
 const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable')
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
 await page.goto('https://www.hirotos.com/',{waitUntil:'domcontentloaded',timeout:60000});await stable();await snap('home')
 if(mode==='desktop'){
  await page.mouse.move(900,400);await page.waitForTimeout(1200);await snap('home-pointer-right')
  await page.mouse.wheel(0,540);await page.waitForTimeout(1600);await snap('home-wheel-down')
  await page.mouse.wheel(0,-540);await page.waitForTimeout(1500)
  await page.locator('.site-nav a[href="/projects"]').hover();await page.waitForTimeout(350);await snap('nav-hover')
 }
 for(const route of ['projects','about','contact']) {
  await page.locator(`.site-nav a[href="/${route}"]`).click()
  await page.waitForFunction(route=>document.querySelector('.persistent-experience')?.dataset.route===route&&document.querySelector('.persistent-experience')?.dataset.transitioning==='false',route)
  await page.waitForTimeout(1600);await snap(route)
  if(route==='projects') {
   const card=page.locator('.projects-marquee__item').filter({visible:true})
   const candidates=await card.evaluateAll(nodes=>nodes.map((n,i)=>({i,r:n.getBoundingClientRect().toJSON()})).filter(x=>x.r.x>0&&x.r.x+x.r.width<innerWidth))
   if(candidates.length){const selected=card.nth(candidates[0].i);if(mode==='desktop'){await selected.hover({force:true});await page.waitForTimeout(850);await snap('projects-hover')}await selected.click({force:true});await page.waitForTimeout(1700);await snap('project-detail')
    const thumbs=page.locator('.projects-zoom__map button');const count=await thumbs.count()
    if(mode==='desktop')for(let i=0;i<count;i++){await thumbs.nth(i).click();await page.waitForTimeout(800);await snap(`project-detail-${String(i+1).padStart(2,'0')}`)}
    const ja=page.locator('.projects-zoom__header button').filter({hasText:'JA'});if(await ja.count()){await ja.click();await page.waitForTimeout(800);await snap('project-detail-ja')}
    const back=page.locator('.projects-zoom__back');await back.click();await page.waitForTimeout(1400);await snap('projects-return')
   }
  }
  if(route==='about'){
   const ja=page.locator('.about-language-toggle button').filter({hasText:'JA'});if(await ja.count()){await ja.click();await page.waitForTimeout(1000);await snap('about-ja')}
  }
 }
 await writeFile(`${out}/errors-${mode}.json`,JSON.stringify(errors,null,2))
 await context.close();await page.video().saveAs(`${out}/journey-${mode}.webm`)
}
await writeFile(out+'/page-inventory.json',JSON.stringify(summary,null,2));await browser.close()
