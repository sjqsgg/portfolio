"""Rebuild clean, independently shaded internals inside the accepted case shell.

Run with Blender 4.1 --background --factory-startup --python this_file.
The tracked production .blend supplies the accepted shell, rails and glass.
Original imported source assets remain untouched.
"""
from pathlib import Path
import math
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUT_BLEND = ROOT / 'assets/3d/workstation-v003/computer-case-production.blend'
OUT_GLB = ROOT / 'assets/3d/workstation-v003/sources/computer-case-production.glb'

bpy.ops.wm.open_mainfile(filepath=str(OUT_BLEND))
root = bpy.data.objects['Computer_Tower']
# Remove either the old merged import or a previous procedural assembly.
for name in ('Computer_Tower_Muted_Interior', 'Computer_Tower_Internals'):
    old = bpy.data.objects.get(name)
    if old:
        for child in list(old.children_recursive):
            bpy.data.objects.remove(child, do_unlink=True)
        bpy.data.objects.remove(old, do_unlink=True)
for material in list(bpy.data.materials):
    if material.name.startswith('Computer_internal_') and material.users == 0:
        bpy.data.materials.remove(material)

assembly = bpy.data.objects.new('Computer_Tower_Internals', None)
bpy.context.scene.collection.objects.link(assembly)
assembly.parent = root
assembly.matrix_world = Matrix.Identity(4)
root['role'] = 'noninteractive computer tower with simplified hard-surface internals'
assembly['construction'] = 'separate solid-colour components; no photographic or normal textures'

