"""Reusable Blender parts and PBR materials for the PHA equipment models.

Imported by ``scripts/create_*.py`` inside Blender. Units are metres, Z is up,
X is the process axis and -Y is the operator side that faces the default web
camera. Parts are brand-neutral teaching representations; a caller documents
which dimensions are sourced and which are illustrative.
"""
import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector

TAU = math.tau


# --------------------------------------------------------------------------- scene

def reset_scene(name):
    """Empty the startup scene and set metric units."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.actions):
        for item in list(block):
            block.remove(item)
    scene = bpy.context.scene
    scene.name = name
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    return scene


def collection():
    return bpy.context.scene.collection


def link(obj, parent=None, keep_world=False):
    collection().objects.link(obj)
    if parent is not None:
        if keep_world:
            bpy.context.view_layer.update()
            world = obj.matrix_world.copy()
            obj.parent = parent
            obj.matrix_world = world
        else:
            obj.parent = parent
    return obj


def empty(name, location=(0, 0, 0), parent=None, group=None, size=.12):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_size = size
    obj.location = location
    link(obj, parent)
    if group:
        obj['motion_group'] = group
    return obj


def reparent(obj, parent):
    """Parent while preserving the current world transform."""
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world
    return obj


# ------------------------------------------------------------------------ materials

def srgb(hex_or_tuple):
    """Convert an sRGB colour (hex string or 0-255 tuple) to linear floats."""
    if isinstance(hex_or_tuple, str):
        value = hex_or_tuple.lstrip('#')
        rgb = [int(value[i:i + 2], 16) for i in (0, 2, 4)]
    else:
        rgb = list(hex_or_tuple)

    def channel(c):
        c = c / 255
        return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    return tuple(channel(c) for c in rgb)


_MATERIALS = {}


def material(name, color, metallic=0.0, roughness=.5, alpha=1.0, emission=None,
             emission_strength=0.0, coat=0.0):
    """Principled material whose values survive glTF export (no procedural maps)."""
    if name in _MATERIALS:
        return _MATERIALS[name]
    mat = bpy.data.materials.new(name)
    base = srgb(color) if not isinstance(color, tuple) or max(color) > 1 else color
    mat.diffuse_color = (*base, alpha)
    mat.metallic = metallic
    mat.roughness = roughness
    try:
        mat.use_nodes = True
    except AttributeError:
        pass
    shader = mat.node_tree.nodes.get('Principled BSDF')
    values = {'Base Color': (*base, 1), 'Metallic': metallic, 'Roughness': roughness,
              'Alpha': alpha, 'Coat Weight': coat}
    if emission is not None:
        values['Emission Color'] = (*srgb(emission), 1)
        values['Emission Strength'] = emission_strength
    for key, value in values.items():
        socket = shader.inputs.get(key)
        if socket is not None:
            socket.default_value = value
    if alpha < 1:
        for attr, value in (('surface_render_method', 'BLENDED'), ('blend_method', 'BLEND')):
            try:
                setattr(mat, attr, value)
            except (AttributeError, TypeError):
                pass
        mat.use_backface_culling = False
    _MATERIALS[name] = mat
    return mat


def palette():
    """Shared brand-neutral industrial palette. Values are sRGB, PBR metal/rough."""
    return {
        'paint': material('Paint / light machine grey', '#D3D3CC', 0, .46, coat=.25),
        'paint_accent': material('Paint / forest green', '#2E5E43', 0, .42, coat=.3),
        'paint_dark': material('Paint / anthracite base', '#34393B', 0, .58),
        'steel': material('Steel / machined', '#C3C6C7', 1, .36),
        'steel_dark': material('Steel / blackened', '#4A4E52', .85, .48),
        'stainless': material('Steel / brushed stainless', '#C9CACA', 1, .38),
        'chrome': material('Steel / hard chrome', '#E6E8EA', 1, .07),
        'cast': material('Cast iron / painted grey', '#7A7F80', .2, .62),
        'heater': material('Heater band / stainless mica', '#A7A39A', .75, .45),
        'ceramic': material('Heater band / ceramic', '#D8CFBD', 0, .78),
        'brass': material('Brass / fittings', '#C9A15B', 1, .32),
        'copper': material('Copper / thermocouple', '#C27A4A', 1, .35),
        'rubber': material('Rubber / black hose', '#1E1F21', 0, .82),
        'hose_blue': material('Hose / cooling supply blue', '#2D5F9E', 0, .6),
        'hose_red': material('Hose / cooling return red', '#A83A32', 0, .6),
        'cable': material('Cable / grey jacket', '#5B5F63', 0, .7),
        'glass': material('Polycarbonate / guard window', '#DDE6E6', 0, .02, alpha=.07),
        'smoked': material('Polycarbonate / smoked', '#9AA7A8', 0, .06, alpha=.28),
        'screen': material('Display / HMI glass', '#0F1D1A', 0, .12, emission='#203C34',
                           emission_strength=1.2),
        'screen_bar': material('Display / HMI bar', '#5DAA82', 0, .3, emission='#5DAA82',
                               emission_strength=2.0),
        'estop': material('Button / emergency stop red', '#C1271D', 0, .35),
        'estop_base': material('Button / emergency stop yellow', '#E7B416', 0, .45),
        'lamp_red': material('Lamp / red', '#C72B22', 0, .25, alpha=.92),
        'lamp_amber': material('Lamp / amber', '#E39B19', 0, .25, alpha=.92),
        'lamp_green': material('Lamp / green', '#2E9E57', 0, .25, alpha=.92),
        'warning': material('Label / safety yellow', '#E8B612', 0, .5),
        'black': material('Plastic / black', '#141516', 0, .55),
        'section': material('Section cut / terracotta', '#9A4F24', 0, .7),
        'polymer': material('Polymer / sage green', '#3E8C5A', 0, .35),
        'polymer_marker': material('Polymer / bright marker', '#7FD39A', 0, .3,
                                   emission='#3E8C5A', emission_strength=.4),
        'pellet': material('Polymer / natural pellet', '#C9C2A4', 0, .45),
        'floor': material('Floor / epoxy grey', '#B9B7AE', 0, .8),
        'floor_line': material('Floor / safety line', '#D9A914', 0, .7),
    }


# ------------------------------------------------------------------- mesh plumbing

def _finish(name, bm, mat=None, parent=None, smooth_angle=None, location=None):
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    if smooth_angle is not None:
        for poly in mesh.polygons:
            poly.use_smooth = True
        try:
            mesh.set_sharp_from_angle(angle=smooth_angle)
        except AttributeError:
            pass
    obj = bpy.data.objects.new(name, mesh)
    if mat is not None:
        mesh.materials.append(mat)
    if location is not None:
        obj.location = location
    return link(obj, parent)


AXES = {'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(-math.pi / 2, 4, 'X'),
        'Z': Matrix.Identity(4)}


def box(name, center, size, mat=None, parent=None, bevel=.004, segments=1):
    """Axis-aligned box from centre and full size; small chamfer catches highlights."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(center), verts=bm.verts)
    if bevel and min(size) > 2.5 * bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, offset_type='OFFSET',
                        segments=segments, profile=.5, affect='EDGES', clamp_overlap=True)
    return _finish(name, bm, mat, parent)


def span_box(name, lo, hi, mat=None, parent=None, bevel=.004):
    lo, hi = Vector(lo), Vector(hi)
    return box(name, (lo + hi) / 2, hi - lo, mat, parent, bevel)


