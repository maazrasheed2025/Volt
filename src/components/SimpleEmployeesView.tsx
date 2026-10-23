import React, { useState, useMemo, useEffect } from 'react';
import { Employee, Expense, ProductPrototype, BOMLineItem, StageSettings } from '../types.ts';
import { formatPaiseToRupees, rupeesToPaise, getPostSeniorityScore } from '../utils/calculations.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Percent,
  Banknote,
  Briefcase,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowUpRight,
  PieChart,
  Crown,
  Cog,
  UserCheck,
  Truck,
  Search,
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  ChevronDown,
  Wrench,
  Lock,
  Undo2,
  RotateCcw,
  AlertTriangle,
  X,
  History,
  FileText,
  Check,
  Phone,
  Mail,
  MapPin,
  ArrowUpDown,
  SlidersHorizontal,
  Image as ImageIcon,
  Camera,
  Upload,
  Crop,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface SimpleEmployeesViewProps {
  employees: Employee[];
  expenses: Expense[];
  products?: ProductPrototype[];
  bomLineItems?: BOMLineItem[];
  stageSettings?: StageSettings;
  corporateTaxRate?: number;
  onUpdateTaxRate?: (rate: number) => Promise<void>;
  onToggleEmployeeStatus?: (employeeId: number, status: 'active' | 'not_hired') => Promise<void>;
  onAddEmployee: (emp: Partial<Employee>) => Promise<void>;
  onUpdateEmployee: (id: number, updates: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: number) => Promise<void>;
  onPaySalary: (employeeId: number, amountPaise?: string, monthYear?: string) => Promise<void>;
  onPayAllSalaries?: (monthYear?: string) => Promise<void>;
  onUndoSalaryPayment?: (employeeId?: number, monthYear?: string, expenseId?: number) => Promise<void>;
  onDeleteExpense?: (id: number) => Promise<void>;
  onUpdateExpense?: (id: number, updates: Partial<Expense>) => Promise<void>;
  onDistributeProfit?: (data: {
    totalProfitPaise: string;
    corporateTaxRatePercent?: number;
    taxDeductedPaise?: string;
    netProfitPaise?: string;
    sourceDescription: string;
    distributions: Array<{
      partnerName: string;
      shareholdingPercent: string;
      dividendPercent: string;
      amountPaise: string;
      employeeId?: string;
    }>;
  }) => Promise<void>;
  onUndoProfitDistribution?: (params: { expenseId?: number; batchReference?: string; date?: string }) => Promise<void>;
  userRole?: string;
}

