import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const out=new URL('../evidence',import.meta.url).pathname
const browser=await chromium.launch({channel:'chrome',headless:true})
const props=['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textAlign','color','backgroundColor','backgroundImage','opacity','display','position','zIndex','width','height','maxWidth','minWidth','maxHeight','minHeight','padding','margin','gap','rowGap','columnGap','gridTemplateColumns','gridTemplateRows','alignItems','justifyContent','border','borderTop','borderRadius','boxShadow','filter','backdropFilter','overflow','overflowX','overflowY','objectFit','objectPosition','transform','transformOrigin','transition','animation','cursor','pointerEvents','touchAction','clipPath']
const summary=[]

const mode='motion-desktop';const viewport={width:1512,height:820};const context=await browser.newContext({viewport,deviceScaleFactor:1,recordVideo:{dir:out+'/motion-recording',size:viewport}});const page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable')
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

await page.goto('https://www.hirotos.com/',{waitUntil:'domcontentloaded',timeout:60000});await stable();
await page.mouse.move(760,745);await page.waitForTimeout(500);await snap('sticker-hover');await page.mouse.click(760,745);await page.waitForTimeout(400);await snap('sticker-placed');
await page.locator('.site-nav a[href="/about"]').click();await page.waitForTimeout(3800);
const started=Date.now();await page.locator('.site-nav a[href="/projects"]').click();const frames=[];
for(const ms of [100,400,800,1200,1700,2300]){await page.waitForTimeout(Math.max(0,ms-(Date.now()-started)));const state=await page.evaluate(()=>({route:document.querySelector('.persistent-experience')?.dataset.route,transitioning:document.querySelector('.persistent-experience')?.dataset.transitioning,elements:[...document.querySelectorAll('[class*="transition"],clipPath path')].map(e=>({tag:e.tagName,class:e.getAttribute('class'),d:e.getAttribute('d'),style:e.getAttribute('style')}))}));frames.push({targetMs:ms,actualMs:Date.now()-started,state});await page.screenshot({path:`${out}/transition-${String(ms).padStart(4,'0')}.png`})}
await writeFile(out+'/transition-frames.json',JSON.stringify(frames,null,2));await page.waitForTimeout(1800);
await context.close();await page.video().saveAs(out+'/motion-sticker-transition.webm');await browser.close();
