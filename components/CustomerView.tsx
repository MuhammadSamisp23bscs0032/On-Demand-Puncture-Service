
import React, { useState, useEffect } from 'react';
import { Job, JobStatus, ServiceType, VehicleType, GeoLocation } from '../types';
import { SERVICE_ICONS, SERVICE_DESCRIPTIONS } from '../constants';
import { MapVisual } from './MapVisual';
import { Star, Phone, MessageSquare, ChevronRight, CheckCircle, Bike, Car, ChevronLeft, Crosshair } from 'lucide-react';

interface CustomerViewProps {
  activeJob: Job | null;
  onCreateJob: (type: ServiceType, vehicle: VehicleType, lat: number, lng: number) => void;
  onCancelJob: () => void;
  onCompleteFlow: () => void;
  technicianLocation: GeoLocation;
}

export const CustomerView: React.FC<CustomerViewProps> = ({ 
  activeJob, 
  onCreateJob, 
  onCancelJob, 
  onCompleteFlow,
  technicianLocation
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType>(ServiceType.TUBELESS_PLUG);
  
  // Location State
  const [myLocation, setMyLocation] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [addressText, setAddressText] = useState("Detecting location...");

  // --- Logic for Steps ---
  const isSearching = activeJob?.status === JobStatus.SEARCHING;
  const isAssigned = activeJob && [JobStatus.ACCEPTED, JobStatus.ARRIVED, JobStatus.IN_PROGRESS].includes(activeJob.status);
  const isCompleted = activeJob?.status === JobStatus.COMPLETED;
  const mapStatus = isSearching ? 'searching' : (isAssigned ? 'tracking' : 'idle');

  // --- Geolocation Handler ---
  useEffect(() => {
    if (!activeJob) {
      detectLocation();
    }
  }, []);

  const detectLocation = () => {
    setIsLocating(true);
    setAddressText("Locating...");
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMyLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setAddressText("Current Location (GPS)");
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location", error);
          // Fallback
          setMyLocation({ lat: 31.5102, lng: 74.3441 }); 
          setAddressText("Liberty Market, Lahore (Default)");
          setIsLocating(false);
        }
      );
    } else {
       setMyLocation({ lat: 31.5102, lng: 74.3441 });
       setAddressText("Liberty Market, Lahore (Default)");
       setIsLocating(false);
    }
  };

  const getEstimatedPrice = (type: ServiceType, vehicle: VehicleType) => {
     if (vehicle === VehicleType.BIKE) {
        if (type === ServiceType.TUBE_PATCH) return 150;
        if (type === ServiceType.TUBELESS_PLUG) return 200;
        if (type === ServiceType.TOW) return 1500;
     } else {
        if (type === ServiceType.TUBE_PATCH) return 400;
        if (type === ServiceType.TUBELESS_PLUG) return 500;
        if (type === ServiceType.TOW) return 3000;
     }
     return 0;
  }

  const handleCreateJob = () => {
    if (myLocation && selectedVehicle) {
      onCreateJob(selectedService, selectedVehicle, myLocation.lat, myLocation.lng);
    }
  };

  // --- Render Handlers ---

  if (isCompleted && activeJob) {
    return (
      <div className="h-full flex flex-col bg-white p-6 relative z-10 animate-fade-in">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Job Completed!</h2>
          <p className="text-slate-500">Your receipt has been generated.</p>
          
          <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-200 text-left space-y-3">
            <div className="flex justify-between border-b pb-2 border-slate-200">
              <span className="text-slate-500">Vehicle</span>
              <span className="font-medium">{activeJob.vehicleType}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-slate-200">
              <span className="text-slate-500">Service</span>
              <span className="font-medium">{activeJob.serviceType}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-slate-200">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-bold text-brand-600">Rs. {activeJob.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Technician</span>
              <span className="font-medium">Ali Khan</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setSelectedVehicle(null); 
              onCompleteFlow();
            }}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg mt-8"
          >
            Download Receipt (PDF)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Map Layer */}
      <MapVisual 
        status={mapStatus} 
        myLocation={myLocation || {lat: 0, lng: 0}}
        targetLocation={isAssigned ? technicianLocation : undefined}
      />

      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 bg-gradient-to-b from-white/80 to-transparent pt-6">
        <div className="bg-white shadow-md rounded-full pl-4 pr-2 py-2 flex items-center justify-between gap-2 max-w-[90%] mx-auto">
           <div className="flex items-center gap-2 overflow-hidden">
             <div className={`w-2 h-2 rounded-full shrink-0 ${isLocating ? 'bg-yellow-500 animate-ping' : 'bg-brand-500'}`}></div>
             <span className="text-sm font-medium text-slate-700 truncate">{addressText}</span>
           </div>
           <button onClick={detectLocation} className="p-1.5 bg-slate-100 rounded-full text-slate-600 active:scale-90 transition-transform">
             <Crosshair size={16}/>
           </button>
        </div>
      </div>

      {/* Bottom Sheet / Controls */}
      <div className="mt-auto bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 p-6 relative">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>

        {!activeJob ? (
          !selectedVehicle ? (
            // --- Screen 1: Vehicle Selection ---
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-xl font-bold text-slate-900">What vehicle needs help?</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedVehicle(VehicleType.BIKE)}
                  className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:border-brand-500 hover:bg-brand-50 transition-all"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-700 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Bike size={32} />
                  </div>
                  <span className="font-bold text-slate-900">Bike</span>
                  <span className="text-xs text-slate-400 mt-1">Start from Rs. 150</span>
                </button>

                <button
                  onClick={() => setSelectedVehicle(VehicleType.CAR)}
                  className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:border-brand-500 hover:bg-brand-50 transition-all"
                >
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-700 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Car size={32} />
                  </div>
                  <span className="font-bold text-slate-900">Car</span>
                  <span className="text-xs text-slate-400 mt-1">Start from Rs. 400</span>
                </button>
              </div>
            </div>
          ) : (
            // --- Screen 2: Service Selection ---
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setSelectedVehicle(null)} className="p-1 -ml-2 text-slate-400 hover:text-slate-900">
                  <ChevronLeft size={24}/>
                </button>
                <h2 className="text-xl font-bold text-slate-900">Select {selectedVehicle} Service</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {Object.values(ServiceType).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedService(type)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                      ${selectedService === type 
                        ? 'border-brand-500 bg-brand-50 text-brand-700' 
                        : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}
                    `}
                  >
                    <div className="mb-2">{SERVICE_ICONS[type]}</div>
                    <span className="text-[10px] font-medium text-center leading-tight">{type}</span>
                  </button>
                ))}
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">{selectedService}</span>
                  <span className="font-bold text-lg text-slate-900">
                    Rs. {getEstimatedPrice(selectedService, selectedVehicle)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{SERVICE_DESCRIPTIONS[selectedService]}</p>
              </div>

              <button
                disabled={isLocating || !myLocation}
                onClick={handleCreateJob}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLocating ? "Detecting Location..." : (
                   <>Request Technician <ChevronRight size={20}/></>
                )}
              </button>
            </div>
          )
        ) : (
          // --- Active Job Mode ---
          <div className="space-y-4">
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <h3 className="font-bold text-lg">Finding nearby tech...</h3>
                <p className="text-slate-500 text-sm">Looking for experts in {activeJob.vehicleType} repair.</p>
                <button onClick={onCancelJob} className="mt-4 text-red-500 text-sm font-medium">Cancel Request</button>
              </div>
            )}

            {isAssigned && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Technician en route</h3>
                  <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded text-xs font-bold">
                    {/* Simple distance calc for demo */}
                    {myLocation && technicianLocation ? 
                      `${(Math.sqrt(Math.pow(myLocation.lat - technicianLocation.lat, 2) + Math.pow(myLocation.lng - technicianLocation.lng, 2)) * 111).toFixed(1)} km` 
                      : 'Calculating...'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <img src="https://i.pravatar.cc/150?u=tech" alt="Tech" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Ali Khan</h4>
                    <div className="flex items-center text-yellow-500 text-xs">
                      <Star size={12} fill="currentColor" />
                      <span className="ml-1 font-medium text-slate-600">4.9 (120 jobs)</span>
                    </div>
                    <p className="text-xs text-slate-400">Honda CD 70 • LEZ-1234</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button className="p-2 bg-slate-100 rounded-full text-slate-600"><MessageSquare size={20}/></button>
                    <button className="p-2 bg-green-100 rounded-full text-green-600"><Phone size={20}/></button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                  <p className="text-xs text-blue-800 font-medium text-center">
                    Share this code when job is done:
                  </p>
                  <div className="text-3xl font-mono font-bold text-center text-blue-900 tracking-widest mt-1">
                    {activeJob.otp}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
