import { useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function AuthForm() {
  const { login, authError } = useSocket();
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('dispatcher');

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ mode: authMode, username, password, role: selectedRole });
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 font-sans">
      <div className="w-[380px] bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">Kigali Freight Control Tower</h2>
          <p className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider">
            {authMode === 'signup' ? 'Create Operator Account' : 'Secure Operator Authentication'}
          </p>
        </div>
        {authError && (
          <div className="p-2 bg-rose-950/40 border border-rose-900/60 rounded text-[11px] text-rose-400 font-mono">
            {authError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Username</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
          {authMode === 'signup' && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Assigned Role</label>
              <select
                value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 outline-none focus:border-indigo-500 font-mono"
              >
                <option value="dispatcher">Dispatcher</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold uppercase rounded text-white tracking-wide transition-all mt-2">
            {authMode === 'signup' ? 'Register Account' : 'Authenticate Session'}
          </button>
        </form>
        <div className="text-center pt-2 border-t border-slate-800 text-[11px]">
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-indigo-400 hover:underline font-mono"
          >
            {authMode === 'login' ? 'Need an account? Sign up' : 'Already registered? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