def cylinder(name, center, radius, length, axis='X', mat=None, parent=None, segments=32,
             radius2=None, smooth=True):
    """Cylinder or frustum centred on ``center`` along a principal axis."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segments, radius1=radius,
                          radius2=radius if radius2 is None else radius2, depth=length,
                          matrix=Matrix.Translation(Vector(center)) @ AXES[axis])
    return _finish(name, bm, mat, parent, smooth_angle=math.radians(40) if smooth else None)


def between(name, a, b, radius, mat=None, parent=None, segments=16, radius2=None):
    """Cylinder whose axis runs from point ``a`` to point ``b``."""
    a, b = Vector(a), Vector(b)
    direction = b - a
    rot = direction.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segments, radius1=radius,
                          radius2=radius if radius2 is None else radius2, depth=direction.length,
                          matrix=Matrix.Translation((a + b) / 2) @ rot)
    return _finish(name, bm, mat, parent, smooth_angle=math.radians(40))


def ring(name, x0, x1, r_in, r_out, center=(0, 0), mat=None, parent=None, segments=48,
         arc=(0, TAU), cap_mat=None):
    """Hollow cylinder (or partial arc) along X between x0 and x1.

    ``center`` is the (y, z) of the axis. With a partial ``arc`` the exposed cut
    faces receive ``cap_mat`` (e.g. the section colour) for a cutaway look.
    Angles are measured from +Y toward +Z.
    """
    full = abs(arc[1] - arc[0] - TAU) < 1e-6
    n = segments if full else max(4, int(segments * (arc[1] - arc[0]) / TAU))
    count = n if full else n + 1
    angles = [arc[0] + (arc[1] - arc[0]) * i / n for i in range(count)]
    bm = bmesh.new()
    rings = []
    for x, r in ((x0, r_in), (x1, r_in), (x0, r_out), (x1, r_out)):
        rings.append([bm.verts.new((x, center[0] + r * math.cos(a), center[1] + r * math.sin(a)))
                      for a in angles])
    inner0, inner1, outer0, outer1 = rings
    faces = []
    for i in range(n):
        j = (i + 1) % count
        faces.append((bm.faces.new((inner0[j], inner1[j], inner1[i], inner0[i])), 'side'))
        faces.append((bm.faces.new((outer0[i], outer1[i], outer1[j], outer0[j])), 'side'))
        faces.append((bm.faces.new((inner0[i], outer0[i], outer0[j], inner0[j])), 'end'))
        faces.append((bm.faces.new((inner1[j], outer1[j], outer1[i], inner1[i])), 'end'))
    if not full:
        for k in (0, count - 1):
            face = bm.faces.new((inner0[k], inner1[k], outer1[k], outer0[k]))
            faces.append((face, 'cut'))
    for face, kind in faces:
        face.material_index = 1 if (kind == 'cut' and cap_mat is not None) else 0
        face.smooth = kind == 'side'
    bmesh.ops.recalc_face_normals(bm, faces=[f for f, _ in faces])
    obj = _finish(name, bm, mat, parent)
    if cap_mat is not None:
        obj.data.materials.append(cap_mat)
    return obj


def hexagon(name, center, across_flats, length, axis='X', mat=None, parent=None):
    """Hexagonal prism (nuts, socket recesses) with a light edge chamfer."""
    radius = across_flats / math.sqrt(3)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=radius, radius2=radius, depth=length,
                          matrix=Matrix.Translation(Vector(center)) @ AXES[axis] @
                          Matrix.Rotation(math.pi / 6, 4, 'Z'))
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(length, across_flats) * .06, segments=1,
                    affect='EDGES', clamp_overlap=True)
    return _finish(name, bm, mat, parent)


def cap_screw(name, center, axis='X', d=.016, sign=1, mat=None, parent=None):
    """Socket-head cap screw head (ISO 4762 proportions: head Ø1.5d, height d)."""
    head = cylinder(name, center, .75 * d, d, axis, mat, parent, segments=20)
    offset = Vector({'X': (1, 0, 0), 'Y': (0, 1, 0), 'Z': (0, 0, 1)}[axis]) * sign * (d * .5 + .0005)
    socket = hexagon(name + ' socket', Vector(center) + offset * .98, .43 * d, .002, axis,
                     palette()['black'], parent)
    return join([head, socket], name)


def nut(name, center, axis='X', thread_d=.08, height=None, mat=None, parent=None):
    """Hex nut sized from thread diameter (across flats ~1.5d, height ~0.8d)."""
    return hexagon(name, center, 1.5 * thread_d, height or .8 * thread_d, axis, mat, parent)


def tube_path(name, points, radius, mat=None, parent=None, resolution=6, bevel_resolution=3,
              smooth=True):
    """Sweep a circle along a smooth path through ``points`` (hoses, cables, pipes)."""
    curve = bpy.data.curves.new(name + ' path', 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = bevel_resolution
    curve.use_fill_caps = True
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for point, co in zip(spline.bezier_points, points):
        point.co = co
        point.handle_left_type = point.handle_right_type = 'AUTO'
    holder = bpy.data.objects.new(name + ' curve', curve)
    collection().objects.link(holder)
    bpy.context.view_layer.update()
    mesh = bpy.data.meshes.new_from_object(holder.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(holder, do_unlink=True)
    bpy.data.curves.remove(curve)
    mesh.name = name
    if smooth:
        for poly in mesh.polygons:
            poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    if mat is not None:
        mesh.materials.clear()
        mesh.materials.append(mat)
    return link(obj, parent)


def hose(name, a, b, radius, mat, sag=.12, parent=None, bulge=(0, 0, 0)):
    """Flexible hose hanging between two fittings."""
    a, b = Vector(a), Vector(b)
    mid = (a + b) / 2 + Vector((0, 0, -sag)) + Vector(bulge)
    return tube_path(name, [a, a.lerp(mid, .55), mid, b.lerp(mid, .55), b], radius, mat, parent)


def join(objects, name):
    """Join meshes (keeps material slots). Reduces draw calls in the web viewer."""
    objects = [o for o in objects if o is not None and o.type == 'MESH']
    if not objects:
        return None
    if len(objects) == 1:
        objects[0].name = name
        return objects[0]
    target = objects[0]
    with bpy.context.temp_override(active_object=target, object=target,
                                   selected_objects=objects, selected_editable_objects=objects):
        bpy.ops.object.join()
    target.name = name
    target.data.name = name
    return target


def boolean_cut(obj, center, size, cap_mat=None):
    """Remove a box region from ``obj``; new cut faces take the section material."""
    cutter = box(obj.name + ' cutter', center, size, cap_mat or palette()['section'], bevel=0)
    mod = obj.modifiers.new('Cutaway', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    mod.solver = 'EXACT'
    mod.material_mode = 'TRANSFER'
    with bpy.context.temp_override(object=obj, active_object=obj):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return obj


# ---------------------------------------------------------------------- components

def plate_with_holes(name, x0, x1, half_w, half_h, holes, z_axis, mat, face_mat=None,
                     hole_r=.045, parent=None, bevel=.01):
    """Platen-like plate on the YZ plane with round through holes (tie bars)."""
    body = box(name, ((x0 + x1) / 2, 0, z_axis), (x1 - x0, 2 * half_w, 2 * half_h), mat, parent,
               bevel=bevel, segments=2)
    for i, (y, z) in enumerate(holes):
        cutter = cylinder(name + ' hole %d' % i, ((x0 + x1) / 2, y, z), hole_r, (x1 - x0) * 1.4,
                          'X', face_mat or mat)
        mod = body.modifiers.new('Hole %d' % i, 'BOOLEAN')
        mod.operation, mod.object, mod.solver = 'DIFFERENCE', cutter, 'EXACT'
        with bpy.context.temp_override(object=body, active_object=body):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter, do_unlink=True)
    return body


def heater_band(name, x, radius, width, mat, terminal_mat, center=(0, 0), parent=None,
                angle=math.pi / 2, cap_mat=None, arc=(0, TAU)):
    """Clamp-on band heater with terminal box at ``angle`` (from +Y toward +Z)."""
    y0, z0 = center
    band = ring(name, x - width / 2, x + width / 2, radius, radius + .012, center, mat, arc=arc,
                cap_mat=cap_mat)
    ty, tz = math.cos(angle), math.sin(angle)
    terminal = box(name + ' terminal', (x, y0 + (radius + .03) * ty, z0 + (radius + .03) * tz),
                   (width * .7, .036, .036), terminal_mat, bevel=.003)
    clamp = box(name + ' clamp', (x, y0 - (radius + .016) * ty, z0 - (radius + .016) * tz),
                (width * .5, .02, .02), mat, bevel=.002)
    obj = join([band, terminal, clamp], name)
    if parent is not None:
        obj.parent = parent
    return obj


def hydraulic_cylinder(name, start, end, bore_r, rod_r, mats, parent=None, rod_parent=None,
                       rod_length=None, ports=True, rod_inset=None):
    """Tie-rod hydraulic cylinder from ``start`` (cap end) to ``end`` (rod end) on X.

    Returns (body, rod). The rod reaches ``rod_length`` outward from ``end`` along +X or -X and
    ``rod_inset`` (default 0.6 of the body) back inside it; it is a separate object so a mechanism
    can move it. A rod that retracts by a stroke s needs rod_inset + s inside the body.
    """
    (x0, y, z), (x1, _, _) = start, end
    direction = 1 if x1 > x0 else -1
    length = abs(x1 - x0)
    mid = (x0 + x1) / 2
    parts = [cylinder(name + ' barrel', (mid, y, z), bore_r, length * .86, 'X', mats['paint_accent'])]
    for xc in (x0 + direction * length * .04, x1 - direction * length * .04):
        parts.append(box(name + ' end cap', (xc, y, z), (length * .08, bore_r * 2.4, bore_r * 2.4),
                         mats['steel_dark'], bevel=.004))
    for dy in (-1, 1):
        for dz in (-1, 1):
            parts.append(cylinder(name + ' tie rod', (mid, y + dy * bore_r * .98, z + dz * bore_r * .98),
                                  bore_r * .09, length, 'X', mats['steel'], segments=10))
    if ports:
        for xc in (x0 + direction * length * .1, x1 - direction * length * .1):
            parts.append(cylinder(name + ' port', (xc, y, z + bore_r * 1.3), bore_r * .22, bore_r * .5,
                                  'Z', mats['brass'], segments=12))
    body = join(parts, name)
    if parent is not None:
        body.parent = parent
    rod_length = rod_length or length * .9
    inset = length * .6 if rod_inset is None else rod_inset
    rod = cylinder(name + ' rod', (x1 + direction * (rod_length - inset) / 2, y, z),
                   rod_r, rod_length + inset, 'X', mats['chrome'], parent=rod_parent)
    return body, rod


def motor(name, center, radius, length, axis_dir, mats, parent=None, fins=12):
    """Totally enclosed fan-cooled motor (or hydraulic motor) along X.

    ``axis_dir`` is +1 when the output flange faces +X.
    """
    x, y, z = center
    parts = [cylinder(name + ' frame', center, radius, length, 'X', mats['paint_accent'])]
    for i in range(fins):
        fin = box(name + ' fin', (0, radius + .008, 0), (length * .86, .014, .012), mats['paint_accent'],
                  bevel=0)
        fin.location = center
        fin.rotation_euler.x = TAU * i / fins
        parts.append(fin)
    parts.append(cylinder(name + ' fan cover', (x - axis_dir * (length / 2 + .04), y, z), radius * .98,
                          .08, 'X', mats['steel_dark']))
    for r in (radius * .35, radius * .6, radius * .85):
        parts.append(ring(name + ' grille', x - axis_dir * (length / 2 + .086),
                          x - axis_dir * (length / 2 + .079), r, r + .006, (y, z), mats['black'],
                          segments=24))
    parts.append(box(name + ' terminal box', (x, y, z + radius + .045), (length * .3, radius * .7, .07),
                     mats['paint_accent'], bevel=.006))
    parts.append(cylinder(name + ' flange', (x + axis_dir * (length / 2 + .015), y, z), radius * 1.05,
                          .03, 'X', mats['steel_dark']))
    obj = join(parts, name)
    if parent is not None:
        obj.parent = parent
    return obj


def drying_hopper(name, x, y, z_flange, mats, parent=None, radius=.19):
    """Insulated drying hopper with slide gate, sight glass and loader on the lid."""
    p = []
    p.append(box(name + ' slide gate', (x, y, z_flange + .025), (.2, .2, .05), mats['steel_dark']))
    p.append(box(name + ' magnet drawer', (x, y - .12, z_flange + .025), (.08, .05, .035), mats['black']))
    p.append(cylinder(name + ' neck', (x, y, z_flange + .09), .06, .08, 'Z', mats['stainless']))
    p.append(cylinder(name + ' cone', (x, y, z_flange + .22), .065, .18, 'Z', mats['stainless'],
                      radius2=radius, segments=40))
    body_h = .5
    zb = z_flange + .31 + body_h / 2
    p.append(cylinder(name + ' insulated body', (x, y, zb), radius, body_h, 'Z', mats['stainless'],
                      segments=40))
    for dz in (-.2, 0, .2):
        p.append(cylinder(name + ' band', (x, y, zb + dz), radius + .006, .014, 'Z', mats['steel'],
                          segments=40))
    p.append(box(name + ' sight glass', (x, y - radius - .002, zb - .05), (.035, .006, .3), mats['smoked'],
                 bevel=.002))
    p.append(cylinder(name + ' lid', (x, y, zb + body_h / 2 + .02), radius * 1.04, .04, 'Z', mats['steel']))
    p.append(cylinder(name + ' loader', (x, y, zb + body_h / 2 + .17), .09, .26, 'Z', mats['stainless'],
                      segments=28))
    p.append(cylinder(name + ' loader cap', (x, y, zb + body_h / 2 + .32), .1, .04, 'Z', mats['steel_dark']))
    p.append(cylinder(name + ' dry air inlet', (x, y + radius + .03, zb - .18), .03, .07, 'Y', mats['steel']))
    p.append(cylinder(name + ' air return', (x, y + radius + .03, zb + .2), .03, .07, 'Y', mats['steel']))
    obj = join(p, name)
    if parent is not None:
        obj.parent = parent
    top = zb + body_h / 2 + .34
    return obj, {'inlet': (x, y + radius + .07, zb - .18), 'return': (x, y + radius + .07, zb + .2),
                 'loader': (x, y + .09, top - .1), 'top': top}


def guard_panel(name, x0, x1, z0, z1, y, mats, parent=None, window=True, handle=False,
                frame=.035, depth=.03):
    """Interlocked guard: painted frame with a polycarbonate window."""
    p = []
    for zc, h in ((z0 + frame / 2, frame), (z1 - frame / 2, frame)):
        p.append(box(name + ' rail', ((x0 + x1) / 2, y, zc), (x1 - x0, depth, h), mats['paint'], bevel=.004))
    for xc in (x0 + frame / 2, x1 - frame / 2):
        p.append(box(name + ' stile', (xc, y, (z0 + z1) / 2), (frame, depth, z1 - z0), mats['paint'],
                     bevel=.004))
    if window:
        p.append(box(name + ' window', ((x0 + x1) / 2, y, (z0 + z1) / 2),
                     (x1 - x0 - frame * 1.6, .006, z1 - z0 - frame * 1.6), mats['glass'], bevel=0))
    else:
        p.append(box(name + ' sheet', ((x0 + x1) / 2, y, (z0 + z1) / 2),
                     (x1 - x0 - frame, .004, z1 - z0 - frame), mats['paint'], bevel=0))
    if handle:
        side = -1 if y < 0 else 1
        hx = x0 + .09
        p.append(between(name + ' handle', (hx, y + side * .05, (z0 + z1) / 2 - .16),
                         (hx, y + side * .05, (z0 + z1) / 2 + .16), .012, mats['steel']))
        for dz in (-.16, .16):
            p.append(box(name + ' handle post', (hx, y + side * .03, (z0 + z1) / 2 + dz), (.02, .04, .02),
                         mats['steel'], bevel=.002))
    obj = join(p, name)
    if parent is not None:
        obj.parent = parent
    return obj


def stack_light(name, base, mats, parent=None, segments=('lamp_red', 'lamp_amber', 'lamp_green')):
    """Signal tower (IEC 60073 colours: red fault, amber attention, green running)."""
    x, y, z = base
    p = [cylinder(name + ' base', (x, y, z + .015), .035, .03, 'Z', mats['black']),
         cylinder(name + ' pole', (x, y, z + .1), .012, .14, 'Z', mats['steel'])]
    zc = z + .19
    for key in segments:
        p.append(cylinder(name + ' ' + key, (x, y, zc), .03, .055, 'Z', mats[key], segments=20))
        p.append(cylinder(name + ' divider', (x, y, zc + .03), .031, .006, 'Z', mats['black'], segments=20))
        zc += .062
    p.append(cylinder(name + ' cap', (x, y, zc), .031, .02, 'Z', mats['black'], segments=20))
    obj = join(p, name)
    if parent is not None:
        obj.parent = parent
    return obj


def hmi_pedestal(name, foot, screen_center, mats, parent=None, width=.5, height=.38, tilt=.18):
    """Operator controller: column, swivel enclosure, touch display, keys, E-stop."""
    fx, fy, fz = foot
    sx, sy, sz = screen_center
    p = [box(name + ' foot plate', (fx, fy, fz + .01), (.22, .22, .02), mats['paint_dark']),
         box(name + ' column', (fx, fy, (fz + sz - height / 2) / 2), (.1, .1, sz - height / 2 - fz),
             mats['paint']),
         cylinder(name + ' swivel', (fx, fy, sz - height / 2 - .02), .06, .05, 'Z', mats['steel_dark'])]
    enclosure = box(name + ' enclosure', (sx, sy, sz), (width + .05, .09, height + .16), mats['paint'],
                    bevel=.012, segments=2)
    screen = box(name + ' display', (sx, sy - .046, sz + .03), (width - .04, .006, height - .1),
                 mats['screen'], bevel=.002)
    bars = []
    for i in range(6):
        h = .05 + .02 * ((i * 37) % 5)
        bars.append(box(name + ' display bar', (sx - width / 2 + .06 + i * .045, sy - .05,
                                                 sz - .02 + h / 2), (.026, .003, h), mats['screen_bar'],
                        bevel=0))
    keys = [box(name + ' key', (sx - width / 2 + .07 + i * .055, sy - .048, sz - height / 2 - .03),
                (.04, .01, .03), mats['black'], bevel=.003) for i in range(8)]
    estop = [cylinder(name + ' e-stop collar', (sx + width / 2 - .02, sy - .055, sz - height / 2 - .03),
                      .028, .012, 'Y', mats['estop_base']),
             cylinder(name + ' e-stop', (sx + width / 2 - .02, sy - .07, sz - height / 2 - .03), .02, .025,
                      'Y', mats['estop'])]
    head = join([enclosure, screen, *bars, *keys, *estop], name + ' head')
    head.location = (0, 0, 0)
    pivot = empty(name + ' tilt', (sx, sy, sz), parent)
    reparent(head, pivot)
    pivot.rotation_euler.x = -tilt
    stand = join(p, name + ' stand')
    if parent is not None:
        stand.parent = parent
    return stand, head


def cabinet(name, lo, hi, mats, parent=None, doors=2):
    """Electrical cabinet with door seams, handles and louvres."""
    lo, hi = Vector(lo), Vector(hi)
    p = [span_box(name, lo, hi, mats['paint'], bevel=.008)]
    face_y = hi.y + .002 if hi.y > 0 else lo.y - .002
    width = (hi.x - lo.x) / doors
    for i in range(doors):
        x0 = lo.x + i * width
        p.append(box(name + ' seam', (x0 + width, face_y, (lo.z + hi.z) / 2), (.004, .004, hi.z - lo.z - .04),
                     mats['black'], bevel=0))
        p.append(box(name + ' handle', (x0 + width - .06, face_y, (lo.z + hi.z) / 2), (.02, .02, .12),
                     mats['black'], bevel=.003))
        for k in range(5):
            p.append(box(name + ' louvre', (x0 + width / 2, face_y, lo.z + .1 + k * .025), (width * .5, .006, .008),
                         mats['black'], bevel=0))
    p.append(box(name + ' warning label', (lo.x + width / 2, face_y, hi.z - .12), (.08, .003, .07),
                 mats['warning'], bevel=0))
    obj = join(p, name)
    if parent is not None:
        obj.parent = parent
    return obj


def leveling_mount(name, center, mats):
    x, y, z = center
    return join([cylinder(name + ' pad', (x, y, z + .015), .06, .03, 'Z', mats['rubber']),
                 cylinder(name + ' cup', (x, y, z + .045), .05, .03, 'Z', mats['steel_dark']),
                 cylinder(name + ' stud', (x, y, z + .09), .014, .06, 'Z', mats['steel']),
                 hexagon(name + ' nut', (x, y, z + .07), .036, .016, 'Z', mats['steel'])], name)


def louvre_panel(name, x0, x1, z0, z1, y, mats, slots=6):
    p = [box(name, ((x0 + x1) / 2, y, (z0 + z1) / 2), (x1 - x0, .006, z1 - z0), mats['paint_dark'], bevel=.002)]
    for k in range(slots):
        zc = z0 + (z1 - z0) * (k + .5) / slots
        p.append(box(name + ' slot', ((x0 + x1) / 2, y - .004 * (1 if y < 0 else -1), zc),
                     ((x1 - x0) * .7, .004, .01), mats['black'], bevel=0))
    return join(p, name)


def floor(name, x0, x1, y0, y1, mats, margin=.25, line=.05):
    """Factory floor with a yellow keep-clear line around the machine footprint."""
    p = [box(name, ((x0 + x1) / 2, (y0 + y1) / 2, -.005), (x1 - x0 + 3, y1 - y0 + 3, .01), mats['floor'],
             bevel=0)]
    lx0, lx1, ly0, ly1 = x0 - margin, x1 + margin, y0 - margin, y1 + margin
    for c, s in ((((lx0 + lx1) / 2, ly0), (lx1 - lx0, line)), (((lx0 + lx1) / 2, ly1), (lx1 - lx0, line)),
                 ((lx0, (ly0 + ly1) / 2), (line, ly1 - ly0)), ((lx1, (ly0 + ly1) / 2), (line, ly1 - ly0))):
        p.append(box(name + ' line', (c[0], c[1], .0005), (s[0], s[1], .002), mats['floor_line'], bevel=0))
    return join(p, name)


def single_flight_screw(name, x_tip, D, length, zones=(.5, .25, .25), h_feed=.15, h_meter=.06,
                        pitch=None, land=.1, center=(0, 0), mat=None, parent=None, samples_per_turn=36):
    """Three-zone injection/extrusion screw with a helical flight.

    The screw extends from ``x_tip`` toward -X. ``h_feed``/``h_meter`` are channel
    depths as fractions of D; their ratio approximates the compression ratio.
    """
    pitch = pitch or D
    y0, z0 = center
    feed, comp, _ = zones
    x_end = x_tip - length

    def root_r(x):
        f = (x_tip - x) / length  # 0 at tip, 1 at rear
        depth_feed, depth_meter = h_feed * D, h_meter * D
        if f > 1 - feed:
            depth = depth_feed
        elif f > 1 - feed - comp:
            t = (f - (1 - feed - comp)) / comp
            depth = depth_meter + (depth_feed - depth_meter) * t
        else:
            depth = depth_meter
        return D / 2 - depth

    bm = bmesh.new()
    rings, xs = [], [x_end + length * i / 60 for i in range(61)]
    for x in xs:
        r = root_r(x)
        rings.append([bm.verts.new((x, y0 + r * math.cos(a), z0 + r * math.sin(a)))
                      for a in [TAU * i / 32 for i in range(32)]])
    for a_ring, b_ring in zip(rings, rings[1:]):
        for i in range(32):
            j = (i + 1) % 32
            f = bm.faces.new((a_ring[i], a_ring[j], b_ring[j], b_ring[i]))
            f.smooth = True
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    turns = length / pitch
    samples = max(16, int(turns * samples_per_turn))
    width = land * D
    prev = None
    for i in range(samples + 1):
        x = x_end + length * i / samples
        a = TAU * turns * i / samples
        r0, r1 = root_r(x) - .001, D / 2 - .0008
        quad = [bm.verts.new((x + dx, y0 + r * math.cos(a), z0 + r * math.sin(a)))
                for dx, r in ((-width / 2, r0), (-width / 2, r1), (width / 2, r1), (width / 2, r0))]
        if prev:
            for k in range(4):
                face = bm.faces.new((prev[k], prev[(k + 1) % 4], quad[(k + 1) % 4], quad[k]))
                face.smooth = k == 1
        prev = quad
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return _finish(name, bm, mat, parent)


# --------------------------------------------------------------- mesh helpers / motion

def subtract(obj, cutters):
    """Boolean-difference each cutter from ``obj`` and delete the cutters."""
    for cutter in cutters:
        mod = obj.modifiers.new('Cut', 'BOOLEAN')
        mod.operation, mod.object, mod.solver = 'DIFFERENCE', cutter, 'EXACT'
        mod.material_mode = 'TRANSFER'
        with bpy.context.temp_override(object=obj, active_object=obj):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter, do_unlink=True)
    return obj


def prism(name, outline, x0, x1, mat):
    """Extrude a closed (y, z) outline along X from x0 to x1."""
    bm = bmesh.new()
    a = [bm.verts.new((x0, y, z)) for y, z in outline]
    b = [bm.verts.new((x1, y, z)) for y, z in outline]
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return _finish(name, bm, mat)


def spin(owner, group, turns, frames, sign=-1):
    """Key a seamless rotation about the owner's local X axis: ``turns`` per loop of ``frames``."""
    owner['motion_group'] = group
    for frame in range(frames + 1):
        owner.rotation_euler.x = sign * TAU * turns * frame / frames
        owner.keyframe_insert('rotation_euler', index=0, frame=frame)


