// src/components/EmployeeAdvancesView.tsx
import React, { useState } from 'react';
import { EmployeeAdvance, Employee } from '../types.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
} from '../utils/calculations.ts';
import {
  CreditCard,
  Plus,
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

interface EmployeeAdvancesViewProps {
  advances: EmployeeAdvance[];
  employees: Employee[];
  onAddAdvance: (adv: Partial<EmployeeAdvance>) => Promise<void>;
  onReconcileAdvance: (id: number, status: string, notes: string) => Promise<void>;
  userRole: string;
}

export const EmployeeAdvancesView: React.FC<EmployeeAdvancesViewProps> = ({
  advances,
  employees,
  onAddAdvance,
  onReconcileAdvance,
  userRole,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<EmployeeAdvance | null>(null);
  const [reconcileStatus, setReconcileStatus] = useState<string>('Adjusted Against Bills Submitted');
  const [reconcileNotes, setReconcileNotes] = useState<string>('');

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState<string>(employees[0]?.employeeId || '');
  const [formAmountRupees, setFormAmountRupees] = useState<string>('');
  const [formPurpose, setFormPurpose] = useState<string>('');
  const [formPaymentMode, setFormPaymentMode] = useState<'GPay' | 'Cash' | 'Bank' | 'Cheque'>('GPay');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Aggregates
  let totalOutstandingPaise = 0n;
  let totalRelatedPartyPaise = 0n;
  let totalReconciledPaise = 0n;

  advances.forEach((a) => {
    const amt = BigInt(a.amount || 0);
    if (a.status === 'Outstanding') {
      totalOutstandingPaise += amt;
      if (a.isRelatedParty) {
        totalRelatedPartyPaise += amt;
      }
    } else {
      totalReconciledPaise += amt;
    }
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === formEmployeeId);
    const isRelated = emp?.category === 'Director' || emp?.isShareholder || false;

    await onAddAdvance({
      advanceId: `ADV-${Date.now().toString().slice(-4)}`,
      employeeId: formEmployeeId,
      amount: rupeesToPaise(formAmountRupees),
      dateGiven: formDate,
      purpose: formPurpose,
      paymentMode: formPaymentMode,
      status: 'Outstanding',
      isRelatedParty: isRelated,
    });

    setIsAddModalOpen(false);
    setFormAmountRupees('');
    setFormPurpose('');
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvance) return;

    await onReconcileAdvance(selectedAdvance.id, reconcileStatus, reconcileNotes);
    setSelectedAdvance(null);
    setReconcileNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Employee Advances & Related-Party Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Separate accounting ledger tracking operational advances vs. statutory loans (Companies Act Sec 188 / 185 compliance).
          </p>
        </div>

        {(userRole === 'Admin/Owner' || userRole === 'Finance/CA') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Disburse New Advance</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Total Outstanding Advances:</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {formatPaiseToRupees(totalOutstandingPaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Subject to monthly salary deduction or voucher submission
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Related-Party Advance Exposure (Sec 188):</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            {formatPaiseToRupees(totalRelatedPartyPaise)}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">
            Auto-flagged for director / shareholder audit disclosure
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Settled / Reconciled to Date:</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {formatPaiseToRupees(totalReconciledPaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Against GST bills or salary recovery</div>
        </div>
      </div>

      {/* Advances Ledger Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Date Given</th>
                <th className="py-3 px-3">Employee / Payee</th>
                <th className="py-3 px-3">Purpose / Usage</th>
                <th className="py-3 px-2 text-center">Payment Mode</th>
                <th className="py-3 px-3 text-right font-bold text-white">Amount (Paise)</th>
                <th className="py-3 px-2 text-center">Related Party (Sec 188)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {advances.map((adv) => {
                const emp = employees.find((e) => e.employeeId === adv.employeeId);
                const isOutstanding = adv.status === 'Outstanding';

                return (
                  <tr key={adv.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{adv.dateGiven}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{emp?.name || adv.employeeId}</div>
                      <div className="text-[10px] text-slate-400">
                        {emp?.category} ({adv.employeeId})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs">{adv.purpose}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 font-mono">
                        {adv.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                      {formatPaiseToRupees(adv.amount)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {adv.isRelatedParty ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          Sec 188 KMP
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          isOutstanding
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {adv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isOutstanding && (userRole === 'Admin/Owner' || userRole === 'Finance/CA') && (
                        <button
                          onClick={() => setSelectedAdvance(adv)}
                          className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-medium transition"
                        >
                          Reconcile
                        </button>
                      )}
                      {!isOutstanding && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {adv.reconciledDate || 'Settled'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Advance Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-4">Disburse Employee Advance</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Select Employee / Beneficiary</label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>
                      {emp.name} ({emp.category} - {emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Advance Amount (₹)</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={formAmountRupees}
                    onChange={(e) => setFormAmountRupees(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                    placeholder="e.g. 25000"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Disbursement Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="GPay">GPay (UPI)</option>
                    <option value="Bank">Bank NEFT/RTGS</option>
                    <option value="Cash">Petty Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Purpose / Justification</label>
                <input
                  type="text"
                  required
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  placeholder="e.g. Prototype fabrication materials or field travel"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Disbursement Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {selectedAdvance && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-2">
              Reconcile Advance: {selectedAdvance.advanceId}
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Amount: <strong className="text-white">{formatPaiseToRupees(selectedAdvance.amount)}</strong> | Purpose: {selectedAdvance.purpose}
            </p>

            <form onSubmit={handleReconcileSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Reconciliation Method</label>
                <select
                  value={reconcileStatus}
                  onChange={(e) => setReconcileStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="Adjusted Against Bills Submitted">Adjusted Against Bills Submitted (GST Vouchers)</option>
                  <option value="Recovered from Salary">Recovered from Monthly Salary Slip</option>
                  <option value="Reconciled as Vendor Cost">Reconciled as Direct Vendor Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Supporting Reference / Notes</label>
                <textarea
                  rows={3}
                  required
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  placeholder="e.g. Bill #GST-4928 submitted on 2026-09-18, passed by Finance"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedAdvance(null)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Sign Off Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
