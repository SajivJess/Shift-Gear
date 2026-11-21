extends Node
class_name NanotechOrchestrator

## Nanotech Mode & Attachment Orchestrator (Antigravity System)
## Manages visual transformation sequences, attachment bone/socket offsets,
## and ObjectSpaceDissolve shader uniforms across vehicle transformation modes.

signal transformation_started(target_mode: int)
signal transformation_completed(target_mode: int)

@export var dissolve_duration: float = 0.8
@export var nanotech_dissolve_material: ShaderMaterial = null

var parent_vehicle: ShiftgearVehicle = null
var is_transforming: bool = false
var _current_dissolve_time: float = 0.0


func _ready() -> void:
	if get_parent() is ShiftgearVehicle:
		parent_vehicle = get_parent() as ShiftgearVehicle
		parent_vehicle.connect("mode_changed", _on_vehicle_mode_changed)


func _on_vehicle_mode_changed(new_mode: int, mode_name: String) -> void:
	if is_transforming:
		return
	_start_transformation_sequence(new_mode)


func _start_transformation_sequence(target_mode: int) -> void:
	is_transforming = true
	emit_signal("transformation_started", target_mode)

	# Drive dissolve shader uniform if a shader material is assigned
	if nanotech_dissolve_material != null:
		var tween := create_tween()
		tween.tween_property(nanotech_dissolve_material, "shader_parameter/dissolve_progress", 1.0, dissolve_duration * 0.5)
		tween.tween_callback(Callable(self, "_update_attachments").bind(target_mode))
		tween.tween_property(nanotech_dissolve_material, "shader_parameter/dissolve_progress", 0.0, dissolve_duration * 0.5)
		tween.tween_callback(Callable(self, "_complete_transformation").bind(target_mode))
	else:
		_update_attachments(target_mode)
		_complete_transformation(target_mode)


func _update_attachments(target_mode: int) -> void:
	if parent_vehicle == null:
		return

	# The parent vehicle manages the kit visibility; orchestrator triggers specialized animated components
	match target_mode:
		ShiftgearVehicle.MODE_NORMAL:
			_retract_all_attachments()
		ShiftgearVehicle.MODE_SUPERCAR:
			_deploy_supercar_attachments()
		ShiftgearVehicle.MODE_FLIGHT:
			_deploy_flight_attachments()
		ShiftgearVehicle.MODE_UNDERWATER:
			_deploy_underwater_attachments()


func _deploy_supercar_attachments() -> void:
	# Deploy front splitters, rear wing, lower body ground-effect skirts
	pass


func _deploy_flight_attachments() -> void:
	# Unfold wing spars, deploy rear thruster nozzles, adjust wheel camber for flight
	pass


func _deploy_underwater_attachments() -> void:
	# Close canopy seals, deploy twin rear hydro-props, extend dive planes
	pass


func _retract_all_attachments() -> void:
	pass


func _complete_transformation(target_mode: int) -> void:
	is_transforming = false
	emit_signal("transformation_completed", target_mode)