def catmull(points, samples=8):
    """Dense smooth path through control points (shared by meshes and the markers that ride them)."""
    pts = [Vector(p) for p in points]
    out = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        for s in range(samples):
            t = s / samples
            out.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                             + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1])
    return out


def point_at(path, s):
    """Point at arc length ``s`` along a polyline."""
    for a, b in zip(path, path[1:]):
        length = (b - a).length
        if s <= length:
            return a.lerp(b, s / max(length, 1e-9))
        s -= length
    return path[-1].copy()


def path_length(path):
    return sum((b - a).length for a, b in zip(path, path[1:]))


def ride(name, path, count, spacing, travel, mat, radius, frames, shape='sphere', group='flow'):
    """Flow markers on a path, seamless over a loop of ``frames``.

    Marker i sits at (i * spacing + travel * frame / frames) mod (count * spacing); a marker past the path end
    is hidden, so markers can move at a physical speed that is not a whole number of path lengths per loop.
    """
    length, wrap = path_length(path), count * spacing
    for i in range(count):
        if shape == 'sphere':
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius)
        else:
            bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=radius, depth=radius * 2,
                                                rotation=(math.pi / 2, 0, 0))
        obj = bpy.context.object
        obj.name = '%s%02d' % (name, i)
        obj.data.materials.append(mat)
        obj['motion_group'] = group
        for frame in range(frames + 1):
            s = (i * spacing + travel * frame / frames) % wrap
            obj.location = point_at(path, min(s, length))
            obj.scale = (1, 1, 1) if s <= length else (.001, .001, .001)
            obj.keyframe_insert('location', frame=frame)
            obj.keyframe_insert('scale', frame=frame)


