// src/components/SystemAuditLogs.jsx
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function SystemAuditLogs() {
    const { jwtToken, userRole, socket } = useSocket();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/audit-logs', { token: jwtToken });
            setLogs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [jwtToken]);

    useEffect(() => {
        if (userRole === 'ADMIN' || userRole === 'MANAGER') {
            fetchLogs();
        }
    }, [userRole, fetchLogs]);

    // Real-time log updates via Socket.io
    useEffect(() => {
        if (!socket || (userRole !== 'ADMIN' && userRole !== 'MANAGER')) return;

        const handleNewLog = (newLog) => {
            setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
        };

        socket.on('auditLogAppended', handleNewLog);
        return () => {
            socket.off('auditLogAppended', handleNewLog);
        };
    }, [socket, userRole]);

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return null;
    }

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-100 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold tracking-tight text-white font-sans">System Audit & Telemetry Log</h3>
                {loading && <span className="text-[9px] text-indigo-400 animate-pulse">Syncing...</span>}
            </div>

            {error && (
                <div className="p-2 bg-rose-950/80 border border-rose-800/80 text-rose-300 rounded">
                    {error}
                </div>
            )}

            <div className="max-h-40 overflow-y-auto space-y-1">
                {logs.length === 0 && !loading && (
                    <div className="text-slate-500 text-center py-2">No audit events recorded yet.</div>
                )}
                {logs.map((log, idx) => (
                    <div key={log.id || idx} className="bg-slate-950/60 p-2 rounded border border-slate-800/60 flex justify-between items-start text-[10px]">
                        <div>
                            <span className="text-indigo-400 font-bold uppercase">[{log.actionType}]</span>{' '}
                            <span className="text-slate-300">{log.description}</span>
                            <div className="text-[9px] text-slate-500 mt-0.5">Operator: {log.username || 'System'}</div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap ml-2">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}