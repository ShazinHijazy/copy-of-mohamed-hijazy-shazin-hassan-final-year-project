import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment, Grid, Line, Shadow } from '@react-three/drei';
import * as THREE from 'three';
import { SwarmState, DroneStatus, ArmingState, SwarmAlgorithm, DroneTelemetry } from '../types.ts';

interface Drone3DProps {
  drone: DroneTelemetry;
  isLeader: boolean;
  isSelected: boolean;
}

const Drone3D: React.FC<Drone3DProps> = ({ drone, isLeader, isSelected }) => {
  const meshRef = useRef<THREE.Group>(null);
  const rotorFL = useRef<THREE.Mesh>(null);
  const rotorFR = useRef<THREE.Mesh>(null);
  const rotorBL = useRef<THREE.Mesh>(null);
  const rotorBR = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.set(drone.position.x, drone.position.z, -drone.position.y);
      if (drone.position.z > 0.1) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, drone.velocity.y * 0.08, 0.1);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -drone.velocity.x * 0.08, 0.1);
      } else {
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.z = 0;
      }
    }

    let spinSpeed = 0;
    if (drone.status === DroneStatus.FLYING) {
      spinSpeed = 30 + Math.sqrt(Math.pow(drone.velocity.x, 2) + Math.pow(drone.velocity.y, 2) + Math.pow(drone.velocity.z, 2)) * 5;
    } else if (drone.status === DroneStatus.ARMED) {
      spinSpeed = 5;
    }

    if (rotorFL.current) rotorFL.current.rotation.y += delta * spinSpeed;
    if (rotorFR.current) rotorFR.current.rotation.y += delta * spinSpeed;
    if (rotorBL.current) rotorBL.current.rotation.y += delta * spinSpeed;
    if (rotorBR.current) rotorBR.current.rotation.y += delta * spinSpeed;
  });

  const droneColor = isLeader ? '#fb923c' : (isSelected ? '#38bdf8' : '#1e293b');

  return (
    <group ref={meshRef}>
      <Shadow
        position={[0, -drone.position.z + 0.01, 0]}
        scale={2}
        opacity={Math.max(0, 0.5 - drone.position.z / 20)}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[3, 0.1, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[3, 0.1, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-1, -0.4, 1]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[1, -0.4, 1]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-1, -0.4, -1]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[1, -0.4, -1]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.8, 0.3, 1.2]} />
        <meshStandardMaterial color={droneColor} roughness={0.1} metalness={0.8} />
      </mesh>
      
      <mesh position={[-1.06, 0.2, 1.06]} ref={rotorFL}>
        <cylinderGeometry args={[0.6, 0.6, 0.02, 16]} />
        <meshBasicMaterial color="#fff" transparent opacity={drone.status === DroneStatus.STANDBY ? 0.8 : 0.2} />
      </mesh>
      <mesh position={[1.06, 0.2, 1.06]} ref={rotorFR}>
        <cylinderGeometry args={[0.6, 0.6, 0.02, 16]} />
        <meshBasicMaterial color="#fff" transparent opacity={drone.status === DroneStatus.STANDBY ? 0.8 : 0.2} />
      </mesh>
      <mesh position={[-1.06, 0.2, -1.06]} ref={rotorBL}>
        <cylinderGeometry args={[0.6, 0.6, 0.02, 16]} />
        <meshBasicMaterial color="#fff" transparent opacity={drone.status === DroneStatus.STANDBY ? 0.8 : 0.2} />
      </mesh>
      <mesh position={[1.06, 0.2, -1.06]} ref={rotorBR}>
        <cylinderGeometry args={[0.6, 0.6, 0.02, 16]} />
        <meshBasicMaterial color="#fff" transparent opacity={drone.status === DroneStatus.STANDBY ? 0.8 : 0.2} />
      </mesh>
    </group>
  );
};

const PheromoneChain: React.FC<{ swarmState: SwarmState }> = ({ swarmState }) => {
  const points = useMemo(() => {
    const chain: [number, number, number][] = [];
    const leader = swarmState.drones.find(d => d.id === swarmState.leaderId);
    if (!leader) return [];

    swarmState.drones.forEach((d, idx) => {
      const prevNode = swarmState.drones[idx - 1] || leader;
      if (d.id !== prevNode.id && d.status === DroneStatus.FLYING && prevNode.status === DroneStatus.FLYING) {
        chain.push([d.position.x, d.position.z, -d.position.y]);
        chain.push([prevNode.position.x, prevNode.position.z, -prevNode.position.y]);
      }
    });
    return chain;
  }, [swarmState.drones, swarmState.leaderId]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color="#10b981"
      lineWidth={1}
      dashed
      dashSize={0.5}
      gapSize={0.2}
      transparent
      opacity={0.3}
    />
  );
};

