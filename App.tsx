import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppTab, SwarmState, DroneStatus, ArmingState, FlightMode, SwarmAlgorithm } from './types.ts';
import { 
  TICK_RATE_HZ, 
  createVirtualDrone, 
  MAX_VELOCITY,
  MAX_ACCELERATION,
  DRAG_COEFF_LINEAR,
  T_PERIOD_SEC,
  BATTERY_DRAIN_BASE,
  DEFAULT_TAKEOFF_ALT
} from './constants.ts';
import Dashboard from './components/Dashboard.tsx';
import Architecture from './components/Architecture.tsx';
import Copilot from './components/Copilot.tsx';
import Logs from './components/Logs.tsx';
import Sidebar from './components/Sidebar.tsx';
import MapView from './components/MapView.tsx';
import PilotView from './components/PilotView.tsx';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FLIGHT);
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] AEGIS STATION INITIALIZED",
    "[STATUS] ALL UNITS GROUNDED (STANDBY)",
    "[CONFIG] TAKEOFF/LAND PHYSICS ENGINE ENABLED"
  ]);

  const [swarmState, setSwarmState] = useState<SwarmState>(() => ({
    drones: Array.from({ length: 12 }).map((_, i) => createVirtualDrone(`uav-${i}`, i)),
    leaderId: 'uav-0',
    linkActive: true,
    simulationTime: 0,
    armingState: ArmingState.DISARMED,
    globalFlightMode: FlightMode.STABILIZED,
    currentAlgorithm: SwarmAlgorithm.BTP_ANT_COLONY,
    environment: {
      wind: { x: 0.5, y: 0.2 },
      windSpeed: 1.0,
      rain: 0.0,
      interference: 0.05
    }
  }));

  const lastEpochTimeRef = useRef(0);

  const armFleet = () => {
    setSwarmState(prev => ({ 
      ...prev, 
      armingState: ArmingState.ARMED, 
      drones: prev.drones.map(d => ({ ...d, status: DroneStatus.ARMED })) 
    }));
    setLogs(l => ["[SYSTEM] FLEET ARMED: MOTORS IDLE", ...l].slice(0, 100));
  };

  const disarmFleet = () => {
    setSwarmState(prev => ({ 
      ...prev, 
      armingState: ArmingState.DISARMED, 
      drones: prev.drones.map(d => ({ 
        ...d, 
        status: DroneStatus.STANDBY, 
        flightMode: FlightMode.STABILIZED, 
        missionPath: [] 
      })) 
    }));
    setLogs(l => ["[SYSTEM] FLEET DISARMED: MOTORS KILLED", ...l].slice(0, 100));
  };

  const runTakeoff = () => {
    setSwarmState(prev => ({
      ...prev,
      drones: prev.drones.map(d => ({ 
        ...d, 
        flightMode: FlightMode.TAKEOFF, 
        status: DroneStatus.FLYING,
        target: { ...d.position, z: DEFAULT_TAKEOFF_ALT } 
      }))
    }));
    setLogs(l => ["[COMMAND] EXECUTING GLOBAL TAKEOFF", ...l].slice(0, 100));
  };

  const runLanding = () => {
    setSwarmState(prev => ({
      ...prev,
      drones: prev.drones.map(d => ({ 
        ...d, 
        flightMode: FlightMode.LAND, 
        target: { ...d.position, z: 0 } 
      }))
    }));
    setLogs(l => ["[COMMAND] EXECUTING GLOBAL LANDING", ...l].slice(0, 100));
  };

  const handleUpdateFleetPosition = (position: {x: number; y: number; z: number}) => {
    setSwarmState(prev => ({
      ...prev,
      drones: prev.drones.map(d => ({ ...d, position: { ...position }, target: { ...position } }))
    }));
    setLogs(l => [`[SYSTEM] FLEET REDEPLOYED TO ${position.x.toFixed(1)}, ${position.y.toFixed(1)}`, ...l].slice(0, 100));
  };

  const handleUploadFleetMission = (path: {x: number; y: number; z: number}[]) => {
    setSwarmState(prev => ({
      ...prev,
      drones: prev.drones.map(d => ({ 
        ...d, 
        missionPath: [...path], 
        flightMode: FlightMode.MISSION,
        status: d.position.z > 1 ? DroneStatus.FLYING : d.status 
      }))
    }));
    setLogs(l => [`[MAVLINK] BROADCAST MISSION UPLOAD: ${path.length} WAYPOINTS`, ...l].slice(0, 100));
  };

  const handleUpdateMission = (id: string, path: {x: number; y: number; z: number}[]) => {
    setSwarmState(prev => ({
      ...prev,
      drones: prev.drones.map(d => d.id === id ? { ...d, missionPath: [...path], flightMode: FlightMode.MISSION } : d)
    }));
  };

  const runTelemetryTick = useCallback(() => {
    setSwarmState(prev => {
      const dt = 1 / TICK_RATE_HZ;
      const currentTime = prev.simulationTime;
      const isEpochEnd = currentTime - lastEpochTimeRef.current >= T_PERIOD_SEC;
      let nextLeaderId = prev.leaderId;

      const scoredDrones = prev.drones.map(d => {
        const velMag = Math.sqrt(Math.pow(d.velocity.x, 2) + Math.pow(d.velocity.y, 2) + Math.pow(d.velocity.z, 2));
        const stability = Math.max(0, 1 - (velMag / MAX_VELOCITY));
        const normSig = Math.min(1, Math.max(0, (d.rssi + 95) / 65));
        const f_s = (d.sensors.battery.percentage / 100 * 0.5) + (normSig * 0.3) + (stability * 0.2);
        return { ...d, score: f_s };
      });

      if (isEpochEnd && prev.armingState === ArmingState.ARMED) {
        lastEpochTimeRef.current = currentTime;
        const healthyDrones = scoredDrones.filter(d => d.status === DroneStatus.FLYING);
        const sorted = healthyDrones.sort((a, b) => b.score - a.score);
        if (sorted[0] && sorted[0].id !== nextLeaderId) {
          nextLeaderId = sorted[0].id;
        }
      }

      const updatedDrones = scoredDrones.map((d, idx) => {
        let status = d.status;
        let target = { ...d.target };
        let mode = d.flightMode;
        let missionPath = [...d.missionPath];

        if (status === DroneStatus.STANDBY || (status === DroneStatus.ARMED && d.position.z < 0.1)) {
           return { ...d, velocity: { x: 0, y: 0, z: 0 }, acceleration: { x: 0, y: 0, z: 0 } };
        }

        if (mode === FlightMode.MISSION && missionPath.length > 0) {
           const wp = missionPath[0];
           target = { ...wp };
           const distToWP = Math.sqrt(Math.pow(d.position.x - wp.x, 2) + Math.pow(d.position.y - wp.y, 2) + Math.pow(d.position.z - wp.z, 2));
           if (distToWP < 2.5) {
              missionPath.shift();
              if (missionPath.length === 0) {
                 mode = FlightMode.POSITION;
              }
           }
        } else if (status === DroneStatus.FLYING && mode !== FlightMode.TAKEOFF && mode !== FlightMode.LAND) {
           if (prev.currentAlgorithm === SwarmAlgorithm.BTP_ANT_COLONY) {
              if (d.id === nextLeaderId) {
                 const radius = 35;
                 target.x = Math.sin(currentTime * 0.08) * radius;
                 target.y = Math.cos(currentTime * 0.1) * radius;
                 target.z = 25 + Math.sin(currentTime * 0.15) * 5;
              } else {
                 const leaderNode = scoredDrones.find(l => l.id === nextLeaderId);
                 const predecessor = scoredDrones[idx - 1] || leaderNode;
                 if (predecessor) {
                    const gap = 6.0;
                    const angle = Math.atan2(predecessor.velocity.y, predecessor.velocity.x) || 0;
                    target.x = predecessor.position.x - Math.cos(angle) * gap;
                    target.y = predecessor.position.y - Math.sin(angle) * gap;
                    target.z = predecessor.position.z;
                 }
              }
           }
        }

        const dx = target.x - d.position.x;
        const dy = target.y - d.position.y;
        const dz = target.z - d.position.z;
        
        let ax = dx * 2.0;
        let ay = dy * 2.0;
        let az = dz * 2.0;

        if (d.position.z > 1.0) {
          scoredDrones.forEach(other => {
            if (d.id === other.id || other.position.z < 1.0) return;
            const dist = Math.sqrt(Math.pow(d.position.x - other.position.x, 2) + Math.pow(d.position.y - other.position.y, 2) + Math.pow(d.position.z - other.position.z, 2));
            if (dist < 5.0 && dist > 0.1) {
              const f = (5.0 - dist) / dist;
              ax += (d.position.x - other.position.x) * f * 10.0;
              ay += (d.position.y - other.position.y) * f * 10.0;
            }
          });
        }

        const aMag = Math.sqrt(ax * ax + ay * ay + az * az);
        if (aMag > MAX_ACCELERATION) {
          const ratio = MAX_ACCELERATION / aMag;
          ax *= ratio;
          ay *= ratio;
          az *= ratio;
        }

        let vx = (d.velocity.x + ax * dt) * (1 - DRAG_COEFF_LINEAR * dt);
        let vy = (d.velocity.y + ay * dt) * (1 - DRAG_COEFF_LINEAR * dt);
        let vz = (d.velocity.z + az * dt) * (1 - DRAG_COEFF_LINEAR * dt);

        const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (vMag > MAX_VELOCITY) { 
          const ratio = MAX_VELOCITY / vMag;
          vx *= ratio; 
          vy *= ratio; 
          vz *= ratio; 
        }

        const nx = d.position.x + vx * dt;
        const ny = d.position.y + vy * dt;
        let nz = d.position.z + vz * dt;

        if (mode === FlightMode.LAND && nz < 0.1) {
          nz = 0; 
          vx = 0; 
          vy = 0; 
          vz = 0; 
          status = DroneStatus.STANDBY; 
          mode = FlightMode.STABILIZED; 
          missionPath = [];
        }
        if (mode === FlightMode.TAKEOFF && Math.abs(nz - target.z) < 0.5) {
          mode = FlightMode.POSITION;
        }

        nz = Math.max(0, nz);
        const currentDraw = status === DroneStatus.FLYING ? 0.8 + (aMag * 0.5) : (status === DroneStatus.ARMED ? 0.1 : 0);
        const nextBattery = Math.max(0, d.sensors.battery.percentage - (BATTERY_DRAIN_BASE * currentDraw));

        const newHistoricalPath = [...d.path];
        if (Math.floor(currentTime * 5) % 1 === 0 && status === DroneStatus.FLYING) {
           newHistoricalPath.push({ x: nx, y: ny, z: nz });
           if (newHistoricalPath.length > 50) newHistoricalPath.shift();
        }

        return {
          ...d,
          status: status,
          flightMode: mode,
          position: { x: nx, y: ny, z: nz },
          velocity: { x: vx, y: vy, z: vz },
          target: target,
          missionPath: missionPath,
          path: newHistoricalPath,
          sensors: { ...d.sensors, battery: { ...d.sensors.battery, percentage: nextBattery, sag: currentDraw * 0.1 } }
        };
      });

      return {
        ...prev,
        drones: updatedDrones,
        leaderId: nextLeaderId,
        simulationTime: currentTime + dt
      };
    });
  }, []);

  useEffect(() => {
    const i = setInterval(runTelemetryTick, 1000 / TICK_RATE_HZ);
    return () => clearInterval(i);
  }, [runTelemetryTick]);

  return (
    <div className="flex h-screen bg-[#010409] text-slate-200 overflow-hidden font-inter select-none">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 overflow-hidden">
          {activeTab === AppTab.FLIGHT && (
            <Dashboard 
              swarmState={swarmState} 
              onArm={armFleet} 
              onDisarm={disarmFleet} 
              onTakeoff={runTakeoff}
              onLand={runLanding}
              onSetAlgorithm={(a: SwarmAlgorithm) => setSwarmState(p => ({ ...p, currentAlgorithm: a }))}
            />
          )}
          {activeTab === AppTab.PILOT && (
            <PilotView 
                swarmState={swarmState}
                onUploadMission={handleUpdateMission}
                onUploadFleetMission={handleUploadFleetMission}
                onSetAlgorithm={(a: SwarmAlgorithm) => setSwarmState(p => ({ ...p, currentAlgorithm: a }))}
                onUpdateDronePosition={(id, pos) => setSwarmState(p => ({ ...p, drones: p.drones.map(d => d.id === id ? { ...d, position: pos, target: pos } : d) }))}
                onUpdateFleetPosition={handleUpdateFleetPosition}
            />
          )}
          {activeTab === AppTab.MAP && (
            <MapView 
              swarmState={swarmState} 
              onUpdateMission={handleUpdateMission} 
            />
          )}
          {activeTab === AppTab.PLAN && <Architecture />}
          {activeTab === AppTab.SETUP && <Logs logs={logs} onExport={() => {}} recordCount={swarmState.simulationTime > 0 ? 100 : 0} />}
          {activeTab === AppTab.ANALYZE && <Copilot swarmState={swarmState} hysteresisBuffer={2} />}
        </div>
      </main>
    </div>
  );
};

export default App;