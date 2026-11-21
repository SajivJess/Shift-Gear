extends Node

signal objective_changed(objective: String, step: int, completed: bool)

const MISSION_ID: String = "nanotech_shakedown"
const FLIGHT_CLEARANCE_HEIGHT: float = 4.0
const UNDERWATER_CLEARANCE_DEPTH: float = -2.0

var step: int = 0
var completed: bool = false
var objective: String = "Take control of the prototype sedan (E)."


func _ready() -> void:
	EventBus.vehicle_hijacked.connect(_on_vehicle_hijacked)
	EventBus.vehicle_mode_changed.connect(_on_vehicle_mode_changed)
	_emit_objective()


func _process(_delta: float) -> void:
	if completed:
		return
	var player := get_tree().get_first_node_in_group("player") as ShiftgearPlayer
	if player == null or player.controlled_vehicle == null:
		return
	var vehicle := player.controlled_vehicle
	if step == 2 and vehicle.mode == ShiftgearVehicle.MODE_FLIGHT and vehicle.global_position.y >= FLIGHT_CLEARANCE_HEIGHT:
		_advance_to(3, "Enter Underwater Mode and descend at least 2 m. Use C to dive.")
	elif step == 3 and vehicle.mode == ShiftgearVehicle.MODE_UNDERWATER and vehicle.global_position.y <= UNDERWATER_CLEARANCE_DEPTH:
		completed = true
		objective = "Prototype route complete. Continue exploring or return to the dock."
		_emit_objective()


func get_objective_text() -> String:
	return "MISSION: %s" % objective


func _on_vehicle_hijacked(_vehicle: Node3D, _position: Vector3) -> void:
	if step == 0:
		_advance_to(1, "Activate Supercar Mode (T) and test the boost (X).")


func _on_vehicle_mode_changed(_vehicle: Node3D, mode: int, _position: Vector3) -> void:
	if step == 1 and mode == ShiftgearVehicle.MODE_SUPERCAR:
		_advance_to(2, "Activate Flight Mode (T), then climb above 4 m with Space.")
	elif step == 2 and mode == ShiftgearVehicle.MODE_UNDERWATER:
		_advance_to(3, "Dive below the water surface. Use C to descend.")


func _advance_to(next_step: int, next_objective: String) -> void:
	step = next_step
	objective = next_objective
	_emit_objective()


func _emit_objective() -> void:
	objective_changed.emit(objective, step, completed)
	EventBus.mission_updated.emit(MISSION_ID, objective, completed)
