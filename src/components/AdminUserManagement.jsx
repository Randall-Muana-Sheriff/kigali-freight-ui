// src/components/AdminUserManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function AdminUserManagement() {
    const { jwtToken, userRole } = useSocket();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/users', { token: jwtToken });
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [jwtToken]);

    useEffect(() => {
        if (userRole === 'admin' || userRole === 'manager') {
            // Call fetch asynchronously to avoid sync setState inside effect
            setTimeout(() => {
                fetchUsers();
            }, 0);
        }
    }, [userRole, fetchUsers]);

    const handleRoleChange = async (userId, newRole) => {
        setError(null);
        setSuccessMsg(null);
        try {
            await apiFetch(`/api/users/${userId}/role`, {
                method: 'PATCH',
                token: jwtToken,
                body: { role: newRole },
            });
            setSuccessMsg(`User role updated to ${newRole}`);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    if (userRole !== 'admin' && userRole !== 'manager') {
        return null;
    }

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-100 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold tracking-tight text-white font-sans">User & Role Governance</h3>
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

            <div className="max-h-36 overflow-y-auto space-y-1.5">
                {users.length === 0 && !loading && (
                    <div className="text-slate-500 text-center py-2">No registered operator profiles found.</div>
                )}
                {users.map((u) => (
                    <div key={u.id} className="bg-slate-950/60 p-2 rounded border border-slate-800/80 flex justify-between items-center">
                        <div className="truncate max-w-[130px]">
                            <div className="text-white font-bold">{u.username || u.email}</div>
                            <div className="text-[9px] text-slate-400">ID: {u.id}</div>
                        </div>
                        <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                        >
                            <option value="dispatcher">DISPATCHER</option>
                            <option value="manager">MANAGER</option>
                            <option value="admin">ADMIN</option>
                            <option value="driver">DRIVER</option>
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}