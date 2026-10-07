// Code-native models: every key, ring, pin and paper sheet is a separate mesh.
export function createBoardObjects(T, size, pinModel) {
  const group = new T.Group(), records = new Map()
  group.name = 'Felt_board_objects'
  function dispose(root) {
    root.traverse(node => { node.geometry?.dispose(); if (node.material) { node.material.map?.dispose(); node.material.dispose() } })
  }
  function build(item) {
    const root = new T.Group(), pivots = []
    root.userData.itemId = item.id
    const mat = (color, metal = 0) => new T.MeshStandardMaterial({color, metalness:metal, roughness:metal ? .32 : .8})
    function mesh(geometry, material, x=0,y=0,z=0, parent=root) {
      const node = new T.Mesh(geometry,material); node.position.set(x,y,z); node.castShadow=true; node.receiveShadow=true; parent.add(node); return node
    }
    const box = (w,h,d,color,x=0,y=0,z=0,parent=root) => mesh(new T.BoxGeometry(w,h,d),mat(color),x,y,z,parent)
    function pin(x,y,z,color,parent=root,scale=1) {
      const part=new T.Group(); part.name='Pushpin'; part.position.set(x,y,z); part.scale.setScalar(scale); parent.add(part)
      const profile=[[0,0],[.008,0],[.007,.004],[.003,.008],[.003,.015],[.006,.015],[.006,.018],[0,.018]].map(([a,b])=>new T.Vector2(a,b))
      const head=mesh(new T.LatheGeometry(profile,20),mat(color),0,0,0,part); head.rotation.x=Math.PI/2
      const needle=mesh(new T.CylinderGeometry(.0006,.0006,.015,8),mat('#aaa9a2',.8),0,0,-.007,part); needle.rotation.x=Math.PI/2
      return part
    }
    let scratch
    function paper(kind,w,h,x=0,y=0,z=0) {
      const canvas=document.createElement('canvas'); canvas.width=768; canvas.height=['ticket','baggage'].includes(kind)?340:kind==='note'?768:1024
      const c=canvas.getContext('2d'), W=canvas.width,H=canvas.height
      c.fillStyle=item.color; c.fillRect(0,0,W,H)
      if(kind==='scratch') {
        c.strokeStyle='#ffffff25'; c.lineWidth=12
        for(let i=0;i<30;i++){ c.beginPath(); c.moveTo(170,460); c.lineTo(384+Math.cos(i)*1100,512+Math.sin(i)*1100); c.stroke() }
        c.fillStyle='#fff'; c.font='bold 65px Georgia'; c.fillText('TRIPLE LUCKY',28,86)
        c.font='bold 340px Georgia'; c.fillStyle='#ffb521'; c.fillText('7',30,535)
        c.font='bold 35px sans-serif'; c.fillStyle='#fff'; c.fillText('A LITTLE LUCK',28,916); c.font='24px sans-serif'; c.fillText('A souvenir. No money, just good wishes.',28,965)
        c.fillStyle=item.accent; c.fillRect(310,135,430,705)
        c.fillStyle='#fff5d5'; c.fillRect(327,152,396,672)
        c.fillStyle='#273343'; c.font='bold 32px monospace'
        for(let i=0;i<8;i++)c.fillText(i===7?'7 7 7  ♥':'7 7 7  ✦',348,207+i*79)
        const base=document.createElement('canvas'); base.width=W;base.height=H;base.getContext('2d').drawImage(canvas,0,0)
        const coat=document.createElement('canvas');coat.width=W;coat.height=H;const s=coat.getContext('2d')
        const gradient=s.createLinearGradient(310,0,740,0);gradient.addColorStop(0,'#a9afb0');gradient.addColorStop(.5,'#e0e2dc');gradient.addColorStop(1,'#b6bab7');s.fillStyle=gradient;s.fillRect(327,152,396,672)
        s.fillStyle='#737e7e';s.font='bold 27px monospace'
        for(let i=0;i<8;i++)s.fillText('SCRATCH HERE',344,207+i*79)
        scratch=stroke=>{s.save();s.globalCompositeOperation='destination-out';s.lineWidth=48;s.lineCap='round';s.beginPath();s.moveTo(stroke[0]*W,(1-stroke[1])*H);s.lineTo(stroke[2]*W,(1-stroke[3])*H);s.stroke();s.restore();c.clearRect(0,0,W,H);c.drawImage(base,0,0);c.drawImage(coat,0,0);texture.needsUpdate=true}
      } else if(kind==='baggage') {
        c.fillStyle='#344147';c.font='bold 38px monospace';c.fillText('BAGGAGE RECEIPT',28,64)
        c.font='30px monospace';c.fillText('AMS  /  CZ345  /  26 AUG',28,120)
        for(let i=0;i<75;i++)c.fillRect(28+i*9,150,2+(i*7%4),104)
        c.font='20px monospace';c.fillText('DEMO 000000  •  SOUVENIR ONLY',28,302)
      } else if(kind==='ticket') {
        c.fillStyle=item.accent;c.fillRect(0,0,W,65);c.fillStyle='#fff';c.font='bold 28px sans-serif';c.fillText('CHINA SOUTHERN  /  BOARDING PASS',22,44)
        c.fillStyle='#263c48';c.font='24px monospace';c.fillText('JIAQI SHI                  ECONOMY',22,105)
        c.font='bold 72px sans-serif';c.fillText('AMS',24,188);c.fillText('35D',555,188)
        c.font='24px monospace';c.fillText('CZ345   •   26 AUG 26   •   WINDOW',22,232)
        for(let i=0;i<65;i++){c.fillRect(24+i*6,256,1+(i*7%4),35)}
        c.font='15px monospace';c.fillText('SOUVENIR · FICTIONAL CODE · NOT VALID FOR TRAVEL',22,320)
      } else {
        const font=item.text.length>100?40:item.text.length>50?48:60
        c.fillStyle='#403f33';c.font=`${font}px sans-serif`
        let line='',row=0
        for(const char of Array.from(item.text||'')){
          if(char==='\n'||c.measureText(line+char).width>630){c.fillText(line,65,125+row++*(font+12));line=char==='\n'?'':char}else line+=char
        }
        c.fillText(line,65,125+row*(font+12))
      }
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace
      const geometry=new T.PlaneGeometry(w,h,12,12), p=geometry.attributes.position
      for(let i=0;i<p.count;i++)p.setZ(i,item.curl*Math.pow(Math.abs(p.getY(i)/h)*2,5))
      geometry.computeVertexNormals()
      const face=mesh(geometry,new T.MeshStandardMaterial({map:texture,roughness:.88,side:T.DoubleSide}),x,y,z+.001)
      face.userData.scratch=kind==='scratch'
      box(w,h,item.depth,item.color,x,y,z-item.depth/2)
      if(kind==='scratch'){scratch([0,0,0,0]);item.strokes.forEach(scratch)}
    }
    if(['scratch','ticket','note'].includes(item.type)) {
      paper(item.type,item.width,item.height)
      if(item.type==='ticket') paper('baggage',item.width*.62,item.height*.40,item.width*.06,-item.height*.61,-.002)
      pin(0,item.height*.43,.004,item.accent,root,.62*(item.detailScale||1))
    } else if(item.type==='pin') {pin(0,0,0,item.color);root.scale.set(item.width/.016,item.height/.016,item.depth/.033)}
    else if(item.type==='pins') {
      if(!pinModel)throw new Error('Pushpin model unavailable')
      const imported=pinModel.clone(true), bounds=new T.Box3().setFromObject(imported), dimensions=bounds.getSize(new T.Vector3())
      imported.scale.set(item.width/dimensions.x,item.height/dimensions.y,item.depth/dimensions.z)
      imported.position.set(0,-item.height/2,0)
      imported.traverse(node=>{
        if(!node.isMesh)return
        node.geometry=node.geometry.clone()
        const palette=[item.accent,item.pinColor3 || '#91b39f',item.pinColor2 || '#d0bd76']
        const index=Number(node.name.slice(-2)) || 0
        const color=node.name==='Pushpin_box'?item.color:node.name==='Pushpin_lid'?(item.lidColor || item.color):palette[index%palette.length]
        node.material=new T.MeshStandardMaterial({color,roughness:.68,metalness:0})
        node.castShadow=true;node.receiveShadow=true
        if(node.name.startsWith('Pushpin_cluster_')) {
          node.geometry.computeBoundingBox()
          const pivot=node.geometry.boundingBox.getCenter(new T.Vector3()), detail=item.detailScale || 1
          node.scale.setScalar(detail);node.position.copy(pivot.multiplyScalar(1-detail))
        }
      })
      root.add(imported)
      root.userData.asset='board-pushpins'
    } else if(item.type==='stack') {
      const {width:w,height:h,depth:d}=item
      for(let i=0;i<9;i++){const sheet=box(w,h/10,d,i%2?item.color:item.accent,(i%3-1)*.0007,-h/2+i*h/9,d/2);sheet.rotation.y=(i%2)*.01}
      const top=mesh(new T.PlaneGeometry(w,d,8,8),mat(item.color),0,h/2+.001,d/2);top.rotation.x=-Math.PI/2
      const p=top.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,item.curl*Math.pow(Math.abs(p.getX(i)/w)*2,6));top.geometry.computeVertexNormals()
    } else if(item.type==='keys') {
      const metal=item.color,brass=item.accent
      const path=new T.CatmullRomCurve3([[-.027,.025],[-.027,.105],[-.02,.12],[.02,.12],[.027,.105],[.027,.025],[.02,.014],[-.02,.014]].map(([x,y])=>new T.Vector3(x,y,0)),true,'catmullrom',.15)
      mesh(new T.TubeGeometry(path,96,.003,8,true),mat(metal,.85)).name='Carabiner body'
      mesh(new T.CylinderGeometry(.005,.005,.034,16),mat(brass,.7),-.027,.073,0).name='Screw sleeve'
      mesh(new T.CylinderGeometry(.0035,.0035,.059,12),mat(metal,.85),.027,.068,.001).name='Carabiner gate'
      for(let i=0;i<4;i++){
        const pivot=new T.Group();pivot.position.set((i-1.5)*.006,.014,.005+i*.003);root.add(pivot);pivots.push(pivot);pivot.userData.rest=(i-1.5)*.28*(item.detailScale||1)
        mesh(new T.TorusGeometry(.015,.0015,8,32),mat(metal,.8),0,-.009,0,pivot).name=`Ring ${i+1}`
        const shape=new T.Shape();shape.absarc(0,-.038,.016,0,Math.PI*2,false)
        const hole=new T.Path();hole.absarc(0,-.032,.005,0,Math.PI*2,true);shape.holes.push(hole)
        mesh(new T.ExtrudeGeometry(shape,{depth:.0025,bevelEnabled:true,bevelSize:.0007,bevelThickness:.0005,bevelSegments:1,steps:1}),mat(brass,.75),0,0,0,pivot).name=`Key ${i+1} bow`
        box(.009,.063,.003,brass,0,-.078,0,pivot)
        for(let j=0;j<4;j++)box(.007,.004,.003,brass,.005,-.067-j*.009,0,pivot)
        pivot.rotation.z=pivot.userData.rest
      }
      const tagPivot=new T.Group();tagPivot.position.set(.018,.006,.017);tagPivot.userData.rest=.4;root.add(tagPivot);pivots.push(tagPivot)
      mesh(new T.TorusGeometry(.015,.0015,8,32),mat(metal,.8),0,-.008,0,tagPivot)
      const tag=mesh(new T.CylinderGeometry(.022,.022,.002,32),mat(brass,.75),0,-.037,0,tagPivot);tag.rotation.x=Math.PI/2;tag.name='Round brass tag'
      root.traverse(node=>{if(node.material){node.material.metalness=.75;node.material.roughness=.36}})
      // A transparent picking surface makes the hollow carabiner easy to lift.
      const hit=mesh(new T.PlaneGeometry(.115,.245),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,0,.023)
      hit.castShadow=false;hit.receiveShadow=false;hit.name='Keychain picking surface'
      root.scale.set(item.width/.115,item.height/.245,item.depth/.008)
    }
    root.scale.multiplyScalar(item.scale || 1)
    root.position.set(item.x*size.x,item.y*size.y,(['pins','stack'].includes(item.type)?.01:.024)+item.lift);root.rotation.set(item.tilt*Math.PI/180,0,item.rotation*Math.PI/180);root.visible=item.visible
    return {root,scratch,pivots,item,signature:JSON.stringify(item)}
  }
  return {group,
    setItems(items){
      for(const [id,r] of records)if(!items.some(i=>i.id===id)){group.remove(r.root);dispose(r.root);records.delete(id)}
      for(const item of items){const old=records.get(item.id);if(old?.signature===JSON.stringify(item))continue;if(old){group.remove(old.root);dispose(old.root)}const r=build(item);records.set(item.id,r);group.add(r.root)}
    },
    get:id=>records.get(id),
    animate(time,active){for(const r of records.values())for(let i=0;i<r.pivots.length;i++)r.pivots[i].rotation.z=r.pivots[i].userData.rest+(r.item.id===active?.id?Math.sin(time*.008+i)*.16*Math.max(0,1-(time-active.start)/2200):0)},
    dispose(){for(const r of records.values())dispose(r.root);records.clear()},
  }
}
