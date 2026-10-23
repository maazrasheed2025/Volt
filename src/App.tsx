// src/App.tsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { SimpleCashOverview } from './components/SimpleCashOverview.tsx';
import { GeneratorSetsView } from './components/GeneratorSetsView.tsx';
import { SimpleEmployeesView } from './components/SimpleEmployeesView.tsx';
import { SimpleFinancierView } from './components/SimpleFinancierView.tsx';
import { SimpleFactoryAndExpensesView } from './components/SimpleFactoryAndExpensesView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { CATaxExportModal } from './components/CATaxExportModal.tsx';
import { SellingPriceCalculatorModal } from './components/SellingPriceCalculatorModal.tsx';
import { AndroidInstallModal } from './components/AndroidInstallModal.tsx';
import { BackupRestoreModal } from './components/BackupRestoreModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import {
  Employee,
  Expense,
  FactoryConstructionItem,
  Loan,
  ProductPrototype,
  BOMLineItem,
  BusinessStage,
  StageSettings,
  InventoryItem,
} from './types.ts';
import { calculateGeneratorMasterCashflow, formatPaiseToRupees } from './utils/calculations.ts';
import { Loader2, RefreshCw, Smartphone, AlertTriangle, X, Lock, Database } from 'lucide-react';

function getInitialCachedData() {
  try {
    const raw = localStorage.getItem('voltedge_dashboard_cache');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function AppContent() {
  const { role, token } = useAuth();
  const { isDark } = useTheme();

  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCAExportModalOpen, setIsCAExportModalOpen] = useState<boolean>(false);
  const [isPriceCalcModalOpen, setIsPriceCalcModalOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  const initialCache = getInitialCachedData();

  // Core Datasets (hydrated instantly from cache if available)
  const [employees, setEmployees] = useState<Employee[]>(() => initialCache?.employees || []);
  const [expenses, setExpenses] = useState<Expense[]>(() => initialCache?.expenses || []);
  const [construction, setConstruction] = useState<FactoryConstructionItem[]>(() => initialCache?.constructionBudget || []);
  const [loans, setLoans] = useState<Loan[]>(() => initialCache?.loans || []);
  const [products, setProducts] = useState<ProductPrototype[]>(() => initialCache?.products || []);
  const [bomLineItems, setBomLineItems] = useState<BOMLineItem[]>(() => initialCache?.bomLineItems || []);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => initialCache?.inventoryItems || []);

  // Stage & Operational Section Settings
  const [stageSettings, setStageSettings] = useState<StageSettings>(() => {
    if (initialCache?.systemSettings && Array.isArray(initialCache.systemSettings)) {
      const currentStageSetting = initialCache.systemSettings.find((s: any) => s.key === 'current_app_stage');
      const loansSetting = initialCache.systemSettings.find((s: any) => s.key === 'loans_section_active');
      const factorySetting = initialCache.systemSettings.find((s: any) => s.key === 'factory_section_active');
      const founderFundsSetting = initialCache.systemSettings.find((s: any) => s.key === 'founder_capital_paise');
      const crewLevelSetting = initialCache.systemSettings.find((s: any) => s.key === 'active_crew_level');

      return {
        currentStage: (currentStageSetting?.value as BusinessStage) || 'prototype',
        isLoansActive: loansSetting?.value === 'true',
        isFactoryActive: factorySetting?.value === 'true',
        founderFundsPaise: founderFundsSetting?.value || '200000000',
        activeCrewLevel: (crewLevelSetting?.value as any) || 'prototype_crew',
      };
    }
    return {
      currentStage: 'prototype',
      isLoansActive: false,
      isFactoryActive: false,
      founderFundsPaise: '200000000',
      activeCrewLevel: 'prototype_crew',
    };
  });
  const [corporateTaxRate, setCorporateTaxRate] = useState<number>(25); // 25% default corporate tax rate

  // Multi-Device Safe Mode: When locked, prevent inadvertent saves across multiple devices running concurrently
  const [isDataEditEnabled, setIsDataEditEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('voltedge_edit_mode');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [editLockWarning, setEditLockWarning] = useState<string | null>(null);

  const toggleDataEdit = () => {
    setIsDataEditEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('voltedge_edit_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Multi-Device Background Sync Toggle (Persisted across sessions)
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('voltedge_sync_enabled');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSyncEnabled = () => {
    setIsSyncEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('voltedge_sync_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const checkCanEdit = (): boolean => {
    if (!isDataEditEnabled) {
      setEditLockWarning(
        'Multi-Device Safe Mode Active: Changes are locked to prevent cross-device conflicts. Enable "Edit Mode" in the top bar to save changes from this device.'
      );
      setTimeout(() => setEditLockWarning(null), 6000);
      return false;
    }
    return true;
  };

  const applyDashboardData = (data: any) => {
    if (!data) return;
    if (Array.isArray(data.employees)) setEmployees(data.employees);
    if (Array.isArray(data.expenses)) setExpenses(data.expenses);
    if (Array.isArray(data.constructionBudget)) setConstruction(data.constructionBudget);
    if (Array.isArray(data.loans)) setLoans(data.loans);
    if (Array.isArray(data.products)) setProducts(data.products);
    if (Array.isArray(data.bomLineItems)) setBomLineItems(data.bomLineItems);
    if (Array.isArray(data.inventoryItems)) setInventory(data.inventoryItems);

    setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    if (data.systemSettings && Array.isArray(data.systemSettings)) {
      const currentStageSetting = data.systemSettings.find((s: any) => s.key === 'current_app_stage');
      const loansSetting = data.systemSettings.find((s: any) => s.key === 'loans_section_active');
      const factorySetting = data.systemSettings.find((s: any) => s.key === 'factory_section_active');
      const founderFundsSetting = data.systemSettings.find((s: any) => s.key === 'founder_capital_paise');
      const crewLevelSetting = data.systemSettings.find((s: any) => s.key === 'active_crew_level');
      const taxSetting = data.systemSettings.find((s: any) => s.key === 'corporate_tax_rate');

      if (taxSetting && taxSetting.value) {
        const parsed = parseFloat(taxSetting.value);
        if (parsed > 0 && parsed <= 1) setCorporateTaxRate(parsed * 100);
        else if (parsed > 1) setCorporateTaxRate(parsed);
      }

      setStageSettings({
        currentStage: (currentStageSetting?.value as BusinessStage) || 'prototype',
        isLoansActive: loansSetting?.value === 'true',
        isFactoryActive: factorySetting?.value === 'true',
        founderFundsPaise: founderFundsSetting?.value || '200000000',
        activeCrewLevel: (crewLevelSetting?.value as any) || 'prototype_crew',
      });
    }
  };

  // Fetch full data with timeout and local cache fallback
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/dashboard/overview', {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        applyDashboardData(data);
        try {
          localStorage.setItem('voltedge_dashboard_cache', JSON.stringify(data));
        } catch {}
      } else {
        console.warn(`Dashboard overview returned HTTP status: ${res.status}`);
      }
    } catch (err: any) {
      console.warn('Dashboard data sync temporarily paused, using active local cache:', err?.message || err);
      try {
        const cached = localStorage.getItem('voltedge_dashboard_cache');
        if (cached) {
          applyDashboardData(JSON.parse(cached));
        }
      } catch {}
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 1. Initial fetch
    fetchData();

    if (!isSyncEnabled) {
      return;
    }

    // 2. Background polling every 15s to sync changes across multiple running devices
    const interval = setInterval(() => {
      fetchData();
    }, 15000);

    // 3. Immediately re-sync when switching back to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isSyncEnabled) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchData);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchData);
    };
  }, [token, isSyncEnabled]);

  // Master Cashflow Calculation with Stage Settings Options
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
      stage: stageSettings.currentStage,
      isLoansActive: stageSettings.isLoansActive,
      isFactoryActive: stageSettings.isFactoryActive,
      founderFundsPaise: stageSettings.founderFundsPaise,
    }
  );

  const cashOnHandFormatted = formatPaiseToRupees(cashflow.moneyIHaveNow.toString(), { compact: true });

  // Stage & Calculation Handlers
  const handleSwitchStage = async (
    stage: BusinessStage,
    customOptions?: { isLoansActive?: boolean; isFactoryActive?: boolean; founderFundsPaise?: string }
  ) => {
    if (!checkCanEdit()) return;
    try {
      const res = await fetch('/api/stage/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          stage,
          ...customOptions,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.warn('Failed to switch stage:', err);
    }
  };

  const handleToggleSection = async (section: 'loans' | 'factory', active: boolean) => {
    if (!checkCanEdit()) return;
    try {
      const res = await fetch('/api/settings/toggle-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ section, active }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.warn('Failed to toggle section:', err);
    }
  };

  const handleSetCrewLevel = async (
    level: 'prototype_crew' | 'core_partners' | 'all_staff',
    customActiveNames?: string[]
  ) => {
    if (!checkCanEdit()) return;
    try {
      const res = await fetch('/api/settings/set-crew-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ level, customActiveNames }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.warn('Failed to set crew level:', err);
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: number, status: 'active' | 'not_hired') => {
    if (!checkCanEdit()) return;
    try {
      const res = await fetch(`/api/employees/${employeeId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.warn('Failed to toggle employee status:', err);
    }
  };

  const handleUpdateFounderCapital = async (amountPaise: string) => {
    if (!checkCanEdit()) return;
    try {
      const res = await fetch('/api/settings/founder-capital', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amountPaise }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.warn('Failed to update founder capital:', err);
    }
  };

  const handleUpdateTaxRate = async (rate: number, regime?: string) => {
    if (!checkCanEdit()) return;
    setCorporateTaxRate(rate);
    try {
      const res = await fetch('/api/settings/tax-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rate, regime }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.warn('Failed to update corporate tax rate:', err);
    }
  };

  // Mutation Handlers
  const handleAddProduct = async (prod: Partial<ProductPrototype>) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(prod),
    });
    if (res.ok) fetchData();
  };

  const handleUpdateProduct = async (id: number, updates: Partial<ProductPrototype>) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchData();
  };

  const handleDeleteProduct = async (id: number) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchData();
  };

  const handleAddBomItem = async (item: Partial<BOMLineItem>) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/bom-line-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(item),
    });
    if (res.ok) fetchData();
  };

  const handleUpdateBomItem = async (id: number, updates: Partial<BOMLineItem>) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/bom-line-items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchData();
  };

  const handleDeleteBomItem = async (id: number) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/bom-line-items/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchData();
  };

  const handleAddEmployee = async (emp: Partial<Employee>) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(emp),
    });
    if (res.ok) fetchData();
  };

  const handleUpdateEmployee = async (id: number, updates: Partial<Employee>) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchData();
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchData();
  };

  const handlePaySalary = async (employeeId: number, amountPaise?: string, monthYear?: string) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/employees/${employeeId}/pay-salary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ amountPaise, monthYear }),
    });
    if (res.ok) fetchData();
  };

  const handlePayAllSalaries = async (monthYear?: string) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/employees/pay-all-salaries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ monthYear }),
    });
    if (res.ok) fetchData();
  };

  const handleUndoSalaryPayment = async (employeeId?: number, monthYear?: string, expenseId?: number) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/employees/undo-salary-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ employeeId, monthYear, expenseId }),
    });
    if (res.ok) fetchData();
  };

  const handleDeleteExpense = async (id: number) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchData();
  };

  const handleUpdateExpense = async (id: number, updates: Partial<Expense>) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchData();
  };

  const handleUndoProfitDistribution = async (params: { expenseId?: number; batchReference?: string; date?: string }) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/profit-distribution/undo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });
    if (res.ok) fetchData();
  };

  const handleDistributeProfit = async (data: {
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
  }) => {
    if (!checkCanEdit()) return;
    const payload = {
      ...data,
      corporateTaxRatePercent: data.corporateTaxRatePercent ?? corporateTaxRate,
    };
    const res = await fetch('/api/profit-distribution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) fetchData();
  };

  const handleAddLoan = async (loan: Partial<Loan>) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(loan),
    });
    if (res.ok) fetchData();
  };

  const handleDeleteLoan = async (id: number) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/loans/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchData();
  };

  const handleRecordLoanPayment = async (loanId: number, data: {
    profitPaidPaise: string;
    principalPaidPaise: string;
    paymentDate: string;
    notes?: string;
  }) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/loans/${loanId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (res.ok) fetchData();
  };

  const handleUpdateConstruction = async (id: number, updates: Partial<FactoryConstructionItem>) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/construction/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchData();
  };

  const handleAddExpense = async (exp: Partial<Expense>) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(exp),
    });
    if (res.ok) fetchData();
  };

  // Inventory Handlers
  const handleAddInventoryItem = async (item: Partial<InventoryItem>) => {
    if (!checkCanEdit()) return;
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(item),
    });
    if (res.ok) fetchData();
  };

  const handleUpdateInventoryItem = async (id: number, updates: Partial<InventoryItem>) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchData();
  };

  const handleAdjustStock = async (id: number, delta: number, reason: string, notes?: string) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/inventory/${id}/adjust-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ delta, reason, notes }),
    });
    if (res.ok) fetchData();
  };

  const handleDeleteInventoryItem = async (id: number) => {
    if (!checkCanEdit()) return;
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchData();
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'} flex flex-col items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <span className="text-sm font-semibold">Opening Generator Financial Ledger...</span>
        <span className="text-xs text-slate-500 mt-1">Connecting to Cloud SQL PostgreSQL</span>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col antialiased transition-colors duration-200 overflow-x-hidden w-full max-w-full relative`}>
      {/* Multi-Device Protection Warning Toast */}
      {editLockWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92vw] bg-amber-950/95 border-2 border-amber-500/80 text-amber-200 px-4 py-3 rounded-2xl shadow-2xl flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 text-xs uppercase tracking-wide">Multi-Device Data Protection</strong>
              <p className="text-xs text-amber-100/90 leading-relaxed mt-0.5">{editLockWarning}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsDataEditEnabled(true);
                try {
                  localStorage.setItem('voltedge_edit_mode', 'true');
                } catch {}
                setEditLockWarning(null);
              }}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 cursor-pointer shadow-sm"
            >
              Enable Edit
            </button>
            <button
              type="button"
              onClick={() => setEditLockWarning(null)}
              className="p-1 text-amber-300 hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        cashOnHand={cashOnHandFormatted}
        currentStage={stageSettings.currentStage}
        onSwitchStage={handleSwitchStage}
        isLoansActive={stageSettings.isLoansActive}
        isFactoryActive={stageSettings.isFactoryActive}
        onOpenCAExport={() => setIsCAExportModalOpen(true)}
        onOpenPriceCalculator={() => setIsPriceCalcModalOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        employees={employees}
        inventory={inventory}
        expenses={expenses}
        isDataEditEnabled={isDataEditEnabled}
        onToggleDataEdit={toggleDataEdit}
        lastSyncedTime={lastSyncedTime}
        onManualSync={fetchData}
        isSyncing={isRefreshing}
        isSyncEnabled={isSyncEnabled}
        onToggleSyncEnabled={toggleSyncEnabled}
        onOpenBackupRestore={() => setIsBackupModalOpen(true)}
      />

      {/* Main View Container with Error Boundary */}
      <ErrorBoundary fallbackTitle="Operational Module View Error" onReset={() => setCurrentTab('overview')}>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 lg:pb-8">
          {currentTab === 'overview' && (
            <SimpleCashOverview
              products={products}
              bomLineItems={bomLineItems}
              employees={employees}
              loans={loans}
              construction={construction}
              expenses={expenses}
              stageSettings={stageSettings}
              corporateTaxRate={corporateTaxRate}
              onUpdateTaxRate={handleUpdateTaxRate}
              onOpenCAExport={() => setIsCAExportModalOpen(true)}
              onSwitchStage={handleSwitchStage}
              onToggleSection={handleToggleSection}
              onSetCrewLevel={handleSetCrewLevel}
              onToggleEmployeeStatus={handleToggleEmployeeStatus}
              onUpdateFounderCapital={handleUpdateFounderCapital}
              onNavigateTab={handleTabChange}
              onOpenPriceCalculator={() => setIsPriceCalcModalOpen(true)}
            />
          )}

          {currentTab === 'generators' && (
            <GeneratorSetsView
              products={products}
              bomLineItems={bomLineItems}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddBomItem={handleAddBomItem}
              onUpdateBomItem={handleUpdateBomItem}
              onDeleteBomItem={handleDeleteBomItem}
              onOpenPriceCalculator={() => setIsPriceCalcModalOpen(true)}
              userRole={role}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onAddInventoryItem={handleAddInventoryItem}
              onUpdateInventoryItem={handleUpdateInventoryItem}
              onAdjustStock={handleAdjustStock}
              onDeleteInventoryItem={handleDeleteInventoryItem}
              userRole={role}
            />
          )}

          {currentTab === 'employees' && (
            <SimpleEmployeesView
              employees={employees}
              expenses={expenses}
              products={products}
              bomLineItems={bomLineItems}
              stageSettings={stageSettings}
              corporateTaxRate={corporateTaxRate}
              onUpdateTaxRate={handleUpdateTaxRate}
              onToggleEmployeeStatus={handleToggleEmployeeStatus}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onPaySalary={handlePaySalary}
              onPayAllSalaries={handlePayAllSalaries}
              onUndoSalaryPayment={handleUndoSalaryPayment}
              onDeleteExpense={handleDeleteExpense}
              onUpdateExpense={handleUpdateExpense}
              onDistributeProfit={handleDistributeProfit}
              onUndoProfitDistribution={handleUndoProfitDistribution}
              userRole={role}
            />
          )}

          {currentTab === 'financier' && (
            <SimpleFinancierView
              loans={loans}
              expenses={expenses}
              isLoansActive={stageSettings.isLoansActive}
              onToggleLoansActive={(active) => handleToggleSection('loans', active)}
              onAddLoan={handleAddLoan}
              onDeleteLoan={handleDeleteLoan}
              onRecordLoanPayment={handleRecordLoanPayment}
              onDeleteExpense={handleDeleteExpense}
              userRole={role}
            />
          )}

          {currentTab === 'factory' && (
            <SimpleFactoryAndExpensesView
              construction={construction}
              expenses={expenses}
              onUpdateConstruction={handleUpdateConstruction}
              onAddExpense={handleAddExpense}
              userRole={role}
            />
          )}
        </main>
      </ErrorBoundary>

      {/* Selling Price & Profit Margin Percentage Calculator Modal */}
      <SellingPriceCalculatorModal
        isOpen={isPriceCalcModalOpen}
        onClose={() => setIsPriceCalcModalOpen(false)}
        products={products}
        bomLineItems={bomLineItems}
        corporateTaxRate={corporateTaxRate}
        onUpdateProductPrice={handleUpdateProduct}
      />

      {/* Chartered Accountant Tax & Balance Sheet Export Modal */}
      <CATaxExportModal
        isOpen={isCAExportModalOpen}
        onClose={() => setIsCAExportModalOpen(false)}
        expenses={expenses}
        employees={employees}
        loans={loans}
        products={products}
        bomLineItems={bomLineItems}
        construction={construction}
        stageSettings={stageSettings}
        corporateTaxRate={corporateTaxRate}
      />

      {/* Android Mobile Install & APK Guide Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Universal Full App Data Backup & Safe Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        employees={employees}
        expenses={expenses}
        inventory={inventory}
        loans={loans}
        products={products}
        bomLineItems={bomLineItems}
        construction={construction}
        stageSettings={stageSettings}
        corporateTaxRate={corporateTaxRate}
        onRestoreComplete={fetchData}
        checkCanEdit={checkCanEdit}
      />

      {/* Simplified Footer with Dynamic Mobile Bottom Nav Clearance */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 pt-4 pb-4 app-footer-clearance text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>VoltEdge Generators • Manufacturing Ledger & Serial Costing Hub</span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:space-x-3">
            <button
              onClick={() => setIsAndroidModalOpen(true)}
              className="hover:text-emerald-300 text-emerald-400 font-semibold flex items-center gap-1 transition cursor-pointer px-2 py-1 rounded-md hover:bg-slate-800/60"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Android App / APK</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="hover:text-slate-300 flex items-center gap-1 transition cursor-pointer px-2 py-1 rounded-md hover:bg-slate-800/60"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Balance</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <span className="text-emerald-400 font-medium px-2 py-0.5 bg-emerald-950/40 rounded border border-emerald-500/20">Cloud SQL PostgreSQL Live</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Mobile Viewports Only) */}
      <MobileBottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
