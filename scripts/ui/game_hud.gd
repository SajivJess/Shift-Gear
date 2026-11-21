extends CanvasLayer

var _status_label: Label
var _hint_label: Label
var _help_label: Label
var _objective_label: Label


func _ready() -> void:
	_status_label = _make_label(Vector2(22.0, 18.0), 22, Color("e8f5f8"))
	_objective_label = _make_label(Vector2(22.0, 54.0), 16, Color("ffffff"))
	_hint_label = _make_label(Vector2(0.0, 0.0), 18, Color("f5d58b"))
	_hint_label.anchor_left = 0.5
	_hint_label.anchor_right = 0.5
	_hint_label.anchor_top = 0.80
	_hint_label.anchor_bottom = 0.80
	_hint_label.offset_left = -260.0
	_hint_label.offset_right = 260.0
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var crosshair := _make_label(Vector2(0.0, 0.0), 22, Color("ffffff"))
	crosshair.text = "+"
	crosshair.anchor_left = 0.5
	crosshair.anchor_right = 0.5
	crosshair.anchor_top = 0.5
	crosshair.anchor_bottom = 0.5
	crosshair.offset_left = -8.0
	crosshair.offset_right = 8.0
	crosshair.offset_top = -14.0
	crosshair.offset_bottom = 14.0
	crosshair.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_help_label = _make_label(Vector2(22.0, 0.0), 14, Color("d5e0e4"))
	_help_label.anchor_top = 1.0
	_help_label.anchor_bottom = 1.0
	_help_label.offset_top = -58.0
	_help_label.offset_bottom = -18.0
	_help_label.text = "WASD move/drive  |  E enter/exit  |  T/R transform  |  X boost  |  Space jump/brake/lift  |  C dive  |  IJKL flight trim  |  V camera  |  Esc cursor"


func _process(_delta: float) -> void:
	var player := get_tree().get_first_node_in_group("player") as ShiftgearPlayer
	if player == null:
		return
	if player.controlled_vehicle != null:
		_status_label.text = "%s  |  %s  |  REP %s %d" % [
			WantedDirector.get_hud_text(),
			player.controlled_vehicle.get_hud_summary(),
			ReputationManager.get_alignment_label(),
			ReputationManager.alignment_score
		]
		_hint_label.text = "Driving: %s" % player.controlled_vehicle.get_mode_name()
	else:
		_status_label.text = "%s  |  REP %s %d" % [
			WantedDirector.get_hud_text(),
			ReputationManager.get_alignment_label(),
			ReputationManager.alignment_score
		]
		_hint_label.text = player.get_interaction_hint()
	_objective_label.text = MissionDirector.get_objective_text()


func _make_label(position_value: Vector2, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.position = position_value
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.85))
	label.add_theme_constant_override("shadow_offset_x", 2)
	label.add_theme_constant_override("shadow_offset_y", 2)
	add_child(label)
	return label
