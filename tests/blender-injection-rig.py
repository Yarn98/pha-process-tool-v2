"""Verify real Blender driver/constraint evaluation of the injection rig; does not save changes.

blender -b --factory-startup --python-exit-code 1 --python tests/blender-injection-rig.py
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root / 'assets/equipment/injection-motion.blend'))
rig = bpy.data.objects['MachineControls']
rig.animation_data_clear()
meta = json.loads(rig['pha_machine'])
strokes = meta['strokes_m']
links = meta['toggle']


def pose(**values):
    for key in ('screw_retraction', 'screw_rotation_deg', 'mold_opening', 'ejector_extension', 'carriage_retraction',
                'check_ring_open'):
        rig[key] = float(values.get(key, 0))
    rig.update_tag()
    bpy.context.view_layer.update()


def world(name, local=(0, 0, 0)):
    obj = bpy.data.objects[name].evaluated_get(bpy.context.evaluated_depsgraph_get())
    return obj.matrix_world @ Vector(local)


def loc(name, index=0):
    return bpy.data.objects[name].evaluated_get(bpy.context.evaluated_depsgraph_get()).location[index]


def close(a, b, tol=1e-5):
    assert abs(a - b) < tol, (a, b)


def linkage_gap():
    gaps = []
    for tag in ('Upper', 'Lower'):
        gaps.append((world('ToggleFront' + tag, (links['L2'], 0, 0)) - world('ToggleKnee' + tag)).length)
        gaps.append((world('ToggleCrossLink' + tag, (links['L3'], 0, 0)) - world('ToggleCrossPin' + tag)).length)
    return max(gaps)


# Screw drive: retraction stroke, negative rotation about +X (conveys toward the nozzle).
pose(screw_retraction=100, screw_rotation_deg=90)
close(loc('ScrewSlide'), -strokes['screw'])
close(bpy.data.objects['ScrewSpin'].evaluated_get(bpy.context.evaluated_depsgraph_get()).rotation_euler[0], -math.pi / 2)
close(bpy.data.objects['MeltReservoir'].evaluated_get(bpy.context.evaluated_depsgraph_get()).scale[0],
      strokes['cushion'] + strokes['screw'])

# Ejector interlock: no ejection while the mold is closed.
pose(mold_opening=0, ejector_extension=100)
close(loc('Ejector'), 0)
pose(mold_opening=100, ejector_extension=100)
close(loc('MovingMold'), strokes['mold'])
close(loc('Ejector'), -strokes['ejector'])

# Toggle: links stay pinned across the stroke; crosshead retreats monotonically and the
# upper/lower knees never cross the machine axis.
axis_z = world('Crosshead').z
previous = None
for m in range(0, 101, 5):
    pose(mold_opening=m)
    assert linkage_gap() < 2e-4, ('toggle gap', m, linkage_gap())
    x = world('Crosshead').x
    assert previous is None or x > previous, ('crosshead not monotonic', m)
    previous = x
    assert world('ToggleKneeUpper').z > axis_z + .04 and world('ToggleKneeLower').z < axis_z - .04, ('knee', m)
pose(mold_opening=0)
locked_angle = (world('ToggleKneeUpper') - world('ToggleRearUpper')).angle(world('ToggleFrontUpper') - world('ToggleKneeUpper'))
assert math.degrees(locked_angle) < 5, ('toggle should be nearly straight when locked', math.degrees(locked_angle))

# Screw handedness: the flight helix advances +X with increasing +Y->+Z angle (right-hand),
# so negative rotation about +X conveys melt toward the nozzle.
screw = bpy.data.objects['Screw']
assert screw.parent.name == 'ScrewSpin'
xs = [v.co.x for v in screw.data.vertices]
assert max(xs) - min(xs) > meta['spec']['screw_d_m'] * meta['spec']['screw_ld'] * .95

# Sliding check ring: axial travel only, open while dosing.
pose(check_ring_open=100)
assert 0.002 < loc('CheckRing') < .005, loc('CheckRing')

# Carriage: nozzle touch stroke moves the whole injection unit.
pose(carriage_retraction=100)
close(loc('Carriage'), -strokes['carriage'])
pose()
print('BLENDER_RIG_CHECKS_PASSED: drivers, strokes, ejector interlock, five-point toggle closure, '
      'crosshead monotonicity, straight lock, screw length, check ring, carriage')
