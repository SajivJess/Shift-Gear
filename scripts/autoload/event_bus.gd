extends Node

signal crime_committed(crime_type: String, world_position: Vector3, severity: float)
signal vehicle_hijacked(vehicle: Node3D, world_position: Vector3)
signal vehicle_mode_changed(vehicle: Node3D, mode: int, world_position: Vector3)
signal wanted_state_changed(level: int, state: String, last_known_position: Vector3)
signal reputation_changed(alignment_score: int, reason: String)
signal mission_updated(mission_id: String, objective: String, completed: bool)
