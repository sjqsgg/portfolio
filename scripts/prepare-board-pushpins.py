"""Create the web derivative, retaining the arrangement minus the front sticker.

Run with Blender --background --python scripts/prepare-board-pushpins.py.
The source GLB is read only. Blender handles the original Y-up import/export.
"""
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/3d/push pins 3d model.glb'
OUTPUT = ROOT / 'public/models/board-pushpins.glb'
REPORT = ROOT / 'docs/board-pushpins-model.json'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects = sorted((o for o in bpy.context.scene.objects if o.type == 'MESH'), key=lambda o: int(o.name.rsplit('_', 1)[-1]))
before = sum(len(o.data.polygons) for o in objects)
# The isolated front label is Tripo segment 4. Remove just that mesh.
label = next(o for o in objects if o.name == 'tripo_part_4')
objects.remove(label)
bpy.data.objects.remove(label, do_unlink=True)
parts = []
for obj in objects:
    index = int(obj.name.rsplit('_', 1)[-1])
    target = 14000 if index == 0 else 9000 if index == 1 else 1800
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new('Web silhouette', 'DECIMATE')
    modifier.ratio = min(1, target / len(obj.data.polygons))
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.clear()
    obj.name = 'Pushpin_box' if index == 0 else 'Pushpin_lid' if index == 1 else f'Pushpin_cluster_{index:02}'
    material = bpy.data.materials.new('Sage_plastic' if index < 2 else 'Muted_pin_plastic')
    material.diffuse_color = (.55, .62, .42, 1) if index < 2 else (.55, .25, .20, 1)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = material.diffuse_color
    bsdf.inputs['Roughness'].default_value = .64
    obj.data.materials.append(material)
    parts.append({'name': obj.name, 'triangles': len(obj.data.polygons)})

# Bake transforms in world space. Unit width, centered X, bottom on the ground,
# back at GLB Z=0 makes tray placement independent of the Tripo export origin.
bpy.context.view_layer.update()
points = [o.matrix_world @ v.co for o in objects for v in o.data.vertices]
lower = Vector(tuple(min(p[i] for p in points) for i in range(3)))
upper = Vector(tuple(max(p[i] for p in points) for i in range(3)))
origin = Vector(((lower.x + upper.x) / 2, upper.y, lower.z))
width = upper.x - lower.x
for obj in objects:
    transform = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world.identity()
    for vertex in obj.data.vertices:
        vertex.co = (transform @ vertex.co - origin) / width
    obj.data.update()

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', export_yup=True, export_texcoords=False, export_normals=True, export_materials='EXPORT', export_extras=False)
REPORT.write_text(json.dumps({'source': str(SOURCE.relative_to(ROOT)), 'output': str(OUTPUT.relative_to(ROOT)), 'removedSourceParts': ['tripo_part_4 (front sticker)'], 'sourceTriangles': before, 'webTriangles': sum(p['triangles'] for p in parts), 'sourceBytes': SOURCE.stat().st_size, 'webBytes': OUTPUT.stat().st_size, 'parts': parts}, indent=2) + '\n')
print(json.dumps({'output': str(OUTPUT), 'triangles': sum(p['triangles'] for p in parts), 'bytes': OUTPUT.stat().st_size}))

if '--render' in sys.argv:
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = .12
    scene.world = bpy.data.worlds.new('Studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes.get('Background').inputs[0].default_value = (.8, .8, .8, 1)
    scene.world.node_tree.nodes.get('Background').inputs[1].default_value = .6
    bpy.ops.object.camera_add(location=(1.3, -2.7, 1.55))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0, -.45, .22)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 1.7
    scene.camera = camera
    bpy.ops.object.light_add(type='AREA', location=(-2, -2, 4))
    bpy.context.object.data.energy = 350
    bpy.context.object.data.size = 4
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 768
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.filepath = '/private/tmp/board-pushpins-geometry.png'
    bpy.ops.render.render(write_still=True)
