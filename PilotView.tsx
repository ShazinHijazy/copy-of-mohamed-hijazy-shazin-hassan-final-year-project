import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { SwarmState, SwarmAlgorithm, DroneStatus } from '../types.ts';

interface PilotViewProps {
  swarmState: SwarmState;
  onUploadMission: (id: string, path: { x: number; y: number; z: number }[]) => void;
  onUploadFleetMission: (path: { x: number; y: number; z: number }[]) => void;
  onSetAlgorithm: (algo: SwarmAlgorithm) => void;
  onUpdateDronePosition: (id: string, position: { x: number; y: number; z: number }) => void;
  onUpdateFleetPosition: (position: { x: number; y: number; z: number }) => void;
}

const CENTER_LAT = 37.7893;
const CENTER_LON = -122.4012;
const METERS_PER_DEGREE_LAT = 111111;
const METERS_PER_DEGREE_LON = METERS_PER_DEGREE_LAT * Math.cos(CENTER_LAT * Math.PI / 180);

const PilotView: React.FC<PilotViewProps> = ({ 
  swarmState, 
  onUploadFleetMission,
  onUpdateFleetPosition 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const leader = swarmState.drones.find(d => d.id === swarmState.leaderId);

  const metersToLatLng = (x: number, y: number): [number, number] => [
    CENTER_LON + (x / METERS_PER_DEGREE_LON),
    CENTER_LAT + (y / METERS_PER_DEGREE_LAT)
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
      center: [CENTER_LON, CENTER_LAT],
      zoom: 18,
      interactive: true
    });

    map.on('load', () => {
      mapRef.current = map;
      map.resize();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    swarmState.drones.forEach(drone => {
      const coords = metersToLatLng(drone.position.x, drone.position.y);
      const isLeader = drone.id === swarmState.leaderId;
      const color = isLeader ? '#fb923c' : '#38bdf8';

      if (!markersRef.current[drone.id]) {
        const el = document.createElement('div');
        el.style.width = '8px';
        el.style.height = '8px';
        el.style.borderRadius = '50%';
        el.style.background = color;
        el.style.border = '2px solid white';
        el.style.boxShadow = `0 0 8px ${color}`;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map);
        
        markersRef.current[drone.id] = marker;
      } else {
        markersRef.current[drone.id].setLngLat(coords);
        const el = markersRef.current[drone.id].getElement();
        el.style.background = color;
        el.style.boxShadow = `0 0 8px ${color}`;
      }
    });
  }, [swarmState]);

  const handleTeleportToStart = () => {
    onUpdateFleetPosition({ x: 0, y: 0, z: 25 });
    mapRef.current?.flyTo({ center: [CENTER_LON, CENTER_LAT], zoom: 18 });
  };

  const handleExecuteFleetMission = async () => {
    setIsUploading(true);
    await new Promise(r => setTimeout(r, 1000));
    onUploadFleetMission([{ x: 200, y: 200, z: 30 }]);
    setIsUploading(false);
  };

  return (
    <div className="h-full w-full relative flex overflow-hidden bg-black font-mono">
      <div ref={mapContainerRef} className="absolute inset-0 z-0 grayscale opacity-40 contrast-125" />
      
      {/* Pilot HUD Left */}
      <div className="absolute left-6 top-6 bottom-6 w-72 z-10 flex flex-col gap-4 pointer-events-none">
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl pointer-events-auto">
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Command Bridge</div>
          <div className="space-y-4">
             <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Fleet Altitude</span>
                <span className="text-xl font-black text-white italic">{(leader?.position.z || 0).toFixed(1)}<span className="text-[10px] not-italic ml-1">M</span></span>
             </div>
             <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Status</span>
                <span className="text-xl font-black text-emerald-500 italic">SECURE</span>
             </div>
          </div>
        </div>

        <div className="flex-1 bg-black/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col pointer-events-auto overflow-hidden">
          <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4">Radio Datalink</div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {swarmState.drones.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full ${d.id === swarmState.leaderId ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                   <div className="text-[9px] font-black text-slate-100">{d.callsign}</div>
                   <div className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">{d.status}</div>
                </div>
                <div className="text-[9px] font-mono font-bold text-emerald-500">{d.sensors.battery.percentage.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pilot Controls Right */}
      <div className="absolute right-6 top-6 bottom-6 w-96 z-10 flex flex-col gap-4">
        <div className="bg-black/95 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col flex-1 border-r-4 border-r-blue-600">
          <div className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex justify-between items-center">
            <span>Mission Control</span>
            <span className="bg-blue-600/10 text-blue-500 px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tighter">AES-256</span>
          </div>
          
          <div className="space-y-8 flex-1">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Calibration</div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-inter">Align virtual theater with physical GPS origin point.</p>
              <button 
                onClick={handleTeleportToStart}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white tracking-widest transition-all"
              >
                Sync Origin
              </button>
            </div>

            <div className="bg-blue-600/5 p-6 rounded-2xl border border-blue-500/20 space-y-4">
              <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Uplink</div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-inter">Broadcast the optimized mission path to all active nodes.</p>
              <button 
                onClick={handleExecuteFleetMission}
                disabled={isUploading}
                className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isUploading ? 'bg-slate-700 animate-pulse text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl'}`}
              >
                {isUploading ? 'UPLOADING...' : 'Broadcast Mission'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilotView;