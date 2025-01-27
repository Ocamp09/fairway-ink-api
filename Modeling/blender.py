import bpy, os, pathlib
from typing import List

#def clear_shapes():
#    bpy.ops.object.mode_set(mode='EDIT')
#    bpy.ops.mesh.select_all(action='SELECT')
#    bpy.ops.mesh.delete()
    
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
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.213)
    
    # Add Solidify modifier for thickness
    bpy.ops.object.modifier_add(type='SOLIDIFY')
    bpy.context.object.modifiers["Solidify"].thickness = -0.02
    delete_bottom() 
    
    # Add Boolean modifier to cut out the SVG shape
    bpy.ops.object.modifier_add(type='BOOLEAN')
    bpy.context.object.modifiers["Boolean"].object = bpy.data.objects["svg"]
    bpy.context.object.modifiers["Boolean"].solver = 'FAST'
   
   
def main():
    C = bpy.context
    
    image_path = pathlib.Path.home() / "Documents" / "Blender" / "ghost.svg"
    if image_path.exists():    
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
        
        # Move SVG to origin and scale up
        bpy.ops.object.origin_set(type='GEOMETRY_ORIGIN', center='MEDIAN')
        bpy.ops.transform.resize(value=(-3, -3, -3), orient_type='GLOBAL', orient_matrix=((1, 0, 0), (0, 1, 0), (0, 0, 1)), orient_matrix_type='GLOBAL', mirror=False, use_proportional_edit=False, proportional_edit_falloff='SMOOTH', proportional_size=1, use_proportional_connected=False, use_proportional_projected=False, snap=False, snap_elements={'INCREMENT'}, use_snap_project=False, snap_target='CLOSEST', use_snap_self=True, use_snap_edit=True, use_snap_nonedit=True, use_snap_selectable=False)
        bpy.context.object.data.extrude = 0.125
        bpy.ops.object.convert(target='MESH')
        
        # create the shape of the objh
        add_semi_sphere()
        
        # Hide the SVG object
        o = C.scene.objects[ new_object_name ]
        o.hide_viewport = True

        # Download the file as STL
        download_path = pathlib.Path.home() / "Documents" / "Blender" / "marker.stl" 
        bpy.ops.wm.stl_export(filepath=str(download_path))
        

if __name__ == "__main__":
    main()
