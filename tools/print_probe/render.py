# r196 probe, run headless: blender -b -P tools/print_probe/render.py -- <repo>
# out/print_probe/pieces.png: Alice from export.mjs (person('a') at 20 mm a unit), assembled and exploded,
#   every three.js mesh one printed piece.
# out/print_probe/joint.png + joint-robe.stl, joint-arm.stl: a shoulder that only swings BACKWARDS, as
#   Simon's note asks. The arm's pin turns in a socket in the robe; a key on the pin rides in a groove
#   cut as a 60-degree sector, so the arm stops at rest (straight down) and at 60 degrees back.
#   Sizes are the figure's, in mm, with the 0.3 mm clearance a 0.4 mm FDM nozzle needs.
import bpy, sys, math, glob, json
from mathutils import Vector, Matrix
repo = sys.argv[sys.argv.index('--') + 1]; src = f'{repo}/out/print_probe'
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'OBJECT'; sh.show_cavity = True; sh.show_shadows = False
sh.background_type = 'VIEWPORT'; sh.background_color = (.93, .91, .86)
sc.render.resolution_x, sc.render.resolution_y = 1400, 900

def imp(path): bpy.ops.wm.stl_import(filepath=path); return bpy.context.selected_objects[0]
def mesh(name, verts, faces, color):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); o.color = color; return o
def cyl(name, r, h, loc, rot=(0, 0, 0), color=(1, 1, 1, 1), n=48):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=n)
    o = bpy.context.object; o.name = name; o.color = color; return o
def boolean(target, tool, op):
    m = target.modifiers.new('b', 'BOOLEAN'); m.operation = op; m.object = tool; m.solver = 'EXACT'
    bpy.context.view_layer.objects.active = target; bpy.ops.object.modifier_apply(modifier='b'); bpy.data.objects.remove(tool)
def sector(name, r0, r1, a0, a1, x0, x1, c, steps=24):   # an annulus sector around the x axis through c, angles from straight down towards +y (back)
    v, f = [], []
    for x in (x0, x1):
        for r in (r0, r1):
            for i in range(steps + 1):
                a = math.radians(a0 + (a1 - a0) * i / steps); v.append((c.x + x, c.y + r * math.sin(a), c.z - r * math.cos(a)))
    n = steps + 1; idx = lambda s, k, i: s * 2 * n + k * n + i
    for i in range(steps):
        for s in (0, 1): f.append((idx(s, 0, i), idx(s, 0, i + 1), idx(s, 1, i + 1), idx(s, 1, i))[::(1 if s else -1)])
        for k in (0, 1): f.append((idx(0, k, i), idx(0, k, i + 1), idx(1, k, i + 1), idx(1, k, i))[::(-1 if k else 1)])
    for i in (0, steps): f.append((idx(0, 0, i), idx(1, 0, i), idx(1, 1, i), idx(0, 1, i))[::(1 if i else -1)])
    return mesh(name, v, f, (1, 1, 1, 1))
def shoot(path, loc, look, scale):
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = scale; cam.location = loc
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path; bpy.ops.render.render(write_still=True); bpy.data.objects.remove(cam)
def clear():
    for o in list(sc.collection.objects): bpy.data.objects.remove(o)

# 1. the pieces: three.js y-up was written z-up by export.mjs
COL = {'Cylinder': (.18, .37, .66, 1), 'Capsule': (.18, .37, .66, 1), 'Torus': (.3, .64, 1, 1)}
files = sorted(glob.glob(f'{src}/person-a/*.stl'))
for i, f in enumerate(files):
    t = f.split('-')[-1][:-4]
    for shift, k in ((-30, 0), (30, 1)):
        o = imp(f); o.color = COL.get(t, (.94, .78, .63, 1) if t == 'Sphere' else (.5, .5, .5, 1))
        if t == 'Sphere' and i >= 6: o.color = (.42, .24, .12, 1)
        if t == 'Sphere' and i in (2, 3): o.color = (.1, .1, .1, 1)
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]; cen = sum(bb, Vector()) / 8
        d = Vector((cen.x, -cen.y, cen.z - 38)); o.location = Vector((shift, 0, 0)) + (d * 1.1 if d.length > 3 else Vector()) * k
shoot(f'{src}/pieces.png', (0, -300, 40), (0, 0, 40), 130)
clear()

# 2. the one-way shoulder, figure size in mm
R_PIN, GAP, R_HUB, R_ARM, KEY = 1.2, .3, 3.0, 2.6, .8      # pin 2.4 mm, hub 6 mm, arm 5.2 mm, key 0.8 mm
P = Vector((9.5, 0, 46))                                    # the shoulder pivot, on the robe's side
robe = cyl('robe', 1, 1, (0, 0, 21), color=(.18, .37, .66, 1), n=64); bpy.ops.object.delete()
bpy.ops.mesh.primitive_cone_add(radius1=17, radius2=9.5, depth=50, location=(0, 0, 25), vertices=64); robe = bpy.context.object; robe.name = 'robe'; robe.color = (.18, .37, .66, 1)
boolean(robe, cyl('socket', R_PIN + GAP, 9, P + Vector((-3, 0, 0)), (0, math.pi / 2, 0)), 'DIFFERENCE')
boolean(robe, sector('groove', R_PIN + GAP - .01, R_PIN + KEY + GAP, -8, 68, -4.5, 1.5, P), 'DIFFERENCE')   # key width ~8 deg each side of its travel
arm = cyl('arm', R_HUB, 3, P + Vector((2.5, 0, 0)), (0, math.pi / 2, 0), (.94, .78, .63, 1))
boolean(arm, cyl('pin', R_PIN, 6.5, P + Vector((-1.75, 0, 0)), (0, math.pi / 2, 0)), 'UNION')
boolean(arm, sector('key', R_PIN - .2, R_PIN + KEY, -4, 4, -4, 0, P), 'UNION')
boolean(arm, cyl('limb', R_ARM, 16, P + Vector((2.5, 0, -8)), color=(1, 1, 1, 1), n=24), 'UNION')
for o in (robe, arm):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.wm.stl_export(filepath=f'{src}/joint-{o.name}.stl', export_selected_objects=True)
ghost = arm.copy(); ghost.data = arm.data.copy(); sc.collection.objects.link(ghost); ghost.color = (.94, .78, .63, 1)
ghost.matrix_world = Matrix.Translation(P) @ Matrix.Rotation(math.radians(60), 4, 'X') @ Matrix.Translation(-P) @ arm.matrix_world
# view A: from the side with the arm pulled off, so the socket and the 60-degree groove read
arm.hide_render = True; ghost.hide_render = True
shoot(f'{src}/joint-a.png', P + Vector((60, 0, 0)), P, 14)
# view B: assembled, at rest and at the stop 60 degrees back (the ghost)
arm.hide_render = False; ghost.hide_render = False
shoot(f'{src}/joint-b.png', P + Vector((60, -25, 8)), P + Vector((0, 0, -6)), 40)
json.dump({'pin_mm': 2 * R_PIN, 'clearance_mm': GAP, 'hub_mm': 2 * R_HUB, 'arm_mm': 2 * R_ARM, 'travel_deg': [0, 60]}, open(f'{src}/joint.json', 'w'))
