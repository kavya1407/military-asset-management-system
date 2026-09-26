import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badge';
import { ArrowDownLeft, ArrowUpRight, ShoppingCart, Calculator, AlertCircle } from 'lucide-react';

export function NetMovementModal({ isOpen, onClose, filters }) {
  const [activeTab, setActiveTab] = useState('purchases');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      api.getNetMovementDetails(filters)
        .then(res => {
          if (res.success) {
            setData(res);
          } else {
            setError(res.message || 'Failed to load details');
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, filters]);

  const summary = data?.summary || {
    purchasesQty: 0,
    purchasesCount: 0,
    transfersInQty: 0,
    transfersInCount: 0,
    transfersOutQty: 0,
    transfersOutCount: 0,
    netMovementQty: 0
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Net Movement Ledger & Movement Breakdown"
      subtitle="Detailed audit breakdown of Purchases, Inbound Transfers, and Outbound Transfers"
      maxWidth="max-w-4xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Calculating inventory ledger movements...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mathematical Formula Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <Calculator className="w-4 h-4" />
              <span>Net Movement Mathematical Equation</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm font-mono">
              <div className="px-3 py-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <span className="text-xs text-slate-400 block font-sans">Purchases (+)</span>
                +{summary.purchasesQty.toLocaleString()} units
              </div>
              <span className="text-slate-500 font-bold text-lg">+</span>
              <div className="px-3 py-1.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-300">
                <span className="text-xs text-slate-400 block font-sans">Transfers In (+)</span>
                +{summary.transfersInQty.toLocaleString()} units
              </div>
              <span className="text-slate-500 font-bold text-lg">-</span>
              <div className="px-3 py-1.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300">
                <span className="text-xs text-slate-400 block font-sans">Transfers Out (-)</span>
                -{summary.transfersOutQty.toLocaleString()} units
              </div>
              <span className="text-slate-500 font-bold text-lg">=</span>
              <div className="px-3 py-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                <span className="text-xs text-slate-400 block font-sans">Net Movement</span>
                {summary.netMovementQty > 0 ? `+${summary.netMovementQty.toLocaleString()}` : summary.netMovementQty.toLocaleString()} units
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'purchases'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Purchases ({summary.purchasesCount})
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                +{summary.purchasesQty}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('transfersIn')}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'transfersIn'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Transfers In ({summary.transfersInCount})
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                +{summary.transfersInQty}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('transfersOut')}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'transfersOut'
                  ? 'border-rose-400 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Transfers Out ({summary.transfersOutCount})
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                -{summary.transfersOutQty}
              </span>
            </button>
          </div>

          {/* Tab 1: Purchases Table */}
          {activeTab === 'purchases' && (
            <div>
              {data.purchases.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No purchases recorded in this filtered period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Order #</th>
                        <th className="py-3 px-3">Equipment Item</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 text-right">Quantity</th>
                        <th className="py-3 px-3 text-right">Total Cost</th>
                        <th className="py-3 px-3">Base</th>
                        <th className="py-3 px-3">Supplier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {data.purchases.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{p.purchase_date}</td>
                          <td className="py-3 px-3 text-emerald-400 font-semibold">{p.order_number}</td>
                          <td className="py-3 px-3 font-sans text-slate-200 font-medium">{p.equipment_name}</td>
                          <td className="py-3 px-3 font-sans"><CategoryBadge category={p.equipment_category} /></td>
                          <td className="py-3 px-3 text-right text-emerald-300 font-bold">+{p.quantity.toLocaleString()} {p.unit}</td>
                          <td className="py-3 px-3 text-right text-slate-300">${p.total_cost.toLocaleString()}</td>
                          <td className="py-3 px-3 font-sans text-slate-400">{p.base_name}</td>
                          <td className="py-3 px-3 font-sans text-slate-400">{p.supplier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Transfers In Table */}
          {activeTab === 'transfersIn' && (
            <div>
              {data.transfersIn.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No inbound transfers completed in this filtered period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Tracking #</th>
                        <th className="py-3 px-3">Equipment Item</th>
                        <th className="py-3 px-3">Origin Base</th>
                        <th className="py-3 px-3">Destination Base</th>
                        <th className="py-3 px-3 text-right">Quantity</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {data.transfersIn.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{t.transfer_date}</td>
                          <td className="py-3 px-3 text-blue-400 font-semibold">{t.tracking_number}</td>
                          <td className="py-3 px-3 font-sans text-slate-200 font-medium">{t.equipment_name}</td>
                          <td className="py-3 px-3 font-sans text-slate-400">{t.origin_base_name}</td>
                          <td className="py-3 px-3 font-sans text-blue-300 font-medium">{t.destination_base_name}</td>
                          <td className="py-3 px-3 text-right text-blue-300 font-bold">+{t.quantity.toLocaleString()} {t.unit}</td>
                          <td className="py-3 px-3"><PriorityBadge priority={t.priority} /></td>
                          <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Transfers Out Table */}
          {activeTab === 'transfersOut' && (
            <div>
              {data.transfersOut.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No outbound transfers completed in this filtered period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Tracking #</th>
                        <th className="py-3 px-3">Equipment Item</th>
                        <th className="py-3 px-3">Origin Base</th>
                        <th className="py-3 px-3">Destination Base</th>
                        <th className="py-3 px-3 text-right">Quantity</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {data.transfersOut.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{t.transfer_date}</td>
                          <td className="py-3 px-3 text-rose-400 font-semibold">{t.tracking_number}</td>
                          <td className="py-3 px-3 font-sans text-slate-200 font-medium">{t.equipment_name}</td>
                          <td className="py-3 px-3 font-sans text-rose-300 font-medium">{t.origin_base_name}</td>
                          <td className="py-3 px-3 font-sans text-slate-400">{t.destination_base_name}</td>
                          <td className="py-3 px-3 text-right text-rose-400 font-bold">-{t.quantity.toLocaleString()} {t.unit}</td>
                          <td className="py-3 px-3"><PriorityBadge priority={t.priority} /></td>
                          <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Footer note */}
          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
            >
              Close Ledger Breakdown
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
