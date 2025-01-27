import bpy, os, pathlib
from typing import List
import sys


def remove_cube():
    if "Cube" in bpy.data.objects:
        print("found cube")
        # Get the cube object
        cube = bpy.data.objects["Cube"]

        # Delete the cube
        bpy.data.objects.remove(cube, do_unlink=True)


# method that turns the sphere into a semi-sphere  
def delete_bottom():
    threshold = 0

    # deselect all vertices
    bpy.ops.object.mode_set(mode='OBJECT')  # can change selection only in Object mode
    me = bpy.context.active_object.data
    for face in me.polygons:  # you also have to deselect faces and edges
        face.select = False
    for edge in me.edges:
        edge.select = False
    for vert in me.vertices:
        vert.select = vert.co.z < threshold  # select vertices that are below the threshold
        
    # enter edit mode and delete vertices
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.delete(type='VERT')
    bpy.ops.object.mode_set(mode='OBJECT')


# method that generates a semi-sphere with the SVG cut out
def add_semi_sphere(
) -> None:
    # create the sphere
    bpy.ops.mesh.primitive_uv_sphere_add(radius=23.3)
    
    # Add Solidify modifier for thickness
    bpy.ops.object.modifier_add(type='SOLIDIFY')
    bpy.context.object.modifiers["Solidify"].thickness = -2
    delete_bottom() 
    
    # Add Boolean modifier to cut out the SVG shape
    bpy.ops.object.modifier_add(type='BOOLEAN')
    bpy.context.object.modifiers["Boolean"].object = bpy.data.objects["svg"]
    bpy.context.object.modifiers["Boolean"].solver = 'FAST'
   
   
def main():
    print("starting job", str(sys.argv))
    #remove starting cube
    remove_cube()

    C = bpy.context

    #image_path = pathlib.Path.home() / "Documents" / "Coding" / "golf-marker" / "Modeling" / "v1" / "miami_logo.svg"
    image_path = pathlib.Path.cwd() / sys.argv[4]

    if image_path.exists(): 
        print("path exists")   
        # Get list of objects before importing
        names_pre_import = set([o.name for o in C.scene.objects])
        print("pre-import: ", str(names_pre_import))
        bpy.ops.import_curve.svg(filepath=str(image_path)) # import
        
        # Get name of new object
        names_post_import = set([ o.name for o in C.scene.objects ])
        new_object_name = names_post_import.difference( names_pre_import ).pop()
        print("post-import: ", str(names_post_import))
        
        # Reference new object and make sure active
        o = C.scene.objects[ new_object_name ]
        o.select_set(True)
        C.view_layer.objects.active = o
        
        print("scale")
        # Move SVG to origin and scale up
        bpy.ops.object.origin_set(type='GEOMETRY_ORIGIN', center='MEDIAN')
        bpy.ops.transform.resize(value=(-300, -300, -300), orient_type='GLOBAL', orient_matrix=((1, 0, 0), (0, 1, 0), (0, 0, 1)), orient_matrix_type='GLOBAL', mirror=False, use_proportional_edit=False, proportional_edit_falloff='SMOOTH', proportional_size=1, use_proportional_connected=False, use_proportional_projected=False, snap=False, snap_elements={'INCREMENT'}, use_snap_project=False, snap_target='CLOSEST', use_snap_self=True, use_snap_edit=True, use_snap_nonedit=True, use_snap_selectable=False)
        bpy.context.object.data.extrude = 12.5
        bpy.ops.object.convert(target='MESH')
        
        # create the shape of the objh
        add_semi_sphere()
        print("sphere made")
        # Hide the SVG object
        o = C.scene.objects[ new_object_name ]
        o.hide_viewport = True

        # Download the file as STL
        print("ready for download")
        file_name = sys.argv[4].split(".", 1)[0] + ".stl" 
        download_path = pathlib.Path.cwd() / file_name 
        bpy.ops.wm.stl_export(filepath=str(download_path))
    else:
        print("path not found")
        

if __name__ == "__main__":
    main()
