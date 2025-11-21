
import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Plus, Minus, Crosshair } from 'lucide-react';
import { GeoLocation } from '../types';

interface MapVisualProps {
  status?: 'idle' | 'searching' | 'tracking';
  myLocation?: GeoLocation;
  targetLocation?: GeoLocation; // The "Other" person (e.g. Technician if I am Customer)
}

export const MapVisual: React.FC<MapVisualProps> = ({ status = 'idle', myLocation, targetLocation }) => {
  const [zoom, setZoom] = useState(1);
  
  // Calculate visual offset for target pin relative to center (myLocation)
  // This is a mock calculation for visual purposes on the SVG grid
  const getTargetOffset = () => {
    if (!myLocation || !targetLocation) return { x: 0, y: 0 };
    
    const latDiff = targetLocation.lat - myLocation.lat;
    const lngDiff = targetLocation.lng - myLocation.lng;
    
    // Scale diff to pixels (Arbitrary scale for demo visuals)
    return {
      x: lngDiff * 20000, 
      y: latDiff * -20000 // Y is inverted in CSS
    };
  };

  const targetOffset = getTargetOffset();
  const hasTarget = !!targetLocation && status === 'tracking';

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.5, 0.5));
  const handleRecenter = () => setZoom(1);

  return (
    <div className="absolute inset-0 bg-slate-100 overflow-hidden z-0">
      {/* Scalable Map Layer */}
      <div 
        className="w-full h-full transition-transform duration-500 ease-out"
        style={{ 
          transform: `scale(${zoom})`, 
          transformOrigin: 'center' 
        }}
      >
        {/* SVG Map Background Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Mock Roads */}
          <path d="M -10 100 Q 150 300 400 200" stroke="white" strokeWidth="20" fill="none" />
          <path d="M -10 100 Q 150 300 400 200" stroke="#cbd5e1" strokeWidth="16" fill="none" />
          
          <path d="M 200 -10 L 200 900" stroke="white" strokeWidth="25" fill="none" />
          <path d="M 200 -10 L 200 900" stroke="#cbd5e1" strokeWidth="20" fill="none" />
        </svg>

        {/* Target Pin (Technician if user is Customer, or Vice Versa) */}
        {hasTarget && (
          <div 
            className="absolute top-1/2 left-1/2 transition-all duration-1000 ease-linear z-10"
            style={{ 
              transform: `translate(${targetOffset.x}px, ${targetOffset.y}px) scale(${1/zoom})` 
            }}
          >
            <div className="flex flex-col items-center">
              <Navigation className="text-green-600 fill-green-600 drop-shadow-lg rotate-45" size={32} />
              <div className="bg-white px-2 py-1 rounded-md shadow text-xs font-bold mt-1 whitespace-nowrap">
                 {Math.abs(targetOffset.x) < 10 && Math.abs(targetOffset.y) < 10 ? 'Arrived' : 'En Route'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Pin (Always Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
        <div className={`relative ${status === 'searching' ? 'animate-bounce' : ''}`}>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 blur-xs rounded-full"></div>
          <MapPin className="text-brand-600 fill-brand-600 drop-shadow-lg" size={48} />
        </div>
        <div className="bg-white px-2 py-1 rounded-md shadow text-xs font-bold mt-1">
           {status === 'idle' || !myLocation ? 'You' : `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}`}
        </div>
      </div>

      {/* Pulse Effect for Searching (Fixed center) */}
      {status === 'searching' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-500/20 rounded-full animate-ping pointer-events-none z-0"></div>
      )}

      {/* Map Controls */}
      <div className="absolute right-4 bottom-40 flex flex-col gap-2 z-20">
        <button 
          onClick={handleZoomIn} 
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          aria-label="Zoom In"
        >
          <Plus size={20} />
        </button>
        <button 
          onClick={handleZoomOut} 
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          aria-label="Zoom Out"
        >
          <Minus size={20} />
        </button>
        <button 
          onClick={handleRecenter} 
          className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-brand-600 mt-2 hover:bg-slate-50 active:scale-95 transition-all"
          aria-label="Recenter"
        >
          <Crosshair size={20} />
        </button>
      </div>
    </div>
  );
};
