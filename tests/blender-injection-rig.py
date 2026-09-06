"""Verify real Blender driver evaluation and clamp linkage; does not save changes."""
import bpy
from pathlib import Path

root = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/equipment/injection-motion.blend'))
rig = bpy.data.objects['MachineControls']
rig.animation_data_clear()

def pose(screw, angle, mold, eject):
    for key, value in zip(('screw_retraction', 'screw_rotation_deg', 'mold_opening', 'ejector_extension'),
                          (screw, angle, mold, eject)):
        rig[key] = value
    rig.update_tag()
    bpy.context.view_layer.update()

def value(name, channel, index=0):
    evaluated = bpy.data.objects[name].evaluated_get(bpy.context.evaluated_depsgraph_get())
    return getattr(evaluated, channel)[index]

def close(a, b):
    assert abs(a-b)<1e-5, (a, b)

pose(100, 90, 0, 100)
close(value('ScrewSlide', 'location'), -.65)
close(value('ScrewSpin', 'rotation_euler'), -1.57079632679)
close(value('Ejector', 'location'), 0)
pose(0, 0, 100, 100)
close(value('MovingMold', 'location'), 1.10)
close(value('Ejector', 'location'), -.32)
rod_center, rod_length = value('ClampRod', 'location'), value('ClampRod', 'scale')
close(rod_center-rod_length/2, 2.70)
close(rod_center+rod_length/2, 3.45)
pose(0, 0, 0, 0)
close(value('ClampRod', 'location')+value('ClampRod', 'scale')/2, 3.45)
close(value('MeltReservoir', 'scale'), .09)
assert len([obj for obj in bpy.data.objects if 'socket bolt' in obj.name]) == 4
for obj in bpy.data.objects:
    if 'socket bolt' in obj.name:
        assert .10 < max(obj.dimensions) < .50, tuple(obj.dimensions)
from mathutils import Vector
core = bpy.data.objects['Screw core']
center = sum((core.matrix_world @ Vector(corner) for corner in core.bound_box), Vector())/8
close(center.z, 1.30)
print('BLENDER_RIG_CHECKS_PASSED: drivers, stroke limits, ejector interlock, clamp endpoints, BoltFactory geometry')
