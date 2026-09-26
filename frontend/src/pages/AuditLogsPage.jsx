import React, { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FilterBar } from '../components/FilterBar';
import { RoleBadge } from '../components/Badge';
import { ScrollText, ShieldCheck, Activity, Info } from 'lucide-react';

export function AuditLogsPage() {
  const { startDate, endDate, baseId } = useFilter();
  const { role } = useAuth();

  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAuditLogs({
      action: actionFilter,
      entityType: entityFilter,
      baseId,
      startDate,
      endDate
    })
      .then(res => {
        if (res.success) {
          setLogs(res.logs);
          setTotalCount(res.total);
        }
      })
      .catch(err => console.error('Failed to load audit logs:', err))
      .finally(() => setLoading(false));
  }, [actionFilter, entityFilter, baseId, startDate, endDate]);

  const actionStyles = {
    PURCHASE_CREATED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    TRANSFER_INITIATED: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    TRANSFER_STATUS_UPDATED: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    ASSET_ASSIGNED: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    ASSET_RETURNED: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    ASSET_EXPENDED: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    USER_LOGIN_SUCCESS: 'text-slate-300 bg-slate-800 border-slate-700',
    USER_LOGIN_FAILED: 'text-rose-400 bg-rose-950 border-rose-800 animate-pulse font-bold',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-amber-400" />
          Audit Trail & Transaction Security Logs
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Non-repudiation ledger capturing all critical API mutations, defense procurements, transfers, and clearances.
        </p>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Action and Entity Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-semibold uppercase tracking-wider">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Audit Filters:</span>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="all">All Mutation Actions</option>
          <option value="PURCHASE_CREATED">Purchases Created</option>
          <option value="TRANSFER_INITIATED">Transfers Dispatched</option>
          <option value="TRANSFER_STATUS_UPDATED">Transfer Status Changed</option>
          <option value="ASSET_ASSIGNED">Personnel Checked-Out</option>
          <option value="ASSET_RETURNED">Armory Returned</option>
          <option value="ASSET_EXPENDED">Matériel Expended</option>
          <option value="USER_LOGIN_SUCCESS">Login Success</option>
          <option value="USER_LOGIN_FAILED">Login Failed (Security Alert)</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="all">All Entity Domains</option>
          <option value="PURCHASE">Purchases</option>
          <option value="TRANSFER">Transfers</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="EXPENDITURE">Expenditures</option>
          <option value="AUTH">Authentication</option>
        </select>

        <div className="ml-auto text-xs text-slate-400 font-mono">
          Showing <strong className="text-slate-200">{logs.length}</strong> of {totalCount} records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Querying audit trail database...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No audit records match the selected telemetry criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Officer / User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Installation</th>
                  <th className="py-3 px-4">Payload Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map(log => {
                  let parsedDetails = null;
                  try {
                    parsedDetails = JSON.parse(log.details);
                  } catch {
                    parsedDetails = log.details;
                  }

                  const badgeClass = actionStyles[log.action] || 'text-slate-400 bg-slate-800 border-slate-700';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${badgeClass}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400">{log.entity_type}</td>
                      <td className="py-3 px-4 font-sans text-slate-100 font-semibold">{log.user_name}</td>
                      <td className="py-3 px-4"><RoleBadge role={log.user_role} /></td>
                      <td className="py-3 px-4 font-sans text-slate-300">{log.base_name || 'Global HQ'}</td>
                      <td className="py-3 px-4 text-[11px] text-slate-300 font-mono max-w-sm truncate">
                        {typeof parsedDetails === 'object'
                          ? Object.entries(parsedDetails).map(([k, v]) => `${k}: ${v}`).join(' | ')
                          : String(parsedDetails)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{log.ip_address}</td>
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
