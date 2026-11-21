extends Node3D

const WORLD_EXTENT: float = 120.0

var _ground_material: StandardMaterial3D
var _road_material: StandardMaterial3D
var _line_material: StandardMaterial3D
var _water_material: StandardMaterial3D


func _ready() -> void:
	_create_materials()
	_create_lighting()
	_create_ground_and_pool()
	_create_roads()
	_create_blockout_buildings()


func _create_materials() -> void:
	_ground_material = _material(Color("42664f"))
	_road_material = _material(Color("30363b"))
	_line_material = _material(Color("d8d1a0"))
	_water_material = _material(Color(0.06, 0.42, 0.58, 0.68))
	_water_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA


func _material(color: Color) -> StandardMaterial3D:
	var result := StandardMaterial3D.new()
	result.albedo_color = color
	result.roughness = 0.88
	return result


func _create_lighting() -> void:
	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-52.0, -28.0, 0.0)
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	add_child(sun)

	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("91b7c8")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("a9bac0")
	environment.ambient_light_energy = 0.65
	var world_environment := WorldEnvironment.new()
	world_environment.environment = environment
	add_child(world_environment)


func _create_ground_and_pool() -> void:
	# The four ground slabs leave a 20 x 30 m opening for the underwater test pool.
	_add_static_box("WestTerrain", Vector3(80.0, 1.0, WORLD_EXTENT), Vector3(-30.0, -0.5, 0.0), _ground_material)
	_add_static_box("EastTerrain", Vector3(70.0, 1.0, WORLD_EXTENT), Vector3(65.0, -0.5, 0.0), _ground_material)
	_add_static_box("NorthTerrain", Vector3(20.0, 1.0, 45.0), Vector3(20.0, -0.5, -37.5), _ground_material)
	_add_static_box("SouthTerrain", Vector3(20.0, 1.0, 45.0), Vector3(20.0, -0.5, 37.5), _ground_material)
	_add_static_box("PoolFloor", Vector3(20.0, 1.0, 30.0), Vector3(20.0, -14.5, 0.0), _material(Color("263b48")))
	_add_static_box("PoolEastWall", Vector3(0.8, 14.0, 30.0), Vector3(30.4, -7.0, 0.0), _material(Color("56666b")))
	_add_static_box("PoolNorthWall", Vector3(20.0, 14.0, 0.8), Vector3(20.0, -7.0, -15.4), _material(Color("56666b")))
	_add_static_box("PoolSouthWall", Vector3(20.0, 14.0, 0.8), Vector3(20.0, -7.0, 15.4), _material(Color("56666b")))

	var water := MeshInstance3D.new()
	water.name = "CoastalTestWater"
	var water_mesh := BoxMesh.new()
	water_mesh.size = Vector3(20.0, 0.06, 30.0)
	water.mesh = water_mesh
	water.material_override = _water_material
	water.position = Vector3(20.0, 0.02, 0.0)
	add_child(water)


func _create_roads() -> void:
	_add_visual_box("MainRoad", Vector3(9.0, 0.08, 84.0), Vector3(-11.0, 0.025, 0.0), _road_material)
	_add_visual_box("DockApproach", Vector3(31.0, 0.08, 8.0), Vector3(8.5, 0.027, 0.0), _road_material)
	for z in range(-36, 37, 8):
		_add_visual_box("RoadDash", Vector3(0.18, 0.025, 3.2), Vector3(-11.0, 0.08, float(z)), _line_material)
	for x in range(-4, 17, 8):
		_add_visual_box("DockDash", Vector3(3.2, 0.025, 0.18), Vector3(float(x), 0.08, 0.0), _line_material)


func _create_blockout_buildings() -> void:
	_add_building("Workshop", Vector3(10.0, 8.0, 12.0), Vector3(-35.0, 4.0, -18.0), Color("8e7968"))
	_add_building("ApartmentBlock", Vector3(13.0, 18.0, 12.0), Vector3(-51.0, 9.0, 18.0), Color("667b83"))
	_add_building("Warehouse", Vector3(16.0, 9.0, 14.0), Vector3(2.0, 4.5, -35.0), Color("847d69"))
	_add_building("PortOffice", Vector3(9.0, 7.0, 8.0), Vector3(49.0, 3.5, -24.0), Color("7f8d88"))
	_add_building("HangarBlockout", Vector3(22.0, 10.0, 16.0), Vector3(65.0, 5.0, 28.0), Color("7e8790"))

	# A low test ramp gives the player a safe launch point for Flight Mode.
	var ramp_material := _material(Color("bd663d"))
	_add_static_box("RampCollision", Vector3(8.0, 0.8, 13.0), Vector3(-11.0, 0.45, -48.0), ramp_material, Vector3(-12.0, 0.0, 0.0))


func _add_building(label: String, size: Vector3, position: Vector3, color: Color) -> void:
	_add_static_box(label, size, position, _material(color))
	_add_visual_box("Roof_" + label, Vector3(size.x * 0.75, 0.3, size.z * 0.75), position + Vector3(0.0, size.y * 0.5 + 0.15, 0.0), _material(Color("d0a36d")))


func _add_static_box(label: String, size: Vector3, position: Vector3, material: Material, rotation_degrees: Vector3 = Vector3.ZERO) -> void:
	var body := StaticBody3D.new()
	body.name = label
	body.position = position
	body.rotation_degrees = rotation_degrees
	var collision := CollisionShape3D.new()
	var box_shape := BoxShape3D.new()
	box_shape.size = size
	collision.shape = box_shape
	body.add_child(collision)
	var mesh_instance := MeshInstance3D.new()
	var box_mesh := BoxMesh.new()
	box_mesh.size = size
	mesh_instance.mesh = box_mesh
	mesh_instance.material_override = material
	body.add_child(mesh_instance)
	add_child(body)


func _add_visual_box(label: String, size: Vector3, position: Vector3, material: Material, rotation_degrees: Vector3 = Vector3.ZERO) -> void:
	var mesh_instance := MeshInstance3D.new()
	mesh_instance.name = label
	var box_mesh := BoxMesh.new()
	box_mesh.size = size
	mesh_instance.mesh = box_mesh
	mesh_instance.material_override = material
	mesh_instance.position = position
	mesh_instance.rotation_degrees = rotation_degrees
	add_child(mesh_instance)
