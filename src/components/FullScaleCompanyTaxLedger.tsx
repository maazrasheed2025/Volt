// src/components/FullScaleCompanyTaxLedger.tsx
import React, { useState, useMemo } from 'react';
import {
  ProductPrototype,
  BOMLineItem,
  Employee,
  Loan,
  Expense,
  FactoryConstructionItem,
  BusinessStage,
} from '../types.ts';
import {
  Building2,
  TrendingUp,
  Percent,
  Calculator,
  CheckCircle2,
  DollarSign,
  HandCoins,
  Users,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Crown,
  ChevronDown,
  Info,
  Scale,
  Receipt,
  Layers,
  Flame,
} from 'lucide-react';

interface FullScaleCompanyTaxLedgerProps {
  products: ProductPrototype[];
  bomLineItems: BOMLineItem[];
  employees: Employee[];
  loans: Loan[];
  expenses: Expense[];
  construction: FactoryConstructionItem[];
  currentStage: BusinessStage;
  onSwitchStage?: (stage: BusinessStage) => void;
  onAddExpense?: (exp: Partial<Expense>) => Promise<void>;
}

interface CustomExpenseEntry {
  id: string;
  name: string;
  amount: number;
}

export const FullScaleCompanyTaxLedger: React.FC<FullScaleCompanyTaxLedgerProps> = ({
  products,
  bomLineItems,
  employees,
  loans,
  expenses,
  construction,
  currentStage,
  onSwitchStage,
  onAddExpense,
}) => {
  // Commercial Volume & Revenue Inputs
  const [unitsSold, setUnitsSold] = useState<number>(30);
  const [sellingPriceRupees, setSellingPriceRupees] = useState<number>(650000); // ₹6.5 Lakhs per generator
  const [directCostPerUnitRupees, setDirectCostPerUnitRupees] = useState<number>(380000); // ₹3.8 Lakhs BOM cost at scale

  // Operating Deductible Expenses (Option to fill each entry)
  // 1. Staff Payroll
  const fullStaffMonthly = employees.reduce((acc, e) => acc + (Number(e.monthlySalary || 0) / 100), 0) || 521000;
  const [staffPayrollMonthly, setStaffPayrollMonthly] = useState<number>(521000); // 24 employees = ₹5.21L/mo
  const [payrollMonths, setPayrollMonths] = useState<number>(12); // Annual scale

  // 2. Financier Profit / Interest
  const totalLoanProfit = loans.reduce((acc, l) => {
    if (l.repaymentType === 'total' && l.totalProfitPaise) {
      return acc + (Number(l.totalProfitPaise) / 100);
    }
    if (l.repaymentType === 'emi' && l.monthlyProfitPaise) {
      return acc + ((Number(l.monthlyProfitPaise) / 100) * (l.tenureMonths || 12));
    }
    return acc + (Number(l.interestPaidToDate || 0) / 100);
  }, 0);
  const [financierProfitDeduction, setFinancierProfitDeduction] = useState<number>(totalLoanProfit > 0 ? totalLoanProfit : 350000);

  // 3. Factory Rent / Lease
  const [factoryRentMonthly, setFactoryRentMonthly] = useState<number>(150000); // ₹1.5 Lakh/mo shed lease
  const [factoryMonths, setFactoryMonths] = useState<number>(12);

  // 4. Utility / HT Electricity
  const [electricityUtilities, setElectricityUtilities] = useState<number>(360000); // ₹30,000/mo = ₹3.6 Lakh/year

  // 5. Logistics, Freight & Delivery
  const [logisticsFreight, setLogisticsFreight] = useState<number>(300000); // ₹10,000 per unit dispatch × 30

  // 6. Tooling, Machining, Lathe & Consumables
  const [machiningConsumables, setMachiningConsumables] = useState<number>(450000); // Laser cutting, welding gases

  // 7. Legal, Testing, CA & Statutory Licensing
  const [complianceAndCA, setComplianceAndCA] = useState<number>(200000); // Pollution NOC, ISO, CA fees

  // 8. Custom user-added expense entries
  const [customExpenses, setCustomExpenses] = useState<CustomExpenseEntry[]>([
    { id: 'c1', name: 'Canopy Powder Coating & Paint Line', amount: 180000 },
  ]);

  const [newCustomName, setNewCustomName] = useState<string>('');
  const [newCustomAmount, setNewCustomAmount] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);

  // TAX OPTION ACCORDING TO CURRENT INDIAN RULES
  // 1. Sec 115BAB (New Manufacturing): 15% Base + 10% Surcharge + 4% Cess = 17.16%
  // 2. Sec 115BAA (Domestic Companies Concessional): 22% Base + 10% Surcharge + 4% Cess = 25.17%
  // 3. Sec 115BA / MSME (< ₹400 Cr turnover): 25% Base + 4% Cess = 26.00%
  // 4. Partnership / LLP: 30% Base + 4% Cess = 31.20%
  // 5. Custom
  const [selectedRegimeKey, setSelectedRegimeKey] = useState<string>('115BAB_15');
  const [customTaxPercent, setCustomTaxPercent] = useState<number>(25);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const taxRegimes: Record<string, {
    key: string;
    label: string;
    section: string;
    baseRate: number;
    surcharge: number;
    cess: number;
    effectiveRate: number;
    applicableFor: string;
  }> = {
    '115BAB_15': {
      key: '115BAB_15',
      label: 'New Manufacturing Domestic Company',
      section: 'Section 115BAB',
      baseRate: 15,
      surcharge: 10,
      cess: 4,
      effectiveRate: 17.16,
      applicableFor: 'New manufacturing units incorporated for production of gensets/goods. Minimum 15% base tax rate.',
    },
    '115BAA_22': {
      key: '115BAA_22',
      label: 'Concessional Corporate Rate',
      section: 'Section 115BAA',
      baseRate: 22,
      surcharge: 10,
      cess: 4,
      effectiveRate: 25.17,
      applicableFor: 'Domestic manufacturing companies not opting for specific exemptions. Flat 22% base tax.',
    },
    'msme_25': {
      key: 'msme_25',
      label: 'Standard MSME / Small Company',
      section: 'Section 115BA',
      baseRate: 25,
      surcharge: 0,
      cess: 4,
      effectiveRate: 26.00,
      applicableFor: 'Indian small companies with gross turnover up to ₹400 Crores. 25% base + 4% cess.',
    },
    'partnership_30': {
      key: 'partnership_30',
      label: 'Partnership / LLP Firm Rate',
      section: 'Partnership Act',
      baseRate: 30,
      surcharge: 0,
      cess: 4,
      effectiveRate: 31.20,
      applicableFor: 'Standard registered partnership firms and Limited Liability Partnerships (LLP).',
    },
    'custom': {
      key: 'custom',
      label: 'Custom Tax Rate',
      section: 'Custom Rule',
      baseRate: customTaxPercent,
      surcharge: 0,
      cess: 0,
      effectiveRate: customTaxPercent,
      applicableFor: 'Manually specified business tax percentage.',
    },
  };

  const activeRegime = taxRegimes[selectedRegimeKey] || taxRegimes['115BAB_15'];
  const effectiveTaxRate = selectedRegimeKey === 'custom' ? customTaxPercent : activeRegime.effectiveRate;

  // Sync with real prototype database button
  const handleSyncWithDatabase = () => {
    // Prototype BOM parts cost from 64 real items:
    const protoBoms = bomLineItems.filter((b) => !b.isMiscategorized);
    const protoCost = protoBoms.reduce((acc, b) => acc + (Number(b.amount || 0) / 100), 0);
    if (protoCost > 0) {
      setDirectCostPerUnitRupees(Math.round(protoCost));
    }

    // Active payroll
    const activeStaffMonthly = employees
      .filter((e) => e.status === 'active')
      .reduce((acc, e) => acc + (Number(e.monthlySalary || 0) / 100), 0);
    if (activeStaffMonthly > 0) {
      setStaffPayrollMonthly(activeStaffMonthly);
    }

    // Financier profit from loans
    if (totalLoanProfit > 0) {
      setFinancierProfitDeduction(Math.round(totalLoanProfit));
    }

    setSaveStatus('Synced with real database prototype & ledger data!');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Add custom expense entry
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName || !newCustomAmount) return;
    const amt = parseFloat(newCustomAmount) || 0;
    if (amt <= 0) return;

    setCustomExpenses([
      ...customExpenses,
      {
        id: `c_${Date.now()}`,
        name: newCustomName,
        amount: amt,
      },
    ]);
    setNewCustomName('');
    setNewCustomAmount('');
    setIsAddingCustom(false);
  };

  const handleRemoveCustom = (id: string) => {
    setCustomExpenses(customExpenses.filter((c) => c.id !== id));
  };

  // Save selected tax settings to backend
  const handleSaveTaxRegime = async () => {
    try {
      const res = await fetch('/api/settings/tax-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxRate: (effectiveTaxRate / 100).toFixed(4),
          regimeName: activeRegime.section,
        }),
      });
      if (res.ok) {
        setSaveStatus(`Saved! Tax rate ${effectiveTaxRate.toFixed(2)}% under ${activeRegime.section} registered.`);
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save tax setting:', err);
    }
  };

  // -------------------------------------------------------------
  // MASTER PROFIT, DEDUCTIONS & TAX CALCULATIONS (WATERFALL)
  // -------------------------------------------------------------
  // 1. Gross Inflow / Revenue:
  const grossRevenue = unitsSold * sellingPriceRupees;

  // 2. Direct Manufacturing Costs (Cost of Goods / BOM Parts):
  const totalDirectCosts = unitsSold * directCostPerUnitRupees;
  const grossMargin = grossRevenue - totalDirectCosts;
  const grossMarginPercent = grossRevenue > 0 ? (grossMargin / grossRevenue) * 100 : 0;

  // 3. Operating Deductible Expenses:
  const staffPayrollTotal = staffPayrollMonthly * payrollMonths;
  const factoryRentTotal = factoryRentMonthly * factoryMonths;
  const customExpensesTotal = customExpenses.reduce((acc, c) => acc + c.amount, 0);

  const totalOperatingExpenses =
    staffPayrollTotal +
    financierProfitDeduction +
    factoryRentTotal +
    electricityUtilities +
    logisticsFreight +
    machiningConsumables +
    complianceAndCA +
    customExpensesTotal;

  // 4. Taxable Profit (Profit Before Tax - PBT):
  // Rule: PBT = Gross Revenue - Direct Costs - All Counted Operating Expenses
  const profitBeforeTax = grossMargin - totalOperatingExpenses;
  const isLoss = profitBeforeTax <= 0;

  // 5. Tax to be Paid According to Current Rule:
  // Rule: If profit > 0, Tax = PBT * effectiveTaxRate%. If loss, Tax = ₹0
  const taxToBePaid = !isLoss ? Math.round((profitBeforeTax * effectiveTaxRate) / 100) : 0;

  // 6. Net Profit After Tax (PAT):
  // Rule: Deduct tax from the profit after all expenses are filled and deducted
  const netProfitAfterTax = !isLoss ? profitBeforeTax - taxToBePaid : profitBeforeTax;

  // 7. Profit Distribution:
  // Imran 40% CMD Share, Pappu Bhai 10% COO Share, 50% Retained / Other Partners
  const imranShare = !isLoss ? Math.round(netProfitAfterTax * 0.40) : 0;
  const pappuShare = !isLoss ? Math.round(netProfitAfterTax * 0.10) : 0;
  const retainedShare = !isLoss ? Math.round(netProfitAfterTax * 0.50) : 0;

  return (
    <div className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-8 animate-fadeIn relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-950/60 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                FULL SCALE COMPANY MODE
              </h2>
              <span className="text-[11px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Scale className="w-3.5 h-3.5" />
                COMMERCIAL P&L, EXPENSE DEDUCTIONS & CORPORATE TAX
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              In full commercial scale, every expense (staff salaries, raw materials, factory overhead, financier interest/profit) is filled and deducted from your gross sales revenue. Then, corporate income tax is calculated and deducted according to current Indian tax rules to give you the exact final Net Profit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleSyncWithDatabase}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition flex items-center gap-1.5 border border-slate-700"
            title="Auto-fill numbers from your actual database prototype parts, loans and salaries"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Sync from Database</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {saveStatus && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* HERO WATERFALL SUMMARY CARDS                             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* 1. Gross Revenue */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
            <span>1. Gross Sales Revenue</span>
            <span className="text-[10px] text-sky-400 font-mono">{unitsSold} Units</span>
          </span>
          <div className="text-2xl font-black text-white font-mono my-1">
            ₹{grossRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block">
            @{unitsSold > 0 ? `₹${(sellingPriceRupees / 100000).toFixed(2)} Lakhs/unit` : '0'}
          </span>
        </div>

        {/* 2. Total Deductible Operating Expenses */}
        <div className="bg-slate-950/90 border border-rose-500/30 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
            <span>2. All Expenses Deducted</span>
            <span className="text-[10px] text-rose-300 font-mono">DEDUCTION</span>
          </span>
          <div className="text-2xl font-black text-rose-300 font-mono my-1">
            -₹{(totalDirectCosts + totalOperatingExpenses).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block">
            BOM (₹{(totalDirectCosts / 100000).toFixed(1)}L) + Opex (₹{(totalOperatingExpenses / 100000).toFixed(1)}L)
          </span>
        </div>

        {/* 3. Tax Deducted According to Current Rule */}
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
            <span>3. Current Rule Tax Paid</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              {effectiveTaxRate.toFixed(2)}% Rate
            </span>
          </span>
          <div className="text-2xl font-black text-amber-300 font-mono my-1">
            {taxToBePaid > 0 ? `-₹${taxToBePaid.toLocaleString('en-IN')}` : '₹0 (Nil on Loss)'}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Deducted under {activeRegime.section}
          </span>
        </div>

        {/* 4. Final Net Profit After Tax */}
        <div className="bg-gradient-to-br from-emerald-950/90 to-slate-950 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-xl">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
            <span>4. Net Profit After Tax (PAT)</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              TAKE-HOME
            </span>
          </span>
          <div className={`text-2xl font-black font-mono my-1 ${isLoss ? 'text-rose-400' : 'text-emerald-300'}`}>
            {isLoss ? `-₹${Math.abs(profitBeforeTax).toLocaleString('en-IN')}` : `+₹${netProfitAfterTax.toLocaleString('en-IN')}`}
          </div>
          <span className="text-[11px] text-emerald-200 block">
            {isLoss ? 'Net Operating Loss' : `Imran 40% Share: ₹${imranShare.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1 & 2: FILL EACH ENTRY (REVENUE, BOM & ALL EXPENSES) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* LEFT COLUMN: REVENUE & DIRECT MANUFACTURING BOM */}
        <div className="space-y-5 bg-slate-950/80 p-5 lg:p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              1. Commercial Sales & Direct Unit BOM
            </h3>
            <span className="text-xs text-slate-400">Fill Entries</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Entry: Units Sold */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-bold">Commercial Units Sold (Quantity):</label>
                <span className="font-mono text-indigo-400 font-bold">{unitsSold} Gensets</span>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={unitsSold}
                onChange={(e) => setUnitsSold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard full scale production run = 30 generators (Stage 3 benchmark).
              </span>
            </div>

            {/* Entry: Selling Price */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-bold">Average Selling Price per Generator (₹):</label>
                <span className="font-mono text-emerald-400 font-bold">
                  ₹{(sellingPriceRupees / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  step="5000"
                  value={sellingPriceRupees}
                  onChange={(e) => setSellingPriceRupees(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
            </div>

            {/* Entry: Direct Cost per Unit */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-bold">Direct BOM Parts & Manufacturing Cost per Unit (₹):</label>
                <span className="font-mono text-orange-400 font-bold">
                  ₹{(directCostPerUnitRupees / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  step="5000"
                  value={directCostPerUnitRupees}
                  onChange={(e) => setDirectCostPerUnitRupees(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Total Direct Parts Cost = {unitsSold} × ₹{directCostPerUnitRupees.toLocaleString('en-IN')} = ₹{totalDirectCosts.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="pt-3 border-t border-slate-800 bg-slate-900/60 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-bold block">Gross Manufacturing Profit:</span>
                <span className="text-[11px] text-slate-400">Revenue minus Direct Parts Cost</span>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-emerald-400 font-mono">
                  ₹{grossMargin.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-300 font-bold">
                  {grossMarginPercent.toFixed(1)}% Gross Margin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FILL ALL OPERATING EXPENSES */}
        <div className="space-y-4 bg-slate-950/80 p-5 lg:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-400" />
                2. Operating Expenses Counted as Deductibles
              </h3>
              <span className="text-xs text-slate-400">Fill Each Entry</span>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
              {/* Entry 1: Staff Payroll */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Staff Payroll & Salaries:
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {payrollMonths} months × ₹{staffPayrollMonthly.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="5000"
                    value={staffPayrollMonthly}
                    onChange={(e) => setStaffPayrollMonthly(parseFloat(e.target.value) || 0)}
                    className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono font-bold text-xs"
                    title="Monthly staff payroll"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">/mo</span>
                </div>
              </div>

              {/* Entry 2: Financier Loan Profit / Interest Deductions */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <HandCoins className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Financier Profit Return:
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Financier EMI/lump-sum profit (tax-deductible financial cost)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="5000"
                    value={financierProfitDeduction}
                    onChange={(e) => setFinancierProfitDeduction(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-amber-300 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Entry 3: Factory Shed Rent & Infrastructure */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Factory Shed Lease:
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {factoryMonths} months × ₹{factoryRentMonthly.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step="5000"
                    value={factoryRentMonthly}
                    onChange={(e) => setFactoryRentMonthly(parseFloat(e.target.value) || 0)}
                    className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono font-bold text-xs"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">/mo</span>
                </div>
              </div>

              {/* Entry 4: HT Electricity & Utilities */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-200">HT Electricity & Plant Power:</span>
                  <span className="text-[11px] text-slate-400 block">Annual transformer & grid bills</span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={electricityUtilities}
                  onChange={(e) => setElectricityUtilities(parseFloat(e.target.value) || 0)}
                  className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono font-bold text-xs"
                />
              </div>

              {/* Entry 5: Logistics & Crane Dispatch */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-200">Freight, Logistics & Rigging:</span>
                  <span className="text-[11px] text-slate-400 block">Generator freight & site unloading</span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={logisticsFreight}
                  onChange={(e) => setLogisticsFreight(parseFloat(e.target.value) || 0)}
                  className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono font-bold text-xs"
                />
              </div>

              {/* Entry 6: Lathe, CNC Machining & Tooling */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-200">Machining, Lathe & Consumables:</span>
                  <span className="text-[11px] text-slate-400 block">Sardar Ji lathe works, gases, bolts</span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={machiningConsumables}
                  onChange={(e) => setMachiningConsumables(parseFloat(e.target.value) || 0)}
                  className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono font-bold text-xs"
                />
              </div>

              {/* Entry 7: Statutory CA & Licensing */}
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-200">Statutory CA, Audit & Licensing:</span>
                  <span className="text-[11px] text-slate-400 block">Pollution testing, company compliance</span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={complianceAndCA}
                  onChange={(e) => setComplianceAndCA(parseFloat(e.target.value) || 0)}
                  className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono font-bold text-xs"
                />
              </div>

              {/* Custom Entries */}
              {customExpenses.map((entry) => (
                <div key={entry.id} className="p-2.5 bg-slate-900/80 rounded-xl border border-indigo-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      onClick={() => handleRemoveCustom(entry.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-slate-200 truncate">{entry.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">
                    ₹{entry.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}

              {/* Form to Add Custom Entry */}
              {isAddingCustom ? (
                <form onSubmit={handleAddCustom} className="p-3 bg-slate-900 rounded-xl border border-indigo-500/50 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Expense Name (e.g. Paint Booth Lease)"
                      value={newCustomName}
                      onChange={(e) => setNewCustomName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Amount ₹"
                      value={newCustomAmount}
                      onChange={(e) => setNewCustomAmount(e.target.value)}
                      className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(false)}
                      className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                    >
                      Add Entry
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full py-2 border border-dashed border-slate-700 hover:border-indigo-400 text-slate-400 hover:text-indigo-300 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Expense Entry</span>
                </button>
              )}
            </div>
          </div>

          {/* Total Operating Expenses Subtotal */}
          <div className="pt-3 border-t border-slate-800 bg-slate-900/60 p-3 rounded-xl flex items-center justify-between">
            <span className="text-slate-300 font-bold">Total Counted Operating Expenses:</span>
            <span className="text-base font-black text-rose-400 font-mono">
              ₹{totalOperatingExpenses.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 3 & 4: CURRENT INDIAN CORPORATE TAX RULE SELECTOR   */}
      {/* ======================================================== */}
      <div className="space-y-4 bg-slate-950/80 p-5 lg:p-6 rounded-2xl border border-slate-800 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              3. Tax Option According to Current Rules
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose the statutory income tax regime for your company. Tax is paid on Net Taxable Profit after all expenses are deducted.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveTaxRegime}
              className="px-3.5 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-amber-950/50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Tax Setting</span>
            </button>
          </div>
        </div>

        {/* 4 Indian Tax Rule Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.values(taxRegimes).map((regime) => {
            const isSelected = selectedRegimeKey === regime.key;
            return (
              <div
                key={regime.key}
                onClick={() => setSelectedRegimeKey(regime.key)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-950/70 to-slate-900 border-amber-400 shadow-xl shadow-amber-950/40 ring-1 ring-amber-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {regime.section}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-white leading-tight mb-1">
                    {regime.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {regime.applicableFor}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-400">Effective Rate:</span>
                    <span className="text-base font-black text-amber-300 font-mono">
                      {regime.key === 'custom' ? `${customTaxPercent}%` : `${regime.effectiveRate.toFixed(2)}%`}
                    </span>
                  </div>
                  {regime.key !== 'custom' && (
                    <span className="text-[10px] text-slate-500 block text-right mt-0.5">
                      ({regime.baseRate}% base + {regime.surcharge}% sc + {regime.cess}% cess)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Tax Rate Input if Custom selected */}
        {selectedRegimeKey === 'custom' && (
          <div className="p-3.5 bg-slate-900 rounded-xl border border-amber-500/30 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300 font-bold">Specify Custom Business Tax Rate (%):</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={customTaxPercent}
                onChange={(e) => setCustomTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-white text-xs"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STEP 5 & 6: DEDUCT TAX FROM PROFIT & SHOW EXACT AMOUNTS  */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-7 rounded-2xl border border-emerald-500/40 space-y-6 relative z-10 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Final Profit Deductions & Statutory Tax Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact audited waterfall showing how expenses and tax are deducted to arrive at Net Take-Home Profit.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            AUDITED P&L
          </span>
        </div>

        {/* Step-by-Step Waterfall Row */}
        <div className="space-y-2.5 text-xs">
          {/* Step 1: Gross Sales Revenue */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                1
              </span>
              <span className="font-bold text-slate-200">Gross Commercial Sales Inflow ({unitsSold} Units)</span>
            </div>
            <span className="font-black text-white font-mono text-sm">
              +₹{grossRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Step 2: Less Direct Parts BOM */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-300 font-bold flex items-center justify-center text-[10px]">
                2
              </span>
              <span className="text-slate-300">Less: Direct Manufacturing Parts & Assembly BOM Costs</span>
            </div>
            <span className="font-black text-rose-400 font-mono text-sm">
              -₹{totalDirectCosts.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Step 3: Less Counted Operating Expenses */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-300 font-bold flex items-center justify-center text-[10px]">
                3
              </span>
              <span className="text-slate-300">
                Less: Counted Operating Expenses (Salaries, Factory, Financier Interest, Utilities)
              </span>
            </div>
            <span className="font-black text-rose-400 font-mono text-sm">
              -₹{totalOperatingExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Step 4: Taxable Profit (PBT) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                =
              </span>
              <span className="font-bold text-indigo-200 text-xs">
                Taxable Business Profit (Profit Before Tax - PBT)
              </span>
            </div>
            <span className="font-black text-indigo-300 font-mono text-base">
              ₹{profitBeforeTax.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Step 5: Deduct Tax According to Rule */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-500/40">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                4
              </span>
              <div>
                <span className="font-bold text-amber-200 block">
                  Less: Corporate Income Tax Paid ({effectiveTaxRate.toFixed(2)}% under {activeRegime.section})
                </span>
                <span className="text-[11px] text-amber-300/80">
                  Deducted from profit after all expenses. {isLoss ? 'No tax payable because PBT is zero or negative.' : 'Calculated on Net Taxable Profit.'}
                </span>
              </div>
            </div>
            <span className="font-black text-amber-400 font-mono text-base">
              {taxToBePaid > 0 ? `-₹${taxToBePaid.toLocaleString('en-IN')}` : '₹0'}
            </span>
          </div>

          {/* Step 6: Final Net Profit After Tax */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/60 border-2 border-emerald-500 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                ✓
              </span>
              <div>
                <span className="text-sm font-black text-white block">
                  FINAL NET PROFIT AFTER TAX (PAT)
                </span>
                <span className="text-[11px] text-emerald-300">
                  Pure clean earnings available for partner payouts & business reserves
                </span>
              </div>
            </div>
            <span className={`text-xl font-black font-mono ${isLoss ? 'text-rose-400' : 'text-emerald-300'}`}>
              ₹{netProfitAfterTax.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Partner Payout Distribution Cards */}
        {!isLoss && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Partner Profit Distribution from Net Profit After Tax:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Imran CMD */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-amber-500/40">
                <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" /> Imran (CMD 40%)
                  </span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">Founder Share</span>
                </div>
                <div className="text-lg font-black text-amber-300 font-mono">
                  ₹{imranShare.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Direct net profit take-home</span>
              </div>

              {/* Pappu Bhai */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-sky-500/40">
                <div className="flex items-center justify-between text-sky-400 font-bold mb-1">
                  <span>Pappu Bhai (COO 10%)</span>
                  <span className="text-[10px] bg-sky-500/20 px-2 py-0.5 rounded">Core Lead</span>
                </div>
                <div className="text-lg font-black text-sky-300 font-mono">
                  ₹{pappuShare.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">10% executive partner share</span>
              </div>

              {/* Company Reserves */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-purple-500/40">
                <div className="flex items-center justify-between text-purple-400 font-bold mb-1">
                  <span>Company Reserves & Partners (50%)</span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">Reinvestment</span>
                </div>
                <div className="text-lg font-black text-purple-300 font-mono">
                  ₹{retainedShare.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Factory capex & working capital</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
