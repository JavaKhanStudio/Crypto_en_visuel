# r197 feasibility probe: can a script OUTSIDE Shadow build Shadow's server_rack headless and read
# its parts (mesh kind, size, transform, shader tint)? Run:
#   godot --headless --path /home/simon/Shadow -s $PWD/tools/godot_bridge/probe.gd
extends SceneTree

func _init() -> void:
	var Items = load("res://scripts/items/Items.gd")
	var rack: Node3D = Items.server_rack({})
	var n := 0
	var kinds := {}
	for m in _meshes(rack):
		n += 1
		var k: String = m.mesh.get_class()
		kinds[k] = kinds.get(k, 0) + 1
		if n <= 3:
			var mat = m.get_active_material(0) if m.mesh else null
			var params := []
			if mat is ShaderMaterial:
				for p in mat.shader.get_shader_uniform_list(): params.append(p.name)
			print(k, " ", m.mesh.get("size"), " ", m.transform.origin, " ", params.slice(0, 6))
	print("meshes: ", n, " ", kinds)
	quit()

func _meshes(n: Node) -> Array:
	var out := []
	if n is MeshInstance3D: out.append(n)
	for c in n.get_children(): out += _meshes(c)
	return out
