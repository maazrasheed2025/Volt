// src/components/SimpleFinancierView.tsx
import React, { useState } from 'react';
import { Loan, Expense } from '../types.ts';
import { formatPaiseToRupees, rupeesToPaise } from '../utils/calculations.ts';
import {
  HandCoins,
  Plus,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  ShieldCheck,
  Percent,
  Lock,
  Unlock,
  Trash2,
  Coins,
  Layers,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface SimpleFinancierViewProps {
  loans: Loan[];
  expenses: Expense[];
  isLoansActive?: boolean;
  onToggleLoansActive?: (active: boolean) => Promise<void>;
  onAddLoan: (loan: Partial<Loan>) => Promise<void>;
  onDeleteLoan?: (loanId: number) => Promise<void>;
  onRecordLoanPayment: (loanId: number, data: {
    profitPaidPaise: string;
    principalPaidPaise: string;
    paymentDate: string;
    notes?: string;
  }) => Promise<void>;
  onDeleteExpense?: (id: number) => Promise<void>;
  userRole?: string;
}

export const SimpleFinancierView: React.FC<SimpleFinancierViewProps> = ({
  loans,
  expenses,
  isLoansActive = false,
  onToggleLoansActive,
  onAddLoan,
  onDeleteLoan,
  onRecordLoanPayment,
  onDeleteExpense,
}) => {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(loans[0] || null);

  // In-app deletion confirmation states (replaces window.confirm)
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState<boolean>(false);
  const [isDeletingExpense, setIsDeletingExpense] = useState<boolean>(false);

  // Pay Form states
  const [profitAmountRupees, setProfitAmountRupees] = useState('');
  const [principalAmountRupees, setPrincipalAmountRupees] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Loan Form states
  const [lender, setLender] = useState('');
  const [principalRupees, setPrincipalRupees] = useState('');
  // Option to choose between Total Flat Profit vs Monthly EMI Profit
  const [repaymentType, setRepaymentType] = useState<'total' | 'emi'>('total');
  const [totalProfitRupees, setTotalProfitRupees] = useState('');
  const [monthlyProfitRupees, setMonthlyProfitRupees] = useState('');
  const [interestRate, setInterestRate] = useState('10.00');
  const [tenureMonths, setTenureMonths] = useState(12);
  const [purpose, setPurpose] = useState('Generator Prototype & Production Working Capital');

  // Aggregates
  const totalPrincipal = loans.reduce((acc, l) => acc + BigInt(l.principalAmount || 0), 0n);
  const totalOutstanding = loans.reduce((acc, l) => acc + BigInt(l.outstandingBalance || 0), 0n);
  const totalProfitPaid = loans.reduce((acc, l) => acc + BigInt(l.interestPaidToDate || 0), 0n);
  const totalPrincipalRepaid = loans.reduce((acc, l) => acc + BigInt(l.principalRepaid || 0), 0n);

  // Filter expenses that belong to financer profit
  const financerExpenses = expenses.filter(
    (e) => e.category === 'Financier Profit & Interest' || e.subCategory?.includes('Profit Share')
  );

  const handleOpenPay = (loan: Loan) => {
    setSelectedLoan(loan);
    // If loan has agreed monthly EMI profit, suggest that amount
    if (loan.repaymentType === 'emi' && loan.monthlyProfitPaise && BigInt(loan.monthlyProfitPaise) > 0n) {
      setProfitAmountRupees((Number(BigInt(loan.monthlyProfitPaise)) / 100).toString());
    } else if (loan.repaymentType === 'total' && loan.totalProfitPaise && BigInt(loan.totalProfitPaise) > 0n) {
      const remainingProfit = BigInt(loan.totalProfitPaise) - BigInt(loan.interestPaidToDate || 0);
      if (remainingProfit > 0n) {
        setProfitAmountRupees((Number(remainingProfit) / 100).toString());
      } else {
        setProfitAmountRupees('');
      }
    } else {
      setProfitAmountRupees('');
    }
    setPrincipalAmountRupees('');
    setPaymentNotes(`Profit distribution for ${loan.lender}`);
    setIsPayModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    await onRecordLoanPayment(selectedLoan.id, {
      profitPaidPaise: rupeesToPaise(profitAmountRupees || '0'),
      principalPaidPaise: rupeesToPaise(principalAmountRupees || '0'),
      paymentDate,
      notes: paymentNotes,
    });

    setIsPayModalOpen(false);
    setSuccessToast(`Payment recorded! Profit of ₹${Number(profitAmountRupees || 0).toLocaleString('en-IN')} entered into company expenses.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Recalculate rates/profits when user changes principal or profit amounts
  const handlePrincipalChange = (val: string) => {
    setPrincipalRupees(val);
    const p = parseFloat(val) || 0;
    if (p > 0) {
      if (repaymentType === 'total' && totalProfitRupees) {
        const tp = parseFloat(totalProfitRupees) || 0;
        setInterestRate(((tp / p) * 100).toFixed(2));
      } else if (repaymentType === 'emi' && monthlyProfitRupees && tenureMonths > 0) {
        const mp = parseFloat(monthlyProfitRupees) || 0;
        const annualizedRate = ((mp * 12) / p) * 100;
        setInterestRate(annualizedRate.toFixed(2));
      }
    }
  };

  const handleTotalProfitChange = (val: string) => {
    setTotalProfitRupees(val);
    const tp = parseFloat(val) || 0;
    const p = parseFloat(principalRupees) || 0;
    if (p > 0 && tp >= 0) {
      setInterestRate(((tp / p) * 100).toFixed(2));
    }
  };

  const handleMonthlyProfitChange = (val: string) => {
    setMonthlyProfitRupees(val);
    const mp = parseFloat(val) || 0;
    const p = parseFloat(principalRupees) || 0;
    if (p > 0 && mp >= 0) {
      const annualizedRate = ((mp * 12) / p) * 100;
      setInterestRate(annualizedRate.toFixed(2));
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const loanId = `LN-FIN-${Date.now().toString().slice(-4)}`;
    const principalPaise = rupeesToPaise(principalRupees || '0');

    let totalProfitPaise = '0';
    let monthlyProfitPaise = '0';

    if (repaymentType === 'total') {
      totalProfitPaise = rupeesToPaise(totalProfitRupees || '0');
      // If user left totalProfitRupees empty, calculate from interest rate
      if (BigInt(totalProfitPaise) === 0n && parseFloat(interestRate) > 0) {
        const pNum = parseFloat(principalRupees) || 0;
        const rNum = parseFloat(interestRate) || 0;
        totalProfitPaise = rupeesToPaise(Math.round((pNum * rNum) / 100).toString());
      }
    } else {
      // EMI Mode
      monthlyProfitPaise = rupeesToPaise(monthlyProfitRupees || '0');
      if (BigInt(monthlyProfitPaise) === 0n && parseFloat(interestRate) > 0) {
        const pNum = parseFloat(principalRupees) || 0;
        const rNum = parseFloat(interestRate) || 0;
        const annualProfit = (pNum * rNum) / 100;
        monthlyProfitPaise = rupeesToPaise(Math.round(annualProfit / 12).toString());
      }
      totalProfitPaise = (BigInt(monthlyProfitPaise) * BigInt(tenureMonths)).toString();
    }

    await onAddLoan({
      loanId,
      lender,
      principalAmount: principalPaise,
      outstandingBalance: principalPaise,
      principalRepaid: '0',
      interestPaidToDate: '0',
      interestRate: interestRate || '0.00',
      tenureMonths: Number(tenureMonths) || 12,
      disbursementDate: new Date().toISOString().split('T')[0],
      emiAmount: monthlyProfitPaise,
      purpose,
      repaymentType,
      totalProfitPaise,
      monthlyProfitPaise,
    });

    setIsAddLoanModalOpen(false);
    setLender('');
    setPrincipalRupees('');
    setTotalProfitRupees('');
    setMonthlyProfitRupees('');
    setSuccessToast(`Financier loan deal for "${lender}" added successfully!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDelete = (loan: Loan) => {
    setLoanToDelete(loan);
  };

  const handleConfirmDeleteLoan = async () => {
    if (!loanToDelete || !onDeleteLoan) return;
    setIsDeletingLoan(true);
    try {
      await onDeleteLoan(loanToDelete.id);
      setSuccessToast(`Loan deal "${loanToDelete.lender}" removed.`);
      setTimeout(() => setSuccessToast(null), 3000);
      setLoanToDelete(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDeletingLoan(false);
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete || !onDeleteExpense) return;
    setIsDeletingExpense(true);
    try {
      await onDeleteExpense(expenseToDelete.id);
      setSuccessToast(`Financier payment of ${formatPaiseToRupees(expenseToDelete.amount)} removed.`);
      setTimeout(() => setSuccessToast(null), 3000);
      setExpenseToDelete(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDeletingExpense(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Active / Inactive Status Notice */}
      {!isLoansActive ? (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block font-bold text-sm">Financier Loans Section is Currently PAUSED</strong>
              <span className="text-slate-300">
                You are in Prototype Stage with self-funded capital. No demo debt exists. You can activate this section anytime you take a real financier loan.
              </span>
            </div>
          </div>
          {onToggleLoansActive && (
            <button
              onClick={() => onToggleLoansActive(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0"
            >
              Activate Loans Section
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Loans Section is ACTIVE:</strong> Loan principal is added to inflow and EMIs/interest are counted in company expenses.
            </span>
          </div>
          {onToggleLoansActive && (
            <button
              onClick={() => onToggleLoansActive(false)}
              className="text-xs text-slate-400 hover:text-amber-300 underline"
            >
              Pause Loans
            </button>
          )}
        </div>
      )}

      {/* Header and Explanation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Financier Loans & Profit Payouts
                <span className="text-xs font-normal bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Total or Monthly EMI Profit
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Record financier loan deals with flexible profit options (Total Lump-sum profit OR Monthly EMI profit). When profit is paid, it automatically enters into company expenses for tax deduction.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setPrincipalRupees('');
            setTotalProfitRupees('');
            setMonthlyProfitRupees('');
            setLender('');
            setIsAddLoanModalOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-900/30 transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Financier Loan Deal</span>
        </button>
      </div>

      {/* Success notification */}
      {successToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Key Numbers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Capital Injected */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            Total Loan Capital Injected
          </span>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {formatPaiseToRupees(totalPrincipal.toString())}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {loans.length} active deal{loans.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* 2. Total Profit Paid Out */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4">
          <span className="text-xs font-semibold text-amber-400 block mb-1">
            Total Profit Paid to Financiers
          </span>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {formatPaiseToRupees(totalProfitPaid.toString())}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Tax-deducted operating expense
          </span>
        </div>

        {/* 3. Principal Repaid */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-emerald-400 block mb-1">
            Principal Repaid
          </span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatPaiseToRupees(totalPrincipalRepaid.toString())}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Original debt returned
          </span>
        </div>

        {/* 4. Outstanding Debt */}
        <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-4">
          <span className="text-xs font-semibold text-rose-300 block mb-1">
            Outstanding Debt (Principal Due)
          </span>
          <div className="text-2xl font-bold text-rose-300 font-mono">
            {formatPaiseToRupees(totalOutstanding.toString())}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Remaining liability
          </span>
        </div>
      </div>

      {/* Financer Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            Financier Facilities & Agreements ({loans.length})
          </h3>
          <span className="text-xs text-slate-400">
            {loans.length === 0 ? 'No active loans' : 'Choose Total Profit or EMI Profit for each deal'}
          </span>
        </div>

        {loans.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <HandCoins className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">No Loans Taken (Clean Prototype Slate)</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All demo loans have been removed as requested. Your app is 100% clean and reflects only your real prototype. Whenever you secure funding, click "+ Add Financier Loan Deal" to enter the amount, lender, and choose whether profit is returned in Total Lump-sum or monthly EMIs.
            </p>
            <button
              onClick={() => setIsAddLoanModalOpen(true)}
              className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition"
            >
              + Add First Financier Deal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => {
              const principal = BigInt(loan.principalAmount || 0);
              const repaid = BigInt(loan.principalRepaid || 0);
              const percentRepaid = principal > 0n ? Number((repaid * 100n) / principal) : 0;
              const isEmi = loan.repaymentType === 'emi';

              return (
                <div
                  key={loan.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {loan.loanId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isEmi
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {isEmi ? '⚡ Monthly EMI Profit' : '💰 Total Lump-Sum Profit'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1.5">{loan.lender}</h4>
                      <p className="text-xs text-slate-400">{loan.purpose || 'Working capital'}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {loan.interestRate}% Agreed Rate
                      </span>
                      {onDeleteLoan && (
                        <button
                          onClick={() => handleDelete(loan)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Loan Facility"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profit Structure Details */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Agreed Profit Structure:</span>
                      {isEmi ? (
                        <span className="font-bold text-sky-300 font-mono">
                          {formatPaiseToRupees(loan.monthlyProfitPaise || '0')} / month ({loan.tenureMonths} mo)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-300 font-mono">
                          {formatPaiseToRupees(loan.totalProfitPaise || '0')} Total Deal Profit
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Profit Paid to Date:</span>
                      <span className="font-bold text-amber-300 font-mono">
                        {formatPaiseToRupees(loan.interestPaidToDate || '0')} (Counted in Expenses)
                      </span>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Principal Loan:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {formatPaiseToRupees(loan.principalAmount, { compact: true })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Principal Repaid:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatPaiseToRupees(loan.principalRepaid, { compact: true })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Balance Debt:</span>
                      <span className="font-bold text-rose-300 font-mono">
                        {formatPaiseToRupees(loan.outstandingBalance, { compact: true })}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Principal Returned: {percentRepaid}%</span>
                      <span>Disbursed: {loan.disbursementDate}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percentRepaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[11px] text-slate-500">
                      Tenure: {loan.tenureMonths} Months
                    </span>
                    <button
                      onClick={() => handleOpenPay(loan)}
                      className="px-4 py-2 bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Pay Financier Profit / Debt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profit Payments History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Financier Profit Payments Recorded into Expenses ({financerExpenses.length})
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          All profit paid to financiers is automatically recorded into your expenses and deducted from taxable business profits under Indian tax rules.
        </p>

        {financerExpenses.length === 0 ? (
          <div className="p-6 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500">
            No financier profit payments recorded yet. Click "Pay Financier Profit / Debt" above to log a payout.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {financerExpenses.map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">{exp.vendorName}</span>
                  <span className="text-slate-500 ml-2">
                    {exp.subCategory} • Date: {exp.date}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="font-bold text-amber-400 font-mono">
                      {formatPaiseToRupees(exp.amount)}
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">
                      ✓ Counted as Expense
                    </span>
                  </div>
                  {onDeleteExpense && (
                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(exp)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Delete this payment record (if clicked by mistake)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: PAY FINANCIER PROFIT */}
      {isPayModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-amber-400" />
              Pay Profit / Principal to {selectedLoan.lender}
            </h3>
            <p className="text-xs text-slate-400">
              Entering profit paid here immediately routes into the company expenses ledger and reduces taxable business profit.
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Profit Paid to Financier (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 50000"
                    value={profitAmountRupees}
                    onChange={(e) => setProfitAmountRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold font-mono text-sm"
                  />
                </div>
                <span className="text-[10px] text-amber-300 mt-1 block">
                  * Automatically recorded as a deductible operating expense
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Principal Amount Returned (Optional) (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 100000"
                    value={principalAmountRupees}
                    onChange={(e) => setPrincipalAmountRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Reduces outstanding debt balance
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Notes / Reference
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition"
                >
                  Record Payment & Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW FINANCIER LOAN (TOTAL OR EMI PROFIT CHOICE) */}
      {isAddLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Financier Loan Deal
            </h3>
            <p className="text-xs text-slate-400">
              Fill the principal loan amount and choose whether profit will be paid as a Total Lump-sum or Monthly EMI.
            </p>

            <form onSubmit={handleCreateLoan} className="space-y-4 text-xs">
              {/* Lender Name */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Financier / Lender Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arif Bhai / Private Partner / Bank"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Principal Amount */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Principal Loan Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    required
                    step="1000"
                    placeholder="e.g. 1000000"
                    value={principalRupees}
                    onChange={(e) => handlePrincipalChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold font-mono text-sm"
                  />
                </div>
              </div>

              {/* REPAYMENT & PROFIT MODE SELECTOR */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <label className="text-slate-300 font-bold block">
                  Choose Profit Repayment Option:
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRepaymentType('total');
                      if (principalRupees && !totalProfitRupees) {
                        const p = parseFloat(principalRupees) || 0;
                        setTotalProfitRupees(Math.round(p * 0.1).toString());
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      repaymentType === 'total'
                        ? 'bg-amber-950/50 border-amber-500 text-white shadow-md ring-1 ring-amber-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300 mb-1">
                      <Coins className="w-3.5 h-3.5" /> Total Profit Deal
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Lump-sum agreed profit upon repayment or deal maturity
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRepaymentType('emi');
                      if (principalRupees && !monthlyProfitRupees) {
                        const p = parseFloat(principalRupees) || 0;
                        const annualProfit = p * 0.1;
                        setMonthlyProfitRupees(Math.round(annualProfit / 12).toString());
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      repaymentType === 'emi'
                        ? 'bg-sky-950/50 border-sky-500 text-white shadow-md ring-1 ring-sky-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 text-sky-300 mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Monthly EMI Profit
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      Fixed monthly profit payout / interest every month
                    </span>
                  </button>
                </div>

                {/* Conditional Fields Based on Repayment Option */}
                {repaymentType === 'total' ? (
                  <div className="pt-2 border-t border-slate-800/80 space-y-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Total Agreed Profit to Financier (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 150000"
                          value={totalProfitRupees}
                          onChange={(e) => handleTotalProfitChange(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-amber-300 focus:outline-none focus:border-amber-500 font-bold font-mono"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Example: On ₹10,00,000 principal, you return ₹1,50,000 total profit.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">
                          Calculated Profit %:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">
                          Target Tenure (Months):
                        </label>
                        <input
                          type="number"
                          value={tenureMonths}
                          onChange={(e) => setTenureMonths(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 space-y-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Monthly EMI Profit Amount (₹/mo)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 15000"
                          value={monthlyProfitRupees}
                          onChange={(e) => handleMonthlyProfitChange(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sky-300 focus:outline-none focus:border-sky-500 font-bold font-mono"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Example: Paying ₹15,000/month profit for {tenureMonths} months.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">
                          Tenure (Months):
                        </label>
                        <input
                          type="number"
                          value={tenureMonths}
                          onChange={(e) => setTenureMonths(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">
                          Annualized Rate (%):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Deal Summary Box */}
              {parseFloat(principalRupees) > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Principal Capital Received:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      ₹{Number(principalRupees).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Financier Profit Return:</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {repaymentType === 'total'
                        ? `₹${Number(totalProfitRupees || 0).toLocaleString('en-IN')} (Total)`
                        : `₹${Number(monthlyProfitRupees || 0).toLocaleString('en-IN')}/mo × ${tenureMonths} = ₹${(Number(monthlyProfitRupees || 0) * tenureMonths).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                    <span>Total Deal Outflow:</span>
                    <span className="text-emerald-400 font-mono">
                      ₹{(
                        Number(principalRupees || 0) +
                        (repaymentType === 'total'
                          ? Number(totalProfitRupees || 0)
                          : Number(monthlyProfitRupees || 0) * tenureMonths)
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Purpose / Agreement Notes
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddLoanModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition shadow-lg shadow-amber-900/40"
                >
                  Confirm & Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM LOAN DELETION */}
      {loanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Loan Facility?</h3>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <p>
                Are you sure you want to remove the loan facility from <strong>"{loanToDelete.lender}"</strong>?
              </p>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 font-mono">
                <span>Principal Amount:</span>
                <span className="text-amber-400 font-bold">{formatPaiseToRupees(loanToDelete.principalAmount)}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                This will delete the loan record and remove its debt balance from your financial books.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLoanToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingLoan}
                onClick={handleConfirmDeleteLoan}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingLoan ? 'Deleting...' : 'Yes, Delete Loan Facility'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM FINANCIER EXPENSE PAYMENT DELETION */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white">Remove Payment Record?</h3>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <p>
                Remove the recorded payment to <strong>"{expenseToDelete.vendorName}"</strong>?
              </p>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 font-mono">
                <span>Amount:</span>
                <span className="text-amber-400 font-bold">{formatPaiseToRupees(expenseToDelete.amount)}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                This will delete the expense voucher entry and restore the funds to your cash balance.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingExpense}
                onClick={handleConfirmDeleteExpense}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingExpense ? 'Removing...' : 'Yes, Delete Payment Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
