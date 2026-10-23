// src/components/LoansFinancingView.tsx
import React, { useState } from 'react';
import { Loan } from '../types.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
  calculateAmortizationSchedule,
} from '../utils/calculations.ts';
import {
  Landmark,
  Plus,
  TrendingDown,
  Calendar,
  Percent,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface LoansFinancingViewProps {
  loans: Loan[];
  onAddLoan: (loan: Partial<Loan>) => Promise<void>;
  userRole: string;
}

export const LoansFinancingView: React.FC<LoansFinancingViewProps> = ({
  loans,
  onAddLoan,
  userRole,
}) => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(loans[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formLoanId, setFormLoanId] = useState('');
  const [formLender, setFormLender] = useState('');
  const [formPurpose, setFormPurpose] = useState('Factory Construction');
  const [formPrincipalRupees, setFormPrincipalRupees] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('9.5');
  const [formTenureMonths, setFormTenureMonths] = useState('84');
  const [formEmiRupees, setFormEmiRupees] = useState('');
  const [formDisbursalDate, setFormDisbursalDate] = useState(new Date().toISOString().split('T')[0]);

  // Aggregates
  let totalPrincipalSanctioned = 0n;
  let totalOutstanding = 0n;
  let totalMonthlyEMI = 0n;

  loans.forEach((l) => {
    totalPrincipalSanctioned += BigInt(l.principalAmount || 0);
    totalOutstanding += BigInt(l.outstandingBalance || 0);
    totalMonthlyEMI += BigInt(l.emiAmount || 0);
  });

  const amortization = selectedLoan
    ? calculateAmortizationSchedule({
        principalPaise: selectedLoan.principalAmount,
        annualInterestRatePercent: parseFloat(selectedLoan.interestRate) || 9.5,
        tenureMonths: selectedLoan.tenureMonths,
        emiPaise: selectedLoan.emiAmount,
        startDateStr: selectedLoan.disbursementDate,
      })
    : [];

  const handleOpenAdd = () => {
    setFormLoanId(`LOAN-${Date.now().toString().slice(-4)}`);
    setFormLender('State Bank of India');
    setFormPurpose('Factory Construction');
    setFormPrincipalRupees('25000000');
    setFormInterestRate('9.50');
    setFormTenureMonths('84');
    setFormEmiRupees('410000');
    setFormDisbursalDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  const handleAddLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const principalPaise = rupeesToPaise(formPrincipalRupees);
    const emiPaise = rupeesToPaise(formEmiRupees);

    await onAddLoan({
      loanId: formLoanId,
      lender: formLender,
      purpose: formPurpose,
      principalAmount: principalPaise,
      interestRate: formInterestRate,
      tenureMonths: parseInt(formTenureMonths),
      emiAmount: emiPaise,
      disbursementDate: formDisbursalDate,
      outstandingBalance: principalPaise,
      principalRepaid: '0',
      interestPaidToDate: '0',
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-400" />
            Loans & Financing Dashboard (Term Loans & Debt Service)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking bank debt facilities, reducing-balance EMI schedules, monthly interest costs, and covenant ratios.
          </p>
        </div>

        {(userRole === 'Admin/Owner' || userRole === 'Finance/CA') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Loan Facility</span>
          </button>
        )}
      </div>

      {/* Debt Portfolio KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Total Sanctioned Principal:</span>
          <div className="text-xl font-bold text-white mt-1">
            {formatPaiseToRupees(totalPrincipalSanctioned)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{loans.length} active credit facilities</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Current Outstanding Debt:</span>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {formatPaiseToRupees(totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Reducing balance as per bank statements</div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Monthly Debt Service (EMI):</span>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatPaiseToRupees(totalMonthlyEMI)} / month
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Annualized: {formatPaiseToRupees(totalMonthlyEMI * 12n)}</div>
        </div>
      </div>

      {/* Facilities Cards Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loans.map((loan) => {
          const isSelected = selectedLoan?.id === loan.id;
          return (
            <div
              key={loan.id}
              onClick={() => setSelectedLoan(loan)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-white">{loan.lender}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-200">
                  {loan.purpose}
                </span>
              </div>
              <div className="text-lg font-bold text-indigo-300 mt-2">
                {formatPaiseToRupees(loan.principalAmount)}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700/60 flex justify-between text-xs text-slate-400">
                <span>Rate: <strong className="text-slate-200">{loan.interestRate}%</strong></span>
                <span>Tenure: <strong className="text-slate-200">{loan.tenureMonths} mos</strong></span>
                <span>EMI: <strong className="text-emerald-400">{formatPaiseToRupees(loan.emiAmount)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Amortization Schedule Table */}
      {selectedLoan && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                Amortization Schedule: {selectedLoan.lender} ({selectedLoan.purpose})
              </h3>
              <p className="text-xs text-slate-400">
                Standard reducing balance loan schedule showing monthly breakdown of Principal vs. Interest paid.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700">
              Disbursed: {selectedLoan.disbursementDate}
            </span>
          </div>

          <div className="overflow-x-auto max-h-96 scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 text-center">Month #</th>
                  <th className="py-2.5 px-3 text-right">Opening Balance</th>
                  <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                  <th className="py-2.5 px-3 text-right">Interest Paid</th>
                  <th className="py-2.5 px-3 text-right">Principal Repaid</th>
                  <th className="py-2.5 px-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-200">
                {amortization.slice(0, 36).map((row: any) => (
                  <tr key={row.month} className="hover:bg-slate-700/30 font-mono">
                    <td className="py-2.5 px-3 text-center text-slate-400">{row.month}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatPaiseToRupees(row.openingBalancePaise)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white font-semibold">
                      {formatPaiseToRupees(row.emiPaise)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-400">
                      {formatPaiseToRupees(row.interestPaise)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      {formatPaiseToRupees(row.principalPaise)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-300 font-semibold">
                      {formatPaiseToRupees(row.closingBalancePaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Loan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-4">Add Bank Loan Facility</h3>
            <form onSubmit={handleAddLoanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Loan Identifier</label>
                  <input
                    type="text"
                    required
                    value={formLoanId}
                    onChange={(e) => setFormLoanId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Lender Bank Name</label>
                  <input
                    type="text"
                    required
                    value={formLender}
                    onChange={(e) => setFormLender(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Purpose / Facility</label>
                <input
                  type="text"
                  required
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Sanctioned Principal (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={formPrincipalRupees}
                    onChange={(e) => setFormPrincipalRupees(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={formInterestRate}
                    onChange={(e) => setFormInterestRate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    value={formTenureMonths}
                    onChange={(e) => setFormTenureMonths(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={formEmiRupees}
                    onChange={(e) => setFormEmiRupees(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Disbursement Date</label>
                <input
                  type="date"
                  required
                  value={formDisbursalDate}
                  onChange={(e) => setFormDisbursalDate(e.target.value)}
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
                  Save Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
