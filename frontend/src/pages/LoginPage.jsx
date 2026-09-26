import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, User, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState(null);

  const demoAccounts = [
    {
      title: 'Global Administrator',
      role: 'ADMIN',
      user: 'admin',
      pass: 'Admin@1234',
      name: 'Gen. Arthur Kane',
      rank: 'Four-Star General',
      base: 'Global HQ (All Installations)',
      access: 'Full unrestricted command, all bases, full audit trail, base creation',
      theme: 'border-purple-500/40 hover:border-purple-500 bg-purple-950/20'
    },
    {
      title: 'Fort Liberty Commander',
      role: 'BASE_COMMANDER',
      user: 'commander_liberty',
      pass: 'Commander@1234',
      name: 'Col. Marcus Vance',
      rank: 'Colonel',
      base: 'Fort Liberty, NC',
      access: 'Command of Fort Liberty assets, assignments, expenditures, purchases, transfers',
      theme: 'border-amber-500/40 hover:border-amber-500 bg-amber-950/20'
    },
    {
      title: 'Fort Liberty Logistics',
      role: 'LOGISTICS_OFFICER',
      user: 'logistics_liberty',
      pass: 'Logistics@1234',
      name: 'Capt. Ray Miller',
      rank: 'Captain',
      base: 'Fort Liberty Logistics',
      access: 'Procurement (purchases) & inter-base transfers; restricted from personnel assignments',
      theme: 'border-blue-500/40 hover:border-blue-500 bg-blue-950/20'
    },
    {
      title: 'Ramstein Logistics',
      role: 'LOGISTICS_OFFICER',
      user: 'logistics_ramstein',
      pass: 'Logistics@1234',
      name: 'Maj. Elena Rostova',
      rank: 'Major',
      base: 'Ramstein Air Base (EU)',
      access: 'European theatre transfers and rapid procurement fulfillment',
      theme: 'border-cyan-500/40 hover:border-cyan-500 bg-cyan-950/20'
    }
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);
    const result = await login(username, password);
    if (!result.success) {
      setError(result.message || 'Authentication failed. Check credentials.');
    }
  };

  const handleSelectDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2 shadow-lg shadow-amber-500/5">
            <Shield className="w-10 h-10 fill-amber-500/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-slate-100 uppercase">
            Vanguard Defense Network
          </h1>
          <p className="text-sm text-slate-400 font-mono">
            Military Asset Management & Strategic Logistics Command (MAMS)
          </p>
        </div>

        {/* Login & Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Box */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Access Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter military clearance credentials to initialize session.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Callsign / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or commander_liberty"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Clearance Passphrase
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
              ROLE-BASED ENCRYPTED TERMINAL // LEVEL-4 CLEARANCE
            </div>
          </div>

          {/* Right Demo Cards Box (One-Click Testing) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Quick Demo RBAC Profiles
                </h3>
                <p className="text-xs text-slate-400">
                  Click any credential card to auto-fill the login form instantly.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                1-Click Select
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoAccounts.map(demo => {
                const isSelected = username === demo.user;

                return (
                  <div
                    key={demo.user}
                    onClick={() => handleSelectDemo(demo.user, demo.pass)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${demo.theme} ${
                      isSelected ? 'ring-2 ring-amber-400 shadow-lg' : ''
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-amber-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      {demo.title}
                    </div>
                    <div className="text-sm font-bold text-slate-100">
                      {demo.name}
                    </div>
                    <div className="text-xs text-amber-400/90 font-mono mt-0.5">
                      {demo.base}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {demo.access}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>User: <strong className="text-slate-200">{demo.user}</strong></span>
                      <span>Pass: <strong className="text-slate-200">{demo.pass}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="text-amber-400 font-bold">Tip:</span>
              <span>Once logged in, you can also switch roles on the fly using the header dropdown!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
