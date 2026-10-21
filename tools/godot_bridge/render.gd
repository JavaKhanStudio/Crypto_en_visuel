# r207: Godot's own picture of a Shadow item, taken with the camera and light of views.json, to set
# beside lib/shapes.js's three.js rebuild (lab/shapes.html). It needs a GPU surface, so it runs in
# cage (a headless wlroots compositor, as Shadow's tools/grun.sh does): no window on the desk.
# It draws into its own SubViewport (views.json's size, its own world), so Shadow's window size and
# its autoloaded overlays never reach the picture.
#   WLR_BACKENDS=headless cage -- godot --path /home/simon/Shadow \
#     -s $PWD/tools/godot_bridge/render.gd -- $PWD/tools/godot_bridge/views.json out/r207 [item]
# r208: an argument gen=<dir> also shoots each item as built by the generated builder <dir>/<item>.gd
# (tools/godot_bridge/to_gdscript.py), saved as <item>-gen.png beside <item>-godot.png.
extends SceneTree

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var v: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(args[0]))
	var out: String = args[1]
	DirAccess.make_dir_recursive_absolute(out)
	var only: Array = Array(args.slice(2)).filter(func(a): return not a.begins_with("gen="))
	var gen: String = ""
	for a in args.slice(2): if a.begins_with("gen="): gen = a.substr(4)
	var Items = load("res://scripts/items/Items.gd")
	var vp := SubViewport.new()
	vp.size = Vector2i(v.size[0], v.size[1])
	vp.own_world_3d = true
	vp.msaa_3d = Viewport.MSAA_4X
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = _col(v.background)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = _col(v.ambient)
	env.ambient_light_energy = 1.0
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	var we := WorldEnvironment.new(); we.environment = env; vp.add_child(we)
	var sun := DirectionalLight3D.new()
	vp.add_child(sun)
	sun.look_at_from_position(_v(v.light), Vector3.ZERO, Vector3.UP)
	var cam := Camera3D.new(); cam.fov = v.fov; vp.add_child(cam)
	for item in v.items:
		if only and not item in only: continue
		for kind in (["godot", "gen"] if gen else ["godot"]):
			var node: Node3D
			if kind == "gen": node = load(gen.path_join(item + ".gd")).call(item, {})
			else:
				match item:
					"laptop": node = Items.laptop({}, 115.0, 0)
					_: node = Items.call(item, {}, 0)
			vp.add_child(node)
			var c: Dictionary = v.items[item]
			cam.look_at_from_position(_v(c.eye), _v(c.target), Vector3.UP)
			cam.make_current()
			for i in 8: await process_frame
			await RenderingServer.frame_post_draw
			var path := out.path_join(item + "-" + kind + ".png")
			vp.get_texture().get_image().save_png(path)
			print("[bridge] ", path)
			node.queue_free()
			await process_frame
	quit()

func _v(a: Array) -> Vector3: return Vector3(a[0], a[1], a[2])
func _col(a: Array) -> Color: return Color(a[0], a[1], a[2])
