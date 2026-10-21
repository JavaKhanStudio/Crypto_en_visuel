# r208: proves the way back. Builds each Shadow item twice, as Shadow does (Items.gd) and through the
# builder to_gdscript.py generated from its bridge JSON, then compares them part by part: mesh kind and
# numbers, global transform, the retro shader's uniforms, the names ItemView looks for. Shadow is read
# only; the generated scripts load from OUTSIDE it:
#   godot --headless --path /home/simon/Shadow -s $PWD/tools/godot_bridge/roundtrip.gd -- $PWD/out/godot
extends SceneTree

const EPS := 1e-4
const UNIFORMS := ["tint", "emission_amount", "emission_color", "glossiness", "snap_strength", "toon_steps"]

func _init() -> void:
	var dir: String = OS.get_cmdline_user_args()[0]
	var Items = load("res://scripts/items/Items.gd")
	var bad := 0
	for item in ["server_rack", "tower", "laptop"]:
		var Gen = load(dir.path_join(item + ".gd"))
		var a: Node3D = Items.laptop({}, 115.0, 0) if item == "laptop" else Items.call(item, {}, 0)
		var b: Node3D = Gen.call(item, {})
		var pa := _parts(a, Transform3D.IDENTITY, ""); var pb := _parts(b, Transform3D.IDENTITY, "")
		var errs := []
		if pa.size() != pb.size(): errs.append("parts %d vs %d" % [pa.size(), pb.size()])
		for i in min(pa.size(), pb.size()):
			var e := _diff(pa[i], pb[i])
			if e: errs.append("part %d %s: %s" % [i, pa[i].path, e])
		var meshes := pa.filter(func(p): return p.has("mesh")).size()
		print("[roundtrip] ", item, ": ", meshes, " meshes, ", pa.size() - meshes, " groups, ",
			"all equal" if not errs else "%d DIFFER" % errs.size())
		for e in errs.slice(0, 8): print("    ", e)
		bad += errs.size()
		a.free(); b.free()
	print("[roundtrip] ", "all ok" if bad == 0 else "FAILED")
	quit(1 if bad else 0)

# The parts in tree order, as export.gd sees them: visible meshes, and the nodes that hold some.
func _parts(n: Node, parent: Transform3D, path: String) -> Array:
	var out := []
	if n is Node3D and not n.visible: return out
	var t: Transform3D = parent * n.transform if n is Node3D else parent
	var named := "" if String(n.name).begins_with("@") or path == "" else String(n.name)
	var me := {"path": path + "/" + named, "name": named, "t": t}
	if n is MeshInstance3D and n.mesh:
		me.mesh = _mesh(n.mesh); me.mat = _mat(n.get_active_material(0))
	var kids := []
	for c in n.get_children(): kids += _parts(c, t, me.path)
	if path != "" and (me.has("mesh") or kids): out.append(me)
	return out + kids

func _mesh(m: Mesh) -> Dictionary:
	if m is BoxMesh: return {"kind": "box", "size": m.size}
	if m is CylinderMesh: return {"kind": "cyl", "top": m.top_radius, "bottom": m.bottom_radius, "height": m.height,
		"segs": m.radial_segments, "caps": [m.cap_top, m.cap_bottom], "rings": m.rings}
	return {"kind": m.get_class()}

func _mat(mat: Material) -> Dictionary:
	var d := {}
	if mat is ShaderMaterial:
		d.shader = mat.shader.resource_path
		for k in UNIFORMS: d[k] = mat.get_shader_parameter(k)
	return d

func _diff(a: Dictionary, b: Dictionary) -> String:
	if a.name != b.name: return "name %s vs %s" % [a.name, b.name]
	if a.has("mesh") != b.has("mesh"): return "mesh vs group"
	if not a.t.is_equal_approx(b.t) and not _close_t(a.t, b.t): return "transform %s vs %s" % [a.t, b.t]
	if a.has("mesh"):
		for k in a.mesh:
			if not _close(a.mesh[k], b.mesh.get(k)): return "%s %s vs %s" % [k, a.mesh[k], b.mesh.get(k)]
		for k in a.mat:
			if not _close(a.mat[k], b.mat.get(k)): return "%s %s vs %s" % [k, a.mat[k], b.mat.get(k)]
	return ""

func _close_t(a: Transform3D, b: Transform3D) -> bool:
	return _close(a.origin, b.origin) and _close(a.basis.x, b.basis.x) and _close(a.basis.y, b.basis.y) and _close(a.basis.z, b.basis.z)

func _close(x, y) -> bool:
	if x is Vector3 and y is Vector3: return (x - y).length() < EPS
	if (x is float or x is int) and (y is float or y is int): return abs(x - y) < EPS
	return x == y
