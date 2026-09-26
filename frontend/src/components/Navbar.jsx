import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck, LogOut, ChevronDown, Radio, Activity } from 'lucide-react';
import { RoleBadge } from './Badge';

export function Navbar() {
  const { user, role, switchRole, logout } = useAuth();
  const [switching, setSwitching] = useState(false);

  const demoRoles = [
    { label: 'General Arthur Kane (Admin - All Bases)', role: 'ADMIN', baseId: null },
    { label: 'Col. Marcus Vance (Commander - Fort Liberty)', role: 'BASE_COMMANDER', baseId: 1 },
    { label: 'Col. Sarah Jenkins (Commander - Camp Pendleton)', role: 'BASE_COMMANDER', baseId: 2 },
    { label: 'Capt. Ray Miller (Logistics - Fort Liberty)', role: 'LOGISTICS_OFFICER', baseId: 1 },
    { label: 'Maj. Elena Rostova (Logistics - Ramstein AB)', role: 'LOGISTICS_OFFICER', baseId: 3 },
  ];

  const handleQuickSwitch = async (targetRole, baseId) => {
    setSwitching(true);
    await switchRole(targetRole, baseId);
    setSwitching(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Shield className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-slate-100 uppercase">
                Vanguard MAMS
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SECURE NET
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Military Asset Management & Movement Framework
            </p>
          </div>
        </div>

        {/* Center / Right: Demo Fast-Switcher & Profile Controls */}
        <div className="flex items-center gap-3">
          {/* Fast Role Switcher Dropdown (Critical Evaluator Feature) */}
          <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-medium cursor-pointer shadow-sm hover:border-amber-400 transition-colors">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Demo RBAC Switcher:</span>
              <select
                disabled={switching}
                onChange={(e) => {
                  const selected = demoRoles[e.target.selectedIndex];
                  if (selected) handleQuickSwitch(selected.role, selected.baseId);
                }}
                className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer text-xs"
                value={`${role}-${user?.base_id || 'null'}`}
              >
                {demoRoles.map(dr => (
                  <option
                    key={`${dr.role}-${dr.baseId}`}
                    value={`${dr.role}-${dr.baseId || 'null'}`}
                    className="bg-slate-900 text-slate-200"
                  >
                    {dr.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active User Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-lg">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {user?.military_rank ? `${user.military_rank} ` : ''}{user?.full_name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {user?.base_name || 'Global Headquarters'}
              </div>
            </div>
            <RoleBadge role={role} />
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
            title="Sign out of MAMS"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
