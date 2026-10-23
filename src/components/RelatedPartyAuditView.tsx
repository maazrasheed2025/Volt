// src/components/RelatedPartyAuditView.tsx
import React from 'react';
import { AuditLog, Employee, Shareholder, EmployeeAdvance } from '../types.ts';
import { formatPaiseToRupees } from '../utils/calculations.ts';
import {
  ShieldAlert,
  History,
  FileCheck,
  Scale,
  Building,
  UserCheck,
} from 'lucide-react';

interface RelatedPartyAuditViewProps {
  auditLogs: AuditLog[];
  employees: Employee[];
  shareholders: Shareholder[];
  advances: EmployeeAdvance[];
}

export const RelatedPartyAuditView: React.FC<RelatedPartyAuditViewProps> = ({
  auditLogs,
  employees,
  shareholders,
  advances,
}) => {
  // Directors & Shareholders List
  const keyManagementPersonnel = employees.filter(
    (e) => e.category === 'Director' || e.isShareholder
  );

  const relatedAdvances = advances.filter((a) => a.isRelatedParty);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Companies Act 2013: Section 188 Related Party Register & Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Statutory disclosure requirements for Key Management Personnel (KMP), promoter remuneration, advances, and immutable audit logs.
          </p>
        </div>

        <span className="px-3 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 text-xs font-semibold">
          Section 188 & CARO 2020 Compliant
        </span>
      </div>

      {/* Statutory Guidelines Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
            <Scale className="w-4 h-4" /> Section 188 Contracts & Advances
          </div>
          <p className="text-slate-400 leading-relaxed">
            All loans, advances, or remunerative contracts with Directors or their relatives require Audit Committee prior approval and Board Resolution disclosure.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
            <UserCheck className="w-4 h-4" /> Section 197 Ceiling Check
          </div>
          <p className="text-slate-400 leading-relaxed">
            Total managerial remuneration payable by a company to its directors shall not exceed 11% of the gross/net profits of that financial year.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
            <Building className="w-4 h-4" /> Rule 3(4) Dividend Flexibility
          </div>
          <p className="text-slate-400 leading-relaxed">
            Articles of Association (AOA) allow differential dividend distribution across share classes independently of standard pro-rata equity holdings.
          </p>
        </div>
      </div>

      {/* Two columns: KMP Register + Related Party Advances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KMP Register */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            Key Management Personnel & Promoters Register
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-2">Designation</th>
                  <th className="py-2.5 px-2 text-center">Equity %</th>
                  <th className="py-2.5 px-2 text-center">Dividend %</th>
                  <th className="py-2.5 px-3 text-right">Monthly Remuneration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-200">
                {keyManagementPersonnel.map((kmp) => (
                  <tr key={kmp.id} className="hover:bg-slate-700/30">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{kmp.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{kmp.employeeId}</div>
                    </td>
                    <td className="py-2.5 px-2">{kmp.category}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{kmp.shareholdingPercent}%</td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-300">
                      {kmp.dividendPercent}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                      {formatPaiseToRupees(kmp.monthlySalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flagged Advances to Related Parties */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Active Related Party Advances (Section 188)
          </h3>
          {relatedAdvances.length === 0 ? (
            <div className="text-slate-400 text-xs py-6 text-center">
              No related party advances currently outstanding.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Director / KMP</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-slate-200">
                  {relatedAdvances.map((ra) => {
                    const emp = employees.find((e) => e.employeeId === ra.employeeId);
                    return (
                      <tr key={ra.id} className="hover:bg-slate-700/30">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{ra.dateGiven}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{emp?.name || ra.employeeId}</div>
                          <div className="text-[10px] text-rose-400">Director / Shareholder</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          {formatPaiseToRupees(ra.amount)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ra.status === 'Outstanding'
                                ? 'bg-rose-900/60 text-rose-300'
                                : 'bg-emerald-900/60 text-emerald-300'
                            }`}
                          >
                            {ra.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{ra.purpose}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Immutable Financial Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              Captures all mutations to employee salaries, category bonus rates, dividend quotas, and advances.
            </p>
          </div>
          <span className="text-xs text-slate-400">{auditLogs.length} logged events</span>
        </div>

        <div className="overflow-x-auto max-h-96 scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Entity / Target</th>
                <th className="py-2.5 px-3">Action / Field</th>
                <th className="py-2.5 px-3">Old Value</th>
                <th className="py-2.5 px-3">New Value</th>
                <th className="py-2.5 px-3">Authorized By</th>
                <th className="py-2.5 px-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-700/30">
                  <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {log.changedAt ? new Date(log.changedAt).toLocaleString() : 'Recent'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-white">{log.entityType}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{log.entityId}</span>
                  </td>
                  <td className="py-2.5 px-3 text-indigo-300 font-mono">{log.fieldChanged}</td>
                  <td className="py-2.5 px-3 text-rose-300 font-mono">{log.oldValue || '—'}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-mono">{log.newValue}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.changedBy}</td>
                  <td className="py-2.5 px-3 text-slate-400 max-w-xs">{log.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
