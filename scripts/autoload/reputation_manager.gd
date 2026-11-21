extends Node

signal alignment_changed(score: int, label: String)

const MIN_ALIGNMENT: int = -100
const MAX_ALIGNMENT: int = 100

var alignment_score: int = 0


func _ready() -> void:
	EventBus.crime_committed.connect(_on_crime_committed)


func adjust_alignment(amount: int, reason: String) -> void:
	var old_score := alignment_score
	alignment_score = clampi(alignment_score + amount, MIN_ALIGNMENT, MAX_ALIGNMENT)
	if alignment_score == old_score:
		return
	alignment_changed.emit(alignment_score, get_alignment_label())
	EventBus.reputation_changed.emit(alignment_score, reason)


func get_alignment_label() -> String:
	if alignment_score <= -30:
		return "CRIMINAL"
	if alignment_score >= 30:
		return "ENFORCER"
	return "UNALIGNED"


func _on_crime_committed(crime_type: String, _position: Vector3, severity: float) -> void:
	var penalty := -2
	if crime_type == "npc_attack" or crime_type == "property_damage":
		penalty = -roundi(maxf(severity, 1.0) * 5.0)
	adjust_alignment(penalty, crime_type)
