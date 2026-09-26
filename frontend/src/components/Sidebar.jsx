import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  ClipboardList,
  Boxes,
  ScrollText,
  Lock,
  Radio
} from 'lucide-react';

export function Sidebar({ currentView, onSelectView }) {
  const { role, user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Command Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']
    },
    {
      id: 'purchases',
      label: 'Procurement & Purchases',
      icon: ShoppingCart,
      roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']
    },
    {
      id: 'transfers',
      label: 'Inter-Base Transfers',
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']
    },
    {
      id: 'assignments',
      label: 'Personnel & Expenditures',
      icon: ClipboardList,
      roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'],
      restrictedFor: ['LOGISTICS_OFFICER'] // Limited access per RBAC prompt requirements
    },
    {
      id: 'inventory',
      label: 'Armory & Stock Matrix',
      icon: Boxes,
      roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']
    },
    {
      id: 'audit',
      label: 'Audit Trail & Telemetry',
      icon: ScrollText,
      roles: ['ADMIN', 'BASE_COMMANDER']
    }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Operations & Logistics
          </div>
          <nav className="space-y-1">
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isRestricted = item.restrictedFor?.includes(role);

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {isRestricted && (
                    <span
                      title="Limited access role: View only or restricted per RBAC"
                      className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-400 rounded flex items-center gap-1 border border-slate-700"
                    >
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      Limited
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tactical Terminal Info Box */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Station Telemetry</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono space-y-1 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Base Station:</span>
              <span className="text-slate-200">{user?.base_name || 'Global HQ'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Callsign:</span>
              <span className="text-amber-400 font-bold">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Clearance:</span>
              <span className="text-purple-300">{role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-400 font-mono text-center">
        VANGUARD SECURE SYSTEM v2.4
      </div>
    </aside>
  );
}
