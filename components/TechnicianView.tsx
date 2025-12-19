import React, { useState, useRef } from 'react';
import { Job, JobStatus, PhotoAnalysisResult, VehicleType, GeoLocation } from '../types';
import { analyzeTirePhoto } from '../services/geminiService';
import { Navigation, MapPin, Camera, Check, X, Loader2, Clock, Bike, Car, Crosshair } from 'lucide-react';
import { MapVisual } from './MapVisual';

interface TechnicianViewProps {
  activeJob: Job | null;
  onUpdateStatus: (jobId: string, status: JobStatus, extras?: Partial<Job>) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  technicianLocation: GeoLocation;
  setTechnicianLocation: (loc: GeoLocation) => void;
  customerLocation: GeoLocation;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({ 
  activeJob, 
  onUpdateStatus, 
  isOnline, 
  setIsOnline,
  technicianLocation,
  setTechnicianLocation,
  customerLocation
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const toggleOnline = () => {
    if (!isOnline) {
      // Coming Online: Get Location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
             setTechnicianLocation({
               lat: position.coords.latitude,
               lng: position.coords.longitude
             });
             setIsOnline(true);
          },
          (err) => {
            console.error(err);
            setIsOnline(true); // Fallback to online even if loc fails (uses default)
          }
        );
      } else {
        setIsOnline(true);
      }
    } else {
      setIsOnline(false);
    }
  };

  const handleAccept = () => {
    if (activeJob) onUpdateStatus(activeJob.id, JobStatus.ACCEPTED);
  };

  const handleArrive = () => {
    if (activeJob) onUpdateStatus(activeJob.id, JobStatus.ARRIVED);
  };

  const handleStart = () => {
    if (activeJob) onUpdateStatus(activeJob.id, JobStatus.IN_PROGRESS);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      // Strip prefix for API if needed
      const base64Data = base64.split(',')[1];
      
      const result = await analyzeTirePhoto(base64Data);
      setAnalysisResult(result);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = () => {
    if (!activeJob) return;
    if (otpInput === activeJob.otp) {
       onUpdateStatus(activeJob.id, JobStatus.COMPLETED);
       setOtpInput('');
       setAnalysisResult(null);
    } else {
      alert("Incorrect OTP");
    }
  };

  // --- Views ---

  if (!activeJob) {
    return (
      <div className="h-full flex flex-col relative">
        {/* Background Map */}
        <MapVisual status="idle" myLocation={technicianLocation} />

        {/* Top Status Indicator */}
        <div className="absolute top-0 left-0 w-full p-4 z-10 pt-6 pointer-events-none">
           <div className="bg-white shadow-md rounded-full px-4 py-2 flex items-center gap-2 w-fit mx-auto pointer-events-auto">
               <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
               <span className="text-sm font-medium text-slate-700">{isOnline ? "You are Online" : "You are Offline"}</span>
           </div>
        </div>
        
        {/* Bottom Controls */}
        <div className="mt-auto z-20 w-full p-0 md:p-6 pointer-events-none">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-xl p-8 relative max-w-full md:max-w-md mx-auto pointer-events-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
            
            <div className="flex flex-col items-center justify-center">
               <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ${isOnline ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                 <Navigation size={32} />
               </div>
               
               <h2 className="text-2xl font-bold text-slate-900 mb-2">
                 {isOnline ? "Looking for Jobs" : "You are Offline"}
               </h2>
               <p className="text-slate-500 text-center mb-8 max-w-xs">
                 {isOnline 
                   ? "Stay in this area. You will be notified when a customer needs help." 
                   : "Go online to start receiving puncture repair jobs in your area."}
               </p>
               
               <button
                 onClick={toggleOnline}
                 className={`
                   w-full py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-[0.98]
                   ${isOnline ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-brand-600 text-white hover:bg-brand-700'}
                 `}
               >
                 {isOnline ? "Go Offline" : "Go Online (Detect GPS)"}
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Incoming Job Offer
  if (activeJob.status === JobStatus.OFFERED) {
    return (
      <div className="h-full flex flex-col relative">
        <MapVisual status="idle" myLocation={technicianLocation} />
        <div className="absolute inset-x-0 bottom-0 md:bottom-8 md:inset-x-auto md:w-full md:max-w-md md:left-1/2 md:-translate-x-1/2 bg-white md:rounded-2xl rounded-t-2xl p-6 shadow-2xl border border-slate-100 animate-slide-up z-30">
          <div className="flex justify-between items-start mb-4">
             <div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="bg-brand-100 text-brand-700 p-1 rounded-md">
                    {activeJob.vehicleType === VehicleType.BIKE ? <Bike size={16}/> : <Car size={16}/>}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">New Request</h3>
               </div>
               <p className="text-slate-500 text-sm">{activeJob.serviceType} ({activeJob.vehicleType})</p>
             </div>
             <div className="text-right">
               <span className="block text-2xl font-bold text-slate-900">Rs. {activeJob.price}</span>
               <span className="text-xs text-slate-400">Est. Earnings</span>
             </div>
          </div>
          <div className="flex gap-2 text-sm text-slate-600 mb-6">
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"><Clock size={14}/> ~10 min</span>
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"><MapPin size={14}/> Nearby</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200" onClick={() => onUpdateStatus(activeJob.id, JobStatus.SEARCHING)}>Decline</button>
            <button className="py-3 rounded-xl font-bold text-white bg-brand-600 shadow-lg shadow-brand-200 hover:bg-brand-700" onClick={handleAccept}>Accept</button>
          </div>
        </div>
      </div>
    );
  }

  // Active Job Workflow
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 pb-12 shrink-0">
        <div className="flex justify-between items-center mb-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
             <span className="bg-white/20 p-1 rounded">
                {activeJob.vehicleType === VehicleType.BIKE ? <Bike size={14}/> : <Car size={14}/>}
             </span>
             <h2 className="font-bold text-lg">Job #{activeJob.id.split('-')[1]}</h2>
          </div>
          <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono uppercase">{activeJob.status.replace('_', ' ')}</span>
        </div>
        {/* Timeline Steps */}
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 -z-0"></div>
            {[JobStatus.ACCEPTED, JobStatus.ARRIVED, JobStatus.IN_PROGRESS].map((step, idx) => (
              <div key={step} className={`w-4 h-4 rounded-full border-2 z-10 ${activeJob.status === step ? 'bg-brand-500 border-brand-500' : 'bg-slate-800 border-slate-600'}`}></div>
            ))}
        </div>
      </div>

      <div className="flex-1 -mt-6 bg-white rounded-t-3xl p-6 flex flex-col overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          {activeJob.status === JobStatus.ACCEPTED && (
             <div className="text-center space-y-6 mt-10">
               {/* Mini Map for Navigation Context */}
               <div className="h-40 w-full rounded-2xl overflow-hidden border border-slate-200 relative">
                  <MapVisual status="tracking" myLocation={technicianLocation} targetLocation={customerLocation} />
               </div>

               <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                   <div className="text-left">
                     <p className="text-xs text-slate-500">Distance to Customer</p>
                     <p className="font-bold text-slate-900">
                        {((Math.sqrt(Math.pow(technicianLocation.lat - customerLocation.lat, 2) + Math.pow(technicianLocation.lng - customerLocation.lng, 2))) * 111).toFixed(2)} km
                     </p>
                   </div>
                   <Navigation className="text-brand-600" />
               </div>

               <button onClick={handleArrive} className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-colors">Arrived at Location</button>
             </div>
          )}

          {activeJob.status === JobStatus.ARRIVED && (
            <div className="text-center space-y-6 mt-10">
               <h3 className="text-xl font-bold">Start Job</h3>
               <p className="text-slate-500">Verify customer and vehicle before starting.</p>
               <button onClick={handleStart} className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-colors">Start Work</button>
            </div>
          )}

          {activeJob.status === JobStatus.IN_PROGRESS && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Work Verification</h3>
              
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                 <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                 />
                 <div className="flex flex-col items-center gap-3 pointer-events-none">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Camera size={24} />
                    </div>
                    <p className="font-medium text-slate-700">Upload After-Work Photo</p>
                    <p className="text-xs text-slate-400">AI checks for brightness & blur</p>
                 </div>
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm font-medium">AI analyzing image quality...</span>
                </div>
              )}

              {analysisResult && (
                <div className={`p-4 rounded-xl border ${analysisResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   <div className="flex items-center gap-2 mb-2">
                      {analysisResult.isValid ? <Check className="text-green-600" size={20}/> : <X className="text-red-600" size={20}/>}
                      <h4 className={`font-bold ${analysisResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                        {analysisResult.isValid ? "Photo Verified" : "Photo Rejected"}
                      </h4>
                   </div>
                   <p className="text-sm text-slate-700 mb-2">{analysisResult.feedback}</p>
                   <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-white/50 rounded border">Brightness: {analysisResult.brightness}</span>
                      <span className="px-2 py-1 bg-white/50 rounded border">Blur: {analysisResult.blur}</span>
                   </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer OTP</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter 4-digit code"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="flex-1 p-3 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button 
                    disabled={!analysisResult?.isValid || otpInput.length !== 4}
                    onClick={handleComplete}
                    className="bg-slate-900 text-white px-6 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
                  >
                    Complete
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">OTP is required to close the job.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};