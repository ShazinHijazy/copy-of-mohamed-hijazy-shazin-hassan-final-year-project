import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { SwarmState, DroneStatus } from '../types.ts';

interface MapViewProps {
  swarmState: SwarmState;
  onUpdateMission: (id: string, path: { x: number; y: number; z: number }[]) => void;
}

const CENTER_LAT = 37.7893;
const CENTER_LON = -122.4012;
const METERS_PER_DEGREE_LAT = 111111;
const METERS_PER_DEGREE_LON = METERS_PER_DEGREE_LAT * Math.cos(CENTER_LAT * Math.PI / 180);

const MapView: React.FC<MapViewProps> = ({ swarmState, onUpdateMission }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);

  const metersToLatLng = (x: number, y: number): [number, number] => [
    CENTER_LON + (x / METERS_PER_DEGREE_LON),
    CENTER_LAT + (y / METERS_PER_DEGREE_LAT)
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [CENTER_LON, CENTER_LAT],
      zoom: 16,
      pitch: 60,
      bearing: -15
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
      const isSelected = drone.id === selectedDroneId;
      const color = isLeader ? '#fb923c' : (isSelected ? '#38bdf8' : '#64748b');

      if (!markersRef.current[drone.id]) {
        const el = document.createElement('div');
        el.className = 'tactical-drone-marker';
        el.style.cursor = 'pointer';
        el.style.position = 'relative';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';

        const dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.background = color;
        dot.style.border = '2px solid white';
        dot.style.borderRadius = '50%';
        dot.style.boxShadow = `0 0 10px ${color}`;
        dot.style.transition = 'all 0.2s ease';
        
        const label = document.createElement('div');
        label.style.marginTop = '4px';
        label.style.fontSize = '8px';
        label.style.fontWeight = '900';
        label.style.color = 'white';
        label.style.background = 'rgba(0,0,0,0.8)';
        label.style.padding = '1px 4px';
        label.style.borderRadius = '4px';
        label.style.whiteSpace = 'nowrap';
        label.innerText = drone.callsign;

        el.appendChild(dot);
        el.appendChild(label);

        el.onclick = (e) => {
          setSelectedDroneId(drone.id);
          e.stopPropagation();
        };

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map);
        
        markersRef.current[drone.id] = marker;
      } else {
        const marker = markersRef.current[drone.id];
        marker.setLngLat(coords);
        
        const el = marker.getElement();
        const dot = el.firstChild as HTMLElement;
        if (dot) {
          dot.style.background = color;
          dot.style.boxShadow = `0 0 10px ${color}`;
        }
      }
    });
  }, [swarmState, selectedDroneId]);

  const centerOnSwarm = () => {
    if (!mapRef.current) return;
    const avgX = swarmState.drones.reduce((acc, d) => acc + d.position.x, 0) / swarmState.drones.length;
    const avgY = swarmState.drones.reduce((acc, d) => acc + d.position.y, 0) / swarmState.drones.length;
    mapRef.current.flyTo({
      center: metersToLatLng(avgX, avgY),
      zoom: 17,
      speed: 0.8
    });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#010409]">
      <div ref={mapContainerRef} className="w-full h-full" />

      <div className="absolute top-8 left-8 pointer-events-none z-20 space-y-4">
        <div className="bg-black/90 border-l-[6px] border-emerald-500 p-6 backdrop-blur-3xl shadow-2xl rounded-r-2xl border border-white/10">
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Aegis Tactical Link</div>
          <div className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">Theater: San Francisco</div>
          <button 
            onClick={centerOnSwarm}
            className="pointer-events-auto bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-4 py-1.5 rounded-lg border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest mt-2 transition-all"
          >
            Center Swarm
          </button>
        </div>
      </div>

      <div className="absolute top-8 right-8 w-80 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-slate-900/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-white tracking-widest">Tactical Planner</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Unit Selection</div>
            <select 
              value={selectedDroneId || ''} 
              onChange={(e) => setSelectedDroneId(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold outline-none"
            >
              <option value="">Select Node...</option>
              {swarmState.drones.map(d => (
                <option key={d.id} value={d.id}>{d.callsign}</option>
              ))}
            </select>
          </div>

          {!selectedDroneId ? (
            <div className="text-center py-10 opacity-30">
              <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Select a unit to initiate mission uplink.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20">
                <div className="text-[8px] font-black text-blue-400 uppercase mb-2">Spatial Link Active</div>
                <p className="text-[10px] text-slate-300">Ready to transmit waypoint data to {swarmState.drones.find(d => d.id === selectedDroneId)?.callsign}.</p>
              </div>
              <button 
                className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all shadow-lg"
              >
                Send Waypoint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;