def single_screw_extruder(name, D, ld, die_x, axis_z, mats, frames, turns, zones=5, frame_top=None):
    """Brand-neutral single-screw extruder ending at ``die_x`` (barrel front flange), axis at ``axis_z``.

    Inline motor, gearbox with thrust housing, water-cooled feed throat with hopper, ``ld``*D barrel with
    ``zones`` band heaters and cooling blowers, an operator-side (front-top) cutaway and a three-zone screw
    that turns ``turns`` times per loop (negative about +X, conveying toward the die). Proportions follow
    Pack B (D45 30D: motor 450, gearbox 350, shaft height 1000); they are teaching values, not a drawing.
    Returns anchor points for the line builder.
    """
    L = ld * D
    r_out = 1.1 * D
    x_barrel = die_x - L
    x_throat = x_barrel - 3 * D
    x_gear = x_throat - .35
    x_motor = x_gear - .47
    frame_top = frame_top or axis_z - r_out - .16
    cut = (math.pi, math.pi * 2.5)            # keeps everything except the front-top quadrant
    parts = [box(name + ' base frame', ((x_motor + die_x) / 2 - .05, 0, frame_top - .02),
                 (die_x - x_motor + .25, .62, .04), mats['paint_dark'], bevel=.006)]
    for x in (x_motor - .1, (x_motor + die_x) / 2, die_x - .05):
        for y in (-.27, .27):
            parts.append(box(name + ' leg', (x, y, (frame_top - .04) / 2), (.06, .06, frame_top - .04),
                             mats['paint_dark']))
            parts.append(leveling_mount(name + ' mount', (x, y, 0), mats))
    parts.append(louvre_panel(name + ' skirt', x_motor - .08, die_x - .02, .10, frame_top - .06, -.311, mats, slots=4))
    parts.append(motor(name + ' motor', (x_motor + .2, 0, axis_z - .02), .16, .40, 1, mats))
    parts.append(box(name + ' motor base', (x_motor + .2, 0, (frame_top + axis_z - .18) / 2),
                     (.36, .26, axis_z - .18 - frame_top), mats['steel_dark']))
    parts.append(cylinder(name + ' coupling guard', (x_gear - .035, 0, axis_z - .02), .07, .07, 'X', mats['warning']))
    parts.append(box(name + ' gearbox', (x_gear + .175, 0, (frame_top + axis_z + .2) / 2), (.35, .40, axis_z + .2 - frame_top),
                     mats['paint'], bevel=.012, segments=2))
    parts.append(cylinder(name + ' thrust housing', (x_throat - .03, 0, axis_z), .085, .06, 'X', mats['steel_dark']))
    parts.append(cylinder(name + ' gearbox sight glass', (x_gear + .12, -.201, axis_z - .10), .018, .006, 'Y', mats['smoked']))
    parts.append(box(name + ' feed throat', (x_throat + 1.5 * D, 0, axis_z), (3 * D, 2.4 * D, 2.4 * D), mats['steel_dark'],
                     bevel=.004))
    for z, mat in ((axis_z - .02, 'hose_blue'), (axis_z + .02, 'hose_red')):
        parts.append(cylinder(name + ' throat water fitting', (x_throat + 1.5 * D, 1.2 * D + .01, z), .006, .02, 'Y', mats['brass']))
    parts.append(ring(name + ' barrel', x_barrel, die_x - .01, D / 2 + .0008, r_out, (0, axis_z), mats['steel'], arc=cut,
                      cap_mat=mats['section']))
    parts.append(cylinder(name + ' barrel flange', (die_x - .015, 0, axis_z), r_out + .02, .03, 'X', mats['steel_dark'], segments=40))
    zone_len = (L - 2 * D) / zones
    for k in range(zones):
        xc = x_barrel + D + zone_len * (k + .5)
        parts.append(heater_band(name + ' heater', xc, r_out + .002, zone_len * .78, mats['heater'], mats['ceramic'],
                                 (0, axis_z), angle=math.pi / 2 + .6, arc=cut, cap_mat=mats['section']))
        parts.append(box(name + ' cooling blower', (xc, 0, axis_z - r_out - .07), (zone_len * .6, .12, .08), mats['paint'], bevel=.006))
        parts.append(cylinder(name + ' thermocouple', (xc + zone_len * .42, .02, axis_z + r_out + .015), .004, .03, 'Z', mats['copper']))
    for x in (x_barrel + .2 * L, x_barrel + .75 * L):
        parts.append(box(name + ' barrel support', (x, 0, (frame_top + axis_z - r_out) / 2), (.03, .12, axis_z - r_out - frame_top),
                         mats['paint_dark']))
    body = join(parts, name)
    hopper, ports = drying_hopper(name + ' hopper', x_throat + 1.5 * D, 0, axis_z + 1.2 * D, mats, radius=.17)
    owner = empty(name + ' screw', (0, 0, axis_z), group='screw')
    screw = single_flight_screw(name + ' screw flight', die_x - .004, D * .99, L + 3 * D - .01, zones=(.33, .33, .34),
                                center=(0, axis_z), mat=mats['chrome'])
    reparent(screw, owner)
    spin(owner, 'screw', turns, frames)
    heaters = [(x_barrel + D + zone_len * k + zone_len * .11, x_barrel + D + zone_len * (k + 1) - zone_len * .11) for k in range(zones)]
    return {'body': body, 'hopper': hopper, 'screw': owner, 'die': (die_x, 0, axis_z), 'throat_x': x_throat + 1.5 * D,
            'hopper_ports': ports, 'x_rear': x_motor - .1, 'frame_top': frame_top, 'r_out': r_out, 'heaters': heaters,
            'axis_z': axis_z}


