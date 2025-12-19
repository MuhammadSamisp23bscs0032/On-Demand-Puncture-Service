import React from 'react';
import { Job, JobStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, DollarSign, Wrench, AlertTriangle } from 'lucide-react';

interface AdminViewProps {
  activeJob: Job | null;
  history: Job[];
}

export const AdminView: React.FC<AdminViewProps> = ({ activeJob, history }) => {
  
  // --- Mock Stats Data ---
  const stats = [
    { name: 'Mon', jobs: 12 },
    { name: 'Tue', jobs: 19 },
    { name: 'Wed', jobs: 3 },
    { name: 'Thu', jobs: 5 },
    { name: 'Fri', jobs: 22 },
    { name: 'Sat', jobs: 30 },
    { name: 'Sun', jobs: 15 },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white p-6 border-b border-slate-200">
        <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Overview of system performance</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <Users size={14} /> Total Techs
                </div>
                <div className="text-2xl font-bold text-slate-900">24</div>
                <div className="text-xs text-green-500 font-medium">+2 online</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <DollarSign size={14} /> Revenue (Today)
                </div>
                <div className="text-2xl font-bold text-slate-900">Rs. 15,400</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <Wrench size={14} /> Active Jobs
                </div>
                <div className="text-2xl font-bold text-slate-900">{activeJob ? 1 : 0}</div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <AlertTriangle size={14} /> Alerts
                </div>
                <div className="text-2xl font-bold text-slate-900">0</div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="md:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-64 md:h-80">
                <h3 className="font-bold text-sm text-slate-700 mb-4">Weekly Jobs</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30}>
                        {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.jobs > 20 ? '#2563eb' : '#93c5fd'} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>

                <div className="space-y-6">
                    {/* Active Job Monitor */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-700">Live Jobs</h3>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full animate-pulse">Live</span>
                        </div>
                        
                        {activeJob ? (
                            <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                <span className="text-xs font-mono bg-slate-100 px-1 rounded text-slate-500">{activeJob.id}</span>
                                <div className="font-medium text-slate-900">{activeJob.serviceType}</div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize 
                                ${activeJob.status === JobStatus.SEARCHING ? 'bg-yellow-100 text-yellow-700' : 
                                    activeJob.status === JobStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                {activeJob.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500">
                                <span>Cust: {activeJob.customerId}</span>
                                <span>Tech: {activeJob.technicianId || 'Pending'}</span>
                            </div>
                            
                            {/* Admin Actions */}
                            <div className="mt-4 flex gap-2 border-t pt-3">
                                <button className="flex-1 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700">Log Audit</button>
                                <button className="flex-1 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-700">Reassign</button>
                            </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                            No active jobs at the moment.
                            </div>
                        )}
                    </div>

                    {/* Recent History Snippet */}
                    <div>
                        <h3 className="font-bold text-sm text-slate-700 mb-3">Recent Completed</h3>
                        <div className="space-y-2">
                            {history.slice(0, 3).map(job => (
                            <div key={job.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 text-sm">
                                <div>
                                <div className="font-medium">{job.serviceType}</div>
                                <div className="text-xs text-slate-400">{new Date(job.createdAt).toLocaleTimeString()}</div>
                                </div>
                                <div className="font-bold text-green-600">Rs. {job.price}</div>
                            </div>
                            ))}
                            {history.length === 0 && <div className="text-xs text-slate-400 italic">No history yet.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};