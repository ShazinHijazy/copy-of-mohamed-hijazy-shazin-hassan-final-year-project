export enum DroneStatus {
  STANDBY = 'STANDBY',
  ARMED = 'ARMED',
  FLYING = 'FLYING',
  TAKEOFF = 'TAKEOFF',
  LANDING = 'LANDING',
  RTL = 'RTL',
  FAILED = 'FAILED',
  LOST = 'LOST'
}

export enum FlightMode {
  MANUAL = 'MANUAL',
  STABILIZED = 'STABILIZED',
  POSITION = 'POSITION',
  MISSION = 'MISSION',
  TAKEOFF = 'TAKEOFF',
  LAND = 'LAND',
  RTL = 'RTL',
  HOLD = 'HOLD',
  OFFBOARD = 'OFFBOARD'
}

export enum SwarmAlgorithm {
  LEADER_FOLLOWER = 'LEADER_FOLLOWER',
  BOIDS_FLOCKING = 'BOIDS_FLOCKING',
  GRID_SEARCH = 'GRID_SEARCH',
  ORBIT_TARGET = 'ORBIT_TARGET',
  AGGREGATE = 'AGGREGATE',
  THRESHOLD_CONSENSUS = 'THRESHOLD_CONSENSUS',
  BTP_ANT_COLONY = 'BTP_ANT_COLONY'
}

export enum ArmingState {
  DISARMED = 'DISARMED',
  ARMING_SEQUENCE = 'ARMING...',
  ARMED = 'ARMED',
  EMERGENCY_STOP = 'E-STOP'
}

export interface SensorSuite {
  imu: {
    accel: { x: number; y: number; z: number };
    gyro: { x: number; y: number; z: number };
    drift: number;
  };
  lidar: {
    points: number[];
    maxRange: number;
    noiseFloor: number;
  };
  gps: {
    lat: number;
    lon: number;
    alt: number;
    hdop: number;
    sats: number;
    fix_type: number;
  };
  battery: {
    voltage: number;
    current: number;
    percentage: number;
    sag: number;
  };
}

export interface DroneTelemetry {
  id: string;
  callsign: string;
  squadron: 'ALPHA' | 'BRAVO' | 'CHARLIE';
  status: DroneStatus;
  flightMode: FlightMode;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  orientation: { pitch: number; roll: number; yaw: number };
  target: { x: number; y: number; z: number };
  missionPath: { x: number; y: number; z: number }[];
  sensors: SensorSuite;
  rssi: number;
  isLeader: boolean;
  score: number;
  latency: number;
  path: { x: number; y: number; z: number }[];
}

export interface SwarmState {
  drones: DroneTelemetry[];
  leaderId: string | null;
  linkActive: boolean;
  simulationTime: number;
  armingState: ArmingState;
  globalFlightMode: FlightMode;
  currentAlgorithm: SwarmAlgorithm;
  environment: {
    wind: { x: number; y: number };
    windSpeed: number;
    rain: number;
    interference: number;
  };
}

export enum AppTab {
  FLIGHT = 'FLIGHT',
  PILOT = 'PILOT',
  MAP = 'MAP',
  PLAN = 'PLAN',
  SETUP = 'SETUP',
  ANALYZE = 'ANALYZE'
}