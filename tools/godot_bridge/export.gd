# r207: the Godot → three.js bridge. Builds Shadow's code-built items headless, from a script OUTSIDE
# Shadow (it is read, never written), and writes each as assets/shapes/<item>.json for lib/shapes.js:
#   godot --headless --path /home/simon/Shadow -s $PWD/tools/godot_bridge/export.gd -- $PWD/assets/shapes
# glTF would drop the colours (they are uniforms of Shadow's retro shader), hence this JSON:
#   { item, style, parts, nodes: [node] }, node = { name, m: 16 floats (local, column-major like
#   three's Matrix4.fromArray), mesh?: {kind, ...}, mat?: {...}, children?: [node] }
# A BoxMesh is kept as its size (three's BoxGeometry is the same box). Every other mesh is written as
# its own vertex arrays, so its shape is exact whatever it is; a CylinderMesh also keeps its numbers.
# Godot's front faces wind clockwise, three's counter-clockwise: each triangle is written reversed.
# The tree keeps the nodes Shadow names (Fan, RackStatus, RackActivity, Screen, PowerLED…), which
# ItemView animates, so a three.js scene can find and move the same parts.
extends SceneTree

const ITEMS := {
	"server_rack": "server_rack",
	"tower": "tower",
	"laptop": "laptop",
}
const STYLE := 0

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var out: String = args[0] if args.size() > 0 else "assets/shapes"
	DirAccess.make_dir_recursive_absolute(out)
	var Items = load("res://scripts/items/Items.gd")
	var bad := 0
	for item in ITEMS:
		var root: Node3D
		match item:
			"laptop": root = Items.laptop({}, 115.0, STYLE)
			_: root = Items.call(ITEMS[item], {}, STYLE)
		var skipped := []
		var tree := _node(root, skipped)
		var doc := {"item": item, "style": STYLE, "parts": _count(tree), "nodes": tree.get("children", [])}
		var f := FileAccess.open(out.path_join(item + ".json"), FileAccess.WRITE)
		f.store_string(JSON.stringify(doc, "", false))
		f.close()
		print("[bridge] ", item, ": ", doc.parts, " parts", (", SKIPPED " + str(skipped)) if skipped else "")
		bad += skipped.size()
		root.free()
	quit(1 if bad else 0)

func _node(n: Node, skipped: Array) -> Dictionary:
	var d := {}
	if not String(n.name).begins_with("@"): d.name = String(n.name)
	if n is Node3D:
		if not n.visible: return {}
		d.m = _mat(n.transform)
	if n is MeshInstance3D and n.mesh:
		d.mesh = _mesh(n.mesh)
		d.mat = _material(n.get_active_material(0))
	elif n is VisualInstance3D and not n is MeshInstance3D:
		skipped.append(n.get_class() + " " + String(n.name))   # a light, particles, a multimesh: not bridged yet
	var kids := []
	for c in n.get_children():
		var k := _node(c, skipped)
		if k.has("mesh") or k.has("children"): kids.append(k)
	if kids: d.children = kids
	return d

func _count(d: Dictionary) -> int:
	var n := 1 if d.has("mesh") else 0
	for c in d.get("children", []): n += _count(c)
	return n

func _mat(t: Transform3D) -> Array:
	var b := t.basis
	return [b.x.x, b.x.y, b.x.z, 0, b.y.x, b.y.y, b.y.z, 0, b.z.x, b.z.y, b.z.z, 0, t.origin.x, t.origin.y, t.origin.z, 1]

func _v3(v: Vector3) -> Array:
	return [v.x, v.y, v.z]

func _mesh(m: Mesh) -> Dictionary:
	if m is BoxMesh and m.subdivide_width == 0 and m.subdivide_height == 0 and m.subdivide_depth == 0:
		return {"kind": "box", "size": _v3(m.size)}
	var d := {"kind": "mesh"}
	if m is CylinderMesh:
		d = {"kind": "cylinder", "top": m.top_radius, "bottom": m.bottom_radius, "height": m.height,
			"segs": m.radial_segments, "caps": [m.cap_top, m.cap_bottom]}
	elif m is SphereMesh:
		d = {"kind": "sphere", "radius": m.radius, "height": m.height, "segs": m.radial_segments, "rings": m.rings}
	else:
		d.cls = m.get_class()
	if m.get_surface_count() != 1: push_error("bridge: %s has %d surfaces, only the first is written" % [m.get_class(), m.get_surface_count()])
	var a := m.surface_get_arrays(0)
	var pos := []; var nor := []; var col := []; var idx := []
	for v in a[Mesh.ARRAY_VERTEX]: pos.append_array(_v3(v))
	if a[Mesh.ARRAY_NORMAL]: for v in a[Mesh.ARRAY_NORMAL]: nor.append_array(_v3(v))
	if a[Mesh.ARRAY_COLOR]: for c in a[Mesh.ARRAY_COLOR]: col.append_array([c.r, c.g, c.b])
	var ix = a[Mesh.ARRAY_INDEX]
	if not ix: ix = range(pos.size() / 3)
	for i in range(0, ix.size(), 3): idx.append_array([ix[i], ix[i + 2], ix[i + 1]])   # clockwise → counter-clockwise
	d.pos = pos; d.idx = idx
	if nor: d.nor = nor
	if col: d.col = col
	return d

func _material(mat: Material) -> Dictionary:
	if mat is ShaderMaterial:
		var d := {"shader": mat.shader.resource_path.get_file()}
		for k in ["tint", "emission_color"]:
			var v = mat.get_shader_parameter(k)
			if v != null: d[k] = _v3(v)
		for k in ["emission_amount", "glossiness", "use_vcol", "toon_steps", "snap_strength"]:
			var v = mat.get_shader_parameter(k)
			if v != null: d[k] = v
		return d
	if mat is StandardMaterial3D:
		var c: Color = mat.albedo_color
		return {"shader": "standard", "tint": [c.r, c.g, c.b], "glossiness": 1.0 - mat.roughness}
	return {"shader": "none"}
