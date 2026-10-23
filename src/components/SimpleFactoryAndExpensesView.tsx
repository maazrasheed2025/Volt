// src/components/SimpleFactoryAndExpensesView.tsx
import React, { useState } from 'react';
import { FactoryConstructionItem, Expense } from '../types.ts';
import { formatPaiseToRupees, rupeesToPaise } from '../utils/calculations.ts';
import {
  Building2,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  Wrench,
  Zap,
  Truck,
  FileText,
  Shield,
  Percent,
} from 'lucide-react';

interface SimpleFactoryAndExpensesViewProps {
  construction: FactoryConstructionItem[];
  expenses: Expense[];
  onUpdateConstruction: (id: number, updates: Partial<FactoryConstructionItem>) => Promise<void>;
  onAddExpense: (expense: Partial<Expense>) => Promise<void>;
  userRole?: string;
}

export const SimpleFactoryAndExpensesView: React.FC<SimpleFactoryAndExpensesViewProps> = ({
  construction,
  expenses,
  onUpdateConstruction,
  onAddExpense,
}) => {
  // Modal states
  const [isPayConstructionModalOpen, setIsPayConstructionModalOpen] = useState(false);
  const [selectedConstructionItem, setSelectedConstructionItem] = useState<FactoryConstructionItem | null>(null);
  const [additionalPaymentRupees, setAdditionalPaymentRupees] = useState('');
  const [updatedProgress, setUpdatedProgress] = useState(0);

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expCategory, setExpCategory] = useState('Manufacturing & Production');
  const [expSubCategory, setExpSubCategory] = useState('electricity');
  const [expAmountRupees, setExpAmountRupees] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expBillRef, setExpBillRef] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expPaymentStatus, setExpPaymentStatus] = useState<'paid' | 'pending'>('paid');

  const [filterType, setFilterType] = useState<'all' | 'paid' | 'pending'>('all');

  // Construction aggregates
  const totalBudgetPaise = construction.reduce((acc, c) => acc + BigInt(c.budgetedAmount || 0), 0n);
  const totalSpentPaise = construction.reduce((acc, c) => acc + BigInt(c.actualSpent || 0), 0n);
  const totalRemainingPaise = totalBudgetPaise > totalSpentPaise ? totalBudgetPaise - totalSpentPaise : 0n;
  const overallProgress = totalBudgetPaise > 0n ? Number((totalSpentPaise * 100n) / totalBudgetPaise) : 0;

  // Filter running expenses (exclude financier and payroll since they are in their own tabs)
  const generalExpenses = expenses.filter(
    (e) => e.category !== 'Financier Profit & Interest' && e.category !== 'Payroll & Salaries'
  );

  const displayedExpenses = generalExpenses.filter((e) => {
    if (filterType === 'all') return true;
    return e.paymentStatus === filterType;
  });

  const totalOpexPaid = generalExpenses
    .filter((e) => e.paymentStatus === 'paid')
    .reduce((acc, e) => acc + BigInt(e.amount || 0), 0n);

  const totalOpexPending = generalExpenses
    .filter((e) => e.paymentStatus === 'pending')
    .reduce((acc, e) => acc + BigInt(e.amount || 0), 0n);

  const handleOpenPayConstruction = (item: FactoryConstructionItem) => {
    setSelectedConstructionItem(item);
    setAdditionalPaymentRupees('');
    setUpdatedProgress(item.percentPhysicalComplete);
    setIsPayConstructionModalOpen(true);
  };

  const handleSaveConstructionPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConstructionItem) return;

    const currentSpent = BigInt(selectedConstructionItem.actualSpent || 0);
    const addedPaise = BigInt(rupeesToPaise(additionalPaymentRupees || '0'));
    const newSpent = (currentSpent + addedPaise).toString();

    await onUpdateConstruction(selectedConstructionItem.id, {
      actualSpent: newSpent,
      percentPhysicalComplete: updatedProgress,
    });

    setIsPayConstructionModalOpen(false);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const expId = `EXP-${Date.now().toString().slice(-6)}`;

    await onAddExpense({
      expenseId: expId,
      category: expCategory,
      subCategory: expSubCategory,
      amount: rupeesToPaise(expAmountRupees),
      vendorName: expVendor || 'Vendor',
      billReferenceNumber: expBillRef || `INV-${Date.now().toString().slice(-4)}`,
      date: expDate,
      paymentStatus: expPaymentStatus,
      phase: 1,
      gstAmount: '0',
      approvalStatus: 'Approved',
      approvedBy: 'Managing Director',
    });

    setIsAddExpenseModalOpen(false);
    setExpAmountRupees('');
    setExpVendor('');
    setExpBillRef('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Factory Construction & Operating Expenses
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Factory construction is a one-time deal to expand your business. Running expenses (power, rent, tools) are paid from profits.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-purple-900/30 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Running Expense</span>
        </button>
      </div>

      {/* PART 1: FACTORY CONSTRUCTION ONE-TIME DEAL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-500/20 text-purple-300 font-semibold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                One-Time Deal
              </span>
              <h3 className="text-lg font-bold text-white">
                Factory Building & Expansion Tracker
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Civil building shed, land, transformers, machinery test bench, and compliance.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Overall Construction Spent:</span>
            <span className="text-base font-bold text-purple-300 font-mono">
              {formatPaiseToRupees(totalSpentPaise.toString())} of {formatPaiseToRupees(totalBudgetPaise.toString())}
            </span>
          </div>
        </div>

        {/* 3 Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              Total Factory Budget (Agreed Deal)
            </span>
            <div className="text-2xl font-bold text-slate-100">
              {formatPaiseToRupees(totalBudgetPaise.toString())}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Pre-engineered shed, land & machinery installation
            </span>
          </div>

          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-400 block mb-1">
              Already Paid to Date
            </span>
            <div className="text-2xl font-bold text-emerald-300">
              {formatPaiseToRupees(totalSpentPaise.toString())}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Counted in "Money I Already Paid"
            </span>
          </div>

          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-400 block mb-1">
              Remaining Balance to Pay
            </span>
            <div className="text-2xl font-bold text-amber-300">
              {formatPaiseToRupees(totalRemainingPaise.toString())}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Counted in "Money I Have to Pay"
            </span>
          </div>
        </div>

        {/* Construction Components Table */}
        <div className="space-y-3">
          {construction.map((item) => {
            const budgeted = BigInt(item.budgetedAmount || 0);
            const spent = BigInt(item.actualSpent || 0);
            const remaining = budgeted > spent ? budgeted - spent : 0n;

            return (
              <div
                key={item.id}
                className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-slate-100 block">
                      {item.component}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Phase: {item.phaseOfConstruction} • Target Completion: {item.targetCompletionDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                      {item.percentPhysicalComplete}% Complete
                    </span>
                    <button
                      onClick={() => handleOpenPayConstruction(item)}
                      className="px-3 py-1.5 bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block">Budget:</span>
                    <span className="font-semibold text-slate-300">
                      {formatPaiseToRupees(item.budgetedAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Paid to Date:</span>
                    <span className="font-semibold text-emerald-400">
                      {formatPaiseToRupees(item.actualSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Remaining:</span>
                    <span className="font-semibold text-amber-300">
                      {formatPaiseToRupees(remaining.toString())}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${item.percentPhysicalComplete}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PART 2: RUNNING FACTORY OPERATING EXPENSES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              Workshop & Operational Expenses
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Power & electricity, factory lease, machinery tooling, freight & legal expenses.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {(['all', 'paid', 'pending'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  filterType === t
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-2">
          {displayedExpenses.map((exp) => {
            const isPaid = exp.paymentStatus === 'paid';
            return (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{exp.vendorName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                      {exp.category} • {exp.subCategory}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {exp.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ref: {exp.billReferenceNumber} • Date: {exp.date}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-100 text-sm font-mono block">
                    {formatPaiseToRupees(exp.amount)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isPaid ? 'Paid from Cash' : 'Pending payment'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: RECORD CONSTRUCTION PAYMENT */}
      {isPayConstructionModalOpen && selectedConstructionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Pay Towards Factory Construction
            </h3>
            <p className="text-xs text-slate-400">
              Component: <strong className="text-white">{selectedConstructionItem.component}</strong>
            </p>

            <form onSubmit={handleSaveConstructionPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Payment Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={additionalPaymentRupees}
                    onChange={(e) => setAdditionalPaymentRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Physical Completion (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={updatedProgress}
                  onChange={(e) => setUpdatedProgress(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPayConstructionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD OPERATING EXPENSE */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-400" />
              Record Workshop / Operating Expense
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Expense Category
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Manufacturing & Production">Manufacturing & Workshop</option>
                  <option value="Facility & Infrastructure">Facility / Factory Lease</option>
                  <option value="Transportation & Logistics">Transportation & Freight</option>
                  <option value="Administrative & Office">Administrative & Office</option>
                  <option value="Professional & Legal Fees">Legal & CA Fees</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Sub-category / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Workshop electricity bill, hydraulic oil, CNC tooling"
                  value={expSubCategory}
                  onChange={(e) => setExpSubCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 35000"
                      value={expAmountRupees}
                      onChange={(e) => setExpAmountRupees(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Status
                  </label>
                  <select
                    value={expPaymentStatus}
                    onChange={(e) => setExpPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="paid">Paid (Cash out)</option>
                    <option value="pending">Pending (To Pay)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MSEDCL, Industrial Spares Ltd"
                    value={expVendor}
                    onChange={(e) => setExpVendor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
