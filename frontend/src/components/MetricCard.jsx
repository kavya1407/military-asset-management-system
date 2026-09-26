import React from 'react';
import { ExternalLink, Info } from 'lucide-react';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  formula,
  accentColor = 'blue',
  onClick,
  isInteractive = false,
  badge
}) {
  const colorMap = {
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/60',
      bg: 'bg-blue-950/20',
      iconBg: 'bg-blue-500/10 text-blue-400',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/5'
    },
    emerald: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      bg: 'bg-emerald-950/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      bg: 'bg-amber-950/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/5'
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/60',
      bg: 'bg-purple-950/20',
      iconBg: 'bg-purple-500/10 text-purple-400',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/5'
    },
    rose: {
      border: 'border-rose-500/30 hover:border-rose-500/60',
      bg: 'bg-rose-950/20',
      iconBg: 'bg-rose-500/10 text-rose-400',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/5'
    },
    cyan: {
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      bg: 'bg-cyan-950/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/5'
    }
  };

  const scheme = colorMap[accentColor] || colorMap.blue;

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`relative p-5 rounded-xl border bg-slate-900/90 transition-all duration-200 ${scheme.border} ${scheme.glow} ${
        isInteractive ? 'cursor-pointer hover:scale-[1.02] shadow-lg ring-1 ring-white/10 group' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              {title}
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
            {isInteractive && (
              <span className="flex items-center text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 font-medium">
                Click to inspect
                <ExternalLink className="w-2.5 h-2.5 ml-1" />
              </span>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          </div>

          {formula && (
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              {formula}
            </p>
          )}

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-lg ${scheme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {isInteractive && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-amber-400 transition-colors">
          <span>View Purchases, In & Out Details</span>
          <span className="font-semibold text-amber-400">→</span>
        </div>
      )}
    </div>
  );
}
