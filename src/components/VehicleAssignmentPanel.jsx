// src/components/VehicleAssignmentPanel.jsx
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function VehicleAssignmentPanel() {
    const { jwtToken, userRole } = useSocket();
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [vehData, usrData] = await Promise.all([
                apiFetch('/api/vehicles', { token: jwtToken }),
                apiFetch('/api/users', { token: jwtToken }),
            ]);
            setVehicles(vehData);
            setDrivers(usrData.filter((u) => u.role === 'DRIVER'));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [jwtToken]);

    useEffect(() => {
        if (userRole === 'ADMIN' || userRole === 'MANAGER') {
            fetchData();
        }
    }, [userRole, fetchData]);

    const handleAssignment = async (e) => {
        e.preventDefault();
        if (!selectedVehicle || !selectedDriver) {
            setError('Please select both a vehicle asset and a driver.');
            return;
        }
        setError(null);
        setSuccessMsg(null);
        try {
            await apiFetch(`/api/vehicles/${selectedVehicle}/assign`, {
                method: 'PATCH',
                token: jwtToken,
                body: { driverId: selectedDriver },
            });
            setSuccessMsg('Driver successfully assigned to vehicle asset.');
            setSelectedVehicle('');
            setSelectedDriver('');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return null;
    }

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-100 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold tracking-tight text-white font-sans">Fleet Driver Assignment</h3>
                {loading && <span className="text-[9px] text-indigo-400 animate-pulse">Syncing...</span>}
            </div>

            {error && (
                <div className="p-2 bg-rose-950/80 border border-rose-800/80 text-rose-300 rounded">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleAssignment} className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                >
                    <option value="">Select Vehicle Asset</option>
                    {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.name} ({v.type})
                        </option>
                    ))}
                </select>
                <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                >
                    <option value="">Select Available Driver</option>
                    {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.username || d.email}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 rounded text-xs transition-all"
                >
                    Assign Driver to Asset
                </button>
            </form>
        </div>
    );
}