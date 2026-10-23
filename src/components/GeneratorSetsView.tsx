// src/components/GeneratorSetsView.tsx
import React, { useState, useMemo } from 'react';
import { ProductPrototype, BOMLineItem } from '../types.ts';
import { formatPaiseToRupees, rupeesToPaise } from '../utils/calculations.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Zap,
  Plus,
  Tag,
  DollarSign,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Layers,
  Wrench,
  AlertTriangle,
  FileText,
  BadgeCheck,
  TrendingUp,
  ShieldCheck,
  Activity,
  BatteryCharging,
  Cpu,
  Cog,
  Boxes,
  Gauge,
  Sparkles,
  Search,
  Filter,
  CreditCard,
  Building,
  ArrowDownAZ,
  ArrowUpDown,
  Calculator,
} from 'lucide-react';

interface GeneratorSetsViewProps {
  products: ProductPrototype[];
  bomLineItems: BOMLineItem[];
  onAddProduct: (prod: Partial<ProductPrototype>) => Promise<void>;
  onUpdateProduct: (id: number, updates: Partial<ProductPrototype>) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
  onAddBomItem: (item: Partial<BOMLineItem>) => Promise<void>;
  onUpdateBomItem?: (id: number, updates: Partial<BOMLineItem>) => Promise<void>;
  onDeleteBomItem: (id: number) => Promise<void>;
  onOpenPriceCalculator?: () => void;
  userRole?: string;
}

const getCategoryMetadata = (category: string, isDark: boolean = true) => {
  const lower = category.toLowerCase();
  if (lower.includes('power') || lower.includes('electrical')) {
    return {
      icon: Zap,
      color: isDark ? 'text-amber-400' : 'text-amber-700',
      badgeBg: isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-950 font-bold',
    };
  }
  if (lower.includes('canopy') || lower.includes('enclosure')) {
    return {
      icon: ShieldCheck,
      color: isDark ? 'text-sky-400' : 'text-sky-700',
      badgeBg: isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-100 border-sky-300 text-sky-950 font-bold',
    };
  }
  if (lower.includes('motor')) {
    return {
      icon: Activity,
      color: isDark ? 'text-emerald-400' : 'text-emerald-700',
      badgeBg: isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold',
    };
  }
  if (lower.includes('machining') || lower.includes('fabrication')) {
    return {
      icon: Wrench,
      color: isDark ? 'text-orange-400' : 'text-orange-700',
      badgeBg: isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-orange-100 border-orange-300 text-orange-950 font-bold',
    };
  }
  if (lower.includes('battery') || lower.includes('energy')) {
    return {
      icon: BatteryCharging,
      color: isDark ? 'text-teal-400' : 'text-teal-700',
      badgeBg: isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' : 'bg-teal-100 border-teal-300 text-teal-950 font-bold',
    };
  }
  if (lower.includes('engineering') || lower.includes('r&d') || lower.includes('design')) {
    return {
      icon: Cpu,
      color: isDark ? 'text-purple-400' : 'text-purple-700',
      badgeBg: isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-950 font-bold',
    };
  }
  if (lower.includes('transmission') || lower.includes('mechanical')) {
    return {
      icon: Cog,
      color: isDark ? 'text-emerald-400' : 'text-emerald-700',
      badgeBg: isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold',
    };
  }
  if (lower.includes('hardware') || lower.includes('fastener')) {
    return {
      icon: Boxes,
      color: isDark ? 'text-blue-400' : 'text-blue-700',
      badgeBg: isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-100 border-blue-300 text-blue-950 font-bold',
    };
  }
  if (lower.includes('structure') || lower.includes('base')) {
    return {
      icon: Layers,
      color: isDark ? 'text-indigo-400' : 'text-indigo-700',
      badgeBg: isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-indigo-100 border-indigo-300 text-indigo-950 font-bold',
    };
  }
  return {
    icon: Tag,
    color: isDark ? 'text-slate-400' : 'text-slate-700',
    badgeBg: isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-900 font-bold',
  };
};

