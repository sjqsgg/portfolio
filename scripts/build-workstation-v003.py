"""Non-destructive structural/lookdev derivative. Blender 4.1+, meters, Z-up source."""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector, Euler
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'assets/3d/workstation-v003/sources'
OUT = ROOT/'assets/3d/workstation-v003'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'graybox-v001.blend'))
root = bpy.data.objects['WORKSTATION_ROOT']
asset = bpy.data.collections['WORKSTATION_ASSET']
def linear(s):
    rgb=[int(s[i:i+2],16)/255 for i in (0,2,4)]
    return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
def material(name, color, rough=.5, metal=0, coat=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*linear(color),1)
    p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    p.inputs['Coat Weight'].default_value=coat
    m.diffuse_color=(*linear(color),1)
    return m
wood=material('Pale_ash','C2BFB0',.48)
chrome=material('Polished_chrome','CDD2D3',.19,1)
green=material('Green_enamel','164F39',.23,0,.35)
paint=material('Petrol_powdercoat','314C46',.46)
paper=material('Uncoated_paper','E4E0D5',.87)
edge=material('Paper_edges','BFBCAE',.94)
leather=material('Camera_leather','202524',.79)
metal=material('Camera_metal','353B3A',.34,.7)
glass=material('Optical_glass','122B2C',.08,.25,.6)
rubber=material('Rubber','121614',.84)
cloth=material('Speaker_cloth','383D35',.96)
walnut=material('Speaker_walnut','75694D',.53)
sage=material('Sage_pegboard','A8B1A3',.56)
ceramic=material('Glazed_ceramic','DEE0D1',.2,0,.3)
ink=material('Ink','233B32',.9)
screen=material('Screen','122820',.32)
p=screen.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(*linear('557D68'),1);p.inputs['Emission Strength'].default_value=.13
tex=SOURCE/'pale-ash-basecolor-1k.png'
image=bpy.data.images.load(str(tex)); image.pack()
n=wood.node_tree.nodes.new('ShaderNodeTexImage');n.image=image
wood.node_tree.links.new(n.outputs['Color'],wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
# Remove redundant display gear to give the guestbook an actual place on the photo counter.
for name in ['Camera_Instant','Camera_CCD','Flash_Unit','Camera_Charger','Lens_Standalone_03']:
    ob=bpy.data.objects.get(name)
    if ob:
        for child in list(ob.children_recursive): bpy.data.objects.remove(child,do_unlink=True)
        bpy.data.objects.remove(ob,do_unlink=True)
bpy.data.objects['HOTSPOT_guestbook'].location.x += 1.13
bpy.data.objects['Office_Chair'].location.x += .18
bpy.data.objects['Office_Chair'].location.y -= .24
bpy.context.view_layer.update()
# Stand remains planted while the book lifts. Peg remains on the board as the badge turns.
for ob in list(bpy.data.objects['HOTSPOT_guestbook'].children):
    if 'Stand' in ob.name or 'Cradle' in ob.name or 'Support' in ob.name:
        world=ob.matrix_world.copy(); ob.parent=root; ob.matrix_world=world
for name in ['Badge_Hanger','Badge_Peg']:
    ob=bpy.data.objects[name]; world=ob.matrix_world.copy(); ob.parent=root;ob.matrix_world=world
for ob in list(asset.objects):
    if ob.type!='MESH':continue
    old=ob.data.materials[0].name if ob.data.materials else ''
    m={'Graybox_Pale_Cabinet':wood,'Graybox_Medium_Metal':chrome,'Graybox_Dark_Equipment':metal,'Graybox_Rubber':rubber,'Graybox_Screen':screen,'Graybox_Petrol_Panels':paint,'Graybox_Identity_Accent':sage,'Graybox_Paper':paper,'Graybox_Speaker_Cone':cloth}.get(old)
    # Match semantically, not only the old graybox palette.
    if 'Pale' in old:m=wood
    if 'Dark' in old:m=metal
    if 'Petrol' in old:m=paint
    if 'Identity' in old:m=sage
    if ob.name in ['Lamp_Shade','HOTSPOT_lamp']:m=green
    if 'Ceramic' in ob.name:m=ceramic
    if 'Guestbook_Blank' in ob.name or 'Badge_Blank' in ob.name:m=paper
    if ob.name=='HOTSPOT_guestbook':m=paint
    if 'Speaker' in ob.name and 'Cabinet' in ob.name:m=walnut
    if 'Speaker' in ob.name and ('Baffle' in ob.name or 'Cone' in ob.name):m=cloth
    if 'Lens_Glass' in ob.name:m=glass
    if 'Grip' in ob.name or ob.name in ['Mirrorless_Body','Film_Body']:m=leather
    if 'Book' in ob.name and 'Page' in ob.name:m=edge
    if m:
        for i in range(len(ob.data.materials)):
            old_slot=ob.data.materials[i].name
            ob.data.materials[i]=paper if 'Paper' in old_slot else paint if 'Petrol' in old_slot and 'Book' in ob.name else m
    # Directional face UVs: grain has real scale and stays consistent across panels.
    uv=ob.data.uv_layers.new(name='SurfaceUV')
    for poly in ob.data.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            co=ob.matrix_world @ ob.data.vertices[ob.data.loops[li].vertex_index].co
            uv.data[li].uv=(co[axes[0]]*.9,co[axes[1]]*.9)
    for poly in ob.data.polygons:
        poly.use_smooth = len(poly.vertices) <= 4 and not ob.name.startswith("Pegboard")
    if len(ob.data.polygons)<200:
        b=ob.modifiers.new('Physical_edge_radius','BEVEL');b.width=.0015;b.segments=2;b.limit_method='ANGLE'
        b.use_clamp_overlap=True;b.harden_normals=True
        normals=ob.modifiers.new('Surface_normals','WEIGHTED_NORMAL');normals.keep_sharp=True

def cube(name,pos,size,m,parent=root):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    ob=bpy.context.object;ob.name=name;ob.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bpy.context.view_layer.update();world=ob.matrix_world.copy();ob.parent=parent;ob.matrix_world=world
    for c in list(ob.users_collection):c.objects.unlink(ob)
    asset.objects.link(ob);ob.data.materials.append(m)
    b=ob.modifiers.new('Edge_radius','BEVEL');b.width=.001;b.segments=2
    return ob
# A distinct CV sheet in an independent rack; its pivot is at the sheet center.
rack=cube('CV_Rack',(-.94,.886,1.072),(.148,.033,.025),chrome)
cv=cube('HOTSPOT_cv',(-.94,.887,1.173),(.136,.003,.192),paper)
cv['interaction']='lift';cv['source']='CV_Rack';cv['label']='Curriculum vitae'

def text(name,body,pos,size,parent,rotation=(math.pi/2,0,0),mat=ink):
    data=bpy.data.curves.new(name,'FONT');data.body=body;data.size=size;data.extrude=0;data.align_x='LEFT'
    ob=bpy.data.objects.new(name,data);asset.objects.link(ob);ob.location=pos;ob.rotation_euler=rotation
    bpy.context.view_layer.update();world=ob.matrix_world.copy();ob.parent=parent;ob.matrix_world=world;data.materials.append(mat)
    bpy.context.view_layer.objects.active=ob;ob.select_set(True)
    bpy.ops.object.convert(target='MESH');ob.select_set(False)
    return ob
bpy.ops.object.select_all(action='DESELECT')
text('CV_Print','JIAQI SHI\n\nSOFTWARE ENGINEER\n& PHOTOGRAPHER\n\nTHE NETHERLANDS\n\nSELECTED WORK / 01',(-.997,.884,1.24),.010,cv)
badge=bpy.data.objects['HOTSPOT_badge']
text('Badge_Print','JS\n\nJIAQI SHI',(-.666,.892,1.142),.010,badge)
# Monitor typography on its physical screen plane.
rot=Euler((0,0,math.radians(57))).to_matrix();origin=Vector((-.78,-.18,1.006))
text('Monitor_Print','JIAQI SHI\n\nSELECTED WORK\n\n01   SHANXI MAP\n02   A SHARED WORKBENCH\n\nOPEN PROJECTS  >',origin+rot@Vector((-.23,-.019,.115)),.020,bpy.data.objects['HOTSPOT_monitor'],(math.pi/2,0,math.radians(57)),paper)
# Rename zone labels to remove old author metadata while retaining stable pick targets.
for ob in asset.objects:
    if ob.name.startswith('HOTSPOT_'):
        ob['interaction_id']=ob.name.replace('HOTSPOT_','')
        if 'label' in ob:ob['label']=ob.name.replace('HOTSPOT_','').replace('_',' ')
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for ob in asset.objects:ob.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jiaqi-workstation-v003.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/workstation-v003.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_cameras=False,export_lights=False,export_extras=True)
report={'source':str(SOURCE),'units':'meters','desktop_height':.74,'desktop_thickness':.028,'L_angle_degrees':90,'interactive_groups':[o.name for o in asset.objects if o.name.startswith('HOTSPOT_')],'mesh_count':sum(o.type=='MESH' for o in asset.objects)}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2))
print('V003_COMPLETE',report)