interface DashboardProps {
  swarmState: SwarmState;
  onArm: () => void;
  onDisarm: () => void;
  onTakeoff: () => void;
  onLand: () => void;
  onSetAlgorithm: (a: SwarmAlgorithm) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ swarmState, onArm, onDisarm, onTakeoff, onLand, onSetAlgorithm }) => {
  const [selectedId, setSelectedId] = useState<string | null>(swarmState.leaderId);
  const selectedDrone = swarmState.drones.find(d => d.id === selectedId) || swarmState.drones[0] || {
    callsign: 'N/A', 
    status: 'N/A', 
    position: { z: 0 }, 
    score: 0
  };

  const anyAirborne = swarmState.drones.some(d => d.position.z > 0.1);
  const anyArmed = swarmState.armingState === ArmingState.ARMED;

  return (
    <div className="h-full flex flex-col bg-[#010409] font-mono text-slate-200 overflow-hidden relative">
      <header className="h-24 bg-[#0d1117]/95 border-b border-white/5 px-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Aegis Tactical HUD</span>
            <span className="text-xl font-black text-white italic">{swarmState.drones.filter(d => d.status === DroneStatus.FLYING).length} AIRBORNE</span>
          </div>
          <div className="h-10 w-[1px] bg-white/10"></div>
          <select 
            value={swarmState.currentAlgorithm}
            onChange={(e) => onSetAlgorithm(e.target.value as SwarmAlgorithm)}
            className="bg-slate-900 text-[10px] font-black text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded outline-none"
          >
            <option value={SwarmAlgorithm.BTP_ANT_COLONY}>BTP Ant Colony</option>
            <option value={SwarmAlgorithm.LEADER_FOLLOWER}>Leader-Follower</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={swarmState.armingState === ArmingState.DISARMED ? onArm : onDisarm} 
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${swarmState.armingState === ArmingState.DISARMED ? 'bg-slate-800 border border-white/10 text-slate-400 hover:text-white' : 'bg-red-600 text-white'}`}
          >
            {swarmState.armingState === ArmingState.DISARMED ? 'Arm Fleet' : 'Disarm'}
          </button>
          
          <button 
            disabled={!anyArmed || anyAirborne}
            onClick={onTakeoff}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${anyArmed && !anyAirborne ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
          >
            Takeoff
          </button>

          <button 
            disabled={!anyAirborne}
            onClick={onLand}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${anyAirborne ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
          >
            Land
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <div className="flex-1 relative bg-[#01040a]">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[50, 40, 50]} fov={45} />
            <OrbitControls minDistance={5} maxDistance={250} maxPolarAngle={Math.PI / 2.1} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Environment preset="night" />
            <Grid infiniteGrid sectionSize={10} fadeDistance={200} cellColor="#1e293b" sectionColor="#334155" />
            <Suspense fallback={null}>
              {swarmState.drones.map(d => (
                <Drone3D key={d.id} drone={d} isLeader={d.id === swarmState.leaderId} isSelected={d.id === selectedId} />
              ))}
              <PheromoneChain swarmState={swarmState} />
            </Suspense>
          </Canvas>
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md p-4 border border-white/5 rounded-2xl flex gap-6">
               <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Theater Alt</span>
                 <span className="text-sm font-black text-white italic">0.0 - 50.0M</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ground Safety</span>
                 <span className="text-sm font-black text-emerald-500">NOMINAL</span>
               </div>
            </div>
          </div>
        </div>

        <aside className="w-[28rem] bg-[#0d1117] border-l border-white/5 p-6 space-y-4 flex flex-col z-40 overflow-hidden">
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Selected: {selectedDrone.callsign}</h3>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded ${selectedDrone.status === DroneStatus.FLYING ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{selectedDrone.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-600 uppercase">Altitude</span>
                <div className="text-lg font-black text-white">{selectedDrone.position.z.toFixed(1)}<span className="text-[10px] ml-1">M</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-600 uppercase">BTP Score</span>
                <div className="text-lg font-black text-emerald-400 italic">{(selectedDrone.score * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
             {swarmState.drones.map(d => (
               <div key={d.id} onClick={() => setSelectedId(d.id)} className={`p-4 border rounded-xl cursor-pointer transition-all ${d.id === selectedId ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/5 border-white/5'}`}>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${d.id === swarmState.leaderId ? 'bg-orange-500' : (d.status === DroneStatus.FLYING ? 'bg-emerald-500' : 'bg-slate-600')}`}></div>
                       <span className="text-[10px] font-black text-white">{d.callsign}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{d.position.z.toFixed(1)}m</span>
                 </div>
               </div>
             ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
