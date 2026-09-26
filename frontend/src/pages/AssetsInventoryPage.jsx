import React, { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CategoryBadge } from '../components/Badge';
import { Boxes, MapPin, Search, ShieldCheck } from 'lucide-react';

export function AssetsInventoryPage() {
  const { bases } = useFilter();
  const { role, user } = useAuth();

  const [selectedBaseId, setSelectedBaseId] = useState(() => {
    return role !== 'ADMIN' && user?.base_id ? user.base_id : (bases[0]?.id || 1);
  });
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (role !== 'ADMIN' && user?.base_id) {
      setSelectedBaseId(user.base_id);
    } else if (bases.length > 0 && !selectedBaseId) {
      setSelectedBaseId(bases[0].id);
    }
  }, [role, user, bases]);

  useEffect(() => {
    if (selectedBaseId) {
      setLoading(true);
      api.getBaseInventory(selectedBaseId)
        .then(res => {
          if (res.success) setInventory(res.inventory);
        })
        .catch(err => console.error('Failed to load base inventory:', err))
        .finally(() => setLoading(false));
    }
  }, [selectedBaseId]);

  const filteredInventory = inventory.filter(item => {
    if (!search) return true;
    const term = search.toLowerCase();
    return item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
  });

  const selectedBase = bases.find(b => Number(b.id) === Number(selectedBaseId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-400" />
            Base Armory & Stock Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Real-time balance breakdown per equipment category and installation depot.
          </p>
        </div>

        {/* Base Selector if Admin */}
        {role === 'ADMIN' && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 font-semibold">Select Armory:</span>
            <select
              value={selectedBaseId}
              onChange={(e) => setSelectedBaseId(Number(e.target.value))}
              className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer"
            >
              {bases.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Base Info Strip */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-sm">
              {selectedBase?.name} Armory Storage Facility
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Installation Code: <span className="text-amber-400 font-semibold">{selectedBase?.code}</span> | Location: {selectedBase?.location}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-slate-400 text-[11px]">Installation Commander</div>
          <div className="font-bold text-slate-200">{selectedBase?.commander_name || 'Command Officer'}</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter armory equipment by item name or category..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
        />
      </div>

      {/* Armory Inventory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Auditing base armory inventory...
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No equipment matches current search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Equipment Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Est. Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Net Stock</th>
                  <th className="py-3 px-4 text-right">Active Assigned</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-center">Readiness Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredInventory.map(item => {
                  const isLowStock = item.availableStock <= 5;

                  return (
                    <tr key={item.equipment_type_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-sans text-slate-100 font-bold">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <CategoryBadge category={item.category} />
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        ${item.unit_cost_estimate?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-200">
                        {item.totalStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                        {item.activeAssignments.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                        {item.availableStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold uppercase tracking-wider">
                            Low Reserves
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium uppercase tracking-wider">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
