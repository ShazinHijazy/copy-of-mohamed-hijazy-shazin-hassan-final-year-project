import { DroneStatus, DroneTelemetry, SensorSuite, FlightMode } from './types.ts';

export const TICK_RATE_HZ = 60;
export const GRAVITY = 9.81;
export const DRONE_MASS = 1.35;
export const MAX_THRUST = 52.0;
export const DRAG_COEFF_LINEAR = 0.15;
export const DRAG_COEFF_SQUARE = 0.022;
export const ANGULAR_DAMPING = 0.22;
export const COLLISION_THRESHOLD = 0.8;

export const MAX_VELOCITY = 10.0;
export const MAX_ACCELERATION = 4.0;

export const E_THRESHOLD_T = 0.42;
export const T_PERIOD_SEC = 5.0;

export const BATTERY_DRAIN_BASE = 0.00005;

export const COMM_RANGE_METERS = 50.0;
export const LATENCY_BASE_MS = 15.0;

export const DEFAULT_TAKEOFF_ALT = 10.0;

export const createVirtualDrone = (id: string, idx: number): DroneTelemetry => {
  const gridX = (idx % 4) * 5 - 7.5;
  const gridY = Math.floor(idx / 4) * 5 - 7.5;
  const squadron = (idx % 3 === 0) ? 'ALPHA' : (idx % 3 === 1 ? 'BRAVO' : 'CHARLIE');
  
  return {
    id: id,
    callsign: `UAV-${String(idx + 1).padStart(2, '0')}`,
    squadron: squadron,
    status: DroneStatus.STANDBY, 
    flightMode: FlightMode.STABILIZED,
    position: { x: gridX, y: gridY, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    orientation: { pitch: 0, roll: 0, yaw: 0 },
    target: { x: gridX, y: gridY, z: 0 },
    missionPath: [],
    sensors: {
      imu: { 
        accel: { x: 0, y: 0, z: 0 }, 
        gyro: { x: 0, y: 0, z: 0 }, 
        drift: 0 
      },
      lidar: { 
        points: [], 
        maxRange: 80, 
        noiseFloor: 0.01 
      },
      gps: { 
        lat: 37.77, 
        lon: -122.42, 
        alt: 0, 
        hdop: 0.65, 
        sats: 14, 
        fix_type: 3 
      },
      battery: { 
        voltage: 12.6, 
        current: 0.1, 
        percentage: 100, 
        sag: 0 
      }
    },
    rssi: -45,
    isLeader: idx === 0,
    score: 1.0,
    latency: LATENCY_BASE_MS,
    path: []
  };
};