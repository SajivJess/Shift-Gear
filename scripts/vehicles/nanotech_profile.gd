extends Resource
class_name NanotechProfile

@export_group("Energy")
@export_range(1.0, 500.0, 1.0) var maximum_energy: float = 100.0
@export_range(0.0, 100.0, 0.5) var transformation_cost: float = 8.0
@export_range(0.0, 20.0, 0.1) var supercar_drain_per_second: float = 0.4
@export_range(0.0, 20.0, 0.1) var flight_drain_per_second: float = 1.2
@export_range(0.0, 20.0, 0.1) var underwater_drain_per_second: float = 0.8
@export_range(0.0, 30.0, 0.1) var boost_drain_per_second: float = 5.0

@export_group("Road Handling")
@export_range(1000.0, 50000.0, 100.0) var normal_engine_force: float = 9200.0
@export_range(1000.0, 70000.0, 100.0) var supercar_engine_force: float = 15000.0
@export_range(0.0, 50000.0, 100.0) var boost_force: float = 13000.0
@export_range(0.0, 30000.0, 100.0) var brake_force: float = 10500.0
@export_range(0.2, 1.5, 0.01) var wheel_rest_length: float = 0.72
@export_range(1000.0, 80000.0, 100.0) var suspension_strength: float = 30000.0
@export_range(0.0, 15000.0, 100.0) var suspension_damping: float = 4300.0
@export_range(0.0, 5000.0, 10.0) var lateral_grip: float = 850.0

@export_group("Flight")
@export_range(1000.0, 50000.0, 100.0) var flight_thrust: float = 9000.0
@export_range(1000.0, 50000.0, 100.0) var flight_vertical_force: float = 12000.0
@export_range(100.0, 20000.0, 100.0) var flight_steering_torque: float = 2600.0

@export_group("Underwater")
@export_range(1000.0, 40000.0, 100.0) var underwater_thrust: float = 6200.0
@export_range(1000.0, 30000.0, 100.0) var underwater_depth_force: float = 8500.0
@export_range(-100.0, 100.0, 0.5) var water_surface_height: float = 0.0
