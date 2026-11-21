class_name ShiftgearSaveSlots
extends RefCounted
## Three local slots for plain save snapshots. Gameplay systems own capture and restore.

const SLOT_COUNT := 3
const FORMAT_VERSION := 1
const SAVE_DIRECTORY := "user://saves"
const MAX_SAVE_BYTES := 2 * 1024 * 1024
const MAX_DEPTH := 32


## Accepts JSON data. Use numeric arrays for vectors and string IDs for entities.
static func save_slot(slot: int, state: Dictionary) -> Error:
	if not _valid_slot(slot) or not _is_save_value(state, 0):
		return ERR_INVALID_PARAMETER

	var document := {
		"version": FORMAT_VERSION,
		"saved_at_unix": int(Time.get_unix_time_from_system()),
		"state": state,
	}
	var bytes := JSON.stringify(document, "", true, true).to_utf8_buffer()
	if bytes.size() > MAX_SAVE_BYTES:
		return ERR_INVALID_DATA

	var directory := ProjectSettings.globalize_path(SAVE_DIRECTORY)
	var error := DirAccess.make_dir_recursive_absolute(directory)
	if error != OK:
		return error

	var path := ProjectSettings.globalize_path(_slot_path(slot))
	var temp_path := "%s.%d.%d.tmp" % [path, OS.get_process_id(), Time.get_ticks_usec()]
	var file := FileAccess.open(temp_path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()

	if file.store_buffer(bytes):
		file.flush()
		error = file.get_error()
	else:
		error = ERR_FILE_CANT_WRITE
	file.close()
	if error == OK:
		error = DirAccess.rename_absolute(temp_path, path)
	if error != OK:
		DirAccess.remove_absolute(temp_path)
	return error


## Returns {error, state, saved_at_unix} on success and {error} otherwise.
static func load_slot(slot: int) -> Dictionary:
	if not _valid_slot(slot):
		return {"error": ERR_INVALID_PARAMETER}

	var file := FileAccess.open(_slot_path(slot), FileAccess.READ)
	if file == null:
		return {"error": FileAccess.get_open_error()}
	var size := file.get_length()
	if size == 0 or size > MAX_SAVE_BYTES:
		return {"error": ERR_FILE_CORRUPT}
	var bytes := file.get_buffer(size)
	file.close()
	if bytes.size() != size:
		return {"error": ERR_FILE_CANT_READ}
	var json := JSON.new()
	if json.parse(bytes.get_string_from_utf8()) != OK or not json.data is Dictionary:
		return {"error": ERR_FILE_CORRUPT}

	var document: Dictionary = json.data
	var version: Variant = document.get("version")
	if not _is_whole_number(version):
		return {"error": ERR_FILE_CORRUPT}
	if version != FORMAT_VERSION:
		return {"error": ERR_UNAVAILABLE}

	var state: Variant = document.get("state")
	var saved_at: Variant = document.get("saved_at_unix")
	if not state is Dictionary or not _is_save_value(state, 0):
		return {"error": ERR_FILE_CORRUPT}
	if not _is_whole_number(saved_at) or saved_at < 0 or saved_at > 253402300799:
		return {"error": ERR_FILE_CORRUPT}
	return {"error": OK, "state": state, "saved_at_unix": int(saved_at)}


static func has_slot(slot: int) -> bool:
	return _valid_slot(slot) and FileAccess.file_exists(_slot_path(slot))


static func _slot_path(slot: int) -> String:
	return SAVE_DIRECTORY.path_join("slot_%d.json" % slot)


static func _valid_slot(slot: int) -> bool:
	return slot >= 1 and slot <= SLOT_COUNT


static func _is_whole_number(value: Variant) -> bool:
	return value is int or (value is float and is_finite(value) and value == floorf(value))


static func _is_save_value(value: Variant, depth: int) -> bool:
	if depth > MAX_DEPTH:
		return false
	match typeof(value):
		TYPE_NIL, TYPE_BOOL, TYPE_STRING:
			return true
		TYPE_INT:
			# Godot reads JSON numbers as floats. Keep integers in their exact range.
			return value >= -9007199254740991 and value <= 9007199254740991
		TYPE_FLOAT:
			return is_finite(value)
		TYPE_ARRAY:
			for item in value:
				if not _is_save_value(item, depth + 1):
					return false
			return true
		TYPE_DICTIONARY:
			for key in value:
				if not key is String or not _is_save_value(value[key], depth + 1):
					return false
			return true
	return false
