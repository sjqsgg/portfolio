from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
SOURCE_GLB = ROOT / "assets/3d/workstation-v003/sources/computer-case-preview.glb"
OUT_DIR = ROOT / "assets/3d/workstation-v003/sources"
OUT_BLEND = ROOT / "assets/3d/workstation-v003/computer-case-production.blend"
OUT_GLB = OUT_DIR / "computer-case-production.glb"
OUT_BASECOLOR = OUT_DIR / "computer-case-basecolor-stylized.png"


def world_bounds(objects):
    points = []
    for obj in objects:
        if obj.type == "MESH":
            points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    lower = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    upper = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return lower, upper


def make_material(name, color, roughness, metallic=0.0, alpha=1.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Alpha"].default_value = alpha
    if alpha < 1.0:
        material.blend_method = "BLEND"
        material.show_transparent_back = True
    return material


def add_panel(name, location, dimensions, material, bevel=0.004):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    panel = bpy.context.object
    panel.name = name
    panel.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    panel.data.materials.append(material)
    if bevel:
        modifier = panel.modifiers.new("Soft edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        modifier.limit_method = "ANGLE"
    return panel


def stylize_basecolor(image):
    pixels = np.empty(len(image.pixels), dtype=np.float32)
    image.pixels.foreach_get(pixels)
    rgba = pixels.reshape((-1, 4))
    rgb = rgba[:, :3]
    luminance = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    # Match the approved Blender preview: 45% saturation, a slight value lift,
    # then only a 25% neutral tint. The previous production pass used a much
    # stronger 45% tint and no longer represented the approved preview.
    rgb[:] = luminance[:, None] + (rgb - luminance[:, None]) * 0.45
    rgb[:] *= 0.92
    rgb[:] = rgb * 0.75 + np.array([0.70, 0.73, 0.70], dtype=np.float32) * 0.25
    np.clip(rgb, 0.0, 1.0, out=rgb)
    image.pixels.foreach_set(rgba.reshape(-1))
    image.filepath_raw = str(OUT_BASECOLOR)
    image.file_format = "PNG"
    image.save()
    return image


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE_GLB))
imported = list(bpy.context.scene.objects)
mesh_objects = [obj for obj in imported if obj.type == "MESH"]

# The approved fit/stylization preview is already reduced to roughly 150k
# triangles. Do not run a second collapse pass: it destroys the generated fan,
# grille and cable openings and was the source of the ragged production result.

case_root = bpy.data.objects.new("Computer_Tower", None)
bpy.context.scene.collection.objects.link(case_root)
for obj in [obj for obj in imported if obj.parent is None]:
    world = obj.matrix_world.copy()
    obj.parent = case_root
    obj.matrix_world = world

bpy.context.view_layer.update()
lower, upper = world_bounds(mesh_objects)
case_root.scale = (0.620 / (upper.z - lower.z),) * 3
bpy.context.view_layer.update()
lower, upper = world_bounds(mesh_objects)
case_root.location += Vector((-0.631, 0.682, 0.370)) - ((lower + upper) * 0.5)
case_root["round"] = "04"
case_root["role"] = "noninteractive imported computer tower"
bpy.context.view_layer.update()

base_image = next((image for image in bpy.data.images if "basecolor" in image.name.lower()), None)
normal_image = next((image for image in bpy.data.images if "normal" in image.name.lower()), None)
if base_image:
    base_image = stylize_basecolor(base_image)

interior = bpy.data.materials.new("Computer_case_muted_internals")
interior.use_nodes = True
nodes = interior.node_tree.nodes
links = interior.node_tree.links
nodes.clear()
output = nodes.new("ShaderNodeOutputMaterial")
shader = nodes.new("ShaderNodeBsdfPrincipled")
shader.inputs["Roughness"].default_value = 0.62
shader.inputs["Metallic"].default_value = 0.06
shader.inputs["Specular IOR Level"].default_value = 0.24
if base_image:
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = base_image
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
else:
    shader.inputs["Base Color"].default_value = (0.70, 0.73, 0.70, 1.0)
if normal_image:
    normal_image.colorspace_settings.name = "Non-Color"
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = normal_image
    normal = nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = 0.16
    links.new(texture.outputs["Color"], normal.inputs["Color"])
    links.new(normal.outputs["Normal"], shader.inputs["Normal"])
links.new(shader.outputs["BSDF"], output.inputs["Surface"])
for obj in mesh_objects:
    obj.name = "Computer_Tower_Muted_Interior"
    obj.data.materials.clear()
    obj.data.materials.append(interior)

lower, upper = world_bounds(mesh_objects)
size = upper - lower
center = (lower + upper) * 0.5
shell = make_material("Computer_case_warm_shell", (0.82, 0.81, 0.74), 0.58, metallic=0.04)
accent = make_material("Computer_case_sage_accent", (0.44, 0.56, 0.51), 0.64, metallic=0.02)
glass = make_material("Computer_case_smoked_glass", (0.28, 0.34, 0.32), 0.32, alpha=0.18)

front_y = lower.y - 0.006
rail_depth = 0.014
side_width = 0.028
top_height = 0.030
bottom_height = 0.118
styled_parts = [
    add_panel("Computer_Tower_Left_Rail", (lower.x + side_width / 2, front_y, center.z), (side_width, rail_depth, size.z), shell),
    add_panel("Computer_Tower_Right_Rail", (upper.x - side_width / 2, front_y, center.z), (side_width, rail_depth, size.z), accent),
    add_panel("Computer_Tower_Top_Rail", (center.x, front_y, upper.z - top_height / 2), (size.x, rail_depth, top_height), shell),
    add_panel("Computer_Tower_Bottom_Rail", (center.x, front_y, lower.z + bottom_height / 2), (size.x, rail_depth, bottom_height), shell),
]
window_width = size.x - side_width * 2
window_height = size.z - top_height - bottom_height
styled_parts.append(
    add_panel(
        "Computer_Tower_Smoked_Window",
        (center.x, front_y - 0.009, lower.z + bottom_height + window_height / 2),
        (window_width, 0.006, window_height),
        glass,
        bevel=0.002,
    )
)
for obj in styled_parts:
    world = obj.matrix_world.copy()
    obj.parent = case_root
    obj.matrix_world = world

for obj in bpy.context.scene.objects:
    obj.select_set(False)
for obj in [case_root, *case_root.children_recursive]:
    obj.select_set(True)

bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))
bpy.ops.export_scene.gltf(
    filepath=str(OUT_GLB),
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
)

triangles = sum(len(obj.data.polygons) for obj in case_root.children_recursive if obj.type == "MESH")
print("COMPUTER_CASE_PRODUCTION", {"triangles": triangles, "glb": str(OUT_GLB)})