# ------------------------------------------------------------------ heat-map zone metadata
# Zone descriptors for the web heat overlay (machine-viewer.js createHeatOverlay), in glTF/three.js Y-up
# coordinates of the rest pose. ``field`` is the input the zone reads; ``group`` "melt" or "tool" picks the
# colour scale. Bands and boxes cover the non-operator half so the cutaways stay open; parts without a cutaway
# (flat dies, heads, adapters) are wrapped whole so the colour reads from the operator side.

def heat_band(key, field, label, x0, x1, r, axis_z, group='melt', parent=None, full=False):
    """Band around a horizontal (X) axis: barrel heater zones (rear half), round dies and adapters (``full``)."""
    zone = {'key': key, 'field': field, 'label': label, 'group': group, 'shape': 'half_band', 'x': [round(x0, 5), round(x1, 5)],
            'r': round(r, 5), 'center': [round(axis_z, 5), 0.0], 'parent': parent}
    return {**zone, 'full': True} if full else zone


def heat_box(key, field, label, lo, hi, group='melt', parent=None, half=True):
    """Box from Blender corners ``lo``/``hi`` (Z-up), clipped to the non-operator half (Blender +Y) unless ``half`` is False."""
    y0 = max(lo[1], 0.0) if half else lo[1]
    a, b = (lo[0], hi[2], -y0), (hi[0], lo[2], -hi[1])
    return {'key': key, 'field': field, 'label': label, 'group': group, 'shape': 'box', 'parent': parent,
            'min': [round(min(a[i], b[i]), 5) for i in range(3)], 'max': [round(max(a[i], b[i]), 5) for i in range(3)]}


