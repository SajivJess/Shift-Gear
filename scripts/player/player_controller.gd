extends CharacterBody3D
class_name ShiftgearPlayer

@export var walk_speed: float = 5.5
@export var sprint_speed: float = 8.0
@export var jump_velocity: float = 5.0
@export var mouse_sensitivity: float = 0.0022

@onready var body_mesh: MeshInstance3D = $BodyMesh
@onready var camera_pivot: Node3D = $CameraPivot
@onready var camera_arm: SpringArm3D = $CameraPivot/SpringArm3D
@onready var player_camera: Camera3D = $CameraPivot/SpringArm3D/Camera3D
@onready var interact_ray: RayCast3D = $CameraPivot/SpringArm3D/Camera3D/InteractRay

var controlled_vehicle: ShiftgearVehicle
var _camera_pitch: float = -0.12
var _third_person_distance: float = 4.0
var _first_person: bool = false
var _saved_collision_layer: int = 1
var _saved_collision_mask: int = 1
var _interaction_hint: String = "Walk to a vehicle and press E to take control."


func _ready() -> void:
	add_to_group("player")
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	player_camera.current = true
	_update_camera()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("toggle_camera"):
		if controlled_vehicle != null:
			controlled_vehicle.toggle_camera()
		else:
			_toggle_player_camera()
		get_viewport().set_input_as_handled()
		return

	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		if controlled_vehicle != null:
			controlled_vehicle.apply_camera_look(event.relative, mouse_sensitivity)
		else:
			camera_pivot.rotation.y -= event.relative.x * mouse_sensitivity
			_camera_pitch = clampf(_camera_pitch - event.relative.y * mouse_sensitivity, -1.1, 0.75)
			_update_camera()


func _physics_process(delta: float) -> void:
	if controlled_vehicle != null:
		if controlled_vehicle.driver_seat != null:
			global_transform = controlled_vehicle.driver_seat.global_transform
		if Input.is_action_just_pressed("interact"):
			controlled_vehicle.release_control()
		return

	if Input.is_action_just_pressed("interact"):
		_try_enter_vehicle()

	var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var move_basis := camera_pivot.global_basis
	var direction := move_basis * Vector3(input_vector.x, 0.0, input_vector.y)
	direction.y = 0.0
	if direction.length_squared() > 1.0:
		direction = direction.normalized()

	var target_speed := walk_speed
	if Input.is_key_pressed(KEY_SHIFT):
		target_speed = sprint_speed
	velocity.x = direction.x * target_speed
	velocity.z = direction.z * target_speed

	if not is_on_floor():
		velocity.y -= float(ProjectSettings.get_setting("physics/3d/default_gravity")) * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = jump_velocity

	move_and_slide()
	if is_on_floor() and velocity.y < 0.0:
		velocity.y = 0.0

	if not Input.is_action_pressed("interact"):
		_update_interaction_hint()


func _try_enter_vehicle() -> void:
	interact_ray.force_raycast_update()
	var target := interact_ray.get_collider()
	if target is ShiftgearVehicle:
		if target.request_control(self):
			return
	_interaction_hint = "No available vehicle in reach."


func begin_vehicle_control(vehicle: ShiftgearVehicle) -> void:
	controlled_vehicle = vehicle
	_saved_collision_layer = collision_layer
	_saved_collision_mask = collision_mask
	collision_layer = 0
	collision_mask = 0
	global_transform = vehicle.driver_seat.global_transform
	body_mesh.visible = false
	player_camera.current = false
	_interaction_hint = "Driving. Press E to exit; T changes nanotech mode."


func end_vehicle_control(vehicle: ShiftgearVehicle, exit_transform: Transform3D) -> void:
	if controlled_vehicle != vehicle:
		return
	global_position = exit_transform.origin + Vector3.UP * 0.12
	velocity = Vector3.ZERO
	controlled_vehicle = null
	collision_layer = _saved_collision_layer
	collision_mask = _saved_collision_mask
	body_mesh.visible = not _first_person
	player_camera.current = true
	_interaction_hint = "On foot. Press E near a vehicle to take control."


func get_interaction_hint() -> String:
	return _interaction_hint


func _update_interaction_hint() -> void:
	interact_ray.force_raycast_update()
	var target := interact_ray.get_collider()
	if target is ShiftgearVehicle and target.driver == null:
		_interaction_hint = "[E] Take control of vehicle"
	else:
		_interaction_hint = "WASD move | Shift sprint | Space jump | E enter/exit"


func _toggle_player_camera() -> void:
	_first_person = not _first_person
	if _first_person:
		camera_arm.spring_length = 0.08
		body_mesh.visible = false
	else:
		camera_arm.spring_length = _third_person_distance
		body_mesh.visible = true


func _update_camera() -> void:
	camera_arm.rotation.x = _camera_pitch