def material(name, hex_color, roughness=.56, metalness=.08):
    values = [int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values]
    mat = bpy.data.materials.new('Computer_internal_' + name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*linear, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metalness
    mat.diffuse_color = (*linear, 1)
    return mat

cream = material('warm_white', 'DDE0D5', .57, .03)
silver = material('satin_silver', 'BFC8BF', .48, .32)
board = material('sage_board', '7C8E82', .67, .02)
inset = material('soft_recess', '65776B', .66, .04)
cable = material('ivory_tube', 'D4DBD0', .60, .01)

def attach(obj, name, mat):
    obj.name = 'Computer_Interior_' + name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = assembly
    obj.matrix_world = world
    return obj

def soften(obj, radius=.002, segments=3):
    bevel = obj.modifiers.new('Controlled edge radius', 'BEVEL')
    bevel.width = radius
    bevel.segments = segments
    bevel.limit_method = 'ANGLE'
    bevel.harden_normals = True
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    weighted = obj.modifiers.new('Planar face normals', 'WEIGHTED_NORMAL')
    weighted.keep_sharp = True
    weighted.weight = 50

def box(name, center, size, mat=cream, radius=.002):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    attach(obj, name, mat)
    soften(obj, radius)
    return obj

def cylinder(name, center, radius, depth, mat, axis=(0, 1, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth, location=center)
    obj = bpy.context.object
    obj.rotation_euler = Vector(axis).to_track_quat('Z', 'Y').to_euler()
    attach(obj, name, mat)
    soften(obj, .001, 2)
    return obj

def ring(name, center, radius, mat=silver, axis=(0, 1, 0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=48, minor_segments=8, location=center,
                                   major_radius=radius, minor_radius=.0026)
    obj = bpy.context.object
    obj.rotation_euler = Vector(axis).to_track_quat('Z', 'Y').to_euler()
    attach(obj, name, mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj

def tube(name, points, radius=.0055):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 16
    data.bevel_depth = radius
    data.bevel_resolution = 3
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for point, position in zip(spline.bezier_points, points):
        point.co = position
        point.handle_left_type = 'AUTO'
        point.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    attach(obj, name, cable)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.select_set(False)
    return obj

def fan(name, center, radius=.051, axis=(1, 0, 0)):
    normal = Vector(axis).normalized()
    origin = Vector(center)
    cylinder(name + '_recess', origin, radius, .010, inset, axis)
    face = origin - normal * .007
    ring(name + '_rim', face, radius, silver, axis)
    # Five broad blades. A small curved wedge makes the fan legible without
    # dense fins, perforation textures or tiny hardware.
    tangent = normal.cross(Vector((0, 0, 1)))
    if tangent.length < .01:
        tangent = Vector((1, 0, 0))
    tangent.normalize()
    bitangent = normal.cross(tangent)
    vertices, faces = [], []
    for blade in range(5):
        angle = blade * math.tau / 5
        boundary = []
        for j in range(5):
            a = angle + .16 + j * .10
            boundary.append(face + tangent * (math.cos(a) * radius * .84) + bitangent * (math.sin(a) * radius * .84))
        for j in range(4, -1, -1):
            a = angle - .15 + j * .075
            boundary.append(face + tangent * (math.cos(a) * radius * .30) + bitangent * (math.sin(a) * radius * .30))
        start = len(vertices)
        vertices.extend(boundary)
        faces.append(tuple(range(start, start + len(boundary))))
    mesh = bpy.data.meshes.new(name + '_blades')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name + '_blades', mesh)
    bpy.context.scene.collection.objects.link(obj)
    attach(obj, name + '_blades', silver)
    cylinder(name + '_hub', face - normal * .002, radius * .24, .008, cream, axis)

# Blender world coordinates: Z-up, glazed side towards decreasing Y.
# The accepted envelope is X [-.907994,-.354006], Y [.532879,.831121],
# Z [.06,.68]. Original front rails and glass remain exactly in place.
box('back_panel', (-.631, .826, .370), (.546, .010, .612), cream)
box('bottom_plate', (-.631, .681, .064), (.546, .284, .008), cream, .001)
box('top_panel', (-.631, .681, .674), (.546, .284, .012), cream)
box('rear_spine', (-.899, .681, .370), (.012, .282, .612), cream)
box('front_intake_frame', (-.363, .681, .370), (.012, .282, .612), cream)
# Shallow, broad vertical ventilation channels on the short front face.
for i in range(7):
    box(f'intake_channel_{i+1:02}', (-.3568, .571 + i * .036, .421), (.004, .015, .388), inset, .0015)
box('power_supply_shroud', (-.632, .679, .189), (.523, .261, .098), cream, .003)
box('mainboard', (-.651, .804, .434), (.385, .012, .346), board, .003)
box('board_upper_heatsink', (-.692, .786, .573), (.218, .021, .030), silver)
box('cpu_block', (-.638, .748, .479), (.078, .068, .078), silver, .007)
cylinder('cpu_pump_cap', (-.638, .711, .479), .028, .006, cream)
ring('cpu_pump_rim', (-.638, .707, .479), .029, silver)
for i in range(2):
    box(f'ram_{i+1}', (-.552 + i * .026, .776, .500), (.015, .028, .113), cream)
box('graphics_card_body', (-.654, .645, .355), (.396, .168, .052), cream, .004)
box('graphics_card_top', (-.654, .645, .384), (.399, .170, .009), silver, .0015)
box('graphics_card_recess', (-.685, .557, .355), (.272, .006, .023), inset, .003)
box('graphics_card_end', (-.474, .556, .355), (.031, .008, .035), silver, .002)
box('top_radiator', (-.650, .700, .632), (.432, .210, .035), silver)
for i in range(3):
    box(f'radiator_fan_{i+1}_frame', (-.794 + i * .143, .700, .606), (.128, .132, .020), cream)
    fan(f'radiator_fan_{i+1}', (-.794 + i * .143, .700, .596), .056, (0, 0, 1))
fan('rear_fan', (-.882, .680, .501), .058, (-1, 0, 0))
for i in range(2):
    shift = i * .023
    tube(f'coolant_run_{i+1}', [(-.669, .711, .494 - shift), (-.734, .645, .494 - shift),
         (-.820 + shift, .577, .520 - shift), (-.836 + shift, .596, .628)], .006)
# Three closely spaced parallel cables, with consistent bend radii.
for i in range(3):
    x = -.496 + i * .015
    tube(f'gpu_cable_{i+1}', [(x, .554, .366), (x, .534, .343), (x, .538, .280),
         (x, .571, .256), (x, .626, .233)], .0045)
box('gpu_cable_comb', (-.481, .536, .284), (.046, .010, .010), silver, .002)

bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for obj in [root, *root.children_recursive]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))
bpy.ops.export_scene.gltf(filepath=str(OUT_GLB), export_format='GLB', use_selection=True,
                         export_yup=True, export_apply=True, export_cameras=False,
                         export_lights=False, export_extras=True)
print('CLEAN_CASE_EXPORTED', str(OUT_GLB))
