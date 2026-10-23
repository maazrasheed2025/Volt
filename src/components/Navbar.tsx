// src/components/Navbar.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { BusinessStage, StageSettings, Employee, InventoryItem, Expense } from '../types.ts';
import { formatPaiseToRupees } from '../utils/calculations.ts';
import { 
  Zap, 
  Building2, 
  LogOut, 
  LogIn, 
  Wallet,
  Users,
  HandCoins,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
  Calculator,
  Smartphone,
  Boxes,
  X,
  ChevronDown,
  Menu,
  Search,
  Sun,
  Moon,
  Receipt,
  ArrowRight,
  Lock,
  RefreshCw,
  Share2,
  Database,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  cashOnHand?: string;
  currentStage?: BusinessStage;
  onSwitchStage?: (stage: BusinessStage, overrides?: Partial<StageSettings>) => Promise<void>;
  isLoansActive?: boolean;
  isFactoryActive?: boolean;
  onOpenCAExport?: () => void;
  onOpenPriceCalculator?: () => void;
  onOpenAndroidModal?: () => void;
  onOpenBackupRestore?: () => void;
  employees?: Employee[];
  inventory?: InventoryItem[];
  expenses?: Expense[];
  isDataEditEnabled?: boolean;
  onToggleDataEdit?: () => void;
  lastSyncedTime?: string;
  onManualSync?: () => void;
  isSyncing?: boolean;
  isSyncEnabled?: boolean;
  onToggleSyncEnabled?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  cashOnHand,
  currentStage = 'prototype',
  onSwitchStage,
  isLoansActive = false,
  isFactoryActive = false,
  onOpenCAExport,
  onOpenPriceCalculator,
  onOpenAndroidModal,
  onOpenBackupRestore,
  employees = [],
  inventory = [],
  expenses = [],
  isDataEditEnabled = true,
  onToggleDataEdit,
  lastSyncedTime,
  onManualSync,
  isSyncing = false,
  isSyncEnabled = true,
  onToggleSyncEnabled,
}) => {
  const { user, role, signInWithGoogle, signInWithDemo, signOut, authError, clearAuthError } = useAuth();
  const { theme, isDark, toggleTheme, themeLabel } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Standard Navigation Tabs
  const navTabs = [
    { id: 'overview', label: 'Cash Hub', emoji: '💰', icon: Wallet },
    { id: 'employees', label: 'Staff & Profit', emoji: '💎', icon: Users },
    { id: 'inventory', label: 'Raw Materials', emoji: '📦', icon: Boxes },
    { id: 'generators', label: 'Generator Sets', emoji: '⚡', icon: Zap },
    { id: 'financier', label: 'Financier Loans', emoji: '🤝', icon: HandCoins },
    { id: 'factory', label: 'Factory & Expenses', emoji: '🏗️', icon: Building2 },
  ];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Esc to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsStageDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter entities across employees, inventory, and expenses
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { employees: [], inventory: [], expenses: [], total: 0 };

    const matchedEmployees = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        (emp.post || '').toLowerCase().includes(q) ||
        emp.category.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedInventory = inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedExpenses = expenses.filter(
      (exp) =>
        exp.vendorName.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        exp.subCategory.toLowerCase().includes(q) ||
        exp.billReferenceNumber.toLowerCase().includes(q) ||
        exp.expenseId.toLowerCase().includes(q)
    ).slice(0, 5);

    const total = matchedEmployees.length + matchedInventory.length + matchedExpenses.length;
    return {
      employees: matchedEmployees,
      inventory: matchedInventory,
      expenses: matchedExpenses,
      total,
    };
  }, [searchQuery, employees, inventory, expenses]);

  const handleSelectSearchResult = (tab: string) => {
    setCurrentTab(tab);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleStageSelect = async (stage: BusinessStage) => {
    setIsStageDropdownOpen(false);
    if (!onSwitchStage || currentStage === stage) return;
    if (stage === 'prototype') {
      await onSwitchStage('prototype', { isLoansActive: false, isFactoryActive: false });
    } else if (stage === 'selling') {
      await onSwitchStage('selling', { isLoansActive, isFactoryActive: false });
    } else if (stage === 'full') {
      await onSwitchStage('full', { isLoansActive: true, isFactoryActive: true });
    }
  };

  return (
    <nav
      className={`border-b transition-colors duration-200 shadow-sm sticky top-0 z-30 ${
        isDark
          ? 'bg-slate-950 text-slate-100 border-slate-800'
          : 'bg-white text-slate-800 border-slate-200'
      }`}
    >
      {/* Slim, Compact Main Navbar (Height ~56px) */}
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3 w-full">
          
          {/* Left: Brand Identity + Operating Stage Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div 
              className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer group"
              onClick={() => setCurrentTab('overview')}
              title="VoltEdge Generators - Return to Cash Hub"
            >
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-400 via-emerald-500 to-indigo-600 rounded-xl shadow-sm text-slate-950 font-black group-hover:scale-105 transition-transform">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 fill-current" />
              </div>
              <div>
                <span className={`text-xs sm:text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-emerald-500 transition-colors`}>
                  VOLTEDGE
                </span>
                <span className={`text-[10px] font-medium ml-1 hidden md:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  30 kVA
                </span>
              </div>
            </div>

            {/* Quick Operating Stage Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStageDropdownOpen(!isStageDropdownOpen)}
                className={`flex items-center space-x-1 px-1.5 sm:px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer shrink-0 ${
                  currentStage === 'prototype'
                    ? isDark ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:border-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:border-emerald-400'
                    : currentStage === 'selling'
                    ? isDark ? 'bg-sky-950/80 border-sky-500/50 text-sky-300 hover:border-sky-400' : 'bg-sky-50 border-sky-300 text-sky-800 hover:border-sky-400'
                    : isDark ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 hover:border-purple-400' : 'bg-purple-50 border-purple-300 text-purple-800 hover:border-purple-400'
                }`}
                title="Click to switch operating mode (retains employee hired status)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                <span className="hidden md:inline">
                  {currentStage === 'prototype' && 'Stage 1: Prototype'}
                  {currentStage === 'selling' && 'Stage 2: Pilot'}
                  {currentStage === 'full' && 'Stage 3: Full Scale'}
                </span>
                <span className="md:hidden font-mono text-[11px]">
                  {currentStage === 'prototype' && 'S1'}
                  {currentStage === 'selling' && 'S2'}
                  {currentStage === 'full' && 'S3'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
              </button>

              {/* Stage Dropdown Menu */}
              {isStageDropdownOpen && (
                <div className={`absolute left-0 mt-2 w-64 rounded-2xl shadow-2xl p-2 z-50 border animate-fadeIn ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className={`text-[10px] font-black uppercase px-3 py-1 tracking-wider border-b ${
                    isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                  }`}>
                    Switch Operating Mode
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStageSelect('prototype')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer mt-1 ${
                      currentStage === 'prototype'
                        ? isDark ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">🛠️ Stage 1: Prototype</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>1 Unit • 5 Crew • ₹0 Debt</div>
                    </div>
                    {currentStage === 'prototype' && <span className="text-[10px] text-emerald-500 font-bold">ACTIVE</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStageSelect('selling')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer mt-1 ${
                      currentStage === 'selling'
                        ? isDark ? 'bg-sky-950 text-sky-300 font-bold border border-sky-500/40' : 'bg-sky-50 text-sky-800 font-bold border border-sky-300'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">⚡ Stage 2: Pilot & Selling</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Early Commercial Orders • 8 Partners</div>
                    </div>
                    {currentStage === 'selling' && <span className="text-[10px] text-sky-500 font-bold">ACTIVE</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStageSelect('full')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer mt-1 ${
                      currentStage === 'full'
                        ? isDark ? 'bg-purple-950 text-purple-300 font-bold border border-purple-500/40' : 'bg-purple-50 text-purple-800 font-bold border border-purple-300'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">🏭 Stage 3: Full Scale</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>30+ Units • 24 Staff • Capex & Loans</div>
                    </div>
                    {currentStage === 'full' && <span className="text-[10px] text-purple-500 font-bold">ACTIVE</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center: Global Search Bar - Responsive for medium/large displays */}
          <div ref={searchContainerRef} className="hidden md:block relative min-w-[170px] sm:min-w-[220px] flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-1 sm:mx-2.5">
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search staff, parts, bills..."
                className={`w-full pl-7 sm:pl-8 pr-6 sm:pr-7 py-1.5 text-xs rounded-xl border transition-all focus:outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                    : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className={`absolute right-2 top-2 text-xs p-0.5 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Global Search Results Dropdown - Full width and legible */}
            {isSearchOpen && searchQuery.trim() && (
              <div
                className={`fixed left-2 right-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:right-auto w-[calc(100vw-1rem)] sm:w-[560px] max-w-[96vw] mt-2 rounded-2xl shadow-2xl border p-3.5 z-50 max-h-[80vh] overflow-y-auto animate-fadeIn ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40 text-[11px] font-semibold">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}>
                    Search Results ({searchResults.total})
                  </span>
                  <span className="text-[10px] text-slate-500">Press Esc to close</span>
                </div>

                {searchResults.total === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No staff, raw materials, or expenses found for "{searchQuery}".
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 text-xs">
                    {/* Employees */}
                    {searchResults.employees.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1 px-1">
                          <Users className="w-3 h-3" />
                          <span>Staff & Team ({searchResults.employees.length})</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.employees.map((emp) => (
                            <div
                              key={emp.id}
                              onClick={() => handleSelectSearchResult('employees')}
                              className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                                isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-xs flex items-center gap-1.5">
                                    <span>{emp.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">({emp.employeeId})</span>
                                  </div>
                                  <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {emp.post || emp.category}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-xs font-semibold text-sky-400">
                                  {formatPaiseToRupees(emp.monthlySalary)}
                                </div>
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end">
                                  Go to Staff <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inventory Items */}
                    {searchResults.inventory.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 px-1">
                          <Boxes className="w-3 h-3" />
                          <span>Raw Materials ({searchResults.inventory.length})</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.inventory.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectSearchResult('inventory')}
                              className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                                isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-xs flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-amber-400">{item.sku}</span>
                                  <span>{item.name}</span>
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {item.supplierName} • {item.currentStock} {item.unit} in stock
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-xs font-bold text-emerald-400">
                                  {formatPaiseToRupees(item.unitCost)}
                                </div>
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end">
                                  Go to Raw Mat <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expenses */}
                    {searchResults.expenses.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1 px-1">
                          <Receipt className="w-3 h-3" />
                          <span>Expense Records ({searchResults.expenses.length})</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.expenses.map((exp) => (
                            <div
                              key={exp.id}
                              onClick={() => handleSelectSearchResult('factory')}
                              className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                                isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-xs">
                                  {exp.vendorName}
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {exp.category} · {exp.billReferenceNumber}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-xs font-semibold text-rose-400">
                                  {formatPaiseToRupees(exp.amount)}
                                </div>
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end">
                                  Go to Expenses <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden xl:flex items-center space-x-1 shrink-0">
            {navTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              const IconComp = tab.icon;

              return (
                <button
                  key={tab.id}
                  id={`nav-link-${tab.id}`}
                  type="button"
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Anchored Controls & Hamburger Trigger */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
            
            {/* Theme Toggle Button - visible on xl+ (available in drawer on mobile) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`hidden xl:flex p-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition items-center gap-1 cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800 hover:text-amber-200'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={`Active Theme: ${themeLabel}. Click to switch.`}
              aria-label="Toggle visual theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              <span className="text-[11px] font-medium">{isDark ? 'Slate' : 'Light'}</span>
            </button>

            {/* Liquid Cash Button - visible on sm+ (available in drawer on mobile) */}
            <button
              type="button"
              onClick={() => setCurrentTab('overview')}
              className={`hidden sm:flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition shadow-sm cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-slate-100 hover:border-emerald-400'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-400'
              }`}
              title="Liquid Cash Available • Click for Overview"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className={`text-xs font-black font-mono ${isDark ? 'text-white' : 'text-emerald-900'}`}>
                {cashOnHand ? `${cashOnHand}` : '₹4.53 L'}
              </span>
            </button>

            {/* Android APK Share Option - visible on lg+ (available in drawer on mobile) */}
            {onOpenAndroidModal && (
              <button
                type="button"
                onClick={onOpenAndroidModal}
                className={`hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 shadow-sm'
                }`}
                title="Share Android APK, WhatsApp link, QR Code & PWA Install"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Share APK</span>
              </button>
            )}

            {/* Backup & Restore Option - visible on xl+ */}
            {onOpenBackupRestore && (
              <button
                type="button"
                onClick={onOpenBackupRestore}
                className={`hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-indigo-300 shadow-sm'
                }`}
                title="Full App Data Backup & Safe Restore (Local & Cloud)"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Backup</span>
              </button>
            )}

            {/* Multi-Device Data Edit / Safe Mode Toggle - ALWAYS VISIBLE FROM ALL VIEWPORTS */}
            {onToggleDataEdit && (
              <button
                type="button"
                id="navbar-data-edit-toggle"
                onClick={onToggleDataEdit}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer shrink-0 shadow-sm ${
                  isDataEditEnabled
                    ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300 ring-2 ring-amber-400/30'
                    : isDark
                    ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:border-slate-500 hover:text-emerald-300'
                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-slate-950'
                }`}
                title={
                  isDataEditEnabled
                    ? '✏️ Data Editing: ENABLED (Changes will be saved). Click to lock.'
                    : '🔒 Safe Mode: ACTIVE (Data protected from edits). Click to allow data changes.'
                }
              >
                {isDataEditEnabled ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shrink-0 animate-ping inline-block" />
                    <span className="hidden sm:inline">✏️ Allow Edits</span>
                    <span className="sm:hidden font-bold">✏️ Edit</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-emerald-500" />
                    <span className="hidden sm:inline">🔒 Safe Mode</span>
                    <span className="sm:hidden font-bold">🔒 Safe</span>
                  </>
                )}
              </button>
            )}

            {/* Enhanced "Last Synced" Indicator with Pulse Animation */}
            <div
              onClick={onManualSync}
              className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-xl border text-[11px] font-mono transition cursor-pointer shrink-0 select-none ${
                !isSyncEnabled
                  ? isDark ? 'bg-slate-900/60 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'
                  : isSyncing
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                  : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
              title={
                !isSyncEnabled
                  ? `Multi-Device Background Sync is OFF. Last synced: ${lastSyncedTime || 'Never'}. Click to sync manually.`
                  : isSyncing
                  ? 'Syncing data across devices...'
                  : `Sync Active. Last: ${lastSyncedTime || 'Just now'}. Click to sync now.`
              }
            >
              {/* Pulse Animation Indicator */}
              {isSyncEnabled ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  {isSyncing && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isSyncing ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0 inline-block" />
              )}

              {/* Sync Label / Time */}
              <span className="hidden xl:inline text-xs font-sans font-semibold">
                {!isSyncEnabled ? 'Sync Off' : isSyncing ? 'Syncing...' : lastSyncedTime ? `Synced: ${lastSyncedTime}` : 'Synced'}
              </span>
              <span className="xl:hidden hidden sm:inline text-[10px] font-sans font-bold">
                {!isSyncEnabled ? 'Sync Off' : isSyncing ? 'Syncing...' : 'Synced'}
              </span>

              {onManualSync && (
                <RefreshCw className={`w-3 h-3 shrink-0 ${isSyncing ? 'animate-spin text-emerald-400' : 'opacity-60'}`} />
              )}
            </div>

            {/* Auth Controls (Desktop quick access) */}
            {user ? (
              <div className="hidden 2xl:flex items-center space-x-1.5 border-l border-slate-800 pl-2 shrink-0">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  id="sign-out-btn"
                  onClick={signOut}
                  className={`p-1.5 rounded-lg transition ${
                    isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                  }`}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden 2xl:flex items-center space-x-1 border-l border-slate-800/80 pl-2 shrink-0">
                <button
                  id="demo-login-btn"
                  onClick={() => signInWithDemo('Admin/Owner')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                  title="Demo Executive Sign In"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 inline mr-1" />
                  <span>Demo</span>
                </button>
              </div>
            )}

            {/* Top-Right 3-Lines (Hamburger) Menu Button - HORIZONTALLY ANCHORED, ALWAYS VISIBLE ACROSS ALL MOBILE VIEWPORTS */}
            <button
              type="button"
              id="top-nav-hamburger-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`navbar-menu-trigger p-2 rounded-xl border shrink-0 transition flex items-center justify-center cursor-pointer min-w-[38px] sm:min-w-[42px] h-9 sm:h-10 ml-0.5 sm:ml-1 z-40 select-none ${
                isMobileMenuOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/40'
                  : isDark 
                  ? 'text-slate-100 hover:text-white bg-slate-900 hover:bg-slate-800 border-slate-700 shadow-sm' 
                  : 'text-slate-900 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-sm'
              }`}
              title="Menu Options (All Navigation & Tools)"
              aria-label="Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-current stroke-[2.5]" /> : <Menu className="w-5 h-5 text-current stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* Universal Slide-Over Navigation Drawer (Works on all screen sizes) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-over panel */}
            <div className={`fixed inset-y-0 right-0 max-w-full w-full sm:w-[420px] shadow-2xl flex flex-col z-50 border-l transition-transform duration-300 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Drawer Header */}
              <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-gradient-to-br from-amber-400 to-emerald-500 rounded-xl text-slate-950 font-black">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base tracking-tight">VOLTEDGE Menu</h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Access all tools, stages & data controls
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-950'
                  }`}
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Scrollable with safe-area bottom clearance) */}
              <div
                className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
                style={{ paddingBottom: 'calc(3rem + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)))' }}
              >
                
                {/* 1. DATA CHANGE PROTECTION CARD (Prominent in Drawer) */}
                {onToggleDataEdit && (
                  <div className={`p-3.5 rounded-2xl border transition ${
                    isDataEditEnabled
                      ? isDark 
                        ? 'bg-amber-950/30 border-amber-500/50' 
                        : 'bg-amber-50 border-amber-300'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center space-x-2">
                        {isDataEditEnabled ? (
                          <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
                            <span className="w-3 h-3 block font-bold text-center text-xs">✏️</span>
                          </div>
                        ) : (
                          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                            <Lock className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-black">
                            {isDataEditEnabled ? 'Data Edit Mode: ENABLED' : 'Data Safe Mode: ACTIVE (LOCKED)'}
                          </div>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {isDataEditEnabled ? 'Changes save directly across all devices' : 'Protected from unintended data overwrites'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onToggleDataEdit}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 shadow-sm ${
                          isDataEditEnabled
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isDataEditEnabled ? 'Lock App' : 'Enable Edit'}
                      </button>
                    </div>

                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isDataEditEnabled 
                        ? '⚠️ You can now add, edit or delete employees, inventory, bills and operating stages.'
                        : '🔒 Read-only view active. Enable edit mode above before making changes on this device.'}
                    </p>
                  </div>
                )}

                {/* 2. NAVIGATION HUBS */}
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-wider mb-2 px-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Navigation Hubs
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {navTabs.map((tab) => {
                      const isActive = currentTab === tab.id;
                      const IconComp = tab.icon;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setCurrentTab(tab.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold transition text-left cursor-pointer border ${
                            isActive
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-sm'
                              : isDark
                              ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. OPERATING STAGE SELECTOR */}
                <div className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Business Operating Stage
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleStageSelect('prototype');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer border ${
                        currentStage === 'prototype'
                          ? isDark ? 'bg-emerald-950 text-emerald-300 font-bold border-emerald-500/50' : 'bg-emerald-50 text-emerald-900 font-bold border-emerald-300'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold">🛠️ Stage 1: Prototype</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>1 Unit • 5 Crew • ₹0 Debt</div>
                      </div>
                      {currentStage === 'prototype' && <span className="text-[10px] text-emerald-500 font-black">ACTIVE</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleStageSelect('selling');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer border ${
                        currentStage === 'selling'
                          ? isDark ? 'bg-sky-950 text-sky-300 font-bold border-sky-500/50' : 'bg-sky-50 text-sky-900 font-bold border-sky-300'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold">⚡ Stage 2: Pilot Orders</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Early Orders • 8 Core Partners</div>
                      </div>
                      {currentStage === 'selling' && <span className="text-[10px] text-sky-500 font-black">ACTIVE</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleStageSelect('full');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer border ${
                        currentStage === 'full'
                          ? isDark ? 'bg-purple-950 text-purple-300 font-bold border-purple-500/50' : 'bg-purple-50 text-purple-900 font-bold border-purple-300'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold">🏭 Stage 3: Full Scale</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>30+ Units • 24 Staff • Loans & Capex</div>
                      </div>
                      {currentStage === 'full' && <span className="text-[10px] text-purple-500 font-black">ACTIVE</span>}
                    </button>
                  </div>
                </div>

                {/* 4. ESSENTIAL TOOLS & EXPORTS */}
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-wider mb-2 px-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Export & Financial Tools
                  </div>
                  <div className="space-y-2">
                    {onOpenCAExport && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCAExport();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-sky-950/60 hover:border-sky-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-sky-50 hover:border-sky-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-sky-500 shrink-0" />
                          <div className="text-left">
                            <div className="font-bold">📄 CA Tax & Audit Dossier (PDF / Excel)</div>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Balance sheet, P&L & statutory tax schedule</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-60" />
                      </button>
                    )}

                    {onOpenPriceCalculator && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPriceCalculator();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-emerald-950/60 hover:border-emerald-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Calculator className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="text-left">
                            <div className="font-bold">⚡ Genset Selling Price & Margin Calculator</div>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cost breakups, gross margins & market pricing</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-60" />
                      </button>
                    )}

                    {onOpenAndroidModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAndroidModal();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-emerald-950/60 hover:border-emerald-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="text-left">
                            <div className="font-bold">📱 Share Android APK & Mobile App</div>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>WhatsApp share, QR Code & native APK build</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-60" />
                      </button>
                    )}

                    {onOpenBackupRestore && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBackupRestore();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-indigo-950/60 hover:border-indigo-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-indigo-50 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="text-left">
                            <div className="font-bold">💾 Full App Data Backup & Safe Restore</div>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Export local JSON snapshots & disaster recovery</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-60" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. SYSTEM STATUS, THEME & SYNC */}
                <div className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Preferences & Background Sync
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                      <span className="text-xs font-bold">Color Theme: {themeLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-slate-200 border-slate-300 text-slate-800'
                      }`}
                    >
                      Toggle
                    </button>
                  </div>

                  {/* Multi-Device Synchronization & Sync Off Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5">
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {isSyncEnabled ? (
                          <span className="relative flex h-2 w-2">
                            {isSyncing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSyncing ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                        )}
                        <span>Multi-Device Sync: {isSyncEnabled ? 'ACTIVE' : 'DISABLED (OFF)'}</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isSyncEnabled 
                          ? (lastSyncedTime ? `Last synced: ${lastSyncedTime}` : 'Background polling active (15s)') 
                          : `Sync is paused. Last recorded sync: ${lastSyncedTime || 'Never'}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {onToggleSyncEnabled && (
                        <button
                          type="button"
                          onClick={onToggleSyncEnabled}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition ${
                            isSyncEnabled
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/80'
                              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80'
                          }`}
                          title={isSyncEnabled ? 'Pause background synchronization' : 'Turn background sync back on'}
                        >
                          {isSyncEnabled ? 'Sync Off' : 'Sync On'}
                        </button>
                      )}

                      {onManualSync && (
                        <button
                          type="button"
                          onClick={onManualSync}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white' : 'bg-slate-200 border-slate-300 text-slate-800'
                          }`}
                          title="Force manual sync now"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                          <span>Sync</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. USER ACCOUNT DETAILS */}
                <div className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Account & Authorization
                  </div>
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold">{user.displayName || user.email}</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{role || 'Executive'}</div>
                      </div>
                      <button
                        type="button"
                        onClick={signOut}
                        className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signInWithDemo('Admin/Owner')}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer"
                    >
                      ✨ Sign in as Imran (CMD / Owner Demo)
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Error Banner if applicable */}
      {authError && (
        <div className="bg-amber-950/90 border-t border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{authError}</span>
            <button
              onClick={() => {
                clearAuthError();
                signInWithDemo('Admin/Owner');
              }}
              className="ml-2 underline font-semibold text-amber-300 hover:text-white"
            >
              Sign in with Demo
            </button>
          </div>
          <button
            onClick={clearAuthError}
            className="p-1 text-amber-400 hover:text-white rounded"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </nav>
  );
};