def heat_roll_ends(key, field, label, x, z, r, face, group='tool', width=.04):
    """Bands at both ends of a roll whose axis runs along Blender Y (the face itself stays visible)."""
    return {'key': key, 'field': field, 'label': label, 'group': group, 'shape': 'roll_ends', 'x': round(x, 5), 'y': round(z, 5),
            'r': round(r, 5), 'z': [round(-face / 2, 5), round(face / 2, 5)], 'width': width}


def heat_vband(key, field, label, x, y, z0, z1, r, group='melt', parent=None, full=False):
    """Band around a vertical axis at Blender (x, y) between heights z0 and z1 (annular dies, heads): the rear half,
    or all round (``full``) on a body without a cutaway."""
    zone = {'key': key, 'field': field, 'label': label, 'group': group, 'shape': 'vband', 'center': [round(x, 5), round(-y, 5)],
            'y': [round(z0, 5), round(z1, 5)], 'r': round(r, 5), 'parent': parent}
    return {**zone, 'full': True} if full else zone


def extruder_heat(ext, fields):
    """One half band per heater zone of single_screw_extruder, numbered from the hopper (zone 1) to the die."""
    assert len(fields) == len(ext['heaters']), (fields, len(ext['heaters']))
    return [heat_band('Z%d' % (i + 1), field, ['존 %d' % (i + 1), 'Zone %d' % (i + 1)], x0, x1, ext['r_out'] + .012, ext['axis_z'])
            for i, (field, (x0, x1)) in enumerate(zip(fields, ext['heaters']))]


def camera_view(key, label, target, offset=None, zoom=1.0):
    """Player view (three.js coordinates): look at Blender ``target`` from ``target + offset``; without an offset the
    player uses its oblique front view."""
    three = lambda v: [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]
    view = {'key': key, 'label': label, 'center': three(target), 'zoom': zoom}
    if offset is not None:
        view['position'] = three([t + o for t, o in zip(target, offset)])
    return view


# ------------------------------------------------------------------ start-up (threading) sequence
# Continuous lines start the way real ones do: the screw pushes the extrudate out of the die and the operator leads it
# to the haul-off, an actuator closes the nip on it, and the haul-off draws it on to the cutter or the winder. The player
# (equipment-motion.js) grows the product along its path, moves the actuator carrier and refuses steps out of order:
# - product segments carry 'thread_s' = [s0, s1], their span in metres along the product path from the die lip;
#   'thread_extra' segments lie beyond the first cut and exist only until that cut;
# - an actuator carrier (motion group 'nip' unless stated) is keyed open at frame 0 and closed at the last frame;
#   its cylinder rods are children of the carrier, so the exposed rod length follows the stroke.

def three(v):
    """Blender Z-up point as a glTF/three.js Y-up list."""
    return [round(v[0], 5), round(v[2], 5), round(-v[1], 5)]


def thread_mark(obj, s0, s1, extra=False):
    """Tag a product segment with its arc-length span from the die lip."""
    obj['thread_s'] = [round(s0, 5), round(s1, 5)]
    if extra:
        obj['thread_extra'] = 1
    return obj


def split_path(path, step):
    """Consecutive chunks of about ``step`` arc length along a polyline: [(s0, s1, points)], ends shared exactly."""
    path = [Vector(p) for p in path]
    total = path_length(path)
    count = max(1, round(total / step))
    breaks = [total * k / count for k in range(count + 1)]
    return [(s0, s1, path_slice(path, s0, s1)) for s0, s1 in zip(breaks, breaks[1:])]


def path_slice(path, s0, s1):
    """The part of a polyline between arc lengths ``s0`` and ``s1``, with exact end points."""
    path = [Vector(p) for p in path]
    points, s = [point_at(path, s0)], 0.0
    for a, b in zip(path, path[1:]):
        s += (b - a).length
        if s0 + 1e-9 < s < s1 - 1e-9:
            points.append(b.copy())
    return points + [point_at(path, s1)]


def thread_tubes(name, paths, radius, mat, step=.1, s_from=0.0, extra_from=None, r_in=None, curved=False,
                 segments=24):
    """Product strands (profile, strands, straws) built as segments of about ``step`` along parallel ``paths`` of equal
    length; segment k joins the k-th piece of every path and is tagged with its span (``s_from`` at the path start).
    Straight paths along X use solid cylinders, or hollow tubes when ``r_in`` is given; ``curved`` paths sweep a circle."""
    paths = [[Vector(p) for p in path] for path in paths]
    chunked = [split_path(path, step) for path in paths]
    parts = []
    for k, (s0, s1, _) in enumerate(chunked[0]):
        pieces = []
        for points, chunks in zip(paths, chunked):
            if curved:
                pieces.append(tube_path(name + ' piece', chunks[k][2], radius, mat, resolution=1, bevel_resolution=1))
            else:
                a, b = point_at(points, s0), point_at(points, s1)
                if r_in is not None:
                    pieces.append(ring(name + ' piece', a.x, b.x, r_in, radius, (a.y, a.z), mat, segments=segments))
                else:
                    pieces.append(between(name + ' piece', a, b, radius, mat, segments=segments))
        segment = join(pieces, '%s%03d' % (name, k))
        thread_mark(segment, s_from + s0, s_from + s1, extra_from is not None and s_from + s0 >= extra_from - 1e-6)
        parts.append(segment)
    return parts


def thread_web(name, path, width, thickness, mat, step=.1, s_from=0.0, extra_from=None):
    """Sheet or film along ``path`` (see web) as tagged segments of about ``step`` arc length."""
    parts = []
    for k, (s0, s1, points) in enumerate(split_path(path, step)):
        segment = web('%s%03d' % (name, k), points, width, thickness, mat)
        thread_mark(segment, s_from + s0, s_from + s1, extra_from is not None and s_from + s0 >= extra_from - 1e-6)
        parts.append(segment)
    return parts


def path_slice_pair(path, alt, s0, s1):
    """path_slice of ``path`` between arc lengths ``s0`` and ``s1`` with the matching points of ``alt``, a second pose
    of the same polyline (equal vertex count): every point sits at the same segment fraction in both poses."""
    path, alt = [Vector(p) for p in path], [Vector(p) for p in alt]
    assert len(path) == len(alt), (len(path), len(alt))

    def at(s):
        for i, (a, b) in enumerate(zip(path, path[1:])):
            length = (b - a).length
            if s <= length or i == len(path) - 2:
                f = min(1.0, s / max(length, 1e-9))
                return a.lerp(b, f), alt[i].lerp(alt[i + 1], f)
            s -= length

    first, last = at(s0), at(s1)
    points, others, s = [first[0]], [first[1]], 0.0
    for i, (a, b) in enumerate(zip(path, path[1:])):
        s += (b - a).length
        if s0 + 1e-9 < s < s1 - 1e-9:
            points.append(b.copy())
            others.append(alt[i + 1].copy())
    return points + [last[0]], others + [last[1]]


def thread_web_keyed(name, path, alt, width, thickness, mat, family, key, step=.1, s_from=0.0):
    """Tagged web segments (see thread_web) whose mesh is the ``alt`` pose of the path with a shape key ``key`` (value
    1) to the ``path`` pose, for a web that follows a moving roll (e.g. a dancer). Segments that differ between the
    poses join the morph ``family`` the start-up drives; the arc lengths (``thread_s``) are those of ``path``."""
    path = [Vector(p) for p in path]
    total = path_length(path)
    count = max(1, round(total / step))
    breaks = [total * k / count for k in range(count + 1)]
    parts = []
    for k, (s0, s1) in enumerate(zip(breaks, breaks[1:])):
        points, others = path_slice_pair(path, alt, s0, s1)
        segment = web('%s%03d' % (name, k), others, width, thickness, mat)
        if max((a - b).length for a, b in zip(points, others)) > 1e-7:
            target = web(name + ' pose', points, width, thickness, mat)
            segment.shape_key_add(name='Basis')
            block = segment.shape_key_add(name=key, from_mix=False)
            for vertex, source in zip(block.data, target.data.vertices):
                vertex.co = source.co
            block.value = 1.0
            segment['morph'] = family
            mesh = target.data
            bpy.data.objects.remove(target, do_unlink=True)
            bpy.data.meshes.remove(mesh)
        thread_mark(segment, s_from + s0, s_from + s1)
        parts.append(segment)
    return parts


