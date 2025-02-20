import bpy
import pathlib
import sys
import io
import tempfile

def export_stl_to_memory():
    # Create a temporary file for exporting STL
    with tempfile.NamedTemporaryFile(suffix=".stl", delete=False) as tmp_file:
        tmp_filepath = tmp_file.name
        
    # Use bpy.ops.wm.export_stl to export to the temporary file
    bpy.ops.wm.stl_export(filepath=tmp_filepath)
    
    # Read the STL file from the temporary file into memory
    with open(tmp_filepath, "rb") as f:
        stl_data = io.BytesIO(f.read())
    
    # Remove the temporary file after reading
    pathlib.Path(tmp_filepath).unlink()
    
    stl_data.seek(0)  # Rewind to the beginning for reading
    return stl_data

def remove_cube():
    if "Cube" in bpy.data.objects:
        cube = bpy.data.objects["Cube"]
        bpy.data.objects.remove(cube, do_unlink=True)

def delete_bottom():
    threshold = 0
    bpy.ops.object.mode_set(mode='OBJECT')
    me = bpy.context.active_object.data
    for vert in me.vertices:
        vert.select = vert.co.z < threshold
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.delete(type='VERT')
    bpy.ops.object.mode_set(mode='OBJECT')

def add_semi_sphere(cut_mesh_name) -> None:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=21.4)
    bpy.ops.object.modifier_add(type='SOLIDIFY')
    bpy.context.object.modifiers["Solidify"].thickness = -1.2
    delete_bottom()
    bpy.ops.object.modifier_add(type='BOOLEAN')
    bpy.context.object.modifiers["Boolean"].object = bpy.data.objects[cut_mesh_name]
    bpy.context.object.modifiers["Boolean"].solver = 'FAST'

def convert_curves(C, curve):
    o = C.scene.objects[curve]
    o.select_set(True)
    C.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH')

def main():
    remove_cube()
    C = bpy.context
    in_file = sys.argv[-2]
    scale = float(sys.argv[-1])

    dir_path = pathlib.Path.cwd()
    image_path = dir_path / in_file

    if image_path.exists():
        names_pre_import = set([o.name for o in C.scene.objects])
        bpy.ops.import_curve.svg(filepath=str(image_path))

        names_post_import = set([o.name for o in C.scene.objects])
        cut_object = ""
        if len(names_post_import) - len(names_pre_import) == 1:
            new_object_name = names_post_import.difference(names_pre_import).pop()
            o = C.scene.objects[new_object_name]
            o.select_set(True)
            C.view_layer.objects.active = o
            cut_object = new_object_name
        else:
            new_object_names = names_post_import.difference(names_pre_import)
            for curve_name in new_object_names:
                convert_curves(C, curve_name)
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.object.mode_set(mode='OBJECT')
            bpy.ops.object.join()
            names_post_join = set([o.name for o in C.scene.objects])
            joined_curve = names_post_join.difference(names_pre_import).pop()
            cut_object = joined_curve
            bpy.ops.object.convert(target='CURVE')

        bpy.ops.object.origin_set(type='GEOMETRY_ORIGIN', center='MEDIAN')
        bpy.ops.transform.resize(value=(-60 * scale, -60 * scale, -60 * scale))
        bpy.context.object.data.extrude = 15
        bpy.ops.object.convert(target='MESH')

        add_semi_sphere(cut_object)
        o = C.scene.objects[cut_object]
        o.hide_viewport = True

        stl_file = export_stl_to_memory()  # Export STL to memory
        sys.stdout.buffer.write(stl_file.read())
    else:
        print("path not found")
        sys.exit(1)

if __name__ == "__main__":
    main()