extends RigidBody3D
class_name ShiftgearVehicle

signal mode_changed(mode: int, mode_name: String)
signal energy_changed(current_energy: float, maximum_energy: float)

const MODE_NORMAL: int = 0
const MODE_SUPERCAR: int = 1
const MODE_FLIGHT: int = 2
const MODE_UNDERWATER: int = 3

@export var nanotech_profile: NanotechProfile
@export var vehicle_label: String = "Civilian Sedan"

@onready var wheel_rays: Array[RayCast3D] = [
	$WheelRays/FrontLeft,
	$WheelRays/FrontRight,
	$WheelRays/RearLeft,
	$WheelRays/RearRight
]
@onready var camera_pivot: Node3D = $CameraPivot
@onready var camera_arm: SpringArm3D = $CameraPivot/SpringArm3D
@onready var vehicle_camera: Camera3D = $CameraPivot/SpringArm3D/Camera3D
@onready var driver_seat: Marker3D = $DriverSeat
@onready var exit_marker: Marker3D = $ExitMarker
@onready var supercar_kit: Node3D = $NanotechAttachments/SupercarKit
@onready var flight_kit: Node3D = $NanotechAttachments/FlightKit
@onready var underwater_kit: Node3D = $NanotechAttachments/UnderwaterKit

var driver: CharacterBody3D
var mode: int = MODE_NORMAL
var energy: float = 100.0
var _camera_pitch: float = -0.12
var _third_person_distance: float = 6.0
var _last_wheel_distances: Array[float] = [0.72, 0.72, 0.72, 0.72]
var _wheel_contact_count: int = 0


func _ready() -> void:
	add_to_group("vehicles")
	if nanotech_profile == null:
		nanotech_profile = NanotechProfile.new()
	energy = nanotech_profile.maximum_energy
	vehicle_camera.current = false
	_set_attachment(supercar_kit, false)
	_set_attachment(flight_kit, false)
	_set_attachment(underwater_kit, false)
	emit_signal("energy_changed", energy, nanotech_profile.maximum_energy)


func _physics_process(delta: float) -> void:
	if mode == MODE_NORMAL or mode == MODE_SUPERCAR:
		_apply_suspension(delta)

	if driver == null:
		return

	if Input.is_action_just_pressed("transform_next"):
		cycle_mode()
	elif Input.is_action_just_pressed("transform_previous"):
		set_mode((mode + 3) % 4)

	var throttle := Input.get_action_strength("vehicle_accelerate") - Input.get_action_strength("vehicle_reverse")
	var steering := Input.get_action_strength("vehicle_right") - Input.get_action_strength("vehicle_left")
	var forward := -global_basis.z
	var mass_gravity := mass * float(ProjectSettings.get_setting("physics/3d/default_gravity"))

	match mode:
		MODE_NORMAL:
			_apply_road_control(throttle, steering, nanotech_profile.normal_engine_force)
		MODE_SUPERCAR:
			_apply_road_control(throttle, steering, nanotech_profile.supercar_engine_force)
			_consume_energy(nanotech_profile.supercar_drain_per_second * delta)
			if Input.is_action_pressed("vehicle_boost") and energy > 0.0:
				apply_central_force(forward * nanotech_profile.boost_force)
				_consume_energy(nanotech_profile.boost_drain_per_second * delta)
		MODE_FLIGHT:
			_apply_aerial_control(throttle, steering, mass_gravity)
			_consume_energy(nanotech_profile.flight_drain_per_second * delta)
		MODE_UNDERWATER:
			_apply_underwater_control(throttle, steering, mass_gravity)
			_consume_energy(nanotech_profile.underwater_drain_per_second * delta)

func request_control(new_driver: CharacterBody3D) -> bool:
	if driver != null or new_driver == null:
		return false
	driver = new_driver
	new_driver.call("begin_vehicle_control", self)
	vehicle_camera.current = true
	EventBus.vehicle_hijacked.emit(self, global_position)
	EventBus.crime_committed.emit("vehicle_theft", global_position, 1.0)
	return true


func release_control() -> void:
	if driver == null:
		return
	var previous_driver := driver
	driver = null
	vehicle_camera.current = false
	previous_driver.call("end_vehicle_control", self, exit_marker.global_transform)


func cycle_mode() -> void:
	set_mode((mode + 1) % 4)


func set_mode(next_mode: int) -> void:
	if next_mode < MODE_NORMAL or next_mode > MODE_UNDERWATER or next_mode == mode:
		return
	if next_mode != MODE_NORMAL and energy < nanotech_profile.transformation_cost:
		return
	if next_mode != MODE_NORMAL:
		_consume_energy(nanotech_profile.transformation_cost)
	mode = next_mode
	_set_attachment(supercar_kit, mode == MODE_SUPERCAR)
	_set_attachment(flight_kit, mode == MODE_FLIGHT)
	_set_attachment(underwater_kit, mode == MODE_UNDERWATER)
	emit_signal("mode_changed", mode, get_mode_name())
	EventBus.vehicle_mode_changed.emit(self, mode, global_position)


func get_mode_name() -> String:
	match mode:
		MODE_SUPERCAR:
			return "SUPERCAR"
		MODE_FLIGHT:
			return "FLIGHT"
		MODE_UNDERWATER:
			return "UNDERWATER"
		_:
			return "NORMAL"