def carrier(name, group='nip'):
    """Empty at the world origin carrying the moving half of an actuator; parts reparented to it keep their pose."""
    return empty(name, (0, 0, 0), group=group, size=.05)


def mount(objects, owner):
    """Reparent ``objects`` to a carrier (built in the closed pose), keeping their world transforms."""
    for obj in objects:
        if obj is not None:
            reparent(obj, owner)


def actuate(owner, frames, open_offset):
    """Key the carrier open (translated by ``open_offset``) at frame 0 and closed (at rest) at ``frames``."""
    for frame, offset in ((0, open_offset), (frames, (0, 0, 0))):
        owner.location = offset
        owner.keyframe_insert('location', frame=frame)
    owner['open_offset'] = [round(v, 5) for v in open_offset]


def turn_about(owner, frames, center, axis, angle_of):
    """Key a carrier at the world origin so that everything mounted on it turns about the world ``axis`` ('X', 'Y' or
    'Z') through ``center``: ``angle_of(f)`` is the angle (rad) at the clip fraction f = frame / frames. Every frame
    holds the rotation R and the location center - R center, so the carrier stays an origin carrier, at identity
    wherever the angle is 0 (the rest pose that the player pins and a still render holds)."""
    center = Vector(center)
    index = 'XYZ'.index(axis)
    for frame in range(frames + 1):
        angle = angle_of(frame / frames)
        owner.rotation_euler = (0, 0, 0)
        owner.rotation_euler[index] = angle
        owner.location = center - Matrix.Rotation(angle, 3, axis) @ center
        owner.keyframe_insert('location', frame=frame)
        owner.keyframe_insert('rotation_euler', index=index, frame=frame)
    # Not named 'pivot': three.js r185 GLTFLoader reads a node's extras.pivot as its own pivot pattern and moves the node.
    owner['turn_center'] = [round(v, 5) for v in center]
    owner['turn_axis'] = axis


def smoothstep(x):
    """0 -> 1 with zero slope at both ends (indexing and reversing drives start and stop gently)."""
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def action_fcurves(action):
    """Every F-curve of an action (layered actions in Blender 4.4+, plain actions before)."""
    curves = [curve for layer in getattr(action, 'layers', []) for strip in layer.strips
              for bag in strip.channelbags for curve in bag.fcurves]
    return curves or list(getattr(action, 'fcurves', []))


def hold_closed(owners, hide=(), keys=()):
    """For a still render of the running line: mute the actuator carriers at rest (closed, or at identity for a
    carrier keyed by turn_about), hold the shape-key blocks ``keys`` at their running value 1 and hide start-up-only
    objects. Returns a function that undoes all three before the rig is saved and exported."""
    curves = [curve for owner in owners for curve in action_fcurves(owner.animation_data.action)]
    curves += [curve for block in keys for curve in action_fcurves(block.id_data.animation_data.action)
               if curve.data_path == 'key_blocks["%s"].value' % block.name]
    for curve in curves:
        curve.mute = True
    for owner in owners:
        owner.location = (0, 0, 0)
        owner.rotation_euler = (0, 0, 0)
    for block in keys:
        block.value = 1.0
    for obj in hide:
        obj.hide_render = True

    def release():
        for curve in curves:
            curve.mute = False
        for obj in hide:
            obj.hide_render = False
    return release


def linked_cylinder(name, cap, end, attach, bore_r, rod_r, mats, owner, inset=None):
    """Pneumatic or hydraulic cylinder: the body is fixed from ``cap`` to ``end``; the rod runs from ``inset`` inside the
    body out through ``end`` to a clevis at ``attach`` on the carrier ``owner`` (all in the closed pose). The rod and
    clevis ride with the carrier. The rod records the body ends ('bore', world) for the linkage checks."""
    cap, end, attach = Vector(cap), Vector(end), Vector(attach)
    axis = (end - cap).normalized()
    length = (end - cap).length
    inset = length * .3 if inset is None else inset
    assert abs((attach - end).normalized().dot(axis) - 1) < 1e-6, (name, 'rod must leave along the cylinder axis')
    side = axis.orthogonal().normalized() * bore_r * 1.25
    body = join([between(name + ' barrel', cap + axis * length * .06, end - axis * length * .06, bore_r, mats['paint_accent'], segments=24),
                 between(name + ' cap', cap, cap + axis * length * .1, bore_r * 1.22, mats['steel_dark'], segments=24),
                 between(name + ' head', end - axis * length * .1, end, bore_r * 1.22, mats['steel_dark'], segments=24),
                 between(name + ' port', cap + axis * length * .2, cap + axis * length * .2 + side, bore_r * .22, mats['brass'], segments=10),
                 between(name + ' port', end - axis * length * .2, end - axis * length * .2 + side, bore_r * .22, mats['brass'], segments=10)],
                name)
    rod = between(name + ' rod', end - axis * inset, attach, rod_r, mats['chrome'], segments=16)
    rod['bore'] = [[round(v, 5) for v in cap], [round(v, 5) for v in end]]
    rod['rod_r'] = rod_r
    clevis = between(name + ' clevis', attach - axis * rod_r * 1.5, attach + axis * rod_r * 1.5, rod_r * 2.2, mats['steel_dark'], segments=6)
    mount([rod, clevis], owner)
    return body, rod


def step(key, label, hint, needs=(), locks=(), once=False, spin=None, move=None, thread=None, release=None, wind=None,
         morph=None, reveal=None, readout=None):
    """One start-up step for the player: a 0-100 % slider that is enabled once every step in ``needs`` is complete and
    stops ``locks`` from changing after it starts. ``spin`` turns groups ({group: [turns at 100 %, phase turns]}),
    ``move`` drives an actuator clip, ``thread`` grows the product front from s0 to s1 (m), ``release`` frees a cut piece,
    ``wind`` grows a wound roll from its core and ``morph`` drives a shape-key family (0 -> 1). ``reveal`` lists marker
    groups that appear once the step starts (e.g. hot-air flow) and ``readout`` shows the slider as a value
    ({from, to, unit, digits}) instead of %. ``once`` steps cannot be reversed (the screw does not suck melt back; a
    drawn product does not return)."""
    entry = {'key': key, 'label': label, 'hint': hint, 'needs': list(needs), 'locks': list(locks), 'once': bool(once)}
    for field, value in (('spin', spin), ('move', move), ('thread', thread), ('release', release), ('wind', wind), ('morph', morph),
                         ('reveal', reveal), ('readout', readout)):
        if value is not None:
            entry[field] = value
    if thread is not None:
        entry['thread'] = [round(thread[0], 5), round(thread[1], 5)]
    return entry


def startup(intro, steps, done, duration, pinned=None, hidden=('flow',), follow=None):
    """Start-up metadata plus the matching manual controls (one 0-100 % slider per step, in order)."""
    meta = {'intro': intro, 'steps': steps, 'done': done, 'pinned': pinned or {'nip': 1}, 'hidden': list(hidden),
            'follow': follow or {'resin': 'screw'}}
    controls = [{'key': s['key'], 'label': s['label'], 'max': 100, 'unit': '%', 'step': .1, 'range': [0, duration],
                 **({'readout': s['readout']} if 'readout' in s else {})} for s in steps]
    return meta, controls


PROCESS_HEAT_NOTE = ['공정 조건에 입력한 존 설정값을 색으로 표시합니다. 실측·용융온도가 아니며, 존 번호는 호퍼 쪽부터 다이 방향입니다. '
                     '참고 범위는 선택한 그레이드의 근거 또는 사용자 수정 범위입니다. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.',
                     'Colours show the zone set points entered under process conditions, not measured or melt temperatures; zones are '
                     'numbered from the hopper toward the die. Reference bands come from the selected grade source or your edits; a '
                     'heavy outline marks values outside the band and hatching marks missing values.']


def arc_xz(cx, cz, r, a0, a1, n=24, y=0.0):
    """Points on a circle in the XZ plane, angles in degrees from +X toward +Z."""
    return [Vector((cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), y,
                    cz + r * math.sin(math.radians(a0 + (a1 - a0) * i / n)))) for i in range(n + 1)]


