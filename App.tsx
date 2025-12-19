import React, { useState, useEffect, useRef } from 'react';
import { UserRole, Job, JobStatus, ServiceType, VehicleType, GeoLocation } from './types';
import { CustomerView } from './components/CustomerView';
import { TechnicianView } from './components/TechnicianView';
import { AdminView } from './components/AdminView';
import { Layout } from './components/Layout';
import { AlertCircle, User, Wrench, ShieldCheck } from 'lucide-react';

// Default to a location (e.g., Liberty Market Lahore) if GPS fails
const DEFAULT_LOCATION: GeoLocation = { lat: 31.5102, lng: 74.3441 };

const App: React.FC = () => {
  // --- Global State ---
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
  
  // Lifted state: Technician Online Status
  const [isTechnicianOnline, setIsTechnicianOnline] = useState(true);
  
  // --- Real-time Location State ---
  // In a real app, these would be synced via Firebase/Socket.io
  const [customerLocation, setCustomerLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [technicianLocation, setTechnicianLocation] = useState<GeoLocation>({ 
    lat: DEFAULT_LOCATION.lat + 0.01, // Tech starts slightly away
    lng: DEFAULT_LOCATION.lng + 0.01 
  });

  // Ref to access current state inside setTimeout closure
  const isTechnicianOnlineRef = useRef(isTechnicianOnline);
  useEffect(() => {
    isTechnicianOnlineRef.current = isTechnicianOnline;
  }, [isTechnicianOnline]);

  // --- Simulation: Move Technician towards Customer ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (activeJob && [JobStatus.ACCEPTED, JobStatus.ARRIVED, JobStatus.IN_PROGRESS].includes(activeJob.status)) {
      interval = setInterval(() => {
        setTechnicianLocation(prev => {
          const target = customerLocation;
          const speed = 0.0001; // Movement speed factor
          
          // Simple linear interpolation to move tech closer to customer
          const dx = target.lat - prev.lat;
          const dy = target.lng - prev.lng;
          const distance = Math.sqrt(dx*dx + dy*dy);

          if (distance < 0.0005) return prev; // Arrived

          return {
            lat: prev.lat + (dx * 0.05),
            lng: prev.lng + (dy * 0.05)
          };
        });
      }, 1000); // Update every second
    }

    return () => clearInterval(interval);
  }, [activeJob, customerLocation]);


  // --- Mock Data Store ---
  const [jobsHistory, setJobsHistory] = useState<Job[]>([]);

  // --- Handlers ---

  const createJob = (serviceType: ServiceType, vehicleType: VehicleType, lat: number, lng: number) => {
    // Update customer location to where they requested
    setCustomerLocation({ lat, lng });

    const newJob: Job = {
      id: `JOB-${Date.now().toString().slice(-6)}`,
      customerId: 'cust_123',
      technicianId: null,
      status: JobStatus.SEARCHING,
      serviceType,
      vehicleType,
      location: { lat, lng },
      createdAt: new Date(),
      price: calculatePrice(serviceType, vehicleType),
      otp: Math.floor(1000 + Math.random() * 9000).toString(), // 4 digit OTP
    };
    setActiveJob(newJob);
    setNotification({ title: "Request Sent", message: "Searching for nearby technicians..." });
    
    // Reset Tech location to a random nearby spot for the demo
    setTechnicianLocation({
      lat: lat + (Math.random() * 0.01 - 0.005),
      lng: lng + (Math.random() * 0.01 - 0.005)
    });

    // Simulate finding a tech after 3 seconds
    setTimeout(() => {
      if (isTechnicianOnlineRef.current) {
        updateJobStatus(newJob.id, JobStatus.OFFERED);
      } else {
        setNotification({ title: "Unavailable", message: "No online technicians found nearby." });
        setActiveJob(null);
      }
    }, 3000);
  };

  const updateJobStatus = (jobId: string, status: JobStatus, extras?: Partial<Job>) => {
    setActiveJob(prev => {
      if (!prev || prev.id !== jobId) return prev;
      const updated = { ...prev, status, ...extras, updatedAt: new Date() };
      
      if (status === JobStatus.COMPLETED) {
        setJobsHistory(h => [updated, ...h]);
      }
      return updated;
    });
  };

  const calculatePrice = (service: ServiceType, vehicle: VehicleType) => {
    if (vehicle === VehicleType.BIKE) {
      switch (service) {
        case ServiceType.TUBE_PATCH: return 150;
        case ServiceType.TUBELESS_PLUG: return 200;
        case ServiceType.TOW: return 1500;
        default: return 0;
      }
    } else {
      switch (service) {
        case ServiceType.TUBE_PATCH: return 400;
        case ServiceType.TUBELESS_PLUG: return 500;
        case ServiceType.TOW: return 3000;
        default: return 0;
      }
    }
  };

  const renderRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.CUSTOMER: return <User size={16} />;
      case UserRole.TECHNICIAN: return <Wrench size={16} />;
      case UserRole.ADMIN: return <ShieldCheck size={16} />;
    }
  };

  return (
    <div className="font-sans text-slate-900">
      {/* Dev Role Switcher */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur shadow-lg rounded-full p-1 flex gap-1 border border-gray-200">
        {(Object.values(UserRole) as UserRole[]).map((role) => (
          <button
            key={role}
            onClick={() => setCurrentRole(role)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${currentRole === role 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-gray-100'}
            `}
          >
            {renderRoleIcon(role)}
            <span className="hidden sm:inline capitalize">{role}</span>
          </button>
        ))}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-xs w-full">
            <AlertCircle size={20} className="text-brand-400" />
            <div>
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-xs text-slate-300">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-auto text-slate-400 hover:text-white">
              &times;
            </button>
          </div>
        </div>
      )}

      <Layout>
        {currentRole === UserRole.CUSTOMER && (
          <CustomerView 
            activeJob={activeJob} 
            onCreateJob={createJob} 
            onCancelJob={() => setActiveJob(null)}
            onCompleteFlow={() => setActiveJob(null)}
            technicianLocation={technicianLocation}
          />
        )}
        {currentRole === UserRole.TECHNICIAN && (
          <TechnicianView 
            activeJob={activeJob} 
            onUpdateStatus={updateJobStatus}
            isOnline={isTechnicianOnline}
            setIsOnline={setIsTechnicianOnline}
            technicianLocation={technicianLocation}
            setTechnicianLocation={setTechnicianLocation}
            customerLocation={customerLocation}
          />
        )}
        {currentRole === UserRole.ADMIN && (
          <AdminView 
            activeJob={activeJob}
            history={jobsHistory}
          />
        )}
      </Layout>
    </div>
  );
};

export default App;