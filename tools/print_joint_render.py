# r395: draws what tools/print_joint_shot.mjs wrote (a cast figure's shoulder, as exported) in four panels:
#   1 the socket and its one-way groove in the robe, looking down the peg's axis (the arm taken off)
#   2 the arm pulled off its peg: the key along the peg's top, the groove it slides into
#   3, 4 the figure with its right arm at rest (one stop) and turned to the other end of its range (the other stop)
#     node tools/print_joint_shot.mjs a && blender -b -P tools/print_joint_render.py -- out/print_joint && python3 tools/print_joint_render.py out/print_joint
# Run by blender it renders panel-<n>.png; run by python3 it lays them side by side, labelled, as joint.png.
import sys, json, os
src = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]
TITLES = ['Socket and groove in the robe (arm off)', 'Arm off its peg: the key (red)', 'At rest: the key on one stop', 'Turned {a} degrees: the other stop']
try:
    import bpy
except ImportError:
    from PIL import Image, ImageDraw, ImageFont
    ax = json.load(open(f'{src}/axis.json')); ims = [Image.open(f'{src}/panel-{i}.png') for i in range(1, 5)]
    w, h = ims[0].size; sheet = Image.new('RGB', (2 * w, 2 * h + 80), (237, 232, 219)); d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype(os.popen('fc-match -f %{file} DejaVuSans').read() or 'DejaVuSans.ttf', 30)
    except OSError: font = ImageFont.load_default()
    for i, im in enumerate(ims):
        x, y = (i % 2) * w, (i // 2) * (h + 40); sheet.paste(im, (x, y + 40)); d.text((x + 20, y + 4), f'{i + 1}. ' + TITLES[i].format(a=abs(ax['swing'][0])), fill=(30, 30, 30), font=font)
    sheet.save(f'{src}/joint.png'); print(f'{src}/joint.png'); sys.exit()
from mathutils import Vector
ax = json.load(open(f'{src}/axis.json')); A, B = Vector(ax['a']), Vector(ax['b'])   # the peg's ends, mm, Z up
inner, outer = (A, B) if abs(A.x) < abs(B.x) else (B, A)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'OBJECT'; sh.show_cavity = True; sh.show_shadows = False
sh.background_type = 'VIEWPORT'; sh.background_color = (.93, .91, .86)
sc.render.resolution_x, sc.render.resolution_y = 900, 700
COL = {'body': (.30, .45, .80, 1), 'head': (.94, .78, .63, 1), 'arm': (.40, .55, .88, 1), 'key': (.85, .15, .10, 1)}
def show(names):
    for o in list(sc.objects):
        if o.type == 'MESH': bpy.data.objects.remove(o)
    for n in names:
        bpy.ops.wm.stl_import(filepath=f'{src}/{n}.stl'); o = bpy.context.selected_objects[0]; o.color = COL[n.split('-')[0]]
def shoot(i, eye, at, scale):
    cam = sc.camera or bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    if not sc.camera: sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = scale; cam.location = eye
    cam.rotation_euler = (Vector(at) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = f'{src}/panel-{i}.png'; bpy.ops.render.render(write_still=True)
mid = (inner + outer) / 2
show(['body', 'head']); shoot(1, outer + (outer - inner).normalized() * 40, inner, 16)
show(['body', 'head', 'arm-off', 'key-off']); shoot(2, mid + Vector((-30, -28, 26)), mid + Vector((-3, 0, 0)), 24)
for i, n in ((3, 'rest'), (4, 'turned')):
    show(['body', 'head', f'arm-{n}', f'key-{n}']); shoot(i, Vector((-90, -10, 34)), Vector((0, 0, 30)), 66)