def web(name, points, width, thickness, mat):
    """Sheet or film following a path in the XZ plane, ``width`` across Y, ``thickness`` normal to the path."""
    bm = bmesh.new()
    rows = []
    for i, p in enumerate(points):
        a, b = points[max(i - 1, 0)], points[min(i + 1, len(points) - 1)]
        tangent = Vector((b.x - a.x, 0, b.z - a.z)).normalized()
        normal = Vector((-tangent.z, 0, tangent.x)) * thickness / 2
        rows.append([bm.verts.new(p + Vector((0, y, 0)) + normal * side) for side in (-1, 1) for y in (-width / 2, width / 2)])
    for a, b in zip(rows, rows[1:]):
        for i, j in ((0, 1), (3, 2), (2, 0), (1, 3)):
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new((rows[0][0], rows[0][2], rows[0][3], rows[0][1]))
    bm.faces.new((rows[-1][0], rows[-1][1], rows[-1][3], rows[-1][2]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return _finish(name, bm, mat)


def bearing_block(radius):
    """Default bearing block size across the axis of a roll of ``radius`` (m), in both X and Z."""
    return radius * .9 + .06


def roll(name, x, z, radius, face, mats, group, turns, frames, sign, mat=None, marks=1, joint=True, y=0.0, block=None):
    """Driven roll on bearing blocks with an axis along world +Y.

    A positive ``sign`` turns the roll about +Y: its top moves +X and its bottom -X. ``marks`` painted
    stripes make the rotation visible; set it to 0 for plain rolls whose turns per loop are not whole.
    ``joint`` adds a rotary union with temperature-control supply (blue) and return (red) hoses.
    ``block`` is the bearing block size across the axis (default ``bearing_block(radius)``). Below a radius of 54.5 mm
    the default is wider than the roll, so two such rolls closed on the product would push their blocks into each
    other: a nip pair of small rolls takes blocks narrower than the roll diameter.
    Returns the rotating owner.
    """
    block = bearing_block(radius) if block is None else block
    owner = empty(name, (x, y, z), group=group)
    owner.rotation_euler.z = math.pi / 2           # local X (spin axis) along world +Y
    parts = [cylinder(name + ' shell', (0, 0, 0), radius, face, 'X', mat or mats['chrome'], segments=48),
             cylinder(name + ' journal', (0, 0, 0), radius * .3, face + .16, 'X', mats['steel'], segments=24)]
    for k in range(marks):
        stripe = box(name + ' mark', (0, 0, radius + .0005), (face * .98, .006, .001), mats['steel_dark'], bevel=0)
        stripe.rotation_euler.x = TAU * k / max(marks, 1)
        parts.append(stripe)
    join(parts, name + '_body').parent = owner
    spin(owner, group, turns, frames, sign)
    static = []
    for side in (-1, 1):
        static.append(box(name + ' bearing block', (x, y + side * (face / 2 + .07), z), (block, .08, block), mats['steel_dark'], bevel=.006))
    if joint:
        jy = y + face / 2 + .14
        static.append(cylinder(name + ' rotary union', (x, jy + .03, z), .028, .07, 'Y', mats['brass']))
        static.append(hose(name + ' supply', (x, jy + .06, z + .01), (x - .1, jy + .25, .12), .012, mats['hose_blue'], sag=.05))
        static.append(hose(name + ' return', (x, jy + .06, z - .01), (x + .1, jy + .25, .12), .012, mats['hose_red'], sag=.05))
    join(static, name + ' stand')
    return owner


def flat_die(name, x_inlet, width, depth, height, axis_z, mats, lip_bolts=None):
    """Coat-hanger flat die: body ``depth`` along X from ``x_inlet``, ``width`` across Y, lips at the +X face,
    with cartridge-heater rows, lip adjustment bolts and end plates. Returns the lip exit point."""
    x1 = x_inlet + depth
    parts = [box(name + ' upper body', (x_inlet + depth / 2, 0, axis_z + height / 4), (depth, width, height / 2 - .002), mats['steel'],
                 bevel=.004),
             box(name + ' lower body', (x_inlet + depth / 2, 0, axis_z - height / 4), (depth, width, height / 2 - .002), mats['steel'],
                 bevel=.004),
             box(name + ' lip', (x1 + .012, 0, axis_z), (.024, width - .02, .03), mats['chrome'], bevel=.002)]
    for side in (-1, 1):
        parts.append(box(name + ' end plate', (x_inlet + depth / 2, side * (width / 2 + .006), axis_z), (depth, .012, height), mats['steel_dark']))
    count = lip_bolts or max(5, round(width / .025))
    for i in range(count):
        y = -width / 2 + .02 + (width - .04) * i / (count - 1)
        parts.append(cylinder(name + ' lip bolt', (x1 - .01, y, axis_z + height / 2 + .012), .005, .024, 'Z', mats['steel']))
    for z in (axis_z + height / 2 - .01, axis_z - height / 2 + .01):
        parts.append(box(name + ' heater row', (x_inlet + depth * .4, 0, z), (depth * .5, width - .04, .006), mats['heater'], bevel=0))
    parts.append(box(name + ' terminal box', (x_inlet + depth * .4, width / 2 + .04, axis_z + height / 2), (.06, .06, .05), mats['ceramic']))
    join(parts, name)
    return Vector((x1 + .024, 0, axis_z))


# ------------------------------------------------------------------- render / export

def studio_world(strength=.9, hdri='studio.exr', background=(.93, .91, .86), fill=.55):
    """Bundled studio HDRI plus a uniform fill for reflections; camera sees a flat backdrop.

    The fill keeps machined metal from mirroring the HDRI's dark regions, which
    reads as black steel in product renders.
    """
    world = bpy.context.scene.world or bpy.data.worlds.new('World')
    bpy.context.scene.world = world
    try:
        world.use_nodes = True
    except AttributeError:
        pass
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputWorld')
    env = nodes.new('ShaderNodeTexEnvironment')
    folder = bpy.utils.system_resource('DATAFILES', path='studiolights/world')
    env.image = bpy.data.images.load(os.path.join(folder, hdri), check_existing=True)
    light = nodes.new('ShaderNodeBackground')
    light.inputs['Strength'].default_value = strength
    flat = nodes.new('ShaderNodeBackground')
    flat.inputs['Color'].default_value = (*background, 1)
    flat.inputs['Strength'].default_value = 1.0
    path_node = nodes.new('ShaderNodeLightPath')
    mix = nodes.new('ShaderNodeMixShader')
    lift = nodes.new('ShaderNodeMix')
    lift.data_type = 'RGBA'
    lift.blend_type = 'ADD'
    lift.inputs['Factor'].default_value = 1.0
    color_in = [s for s in lift.inputs if s.type == 'RGBA']
    color_in[1].default_value = (fill, fill, fill * .97, 1)
    links.new(env.outputs['Color'], color_in[0])
    links.new([s for s in lift.outputs if s.type == 'RGBA'][0], light.inputs['Color'])
    links.new(path_node.outputs['Is Camera Ray'], mix.inputs['Fac'])
    links.new(light.outputs['Background'], mix.inputs[1])
    links.new(flat.outputs['Background'], mix.inputs[2])
    links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return world


def ortho_camera(name, location, target, ortho_scale):
    cam_data = bpy.data.cameras.new(name)
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = ortho_scale
    cam = bpy.data.objects.new(name, cam_data)
    collection().objects.link(cam)
    cam.location = location
    cam.rotation_euler = (Vector(target) - Vector(location)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    return cam


def area_light(name, location, target, energy, size, color=(1, .97, .92)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.size, data.color = energy, size, color
    obj = bpy.data.objects.new(name, data)
    collection().objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - Vector(location)).to_track_quat('-Z', 'Y').to_euler()
    return obj


def render_still(path, width=1280, height=640, samples=48):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples, scene.cycles.use_denoising = samples, True
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def bake_linear():
    """Linear interpolation for per-frame baked keys (no overshoot between frames)."""
    for action in bpy.data.actions:
        for layer in getattr(action, 'layers', []):
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for point in curve.keyframe_points:
                            point.interpolation = 'LINEAR'


def export_glb(path, skip=()):
    """Export meshes/empties with the scene animation; ``skip`` objects stay out."""
    skip = set(skip)
    for obj in bpy.context.scene.objects:
        obj.select_set(obj not in skip and obj.type in {'MESH', 'EMPTY'})
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
                              export_animations=True, export_animation_mode='SCENE',
                              export_force_sampling=True, export_frame_range=True,
                              export_yup=True, export_cameras=False, export_lights=False,
                              export_extras=True, export_optimize_animation_size=True,
                              export_texcoords=False)   # untextured PBR: UVs would only add bytes
