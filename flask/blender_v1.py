import bpy, pathlib
import sys


# remove the initial cube that comes in blender projects
def remove_cube():
    if "Cube" in bpy.data.objects:
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
    

# convert the curves to meshes so they can be adjusted    
def convert_curves(C, curve):
     # Reference new object and make sure active
    o = C.scene.objects[ curve ]
    o.select_set(True)
    C.view_layer.objects.active = o
    
    bpy.ops.object.convert(target='MESH')
   
   
def main():
    print("starting job", str(sys.argv))
    #remove starting cube
    remove_cube()

    C = bpy.context

    # for use in blender
    #in_file = "miami_logo.svg"
    #dir_path = pathlib.Path.home() / "Documents" / "Coding" / "golf-marker" / "Modeling" / "v1"

    # for use in scripting
    in_file = sys.argv[4]
    scale = float(sys.argv[5])

    dir_path = pathlib.Path.cwd()
    image_path = dir_path / in_file
    stl_path = dir_path / "default.stl"

    if image_path.exists(): 
        # Get list of objects before importing
        names_pre_import = set([o.name for o in C.scene.objects])
        print("pre-import: ", str(names_pre_import))
        bpy.ops.import_curve.svg(filepath=str(image_path)) # import
        
        # Get name of new object
        names_post_import = set([ o.name for o in C.scene.objects ])
        print("post-import: ", str(names_post_import))
        
        cut_object = ""
        # if one new curve added
        if len(names_post_import) - len(names_pre_import) == 1:
            print("1 curve")
            
            # Reference new object and make sure active
            new_object_name = names_post_import.difference( names_pre_import ).pop()
            o = C.scene.objects[ new_object_name ]
            o.select_set(True)
            C.view_layer.objects.active = o

            # specify object name to cut with
            cut_object = new_object_name
            
        else:
            print("multi curve")
            
            # get list of new curves
            new_object_names = names_post_import.difference( names_pre_import )
            
            # loop through curves and convert to meshes for joining
            for curve_name in new_object_names:
                convert_curves(C, curve_name)
            
            # select all curves and join together
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.object.mode_set(mode='OBJECT')
            bpy.ops.object.join()
            
            # get name of joined curve and set the cut object
            names_post_join = set([ o.name for o in C.scene.objects ])
            joined_curve = names_post_join.difference(names_pre_import).pop()
            cut_object = joined_curve  

            # convert back to curves for extrusion
            bpy.ops.object.convert(target='CURVE')

        # center and scale curves up before extruding
        bpy.ops.object.origin_set(type='GEOMETRY_ORIGIN', center='MEDIAN')
        bpy.ops.transform.resize(value=(-60 * scale, -60 * scale, -60 * scale), orient_type='GLOBAL', orient_matrix=((1, 0, 0), (0, 1, 0), (0, 0, 1)), orient_matrix_type='GLOBAL', mirror=False, use_proportional_edit=False, proportional_edit_falloff='SMOOTH', proportional_size=1, use_proportional_connected=False, use_proportional_projected=False, snap=False, snap_elements={'INCREMENT'}, use_snap_project=False, snap_target='CLOSEST', use_snap_self=True, use_snap_edit=True, use_snap_nonedit=True, use_snap_selectable=False)
        bpy.context.object.data.extrude = 15
        bpy.ops.object.convert(target='MESH')

        # create the object to be exported as STL
        # import stl
        bpy.ops.wm.stl_import(filepath=str(stl_path))
        bpy.ops.object.origin_set(type='GEOMETRY_ORIGIN', center='MEDIAN')
        
        # cut imported curve out of STL
        bpy.ops.object.modifier_add(type='BOOLEAN')
        bpy.context.object.modifiers["Boolean"].object = bpy.data.objects[cut_object]
        bpy.context.object.modifiers["Boolean"].solver = 'FAST'    

        # Hide the SVG object
        o = C.scene.objects[ cut_object ]
        o.hide_viewport = True

        # Download the file as STL
        out_file = sys.argv[4][2:-4] + ".stl" 
        #out_file = "miami_logo_manual.stl"
        download_path = dir_path / out_file 
        bpy.ops.wm.stl_export(filepath=str(download_path).replace("svg", "stl"))
    else:
        print("path not found")
        

if __name__ == "__main__":
    main()
