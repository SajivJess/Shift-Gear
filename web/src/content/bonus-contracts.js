/**
 * SHIFTGEAR: Optional Neighborhood Pickup-and-Delivery Contracts
 * Authored by Antigravity for Codex's web runtime integration.
 * Pickups and dropoffs use accessible street-level road coordinates
 * strictly isolated from the main Signal Run story waypoints.
 */

export const bonusContracts = [
  {
    id: "contract_medical_supplies",
    title: "Emergency Nanomed Delivery",
    description: "Urgent transit of stabilized cellular nanomaterials to the district clinic.",
    pickup: [-36.0, 0.0, 28.0],
    dropoff: [68.0, 0.0, -32.0],
    reward: 2500,
    bonusTimeSeconds: 75
  },
  {
    id: "contract_quantum_components",
    title: "High-Priority Prototype Transit",
    description: "Secure transit of experimental nanotech guidance processors from harbor logistics.",
    pickup: [48.0, 0.0, 64.0],
    dropoff: [-48.0, 0.0, -56.0],
    reward: 3800,
    bonusTimeSeconds: 90
  }
];
