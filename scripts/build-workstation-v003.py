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
case_paint=material('Computer_case_paint','DCEAB0',.44,0,.10)
case_dark=material('Computer_case_dark','343B38',.68,.12)
case_glass=material('Computer_case_glass','B9C8C2',.15,.04,.22)
case_glass.diffuse_color=(*linear('B9C8C2'),.16)
case_glass.surface_render_method='BLENDED'
case_glass.blend_method='BLEND'
p=case_glass.node_tree.nodes.get('Principled BSDF')
p.inputs['Alpha'].default_value=.16
p.inputs['Transmission Weight'].default_value=.42
case_internal=material('Computer_internal_silver','B7C1BD',.30,.48,.08)
case_pcb=material('Computer_internal_board','36423F',.62,.08)
case_cable=material('Computer_internal_cable','D9DDD2',.58,.04)
p=screen.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(*linear('557D68'),1);p.inputs['Emission Strength'].default_value=.13
tex=SOURCE/'pale-ash-basecolor-1k.png'
image=bpy.data.images.load(str(tex)); image.pack()
n=wood.node_tree.nodes.new('ShaderNodeTexImage');n.image=image
wood.node_tree.links.new(n.outputs['Color'],wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

# Round 03: rebuild only the two loudspeakers.  The accepted Round 02 group
# transforms remain untouched, so this is a geometry swap inside the same
# 398 x 636 x 413 mm envelope rather than a layout change.
def speaker_object(name, mesh, parent, mat):
    ob=bpy.data.objects.new(name,mesh);asset.objects.link(ob);ob.parent=parent
    mesh.materials.append(mat)
    return ob

def prism_xy(name, outline, z0, z1, parent, mat):
    verts=[(x,y,z) for z in (z0,z1) for x,y in outline]
    count=len(outline)
    faces=[tuple(range(count-1,-1,-1)),tuple(range(count,count*2))]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    mesh=bpy.data.meshes.new(name+'_Mesh');mesh.from_pydata(verts,[],faces);mesh.update()
    return speaker_object(name,mesh,parent,mat)

def prism_xz(name, outline, y0, y1, parent, mat):
    verts=[(x,y,z) for y in (y0,y1) for x,z in outline]
    count=len(outline)
    faces=[tuple(range(count-1,-1,-1)),tuple(range(count,count*2))]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    mesh=bpy.data.meshes.new(name+'_Mesh');mesh.from_pydata(verts,[],faces);mesh.update()
    return speaker_object(name,mesh,parent,mat)

def local_cylinder(name, parent, radius, depth, location, mat, vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,
        location=(0,0,0),rotation=(math.pi/2,0,0))
    ob=bpy.context.view_layer.objects.active;ob.name=name;ob.parent=parent;ob.location=location
    for collection in list(ob.users_collection):collection.objects.unlink(ob)
    asset.objects.link(ob);ob.data.materials.append(mat)
    bevel=ob.modifiers.new('Machined_edge','BEVEL');bevel.width=.0012;bevel.segments=2
    return ob

def local_torus(name, parent, outer, inner, y, z, mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=(outer+inner)/2,
        minor_radius=(outer-inner)/2,major_segments=64,minor_segments=10,
        location=(0,0,0),rotation=(math.pi/2,0,0))
    ob=bpy.context.view_layer.objects.active;ob.name=name;ob.parent=parent;ob.location=(0,y,z)
    for collection in list(ob.users_collection):collection.objects.unlink(ob)
    asset.objects.link(ob);ob.data.materials.append(mat)
    return ob

def capsule_outline(width,height,segments=12):
    radius=width/2; half=height/2
    top=[(radius*math.cos(i*math.pi/segments),half-radius+radius*math.sin(i*math.pi/segments)) for i in range(segments+1)]
    bottom=[(radius*math.cos(math.pi+i*math.pi/segments),-half+radius+radius*math.sin(math.pi+i*math.pi/segments)) for i in range(segments+1)]
    return top+bottom[1:-1]

def rebuild_speaker(group_name):
    group=bpy.data.objects[group_name]
    for child in list(group.children_recursive):bpy.data.objects.remove(child,do_unlink=True)

    # Six-sided cabinet cross-section: a broad front plane, then one shallow
    # inset/chamfer face on each side before the true side walls turn rearward.
    cabinet_outline=[(-.164,-.191),(.164,-.191),(.199,-.164),(.199,.191),(-.199,.191),(-.199,-.164)]
    cabinet=prism_xy(group_name+'_Cabinet',cabinet_outline,0,.636,group,walnut)
    bevel=cabinet.modifiers.new('Cabinet_edge_radius','BEVEL');bevel.width=.004;bevel.segments=3
    bevel.limit_method='ANGLE';bevel.harden_normals=True

    # The inset baffle preserves a readable reveal of both transition faces.
    baffle_outline=[(-.160,.014),(.160,.014),(.166,.020),(.166,.616),(.160,.622),(-.160,.622),(-.166,.616),(-.166,.020)]
    baffle=prism_xz(group_name+'_Baffle',baffle_outline,-.198,-.191,group,cloth)
    bevel=baffle.modifiers.new('Baffle_edge_radius','BEVEL');bevel.width=.003;bevel.segments=3

    # One upper capsule holds the tweeter and mid driver; it belongs to the
    # speaker face and is deliberately distinct from the central audio unit.
    capsule_shape=[(x,z+.493) for x,z in capsule_outline(.154,.226)]
    capsule=prism_xz(group_name+'_Upper_Capsule',capsule_shape,-.207,-.198,group,chrome)
    bevel=capsule.modifiers.new('Capsule_edge_radius','BEVEL');bevel.width=.0015;bevel.segments=2

    # Three-way hierarchy follows the photographed Philips speaker: dominant
    # woofer, compact mid, then a small tweeter, all centered on one axis.
    drivers=[
        ('Woofer',.137,.104,.043,.194),
        ('Mid_Driver',.063,.048,.020,.441),
        ('Tweeter',.032,.023,.010,.552),
    ]
    for label,outer,cone,dust,z in drivers:
        local_torus(group_name+'_'+label+'_Rim',group,outer,outer*.84,-.208,z,chrome)
        local_cylinder(group_name+'_'+label+'_Cone',group,cone,.010,(0,-.210,z),cloth)
        local_cylinder(group_name+'_'+label+'_Dustcap',group,dust,.006,(0,-.219,z),chrome)

    # Four restrained fasteners are part of the real cabinet language without
    # turning the speaker into a photoreal prop.
    for index,(x,z) in enumerate(((-.145,.055),(.145,.055),(-.145,.581),(.145,.581)),1):
        local_cylinder(f'{group_name}_Fastener_{index:02d}',group,.006,.004,(x,-.202,z),chrome,24)

for speaker_group in ('Speaker_Left','Speaker_Right'):
    rebuild_speaker(speaker_group)
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

# Replace the old perforated source mesh with a plain placement envelope. The
# browser builds the visible felt board from this envelope, so future exports
# cannot accidentally bring the legacy holes back into the rendered scene.
legacy_board=bpy.data.objects.get('Pegboard_Perforated_21x14')
if legacy_board and legacy_board.type=='MESH':
    lower=Vector((min(v[0] for v in legacy_board.bound_box),min(v[1] for v in legacy_board.bound_box),min(v[2] for v in legacy_board.bound_box)))
    upper=Vector((max(v[0] for v in legacy_board.bound_box),max(v[1] for v in legacy_board.bound_box),max(v[2] for v in legacy_board.bound_box)))
    verts=[(x,y,z) for z in (lower.z,upper.z) for y in (lower.y,upper.y) for x in (lower.x,upper.x)]
    faces=[(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]
    mesh=bpy.data.meshes.new('Felt_Board_Source_Envelope_Mesh');mesh.from_pydata(verts,[],faces);mesh.update()
    old_mesh=legacy_board.data;legacy_board.data=mesh;legacy_board.name='Felt_Board_Source_Envelope'
    if old_mesh.users==0:bpy.data.meshes.remove(old_mesh)

def cube(name,pos,size,m,parent=root):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    ob=bpy.context.view_layer.objects.active;ob.name=name;ob.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bpy.context.view_layer.update();world=ob.matrix_world.copy();ob.parent=parent;ob.matrix_world=world
    for c in list(ob.users_collection):c.objects.unlink(ob)
    asset.objects.link(ob);ob.data.materials.append(m)
    b=ob.modifiers.new('Edge_radius','BEVEL');b.width=.001;b.segments=2
    return ob

# Round 04 accepted source-derived case: its long glazed side faces the opening
# camera. The source has been reduced and stylized in an isolated production
# asset so this scene does not inherit the 1.875M-triangle Tripo source.
for name in ('Corner_Undercounter_Cabinet','Corner_Undercounter_Door'):
    ob=bpy.data.objects.get(name)
    if ob:bpy.data.objects.remove(ob,do_unlink=True)
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(SOURCE/'computer-case-production.glb'))
imported=[ob for ob in bpy.data.objects if ob not in before]
imported_roots=[ob for ob in imported if ob.parent not in imported]
for ob in imported:
    world=ob.matrix_world.copy()
    for collection in list(ob.users_collection):collection.objects.unlink(ob)
    asset.objects.link(ob);ob.matrix_world=world
for ob in imported_roots:
    world=ob.matrix_world.copy();ob.parent=root;ob.matrix_world=world
tower=bpy.data.objects.get('Computer_Tower')
if tower:
    tower['round']='04';tower['role']='noninteractive source-derived computer tower'
    meshes=[ob for ob in tower.children_recursive if ob.type=='MESH']
    points=[ob.matrix_world @ Vector(corner) for ob in meshes for corner in ob.bound_box]
    lower=Vector((min(point.x for point in points),min(point.y for point in points),min(point.z for point in points)))
    upper=Vector((max(point.x for point in points),max(point.y for point in points),max(point.z for point in points)))
    # Preserve the open glazed face, but restore the two cabinet side boards as
    # independent pieces. They sit immediately outside the case and mask its
    # generated side/grille edges without bringing back the old front door.
    panel_thickness=.022
    panel_depth=.398
    panel_height=.636
    panel_y=.721
    panel_z=.370
    cube('Computer_Cabinet_Left_Side_Panel',(lower.x-panel_thickness/2,panel_y,panel_z),(panel_thickness,panel_depth,panel_height),wood)
    cube('Computer_Cabinet_Right_Side_Panel',(upper.x+panel_thickness/2,panel_y,panel_z),(panel_thickness,panel_depth,panel_height),wood)
# A distinct CV sheet in an independent rack; its pivot is at the sheet center.
rack=cube('CV_Rack',(-.94,.886,1.072),(.148,.033,.025),chrome)
cv=cube('HOTSPOT_cv',(-.94,.887,1.173),(.136,.003,.192),paper)
cv['interaction']='lift';cv['source']='CV_Rack';cv['label']='Curriculum vitae'

def text(name,body,pos,size,parent,rotation=(math.pi/2,0,0),mat=ink):
    data=bpy.data.curves.new(name,'FONT');data.body=body;data.size=size;data.extrude=0;data.align_x='LEFT'
    ob=bpy.data.objects.new(name,data);asset.objects.link(ob);ob.location=pos;ob.rotation_euler=rotation
    bpy.context.view_layer.update();world=ob.matrix_world.copy();ob.parent=parent;ob.matrix_world=world;data.materials.append(mat)
    # Data API conversion is reliable both in GUI and background-style runs;
    # bpy.ops.object.convert depends on the current editor context.
    bpy.context.view_layer.update();evaluated=ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=bpy.data.meshes.new_from_object(evaluated);ob.name=name+'_CurveSource'
    mesh_ob=bpy.data.objects.new(name,mesh);asset.objects.link(mesh_ob)
    mesh_ob.parent=parent;mesh_ob.matrix_world=ob.matrix_world.copy()
    bpy.data.objects.remove(ob,do_unlink=True)
    return mesh_ob
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
def export_glb():
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/workstation-v003.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_cameras=False,export_lights=False,export_extras=True)
    print('V003_GLB_EXPORTED')
    return None

# Blender can execute --python before the macOS window has finished creating
# its active-object context.  Defer only the export in that case; the .blend
# has already been saved and the timer runs as soon as the UI is ready.
if hasattr(bpy.context,'active_object'):
    export_glb()
else:
    bpy.app.timers.register(export_glb,first_interval=.75)
report={'source':'assets/3d/workstation-v003/sources','units':'meters','desktop_height':.74,'desktop_thickness':.028,'L_angle_degrees':90,'interactive_groups':[o.name for o in asset.objects if o.name.startswith('HOTSPOT_')],'mesh_count':sum(o.type=='MESH' for o in asset.objects)}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2))
print('V003_COMPLETE',report)