func get_hud_summary() -> String:
	return "%s | %s | Energy %d%% | Speed %d km/h" % [
		vehicle_label,
		get_mode_name(),
		roundi(energy / nanotech_profile.maximum_energy * 100.0),
		roundi(linear_velocity.length() * 3.6)
	]


func apply_camera_look(relative: Vector2, sensitivity: float) -> void:
	camera_pivot.rotation.y -= relative.x * sensitivity
	_camera_pitch = clampf(_camera_pitch - relative.y * sensitivity, -1.0, 0.55)
	camera_arm.rotation.x = _camera_pitch


func toggle_camera() -> void:
	if camera_arm.spring_length > 1.0:
		camera_arm.spring_length = 0.08
	else:
		camera_arm.spring_length = _third_person_distance


func _apply_road_control(throttle: float, steering: float, engine_force: float) -> void:
	var forward := -global_basis.z
	var forward_speed := linear_velocity.dot(forward)
	apply_central_force(forward * throttle * engine_force)
	var steer_scale := clampf(absf(forward_speed) / 5.0, 0.2, 1.0)
	apply_torque(Vector3.UP * -steering * 2500.0 * steer_scale)
	if Input.is_action_pressed("vehicle_brake") and absf(forward_speed) > 0.1:
		apply_central_force(-forward * signf(forward_speed) * nanotech_profile.brake_force)
	if _wheel_contact_count > 0:
		apply_central_force(-linear_velocity * 45.0)
	if mode == MODE_SUPERCAR:
		apply_central_force(Vector3.UP * clampf(forward_speed, 0.0, 55.0) * 28.0)


func _apply_aerial_control(throttle: float, steering: float, mass_gravity: float) -> void:
	var forward := -global_basis.z
	apply_central_force(Vector3.UP * mass_gravity)
	apply_central_force(forward * throttle * nanotech_profile.flight_thrust)
	var vertical_input := Input.get_action_strength("jump") - Input.get_action_strength("vehicle_dive")
	apply_central_force(Vector3.UP * vertical_input * nanotech_profile.flight_vertical_force)
	apply_torque(Vector3.UP * -steering * nanotech_profile.flight_steering_torque)
	var pitch_input := Input.get_action_strength("vehicle_pitch_down") - Input.get_action_strength("vehicle_pitch_up")
	var roll_input := Input.get_action_strength("vehicle_roll_right") - Input.get_action_strength("vehicle_roll_left")
	apply_torque(global_basis.x * pitch_input * nanotech_profile.flight_steering_torque * 0.75)
	apply_torque(global_basis.z * roll_input * nanotech_profile.flight_steering_torque * 0.65)
	apply_central_force(-linear_velocity * 22.0)


func _apply_underwater_control(throttle: float, steering: float, mass_gravity: float) -> void:
	var forward := -global_basis.z
	if global_position.y < nanotech_profile.water_surface_height:
		apply_central_force(Vector3.UP * mass_gravity)
	apply_central_force(forward * throttle * nanotech_profile.underwater_thrust)
	var depth_input := Input.get_action_strength("vehicle_dive") - Input.get_action_strength("jump")
	apply_central_force(Vector3.UP * -depth_input * nanotech_profile.underwater_depth_force)
	apply_torque(Vector3.UP * -steering * nanotech_profile.flight_steering_torque * 0.7)
	var pitch_input := Input.get_action_strength("vehicle_pitch_down") - Input.get_action_strength("vehicle_pitch_up")
	apply_torque(global_basis.x * pitch_input * nanotech_profile.flight_steering_torque * 0.5)
	apply_central_force(-linear_velocity * 35.0)


func _apply_suspension(delta: float) -> void:
	_wheel_contact_count = 0
	for index in range(wheel_rays.size()):
		var ray := wheel_rays[index]
		ray.force_raycast_update()
		if not ray.is_colliding():
			_last_wheel_distances[index] = nanotech_profile.wheel_rest_length
			continue
		_wheel_contact_count += 1
		var distance := ray.global_position.distance_to(ray.get_collision_point())
		var compression := clampf(nanotech_profile.wheel_rest_length - distance, 0.0, nanotech_profile.wheel_rest_length)
		var compression_rate := (_last_wheel_distances[index] - distance) / maxf(delta, 0.001)
		var support := nanotech_profile.suspension_strength * compression + nanotech_profile.suspension_damping * compression_rate
		support = clampf(support, 0.0, 18000.0)
		apply_force(ray.get_collision_normal() * support, ray.position)
		var lateral_speed := linear_velocity.dot(global_basis.x)
		apply_force(-global_basis.x * lateral_speed * nanotech_profile.lateral_grip, ray.position)
		_last_wheel_distances[index] = distance


func _consume_energy(amount: float) -> void:
	if amount <= 0.0:
		return
	energy = maxf(energy - amount, 0.0)
	emit_signal("energy_changed", energy, nanotech_profile.maximum_energy)
	if energy <= 0.0 and mode != MODE_NORMAL:
		set_mode(MODE_NORMAL)


func _set_attachment(attachment: Node3D, enabled: bool) -> void:
	if attachment == null:
		return
	if not enabled:
		attachment.visible = false
		return
	attachment.visible = true
	var target_scale := Vector3.ONE
	attachment.scale = target_scale * 0.04
	var tween := create_tween()
	tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(attachment, "scale", target_scale, 0.3)
