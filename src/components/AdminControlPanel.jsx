// src/components/AdminControlPanel.jsx
import { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function AdminControlPanel() {
    const { jwtToken, userRole } = useSocket();
    const [vehicleName, setVehicleName] = useState('');
    const [vehicleType, setVehicleType] = useState('HEAVY_HAULER');
    const [maxWeight, setMaxWeight] = useState('500');
    const [maxRangeKm, setMaxRangeKm] = useState('150');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const handleRegisterVehicle = async (e) => {
        e.preventDefault();
        if (!vehicleName) {
            setError('Please provide a vehicle name.');
            return;
        }
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            await apiFetch('/api/vehicles', {
                method: 'POST',
                token: jwtToken,
                body: {
                    name: vehicleName,
                    type: vehicleType,
                    maxWeight: parseFloat(maxWeight),
                    maxRangeKm: parseFloat(maxRangeKm),
                },
            });
            setSuccessMsg(`Vehicle ${vehicleName} successfully registered!`);
            setVehicleName('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-100 space-y-3">
            <h3 className="text-sm font-bold tracking-tight text-white">Admin & Dispatcher Control</h3>
            <div className="text-[11px] text-indigo-400 font-mono uppercase tracking-wider">Access Level: {userRole || 'Guest'}</div>

            {error && (
                <div className="p-2 bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[11px] rounded font-mono">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[11px] rounded font-mono">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleRegisterVehicle} className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Register New Fleet Asset</div>
                <input
                    type="text"
                    placeholder="Vehicle Name (e.g. Heavy Hauler #02)"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                >
                    <option value="HEAVY_HAULER">Heavy Hauler</option>
                    <option value="MEDIUM_TRUCK">Medium Truck</option>
                    <option value="LIGHT_VAN">Light Van</option>
                </select>
                <div className="grid grid-cols-2 gap-1.5">
                    <input
                        type="number"
                        placeholder="Max Weight (kg)"
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 font-mono"
                    />
                    <input
                        type="number"
                        placeholder="Max Range (km)"
                        value={maxRangeKm}
                        onChange={(e) => setMaxRangeKm(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 font-mono"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold py-1.5 rounded text-xs transition-all disabled:opacity-50"
                >
                    {submitting ? 'Registering Asset...' : '+ Add Asset to Fleet'}
                </button>
            </form>
        </div>
    );
}