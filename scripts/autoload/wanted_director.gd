extends Node

signal wanted_changed(level: int, heat: float, state: String)

const MAX_HEAT: float = 5.0
const DECAY_DELAY: float = 10.0
const DECAY_PER_SECOND: float = 0.12

var heat: float = 0.0
var wanted_level: int = 0
var state: String = "CALM"
var last_known_position: Vector3 = Vector3.ZERO
var _seconds_since_crime: float = 0.0


func _ready() -> void:
	EventBus.crime_committed.connect(_on_crime_committed)


func _process(delta: float) -> void:
	if heat <= 0.0:
		return
	_seconds_since_crime += delta
	if _seconds_since_crime < DECAY_DELAY:
		return
	var old_level := wanted_level
	heat = maxf(heat - DECAY_PER_SECOND * delta, 0.0)
	wanted_level = ceili(heat)
	if heat <= 0.0:
		state = "CALM"
	elif state == "PURSUIT" and _seconds_since_crime > DECAY_DELAY + 4.0:
		state = "SEARCH"
	if wanted_level != old_level or heat <= 0.0:
		_emit_state()


func report_player_spotted(position: Vector3) -> void:
	if heat <= 0.0:
		return
	last_known_position = position
	_seconds_since_crime = 0.0
	if state != "PURSUIT":
		state = "PURSUIT"
		_emit_state()


func report_lost_sight() -> void:
	if wanted_level <= 0:
		return
	state = "SEARCH"
	_emit_state()


func get_hud_text() -> String:
	var stars := "★".repeat(wanted_level) + "☆".repeat(maxi(0, 5 - wanted_level))
	return "WANTED %s  %s" % [stars, state]


func _on_crime_committed(crime_type: String, position: Vector3, severity: float) -> void:
	last_known_position = position
	_seconds_since_crime = 0.0
	var previous_level := wanted_level
	heat = clampf(heat + maxf(severity, 0.0), 0.0, MAX_HEAT)
	wanted_level = ceili(heat)
	state = "PURSUIT"
	if wanted_level != previous_level or crime_type != "":
		_emit_state()


func _emit_state() -> void:
	wanted_changed.emit(wanted_level, heat, state)
	EventBus.wanted_state_changed.emit(wanted_level, state, last_known_position)