export const SimpleEmployeesView: React.FC<SimpleEmployeesViewProps> = ({
  employees,
  expenses,
  products = [],
  bomLineItems = [],
  stageSettings,
  corporateTaxRate = 25,
  onUpdateTaxRate,
  onToggleEmployeeStatus,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onPaySalary,
  onPayAllSalaries,
  onUndoSalaryPayment,
  onDeleteExpense,
  onUpdateExpense,
  onDistributeProfit,
  onUndoProfitDistribution,
  userRole,
}) => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfitDistModalOpen, setIsProfitDistModalOpen] = useState(false);
  const [isBatchSalaryModalOpen, setIsBatchSalaryModalOpen] = useState(false);
  const [isManageDisbursementsModalOpen, setIsManageDisbursementsModalOpen] = useState(false);
  const [isUndoConfirmModalOpen, setIsUndoConfirmModalOpen] = useState(false);
  const [undoTarget, setUndoTarget] = useState<{ emp?: Employee; expense?: Expense; isAll?: boolean } | null>(null);
  const [isUndoingSalary, setIsUndoingSalary] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Edit Salary Disbursement Modal State
  const [isEditSalaryModalOpen, setIsEditSalaryModalOpen] = useState(false);
  const [editingSalaryExpense, setEditingSalaryExpense] = useState<Expense | null>(null);
  const [editSalaryAmountRupees, setEditSalaryAmountRupees] = useState('');
  const [editSalaryDate, setEditSalaryDate] = useState('');
  const [editSalaryRef, setEditSalaryRef] = useState('');
  const [editSalaryStatus, setEditSalaryStatus] = useState<'paid' | 'pending'>('paid');
  const [isSavingSalaryEdit, setIsSavingSalaryEdit] = useState(false);

  // Manage Disbursed Profits Modal State
  const [isManageProfitsModalOpen, setIsManageProfitsModalOpen] = useState(false);
  const [isEditProfitModalOpen, setIsEditProfitModalOpen] = useState(false);
  const [editingProfitExpense, setEditingProfitExpense] = useState<Expense | null>(null);
  const [editProfitAmountRupees, setEditProfitAmountRupees] = useState('');
  const [editProfitDate, setEditProfitDate] = useState('');
  const [editProfitVendor, setEditProfitVendor] = useState('');
  const [editProfitSubCategory, setEditProfitSubCategory] = useState('');
  const [editProfitNotes, setEditProfitNotes] = useState('');
  const [isSavingProfitEdit, setIsSavingProfitEdit] = useState(false);

  // Confirm Profit Deletion Modal State
  const { isDark } = useTheme();
  const [isUndoProfitConfirmModalOpen, setIsUndoProfitConfirmModalOpen] = useState(false);
  const [undoProfitTarget, setUndoProfitTarget] = useState<{ expense?: Expense; batchReference?: string; date?: string; isAll?: boolean } | null>(null);
  const [isUndoingProfit, setIsUndoingProfit] = useState(false);

  // Filter, Sort & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'seniority' | 'salary_desc' | 'salary_asc' | 'name_asc' | 'join_date_desc' | 'join_date_asc'>('seniority');
  const [salaryRange, setSalaryRange] = useState<'all' | 'under_20k' | '20k_30k' | 'above_30k'>('all');

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [post, setPost] = useState('');
  const [category, setCategory] = useState('Core Team');
  const [monthlySalaryRupees, setMonthlySalaryRupees] = useState('');
  const [shareholdingPercent, setShareholdingPercent] = useState('0.00');
  const [profitSharePercent, setProfitSharePercent] = useState('0.00');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [location, setLocation] = useState('');

  // 1:1 Aspect Ratio Photo Cropper States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffset, setCropOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropRotation, setCropRotation] = useState<number>(0);

  // Mobile camera / gallery file upload handler - prompts mandatory 1:1 crop modal
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate supported image file types
    if (!file.type.startsWith('image/')) {
      setNotification({
        message: 'Unsupported file type. Please select a valid image (JPEG, PNG, WEBP, or HEIC).',
        type: 'info',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCropSourceImage(dataUrl);
        setCropZoom(1);
        setCropOffset({ x: 0, y: 0 });
        setCropRotation(0);
        setIsCropModalOpen(true);
      }
    };
    reader.onerror = () => {
      setNotification({
        message: 'Unable to process image file. Please select another image from camera or gallery.',
        type: 'info',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenCropForCurrent = () => {
    if (avatarUrl) {
      setCropSourceImage(avatarUrl);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropRotation(0);
      setIsCropModalOpen(true);
    }
  };

  const handleApplyCrop = () => {
    if (!cropSourceImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const TARGET_SIZE = 256;
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const minDim = Math.min(natW, natH);
      const cropW = minDim / cropZoom;
      const cropH = minDim / cropZoom;

      // Center with offset
      let srcX = (natW - cropW) / 2 - (cropOffset.x / 140) * (cropW / 2);
      let srcY = (natH - cropH) / 2 - (cropOffset.y / 140) * (cropH / 2);

      srcX = Math.max(0, Math.min(natW - cropW, srcX));
      srcY = Math.max(0, Math.min(natH - cropH, srcY));

      ctx.save();
      if (cropRotation !== 0) {
        ctx.translate(TARGET_SIZE / 2, TARGET_SIZE / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        ctx.drawImage(img, srcX, srcY, cropW, cropH, -TARGET_SIZE / 2, -TARGET_SIZE / 2, TARGET_SIZE, TARGET_SIZE);
      } else {
        ctx.drawImage(img, srcX, srcY, cropW, cropH, 0, 0, TARGET_SIZE, TARGET_SIZE);
      }
      ctx.restore();

      const finalUrl = canvas.toDataURL('image/jpeg', 0.88);
      setAvatarUrl(finalUrl);
      setIsCropModalOpen(false);
      showNotification('1:1 Profile photo cropped & applied!');
    };
    img.src = cropSourceImage;
  };

  // Default Factory Contacts Directory for all 24 team members
  const DEFAULT_STAFF_CONTACTS: Record<string, { phone: string; email: string; avatarUrl?: string; emergencyContact?: string; location?: string }> = {
    'EMP-001': { phone: '+91 98110 54321', email: 'imran@voltedge.in', location: 'Kanpur Works / Executive Suite', emergencyContact: '+91 98110 54320' },
    'EMP-002': { phone: '+91 98221 65432', email: 'pappu.bhai@voltedge.in', location: 'Plant 1 Operations Floor', emergencyContact: '+91 98221 65430' },
    'EMP-003': { phone: '+91 98332 76543', email: 'simran@voltedge.in', location: 'Operations Directorate', emergencyContact: '+91 98332 76540' },
    'EMP-004': { phone: '+91 98443 11111', email: 'supriya@voltedge.in', location: 'Core Strategy Office', emergencyContact: '+91 98443 11110' },
    'EMP-005': { phone: '+91 98443 87654', email: 'naushad@voltedge.in', location: 'Assembly Shed & Lathe', emergencyContact: '+91 98443 87650' },
    'EMP-006': { phone: '+91 98554 98765', email: 'wahid@voltedge.in', location: 'Testing Bay & Transmission', emergencyContact: '+91 98554 98760' },
    'EMP-007': { phone: '+91 98665 09876', email: 'kumail@voltedge.in', location: 'Business Development Desk', emergencyContact: '+91 98665 09870' },
    'EMP-008': { phone: '+91 98776 10987', email: 'ramendra.iit@voltedge.in', location: 'R&D Diagnostics Bench', emergencyContact: '+91 98776 10980' },
    'EMP-009': { phone: '+91 98887 21098', email: 'vijay.iit@voltedge.in', location: 'Power Generation & AVR', emergencyContact: '+91 98887 21090' },
    'EMP-010': { phone: '+91 98998 32109', email: 'anurag.cad@voltedge.in', location: 'CAD Design & Prototyping Lab', emergencyContact: '+91 98998 32100' },
    'EMP-011': { phone: '+91 98109 43210', email: 'mahtab.acc@voltedge.in', location: 'Accounts & Billing Desk', emergencyContact: '+91 98109 43211' },
    'EMP-012': { phone: '+91 98210 54321', email: 'jameel.ops@voltedge.in', location: 'Shopfloor Team Lead Bay', emergencyContact: '+91 98210 54322' },
    'EMP-013': { phone: '+91 98321 65432', email: 'neel.ea@voltedge.in', location: 'Executive Communications', emergencyContact: '+91 98321 65433' },
    'EMP-014': { phone: '+91 98432 76543', email: 'akash.mkt@voltedge.in', location: 'Marketing & Sales Field', emergencyContact: '+91 98432 76544' },
    'EMP-015': { phone: '+91 98543 87654', email: 'maya.hr@voltedge.in', location: 'HR & Administration Desk', emergencyContact: '+91 98543 87655' },
    'EMP-016': { phone: '+91 98654 98765', email: 'partnerships@voltedge.in', location: 'Commercial Partnerships', emergencyContact: '+91 98654 98766' },
    'EMP-017': { phone: '+91 98765 09876', email: 'vikas.crm@voltedge.in', location: 'Client Relations Field', emergencyContact: '+91 98765 09877' },
    'EMP-018': { phone: '+91 98876 10987', email: 'dispatch@voltedge.in', location: 'Logistics & Dispatch Gate', emergencyContact: '+91 98876 10988' },
    'EMP-019': { phone: '+91 98987 21098', email: 'it.support@voltedge.in', location: 'MIS & Server Room', emergencyContact: '+91 98987 21099' },
    'EMP-020': { phone: '+91 98198 32109', email: 'faiz.field@voltedge.in', location: 'Field Installation Hub', emergencyContact: '+91 98198 32101' },
    'EMP-021': { phone: '+91 98209 43210', email: 'bilal.ops@voltedge.in', location: 'Junior Operations Training', emergencyContact: '+91 98209 43211' },
    'EMP-022': { phone: '+91 98310 54321', email: 'shekhu.site@voltedge.in', location: 'Hiraman Purwa Site', emergencyContact: '+91 98310 54322' },
    'EMP-023': { phone: '+91 98421 65432', email: 'ikhlaq.field@voltedge.in', location: 'Chamanganj Sub-Center', emergencyContact: '+91 98421 65433' },
    'EMP-024': { phone: '+91 98532 76543', email: 'sammy.intern@voltedge.in', location: 'Management Trainee Desk', emergencyContact: '+91 98532 76544' },
  };

  const [staffContacts, setStaffContacts] = useState<Record<string, { phone: string; email: string; avatarUrl?: string; emergencyContact?: string; location?: string }>>(() => {
    try {
      const stored = localStorage.getItem('voltedge_staff_contacts') || localStorage.getItem('voltmax_staff_contacts');
      if (stored) {
        return { ...DEFAULT_STAFF_CONTACTS, ...JSON.parse(stored) };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_STAFF_CONTACTS;
  });

  // Stage Crew Definition:
  // Stage 1 (Prototype): 5 employees
  // Stage 2 (Pilot & Selling): 8 employees
  // Stage 3 (Full Scale): all employees
  const STAGE_1_CREW = ['Imran', 'Pappu Bhai', 'Simran', 'Naushad Bhai', 'Wahid'];
  const STAGE_2_CREW = ['Imran', 'Pappu Bhai', 'Simran', 'Naushad Bhai', 'Wahid', 'Kumail', 'Ramendra IIT', 'Vijay IIT'];

  // Profit Distribution Calculator states
  const defaultGenProfitRupees = useMemo(() => {
    const proto = products.find((p) => p.productLine === 'Generator Set') || products[0];
    if (!proto) return '200000';
    const protoBoms = bomLineItems.filter((b) => b.productId === proto.productId && !b.isMiscategorized);
    const costPaise = protoBoms.reduce((acc, b) => acc + BigInt(b.amount || 0), 0n);
    const pricePaise = BigInt(proto.sellingPrice || '65000000');
    if (pricePaise > costPaise) {
      return (Number(pricePaise - costPaise) / 100).toString();
    }
    return '200000';
  }, [products, bomLineItems]);

  const [grossProfitRupees, setGrossProfitRupees] = useState(defaultGenProfitRupees);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(corporateTaxRate || 25);
  const [isDeductTaxEnabled, setIsDeductTaxEnabled] = useState<boolean>(true);
  const [profitSourceNote, setProfitSourceNote] = useState('Profit from Generator Sales');
  const [isSubmittingDist, setIsSubmittingDist] = useState(false);
  const [isSubmittingBatchSalaries, setIsSubmittingBatchSalaries] = useState(false);

  // Computed Tax and Net Distributable Profit
  const effectiveTaxRate = isDeductTaxEnabled ? taxRatePercent : 0;
  const grossProfitPaise = BigInt(rupeesToPaise(grossProfitRupees || '0'));
  const calculatedTaxLiabilityPaise = (grossProfitPaise * BigInt(Math.round(effectiveTaxRate * 100))) / 10000n;
  const netProfitPaise = grossProfitPaise > calculatedTaxLiabilityPaise ? grossProfitPaise - calculatedTaxLiabilityPaise : 0n;
  const netProfitRupees = (Number(netProfitPaise) / 100).toString();

  // Month tracking for payroll
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthDisplay = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Compute active employees and total monthly payroll
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const notHiredEmployees = employees.filter((e) => e.status === 'not_hired');
  const totalMonthlyPayrollPaise = activeEmployees.reduce(
    (acc, e) => acc + BigInt(e.monthlySalary || 0),
    0n
  );
  const pausedPayrollPaise = notHiredEmployees.reduce(
    (acc, e) => acc + BigInt(e.monthlySalary || 0),
    0n
  );

  // Calculate equity & profit share totals
  const totalAllocatedProfitShare = employees.reduce(
    (acc, e) => acc + (Number(e.dividendPercent) || 0),
    0
  );
  const totalShareholdingPercent = employees.reduce(
    (acc, e) => acc + (Number(e.shareholdingPercent) || 0),
    0
  );

  // Identify partner shareholders (dividendPercent > 0)
  const equityPartners = employees.filter((e) => Number(e.dividendPercent) > 0 || Number(e.shareholdingPercent) > 0);

  // All salary expenses across the entire history
  const allSalaryExpenses = useMemo(() => {
    return expenses.filter((exp) => exp.category === 'Payroll & Salaries')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);
  }, [expenses]);

  const [selectedDisbursementMonth, setSelectedDisbursementMonth] = useState<string>(currentMonth);

  // Available months with salary disbursements
  const salaryMonthsAvailable = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonth);
    allSalaryExpenses.forEach((exp) => {
      if (exp.date && exp.date.length >= 7) {
        months.add(exp.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [allSalaryExpenses, currentMonth]);

  // Expenses for salaries this month
  const salaryExpensesThisMonth = useMemo(() => {
    return allSalaryExpenses.filter((exp) => exp.date.startsWith(currentMonth));
  }, [allSalaryExpenses, currentMonth]);

  const paidEmployeeNamesThisMonth = useMemo(() => {
    return new Set(salaryExpensesThisMonth.map((exp) => exp.vendorName));
  }, [salaryExpensesThisMonth]);

  const totalSalariesPaidThisMonthPaise = salaryExpensesThisMonth.reduce(
    (acc, exp) => acc + BigInt(exp.amount || 0),
    0n
  );

  // All profit distributions & associated corporate tax vouchers
  const profitDistExpenses = useMemo(() => {
    return expenses
      .filter(
        (exp) =>
          exp.category === 'Profit Distribution & Dividends' ||
          (exp.category === 'Corporate Income Tax' && (exp.billReferenceNumber?.startsWith('IT-EST-TAX') || exp.subCategory?.includes('Corporate Income Tax')))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);
  }, [expenses]);

  const profitDistributionsTotalPaise = expenses
    .filter((exp) => exp.category === 'Profit Distribution & Dividends')
    .reduce((acc, exp) => acc + BigInt(exp.amount || 0), 0n);

  const totalProfitAndTaxDisbursedPaise = profitDistExpenses.reduce(
    (acc, exp) => acc + BigInt(exp.amount || 0),
    0n
  );

  // Helper to find specific salary expense for an employee
  const getEmployeeSalaryExpenseThisMonth = (emp: Employee) => {
    return salaryExpensesThisMonth.find(
      (exp) => exp.vendorName === emp.name || exp.billReferenceNumber.includes(emp.employeeId)
    );
  };

  // Filtered employees list (Respecting 3 hiring stages, post seniority score, and sort controls)
  const filteredEmployees = useMemo(() => {
    const currentStage = stageSettings?.currentStage || 'prototype';

    const isStageActive = (emp: Employee) => {
      if (currentStage === 'prototype') {
        return STAGE_1_CREW.includes(emp.name);
      } else if (currentStage === 'selling') {
        return STAGE_2_CREW.includes(emp.name);
      } else {
        return true;
      }
    };

    const list = employees.filter((emp) => {
      const contact = staffContacts[emp.employeeId] || {};
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.post || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.email || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory === 'active_only') {
        if (emp.status !== 'active') return false;
      } else if (selectedCategory === 'not_hired') {
        if (emp.status !== 'not_hired') return false;
      } else if (selectedCategory === 'partners') {
        if (Number(emp.dividendPercent) <= 0 && Number(emp.shareholdingPercent) <= 0) return false;
      } else if (selectedCategory !== 'all' && emp.category !== selectedCategory) {
        return false;
      }

      // Salary range filter
      const sal = BigInt(emp.monthlySalary || '0');
      if (salaryRange === 'under_20k' && sal >= 2000000n) return false;
      if (salaryRange === '20k_30k' && (sal < 2000000n || sal > 3000000n)) return false;
      if (salaryRange === 'above_30k' && sal <= 3000000n) return false;

      return true;
    });

    return list.sort((a, b) => {
      // 1. Explicit user criteria
      if (sortBy === 'salary_desc') {
        const diff = BigInt(b.monthlySalary || '0') - BigInt(a.monthlySalary || '0');
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      }
      if (sortBy === 'salary_asc') {
        const diff = BigInt(a.monthlySalary || '0') - BigInt(b.monthlySalary || '0');
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'join_date_desc') {
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      }
      if (sortBy === 'join_date_asc') {
        return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      }

      // Default: 'seniority' adhering to the 3-stage active ranking rule:
      // "if someone is active according to the company stage, they should be sorted by their post high to low, but under first 2 active staff should go in the top of the list but by their post"
      if (currentStage === 'prototype' || currentStage === 'selling') {
        const aActiveInStage = isStageActive(a) || a.status === 'active';
        const bActiveInStage = isStageActive(b) || b.status === 'active';
        if (aActiveInStage !== bActiveInStage) {
          return aActiveInStage ? -1 : 1;
        }
      } else {
        // Stage 3 (full scale): active staff go to top
        const aActive = a.status === 'active';
        const bActive = b.status === 'active';
        if (aActive !== bActive) {
          return aActive ? -1 : 1;
        }
      }

      // Within partition, sort by post seniority score high to low
      const scoreA = getPostSeniorityScore(a);
      const scoreB = getPostSeniorityScore(b);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      const salaryDiff = BigInt(b.monthlySalary || '0') - BigInt(a.monthlySalary || '0');
      return salaryDiff > 0n ? 1 : salaryDiff < 0n ? -1 : 0;
    });
  }, [employees, searchQuery, selectedCategory, salaryRange, sortBy, stageSettings?.currentStage, staffContacts]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setPost(emp.post || '');
    setCategory(emp.category);
    setMonthlySalaryRupees((Number(emp.monthlySalary) / 100).toString());
    setShareholdingPercent(emp.shareholdingPercent || '0.00');
    setProfitSharePercent(emp.dividendPercent || '0.00');

    const contact = staffContacts[emp.employeeId] || {};
    setPhone(contact.phone || emp.phone || '');
    setEmail(contact.email || emp.email || '');
    setAvatarUrl(contact.avatarUrl || emp.avatarUrl || '');
    setEmergencyContact(contact.emergencyContact || emp.emergencyContact || '');
    setLocation(contact.location || emp.location || '');

    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    // Update staff contact directory in state & localStorage
    const updatedContacts = {
      ...staffContacts,
      [editingEmployee.employeeId]: {
        phone,
        email,
        avatarUrl,
        emergencyContact,
        location,
      },
    };
    setStaffContacts(updatedContacts);
    try {
      localStorage.setItem('voltedge_staff_contacts', JSON.stringify(updatedContacts));
    } catch (err) {
      // ignore
    }

    await onUpdateEmployee(editingEmployee.id, {
      name,
      post,
      category,
      monthlySalary: rupeesToPaise(monthlySalaryRupees),
      shareholdingPercent,
      dividendPercent: profitSharePercent,
      isShareholder: Number(shareholdingPercent) > 0 || Number(profitSharePercent) > 0,
      phone,
      email,
      avatarUrl,
      emergencyContact,
      location,
    });

    setIsEditModalOpen(false);
    setEditingEmployee(null);
    showNotification(`Updated profile & contact details for ${name}`);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const empId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;

    // Update staff contact directory
    const updatedContacts = {
      ...staffContacts,
      [empId]: {
        phone,
        email,
        avatarUrl,
        emergencyContact,
        location,
      },
    };
    setStaffContacts(updatedContacts);
    try {
      localStorage.setItem('voltedge_staff_contacts', JSON.stringify(updatedContacts));
    } catch (err) {
      // ignore
    }

    await onAddEmployee({
      employeeId: empId,
      name,
      post,
      category,
      monthlySalary: rupeesToPaise(monthlySalaryRupees),
      shareholdingPercent,
      dividendPercent: profitSharePercent,
      isShareholder: Number(shareholdingPercent) > 0 || Number(profitSharePercent) > 0,
      isBonusEligible: true,
      isInsuranceEligible: true,
      phase: 1,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      phone,
      email,
      avatarUrl,
      emergencyContact,
      location,
    });

    setIsAddModalOpen(false);
    setName('');
    setPost('');
    setMonthlySalaryRupees('');
    setShareholdingPercent('0.00');
    setProfitSharePercent('0.00');
    setPhone('');
    setEmail('');
    setAvatarUrl('');
    setEmergencyContact('');
    setLocation('');
    showNotification(`New employee ${name} added with contact details!`);
  };

  const handleExecutePaySalary = async (emp: Employee) => {
    await onPaySalary(emp.id, emp.monthlySalary, currentMonth);
    showNotification(`Salary payment of ${formatPaiseToRupees(emp.monthlySalary)} recorded for ${emp.name}`);
  };

  const handleExecuteBatchSalaries = async () => {
    if (!onPayAllSalaries) return;
    setIsSubmittingBatchSalaries(true);
    try {
      await onPayAllSalaries(currentMonth);
      setIsBatchSalaryModalOpen(false);
      showNotification(`All due salaries for ${currentMonthDisplay} recorded into expenses!`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingBatchSalaries(false);
    }
  };

  const handleExecuteUndoSalary = async () => {
    if (!onUndoSalaryPayment || !undoTarget) return;
    setIsUndoingSalary(true);
    try {
      if (undoTarget.isAll) {
        await onUndoSalaryPayment(undefined, currentMonth);
        showNotification(`Removed all ${salaryExpensesThisMonth.length} salary disbursements for ${currentMonthDisplay}.`);
      } else if (undoTarget.expense) {
        if (onDeleteExpense) {
          await onDeleteExpense(undoTarget.expense.id);
        } else {
          await onUndoSalaryPayment(undefined, undefined, undoTarget.expense.id);
        }
        showNotification(`Disbursed salary expense for ${undoTarget.expense.vendorName} removed.`);
      } else if (undoTarget.emp) {
        await onUndoSalaryPayment(undoTarget.emp.id, currentMonth);
        showNotification(`Disbursed salary for ${undoTarget.emp.name} removed from expenses.`);
      }
      setIsUndoConfirmModalOpen(false);
      setUndoTarget(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUndoingSalary(false);
    }
  };

  const handleExecuteProfitDistribution = async () => {
    if (!onDistributeProfit) return;
    setIsSubmittingDist(true);
    try {
      const distributions = equityPartners.map((partner) => {
        const percent = Number(partner.dividendPercent || 0);
        const partnerPaise = (netProfitPaise * BigInt(Math.round(percent * 100))) / 10000n;
        return {
          partnerName: partner.name,
          shareholdingPercent: partner.shareholdingPercent || '0.00',
          dividendPercent: partner.dividendPercent || '0.00',
          amountPaise: partnerPaise.toString(),
          employeeId: partner.employeeId,
        };
      });

      if (onUpdateTaxRate && taxRatePercent !== corporateTaxRate) {
        await onUpdateTaxRate(taxRatePercent);
      }

      await onDistributeProfit({
        totalProfitPaise: grossProfitPaise.toString(),
        corporateTaxRatePercent: effectiveTaxRate,
        taxDeductedPaise: calculatedTaxLiabilityPaise.toString(),
        netProfitPaise: netProfitPaise.toString(),
        sourceDescription: profitSourceNote,
        distributions,
      });

      setIsProfitDistModalOpen(false);
      showNotification(
        `Net Profit of ₹${Number(netProfitRupees).toLocaleString('en-IN')} (after ${effectiveTaxRate}% tax) disbursed to 8 partners!`
      );
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingDist(false);
    }
  };

  // Salary Disbursement Edit Handler
  const handleOpenEditSalaryDisbursement = (expense: Expense) => {
    setEditingSalaryExpense(expense);
    setEditSalaryAmountRupees((Number(expense.amount || '0') / 100).toString());
    setEditSalaryDate(expense.date || new Date().toISOString().split('T')[0]);
    setEditSalaryRef(expense.billReferenceNumber || '');
    setEditSalaryStatus((expense.paymentStatus as 'paid' | 'pending') || 'paid');
    setIsEditSalaryModalOpen(true);
  };

  const handleSaveSalaryDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalaryExpense || !onUpdateExpense) return;
    setIsSavingSalaryEdit(true);
    try {
      const amountPaise = rupeesToPaise(editSalaryAmountRupees);
      await onUpdateExpense(editingSalaryExpense.id, {
        amount: amountPaise,
        date: editSalaryDate,
        billReferenceNumber: editSalaryRef,
        paymentStatus: editSalaryStatus,
      });
      setIsEditSalaryModalOpen(false);
      setEditingSalaryExpense(null);
      showNotification(`Salary disbursement voucher updated for ${editingSalaryExpense.vendorName} (₹${Number(editSalaryAmountRupees).toLocaleString('en-IN')})`);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to update salary disbursement', 'info');
    } finally {
      setIsSavingSalaryEdit(false);
    }
  };

  // Profit Disbursement Edit & Undo Handlers
  const handleOpenEditProfitDisbursement = (expense: Expense) => {
    setEditingProfitExpense(expense);
    setEditProfitAmountRupees((Number(expense.amount || '0') / 100).toString());
    setEditProfitDate(expense.date || new Date().toISOString().split('T')[0]);
    setEditProfitVendor(expense.vendorName || '');
    setEditProfitSubCategory(expense.subCategory || '');
    setEditProfitNotes(expense.billReferenceNumber || '');
    setIsEditProfitModalOpen(true);
  };

  const handleSaveProfitDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfitExpense || !onUpdateExpense) return;
    setIsSavingProfitEdit(true);
    try {
      const amountPaise = rupeesToPaise(editProfitAmountRupees);
      await onUpdateExpense(editingProfitExpense.id, {
        amount: amountPaise,
        date: editProfitDate,
        vendorName: editProfitVendor,
        subCategory: editProfitSubCategory,
        billReferenceNumber: editProfitNotes,
      });
      setIsEditProfitModalOpen(false);
      setEditingProfitExpense(null);
      showNotification(`Profit voucher updated for ${editProfitVendor} (₹${Number(editProfitAmountRupees).toLocaleString('en-IN')})`);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to update profit distribution voucher', 'info');
    } finally {
      setIsSavingProfitEdit(false);
    }
  };

  const handleExecuteUndoProfit = async () => {
    if (!undoProfitTarget) return;
    setIsUndoingProfit(true);
    try {
      if (undoProfitTarget.isAll) {
        if (onUndoProfitDistribution) {
          if (undoProfitTarget.date) {
            await onUndoProfitDistribution({ date: undoProfitTarget.date });
          } else {
            for (const p of profitDistExpenses) {
              if (onDeleteExpense) await onDeleteExpense(p.id);
            }
          }
        } else if (onDeleteExpense) {
          for (const p of profitDistExpenses) {
            await onDeleteExpense(p.id);
          }
        }
        showNotification('Selected profit disbursement vouchers removed and funds restored to cash balance.');
      } else if (undoProfitTarget.expense) {
        if (onDeleteExpense) {
          await onDeleteExpense(undoProfitTarget.expense.id);
        } else if (onUndoProfitDistribution) {
          await onUndoProfitDistribution({ expenseId: undoProfitTarget.expense.id });
        }
        showNotification(`Profit voucher for ${undoProfitTarget.expense.vendorName} removed.`);
      }
      setIsUndoProfitConfirmModalOpen(false);
      setUndoProfitTarget(null);
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to remove profit voucher', 'info');
    } finally {
      setIsUndoingProfit(false);
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Core Team':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Department Head':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Management & Support':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Field & Logistics':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-xs font-semibold text-emerald-200 flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stage Notice Banner */}
      {stageSettings?.currentStage === 'prototype' && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-300 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Stage 1 (Prototype Mode) Active:</strong> Only Imran, Pappu Bhai, Simran & active core leaders ({activeEmployees.length} members) are currently calculated on payroll. The other {notHiredEmployees.length} employees are marked <em>Not Hired Yet</em> with ₹0 deducted from cash until hired.
            </span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30 shrink-0 hidden sm:inline">
            PROTOTYPE STAGE
          </span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Company Staff, Salaries & Profit Allotment
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                24 Actual Team Members
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Pay monthly employee salaries from generator profits, track 100% equity shareholding, and distribute generator sales profit directly to key partners.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Distribute Profit Button */}
          <button
            onClick={() => setIsProfitDistModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-1.5"
          >
            <PieChart className="w-4 h-4" />
            <span>Allot & Pay Profit Share</span>
          </button>

          {/* Batch Pay Salaries Button */}
          {onPayAllSalaries && (
            <button
              onClick={() => setIsBatchSalaryModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              <span>Batch Pay Month Salaries</span>
            </button>
          )}

          {/* Edit / Undo Disbursed Salaries Button */}
          {allSalaryExpenses.length > 0 && (
            <button
              type="button"
              onClick={() => setIsManageDisbursementsModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-rose-950/40"
              title="Edit or delete already disbursed salaries if clicked by mistake"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Edit / Undo Salaries ({allSalaryExpenses.length})</span>
            </button>
          )}

          {/* Edit / Undo Disbursed Profits Button */}
          {profitDistExpenses.length > 0 && (
            <button
              type="button"
              onClick={() => setIsManageProfitsModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-950/40"
              title="Edit or delete already disbursed profits if clicked by mistake"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Edit / Undo Profits ({profitDistExpenses.length})</span>
            </button>
          )}

          {/* Add Employee Button */}
          <button
            onClick={() => {
              setName('');
              setPost('');
              setCategory('Field & Logistics');
              setMonthlySalaryRupees('18000');
              setShareholdingPercent('0.00');
              setProfitSharePercent('0.00');
              setIsAddModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Payroll */}
        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 shadow-lg`}>
          <div className={`flex items-center justify-between text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Active Monthly Payroll</span>
            <Banknote className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-sky-300' : 'text-sky-800 font-extrabold'}`}>
            {formatPaiseToRupees(totalMonthlyPayrollPaise.toString())}
          </div>
          <div className={`text-[11px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>{activeEmployees.length} on active payroll</span>
            <span className={isDark ? 'text-amber-400/90 font-medium' : 'text-amber-800 font-bold'}>
              {notHiredEmployees.length} paused (₹{formatPaiseToRupees(pausedPayrollPaise.toString(), { compact: true })})
            </span>
          </div>
        </div>

        {/* Card 2: Profit Sharing Allocation */}
        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 shadow-lg`}>
          <div className={`flex items-center justify-between text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Profit Share Allotted</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800 font-extrabold'}`}>
            {totalAllocatedProfitShare.toFixed(0)}% Allotted
          </div>
          <div className={`text-[11px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>8 Equity Partners (100% total)</span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}>Imran CMD 40%</span>
          </div>
        </div>

        {/* Card 3: Equity Voting Power */}
        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 shadow-lg`}>
          <div className={`flex items-center justify-between text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Shareholding Equity</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-900 font-extrabold'}`}>
            {totalShareholdingPercent.toFixed(0)}% Allotted
          </div>
          <div className={`text-[11px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>Imran 75% Absolute Control</span>
            <span className={isDark ? 'text-amber-400 font-medium' : 'text-amber-800 font-bold'}>8 Partners</span>
          </div>
        </div>

        {/* Card 4: Profit Distributed to Date */}
        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 shadow-lg`}>
          <div className={`flex items-center justify-between text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Profit Distributed to Date</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-teal-300' : 'text-teal-800 font-extrabold'}`}>
            {formatPaiseToRupees(profitDistributionsTotalPaise.toString())}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>Logged in expenses & deducted from cash</span>
          </div>
        </div>
      </div>

      {/* EQUITY PARTNERS HIGHLIGHT CARD */}
      <div className={`${isDark ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30' : 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-300 shadow-md'} border rounded-2xl p-5 shadow-xl`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-950 font-black'}`}>
                8 Core Partners: Equity & Profit Sharing Allotment Table
              </h3>
              {profitDistExpenses.length > 0 && (
                <div className={`text-[11px] font-semibold flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>{profitDistExpenses.length} Disbursed Voucher(s) Recorded • {formatPaiseToRupees(totalProfitAndTaxDisbursedPaise.toString())} Total</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profitDistExpenses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsManageProfitsModalOpen(true)}
                className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-rose-950/40"
                title="Edit or delete already disbursed profits if clicked by mistake"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Edit / Delete Disbursed Profits ({profitDistExpenses.length})</span>
              </button>
            )}
            <button
              onClick={() => setIsProfitDistModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <span>Calculate Payout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {equityPartners.map((p) => {
            const isImran = p.name === 'Imran';
            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border text-center transition ${
                  isDark
                    ? isImran
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700'
                    : isImran
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-sm font-semibold'
                    : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400 shadow-sm'
                }`}
              >
                <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-950'}`}>{p.name}</div>
                <div className={`text-[10px] truncate mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  {p.post ? p.post.split('/')[0] : p.category}
                </div>
                <div className={`text-xs font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  {p.dividendPercent}% <span className={`text-[9px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>profit</span>
                </div>
                <div className={`text-[10px] font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-950 font-black'}`}>
                  {p.shareholdingPercent}% <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-700 font-bold'}`}>equity</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER TABS, SORT & SEARCH CONTROLS */}
      <div className={`space-y-3 border rounded-xl p-4 shadow-md transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tier / Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All Staff (${employees.length})` },
              { id: 'active_only', label: `🟢 Active (${activeEmployees.length})` },
              { id: 'not_hired', label: `⏸️ Not Hired (${notHiredEmployees.length})` },
              { id: 'partners', label: `💎 Partners (${equityPartners.length})` },
              { id: 'Core Team', label: '👑 Core Team' },
              { id: 'Department Head', label: '⚙️ Dept Heads' },
              { id: 'Management & Support', label: '🤝 Management' },
              { id: 'Field & Logistics', label: '🚀 Field Staff' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/20'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Sort By + Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`py-1.5 px-2.5 text-xs rounded-lg border font-semibold transition focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-sky-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500'
                }`}
                title="Sort employee roster"
              >
                <option value="seniority">Seniority: Post High to Low</option>
                <option value="salary_desc">Salary: High to Low</option>
                <option value="salary_asc">Salary: Low to High</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="join_date_desc">Hire Date: Newest first</option>
                <option value="join_date_asc">Hire Date: Oldest first</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search staff, role, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-lg pl-8 pr-7 py-1.5 text-xs transition focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-sky-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2.5 top-2 text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Salary Range Filter */}
        <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-semibold mr-1 flex items-center gap-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <DollarSign className="w-3 h-3 text-sky-500" />
              <span>Salary Range:</span>
            </span>
            {[
              { id: 'all', label: 'All Salaries' },
              { id: 'under_20k', label: '< ₹20k' },
              { id: '20k_30k', label: '₹20k–₹30k' },
              { id: 'above_30k', label: '> ₹30k' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSalaryRange(s.id as any)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  salaryRange === s.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Showing {filteredEmployees.length} of {employees.length} team members</span>
          </div>
        </div>
      </div>

      {/* EMPLOYEES ROSTER LIST - DISTINCT BORDERED CARDS WITH AVATARS & CONTACTS */}
      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-500" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              Employee Roster & Direct Staff Contacts ({filteredEmployees.length} Members)
            </h3>
          </div>
          <span className={`text-xs hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Clear Card Division • Active Stage Seniority Ranking • Full Contact Directory
          </span>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-400" />
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No employees matched your filter</p>
            <p className="text-xs">Try clearing the search query or salary range filters.</p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredEmployees.map((emp) => {
              const contact = staffContacts[emp.employeeId] || {};
              const hasProfitShare = Number(emp.dividendPercent) > 0;
              const hasEquity = Number(emp.shareholdingPercent) > 0;
              const isPaidThisMonth = paidEmployeeNamesThisMonth.has(emp.name);
              const isZeroSalary = BigInt(emp.monthlySalary || '0') === 0n;

              // Avatar initials or custom image
              const initials = emp.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={emp.id}
                  id={`employee-card-${emp.employeeId}`}
                  className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col justify-between gap-3.5 ${
                    isDark
                      ? emp.status === 'active'
                        ? 'bg-slate-900/95 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/60 border-slate-800/60 opacity-80 hover:opacity-100'
                      : emp.status === 'active'
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Card Section 1: Header with Avatar, Name, Post, Category & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={emp.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-sm"
                            onError={(e) => {
                              // Fallback on broken image
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                            emp.category === 'Core Team'
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950'
                              : emp.category === 'Department Head'
                              ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white'
                              : emp.category === 'Management & Support'
                              ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                              : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950'
                          }`}>
                            {initials}
                          </div>
                        )}
                        {/* Active dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                            isDark ? 'border-slate-900' : 'border-white'
                          } ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`}
                          title={emp.status === 'active' ? 'Active on payroll' : 'Not hired yet'}
                        />
                      </div>

                      {/* Name & Title */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className={`text-base font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {emp.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">
                            {emp.employeeId}
                          </span>
                        </div>

                        {/* Post / Designation */}
                        <div className="text-xs font-semibold text-sky-400 mt-0.5 leading-snug">
                          {emp.post || 'Company Team Member'}
                        </div>

                        {/* Category & Stage badge */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(emp.category)}`}>
                            {emp.category}
                          </span>
                          {hasEquity && (
                            <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" />
                              Partner
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="text-right shrink-0">
                      {emp.status === 'active' ? (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Not Hired</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Section 2: Contact Details Box */}
                  <div className={`p-2.5 rounded-xl border flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs ${
                    isDark ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    {/* Phone */}
                    <a
                      href={`tel:${contact.phone || '+91 98000 00000'}`}
                      className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-mono text-xs">{contact.phone || 'Add Phone'}</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:${contact.email || `${emp.name.toLowerCase().replace(/\s+/g, '')}@voltedge.in`}`}
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition"
                      title="Send Official Email"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[170px] text-xs">
                        {contact.email || `${emp.name.toLowerCase().replace(/\s+/g, '')}@voltedge.in`}
                      </span>
                    </a>

                    {/* Location */}
                    {contact.location && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{contact.location}</span>
                      </span>
                    )}
                  </div>

                  {/* Card Section 3: Compensation, Profit Allocation & Join Date */}
                  <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                    isDark ? 'border-slate-800/70' : 'border-slate-200'
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Monthly Salary</span>
                      <div className="flex items-center gap-2">
                        {isZeroSalary ? (
                          <span className="text-xs font-semibold text-amber-400 italic">
                            TBD (Joining Later)
                          </span>
                        ) : (
                          <span className="text-base font-black text-sky-400 font-mono">
                            {formatPaiseToRupees(emp.monthlySalary)}
                          </span>
                        )}
                        {isPaidThisMonth && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            ✓ Paid ({currentMonthDisplay.split(' ')[0]})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {hasProfitShare ? (
                        <div className={`text-xs font-extrabold flex items-center justify-end gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                          <Percent className="w-3 h-3" />
                          <span>Profit Share: {emp.dividendPercent}%</span>
                        </div>
                      ) : (
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Joined: {emp.joinDate}</span>
                      )}

                      {hasEquity && (
                        <div className={`text-[10px] font-mono font-bold mt-0.5 inline-block ${
                          isDark 
                            ? 'text-amber-300' 
                            : 'text-amber-950 font-black bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded shadow-sm'
                        }`}>
                          Equity: {emp.shareholdingPercent}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Section 4: Action Buttons Footer */}
                  <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 ${
                    isDark ? 'border-slate-800/70' : 'border-slate-200'
                  }`}>
                    {/* Hire / Pause toggle */}
                    {onToggleEmployeeStatus && (
                      <button
                        onClick={() => onToggleEmployeeStatus(emp.id, emp.status === 'active' ? 'not_hired' : 'active')}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                          emp.status === 'active'
                            ? isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                        title={emp.status === 'active' ? 'Pause salary calculation' : 'Hire & activate salary in payroll'}
                      >
                        {emp.status === 'active' ? 'Pause' : '⚡ Hire'}
                      </button>
                    )}

                    {/* Salary Actions */}
                    <div className="flex items-center gap-1.5">
                      {!isZeroSalary && (
                        <>
                          <button
                            onClick={() => handleExecutePaySalary(emp)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                              isPaidThisMonth
                                ? isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                            title="Record salary payment into expenses"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>{isPaidThisMonth ? 'Pay Again' : 'Pay Salary'}</span>
                          </button>

                          {isPaidThisMonth && onUpdateExpense && (
                            <button
                              type="button"
                              onClick={() => {
                                const exp = getEmployeeSalaryExpenseThisMonth(emp);
                                if (exp) {
                                  handleOpenEditSalaryDisbursement(exp);
                                } else {
                                  setIsManageDisbursementsModalOpen(true);
                                }
                              }}
                              className="px-2 py-1.5 text-xs font-semibold rounded-xl bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 transition flex items-center gap-1 cursor-pointer"
                              title="Edit already disbursed salary amount or date"
                            >
                              <Edit2 className="w-3 h-3 text-sky-400" />
                              <span>Edit</span>
                            </button>
                          )}

                          {isPaidThisMonth && onUndoSalaryPayment && (
                            <button
                              type="button"
                              onClick={() => {
                                setUndoTarget({ emp });
                                setIsUndoConfirmModalOpen(true);
                              }}
                              className="px-2 py-1.5 text-xs font-semibold rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
                              title="Remove already disbursed salary (if clicked by mistake)"
                            >
                              <Undo2 className="w-3 h-3 text-rose-400" />
                              <span>Undo</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Edit Member Details (Profile & Contacts) */}
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-sky-600 border-slate-300'
                        }`}
                        title="Edit employee post, contacts, and avatar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Remove Member */}
                      <button
                        onClick={() => onDeleteEmployee(emp.id)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border-slate-700' : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-300'
                        }`}
                        title="Remove employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: PROFIT ALLOTMENT & DISTRIBUTION CALCULATOR */}
      {/* ---------------------------------------------------- */}
      {isProfitDistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-400" />
                  Allot & Disburse Generator Profit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter the net profit generated from your generator set sales. The app will calculate each partner's exact share according to their allotted profit sharing ratio.
                </p>
              </div>
              <button
                onClick={() => setIsProfitDistModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Input Form for Profit Amount & Corporate Tax Rate */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Total Profit Before Tax (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={grossProfitRupees}
                      onChange={(e) => setGrossProfitRupees(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 font-bold font-mono focus:outline-none focus:border-emerald-500 text-sm"
                      placeholder="e.g. 200000"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Gross commercial profit before tax deductions
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Profit Source / Reference Note
                  </label>
                  <input
                    type="text"
                    value={profitSourceNote}
                    onChange={(e) => setProfitSourceNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Prototype GEN-30KVA Sale Profit"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Will appear in expense reference ledger
                  </span>
                </div>
              </div>

              {/* Corporate Tax Rate Configuration */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Corporate Tax Rate Configuration:
                    </span>
                    <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {taxRatePercent}%
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDeductTaxEnabled}
                      onChange={(e) => setIsDeductTaxEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Deduct Tax Before Distribution</span>
                  </label>
                </div>

                {/* Preset Tax Regimes / Rates */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { label: '25% Standard Indian Pvt Ltd', rate: 25 },
                    { label: '22% Concessional (Sec 115BAA)', rate: 22 },
                    { label: '15% New Manufacturing (115BAB)', rate: 15 },
                    { label: '30% Base Corporate', rate: 30 },
                    { label: '0% Tax Exempt / Pre-Tax', rate: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.rate}
                      type="button"
                      onClick={() => setTaxRatePercent(preset.rate)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
                        taxRatePercent === preset.rate
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Rate Input */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-400">Custom Tax Rate:</span>
                  <div className="relative w-24">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={taxRatePercent}
                      onChange={(e) => setTaxRatePercent(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right pr-6 font-mono text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2 top-1 text-slate-500 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Profit Waterfall & 'Net Profit' View */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[11px]">Total Profit Before Tax</span>
                  <span className="text-base font-bold text-slate-100 font-mono">
                    {formatPaiseToRupees(grossProfitPaise.toString())}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-amber-400 block text-[11px] flex items-center gap-1">
                    Estimated Tax Liability ({effectiveTaxRate}%)
                  </span>
                  <span className="text-base font-bold text-rose-300 font-mono">
                    -{formatPaiseToRupees(calculatedTaxLiabilityPaise.toString())}
                  </span>
                </div>

                <div className="space-y-0.5 sm:border-l sm:border-slate-800 sm:pl-3">
                  <span className="text-emerald-400 font-bold block text-[11px] uppercase tracking-wide">
                    Net Distributable Profit
                  </span>
                  <span className="text-lg font-black text-emerald-300 font-mono">
                    {formatPaiseToRupees(netProfitPaise.toString())}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Distribution Table (Calculated from Net Profit) */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Partner Profit Allotment Breakdown (From Net Profit):</span>
                <span className="text-emerald-400 font-bold font-mono">
                  Net Disbursed: ₹{Number(netProfitRupees || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
                {equityPartners.map((partner) => {
                  const percent = Number(partner.dividendPercent || 0);
                  const partnerPaise = (netProfitPaise * BigInt(Math.round(percent * 100))) / 10000n;

                  return (
                    <div
                      key={partner.id}
                      className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-900/50"
                    >
                      <div>
                        <span className="font-bold text-white mr-2">{partner.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {partner.post ? partner.post.split('/')[0] : partner.category}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {partner.dividendPercent}% Net Share
                        </span>
                        <span className="font-bold text-slate-100 font-mono w-28 text-right">
                          {formatPaiseToRupees(partnerPaise.toString())}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Clicking <strong>"Record & Disburse Payout"</strong> will log the estimated tax liability of{' '}
                <strong>{formatPaiseToRupees(calculatedTaxLiabilityPaise.toString())}</strong> under Corporate Income Tax and disburse the Net Profit to all 8 partners.
              </span>
            </div>

            {profitDistExpenses.length > 0 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Already disbursed profit or clicked earlier by mistake?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfitDistModalOpen(false);
                    setIsManageProfitsModalOpen(true);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer shrink-0"
                >
                  Manage / Undo Previous Payouts ({profitDistExpenses.length})
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsProfitDistModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDist || netProfitPaise <= 0n}
                onClick={handleExecuteProfitDistribution}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
              >
                {isSubmittingDist ? (
                  <span>Recording Payouts & Tax...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Record & Disburse Payout (Net Profit)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: BATCH PAY ALL MONTH SALARIES */}
      {/* ---------------------------------------------------- */}
      {isBatchSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-indigo-400" />
              Batch Pay Monthly Salaries
            </h3>
            <p className="text-xs text-slate-400">
              Disburse monthly salaries to all 23 active paid staff members for <strong>{currentMonthDisplay}</strong> in one click.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Active Paid Staff:</span>
                <span className="font-bold text-white">{activeEmployees.filter((e) => BigInt(e.monthlySalary || '0') > 0n).length} Employees</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Payroll Outflow:</span>
                <span className="font-bold text-sky-400 text-sm font-mono">
                  {formatPaiseToRupees(totalMonthlyPayrollPaise.toString())}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Billing Cycle:</span>
                <span className="font-mono text-slate-200">{currentMonth}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Each payment will be entered into your expenses ledger with individual employee references under <em>Payroll & Salaries</em>.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchSalaryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingBatchSalaries}
                onClick={handleExecuteBatchSalaries}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-900/30"
              >
                {isSubmittingBatchSalaries ? (
                  <span>Processing Payroll...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pay All Salaries Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: EDIT EMPLOYEE DETAILS */}
      {/* ---------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-sky-400" />
              Edit Team Member Details
            </h3>
            <p className="text-xs text-slate-400">
              Update monthly salary, designation, equity, or profit sharing ratio.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Official Post / Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chairman & Managing Director"
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Department / Tier
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="Core Team">👑 Core Team (Decision Makers & Leaders)</option>
                  <option value="Department Head">⚙️ Department Heads (Core Operations)</option>
                  <option value="Management & Support">🤝 Management & Support Team</option>
                  <option value="Field & Logistics">🚀 Field, Logistics & Expansion Team</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Monthly Salary (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={monthlySalaryRupees}
                    onChange={(e) => setMonthlySalaryRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Set to 0 if salary is TBD or undecided.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Profit Share (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={profitSharePercent}
                      onChange={(e) => setProfitSharePercent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold font-mono"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Shareholding Equity (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={shareholdingPercent}
                      onChange={(e) => setShareholdingPercent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold font-mono"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 font-semibold">%</span>
                  </div>
                </div>
              </div>

              {/* Staff Contact & Profile Fields */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                  Staff Contact & Profile Picture
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Direct Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@voltedge.in"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Employee Photo / Avatar
                  </label>

                  {/* Mobile Camera & File Upload Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl cursor-pointer text-xs font-bold transition">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>📸 Take Photo / Upload from Mobile</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl cursor-pointer text-xs font-bold transition">
                      <Upload className="w-3.5 h-3.5 text-slate-300" />
                      <span>Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {avatarUrl && (
                    <div className="mb-2 p-2 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={avatarUrl}
                          alt="Avatar Preview"
                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/60 shadow-sm"
                          referrerPolicy="no-referrer"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                        <div className="text-[11px]">
                          <span className="text-emerald-400 font-bold block">Photo Attached</span>
                          <span className="text-slate-400 text-[10px]">Compressed for instant mobile sync</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleOpenCropForCurrent}
                          className="text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 cursor-pointer flex items-center gap-1 font-bold"
                          title="Crop photo in 1:1 ratio"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Crop 1:1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    type="url"
                    value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Or paste external image URL..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Plant / Office Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Noida Plant Phase 2"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Emergency Contact / Kin
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="+91 98111 22334 (Kin)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: ADD TEAM MEMBER */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" />
              Add Team Member
            </h3>
            <p className="text-xs text-slate-400">
              Onboard a new team member with their post, salary, and optional profit sharing ratio.
            </p>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Official Post / Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Electrical Engineer"
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Department / Tier
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="Core Team">👑 Core Team (Decision Makers & Leaders)</option>
                  <option value="Department Head">⚙️ Department Heads (Core Operations)</option>
                  <option value="Management & Support">🤝 Management & Support Team</option>
                  <option value="Field & Logistics">🚀 Field, Logistics & Expansion Team</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Monthly Salary (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 25000"
                    value={monthlySalaryRupees}
                    onChange={(e) => setMonthlySalaryRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Profit Share (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={profitSharePercent}
                      onChange={(e) => setProfitSharePercent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold font-mono"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Shareholding (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={shareholdingPercent}
                      onChange={(e) => setShareholdingPercent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-bold font-mono"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 font-semibold">%</span>
                  </div>
                </div>
              </div>

              {/* Staff Contact & Profile Fields */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                  Staff Contact & Profile Picture
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Direct Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@voltedge.in"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Employee Photo / Avatar
                  </label>

                  {/* Mobile Camera & File Upload Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl cursor-pointer text-xs font-bold transition">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>📸 Take Photo / Upload from Mobile</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl cursor-pointer text-xs font-bold transition">
                      <Upload className="w-3.5 h-3.5 text-slate-300" />
                      <span>Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {avatarUrl && (
                    <div className="mb-2 p-2 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={avatarUrl}
                          alt="Avatar Preview"
                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/60 shadow-sm"
                          referrerPolicy="no-referrer"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                        <div className="text-[11px]">
                          <span className="text-emerald-400 font-bold block">Photo Attached</span>
                          <span className="text-slate-400 text-[10px]">Compressed for instant mobile sync</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleOpenCropForCurrent}
                          className="text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 cursor-pointer flex items-center gap-1 font-bold"
                          title="Crop photo in 1:1 ratio"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Crop 1:1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    type="url"
                    value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Or paste external image URL..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Plant / Office Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Noida Plant Phase 2"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Emergency Contact / Kin
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="+91 98111 22334 (Kin)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold transition"
                >
                  Onboard Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: MANAGE & EDIT/REMOVE DISBURSED SALARIES */}
      {/* ---------------------------------------------------- */}
      {isManageDisbursementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-400" />
                  Manage, Edit & Delete Disbursed Salaries
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review salary expense vouchers, edit payout amounts or dates, or delete payments if clicked by mistake.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManageDisbursementsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month Filter Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-300">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Select Billing Cycle</span>
                <span className="font-semibold text-white">Showing {selectedDisbursementMonth === 'all' ? 'All Months' : selectedDisbursementMonth} Payroll</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDisbursementMonth}
                  onChange={(e) => setSelectedDisbursementMonth(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="all">📅 All Recorded Months</option>
                  {salaryMonthsAvailable.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === currentMonth ? '(Current Month)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Batch Undo Action */}
            {salaryExpensesThisMonth.length > 0 && selectedDisbursementMonth === currentMonth && (
              <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-rose-200 block">
                    Undo All {salaryExpensesThisMonth.length} Salaries in Batch ({currentMonthDisplay})
                  </span>
                  <span className="text-[11px] text-rose-300/80">
                    Total: {formatPaiseToRupees(totalSalariesPaidThisMonthPaise.toString())} • Reverses all payments and returns money to cash balance
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUndoTarget({ isAll: true });
                    setIsUndoConfirmModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-rose-950/50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo All {salaryExpensesThisMonth.length} Salaries</span>
                </button>
              </div>
            )}

            {/* List of Disbursed Salaries */}
            {(() => {
              const displayList = selectedDisbursementMonth === 'all'
                ? allSalaryExpenses
                : allSalaryExpenses.filter((exp) => exp.date.startsWith(selectedDisbursementMonth));

              return (
                <div className="space-y-2 max-h-84 overflow-y-auto pr-1">
                  {displayList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/40 rounded-xl text-xs text-slate-500">
                      No salary disbursements found for {selectedDisbursementMonth === 'all' ? 'the selected filter' : selectedDisbursementMonth}.
                    </div>
                  ) : (
                    displayList.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-slate-700 transition"
                      >
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-2">
                            <span>{exp.vendorName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({exp.expenseId})</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                              {exp.date}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {exp.subCategory} • Ref: {exp.billReferenceNumber}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          <span className="font-bold font-mono text-emerald-400 text-sm mr-1">
                            {formatPaiseToRupees(exp.amount)}
                          </span>

                          {onUpdateExpense && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditSalaryDisbursement(exp)}
                              className="px-2.5 py-1 bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 hover:text-white border border-sky-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              title="Edit this salary payout amount or date"
                            >
                              <Edit2 className="w-3 h-3 text-sky-400" />
                              <span>Edit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setUndoTarget({ expense: exp });
                              setIsUndoConfirmModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="Remove this salary payment and restore cash"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsManageDisbursementsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 6: EDIT SALARY DISBURSEMENT VOUCHER */}
      {/* ---------------------------------------------------- */}
      {isEditSalaryModalOpen && editingSalaryExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sky-400" />
                  Edit Disbursed Salary Voucher
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update payment amount, date, or reference notes for <strong>{editingSalaryExpense.vendorName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditSalaryModalOpen(false);
                  setEditingSalaryExpense(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryDisbursement} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Employee / Recipient
                </label>
                <input
                  type="text"
                  disabled
                  value={editingSalaryExpense.vendorName}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Disbursed Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editSalaryAmountRupees}
                    onChange={(e) => setEditSalaryAmountRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 font-bold font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Payment Date (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  required
                  value={editSalaryDate}
                  onChange={(e) => setEditSalaryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Bill Reference / Payment ID
                </label>
                <input
                  type="text"
                  value={editSalaryRef}
                  onChange={(e) => setEditSalaryRef(e.target.value)}
                  placeholder="e.g. SAL-2026-10-EMP-001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Payment Status
                </label>
                <select
                  value={editSalaryStatus}
                  onChange={(e) => setEditSalaryStatus(e.target.value as 'paid' | 'pending')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="paid">Paid (Deducted from Cash)</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditSalaryModalOpen(false);
                    setEditingSalaryExpense(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSalaryEdit}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-950/50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingSalaryEdit ? 'Saving...' : 'Save Payout Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 7: CONFIRM SALARY REMOVAL */}
      {/* ---------------------------------------------------- */}
      {isUndoConfirmModalOpen && undoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                {undoTarget.isAll
                  ? 'Confirm Batch Salary Removal'
                  : 'Remove Salary Disbursement?'}
              </h3>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              {undoTarget.isAll ? (
                <p>
                  You are about to remove <strong>all {salaryExpensesThisMonth.length} salary disbursements</strong> for{' '}
                  <strong>{currentMonthDisplay}</strong> totaling{' '}
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatPaiseToRupees(totalSalariesPaidThisMonthPaise.toString())}
                  </span>.
                </p>
              ) : undoTarget.expense ? (
                <p>
                  Remove salary payment for <strong>{undoTarget.expense.vendorName}</strong> of{' '}
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatPaiseToRupees(undoTarget.expense.amount)}
                  </span>?
                </p>
              ) : (
                <p>
                  Remove salary payment for <strong>{undoTarget.emp?.name}</strong> of{' '}
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatPaiseToRupees(undoTarget.emp?.monthlySalary || '0')}
                  </span>?
                </p>
              )}

              <p className="text-[11px] text-slate-400">
                This will delete the expense voucher from your payroll records and restore the deducted funds back to your cash on hand.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUndoConfirmModalOpen(false);
                  setUndoTarget(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUndoingSalary}
                onClick={handleExecuteUndoSalary}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isUndoingSalary ? 'Removing...' : 'Yes, Remove Salary Disbursement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 8: MANAGE, EDIT & DELETE DISBURSED PROFITS */}
      {/* ---------------------------------------------------- */}
      {isManageProfitsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  Manage, Edit & Delete Disbursed Profits
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review partner net profit dividend vouchers and estimated corporate tax liabilities. Edit amounts or delete if clicked by mistake.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManageProfitsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profit Disbursed Overview Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Total Profit Disbursed to Partners
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                  {formatPaiseToRupees(profitDistributionsTotalPaise.toString())}
                </span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Total Profit & Tax Recorded Vouchers
                </span>
                <span className="text-lg font-bold font-mono text-amber-300 mt-0.5 block">
                  {profitDistExpenses.length} Voucher(s) ({formatPaiseToRupees(totalProfitAndTaxDisbursedPaise.toString())})
                </span>
              </div>
            </div>

            {/* Quick Batch Undo All Action */}
            {profitDistExpenses.length > 0 && (
              <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-rose-200 block">
                    Undo All {profitDistExpenses.length} Profit & Tax Vouchers
                  </span>
                  <span className="text-[11px] text-rose-300/80">
                    If profit payout was clicked by mistake, this will delete all partner dividends and tax expenses and return all funds to cash on hand.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUndoProfitTarget({ isAll: true });
                    setIsUndoProfitConfirmModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-rose-950/50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo Entire Profit Run</span>
                </button>
              </div>
            )}

            {/* List of Disbursed Profit Vouchers */}
            <div className="space-y-2 max-h-84 overflow-y-auto pr-1">
              {profitDistExpenses.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl text-xs text-slate-500">
                  No profit distributions or tax vouchers found.
                </div>
              ) : (
                profitDistExpenses.map((exp) => {
                  const isTax = exp.category === 'Corporate Income Tax';

                  return (
                    <div
                      key={exp.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition ${
                        isTax
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          {isTax ? (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              🏛️ {exp.vendorName}
                            </span>
                          ) : (
                            <span className="text-white flex items-center gap-1">
                              👑 {exp.vendorName}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">({exp.expenseId})</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                            {exp.date}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {exp.subCategory} • Ref: {exp.billReferenceNumber}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <span className={`font-bold font-mono text-sm mr-1 ${isTax ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatPaiseToRupees(exp.amount)}
                        </span>

                        {onUpdateExpense && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditProfitDisbursement(exp)}
                            className="px-2.5 py-1 bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 hover:text-white border border-sky-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="Edit this profit voucher amount or notes"
                          >
                            <Edit2 className="w-3 h-3 text-sky-400" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setUndoProfitTarget({ expense: exp });
                            setIsUndoProfitConfirmModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Delete this profit distribution voucher and restore cash"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsManageProfitsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 9: EDIT PROFIT DISBURSEMENT VOUCHER */}
      {/* ---------------------------------------------------- */}
      {isEditProfitModalOpen && editingProfitExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                  Edit Profit Payout Voucher
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update amount or details for voucher <strong>{editingProfitExpense.expenseId}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditProfitModalOpen(false);
                  setEditingProfitExpense(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfitDisbursement} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Recipient / Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={editProfitVendor}
                  onChange={(e) => setEditProfitVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Disbursed Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editProfitAmountRupees}
                    onChange={(e) => setEditProfitAmountRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 font-bold font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Voucher SubCategory / Description
                </label>
                <input
                  type="text"
                  required
                  value={editProfitSubCategory}
                  onChange={(e) => setEditProfitSubCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Disbursement Date (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  required
                  value={editProfitDate}
                  onChange={(e) => setEditProfitDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Bill / Voucher Reference
                </label>
                <input
                  type="text"
                  value={editProfitNotes}
                  onChange={(e) => setEditProfitNotes(e.target.value)}
                  placeholder="e.g. PROFIT-NET-2026-10-05"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditProfitModalOpen(false);
                    setEditingProfitExpense(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfitEdit}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingProfitEdit ? 'Saving...' : 'Save Profit Payout Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 10: CONFIRM PROFIT REMOVAL */}
      {/* ---------------------------------------------------- */}
      {isUndoProfitConfirmModalOpen && undoProfitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                {undoProfitTarget.isAll
                  ? 'Confirm Batch Profit Removal'
                  : 'Remove Profit Disbursement Voucher?'}
              </h3>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              {undoProfitTarget.isAll ? (
                <p>
                  You are about to remove <strong>all {profitDistExpenses.length} profit distribution and corporate tax vouchers</strong> totaling{' '}
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatPaiseToRupees(totalProfitAndTaxDisbursedPaise.toString())}
                  </span>.
                </p>
              ) : (
                <p>
                  Remove profit distribution voucher for <strong>{undoProfitTarget.expense?.vendorName}</strong> of{' '}
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatPaiseToRupees(undoProfitTarget.expense?.amount || '0')}
                  </span>?
                </p>
              )}

              <p className="text-[11px] text-slate-400">
                This will delete the voucher from your expense books and restore the deducted funds back to your cash on hand balance immediately.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUndoProfitConfirmModalOpen(false);
                  setUndoProfitTarget(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUndoingProfit}
                onClick={handleExecuteUndoProfit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isUndoingProfit ? 'Removing...' : 'Yes, Remove & Restore Cash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 11: 1:1 ASPECT RATIO PHOTO CROPPER MODAL */}
      {/* ---------------------------------------------------- */}
      {isCropModalOpen && cropSourceImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Crop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Crop Photo (1:1 Ratio)</h3>
                  <p className="text-[11px] text-slate-400">Frame employee headshot in 1:1 square ratio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCropModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Square 1:1 Viewport Box */}
            <div className="flex flex-col items-center justify-center">
              <div 
                className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500 shadow-inner flex items-center justify-center cursor-move select-none touch-none"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const initialOffset = { ...cropOffset };
                  const onMouseMove = (moveEvent: MouseEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    setCropOffset({
                      x: Math.max(-120, Math.min(120, initialOffset.x + dx)),
                      y: Math.max(-120, Math.min(120, initialOffset.y + dy)),
                    });
                  };
                  const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                  };
                  window.addEventListener('mousemove', onMouseMove);
                  window.addEventListener('mouseup', onMouseUp);
                }}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    const startX = e.touches[0].clientX;
                    const startY = e.touches[0].clientY;
                    const initialOffset = { ...cropOffset };
                    const onTouchMove = (moveEvent: TouchEvent) => {
                      if (moveEvent.touches.length === 1) {
                        const dx = moveEvent.touches[0].clientX - startX;
                        const dy = moveEvent.touches[0].clientY - startY;
                        setCropOffset({
                          x: Math.max(-120, Math.min(120, initialOffset.x + dx)),
                          y: Math.max(-120, Math.min(120, initialOffset.y + dy)),
                        });
                      }
                    };
                    const onTouchEnd = () => {
                      window.removeEventListener('touchmove', onTouchMove);
                      window.removeEventListener('touchend', onTouchEnd);
                    };
                    window.addEventListener('touchmove', onTouchMove);
                    window.addEventListener('touchend', onTouchEnd);
                  }
                }}
              >
                {/* Image being cropped */}
                <img
                  src={cropSourceImage}
                  alt="Crop Target"
                  className="max-w-none transition-transform duration-75 pointer-events-none"
                  style={{
                    width: `${cropZoom * 100}%`,
                    height: `${cropZoom * 100}%`,
                    objectFit: 'cover',
                    transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) rotate(${cropRotation}deg)`,
                  }}
                />

                {/* 1:1 Circular Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-dashed border-amber-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]" />
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/40">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div />
                </div>

                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/90 rounded-md text-[10px] text-emerald-300 font-mono font-bold pointer-events-none border border-emerald-500/30">
                  1:1 Square
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Drag photo to reposition • Pinch or slide to zoom
              </p>
            </div>

            {/* Zoom & Positioning Controls */}
            <div className="space-y-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono text-xs text-emerald-400 font-bold w-10 text-right">
                  {cropZoom.toFixed(1)}x
                </span>
              </div>

              {/* Quick Focus Presets & Rotate */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCropOffset({ x: 0, y: 0 });
                      setCropZoom(1);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropOffset({ x: 0, y: 25 });
                      setCropZoom(1.3);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                  >
                    Face Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropZoom((prev) => Math.min(3, prev + 0.3))}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
                  >
                    + Zoom
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setCropRotation((prev) => (prev + 90) % 360)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCropModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply 1:1 Crop</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
