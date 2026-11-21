extends Node3D
class_name ShiftgearPoliceSpawner

## Police Spawner and Escalation Director (Antigravity World System)
## Interfaces with Codex's Autoloads: WantedDirector and EventBus

@export var max_patrol_cars: int = 4
@export var min_spawn_distance: float = 35.0
@export var max_spawn_distance: float = 65.0
@export var helicopter_enabled: bool = true

var active_pursuit_units: Array[Node3D] = []
var active_helicopter: Node3D = null
var _roadblock_nodes: Array[Node3D] = []


func _ready() -> void:
	if has_node("/root/WantedDirector"):
		var wanted = get_node("/root/WantedDirector")
		wanted.connect("wanted_changed", _on_wanted_changed)
	if has_node("/root/EventBus"):
		var bus = get_node("/root/EventBus")
		bus.connect("crime_committed", _on_crime_committed)


func _on_wanted_changed(level: int, heat: float, state: String) -> void:
	match state:
		"CALM":
			_despawn_all_units()
		"PURSUIT":
			_coordinate_pursuit(level, heat)
		"SEARCH":
			_coordinate_search()


func _coordinate_pursuit(level: int, heat: float) -> void:
	var target_units := clampi(level, 1, max_patrol_cars)
	while active_pursuit_units.size() < target_units:
		_spawn_patrol_unit()

	if level >= 3 and active_helicopter == null and helicopter_enabled:
		_spawn_police_helicopter()


func _coordinate_search() -> void:
	# Maintain search perimeter around last known position without spawning additional heavy units
	pass


func _spawn_patrol_unit() -> void:
	# In prototype blockout, instantiate a placeholder police cruiser unit
	var unit := Node3D.new()
	unit.name = "PoliceUnit_" + str(active_pursuit_units.size() + 1)
	add_child(unit)
	active_pursuit_units.append(unit)


func _spawn_police_helicopter() -> void:
	var heli := Node3D.new()
	heli.name = "PoliceAirSupport"
	heli.position = Vector3(0, 25.0, 0)
	add_child(heli)
	active_helicopter = heli


func _despawn_all_units() -> void:
	for unit in active_pursuit_units:
		if is_instance_valid(unit):
			unit.queue_free()
	active_pursuit_units.clear()

	if active_helicopter != null and is_instance_valid(active_helicopter):
		active_helicopter.queue_free()
		active_helicopter = null


func _on_crime_committed(crime_type: String, pos: Vector3, severity: float) -> void:
	# Alert nearby police units to investigate the crime locus
	pass
