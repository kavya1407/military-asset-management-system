import React, { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FilterBar } from '../components/FilterBar';
import { Modal } from '../components/Modal';
import { CategoryBadge } from '../components/Badge';
import { ShoppingCart, PlusCircle, Search, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

export function PurchasesPage() {
  const { startDate, endDate, equipmentTypeId, baseId, bases, equipmentTypes } = useFilter();
  const { role, user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formBaseId, setFormBaseId] = useState('');
  const [formEquipmentId, setFormEquipmentId] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnitCost, setFormUnitCost] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Load purchases
  const loadPurchases = () => {
    setLoading(true);
    api.getPurchases({ startDate, endDate, equipmentTypeId, baseId, search })
      .then(res => {
        if (res.success) {
          setPurchases(res.purchases);
          setTotalCount(res.total);
        }
      })
      .catch(err => console.error('Failed to load purchases:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPurchases();
  }, [startDate, endDate, equipmentTypeId, baseId, search]);

  // Set default base when modal opens
  const handleOpenModal = () => {
    setFormError(null);
    setFormSuccess(null);
    if (role !== 'ADMIN' && user?.base_id) {
      setFormBaseId(String(user.base_id));
    } else if (bases.length > 0) {
      setFormBaseId(String(bases[0].id));
    }

    if (equipmentTypes.length > 0) {
      setFormEquipmentId(String(equipmentTypes[0].id));
      setFormUnitCost(String(equipmentTypes[0].unit_cost_estimate || ''));
    }

    setFormQuantity('10');
    setFormSupplier('Colt Defense LLC');
    setFormOrderNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleEquipmentChange = (eqId) => {
    setFormEquipmentId(eqId);
    const selected = equipmentTypes.find(e => String(e.id) === String(eqId));
    if (selected) {
      setFormUnitCost(String(selected.unit_cost_estimate || ''));
    }
  };

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        base_id: Number(formBaseId),
        equipment_type_id: Number(formEquipmentId),
        quantity: Number(formQuantity),
        unit_cost: Number(formUnitCost),
        supplier: formSupplier,
        order_number: formOrderNumber,
        purchase_date: formDate,
        notes: formNotes
      };

      const res = await api.createPurchase(payload);
      if (res.success) {
        setFormSuccess(res.message);
        setTimeout(() => {
          setIsModalOpen(false);
          loadPurchases();
        }, 1200);
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalProcurementCost = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalProcurementUnits = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            Asset Procurement & Purchases
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Record newly acquired defense matériel, weapons, vehicles, and munitions.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Purchase Order</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Quick Procurement Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Filtered Purchases</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{totalCount} orders</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Matériel Acquired</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              +{totalProcurementUnits.toLocaleString()} units
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <PlusCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Procurement Expenditure</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              ${totalProcurementCost.toLocaleString()}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number (e.g. PO-2026), equipment name, or supplier..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
        />
      </div>

      {/* Purchases Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading procurement archives...
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No purchase records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Equipment Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4">Base Destination</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{p.purchase_date}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{p.order_number}</td>
                    <td className="py-3 px-4 font-sans text-slate-200 font-semibold">{p.equipment_name}</td>
                    <td className="py-3 px-4 font-sans"><CategoryBadge category={p.equipment_category} /></td>
                    <td className="py-3 px-4 text-right text-emerald-300 font-bold">+{p.quantity.toLocaleString()} {p.unit}</td>
                    <td className="py-3 px-4 text-right text-slate-400">${p.unit_cost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-amber-300 font-bold">${p.total_cost.toLocaleString()}</td>
                    <td className="py-3 px-4 font-sans text-slate-300 font-medium">{p.base_name}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">{p.supplier}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">
                      {p.recorded_by_rank ? `${p.recorded_by_rank} ` : ''}{p.recorded_by_name || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Purchase Order */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Asset Purchase"
        subtitle="Submit a defense procurement order to increase installation inventory"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Base Selection (Locked for non-admin) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Destination Military Base
            </label>
            <select
              value={formBaseId}
              disabled={role !== 'ADMIN'}
              onChange={(e) => setFormBaseId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-60"
            >
              {bases.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) - {b.location}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Item Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Equipment / Asset Model
            </label>
            <select
              value={formEquipmentId}
              onChange={(e) => handleEquipmentChange(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {equipmentTypes.map(eq => (
                <option key={eq.id} value={eq.id}>
                  [{eq.category}] {eq.name} ({eq.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Quantity Acquired
              </label>
              <input
                type="number"
                min="1"
                required
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Unit Cost (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formUnitCost}
                onChange={(e) => setFormUnitCost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Estimated Total Display */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 font-sans">Calculated Total Order Cost:</span>
            <span className="text-amber-400 font-bold text-sm">
              ${((Number(formQuantity) || 0) * (Number(formUnitCost) || 0)).toLocaleString()}
            </span>
          </div>

          {/* Supplier & Order Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Defense Contractor / Supplier
              </label>
              <input
                type="text"
                required
                value={formSupplier}
                onChange={(e) => setFormSupplier(e.target.value)}
                placeholder="e.g. Colt Defense LLC"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Purchase Order #
              </label>
              <input
                type="text"
                required
                value={formOrderNumber}
                onChange={(e) => setFormOrderNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Order Memo / Notes
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Batch info or mission authorization..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition shadow shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Authorize Purchase'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
