import React, { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FilterBar } from '../components/FilterBar';
import { Modal } from '../components/Modal';
import { StatusBadge, CategoryBadge } from '../components/Badge';
import {
  ClipboardList,
  Flame,
  PlusCircle,
  Search,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  Award
} from 'lucide-react';

export function AssignmentsPage() {
  const { startDate, endDate, equipmentTypeId, baseId, bases, equipmentTypes } = useFilter();
  const { role, user } = useAuth();

  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'expenditures'
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Assignment Modal & Form State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignBaseId, setAssignBaseId] = useState('');
  const [assignEquipmentId, setAssignEquipmentId] = useState('');
  const [personnelName, setPersonnelName] = useState('Sgt. David Miller');
  const [militaryId, setMilitaryId] = useState('US-9921045');
  const [personnelRank, setPersonnelRank] = useState('Sergeant');
  const [unit, setUnit] = useState('Bravo Company, 1st BCT');
  const [assignQuantity, setAssignQuantity] = useState('1');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Expenditure Modal & Form State
  const [isExpendModalOpen, setIsExpendModalOpen] = useState(false);
  const [expendBaseId, setExpendBaseId] = useState('');
  const [expendEquipmentId, setExpendEquipmentId] = useState('');
  const [expendQuantity, setExpendQuantity] = useState('10');
  const [expendType, setExpendType] = useState('TRAINING_EXERCISE');
  const [expendDate, setExpendDate] = useState(new Date().toISOString().split('T')[0]);
  const [missionRef, setMissionRef] = useState('EX-VALIANT-SHIELD-26');
  const [expendNotes, setExpendNotes] = useState('');

  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Return asset modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [returnNotes, setReturnNotes] = useState('Returned to armory in good condition');

  const isRestrictedRole = role === 'LOGISTICS_OFFICER';

  const loadData = () => {
    if (isRestrictedRole) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api.getAssignments({ baseId, equipmentTypeId, search }),
      api.getExpenditures({ startDate, endDate, baseId, equipmentTypeId, search })
    ])
      .then(([aRes, eRes]) => {
        if (aRes.success) setAssignments(aRes.assignments);
        if (eRes.success) setExpenditures(eRes.expenditures);
      })
      .catch(err => console.error('Failed to load assignments or expenditures:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, baseId, equipmentTypeId, search, role]);

  const handleOpenAssignModal = () => {
    setFormError(null);
    setFormSuccess(null);
    const defBase = role !== 'ADMIN' && user?.base_id ? String(user.base_id) : (bases[0]?.id ? String(bases[0].id) : '');
    setAssignBaseId(defBase);
    if (equipmentTypes.length > 0) setAssignEquipmentId(String(equipmentTypes[0].id));
    setAssignQuantity('1');
    setPersonnelName('Sgt. James Anderson');
    setMilitaryId(`US-${Math.floor(1000000 + Math.random() * 9000000)}`);
    setPersonnelRank('Sergeant');
    setUnit('Alpha Co, 2nd Platoon');
    setAssignDate(new Date().toISOString().split('T')[0]);
    setIsAssignModalOpen(true);
  };

  const handleOpenExpendModal = () => {
    setFormError(null);
    setFormSuccess(null);
    const defBase = role !== 'ADMIN' && user?.base_id ? String(user.base_id) : (bases[0]?.id ? String(bases[0].id) : '');
    setExpendBaseId(defBase);
    // Find ammunition or weapons as sensible default
    const defaultEq = equipmentTypes.find(e => e.category === 'Ammunition') || equipmentTypes[0];
    if (defaultEq) setExpendEquipmentId(String(defaultEq.id));
    setExpendQuantity('25');
    setExpendType('TRAINING_EXERCISE');
    setExpendDate(new Date().toISOString().split('T')[0]);
    setMissionRef(`EX-SHIELD-${new Date().getFullYear()}-01`);
    setIsExpendModalOpen(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createAssignment({
        base_id: Number(assignBaseId),
        equipment_type_id: Number(assignEquipmentId),
        personnel_name: personnelName,
        military_id: militaryId,
        rank: personnelRank,
        unit,
        quantity: Number(assignQuantity),
        assigned_date: assignDate,
        expected_return_date: expectedReturnDate || null,
        notes: assignNotes
      });

      if (res.success) {
        setFormSuccess(res.message);
        setTimeout(() => {
          setIsAssignModalOpen(false);
          loadData();
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

  const handleSubmitExpenditure = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createExpenditure({
        base_id: Number(expendBaseId),
        equipment_type_id: Number(expendEquipmentId),
        quantity: Number(expendQuantity),
        expenditure_type: expendType,
        date: expendDate,
        mission_reference: missionRef,
        notes: expendNotes
      });

      if (res.success) {
        setFormSuccess(res.message);
        setTimeout(() => {
          setIsExpendModalOpen(false);
          loadData();
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

  const handleReturnAsset = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      const res = await api.returnAssignment(selectedAssignment.id, returnNotes);
      if (res.success) {
        setIsReturnModalOpen(false);
        setSelectedAssignment(null);
        loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-purple-400" />
            Personnel Assignments & Expenditures
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Track gear checked out to individual soldiers and monitor combat/training munitions expended.
          </p>
        </div>

        {!isRestrictedRole && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAssignModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Asset</span>
            </button>
            <button
              onClick={handleOpenExpendModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>Log Expenditure</span>
            </button>
          </div>
        )}
      </div>

      {/* RBAC Notice Banner for Logistics Officer */}
      {isRestrictedRole && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider text-amber-400">
              RBAC Policy Restriction: Logistics Officer Scope
            </div>
            <p className="text-slate-300 leading-relaxed">
              Your military clearance level (<strong className="text-amber-300">LOGISTICS_OFFICER</strong>) grants authorization for procurement and inter-base asset transfers only. Personnel assignments and expenditure authorization require Base Commander or Admin authorization.
            </p>
            <div className="text-[11px] text-amber-400 font-mono mt-1">
              To test assignment and expenditure management, switch your role to Base Commander or Admin using the switcher above.
            </div>
          </div>
        </div>
      )}

      {/* Global Filter Bar */}
      <FilterBar />

      {/* View Switcher Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
              activeTab === 'assignments'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Personnel Assignments ({assignments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('expenditures')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
              activeTab === 'expenditures'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Munitions & Matériel Expended ({expenditures.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search soldier, military ID, unit, mission..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>

      {/* Tab Content 1: Assignments Table */}
      {activeTab === 'assignments' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading personnel gear allocations...
            </div>
          ) : isRestrictedRole ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Assignments are restricted from view under LOGISTICS_OFFICER clearance.
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No assignments found matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Assigned Date</th>
                    <th className="py-3 px-4">Personnel</th>
                    <th className="py-3 px-4">Military ID</th>
                    <th className="py-3 px-4">Unit / Squad</th>
                    <th className="py-3 px-4">Equipment Checked Out</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Base Station</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{a.assigned_date}</td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-100">
                        {a.rank} {a.personnel_name}
                      </td>
                      <td className="py-3 px-4 text-amber-400">{a.military_id}</td>
                      <td className="py-3 px-4 font-sans text-slate-300">{a.unit}</td>
                      <td className="py-3 px-4 font-sans text-slate-200 font-medium">{a.equipment_name}</td>
                      <td className="py-3 px-4 font-sans"><CategoryBadge category={a.equipment_category} /></td>
                      <td className="py-3 px-4 text-right text-blue-300 font-bold">{a.quantity.toLocaleString()} {a.unit}</td>
                      <td className="py-3 px-4 font-sans text-slate-400">{a.base_name}</td>
                      <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                      <td className="py-3 px-4 text-right font-sans">
                        {a.status === 'ASSIGNED' ? (
                          <button
                            onClick={() => {
                              setSelectedAssignment(a);
                              setIsReturnModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded transition flex items-center gap-1 ml-auto border border-slate-700 cursor-pointer"
                            title="Check-in and restore item to base armory"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>Return to Armory</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Returned ({a.return_date})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Expenditures Table */}
      {activeTab === 'expenditures' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading expenditure archives...
            </div>
          ) : isRestrictedRole ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Expenditures are restricted from view under LOGISTICS_OFFICER clearance.
            </div>
          ) : expenditures.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No expenditure records found matching current parameters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Mission Reference</th>
                    <th className="py-3 px-4">Expenditure Type</th>
                    <th className="py-3 px-4">Matériel Expended</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Quantity Consumed</th>
                    <th className="py-3 px-4">Base Installation</th>
                    <th className="py-3 px-4">Authorized By</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {expenditures.map(e => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{e.date}</td>
                      <td className="py-3 px-4 text-rose-400 font-bold">{e.mission_reference}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold">
                          {e.expenditure_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-200 font-semibold">{e.equipment_name}</td>
                      <td className="py-3 px-4 font-sans"><CategoryBadge category={e.equipment_category} /></td>
                      <td className="py-3 px-4 text-right text-rose-400 font-bold">-{e.quantity.toLocaleString()} {e.unit}</td>
                      <td className="py-3 px-4 font-sans text-slate-300">{e.base_name}</td>
                      <td className="py-3 px-4 font-sans text-slate-400">
                        {e.approved_by_rank ? `${e.approved_by_rank} ` : ''}{e.approved_by_name || 'Command'}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 truncate max-w-xs">{e.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Assign Matériel */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Check-Out Asset to Military Personnel"
        subtitle="Assign weapons, equipment, or radios to active duty personnel"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Base Installation
              </label>
              <select
                value={assignBaseId}
                disabled={role !== 'ADMIN'}
                onChange={(e) => setAssignBaseId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-60"
              >
                {bases.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Equipment / Matériel
              </label>
              <select
                value={assignEquipmentId}
                onChange={(e) => setAssignEquipmentId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {equipmentTypes.map(eq => (
                  <option key={eq.id} value={eq.id}>[{eq.category}] {eq.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Personnel Full Name
              </label>
              <input
                type="text"
                required
                value={personnelName}
                onChange={(e) => setPersonnelName(e.target.value)}
                placeholder="e.g. Sgt. John Ramirez"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Military ID / Service #
              </label>
              <input
                type="text"
                required
                value={militaryId}
                onChange={(e) => setMilitaryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Rank
              </label>
              <input
                type="text"
                required
                value={personnelRank}
                onChange={(e) => setPersonnelRank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Unit / Division
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={assignQuantity}
                onChange={(e) => setAssignQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Assigned Date
              </label>
              <input
                type="date"
                required
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition shadow shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Authorize Checkout'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Log Expenditure */}
      <Modal
        isOpen={isExpendModalOpen}
        onClose={() => setIsExpendModalOpen(false)}
        title="Record Asset Expenditure / Consumption"
        subtitle="Log munitions fired, gear expended in combat, or decommissioned matériel"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitExpenditure} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Base Installation
              </label>
              <select
                value={expendBaseId}
                disabled={role !== 'ADMIN'}
                onChange={(e) => setExpendBaseId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-60"
              >
                {bases.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Asset to Expend
              </label>
              <select
                value={expendEquipmentId}
                onChange={(e) => setExpendEquipmentId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {equipmentTypes.map(eq => (
                  <option key={eq.id} value={eq.id}>[{eq.category}] {eq.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Expenditure Type
              </label>
              <select
                value={expendType}
                onChange={(e) => setExpendType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="TRAINING_EXERCISE">TRAINING EXERCISE</option>
                <option value="COMBAT_OPERATION">COMBAT OPERATION</option>
                <option value="DECOMMISSIONED_DAMAGED">DECOMMISSIONED / DAMAGED</option>
                <option value="EXPIRED_CONSUMABLE">EXPIRED CONSUMABLE</option>
                <option value="ROUTINE_EXPENDITURE">ROUTINE EXPENDITURE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Quantity Expended
              </label>
              <input
                type="number"
                min="1"
                required
                value={expendQuantity}
                onChange={(e) => setExpendQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Expenditure Date
              </label>
              <input
                type="date"
                required
                value={expendDate}
                onChange={(e) => setExpendDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Mission / Operation Reference
              </label>
              <input
                type="text"
                required
                value={missionRef}
                onChange={(e) => setMissionRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Operational After-Action Notes
            </label>
            <input
              type="text"
              value={expendNotes}
              onChange={(e) => setExpendNotes(e.target.value)}
              placeholder="e.g. 150 soldiers completed live-fire range qualification"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsExpendModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Logging...' : 'Confirm Expenditure'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Return Asset to Armory */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Check-In Asset to Base Armory"
        subtitle="Return assigned hardware from personnel back to available base stock"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReturnAsset} className="space-y-4">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
            <div className="text-slate-400">Soldier: <strong className="text-slate-200">{selectedAssignment?.rank} {selectedAssignment?.personnel_name}</strong></div>
            <div className="text-slate-400">Item: <strong className="text-purple-400">{selectedAssignment?.equipment_name}</strong> ({selectedAssignment?.quantity} {selectedAssignment?.unit})</div>
            <div className="text-slate-400">Assigned Date: <span className="font-mono text-slate-300">{selectedAssignment?.assigned_date}</span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Check-In Notes / Condition Report
            </label>
            <textarea
              rows="3"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition shadow cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Accept Return into Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
