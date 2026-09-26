import React, { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FilterBar } from '../components/FilterBar';
import { MetricCard } from '../components/MetricCard';
import { NetMovementModal } from '../components/NetMovementModal';
import {
  Boxes,
  TrendingUp,
  Flame,
  ShieldCheck,
  UserCheck,
  PackageCheck,
  Layers,
  Building2,
  ArrowRight,
  PlusCircle,
  ArrowLeftRight,
  ClipboardList
} from 'lucide-react';

export function DashboardPage({ onNavigate }) {
  const { startDate, endDate, baseId, equipmentTypeId } = useFilter();
  const { role, user } = useAuth();

  const [metricsData, setMetricsData] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [basesOverview, setBasesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNetModalOpen, setIsNetModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const filterParams = { startDate, endDate, baseId, equipmentTypeId };

    Promise.all([
      api.getDashboardMetrics(filterParams),
      api.getCategoryDistribution(baseId),
      role === 'ADMIN' ? api.getBasesOverview() : Promise.resolve({ success: true, bases: [] })
    ])
      .then(([mRes, distRes, basesRes]) => {
        if (mRes.success) setMetricsData(mRes.metrics);
        if (distRes.success) setDistribution(distRes.distribution);
        if (basesRes.success) setBasesOverview(basesRes.bases);
      })
      .catch(err => console.error('Failed to load dashboard data:', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate, baseId, equipmentTypeId, role]);

  const metrics = metricsData || {
    openingBalance: 0,
    closingBalance: 0,
    netMovement: 0,
    purchases: { quantity: 0, count: 0, totalCost: 0 },
    transfersIn: { quantity: 0, count: 0 },
    transfersOut: { quantity: 0, count: 0 },
    expended: { quantity: 0, count: 0 },
    assigned: { quantity: 0, count: 0 },
    availableStock: 0
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            Tactical Asset Command Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Command Post: <span className="text-slate-200 font-semibold">{user?.base_name || 'Global Strategic HQ'}</span> | Active Role: <span className="text-amber-400 font-semibold">{role}</span>
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('purchases')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Procure Assets</span>
          </button>
          <button
            onClick={() => onNavigate('transfers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer Assets</span>
          </button>
          {role !== 'LOGISTICS_OFFICER' && (
            <button
              onClick={() => onNavigate('assignments')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Assign / Expend</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Opening Balance */}
        <MetricCard
          title="Opening Balance"
          value={metrics.openingBalance}
          subtitle="Stock at window start"
          icon={Boxes}
          formula="Base Inventory + Prior Ledger"
          accentColor="purple"
        />

        {/* 2. Net Movement (CLICKABLE BONUS POP-UP!) */}
        <MetricCard
          title="Net Movement"
          value={metrics.netMovement > 0 ? `+${metrics.netMovement}` : metrics.netMovement}
          subtitle="Purchases + In - Out"
          icon={TrendingUp}
          formula="Purchases + Trf In - Trf Out"
          accentColor="amber"
          isInteractive={true}
          onClick={() => setIsNetModalOpen(true)}
          badge="Bonus Pop-up"
        />

        {/* 3. Expended Assets */}
        <MetricCard
          title="Expended Assets"
          value={metrics.expended?.quantity || 0}
          subtitle={`${metrics.expended?.count || 0} expenditure events`}
          icon={Flame}
          formula="Training, Combat & Waste"
          accentColor="rose"
        />

        {/* 4. Closing Balance */}
        <MetricCard
          title="Closing Balance"
          value={metrics.closingBalance}
          subtitle="Net inventory on hand"
          icon={ShieldCheck}
          formula="Opening + Net Mov - Expended"
          accentColor="emerald"
        />

        {/* 5. Assigned Assets */}
        <MetricCard
          title="Assigned to Personnel"
          value={metrics.assigned?.quantity || 0}
          subtitle={`${metrics.assigned?.count || 0} soldiers deployed`}
          icon={UserCheck}
          formula="Active Field Checkouts"
          accentColor="blue"
        />

        {/* 6. Available Stock */}
        <MetricCard
          title="Available Unassigned"
          value={metrics.availableStock}
          subtitle="Ready for deployment"
          icon={PackageCheck}
          formula="Closing - Active Assigned"
          accentColor="cyan"
        />
      </div>

      {/* Secondary Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Equipment Category Distribution */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Equipment Category Distribution
              </h3>
              <p className="text-xs text-slate-400">Baseline allocation across tactical domains</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Armory Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {distribution.map(cat => {
              const totalItems = distribution.reduce((sum, c) => sum + (c.initial_total || 0), 0);
              const percentage = totalItems > 0 ? Math.round(((cat.initial_total || 0) / totalItems) * 100) : 0;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.category}</span>
                    <span className="font-mono text-slate-400">
                      {(cat.initial_total || 0).toLocaleString()} units ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Bases Summary (For Admin) or Quick Command Brief (For Commander) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                {role === 'ADMIN' ? 'All Military Bases Status' : 'Base Installation Telemetry'}
              </h3>
              <p className="text-xs text-slate-400">
                {role === 'ADMIN' ? 'Overview of 4 operational command installations' : `Detailed telemetry for ${user?.base_name}`}
              </p>
            </div>
          </div>

          {role === 'ADMIN' && basesOverview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Installation</th>
                    <th className="py-2.5 px-3">Commander</th>
                    <th className="py-2.5 px-3 text-right">Baseline Stock</th>
                    <th className="py-2.5 px-3 text-right">Orders</th>
                    <th className="py-2.5 px-3 text-right">Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {basesOverview.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                        {b.name} <span className="text-[10px] text-slate-400 font-mono">({b.code})</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400">{b.commander_name}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{b.initial_inventory.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-amber-400">{b.total_purchases}</td>
                      <td className="py-2.5 px-3 text-right text-blue-400">{b.active_assignments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Installation Code:</span>
                <span className="text-amber-400 font-bold">{user?.base_code || 'BASE-LIBERTY'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Commanding Officer:</span>
                <span className="text-slate-200">{user?.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Security Clearance:</span>
                <span className="text-purple-300 font-bold">{role}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">RBAC Enforcement:</span>
                <span className="text-emerald-400 font-bold">ACTIVE & SCOPED</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bonus Feature Modal: Net Movement Breakdown */}
      <NetMovementModal
        isOpen={isNetModalOpen}
        onClose={() => setIsNetModalOpen(false)}
        filters={{ startDate, endDate, baseId, equipmentTypeId }}
      />
    </div>
  );
}
