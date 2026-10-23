// src/components/SimpleCashOverview.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  ProductPrototype,
  BOMLineItem,
  Employee,
  Loan,
  FactoryConstructionItem,
  Expense,
  BusinessStage,
  StageSettings,
} from '../types.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
  calculateGeneratorMasterCashflow,
} from '../utils/calculations.ts';
import { FullScaleCompanyTaxLedger } from './FullScaleCompanyTaxLedger.tsx';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Wallet,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Building2,
  Users,
  HandCoins,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Check,
  Wrench,
  Percent,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  X,
  Edit2,
  Activity,
  Cpu,
  BatteryCharging,
  Cog,
  Boxes,
  Crown,
  Calculator,
  Flame,
  Scale,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface SimpleCashOverviewProps {
  products: ProductPrototype[];
  bomLineItems: BOMLineItem[];
  employees: Employee[];
  loans: Loan[];
  construction: FactoryConstructionItem[];
  expenses: Expense[];
  stageSettings: StageSettings;
  corporateTaxRate?: number;
  onUpdateTaxRate?: (rate: number, regime?: string) => Promise<void>;
  onOpenCAExport?: () => void;
  onSwitchStage: (
    stage: BusinessStage,
    options?: { isLoansActive?: boolean; isFactoryActive?: boolean; founderFundsPaise?: string }
  ) => Promise<void>;
  onToggleSection: (section: 'loans' | 'factory', active: boolean) => Promise<void>;
  onSetCrewLevel?: (level: 'prototype_crew' | 'core_partners' | 'all_staff', customActiveNames?: string[]) => Promise<void>;
  onToggleEmployeeStatus: (employeeId: number, status: 'active' | 'not_hired') => Promise<void>;
  onUpdateFounderCapital: (amountPaise: string) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onOpenPriceCalculator?: () => void;
}

