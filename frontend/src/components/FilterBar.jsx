import React from 'react';
import { useFilter } from '../context/FilterContext';
import { Filter, Calendar, MapPin, Shield, RotateCcw, Lock } from 'lucide-react';

export function FilterBar() {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    baseId,
    setBaseId,
    equipmentTypeId,
    setEquipmentTypeId,
    datePreset,
    applyPreset,
    resetFilters,
    bases,
    equipmentTypes,
    isBaseLocked
  } = useFilter();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg mb-6 backdrop-blur">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left side: Filter controls */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Telemetry Filters:</span>
          </div>

          {/* Date Range Presets */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => applyPreset('all')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                datePreset === 'all'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => applyPreset('month')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                datePreset === 'month'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset('last30')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                datePreset === 'last30'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => applyPreset('last7')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                datePreset === 'last7'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="bg-transparent text-slate-200 focus:outline-none text-xs [color-scheme:dark]"
              title="Start Date"
            />
            <span className="text-slate-600 font-bold">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="bg-transparent text-slate-200 focus:outline-none text-xs [color-scheme:dark]"
              title="End Date"
            />
          </div>

          {/* Base Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={baseId}
              disabled={isBaseLocked}
              onChange={(e) => setBaseId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {!isBaseLocked && <option value="all">All Military Bases (Global)</option>}
              {bases.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            {isBaseLocked && (
              <span title="Scoping locked to assigned command base" className="text-amber-400">
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Equipment Type Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={equipmentTypeId}
              onChange={(e) => setEquipmentTypeId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="all">All Equipment Types</option>
              {equipmentTypes.map(eq => (
                <option key={eq.id} value={eq.id}>
                  [{eq.category}] {eq.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Reset filter button */}
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700/60"
          title="Reset all filters to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
