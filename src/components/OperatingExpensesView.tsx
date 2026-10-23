// src/components/OperatingExpensesView.tsx
import React, { useState } from 'react';
import { Expense, ExpenseBudget } from '../types.ts';
import { EXPENSE_CATEGORIES } from '../data/categories.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
  calculateBudgetVariance,
} from '../utils/calculations.ts';
import {
  Layers,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Upload,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface OperatingExpensesViewProps {
  expenses: Expense[];
  expenseBudgets: ExpenseBudget[];
  currentPhase: number;
  onAddExpense: (expense: Partial<Expense>) => Promise<void>;
  userRole: string;
}

export const OperatingExpensesView: React.FC<OperatingExpensesViewProps> = ({
  expenses,
  expenseBudgets,
  currentPhase,
  onAddExpense,
  userRole,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchVendor, setSearchVendor] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State
  const [formCategory, setFormCategory] = useState<string>(EXPENSE_CATEGORIES[0].name);
  const [formSubCategory, setFormSubCategory] = useState<string>(EXPENSE_CATEGORIES[0].subCategories[0]);
  const [formAmountRupees, setFormAmountRupees] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formVendor, setFormVendor] = useState<string>('');
  const [formBillRef, setFormBillRef] = useState<string>('');
  const [formGstRupees, setFormGstRupees] = useState<string>('');
  const [formReceiptName, setFormReceiptName] = useState<string>('');

  // Map subcategories based on chosen category
  const activeSubCategories =
    EXPENSE_CATEGORIES.find((c) => c.name === formCategory)?.subCategories || [];

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesPhase = currentPhase === 1 ? e.phase === 1 : true;
    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesVendor =
      e.vendorName.toLowerCase().includes(searchVendor.toLowerCase()) ||
      e.billReferenceNumber.toLowerCase().includes(searchVendor.toLowerCase());
    return matchesPhase && matchesCat && matchesVendor;
  });

  // Calculate actuals by category & check against budgets
  const categoryActuals: Record<string, bigint> = {};
  const categoryBudgets: Record<string, bigint> = {};

  expenseBudgets.forEach((b) => {
    categoryBudgets[b.category] = (categoryBudgets[b.category] || 0n) + BigInt(b.budgetedAmount || 0);
  });

  expenses.forEach((e) => {
    if (currentPhase === 1 ? e.phase === 1 : true) {
      categoryActuals[e.category] = (categoryActuals[e.category] || 0n) + BigInt(e.amount || 0);
    }
  });

  // Calculate total opex
  const totalFilteredOpex = filteredExpenses.reduce(
    (acc, curr) => acc + BigInt(curr.amount || 0),
    0n
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(formAmountRupees);
    const gstPaise = rupeesToPaise(formGstRupees || '0');

    await onAddExpense({
      category: formCategory,
      subCategory: formSubCategory,
      amount: amountPaise,
      date: formDate,
      phase: currentPhase,
      vendorName: formVendor,
      billReferenceNumber: formBillRef,
      gstAmount: gstPaise,
      paymentStatus: 'paid',
      receiptUrl: formReceiptName ? `receipts/${formReceiptName}` : undefined,
    });

    setIsAddModalOpen(false);
    setFormAmountRupees('');
    setFormVendor('');
    setFormBillRef('');
    setFormGstRupees('');
    setFormReceiptName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Operating Expenses (Opex) & Budget Variance Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hierarchical 12-category expense management with auto-flagging on &gt;±10% budget variance and tiered approval routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="log-expense-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Expense</span>
          </button>
        </div>
      </div>

      {/* Variance Alert Banner if any category exceeds +- 10% */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Budget vs. Actual Variance Watchlist (Auto-Flagged &gt; ±10%)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {EXPENSE_CATEGORIES.slice(0, 6).map((cat) => {
            const actual = categoryActuals[cat.name] || 0n;
            const budgeted = categoryBudgets[cat.name] || 0n;
            const variance = calculateBudgetVariance(actual.toString(), budgeted.toString());

            return (
              <div
                key={cat.name}
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  variance.isFlagged
                    ? 'bg-amber-950/20 border-amber-800/80 text-amber-200'
                    : 'bg-slate-900/60 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-white truncate max-w-[170px]">{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      variance.isFlagged
                        ? variance.isOverBudget
                          ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                          : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {variance.variancePercent > 0 ? '+' : ''}
                    {variance.variancePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-2 text-[11px]">
                  <span className="text-slate-400">
                    Actual: <strong className="text-white">{formatPaiseToRupees(actual)}</strong>
                  </span>
                  <span className="text-slate-400">
                    Budget: <strong className="text-slate-300">{formatPaiseToRupees(budgeted)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor or invoice #..."
              value={searchVendor}
              onChange={(e) => setSearchVendor(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[220px]"
            >
              <option value="ALL">All 12 Expense Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-slate-300 font-semibold">
          Filtered Opex Total: <span className="text-indigo-400">{formatPaiseToRupees(totalFilteredOpex)}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Date & ID</th>
                <th className="py-3 px-3">Category & Sub-Category</th>
                <th className="py-3 px-3">Vendor & Invoice Ref</th>
                <th className="py-3 px-3 text-right">Pre-Tax Amount</th>
                <th className="py-3 px-3 text-right">GST (Paise)</th>
                <th className="py-3 px-3 text-right font-bold text-white">Total Amount</th>
                <th className="py-3 px-3">Approval Routing Tier</th>
                <th className="py-3 px-2 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-700/30 transition">
                  <td className="py-3 px-3 font-mono">
                    <div className="text-white font-medium">{exp.date}</div>
                    <div className="text-[10px] text-slate-400">{exp.expenseId}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{exp.category}</div>
                    <div className="text-[11px] text-indigo-400">{exp.subCategory}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-white font-medium">{exp.vendorName}</div>
                    <div className="text-[10px] font-mono text-slate-400">Ref: {exp.billReferenceNumber}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {formatPaiseToRupees(BigInt(exp.amount) - BigInt(exp.gstAmount || 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {formatPaiseToRupees(exp.gstAmount || 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    {formatPaiseToRupees(exp.amount)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-200 border border-slate-600">
                        {exp.approvalRequiredLevel}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={exp.approvedBy}>
                        ({exp.approvedBy})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {exp.receiptUrl ? (
                      <span className="inline-flex items-center text-indigo-400 hover:text-indigo-300 cursor-pointer" title="Receipt attached">
                        <FileText className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal with Configurable Approval Workflow */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-1">
              Book Expense Entry & Trigger Routing
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Approval thresholds: &lt;₹10k Auto-Approved, ₹10k–₹50k Dept Head + Finance, ₹50k–₹200k Director, &gt;₹200k Board.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setFormCategory(newCat);
                      const sub = EXPENSE_CATEGORIES.find((c) => c.name === newCat)?.subCategories[0] || '';
                      setFormSubCategory(sub);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Sub-Category</label>
                  <select
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    {activeSubCategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Gross Bill Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmountRupees}
                    onChange={(e) => setFormAmountRupees(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                    placeholder="e.g. 18500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GST Amount Included (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formGstRupees}
                    onChange={(e) => setFormGstRupees(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                    placeholder="e.g. 3330"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Vendor / Payee Name</label>
                  <input
                    type="text"
                    required
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    placeholder="e.g. Maharashtra State Electricity"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Bill / Invoice Reference #</label>
                  <input
                    type="text"
                    required
                    value={formBillRef}
                    onChange={(e) => setFormBillRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                    placeholder="e.g. INV-2026-99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Attach Receipt / Bill (PDF or IMG)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormReceiptName(file.name);
                      }}
                      className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-700">
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
                  Confirm & Route Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