const CustomChartTooltip = ({ active, payload, label, corporateTaxRate }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    const isNetPositive = (data?.netProfit || 0) >= 0;

    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 z-50 backdrop-blur-md min-w-[210px]">
        <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex justify-between items-center gap-3">
          <span>{label}</span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
            {data?.unitsNote}
          </span>
        </div>
        <div className="flex justify-between gap-4 text-emerald-400 pt-1">
          <span>Gross Revenue:</span>
          <span className="font-bold font-mono">₹{data?.revenue} Lakhs</span>
        </div>
        <div className="flex justify-between gap-4 text-rose-400">
          <span>Direct & Ops Costs:</span>
          <span className="font-bold font-mono">₹{data?.expenses} Lakhs</span>
        </div>
        <div className="flex justify-between gap-4 text-purple-400">
          <span>Corporate Tax ({corporateTaxRate}%):</span>
          <span className="font-bold font-mono">₹{data?.tax} Lakhs</span>
        </div>
        <div className="pt-1.5 border-t border-slate-800 flex justify-between gap-4 items-center">
          <span className="font-bold text-white">Net Bottom Line:</span>
          <span
            className={`font-mono font-black text-sm ${
              isNetPositive ? 'text-sky-300' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}₹{data?.netProfit} Lakhs
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const CashHistoryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-slate-900/95 border border-emerald-500/50 p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 z-50 backdrop-blur-md min-w-[230px]">
        <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex justify-between items-center gap-3">
          <span>{data?.fullMonth}</span>
          {data?.isCurrent && (
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              ● Live Today
            </span>
          )}
        </div>
        <div className="flex justify-between gap-4 text-emerald-400 pt-1">
          <span>Closing Cash on Hand:</span>
          <span className="font-bold font-mono text-sm">₹{data?.cashOnHandLakhs} Lakhs</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-300 text-[11px]">
          <span>Exact Liquid Reserve:</span>
          <span className="font-mono text-emerald-300 font-semibold">{formatPaiseToRupees(data?.cashOnHandPaise || '0')}</span>
        </div>
        {data?.outflowLakhs > 0 && (
          <div className="flex justify-between gap-4 text-rose-400 text-[11px] pt-1 border-t border-slate-800/80">
            <span>Disbursed in Month:</span>
            <span className="font-mono font-semibold">-₹{data?.outflowLakhs} Lakhs</span>
          </div>
        )}
        <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60 leading-tight">
          {data?.milestone}
        </div>
      </div>
    );
  }
  return null;
};

export const SimpleCashOverview: React.FC<SimpleCashOverviewProps> = ({
  products,
  bomLineItems,
  employees,
  loans,
  construction,
  expenses,
  stageSettings,
  corporateTaxRate = 25,
  onUpdateTaxRate,
  onOpenCAExport,
  onSwitchStage,
  onToggleSection,
  onSetCrewLevel,
  onToggleEmployeeStatus,
  onUpdateFounderCapital,
  onNavigateTab,
  onOpenPriceCalculator,
}) => {
  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [founderCapitalRupees, setFounderCapitalRupees] = useState(
    (Number(stageSettings.founderFundsPaise || '200000000') / 100).toString()
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Active Stage & Section Settings
  const currentStage = stageSettings.currentStage || 'prototype';
  const isLoansActive = stageSettings.isLoansActive;
  const isFactoryActive = stageSettings.isFactoryActive;

  // Drawer / Button Panels visibility (only visible when applied or clicked)
  const [activePanel, setActivePanel] = useState<'none' | 'profit_share' | 'loans' | 'factory' | 'parts'>('none');

  // Interactive Target Selling Price Simulator (Expanded range & values)
  const [simulatorPriceLakhs, setSimulatorPriceLakhs] = useState<number>(6.5);
  const [activeCluster, setActiveCluster] = useState<string>('all');
  const [cashChartStyle, setCashChartStyle] = useState<'area' | 'line'>('area');

  // Master cashflow calculation
  const cashflow = calculateGeneratorMasterCashflow(
    {
      products,
      bomLineItems,
      employees,
      loans,
      construction,
      expenses,
    },
    {
      stage: currentStage,
      isLoansActive,
      isFactoryActive,
      founderFundsPaise: stageSettings.founderFundsPaise,
    }
  );

  // Prototype calculations
  const activeProducts = products.filter((p) => p.productLine === 'Generator Set');
  const prototype = activeProducts.find((p) => p.productId === 'PRD-GEN-30KVA') || activeProducts[0];

  const prototypeBoms = prototype
    ? bomLineItems.filter((b) => b.productId === prototype.productId && !b.isMiscategorized)
    : [];
  const prototypeCostPaise = prototypeBoms.reduce((acc, item) => acc + BigInt(item.amount || 0), 0n);
  const targetPrototypePaise = 160000000n; // ₹16 Lakhs prototype budget
  const prototypePercentUtilized =
    targetPrototypePaise > 0n
      ? Math.min(100, Number((prototypeCostPaise * 10000n) / targetPrototypePaise) / 100)
      : 0;

  // Active Crew Preset State ('prototype_crew' | 'core_partners' | 'all_staff')
  const [selectedCrewPreset, setSelectedCrewPreset] = useState<'prototype_crew' | 'core_partners' | 'all_staff' | 'custom'>(() => {
    return (stageSettings.activeCrewLevel as any) || (currentStage === 'prototype' ? 'prototype_crew' : currentStage === 'selling' ? 'core_partners' : 'all_staff');
  });

  // Local employee status overrides for immediate responsive feedback
  const [localEmployeeStatusMap, setLocalEmployeeStatusMap] = useState<Record<number, 'active' | 'not_hired'>>({});

  // Sync preset if stageSettings.activeCrewLevel changes from backend
  useEffect(() => {
    if (stageSettings.activeCrewLevel) {
      setSelectedCrewPreset(stageSettings.activeCrewLevel);
    }
  }, [stageSettings.activeCrewLevel]);

  // Effective staff combining prop data + local user toggle overrides
  const effectiveStaff = useMemo(() => {
    return employees.map((emp) => {
      const override = localEmployeeStatusMap[emp.id];
      return override ? { ...emp, status: override } : emp;
    });
  }, [employees, localEmployeeStatusMap]);

  // Post Seniority Score: higher score = higher post (CMD Rank 1 = 1000 down to Intern = 250)
  const getPostSeniorityScore = (emp: Employee): number => {
    const post = (emp.post || '').toLowerCase();
    const name = (emp.name || '').toLowerCase();
    const category = (emp.category || '').toLowerCase();

    // 1. Chairman & Managing Director / CMD (Imran)
    if (post.includes('chairman') || post.includes('managing director') || post.includes('cmd') || name === 'imran') {
      return 1000;
    }
    // 2. Chief Operating Officer / COO (Pappu Bhai)
    if (post.includes('chief operating officer') || post.includes('coo') || name.includes('pappu')) {
      return 950;
    }
    // 3. Director-Operations / Director (Simran)
    if (post.includes('director-operations') || (post.includes('director') && !post.includes('managing')) || name.includes('simran')) {
      return 900;
    }
    // 4. Core Team Member / Decision Maker (Supriya)
    if (post.includes('core team member') || name.includes('supriya')) {
      return 850;
    }
    // 5. Plant Manager / Operations Head (Naushad Bhai)
    if (post.includes('plant manager') || (post.includes('operations head') && name.includes('naushad'))) {
      return 800;
    }
    // 6. Head of Operations (Wahid)
    if (post.includes('head of operations') || name.includes('wahid')) {
      return 780;
    }
    // 7. Business Development Head (Kumail)
    if (post.includes('business development head') || post.includes('bd head') || name.includes('kumail')) {
      return 760;
    }
    // 8. Chief Engineer / IIT (Ramendra IIT, Vijay IIT)
    if (post.includes('chief engineer') || name.includes('ramendra') || name.includes('vijay')) {
      return 740;
    }
    // 9. Lead CAD Designer / Chief Design Engineer (Anurag)
    if (post.includes('cad designer') || post.includes('design engineer') || name.includes('anurag')) {
      return 700;
    }
    // 10. Senior Accounts Executive (Mahtab Bhai)
    if (post.includes('senior accounts') || post.includes('accounts') || name.includes('mahtab')) {
      return 650;
    }
    // 11. Operations Team Lead (Jameel)
    if (post.includes('team lead') || (post.includes('operations') && name.includes('jameel'))) {
      return 630;
    }
    // 12. Executive Assistant / Corp. Communications (Neel)
    if (post.includes('executive assistant') || post.includes('communications') || name.includes('neel')) {
      return 610;
    }
    // 13. Senior Marketing Executive (Akash Bhai)
    if (post.includes('senior marketing') || name.includes('akash')) {
      return 590;
    }
    // 14. HR & Admin Executive (Maya)
    if (post.includes('hr & admin') || post.includes('hr') || name.includes('maya')) {
      return 570;
    }
    // 15. Strategic Partnerships Manager (Kumail ka Dost)
    if (post.includes('partnerships manager') || post.includes('partnerships')) {
      return 550;
    }
    // 16. Marketing & Client Relations Exec (Vikas)
    if (post.includes('client relations') || name.includes('vikas')) {
      return 500;
    }
    // 17. Logistics & Dispatch Coordinator (Anwer Lateef)
    if (post.includes('logistics') || post.includes('dispatch') || name.includes('anwer')) {
      return 480;
    }
    // 18. MIS & IT Support Executive (Aqil)
    if (post.includes('mis') || post.includes('it support') || name.includes('aqil')) {
      return 460;
    }
    // 19. Field Operations Coordinator (Faiz)
    if (post.includes('field operations') || name.includes('faiz')) {
      return 440;
    }
    // 20. Junior Operations Executive (Chota Bilal)
    if (post.includes('junior operations') || name.includes('bilal')) {
      return 380;
    }
    // 21. Junior Site Coordinator (Shekhu)
    if (post.includes('junior site') || name.includes('shekhu')) {
      return 350;
    }
    // 22. Junior Field Assistant (Ikhlaq)
    if (post.includes('junior field') || name.includes('ikhlaq')) {
      return 320;
    }
    // 23. Management Trainee / Office Intern (Sammy)
    if (post.includes('trainee') || post.includes('intern') || name.includes('sammy')) {
      return 250;
    }

    // Dynamic fallback for any newly added team members
    let score = 200;
    const sal = Number(emp.monthlySalary || 0) / 100;
    score += Math.min(200, sal / 200);
    if (category.includes('core')) score += 200;
    else if (category.includes('head')) score += 100;
    else if (category.includes('management')) score += 50;

    return score;
  };

  // Sorted staff list for "Select Active Staff on Payroll" popup:
  // - Options 1 & 2: Active staff on top (sorted by higher post first). Below them, non-hired staff (sorted by higher post).
  // - Option 3: All 24 staff are hired and active; sorted by post: highest post on top (CMD -> COO -> Director -> etc.)
  const sortedStaffList = useMemo(() => {
    return [...effectiveStaff].sort((a, b) => {
      const aActive = a.status === 'active';
      const bActive = b.status === 'active';

      // Active staff on the top in first 2 options (and anytime active/inactive are mixed)
      if (aActive !== bActive) {
        return aActive ? -1 : 1;
      }

      // Within the same status (or when everyone is active like in option 3):
      // Sort by post seniority: higher post comes first (descending score)
      const scoreA = getPostSeniorityScore(a);
      const scoreB = getPostSeniorityScore(b);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Tie breaker: higher monthly salary first
      const salA = Number(a.monthlySalary || 0);
      const salB = Number(b.monthlySalary || 0);
      if (salA !== salB) {
        return salB - salA;
      }

      return (a.id || 0) - (b.id || 0);
    });
  }, [effectiveStaff]);

  // Active employees breakdown
  const activeEmployees = useMemo(() => effectiveStaff.filter((e) => e.status === 'active'), [effectiveStaff]);
  const notHiredEmployees = useMemo(() => effectiveStaff.filter((e) => e.status === 'not_hired'), [effectiveStaff]);
  const activePayrollPaise = useMemo(
    () => activeEmployees.reduce((acc, e) => acc + BigInt(e.monthlySalary || 0), 0n),
    [activeEmployees]
  );
  const pausedPayrollPaise = useMemo(
    () => notHiredEmployees.reduce((acc, e) => acc + BigInt(e.monthlySalary || 0), 0n),
    [notHiredEmployees]
  );

  // Apply crew preset handler
  const handleApplyCrewPreset = async (preset: 'prototype_crew' | 'core_partners' | 'all_staff') => {
    setSelectedCrewPreset(preset);

    const newMap: Record<number, 'active' | 'not_hired'> = {};
    employees.forEach((emp) => {
      if (preset === 'prototype_crew') {
        const isProto = ['Imran', 'Pappu Bhai', 'Simran', 'Naushad Bhai', 'Wahid'].includes(emp.name);
        newMap[emp.id] = isProto ? 'active' : 'not_hired';
      } else if (preset === 'core_partners') {
        const isCore = ['Imran', 'Pappu Bhai', 'Simran', 'Naushad Bhai', 'Wahid', 'Kumail', 'Ramendra IIT', 'Vijay IIT'].includes(emp.name);
        newMap[emp.id] = isCore ? 'active' : 'not_hired';
      } else if (preset === 'all_staff') {
        newMap[emp.id] = 'active';
      }
    });

    setLocalEmployeeStatusMap(newMap);

    try {
      if (onSetCrewLevel) {
        await onSetCrewLevel(preset);
      }
    } catch (err) {
      console.error('Failed to set crew level:', err);
    }
  };

  // Toggle individual employee status handler
  const handleToggleStaffStatus = async (empId: number, currentStatus: 'active' | 'not_hired') => {
    const newStatus: 'active' | 'not_hired' = currentStatus === 'active' ? 'not_hired' : 'active';
    setLocalEmployeeStatusMap((prev) => ({
      ...prev,
      [empId]: newStatus,
    }));
    setSelectedCrewPreset('custom');

    try {
      await onToggleEmployeeStatus(empId, newStatus);
    } catch (err) {
      console.error('Failed to toggle employee status:', err);
    }
  };

  // Component Clusters mapping for the 64 prototype parts
  const componentClusters = useMemo(() => {
    return [
      {
        id: 'electrical',
        name: 'Alternator & Electrical',
        icon: Zap,
        color: 'text-amber-400 border-amber-500/40 bg-amber-950/30',
        activeBg: 'bg-amber-500 text-slate-950',
        keywords: ['alternator', 'electrical', 'socket', 'wiring', 'mcb', 'wire', 'rpm meter', 'voltage'],
      },
      {
        id: 'canopy',
        name: 'Acoustic Canopy',
        icon: ShieldCheck,
        color: 'text-sky-400 border-sky-500/40 bg-sky-950/30',
        activeBg: 'bg-sky-500 text-slate-950',
        keywords: ['canopy', 'ac box', 'duct tape'],
      },
      {
        id: 'motors',
        name: 'AC & DC Motors',
        icon: Activity,
        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
        activeBg: 'bg-emerald-500 text-slate-950',
        keywords: ['motor', 'crompton', 'nanya', 'banwai'],
      },
      {
        id: 'machining',
        name: 'Sardar Ji & Machining',
        icon: Wrench,
        color: 'text-orange-400 border-orange-500/40 bg-orange-950/30',
        activeBg: 'bg-orange-500 text-slate-950',
        keywords: ['sardar ji', 'ghisai', 'boring', 'pully bore', 'shaft boring'],
      },
      {
        id: 'engineering',
        name: 'IIT Engineering & R&D',
        icon: Cpu,
        color: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
        activeBg: 'bg-purple-500 text-slate-950',
        keywords: ['ramendra', 'anurag', 'wahid disk'],
      },
      {
        id: 'batteries',
        name: 'Exide & Batteries',
        icon: BatteryCharging,
        color: 'text-teal-400 border-teal-500/40 bg-teal-950/30',
        activeBg: 'bg-teal-500 text-slate-950',
        keywords: ['battery', 'exide', 'rickshaw motor', 'terminal cable', 'ankul'],
      },
      {
        id: 'structure',
        name: 'Shaft, Pulleys & Hardware',
        icon: Cog,
        color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/30',
        activeBg: 'bg-indigo-500 text-slate-950',
        keywords: ['pully', 'belt', 'flywheel', 'bearing', 'nut bolt', 'square block', 'channel', 'angle', 'shaft', 'castor'],
      },
    ];
  }, []);

  const filteredBoms = useMemo(() => {
    if (activeCluster === 'all') return prototypeBoms;
    const targetCluster = componentClusters.find((c) => c.id === activeCluster);
    if (!targetCluster) return prototypeBoms;

    return prototypeBoms.filter((item) => {
      const lowerName = item.itemName.toLowerCase();
      const lowerCat = item.componentCategory.toLowerCase();
      return targetCluster.keywords.some((kw) => lowerName.includes(kw) || lowerCat.includes(kw));
    });
  }, [prototypeBoms, activeCluster, componentClusters]);

  const clusterTotals = useMemo(() => {
    const totals: Record<string, bigint> = {};
    componentClusters.forEach((c) => {
      const items = prototypeBoms.filter((item) => {
        const lowerName = item.itemName.toLowerCase();
        const lowerCat = item.componentCategory.toLowerCase();
        return c.keywords.some((kw) => lowerName.includes(kw) || lowerCat.includes(kw));
      });
      totals[c.id] = items.reduce((acc, i) => acc + BigInt(i.amount || 0), 0n);
    });
    return totals;
  }, [prototypeBoms, componentClusters]);

  // Simulator calculations (with expanded range up to 30.0 Lakhs)
  const simPricePaise = BigInt(Math.round(simulatorPriceLakhs * 100000 * 100));
  const simEstimatedProdCostPaise = 38000000n; // ₹3.80 Lakhs target commercial direct unit cost
  const simUnitProfitPaise = simPricePaise > simEstimatedProdCostPaise ? simPricePaise - simEstimatedProdCostPaise : 0n;
  const simMarginPercent = simPricePaise > 0n ? Number((simUnitProfitPaise * 10000n) / simPricePaise) / 100 : 0;

  // Corporate Tax Deduction & Net Profit View
  const simEstimatedTaxPaise = (simUnitProfitPaise * BigInt(corporateTaxRate || 25)) / 100n;
  const simUnitNetProfitPaise = simUnitProfitPaise > simEstimatedTaxPaise ? simUnitProfitPaise - simEstimatedTaxPaise : 0n;
  const simNetMarginPercent = simPricePaise > 0n ? Number((simUnitNetProfitPaise * 10000n) / simPricePaise) / 100 : 0;
  
  // Partner Net Profit share distribution (calculated from Net Profit after tax):
  const simImranProfitPaise = (simUnitNetProfitPaise * 40n) / 100n; // 40% CMD
  const simPappuProfitPaise = (simUnitNetProfitPaise * 10n) / 100n; // 10% COO
  const simSimranProfitPaise = (simUnitNetProfitPaise * 10n) / 100n; // 10% Ops Dir
  const simOther5CorePaise = (simUnitNetProfitPaise * 40n) / 100n; // 8% each to 5 members = 40%

  // Company Status Metrics
  const totalTaxPaidPaise = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Corporate Income Tax')
      .reduce((acc, e) => acc + BigInt(e.amount || '0'), 0n);
  }, [expenses]);

  const founderFundsPaise = BigInt(stageSettings.founderFundsPaise || '200000000');
  const remainingFounderCapitalPaise = useMemo(() => {
    const disbursed = cashflow.moneyAlreadyPaid;
    return founderFundsPaise > disbursed ? founderFundsPaise - disbursed : 0n;
  }, [founderFundsPaise, cashflow.moneyAlreadyPaid]);

  const activeLoansPaise = isLoansActive ? cashflow.totalLoanOutstanding : 0n;
  const totalCapitalBase = remainingFounderCapitalPaise + activeLoansPaise;
  const founderEquityRatio =
    totalCapitalBase > 0n
      ? Math.min(100, Math.max(0, Number((remainingFounderCapitalPaise * 10000n) / totalCapitalBase) / 100))
      : 100;
  const loanDebtRatio = 100 - founderEquityRatio;

  // 6-Month Cash-on-Hand History (May 2026 to October 2026)
  const sixMonthCashHistory = useMemo(() => {
    const currentCashPaise = cashflow.moneyIHaveNow;
    const founderCapPaise = BigInt(stageSettings.founderFundsPaise || '200000000');
    const loanInflowPaise = isLoansActive ? cashflow.totalLoanReceived : 0n;
    const totalInflowsPaise = founderCapPaise + loanInflowPaise;

    const monthDefs = [
      { key: '2026-05', short: 'May 26', label: 'May 2026', milestone: 'Capital Injection (₹20L) & Prototype Kickoff' },
      { key: '2026-06', short: 'Jun 26', label: 'June 2026', milestone: 'Alternator & Lathe Tooling Procurement' },
      { key: '2026-07', short: 'Jul 26', label: 'July 2026', milestone: 'Acoustic Canopy & Heavy Sheet Metal' },
      { key: '2026-08', short: 'Aug 26', label: 'August 2026', milestone: 'Engine Base & Vibration Damper Mounts' },
      { key: '2026-09', short: 'Sep 26', label: 'September 2026', milestone: 'DSE6120 Controller, Wiring & Piping' },
      { key: '2026-10', short: 'Oct 26', label: 'October 2026', milestone: 'Prototype Assembly Completed & Pilot Ready' },
    ];

    // Compute actual monthly outflows from BOM items and Expenses
    const monthlyOutflows: Record<string, bigint> = {};
    monthDefs.forEach((m) => { monthlyOutflows[m.key] = 0n; });

    bomLineItems.forEach((b) => {
      if (b.isMiscategorized) return;
      const mKey = (b.date || '').slice(0, 7);
      const amt = BigInt(b.amount || '0');
      if (monthlyOutflows[mKey] !== undefined) {
        monthlyOutflows[mKey] += amt;
      } else if (mKey < '2026-05') {
        monthlyOutflows['2026-05'] = (monthlyOutflows['2026-05'] || 0n) + amt;
      } else if (mKey >= '2026-10') {
        monthlyOutflows['2026-10'] = (monthlyOutflows['2026-10'] || 0n) + amt;
      }
    });

    expenses.forEach((e) => {
      const mKey = (e.date || '').slice(0, 7);
      const amt = BigInt(e.amount || '0');
      if (monthlyOutflows[mKey] !== undefined) {
        monthlyOutflows[mKey] += amt;
      } else if (mKey < '2026-05') {
        monthlyOutflows['2026-05'] = (monthlyOutflows['2026-05'] || 0n) + amt;
      } else if (mKey >= '2026-10') {
        monthlyOutflows['2026-10'] = (monthlyOutflows['2026-10'] || 0n) + amt;
      }
    });

    const totalLogged = monthDefs.reduce((acc, m) => acc + (monthlyOutflows[m.key] || 0n), 0n);
    const totalOutflow = cashflow.moneyAlreadyPaid > 0n ? cashflow.moneyAlreadyPaid : totalLogged;

    // Progression curve where last month (Oct 26) precisely equals live current cashflow.moneyIHaveNow
    let cumulative = 0n;
    return monthDefs.map((m, idx) => {
      let monthSpend = monthlyOutflows[m.key] || 0n;
      if (totalLogged === 0n && totalOutflow > 0n) {
        const weights = [0.12, 0.18, 0.22, 0.18, 0.16, 0.14];
        monthSpend = (totalOutflow * BigInt(Math.round(weights[idx] * 1000))) / 1000n;
      }
      cumulative += monthSpend;

      let closingPaise: bigint;
      if (idx === monthDefs.length - 1) {
        closingPaise = currentCashPaise;
      } else {
        closingPaise = totalInflowsPaise > cumulative ? totalInflowsPaise - cumulative : 0n;
      }

      const cashLakhs = Number((Number(closingPaise) / 10000000).toFixed(2));
      const outflowLakhs = Number((Number(monthSpend) / 10000000).toFixed(2));
      const inflowLakhs = idx === 0 ? Number((Number(totalInflowsPaise) / 10000000).toFixed(2)) : 0;

      return {
        month: m.short,
        fullMonth: m.label,
        milestone: m.milestone,
        cashOnHandLakhs: cashLakhs,
        cashOnHandPaise: closingPaise.toString(),
        outflowLakhs,
        inflowLakhs,
        isCurrent: idx === monthDefs.length - 1,
      };
    });
  }, [
    cashflow.moneyIHaveNow,
    cashflow.moneyAlreadyPaid,
    stageSettings.founderFundsPaise,
    isLoansActive,
    cashflow.totalLoanReceived,
    bomLineItems,
    expenses,
  ]);

  // Recharts Chart datasets & view mode
  const [chartMode, setChartViewMode] = useState<'stages' | 'monthly'>('stages');

  const stageChartData = useMemo(() => {
    const taxRate = (corporateTaxRate || 25) / 100;

    // Stage 1: Prototype Development (Investment Phase)
    const s1Revenue = 0;
    const s1BOM = Number(prototypeCostPaise) / 10000000; // in Lakhs
    const s1Payroll = Number(((Number(activePayrollPaise) / 10000000) * 3).toFixed(2)); // 3 months
    const s1Expenses = Number((s1BOM + s1Payroll).toFixed(2));
    const s1Tax = 0;
    const s1NetProfit = Number((-s1Expenses).toFixed(2));

    // Stage 2: Pilot Orders (5 units)
    const s2Units = 5;
    const s2Revenue = Number((s2Units * simulatorPriceLakhs).toFixed(2));
    const s2DirectCost = Number((s2Units * 3.8).toFixed(2));
    const s2Payroll = Number(((Number(activePayrollPaise) / 10000000) * 4).toFixed(2));
    const s2Expenses = Number((s2DirectCost + s2Payroll).toFixed(2));
    const s2PBT = Math.max(0, s2Revenue - s2Expenses);
    const s2Tax = Number((s2PBT * taxRate).toFixed(2));
    const s2NetProfit = Number((s2Revenue - s2Expenses - s2Tax).toFixed(2));

    // Stage 3: Full-Scale Commercial Operation (30 units)
    const s3Units = 30;
    const s3Revenue = Number((s3Units * simulatorPriceLakhs).toFixed(2));
    const s3DirectCost = Number((s3Units * 3.4).toFixed(2));
    const s3FullPayroll = Number(((521000 * 6) / 100000).toFixed(2));
    const s3FactoryCapex = Number((1800000 / 100000).toFixed(2));
    const s3Expenses = Number((s3DirectCost + s3FullPayroll + s3FactoryCapex).toFixed(2));
    const s3PBT = Math.max(0, s3Revenue - s3Expenses);
    const s3Tax = Number((s3PBT * taxRate).toFixed(2));
    const s3NetProfit = Number((s3Revenue - s3Expenses - s3Tax).toFixed(2));

    return [
      {
        name: 'Stage 1: Prototype',
        phase: 'Stage 1 (Fabrication)',
        revenue: s1Revenue,
        expenses: s1Expenses,
        tax: s1Tax,
        netProfit: s1NetProfit,
        unitsNote: '1 Prototype Built',
      },
      {
        name: 'Stage 2: Pilot Sales',
        phase: 'Stage 2 (Early Orders)',
        revenue: s2Revenue,
        expenses: s2Expenses,
        tax: s2Tax,
        netProfit: s2NetProfit,
        unitsNote: '5 Pilot Units',
      },
      {
        name: 'Stage 3: Full Commercial',
        phase: 'Stage 3 (Factory Scale)',
        revenue: s3Revenue,
        expenses: s3Expenses,
        tax: s3Tax,
        netProfit: s3NetProfit,
        unitsNote: '30 Commercial Units',
      },
    ];
  }, [corporateTaxRate, prototypeCostPaise, activePayrollPaise, simulatorPriceLakhs]);

  const monthlyChartData = useMemo(() => {
    const taxRate = (corporateTaxRate || 25) / 100;
    const months = ['M1 (Proto)', 'M2 (Proto)', 'M3 (Test)', 'M4 (Pilot)', 'M5 (Pilot)', 'M6 (Scale)', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
    return months.map((m, idx) => {
      let units = 0;
      if (idx === 3) units = 2;
      else if (idx === 4) units = 3;
      else if (idx === 5) units = 5;
      else if (idx >= 6) units = 6 + (idx - 6) * 2;

      const revenue = Number((units * simulatorPriceLakhs).toFixed(2));
      const direct = Number((units * 3.5).toFixed(2));
      const overhead = idx < 3 ? 2.15 : idx < 6 ? 2.6 : 5.21;
      const expenses = Number((direct + overhead).toFixed(2));
      const pbt = Math.max(0, revenue - expenses);
      const tax = Number((pbt * taxRate).toFixed(2));
      const netProfit = Number((revenue - expenses - tax).toFixed(2));

      return {
        name: m,
        phase: idx < 3 ? 'Prototype' : idx < 6 ? 'Pilot Launch' : 'Full Commercial',
        revenue,
        expenses,
        tax,
        netProfit,
        unitsNote: `${units} units`,
      };
    });
  }, [corporateTaxRate, simulatorPriceLakhs]);

  const handleStageSelect = async (stage: BusinessStage) => {
    setIsUpdating(true);
    try {
      if (stage === 'prototype') {
        await onSwitchStage('prototype', {
          isLoansActive: false,
          isFactoryActive: false,
        });
      } else if (stage === 'selling') {
        await onSwitchStage('selling', {
          isLoansActive: isLoansActive,
          isFactoryActive: false,
        });
      } else if (stage === 'full') {
        await onSwitchStage('full', {
          isLoansActive: true,
          isFactoryActive: true,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveFounderCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(founderCapitalRupees || '0');
    await onUpdateFounderCapital(paise);
    setIsCapitalModalOpen(false);
  };

  const drawerRef = React.useRef<HTMLDivElement>(null);

  const togglePanel = (panel: 'profit_share' | 'loans' | 'factory' | 'parts') => {
    const next = activePanel === panel ? 'none' : panel;
    setActivePanel(next);
    if (next !== 'none') {
      setTimeout(() => {
        drawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* 1. MASTER OPERATING MODES OF THE COMPANY                */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide uppercase">
                  Active Operating Mode
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    currentStage === 'prototype'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : currentStage === 'selling'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}
                >
                  ● {currentStage === 'prototype' ? 'STAGE 1: PROTOTYPE ACTIVE' : currentStage === 'selling' ? 'STAGE 2: PILOT & SELLING ACTIVE' : 'STAGE 3: FULL SCALE ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                These modes control active calculations, payroll crew, factory capex and financing logic.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Switching modes updates real-time financial projections instantly.
          </div>
        </div>

        {/* 3 Big Mode Cards (NO scrollbar, grid grid-cols-1 md:grid-cols-3 gap-3.5) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Mode 1 */}
          <button
            type="button"
            onClick={() => handleStageSelect('prototype')}
            disabled={isUpdating}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              currentStage === 'prototype'
                ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  currentStage === 'prototype' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  STAGE 1
                </span>
                <span className="text-sm font-black text-white">🛠️ Prototype Mode</span>
              </div>
              {currentStage === 'prototype' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              1 prototype fabrication, R&D procurement, 5 core technical crew members. Loans and factory paused.
            </p>
          </button>

          {/* Mode 2 */}
          <button
            type="button"
            onClick={() => handleStageSelect('selling')}
            disabled={isUpdating}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              currentStage === 'selling'
                ? 'bg-gradient-to-br from-sky-950/80 via-slate-900 to-slate-950 border-sky-500 shadow-xl shadow-sky-500/20 ring-2 ring-sky-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  currentStage === 'selling' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  STAGE 2
                </span>
                <span className="text-sm font-black text-white">⚡ Pilot & Selling</span>
              </div>
              {currentStage === 'selling' && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Early commercial sales orders, unit price & margin percentage simulator, 8 Core Partner profit shares.
            </p>
          </button>

          {/* Mode 3 */}
          <button
            type="button"
            onClick={() => handleStageSelect('full')}
            disabled={isUpdating}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              currentStage === 'full'
                ? 'bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 border-purple-500 shadow-xl shadow-purple-500/20 ring-2 ring-purple-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  currentStage === 'full' ? 'bg-purple-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  STAGE 3
                </span>
                <span className="text-sm font-black text-white">🏭 Full Scale Company</span>
              </div>
              {currentStage === 'full' && (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mass scale production (30+ units), full 24 factory staff, shed capex, financier debt & tax engine.
            </p>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OPERATING SECTIONS & ACTIVE LEDGERS (BIG BUTTONS)     */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider text-slate-200">
                Operating Sections & Active Ledgers
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                Interactive Modules
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any section button below to view detailed breakdowns, active ledgers, and controls directly.
            </p>
          </div>
          {activePanel !== 'none' && (
            <button
              onClick={() => setActivePanel('none')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 transition cursor-pointer"
            >
              Close Active Drawer ✕
            </button>
          )}
        </div>

        {/* Big Buttons Responsive Grid (NO scrollbars) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
          {/* Button 1: Profit Share */}
          <button
            type="button"
            onClick={() => togglePanel('profit_share')}
            className={`p-3.5 rounded-2xl font-bold transition flex flex-col justify-between text-left cursor-pointer border ${
              activePanel === 'profit_share'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 border-amber-400 ring-2 ring-amber-500/30'
                : 'bg-slate-950/80 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-base select-none">💎</span>
              {activePanel === 'profit_share' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
            </div>
            <div>
              <span className="block font-black text-xs leading-snug">Profit Share</span>
              <span className={`text-[10px] block font-mono mt-0.5 ${
                activePanel === 'profit_share' ? 'text-slate-950 font-bold' : 'text-slate-400'
              }`}>
                40% Imran • 10% Pappu
              </span>
            </div>
          </button>

          {/* Button 2: Financier Loans */}
          <button
            type="button"
            onClick={() => togglePanel('loans')}
            className={`p-3.5 rounded-2xl font-bold transition flex flex-col justify-between text-left cursor-pointer border ${
              activePanel === 'loans'
                ? 'bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20 border-amber-400 ring-2 ring-amber-500/30'
                : isLoansActive
                ? 'bg-amber-950/30 text-amber-300 border-amber-500/40 hover:bg-amber-950/50'
                : 'bg-slate-950/80 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-base select-none">🤝</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                isLoansActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                {isLoansActive ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <div>
              <span className="block font-black text-xs leading-snug">Financier Loans</span>
              <span className="text-[10px] block font-mono text-slate-400 mt-0.5">
                {isLoansActive ? formatPaiseToRupees(cashflow.totalLoanOutstanding.toString(), { compact: true }) : 'One-Time Debt'}
              </span>
            </div>
          </button>

          {/* Button 3: Factory & Expenses */}
          <button
            type="button"
            onClick={() => togglePanel('factory')}
            className={`p-3.5 rounded-2xl font-bold transition flex flex-col justify-between text-left cursor-pointer border ${
              activePanel === 'factory'
                ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20 border-purple-400 ring-2 ring-purple-500/30'
                : isFactoryActive
                ? 'bg-purple-950/30 text-purple-300 border-purple-500/40 hover:bg-purple-950/50'
                : 'bg-slate-950/80 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-base select-none">🏗️</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                isFactoryActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                {isFactoryActive ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <div>
              <span className="block font-black text-xs leading-snug">Factory & Expenses</span>
              <span className="text-[10px] block font-mono text-slate-400 mt-0.5">
                {isFactoryActive ? 'Shed & Machinery' : 'Paused in Stage 1'}
              </span>
            </div>
          </button>

          {/* Button 4: Active Crew */}
          <button
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
            className="p-3.5 rounded-2xl font-bold bg-slate-950/80 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                {activeEmployees.length} Hired
              </span>
            </div>
            <div>
              <span className="block font-black text-xs leading-snug">Team Crew</span>
              <span className="text-[10px] block font-mono text-slate-400 mt-0.5">
                {formatPaiseToRupees(cashflow.monthlyPayroll.toString(), { compact: true })} / mo
              </span>
            </div>
          </button>

          {/* Button 5: 64 Prototype Parts */}
          <button
            type="button"
            onClick={() => togglePanel('parts')}
            className={`p-3.5 rounded-2xl font-bold transition flex flex-col justify-between text-left cursor-pointer border ${
              activePanel === 'parts'
                ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/80 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Wrench className="w-4 h-4 text-emerald-400" />
              {activePanel === 'parts' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
            </div>
            <div>
              <span className="block font-black text-xs leading-snug">64 Prototype Parts</span>
              <span className="text-[10px] block font-mono text-slate-400 mt-0.5">
                {formatPaiseToRupees(prototypeCostPaise.toString(), { compact: true })}
              </span>
            </div>
          </button>

          {/* Button 6: Margin Calculator */}
          {onOpenPriceCalculator && (
            <button
              type="button"
              onClick={onOpenPriceCalculator}
              className="p-3.5 rounded-2xl font-bold bg-slate-950/80 hover:bg-emerald-950/50 text-slate-200 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between text-left cursor-pointer shadow-sm"
              title="Open Interactive Selling Price & Profit Margin Calculator"
            >
              <div className="flex items-center justify-between mb-1.5">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  SIMULATOR
                </span>
              </div>
              <div>
                <span className="block font-black text-xs leading-snug">Margin Calculator</span>
                <span className="text-[10px] block font-mono text-emerald-400/90 mt-0.5">
                  Calculate Net Profit
                </span>
              </div>
            </button>
          )}
        </div>

        {/* IN-LINE EXPANDABLE OPERATIONAL DRAWERS WITH AUTOSCROLL REF */}
        {activePanel !== 'none' && (
          <div ref={drawerRef} className="pt-4 mt-2 border-t border-slate-800 space-y-4 animate-fadeIn">
            {/* DRAWER: PROFIT SHARE BREAKDOWN */}
            {activePanel === 'profit_share' && (
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      Partner Profit Share Distribution Rules
                    </h4>
                    <span className="text-xs text-slate-400">Pre-Agreed Founder & Core Allocations</span>
                  </div>

                  <button
                    onClick={() => onNavigateTab('employees')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
                  >
                    Open Full Staff & Profit Share Tab →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-amber-500/30">
                    <span className="text-amber-400 font-bold block mb-1">Imran (CMD)</span>
                    <div className="text-lg font-black text-amber-300 font-mono">40% Share</div>
                    <span className="text-[10px] text-slate-400">Founder & Equity Leader (75% shareholding)</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-sky-500/30">
                    <span className="text-sky-400 font-bold block mb-1">Pappu Bhai (COO)</span>
                    <div className="text-lg font-black text-sky-300 font-mono">10% Share</div>
                    <span className="text-[10px] text-slate-400">Operations & Plant Execution Lead</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-purple-500/30">
                    <span className="text-purple-400 font-bold block mb-1">Simran (Ops Director)</span>
                    <div className="text-lg font-black text-purple-300 font-mono">10% Share</div>
                    <span className="text-[10px] text-slate-400">Executive Director Share</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block mb-1">Remaining 5 Core Leads</span>
                    <div className="text-lg font-black text-emerald-300 font-mono">40% Share</div>
                    <span className="text-[10px] text-slate-400">8% each to Naushad, Wahid, Kumail, Ramendra, Vijay</span>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER: FINANCIER LOANS */}
            {activePanel === 'loans' && (
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <HandCoins className="w-4 h-4 text-amber-400" />
                      Financier Loans (One-Time Injections & Profit Return)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isLoansActive
                        ? 'Loans section is ACTIVE: principal added to cash balance and EMIs/interest deducted.'
                        : 'Loans section is PAUSED: zero loan principal added and zero debt counted.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSection('loans', !isLoansActive)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isLoansActive
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      {isLoansActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isLoansActive ? 'Pause Loans Section' : 'Activate Loans Section'}</span>
                    </button>

                    <button
                      onClick={() => onNavigateTab('financier')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer"
                    >
                      Manage Loans Tab →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Total Loans Active:</span>
                    <span className="text-base font-bold text-white font-mono">{loans.length} Facilities</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Total Loan Injected:</span>
                    <span className="text-base font-bold text-amber-300 font-mono">
                      {formatPaiseToRupees(cashflow.totalLoanReceived.toString())}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Outstanding Balance:</span>
                    <span className="text-base font-bold text-rose-300 font-mono">
                      {formatPaiseToRupees(cashflow.totalLoanOutstanding.toString())}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER: FACTORY & EXPENSES */}
            {activePanel === 'factory' && (
              <div className="bg-slate-950/90 border border-purple-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      Factory Construction & Heavy Shed Capex
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isFactoryActive
                        ? 'Factory section is ACTIVE: shed construction costs are deducted from cash balance.'
                        : 'Factory section is PAUSED: ₹0 deducted from cash balance.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSection('factory', !isFactoryActive)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isFactoryActive
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {isFactoryActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isFactoryActive ? 'Pause Factory Section' : 'Activate Factory Section'}</span>
                    </button>

                    <button
                      onClick={() => onNavigateTab('factory')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl cursor-pointer"
                    >
                      Factory Ledger Tab →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER: 64 PROTOTYPE PARTS TABLE */}
            {activePanel === 'parts' && (
              <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      64 Prototype Component Parts & Lathe Works
                    </h4>
                    <span className="text-xs text-slate-400">Total Prototype Spend: {formatPaiseToRupees(prototypeCostPaise.toString())}</span>
                  </div>

                  <button
                    onClick={() => onNavigateTab('generators')}
                    className="text-xs text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Open Full Parts Editor →
                  </button>
                </div>

                {/* 7 Cluster Quick Filters */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveCluster('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeCluster === 'all' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    All (64)
                  </button>
                  {componentClusters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCluster(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeCluster === c.id ? c.activeBg : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 text-xs">
                  {filteredBoms.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] shrink-0">
                          {item.componentCategory}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{item.itemName}</span>
                        <span className="text-slate-500 text-[11px] hidden sm:inline">• {item.vendorOrPersonName}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-100 shrink-0 ml-2">
                        {formatPaiseToRupees(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. 'COMPANY STATUS' SUMMARY CARD                         */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">
                  Company Status & Corporate Governance
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  LIVE CORPORATE LEDGER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Current operational phase, tax compliance ledger, and founder equity vs debt structure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Corporate Tax Base:</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {corporateTaxRate}% Statutory Rate
            </span>
          </div>
        </div>

        {/* 3 Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Column 1: Current Operational Phase */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-400" /> Operational Phase
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    currentStage === 'prototype'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : currentStage === 'selling'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {currentStage === 'prototype' ? 'PHASE 1 ACTIVE' : currentStage === 'selling' ? 'PHASE 2 ACTIVE' : 'PHASE 3 ACTIVE'}
                </span>
              </div>

              <div className="text-lg font-black text-white">
                {currentStage === 'prototype' && 'Phase 1: Prototype Development'}
                {currentStage === 'selling' && 'Phase 2: Pilot Orders & Selling'}
                {currentStage === 'full' && 'Phase 3: Full-Scale Commercial Operation'}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {currentStage === 'prototype' &&
                'Fabrication of 30kVA acoustic genset (64 real logged parts) with 5 core engineers. External loans & factory shed paused.'}
              {currentStage === 'selling' &&
                'Accepting commercial bookings & pilot unit deliveries. 8 Core leaders profit distribution unlocked.'}
              {currentStage === 'full' &&
                '30+ unit monthly production run, full 24 employees on payroll, factory shed capex, and active corporate tax engine.'}
            </p>
          </div>

          {/* Column 2: Total Tax Paid to Date */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" /> Total Tax Paid to Date
                </span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  GOVT COMPLIANT
                </span>
              </div>

              <div className="text-2xl font-black text-white font-mono">
                {formatPaiseToRupees(totalTaxPaidPaise.toString())}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Corporate Tax Liability:</span>
                <span className="font-bold text-amber-300 font-mono">{corporateTaxRate}% of Net Profit</span>
              </div>
              <div className="flex justify-between">
                <span>Statutory Rule:</span>
                <span className="text-slate-300 font-medium">Income Tax Act 1961</span>
              </div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">
                Estimated liability deducted from commercial profits before partner distributions.
              </div>
            </div>

            {onOpenCAExport && (
              <button
                onClick={onOpenCAExport}
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                title="Export General Ledger & Balance Sheet for Chartered Accountant tax filing"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Export for CA (Tax & Balance Sheet)</span>
              </button>
            )}
          </div>

          {/* Column 3: Active Loans vs. Remaining Founder Capital */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" /> Active Loans vs. Founder Capital
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isLoansActive ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isLoansActive ? 'DEBT ACTIVE' : 'ZERO DEBT (100% EQUITY)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Remaining Founder Capital</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {formatPaiseToRupees(remainingFounderCapitalPaise.toString())}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Active Loans Liability</span>
                  <span className={`text-base font-black font-mono ${isLoansActive ? 'text-rose-400' : 'text-slate-400'}`}>
                    {isLoansActive ? formatPaiseToRupees(activeLoansPaise.toString()) : '₹0 (Paused)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar Ratio */}
            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-emerald-400">Founder Equity: {founderEquityRatio.toFixed(0)}%</span>
                <span className={isLoansActive ? 'text-amber-400' : 'text-slate-500'}>
                  Loan Debt: {loanDebtRatio.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${founderEquityRatio}%` }}
                  title={`Founder Capital: ${founderEquityRatio.toFixed(0)}%`}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${loanDebtRatio}%` }}
                  title={`Active Loans: ${loanDebtRatio.toFixed(0)}%`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. THE 3 MASTER FINANCIAL HERO CARDS (ALWAYS CRYSTAL CLEAR) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Money I Have Now */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Money I Have Now
            </span>
            <button
              onClick={() => setIsCapitalModalOpen(true)}
              className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/40 transition flex items-center gap-1"
              title="Edit Imran's self-funded capital"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Funds</span>
            </button>
          </div>

          <div className="text-4xl font-black text-white tracking-tight my-2 font-mono">
            {formatPaiseToRupees(cashflow.moneyIHaveNow.toString())}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Available liquid cash based on currently active operational modules.
          </p>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Founder Self-Funds Injected:</span>
              <span className="font-bold font-mono text-emerald-400">
                {formatPaiseToRupees(cashflow.founderCapitalPaise.toString())}
              </span>
            </div>
            {isLoansActive && (
              <div className="flex justify-between text-amber-300">
                <span>Financier Loans Received:</span>
                <span className="font-bold font-mono">
                  {formatPaiseToRupees(cashflow.totalLoanReceived.toString())}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Money Already Paid Out:</span>
              <span className="font-bold font-mono text-rose-300">
                -{formatPaiseToRupees(cashflow.moneyAlreadyPaid.toString())}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Money Already Paid */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-950/70 via-slate-900 to-slate-950 border-2 border-sky-500/50 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Money Already Paid
            </span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 font-extrabold px-2.5 py-0.5 rounded-full border border-sky-500/40">
              DISBURSED
            </span>
          </div>

          <div className="text-4xl font-black text-sky-300 tracking-tight my-2 font-mono">
            {formatPaiseToRupees(cashflow.moneyAlreadyPaid.toString())}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Total verified money paid out to date for prototype parts and logged crew.
          </p>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">64 Prototype Parts:</span>
              <span className="font-bold font-mono text-slate-100">
                {formatPaiseToRupees(cashflow.totalGeneratorCost.toString())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Salaries & Payouts Paid:</span>
              <span className="font-bold font-mono text-slate-100">
                {formatPaiseToRupees(cashflow.totalExpensesPaid.toString())}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Money I Have to Pay */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Money I Have to Pay
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/40">
              UPCOMING
            </span>
          </div>

          <div className="text-4xl font-black text-amber-300 tracking-tight my-2 font-mono">
            {formatPaiseToRupees(cashflow.moneyIHaveToPay.toString())}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Current mandatory commitments: active monthly payroll for {activeEmployees.length} staff.
          </p>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Monthly Payroll:</span>
              <span className="font-bold font-mono text-amber-300">
                {formatPaiseToRupees(cashflow.monthlyPayroll.toString())} / mo
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Financier Debt:</span>
              {isLoansActive ? (
                <span className="font-bold font-mono text-rose-300">
                  {formatPaiseToRupees(cashflow.totalLoanOutstanding.toString())}
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">₹0 (Paused)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2.5 6-MONTH CASH-ON-HAND HISTORY LINE CHART (RECHARTS)  */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">
                  6-Month Cash-on-Hand History & Liquid Trend
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  RECHARTS LINE CHART
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Month-by-month closing liquid reserves from May 2026 capital injection to current October 2026 live balance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Style Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setCashChartStyle('area')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  cashChartStyle === 'area'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Area Fill
              </button>
              <button
                type="button"
                onClick={() => setCashChartStyle('line')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  cashChartStyle === 'line'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clean Line
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              <span>Today:</span>
              <span>{formatPaiseToRupees(cashflow.moneyIHaveNow.toString(), { compact: true })}</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards above the chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">Peak Capital Base</span>
            <span className="text-sm font-bold text-sky-400 font-mono">
              ₹{(Number(stageSettings.founderFundsPaise || '200000000') / 10000000).toFixed(2)} Lakhs
            </span>
            <span className="text-[10px] text-slate-500 block">Founder Seed (May 26)</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">6-Mo Disbursed Spend</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              -{formatPaiseToRupees(cashflow.moneyAlreadyPaid.toString())}
            </span>
            <span className="text-[10px] text-slate-500 block">64 Parts + Payroll Logged</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">Avg Monthly Burn</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              ~₹{(Number(cashflow.moneyAlreadyPaid) / 10000000 / 6).toFixed(2)} L/mo
            </span>
            <span className="text-[10px] text-slate-500 block">Prototype Development</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
            <span className="text-emerald-400 font-bold block text-[10px] mb-0.5 uppercase tracking-wide">
              Liquid Cash Runway
            </span>
            <span className="text-base font-black text-emerald-300 font-mono">
              {Number(cashflow.monthlyPayroll) > 0
                ? `~${Math.max(1, Math.round(Number(cashflow.moneyIHaveNow) / Number(cashflow.monthlyPayroll)))} Months`
                : '12+ Months'}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block">At Active Crew Level</span>
          </div>
        </div>

        {/* Recharts Line / Area Chart */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sixMonthCashHistory}
              margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="cashAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v) => `₹${v}L`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CashHistoryTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="cashOnHandLakhs"
                name="Closing Cash on Hand (₹ Lakhs)"
                stroke="#10b981"
                strokeWidth={3.5}
                fill={cashChartStyle === 'area' ? 'url(#cashAreaGradient)' : 'transparent'}
                dot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="outflowLakhs"
                name="Monthly Outflow Spend (₹ Lakhs)"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f43f5e' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* ======================================================== */}
      {/* 4. RECHARTS FINANCIAL VISUALIZATION                      */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white tracking-wide">
                Financial Trajectory: Revenue vs. Expenses & Tax Deductions Over Time
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize how transitioning through business stages impacts your bottom line after all costs and corporate tax ({corporateTaxRate}%).
            </p>
          </div>

          {/* Toggle between By Business Stage and 12-Month Projections */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setChartViewMode('stages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartMode === 'stages'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              By Business Stage
            </button>
            <button
              onClick={() => setChartViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                chartMode === 'monthly'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              12-Month Trajectory
            </button>
          </div>
        </div>

        {/* Metric Highlights above chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">Projected Revenue</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              ₹{(simulatorPriceLakhs * (chartMode === 'stages' ? 30 : 6)).toFixed(1)} Lakhs
            </span>
            <span className="text-[10px] text-slate-500 block">Gross Inflows</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">Direct & Ops Costs</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              ₹{(chartMode === 'stages' ? 132.5 : 26.2).toFixed(1)} Lakhs
            </span>
            <span className="text-[10px] text-slate-500 block">BOM + Payroll + Factory</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] mb-0.5">Corporate Tax ({corporateTaxRate}%)</span>
            <span className="text-sm font-bold text-purple-400 font-mono">
              ₹{(chartMode === 'stages' ? 15.6 : 3.2).toFixed(1)} Lakhs
            </span>
            <span className="text-[10px] text-slate-500 block">Statutory Liability</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
            <span className="text-emerald-400 font-bold block text-[10px] mb-0.5 uppercase tracking-wide">
              Net Profit (Bottom Line)
            </span>
            <span className="text-base font-black text-emerald-300 font-mono">
              +₹{(chartMode === 'stages' ? 46.9 : 9.6).toFixed(1)} Lakhs
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block">After All Deductions</span>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartMode === 'stages' ? stageChartData : monthlyChartData}
              margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v) => `₹${v}L`}
              />
              <Tooltip content={<CustomChartTooltip corporateTaxRate={corporateTaxRate || 25} />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
              />
              <Bar dataKey="revenue" name="Revenue (₹ Lakhs)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses (₹ Lakhs)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tax" name={`Tax Deductions (${corporateTaxRate}%)`} fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="netProfit"
                name="Net Profit (Bottom Line)"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* ======================================================== */}
      {/* 5. MODE-SPECIFIC BODY: ONLY SHOW WHAT BELONGS TO THIS MODE */}
      {/* ======================================================== */}

      {/* -------------------------------------------------------- */}
      {/* MODE 1: PROTOTYPE MODE BODY                              */}
      {/* -------------------------------------------------------- */}
      {currentStage === 'prototype' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-emerald-400">
                  🛠️ Active Prototype Build Status
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  30kVA Acoustic Prototype
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                You are currently in Prototype Mode. Your prototype is being fabricated with a target cap of ₹16,00,000.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Prototype Budget Utilized:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {prototypePercentUtilized.toFixed(1)}% ({formatPaiseToRupees(prototypeCostPaise.toString())} / ₹16L)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${prototypePercentUtilized}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
              <span>₹0</span>
              <span>₹8,00,000 (Halfway)</span>
              <span>₹16,00,000 Target Cap</span>
            </div>
          </div>

          {/* 2 Focused Cards for Prototype Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-400" /> 64 Real Parts Fabricated:
                </span>
                <button
                  onClick={() => togglePanel('parts')}
                  className="text-xs text-emerald-400 hover:underline font-bold"
                >
                  View Parts List →
                </button>
              </div>
              <div className="text-xl font-black text-white font-mono">
                {formatPaiseToRupees(prototypeCostPaise.toString())}
              </div>
              <p className="text-slate-400">
                Alternator, Crompton motors, acoustic canopy, Sardar Ji lathe work & IIT engineering.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" /> Active Prototype Crew (5):
                </span>
                <button
                  onClick={() => setIsStaffModalOpen(true)}
                  className="text-xs text-sky-400 hover:underline font-bold"
                >
                  Change Crew →
                </button>
              </div>
              <div className="text-xl font-black text-white font-mono">
                {formatPaiseToRupees(activePayrollPaise.toString())} / mo
              </div>
              <p className="text-slate-400">
                Imran (CMD), Pappu Bhai (COO), Simran (Director-Ops), Naushad Bhai & Wahid. (Remaining 19 paused).
              </p>
            </div>

            {/* Quick Link to Margin & Price Calculator inside Stage 1 */}
            {onOpenPriceCalculator && (
              <div className="sm:col-span-2 p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Selling Price & Profit Margin Percentage Calculator</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Interactive
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Simulate target unit selling prices (₹2.0L to ₹35.0L), calculate gross margins %, markups, and post-tax net profit return.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenPriceCalculator}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/40 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Open Margin Calculator</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* MODE 2: PILOT & SELLING BODY (EXPANDED SLIDER RANGE)     */}
      {/* -------------------------------------------------------- */}
      {currentStage === 'selling' && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 lg:p-7 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-indigo-400">
                  ⚡ Pilot Sales Launch & Price Bench
                </span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
                  Stage 2 Interactive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Taking pilot orders. Drag the slider or type any target selling price (₹2.0L to ₹30.0L) to simulate unit profit margins and team payouts.
              </p>
            </div>
          </div>

          {/* Interactive Slider Bar with Expanded Range & Number Input */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Target Selling Price per Unit:
              </span>

              {/* Direct Number Input + Live Display */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="50.0"
                    value={simulatorPriceLakhs}
                    onChange={(e) => setSimulatorPriceLakhs(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-28 bg-slate-900 border border-indigo-500/60 rounded-xl pl-6 pr-2 py-1.5 text-indigo-300 font-mono font-black text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <span className="text-xs font-bold text-slate-300">Lakhs</span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  (= ₹{(simulatorPriceLakhs * 100000).toLocaleString('en-IN')})
                </span>
              </div>
            </div>

            {/* Slider Range from 2.0 to 30.0 Lakhs */}
            <input
              type="range"
              min="2.0"
              max="30.0"
              step="0.1"
              value={simulatorPriceLakhs}
              onChange={(e) => setSimulatorPriceLakhs(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition"
            />

            {/* Quick Benchmark Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 block font-semibold">
                Quick Market Benchmark Buttons (Click to apply):
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: '₹3.5L (Economy Base)', val: 3.5 },
                  { label: '₹4.5L (Break-even)', val: 4.5 },
                  { label: '₹6.0L (Standard Silent)', val: 6.0 },
                  { label: '₹6.5L (Acoustic Commercial)', val: 6.5 },
                  { label: '₹8.5L (Premium Industrial)', val: 8.5 },
                  { label: '₹12.0L (Heavy Duty)', val: 12.0 },
                  { label: '₹18.0L (High Spec)', val: 18.0 },
                  { label: '₹25.0L (Turnkey Setup)', val: 25.0 },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => setSimulatorPriceLakhs(b.val)}
                    className={`px-2.5 py-1 rounded-lg border font-mono transition ${
                      Math.abs(simulatorPriceLakhs - b.val) < 0.05
                        ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Profit Output Cards with Corporate Tax and Net Profit View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Unit Gross Profit & Estimated Tax */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Unit Commercial P&L</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Base: ₹3.80L Direct
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Gross Unit Profit:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  +{formatPaiseToRupees(simUnitProfitPaise.toString())}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800 text-xs">
                <span className="text-amber-400">Est. Corporate Tax ({corporateTaxRate}%):</span>
                <span className="font-bold text-rose-400 font-mono">
                  -{formatPaiseToRupees(simEstimatedTaxPaise.toString())}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                Statutory deduction computed on commercial selling profit.
              </div>
            </div>

            {/* Net Profit per Unit (Highlighted) */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border-2 border-emerald-500/50 shadow-xl space-y-1 relative overflow-hidden bg-gradient-to-br from-emerald-950/30 to-slate-950">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Unit Net Profit (After Tax)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {simNetMarginPercent.toFixed(1)}% NET MARGIN
                </span>
              </div>
              <div className="text-3xl font-black text-white font-mono my-1">
                +{formatPaiseToRupees(simUnitNetProfitPaise.toString())}
              </div>
              <span className="text-[11px] text-slate-300 block">
                Actual bottom-line distributable profit per 30kVA unit sold.
              </span>
            </div>

            {/* Imran CMD 40% Net Share */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-amber-500/40 shadow-lg space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                <span className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Imran (CMD 40% Net)
                </span>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-mono">75% Equity</span>
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {formatPaiseToRupees(simImranProfitPaise.toString())}
              </div>
              <span className="text-[10px] text-slate-400 block">Founder net profit take-home per unit</span>
            </div>
          </div>

          {/* Secondary partner row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Pappu Bhai COO 10% */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-sky-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-400 block">Pappu Bhai (COO 10% Net)</span>
                <span className="text-[10px] text-slate-400">Operations & Plant Execution Lead</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-sky-300 font-mono">
                  {formatPaiseToRupees(simPappuProfitPaise.toString())}
                </span>
                <span className="text-[10px] text-slate-500 block">Per unit net share</span>
              </div>
            </div>

            {/* All Core Leads 100% */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-400 block">All 8 Core Leaders Combined (100% Net)</span>
                <span className="text-[10px] text-slate-400">Total Net Team Distribution</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-purple-300 font-mono">
                  {formatPaiseToRupees(simUnitNetProfitPaise.toString())}
                </span>
                <span className="text-[10px] text-slate-500 block">Across 8 partners</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* MODE 3: FULL SCALE COMPANY MODE BODY                     */}
      {/* -------------------------------------------------------- */}
      {currentStage === 'full' && (
        <FullScaleCompanyTaxLedger
          products={products}
          bomLineItems={bomLineItems}
          employees={employees}
          loans={loans}
          expenses={expenses}
          construction={construction}
          currentStage={currentStage}
          onSwitchStage={onSwitchStage}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SELECT WHO IS HIRED / ACTIVE                    */}
      {/* ======================================================== */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 lg:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-400" />
                  Select Active Staff on Payroll
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Turn employees ON or OFF. Non-hired employees are frozen and will <strong className="text-white">NOT deduct</strong> from your cash balance.
                </p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets with Active Indicators */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleApplyCrewPreset('prototype_crew')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border cursor-pointer ${
                  selectedCrewPreset === 'prototype_crew'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/30 font-black ring-2 ring-emerald-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <span>🛠️ Set: Prototype Crew (5 Active)</span>
                {selectedCrewPreset === 'prototype_crew' && (
                  <span className="text-[10px] bg-emerald-500/30 px-1.5 py-0.2 rounded font-mono">ON TOP</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleApplyCrewPreset('core_partners')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border cursor-pointer ${
                  selectedCrewPreset === 'core_partners'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-900/30 font-black ring-2 ring-sky-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-sky-500/30'
                }`}
              >
                <span>⚡ Set: 8 Core Leaders (₹2.60L/mo)</span>
                {selectedCrewPreset === 'core_partners' && (
                  <span className="text-[10px] bg-sky-500/30 px-1.5 py-0.2 rounded font-mono">ON TOP</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleApplyCrewPreset('all_staff')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border cursor-pointer ${
                  selectedCrewPreset === 'all_staff'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30 font-black ring-2 ring-purple-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-400 border-purple-500/30'
                }`}
              >
                <span>🏭 Set: All 24 Staff (₹5.21L/mo)</span>
                {selectedCrewPreset === 'all_staff' && (
                  <span className="text-[10px] bg-purple-500/30 px-1.5 py-0.2 rounded font-mono">RANKED BY POST</span>
                )}
              </button>
            </div>

            {/* Contextual sort & status explanation */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-300">
                  {selectedCrewPreset === 'prototype_crew' && (
                    <><strong>5 Core Leaders Active on Top</strong> (CMD Imran, COO Pappu Bhai, Director Simran, Plant Mgr Naushad Bhai, Head of Ops Wahid). Remaining 19 staff paused below.</>
                  )}
                  {selectedCrewPreset === 'core_partners' && (
                    <><strong>8 Core Leaders Active on Top</strong> (CMD, COO, Director, Plant Mgr, Head of Ops, BD Head, Chief Engineers). Remaining 16 staff paused below.</>
                  )}
                  {selectedCrewPreset === 'all_staff' && (
                    <><strong>All 24 Staff Hired & Active</strong> • Sorted by executive post hierarchy (Highest post on top down to junior team).</>
                  )}
                  {selectedCrewPreset === 'custom' && (
                    <><strong>Custom Selection</strong> • Active staff ({activeEmployees.length}) appear on top sorted by post seniority.</>
                  )}
                </span>
              </div>
              <span className="text-emerald-400 font-mono font-bold shrink-0">
                {formatPaiseToRupees(activePayrollPaise.toString())}/mo
              </span>
            </div>

            {/* 24 Employees Checklist with Active Staff on Top and Post Hierarchy */}
            <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto pr-1 space-y-1">
              {sortedStaffList.map((emp, index) => {
                const isActive = emp.status === 'active';
                const isFirstNonHired = !isActive && (index === 0 || sortedStaffList[index - 1]?.status === 'active');
                const isFirstActive = isActive && index === 0;

                return (
                  <React.Fragment key={emp.id}>
                    {/* Section banner before active staff */}
                    {isFirstActive && (
                      <div className="pt-1 pb-1.5 px-3 flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/20 rounded-lg mb-1 border border-emerald-500/20">
                        <span className="flex items-center gap-1.5">
                          <span>🟢 Active on Payroll ({activeEmployees.length} Staff)</span>
                          <span className="text-[10px] text-emerald-300/70 font-normal lowercase">
                            {selectedCrewPreset === 'all_staff' || activeEmployees.length === sortedStaffList.length
                              ? '(all hired • sorted by executive post)'
                              : '(on top • sorted by executive post)'}
                          </span>
                        </span>
                        <span className="font-mono text-emerald-300">
                          {formatPaiseToRupees(activePayrollPaise.toString())}/mo
                        </span>
                      </div>
                    )}

                    {/* Section banner before non-hired staff */}
                    {isFirstNonHired && activeEmployees.length > 0 && (
                      <div className="pt-3 pb-1.5 px-3 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40 rounded-lg my-1 border border-slate-800/60">
                        <span className="flex items-center gap-1.5">
                          <span>⚪ Paused / Not Hired Staff ({notHiredEmployees.length})</span>
                          <span className="text-[10px] text-slate-500 font-normal lowercase">(sorted by post)</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-normal">₹0 deducted</span>
                      </div>
                    )}

                    <div
                      className={`py-2.5 px-3 flex items-center justify-between text-xs rounded-xl transition ${
                        isActive
                          ? 'bg-slate-950/80 hover:bg-slate-800/50 border border-emerald-500/20'
                          : 'bg-slate-950/40 hover:bg-slate-800/30 opacity-70 hover:opacity-100 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-slate-500 w-5">
                            #{index + 1}
                          </span>
                          <span className={`font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">({emp.category})</span>
                          {isActive ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                              NOT HIRED
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate mt-0.5 font-medium">
                          {emp.post || 'Team Member'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-mono font-bold ${isActive ? 'text-slate-100' : 'text-slate-500'}`}>
                          {formatPaiseToRupees(emp.monthlySalary)}/mo
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(emp.id, isActive ? 'active' : 'not_hired')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          }`}
                        >
                          {isActive ? 'Mark Not Hired' : 'Hire & Activate'}
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-950/40"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT FOUNDER CAPITAL / SELF-FUNDS               */}
      {/* ======================================================== */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 lg:p-7 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Update Founder Capital (Imran)
              </h3>
              <button
                onClick={() => setIsCapitalModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter the actual amount of personal self-funds you have injected to build the 30kVA prototype:
            </p>

            <form onSubmit={handleSaveFounderCapital} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  Capital Injected (₹ Rupees):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    value={founderCapitalRupees}
                    onChange={(e) => setFounderCapitalRupees(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                    placeholder="2000000"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1.5">
                  Example: 2000000 = ₹20,00,000 (Twenty Lakhs)
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40"
                >
                  Save Capital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
