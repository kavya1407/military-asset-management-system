import React, { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FilterBar } from '../components/FilterBar';
import { Modal } from '../components/Modal';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/Badge';
import {
  ArrowLeftRight,
  PlusCircle,
  Search,
  AlertCircle,
  CheckCircle2,
  Check,
  Clock,
  ArrowRight
} from 'lucide-react';

export function TransfersPage() {
  const { startDate, endDate, equipmentTypeId, baseId, bases, equipmentTypes } = useFilter();
  const { role, user } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [originBaseId, setOriginBaseId] = useState('');
  const [destinationBaseId, setDestinationBaseId] = useState('');
  const [formEquipmentId, setFormEquipmentId] = useState('');
  const [formQuantity, setFormQuantity] = useState('5');
  const [formReason, setFormReason] = useState('Prepositioning for upcoming operational deployment');
  const [formPriority, setFormPriority] = useState('STANDARD');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const loadTransfers = () => {
    setLoading(true);
    api.getTransfers({
      startDate,
      endDate,
      equipmentTypeId,
      baseId,
      status: statusFilter,
      search
    })
      .then(res => {
        if (res.success) {
          setTransfers(res.transfers);
          setTotalCount(res.total);
        }
      })
      .catch(err => console.error('Failed to load transfers:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransfers();
  }, [startDate, endDate, equipmentTypeId, baseId, statusFilter, search]);

  const handleOpenModal = () => {
    setFormError(null);
    setFormSuccess(null);

    let defaultOrigin = '';
    if (role !== 'ADMIN' && user?.base_id) {
      defaultOrigin = String(user.base_id);
    } else if (bases.length > 0) {
      defaultOrigin = String(bases[0].id);
    }
    setOriginBaseId(defaultOrigin);

    // Pick a different destination base
    const otherBases = bases.filter(b => String(b.id) !== defaultOrigin);
    if (otherBases.length > 0) {
      setDestinationBaseId(String(otherBases[0].id));
    }

    if (equipmentTypes.length > 0) {
      setFormEquipmentId(String(equipmentTypes[0].id));
    }

    setFormQuantity('10');
    setFormPriority('STANDARD');
    setFormReason('Operational readiness inter-base transfer');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOriginChange = (origId) => {
    setOriginBaseId(origId);
    if (String(destinationBaseId) === String(origId)) {
      const other = bases.find(b => String(b.id) !== String(origId));
      if (other) setDestinationBaseId(String(other.id));
    }
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (originBaseId === destinationBaseId) {
      setFormError('Origin and destination base cannot be identical.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        origin_base_id: Number(originBaseId),
        destination_base_id: Number(destinationBaseId),
        equipment_type_id: Number(formEquipmentId),
        quantity: Number(formQuantity),
        transfer_date: formDate,
        reason: formReason,
        priority: formPriority,
        status: 'COMPLETED'
      };

      const res = await api.createTransfer(payload);
      if (res.success) {
        setFormSuccess(res.message);
        setTimeout(() => {
          setIsModalOpen(false);
          loadTransfers();
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

  const handleCompleteTransfer = async (transferId) => {
    try {
      const res = await api.updateTransferStatus(transferId, 'COMPLETED');
      if (res.success) {
        loadTransfers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-400" />
            Inter-Base Asset Transfers
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Track and authorize movement of military hardware, munitions, and gear between command bases.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Initiate Inter-Base Transfer</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Status Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {['all', 'COMPLETED', 'IN_TRANSIT', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'all' ? 'All Transfers' : st.replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking #, equipment, reason..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading transfer dispatches...
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No transfer movements found matching current parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Tracking #</th>
                  <th className="py-3 px-4">Equipment Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Origin Installation</th>
                  <th className="py-3 px-4">Destination Installation</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mission / Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{t.transfer_date}</td>
                    <td className="py-3 px-4 text-blue-400 font-bold">{t.tracking_number}</td>
                    <td className="py-3 px-4 font-sans text-slate-200 font-semibold">{t.equipment_name}</td>
                    <td className="py-3 px-4 font-sans"><CategoryBadge category={t.equipment_category} /></td>
                    <td className="py-3 px-4 text-right text-slate-100 font-bold">{t.quantity.toLocaleString()} {t.unit}</td>
                    <td className="py-3 px-4 font-sans text-rose-300 font-medium">
                      {t.origin_base_name} <span className="text-[10px] text-slate-500">({t.origin_base_code})</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-emerald-300 font-medium">
                      {t.destination_base_name} <span className="text-[10px] text-slate-500">({t.destination_base_code})</span>
                    </td>
                    <td className="py-3 px-4"><PriorityBadge priority={t.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                    <td className="py-3 px-4 font-sans text-slate-400 max-w-xs truncate" title={t.reason}>
                      {t.reason}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {t.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleCompleteTransfer(t.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] rounded transition flex items-center gap-1 ml-auto cursor-pointer"
                          title="Mark arrived and received at destination base"
                        >
                          <Check className="w-3 h-3" />
                          <span>Receive</span>
                        </button>
                      )}
                      {t.status === 'COMPLETED' && (
                        <span className="text-[10px] text-slate-500">Received</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Initiate Transfer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate Inter-Base Transfer Order"
        subtitle="Transfer defense hardware between authorized military installations"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitTransfer} className="space-y-4">
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

          {/* Origin and Destination Bases */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Origin Base (Departing)
              </label>
              <select
                value={originBaseId}
                disabled={role !== 'ADMIN'}
                onChange={(e) => handleOriginChange(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-60"
              >
                {bases.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Destination Base (Receiving)
              </label>
              <select
                value={destinationBaseId}
                onChange={(e) => setDestinationBaseId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {bases
                  .filter(b => String(b.id) !== String(originBaseId))
                  .map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Equipment Item Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Asset / Equipment to Transfer
            </label>
            <select
              value={formEquipmentId}
              onChange={(e) => setFormEquipmentId(e.target.value)}
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

          {/* Quantity & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Quantity to Dispatch
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
                Transfer Priority
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="ROUTINE">ROUTINE</option>
                <option value="STANDARD">STANDARD</option>
                <option value="URGENT">URGENT</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>
          </div>

          {/* Transfer Date & Mission Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Transfer Date
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
                Reason / Mission Code
              </label>
              <input
                type="text"
                required
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. NATO exercise prepositioning"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Dispatching...' : 'Dispatch Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