const renderPaymentBadge = (mode: string, isDark: boolean = true) => {
  switch (mode) {
    case 'Cash':
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
        }`}>
          💵 Cash
        </span>
      );
    case 'Bank':
    case 'Cheque':
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isDark ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-950 border border-sky-300'
        }`}>
          🏦 Bank/NEFT
        </span>
      );
    case 'GPay':
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isDark ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-950 border border-purple-300'
        }`}>
          📱 GPay / UPI
        </span>
      );
    default:
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'
        }`}>
          {mode}
        </span>
      );
  }
};

export const GeneratorSetsView: React.FC<GeneratorSetsViewProps> = ({
  products,
  bomLineItems,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddBomItem,
  onUpdateBomItem,
  onDeleteBomItem,
  onOpenPriceCalculator,
}) => {
  const { isDark } = useTheme();
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.productId || 'PRD-GEN-30KVA'
  );

  // Modals state
  const [isNewGeneratorModalOpen, setIsNewGeneratorModalOpen] = useState<boolean>(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState<boolean>(false);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState<boolean>(false);
  const [isEditPartModalOpen, setIsEditPartModalOpen] = useState<boolean>(false);

  // New Generator Form state
  const [newGenSerial, setNewGenSerial] = useState<string>('');
  const [newGenName, setNewGenName] = useState<string>('');
  const [newGenKva, setNewGenKva] = useState<number>(30);
  const [newGenPrice, setNewGenPrice] = useState<string>('650000');
  const [newGenStatus, setNewGenStatus] = useState<string>('In Production');

  // Add Part Form state
  const [newPartCategory, setNewPartCategory] = useState<string>('Core Power & Electricals');
  const [newPartName, setNewPartName] = useState<string>('');
  const [newPartAmount, setNewPartAmount] = useState<string>('');
  const [newPartVendor, setNewPartVendor] = useState<string>('');
  const [newPartPaymentMode, setNewPartPaymentMode] = useState<BOMLineItem['paymentMode']>('Bank');
  const [newPartDate, setNewPartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newPartNotes, setNewPartNotes] = useState<string>('');
  const [newPartIsMiscategorized, setNewPartIsMiscategorized] = useState<boolean>(false);

  // Edit Part Form state
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  const [editPartCategory, setEditPartCategory] = useState<string>('Core Power & Electricals');
  const [editPartName, setEditPartName] = useState<string>('');
  const [editPartAmount, setEditPartAmount] = useState<string>('');
  const [editPartVendor, setEditPartVendor] = useState<string>('');
  const [editPartPaymentMode, setEditPartPaymentMode] = useState<BOMLineItem['paymentMode']>('Bank');
  const [editPartDate, setEditPartDate] = useState<string>('');
  const [editPartNotes, setEditPartNotes] = useState<string>('');
  const [editPartIsMiscategorized, setEditPartIsMiscategorized] = useState<boolean>(false);

  // Edit Selling Price / Sale state
  const [editPriceRupees, setEditPriceRupees] = useState<string>('');
  const [editCustomer, setEditCustomer] = useState<string>('');
  const [editSaleStatus, setEditSaleStatus] = useState<string>('Prototype Built');
  const [editSerialNo, setEditSerialNo] = useState<string>('');

  // BOM search & category filter state
  const [bomSearch, setBomSearch] = useState<string>('');
  const [bomCategoryFilter, setBomCategoryFilter] = useState<string>('all');

  const selectedProduct = products.find((p) => p.productId === selectedProductId) || products[0];

  // Filter BOM items for this selected unit
  const unitBoms = selectedProduct
    ? bomLineItems.filter((b) => b.productId === selectedProduct.productId)
    : [];

  const validBoms = unitBoms.filter((b) => !b.isMiscategorized);
  const totalUnitCostPaise = validBoms.reduce((acc, b) => acc + BigInt(b.amount || 0), 0n);
  const sellingPricePaise = BigInt(selectedProduct?.sellingPrice || '0');
  const unitProfitPaise = sellingPricePaise > totalUnitCostPaise ? sellingPricePaise - totalUnitCostPaise : 0n;
  const isLoss = sellingPricePaise > 0n && sellingPricePaise < totalUnitCostPaise;
  const unitLossPaise = isLoss ? totalUnitCostPaise - sellingPricePaise : 0n;
  const marginPercent = sellingPricePaise > 0n
    ? Number((unitProfitPaise * 10000n) / sellingPricePaise) / 100
    : 0;

  // Group BOM items by Category dynamically
  const standardCategories: string[] = [
    'Core Power & Electricals',
    'Electrical, Instrumentation & Panels',
    'Acoustic Canopy & Enclosure',
    'Mechanical & Transmission',
    'Structure & Base Fabrication',
    'Fabrication & Machining',
    'Battery & Energy Storage',
    'Engineering & R&D Advance',
    'Engineering & Design',
    'Hardware & Fasteners',
    'Software & Subscriptions',
    'Major Components',
    'Electrical & Wiring',
    'Mechanical Parts & Fabrication',
    'Enclosure',
    'Labor/Vendor Payments',
    'Miscellaneous',
  ];

  const activeCategoriesInUnit = Array.from(new Set(unitBoms.map((b) => b.componentCategory)));
  const categoriesList = Array.from(
    new Set([
      ...standardCategories.filter((c) => activeCategoriesInUnit.includes(c)),
      ...activeCategoriesInUnit,
    ])
  );

  // Sorting mode for categories: 'fit' (balances title lengths so 2 items in 1 row fit cleanly), 'alpha' (A-Z), 'count' (most items)
  const [categorySortMode, setCategorySortMode] = useState<'fit' | 'alpha' | 'count'>('fit');

  const categoriesWithCounts = useMemo(() => {
    return categoriesList
      .map((cat) => ({
        name: cat,
        count: unitBoms.filter((b) => b.componentCategory === cat).length,
      }))
      .filter((item) => item.count > 0);
  }, [categoriesList, unitBoms]);

  // Sorted categories for the 2-in-1-row layout and display sections
  const sortedCategories = useMemo(() => {
    const list = [...categoriesWithCounts];
    if (categorySortMode === 'alpha') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (categorySortMode === 'count') {
      return list.sort((a, b) => b.count - a.count);
    }
    // 'fit' mode: Balanced so 2 items in 1 row fit cleanly together without overflow
    // In the 2-column grid, Slot 0 is 'All Parts' (short, ~14 chars).
    // Slot 1 is the longest category ('Electrical, Instrumentation & Panels', 36 chars) so Row 1 has ~50 chars.
    // The remaining categories are paired: longest with shortest.
    const byLength = [...list].sort((a, b) => b.name.length - a.name.length);
    const longest = byLength.shift();
    const balanced: typeof list = [];
    if (longest) {
      balanced.push(longest);
    }
    let left = 0;
    let right = byLength.length - 1;
    while (left <= right) {
      if (left === right) {
        balanced.push(byLength[left]);
        break;
      }
      balanced.push(byLength[left]);
      balanced.push(byLength[right]);
      left++;
      right--;
    }
    return balanced;
  }, [categoriesWithCounts, categorySortMode]);

  const handleOpenEditPrice = () => {
    if (!selectedProduct) return;
    setEditPriceRupees((Number(selectedProduct.sellingPrice || 0) / 100).toString());
    setEditCustomer(selectedProduct.customerName || '');
    setEditSaleStatus(selectedProduct.saleStatus || 'Prototype Built');
    setEditSerialNo(selectedProduct.serialNumber || selectedProduct.productId);
    setIsEditPriceModalOpen(true);
  };

  const handleSavePriceAndStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    await onUpdateProduct(selectedProduct.id, {
      sellingPrice: rupeesToPaise(editPriceRupees),
      customerName: editCustomer,
      saleStatus: editSaleStatus as any,
      serialNumber: editSerialNo,
    });
    setIsEditPriceModalOpen(false);
  };

  const handleCreateNewGenerator = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = `PRD-GEN-${newGenKva}KVA-${Date.now().toString().slice(-4)}`;
    const serial = newGenSerial || `GEN-${newGenKva}KVA-SN${Date.now().toString().slice(-3)}`;
    await onAddProduct({
      productId: pid,
      serialNumber: serial,
      productName: newGenName || `${newGenKva}kVA Generator Set (${serial})`,
      productLine: 'Generator Set',
      powerRatingKva: Number(newGenKva),
      status: newGenStatus as any,
      saleStatus: newGenStatus as any,
      sellingPrice: rupeesToPaise(newGenPrice),
      createdDate: new Date().toISOString().split('T')[0],
      targetLaunchDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    });
    setSelectedProductId(pid);
    setIsNewGeneratorModalOpen(false);
    setNewGenSerial('');
    setNewGenName('');
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    await onAddBomItem({
      productId: selectedProduct.productId,
      componentCategory: newPartCategory,
      itemName: newPartName,
      amount: rupeesToPaise(newPartAmount),
      vendorOrPersonName: newPartVendor,
      paymentMode: newPartPaymentMode,
      date: newPartDate,
      notes: newPartNotes,
      isEmployeeAdvance: false,
      isMiscategorized: newPartIsMiscategorized,
    });
    setIsAddPartModalOpen(false);
    setNewPartName('');
    setNewPartAmount('');
    setNewPartVendor('');
    setNewPartNotes('');
    setNewPartIsMiscategorized(false);
  };

  const handleOpenAddPart = (category?: string) => {
    if (category) {
      setNewPartCategory(category);
    }
    setIsAddPartModalOpen(true);
  };

  const handleOpenEditPart = (item: BOMLineItem) => {
    setEditingPartId(item.id);
    setEditPartCategory(item.componentCategory || 'Core Power & Electricals');
    setEditPartName(item.itemName || '');
    setEditPartAmount((Number(item.amount || 0) / 100).toString());
    setEditPartVendor(item.vendorOrPersonName || '');
    setEditPartPaymentMode((item.paymentMode as any) || 'Bank');
    setEditPartDate(item.date || new Date().toISOString().split('T')[0]);
    setEditPartNotes(item.notes || '');
    setEditPartIsMiscategorized(Boolean(item.isMiscategorized));
    setIsEditPartModalOpen(true);
  };

  const handleSaveEditPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartId) return;
    if (onUpdateBomItem) {
      await onUpdateBomItem(editingPartId, {
        componentCategory: editPartCategory,
        itemName: editPartName,
        amount: rupeesToPaise(editPartAmount),
        vendorOrPersonName: editPartVendor,
        paymentMode: editPartPaymentMode,
        date: editPartDate,
        notes: editPartNotes,
        isMiscategorized: editPartIsMiscategorized,
      });
    }
    setIsEditPartModalOpen(false);
    setEditingPartId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Generator Sets & Serial Number Costing
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every unit has a Serial Number. Categorize parts, enter selling price, and calculate exact profit.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsNewGeneratorModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Generator Unit</span>
        </button>
      </div>

      {/* Generator Unit Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {products.map((prod) => {
          const isSelected = prod.productId === selectedProductId;
          const count = bomLineItems.filter((b) => b.productId === prod.productId && !b.isMiscategorized).length;
          return (
            <button
              key={prod.id}
              onClick={() => setSelectedProductId(prod.productId)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left whitespace-nowrap transition ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                  isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {prod.powerRatingKva}k
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>{prod.serialNumber || prod.productId}</span>
                  {prod.status === 'Prototype' && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-normal">
                      Prototype
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  {count} parts entered • {prod.saleStatus || prod.status}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Generator Deep-Dive Card */}
      {selectedProduct && (
        <div className={`${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-6 shadow-xl space-y-6`}>
          {/* Top Unit Summary Banner */}
          <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-bold px-3 py-1 rounded-lg border ${
                  isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                }`}>
                  Serial Number: {selectedProduct.serialNumber || selectedProduct.productId}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}>
                  Status: {selectedProduct.saleStatus || selectedProduct.status}
                </span>
                {selectedProduct.customerName && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-sky-500/10 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-950 border-sky-300'
                  }`}>
                    Customer: {selectedProduct.customerName}
                  </span>
                )}
              </div>
              <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-950 font-black'}`}>
                {selectedProduct.productName}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Power Rating: {selectedProduct.powerRatingKva} kVA • Created: {selectedProduct.createdDate}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenPriceCalculator && (
                <button
                  type="button"
                  onClick={onOpenPriceCalculator}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                    isDark
                      ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300'
                  }`}
                  title="Open Interactive Selling Price & Profit Margin Percentage Calculator"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                  <span>🧮 Margin Calculator</span>
                </button>
              )}
              <button
                onClick={handleOpenEditPrice}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer border ${
                  isDark
                    ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-300'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Set Selling Price / Status</span>
              </button>
              <button
                onClick={() => setIsAddPartModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Part Cost</span>
              </button>
            </div>
          </div>

          {/* 3 Core Unit Economics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Unit Cost */}
            <div className={`${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4`}>
              <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Total Money Spent on this Unit (Cost)
              </span>
              <div className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-950 font-black'}`}>
                {formatPaiseToRupees(totalUnitCostPaise.toString())}
              </div>
              <span className={`text-[11px] block mt-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                Calculated from {validBoms.length} categorized components
              </span>
            </div>

            {/* 2. Selling Price */}
            <div className={`${isDark ? 'bg-slate-950/70 border-indigo-500/30' : 'bg-indigo-50/60 border-indigo-200'} border rounded-xl p-4 relative`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-900 font-bold'}`}>
                  Entered Selling Price
                </span>
                <div className="flex items-center gap-2">
                  {onOpenPriceCalculator && (
                    <button
                      type="button"
                      onClick={onOpenPriceCalculator}
                      className="text-[11px] text-emerald-500 hover:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Calculate target price & margin %"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Calculate</span>
                    </button>
                  )}
                  <button
                    onClick={handleOpenEditPrice}
                    className={`text-[10px] hover:underline cursor-pointer font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}
                  >
                    Edit Price
                  </button>
                </div>
              </div>
              <div className={`text-2xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-950 font-black'}`}>
                {formatPaiseToRupees(sellingPricePaise.toString())}
              </div>
              <span className={`text-[11px] block mt-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                Customer invoice / quote price
              </span>
            </div>

            {/* 3. Profit */}
            <div
              className={`rounded-xl p-4 border ${
                isLoss
                  ? isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                  : isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold block">
                  {isLoss ? 'Unit Loss' : 'Profit from this Unit'}
                </span>
                {onOpenPriceCalculator && (
                  <button
                    type="button"
                    onClick={onOpenPriceCalculator}
                    className="text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Margin Tool →
                  </button>
                )}
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {isLoss ? '-' : '+'}
                {formatPaiseToRupees((isLoss ? unitLossPaise : unitProfitPaise).toString())}
              </div>
              <span className="text-[11px] block mt-1 opacity-80">
                {isLoss
                  ? 'Selling price is lower than unit build cost'
                  : `${marginPercent}% Gross Profit Margin on this Generator Set`}
              </span>
            </div>
          </div>

          {/* Categorized Bill of Materials (BOM) */}
          <div className="space-y-4 pt-2">
            {/* Actual Prototype Cost Notice Banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">
                    Actual Prototype Cost: {formatPaiseToRupees(totalUnitCostPaise.toString())} ({validBoms.length} Actual Items)
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    All actual materials, machining (Sardar Ji), electricals, and R&D advances. Final build expected up to ~₹16,00,000.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block">Selling Price:</span>
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  {formatPaiseToRupees(sellingPricePaise.toString())}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                Categorised Component Costs (Serial #{selectedProduct.serialNumber || selectedProduct.productId})
              </h4>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search Box */}
                <div className="relative w-full sm:w-60">
                  <input
                    type="text"
                    placeholder="Search part, vendor, or note..."
                    value={bomSearch}
                    onChange={(e) => setBomSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddPart()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40 shrink-0"
                  title="Add new component to any category"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Component</span>
                </button>
              </div>
            </div>

            {/* Category Filter Toolbar & 2-Item-Per-Row Grid */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                    Category Filter (2 in 1 row):
                  </span>
                  {bomCategoryFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setBomCategoryFilter('all')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                    >
                      (Show All Categories)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Sorting Mode: Fit 2/Row, A-Z, Count */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold text-slate-400">
                    <span className="px-2 py-0.5 text-slate-500 font-mono text-[10px] uppercase">Sort:</span>
                    <button
                      type="button"
                      onClick={() => setCategorySortMode('fit')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                        categorySortMode === 'fit'
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'hover:text-slate-200'
                      }`}
                      title="Sort categories to balance title lengths and fit 2 items in 1 row"
                    >
                      Fit (2/Row)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategorySortMode('alpha')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                        categorySortMode === 'alpha'
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'hover:text-slate-200'
                      }`}
                      title="Sort categories alphabetically (A - Z)"
                    >
                      A - Z
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategorySortMode('count')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                        categorySortMode === 'count'
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'hover:text-slate-200'
                      }`}
                      title="Sort categories by number of items (highest to lowest)"
                    >
                      Count
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddPart()}
                    className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Add a new component to any category section"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Add in Section...</span>
                  </button>
                </div>
              </div>

              {/* 2 Items in One Row Grid (Reverted to original text-xs font size and badge styling) */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* 1st Item: All Parts */}
                <button
                  type="button"
                  onClick={() => setBomCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer border ${
                    bomCategoryFilter === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                      : isDark
                      ? 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200 font-bold'
                  }`}
                  title={`View all parts (${validBoms.length} total)`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">All Parts</span>
                  </span>
                  <span className="text-[10px] opacity-80 font-mono shrink-0">
                    ({validBoms.length})
                  </span>
                </button>

                {/* Remaining Categories (Sorted to Fit 2 in 1 Row) */}
                {sortedCategories.map((cat) => {
                  const meta = getCategoryMetadata(cat.name, isDark);
                  const CatIcon = meta.icon;
                  const isSelected = bomCategoryFilter === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setBomCategoryFilter(isSelected ? 'all' : cat.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                          : isDark
                          ? 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200 font-bold'
                      }`}
                      title={`${cat.name} (${cat.count})`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <CatIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : meta.color}`} />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="text-[10px] opacity-80 font-mono shrink-0">
                        ({cat.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {(bomCategoryFilter === 'all'
                ? sortedCategories.map((c) => c.name)
                : [bomCategoryFilter]
              ).map((category) => {
                  let itemsInCategory = unitBoms.filter((b) => b.componentCategory === category);
                  if (bomSearch) {
                    const q = bomSearch.toLowerCase();
                    itemsInCategory = itemsInCategory.filter(
                      (b) =>
                        b.itemName.toLowerCase().includes(q) ||
                        b.vendorOrPersonName.toLowerCase().includes(q) ||
                        (b.notes || '').toLowerCase().includes(q)
                    );
                  }
                  if (itemsInCategory.length === 0) return null;
                  const catTotal = itemsInCategory
                    .filter((b) => !b.isMiscategorized)
                    .reduce((acc, b) => acc + BigInt(b.amount || 0), 0n);

                  const meta = getCategoryMetadata(category, isDark);
                  const CatIcon = meta.icon;

                  return (
                    <div
                      key={category}
                      className={`${isDark ? 'bg-slate-950/60 border-slate-800/90' : 'bg-white border-slate-300 shadow-sm'} border rounded-2xl overflow-hidden shadow-lg`}
                    >
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b text-xs font-bold gap-2 ${
                        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        <span className="flex items-center gap-2">
                          <CatIcon className={`w-4 h-4 ${meta.color}`} />
                          <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-950'}`}>{category}</span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>({itemsInCategory.length} items)</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-800 font-black'}`}>
                            Subtotal: {formatPaiseToRupees(catTotal.toString())}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddPart(category)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer shadow-sm ${
                              isDark
                                ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300'
                            }`}
                            title={`Add component to ${category}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add in this Section</span>
                          </button>
                        </div>
                      </div>

                      <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                        {itemsInCategory.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between px-4 py-3 text-xs transition group ${
                              isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>{item.itemName}</span>
                                {renderPaymentBadge(item.paymentMode, isDark)}
                                {item.isMiscategorized && (
                                  <span className={`border text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-950 border-amber-300'
                                  }`}>
                                    Software / Subscription
                                  </span>
                                )}
                              </div>
                              <div className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <span>Vendor: <strong className={isDark ? 'text-slate-300' : 'text-slate-950 font-bold'}>{item.vendorOrPersonName}</strong></span>
                                <span>•</span>
                                <span>Date: {item.date}</span>
                                {item.notes && <span className={isDark ? 'text-slate-500' : 'text-slate-600 italic'}>({item.notes})</span>}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className={`font-black font-mono text-sm mr-1 ${isDark ? 'text-slate-100' : 'text-slate-950 font-extrabold'}`}>
                                {formatPaiseToRupees(item.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPart(item)}
                                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer border text-xs ${
                                  isDark
                                    ? 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/50 border-slate-800 hover:border-emerald-500/40'
                                    : 'text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 border-slate-300 hover:border-emerald-400 font-semibold'
                                }`}
                                title="Edit component entry"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteBomItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer border border-transparent hover:border-rose-300"
                                title="Delete component"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW GENERATOR SET (NEW SERIAL NUMBER) */}
      {isNewGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Register New Generator Unit
            </h3>
            <p className="text-xs text-slate-400">
              Create a new generator model or production unit with its unique serial number.
            </p>

            <form onSubmit={handleCreateNewGenerator} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Serial Number * (e.g. GEN-30KVA-002)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GEN-30KVA-002"
                  value={newGenSerial}
                  onChange={(e) => setNewGenSerial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Model / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30kVA Silent Acoustic Diesel Generator"
                  value={newGenName}
                  onChange={(e) => setNewGenName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Power Rating (kVA)
                  </label>
                  <input
                    type="number"
                    required
                    value={newGenKva}
                    onChange={(e) => setNewGenKva(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newGenPrice}
                    onChange={(e) => setNewGenPrice(e.target.value)}
                    placeholder="650000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Initial Status
                </label>
                <select
                  value={newGenStatus}
                  onChange={(e) => setNewGenStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Prototype">Prototype</option>
                  <option value="In Production">In Production</option>
                  <option value="Ready for Sale">Ready for Sale</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewGeneratorModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition"
                >
                  Save Generator Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD COMPONENT / PART TO SELECTED GENERATOR */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Add Part to Serial #{selectedProduct?.serialNumber || selectedProduct?.productId}
            </h3>
            <p className="text-xs text-slate-400">
              Enter component details and price spent for this generator set.
            </p>

            <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Component Category *
                </label>
                <select
                  value={newPartCategory}
                  onChange={(e) => setNewPartCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Core Power & Electricals">Core Power & Electricals (Alternator, Motor)</option>
                  <option value="Electrical, Instrumentation & Panels">Electrical, Instrumentation & Panels (Sockets, Wiring, Gauges)</option>
                  <option value="Acoustic Canopy & Enclosure">Acoustic Canopy & Enclosure</option>
                  <option value="Mechanical & Transmission">Mechanical & Transmission (Pulleys, Bearings, Gears, Belts)</option>
                  <option value="Structure & Base Fabrication">Structure & Base Fabrication (Steel Plates, Blocks, Channels, Angles)</option>
                  <option value="Fabrication & Machining">Fabrication & Machining (Sardar Ji, Boring, Lathe, Grinding)</option>
                  <option value="Battery & Energy Storage">Battery & Energy Storage (Exide, Cables, Advances)</option>
                  <option value="Engineering & R&D Advance">Engineering & R&D Advance (Ramendra IIT, Wahid Advances)</option>
                  <option value="Engineering & Design">Engineering & Design (Anurag CAD)</option>
                  <option value="Hardware & Fasteners">Hardware & Fasteners (Nut Bolts, Duct Tape)</option>
                  <option value="Major Components">Major Components</option>
                  <option value="Electrical & Wiring">Electrical & Wiring</option>
                  <option value="Mechanical Parts & Fabrication">Mechanical Parts & Fabrication</option>
                  <option value="Enclosure">Enclosure</option>
                  <option value="Labor/Vendor Payments">Labor/Vendor Payments</option>
                  <option value="Software & Subscriptions">Software & Subscriptions (Gemini / AI Tools)</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cummins Alternator 30kVA 3-Phase"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Amount Spent (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 135000"
                    value={newPartAmount}
                    onChange={(e) => setNewPartAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={newPartPaymentMode}
                    onChange={(e) => setNewPartPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Bank">Bank Transfer / NEFT</option>
                    <option value="GPay">GPay / UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Vendor / Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kirloskar Distributors"
                    value={newPartVendor}
                    onChange={(e) => setNewPartVendor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={newPartDate}
                    onChange={(e) => setNewPartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Notes / Specs
                </label>
                <input
                  type="text"
                  placeholder="Optional notes or invoice ref"
                  value={newPartNotes}
                  onChange={(e) => setNewPartNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">Software / Subscription Flag</span>
                  <span className="text-[11px] text-slate-500">Exclude this item from physical hardware Capex</span>
                </div>
                <input
                  type="checkbox"
                  checked={newPartIsMiscategorized}
                  onChange={(e) => setNewPartIsMiscategorized(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Part & Update Cost</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT SELLING PRICE & CUSTOMER */}
      {isEditPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Update Selling Price & Unit Status
            </h3>
            <p className="text-xs text-slate-400">
              Enter your selling price for this generator set to calculate your exact profit.
            </p>

            <form onSubmit={handleSavePriceAndStatus} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={editSerialNo}
                  onChange={(e) => setEditSerialNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Selling Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 650000"
                    value={editPriceRupees}
                    onChange={(e) => setEditPriceRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-bold font-mono text-sm"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Unit Build Cost: {formatPaiseToRupees(totalUnitCostPaise.toString())}
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Sale Status
                </label>
                <select
                  value={editSaleStatus}
                  onChange={(e) => setEditSaleStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Prototype Built">Prototype Built (In Testing)</option>
                  <option value="Ready for Sale">Ready for Sale (Available)</option>
                  <option value="Sold">Sold (Revenue Collected)</option>
                  <option value="In Production">In Production / Assembly</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Customer Name (If quoted or sold)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Industrial Polymers"
                  value={editCustomer}
                  onChange={(e) => setEditCustomer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditPriceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition"
                >
                  Update Price & Profit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT COMPONENT / PART ENTRY */}
      {isEditPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <span>Edit Component / Part Entry</span>
              </h3>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                ID #{editingPartId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Update component pricing, supplier, payment method, or re-assign to another section.
            </p>

            <form onSubmit={handleSaveEditPart} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Component Category / Section *
                </label>
                <select
                  value={editPartCategory}
                  onChange={(e) => setEditPartCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Core Power & Electricals">Core Power & Electricals (Alternator, Motor)</option>
                  <option value="Electrical, Instrumentation & Panels">Electrical, Instrumentation & Panels (Sockets, Wiring, Gauges)</option>
                  <option value="Acoustic Canopy & Enclosure">Acoustic Canopy & Enclosure</option>
                  <option value="Mechanical & Transmission">Mechanical & Transmission (Pulleys, Bearings, Gears, Belts)</option>
                  <option value="Structure & Base Fabrication">Structure & Base Fabrication (Steel Plates, Blocks, Channels, Angles)</option>
                  <option value="Fabrication & Machining">Fabrication & Machining (Sardar Ji, Boring, Lathe, Grinding)</option>
                  <option value="Battery & Energy Storage">Battery & Energy Storage (Exide, Cables, Advances)</option>
                  <option value="Engineering & R&D Advance">Engineering & R&D Advance (Ramendra IIT, Wahid Advances)</option>
                  <option value="Engineering & Design">Engineering & Design (Anurag CAD)</option>
                  <option value="Hardware & Fasteners">Hardware & Fasteners (Nut Bolts, Duct Tape)</option>
                  <option value="Software & Subscriptions">Software & Subscriptions (Gemini / AI Tools)</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Item Description / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alternator, Pully, Sardar Ji lathe work"
                  value={editPartName}
                  onChange={(e) => setEditPartName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Amount Spent (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 35000"
                      value={editPartAmount}
                      onChange={(e) => setEditPartAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-bold font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={editPartPaymentMode}
                    onChange={(e) => setEditPartPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Bank">Bank Transfer / NEFT</option>
                    <option value="GPay">GPay / UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Vendor / Supplier / Workshop
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sardar Ji Workshop"
                    value={editPartVendor}
                    onChange={(e) => setEditPartVendor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={editPartDate}
                    onChange={(e) => setEditPartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Notes / Technical Specifications
                </label>
                <input
                  type="text"
                  placeholder="Optional specs, invoice number, or technical note"
                  value={editPartNotes}
                  onChange={(e) => setEditPartNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">Software / Subscription Flag</span>
                  <span className="text-[11px] text-slate-500">Exclude this item from physical hardware Capex</span>
                </div>
                <input
                  type="checkbox"
                  checked={editPartIsMiscategorized}
                  onChange={(e) => setEditPartIsMiscategorized(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditPartModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
