extends Node
class_name InteractableVehicle

## InteractableVehicle Component (Antigravity System)
## Can be attached to any vehicle body (ShiftgearVehicle or NPC Traffic Car)
## Manages interaction prompts, NPC driver ejection, and player control handoff.

signal vehicle_entered(player: Node3D)
signal vehicle_exited(player: Node3D)
signal driver_hijacked(npc_driver: Node3D)

@export var interaction_distance: float = 3.5
@export var prompt_message: String = "Press E to Take Control"
@export var is_locked: bool = false

var parent_vehicle: ShiftgearVehicle = null
var current_npc_driver: Node3D = null


func _ready() -> void:
	if get_parent() is ShiftgearVehicle:
		parent_vehicle = get_parent() as ShiftgearVehicle


func can_interact(player: Node3D) -> bool:
	if is_locked or parent_vehicle == null:
		return false
	if parent_vehicle.driver != null:
		return false
	return parent_vehicle.global_position.distance_to(player.global_position) <= interaction_distance


func execute_hijack(player: CharacterBody3D) -> bool:
	if not can_interact(player):
		return false

	# If there is an NPC driver in the vehicle, trigger their flee/evacuate behavior
	if current_npc_driver != null:
		_eject_npc_driver()

	# Hand control over to the player
	var success: bool = parent_vehicle.request_control(player)
	if success:
		emit_signal("vehicle_entered", player)
	return success


func _eject_npc_driver() -> void:
	if current_npc_driver == null:
		return

	emit_signal("driver_hijacked", current_npc_driver)

	# If NPC has LimboAI or custom flee state, trigger flee
	if current_npc_driver.has_method("trigger_flee"):
		current_npc_driver.call("trigger_flee", parent_vehicle.global_position)
	elif current_npc_driver.has_node("Blackboard"):
		var bb = current_npc_driver.get_node("Blackboard")
		bb.set_var("is_panicked", true)

	# Reparent NPC outside the vehicle exit marker
	if parent_vehicle.exit_marker != null:
		current_npc_driver.global_position = parent_vehicle.exit_marker.global_position

	current_npc_driver = null
