import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    ASSIGNED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    RETURNED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    IN_TRANSIT: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    ONLINE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const style = styles[status] || 'bg-slate-700/30 text-slate-300 border-slate-600/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-80" />
      {status ? status.replace('_', ' ') : 'N/A'}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    ROUTINE: 'text-slate-400 bg-slate-800 border-slate-700',
    STANDARD: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    URGENT: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    EMERGENCY: 'text-rose-400 bg-rose-950/40 border-rose-800/50 animate-pulse font-bold',
  };

  const style = styles[priority] || 'text-slate-400 bg-slate-800 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs tracking-wide uppercase border ${style}`}>
      {priority}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    ADMIN: 'bg-purple-900/30 text-purple-300 border-purple-700/50',
    BASE_COMMANDER: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
    LOGISTICS_OFFICER: 'bg-blue-900/30 text-blue-300 border-blue-700/50',
  };

  const labels = {
    ADMIN: 'General / Admin',
    BASE_COMMANDER: 'Base Commander',
    LOGISTICS_OFFICER: 'Logistics Officer',
  };

  const style = styles[role] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${style}`}>
      {labels[role] || role}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const styles = {
    Weapons: 'bg-red-500/10 text-red-400 border-red-500/30',
    Vehicles: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Ammunition: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    Communications: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    'Medical & Field Gear': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const style = styles[category] || 'bg-slate-800 text-slate-400 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${style}`}>
      {category}
    </span>
  );
}
