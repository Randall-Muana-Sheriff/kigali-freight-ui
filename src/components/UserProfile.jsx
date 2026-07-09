// src/components/UserProfile.jsx
import { useSocket } from '../context/SocketContext';

export default function UserProfile() {
    const { userRole, jwtToken, isConnected, logout } = useSocket();

    const tokenPreview = jwtToken ? `${jwtToken.substring(0, 10)}...${jwtToken.substring(jwtToken.length - 6)}` : 'No active session';

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-100 space-y-3 font-mono">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold tracking-tight text-white font-sans">Operator Profile</h3>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isConnected ? 'bg-emerald-950/80 border border-emerald-700/80 text-emerald-300' : 'bg-rose-950/80 border border-rose-700/80 text-rose-300'}`}>
                    {isConnected ? 'Stream Active' : 'Offline'}
                </span>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/60 text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                    <span>Role Clearance:</span>
                    <span className="text-indigo-400 font-bold uppercase">{userRole || 'Standard Operator'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                    <span>Session Token:</span>
                    <span className="text-slate-300 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{tokenPreview}</span>
                </div>
            </div>

            <button
                onClick={logout}
                className="w-full bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 font-bold py-1.5 rounded text-xs transition-all"
            >
                Terminate Session & Sign Out
            </button>
        </div>
    );
}