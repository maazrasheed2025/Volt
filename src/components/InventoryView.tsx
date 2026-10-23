import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types.ts';
import { formatPaiseToRupees, rupeesToPaise } from '../utils/calculations.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUpDown,
  Edit2,
  Trash2,
  PackagePlus,
  PackageMinus,
  X,
  Check,
  Building,
  TrendingDown,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Partial<InventoryItem>) => Promise<void>;
  onUpdateInventoryItem: (id: number, updates: Partial<InventoryItem>) => Promise<void>;
  onAdjustStock: (id: number, delta: number, reason: string, notes?: string) => Promise<void>;
  onDeleteInventoryItem: (id: number) => Promise<void>;
  userRole?: string;
}

const CATEGORIES = [
  'All',
  'Core Alternator & Stator',
  'Engine & Mechanical Parts',
  'Acoustic Canopy & Sheet Metal',
  'Control Panels & Wiring',
  'Electronics & Sensors',
  'Fasteners & Consumables',
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onAdjustStock,
  onDeleteInventoryItem,
  userRole,
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reorder' | 'healthy' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'name_asc' | 'name_desc' | 'stock_asc' | 'stock_desc' | 'price_desc' | 'price_asc' | 'lead_time'>('default');
  const [priceRange, setPriceRange] = useState<'all' | 'under_10k' | '10k_50k' | 'above_50k'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustReason, setAdjustReason] = useState<string>('Stock replenishment from supplier');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const [isSupplierDirectoryOpen, setIsSupplierDirectoryOpen] = useState(false);

  // Form State for Add / Edit
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Core Alternator & Stator');
  const [formDescription, setFormDescription] = useState('');
  const [formStock, setFormStock] = useState('1');
  const [formUnit, setFormUnit] = useState('Pcs');
  const [formMinStock, setFormMinStock] = useState('2');
  const [formReorderPoint, setFormReorderPoint] = useState('5');
  const [formUnitCostRupees, setFormUnitCostRupees] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSupplierPerson, setFormSupplierPerson] = useState('');
  const [formSupplierPhone, setFormSupplierPhone] = useState('');
  const [formSupplierEmail, setFormSupplierEmail] = useState('');
  const [formSupplierAddress, setFormSupplierAddress] = useState('');
  const [formLeadTime, setFormLeadTime] = useState('7');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Summary Metrics
  const totalItemsCount = inventory.length;

  const totalValuationPaise = useMemo(() => {
    return inventory.reduce((acc, item) => {
      const stock = BigInt(Math.max(0, item.currentStock || 0));
      const cost = BigInt(item.unitCost || '0');
      return acc + stock * cost;
    }, 0n);
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.currentStock <= item.reorderPoint);
  }, [inventory]);

  const outOfStockItems = useMemo(() => {
    return inventory.filter((item) => item.currentStock <= 0);
  }, [inventory]);

  const uniqueSuppliers = useMemo(() => {
    const map = new Map<string, { name: string; contact?: string; phone?: string; email?: string; address?: string; itemsCount: number }>();
    inventory.forEach((item) => {
      const sName = item.supplierName.trim();
      if (!sName) return;
      const existing = map.get(sName);
      if (existing) {
        existing.itemsCount += 1;
      } else {
        map.set(sName, {
          name: sName,
          contact: item.supplierContactPerson,
          phone: item.supplierPhone,
          email: item.supplierEmail,
          address: item.supplierAddress,
          itemsCount: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [inventory]);

  // Filtered & Sorted List
  const filteredInventory = useMemo(() => {
    const list = inventory.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'reorder' && item.currentStock > item.reorderPoint) {
        return false;
      }
      if (statusFilter === 'out_of_stock' && item.currentStock > 0) {
        return false;
      }
      if (statusFilter === 'healthy' && item.currentStock <= item.reorderPoint) {
        return false;
      }

      // Price range filter
      const costPaise = BigInt(item.unitCost || '0');
      if (priceRange === 'under_10k' && costPaise > 1000000n) {
        return false; // > ₹10,000
      }
      if (priceRange === '10k_50k' && (costPaise <= 1000000n || costPaise > 5000000n)) {
        return false; // not in ₹10k - ₹50k
      }
      if (priceRange === 'above_50k' && costPaise <= 5000000n) {
        return false; // <= ₹50,000
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesSupplier = item.supplierName.toLowerCase().includes(q);
        const matchesPerson = (item.supplierContactPerson || '').toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        return matchesName || matchesSku || matchesSupplier || matchesPerson || matchesCategory;
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'stock_asc') {
        return a.currentStock - b.currentStock;
      }
      if (sortBy === 'stock_desc') {
        return b.currentStock - a.currentStock;
      }
      if (sortBy === 'price_desc') {
        const diff = BigInt(b.unitCost || '0') - BigInt(a.unitCost || '0');
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      }
      if (sortBy === 'price_asc') {
        const diff = BigInt(a.unitCost || '0') - BigInt(b.unitCost || '0');
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      }
      if (sortBy === 'lead_time') {
        return (a.leadTimeDays || 0) - (b.leadTimeDays || 0);
      }
      return a.id - b.id;
    });
  }, [inventory, selectedCategory, statusFilter, priceRange, searchQuery, sortBy]);

  // Handlers
  const handleOpenAdd = () => {
    setFormSku('');
    setFormName('');
    setFormCategory('Core Alternator & Stator');
    setFormDescription('');
    setFormStock('5');
    setFormUnit('Pcs');
    setFormMinStock('2');
    setFormReorderPoint('6');
    setFormUnitCostRupees('15000');
    setFormSupplierName('');
    setFormSupplierPerson('');
    setFormSupplierPhone('');
    setFormSupplierEmail('');
    setFormSupplierAddress('');
    setFormLeadTime('7');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormSku(item.sku);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormDescription(item.description || '');
    setFormStock(item.currentStock.toString());
    setFormUnit(item.unit || 'Pcs');
    setFormMinStock(item.minStockLevel.toString());
    setFormReorderPoint(item.reorderPoint.toString());
    setFormUnitCostRupees((Number(item.unitCost || '0') / 100).toString());
    setFormSupplierName(item.supplierName);
    setFormSupplierPerson(item.supplierContactPerson || '');
    setFormSupplierPhone(item.supplierPhone || '');
    setFormSupplierEmail(item.supplierEmail || '');
    setFormSupplierAddress(item.supplierAddress || '');
    setFormLeadTime((item.leadTimeDays || 7).toString());
    setFormNotes(item.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const unitCostPaise = rupeesToPaise(formUnitCostRupees || '0');
      await onAddInventoryItem({
        sku: formSku.trim() || undefined,
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        currentStock: parseInt(formStock) || 0,
        unit: formUnit.trim() || 'Pcs',
        minStockLevel: parseInt(formMinStock) || 2,
        reorderPoint: parseInt(formReorderPoint) || 5,
        unitCost: unitCostPaise,
        supplierName: formSupplierName.trim(),
        supplierContactPerson: formSupplierPerson.trim(),
        supplierPhone: formSupplierPhone.trim(),
        supplierEmail: formSupplierEmail.trim(),
        supplierAddress: formSupplierAddress.trim(),
        leadTimeDays: parseInt(formLeadTime) || 7,
        notes: formNotes.trim(),
      });
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const unitCostPaise = rupeesToPaise(formUnitCostRupees || '0');
      await onUpdateInventoryItem(editingItem.id, {
        sku: formSku.trim(),
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        currentStock: parseInt(formStock) || 0,
        unit: formUnit.trim() || 'Pcs',
        minStockLevel: parseInt(formMinStock) || 2,
        reorderPoint: parseInt(formReorderPoint) || 5,
        unitCost: unitCostPaise,
        supplierName: formSupplierName.trim(),
        supplierContactPerson: formSupplierPerson.trim(),
        supplierPhone: formSupplierPhone.trim(),
        supplierEmail: formSupplierEmail.trim(),
        supplierAddress: formSupplierAddress.trim(),
        leadTimeDays: parseInt(formLeadTime) || 7,
        notes: formNotes.trim(),
      });
      setIsEditModalOpen(false);
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdjust = (item: InventoryItem, defaultType: 'in' | 'out' = 'in') => {
    setAdjustItem(item);
    setAdjustType(defaultType);
    setAdjustDelta(1);
    setAdjustReason(defaultType === 'in' ? 'Received shipment from supplier' : 'Consumed in generator assembly');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    setIsSubmitting(true);
    try {
      const delta = adjustType === 'in' ? Math.abs(adjustDelta) : -Math.abs(adjustDelta);
      await onAdjustStock(adjustItem.id, delta, adjustReason);
      setIsAdjustModalOpen(false);
      setAdjustItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      await onDeleteInventoryItem(deletingItem.id);
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Raw Material Inventory & Supply Chain
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Factory Stock Ledger
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Track real-time stock levels, automated reorder points, safety thresholds, and direct supplier contact details for generator manufacturing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Supplier Directory Button */}
          <button
            type="button"
            onClick={() => setIsSupplierDirectoryOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Building className="w-4 h-4 text-sky-400" />
            <span>Suppliers Directory ({uniqueSuppliers.length})</span>
          </button>

          {/* Add Raw Material Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* 2. Key Inventory Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total SKUs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Raw Materials Tracked</span>
            <Boxes className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalItemsCount} <span className="text-sm font-normal text-slate-400">SKUs</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across 6 critical generator component categories
          </div>
        </div>

        {/* Metric 2: Total Inventory Valuation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Total Stock Valuation</span>
            <span className="text-emerald-400 font-mono font-bold text-xs">ASSET</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatPaiseToRupees(totalValuationPaise.toString())}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Current on-hand raw material book value
          </div>
        </div>

        {/* Metric 3: Low Stock Reorder Alerts */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'reorder' ? 'all' : 'reorder')}
          className={`border rounded-xl p-4 shadow-lg cursor-pointer transition ${
            lowStockItems.length > 0
              ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={lowStockItems.length > 0 ? 'text-amber-300' : 'text-slate-400'}>
              Reorder Alerts Needed
            </span>
            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {lowStockItems.length} <span className="text-sm font-normal text-amber-400/80">Items</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 flex items-center justify-between">
            <span>Stock ≤ Reorder Point</span>
            <span className="underline text-[10px]">Filter View →</span>
          </div>
        </div>

        {/* Metric 4: Verified Suppliers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Active Suppliers</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {uniqueSuppliers.length} <span className="text-sm font-normal text-slate-400">Vendors</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg lead time: ~6 business days
          </div>
        </div>
      </div>

      {/* 3. Reorder Alerts Banner (When items need reordering) */}
      {lowStockItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-xl p-4 text-xs shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-200 block">
                  Action Required: {lowStockItems.length} Raw Material(s) have reached Reorder Point!
                </span>
                <span className="text-slate-300 text-[11px]">
                  {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit} left, reorder at ${i.reorderPoint})`).join(' • ')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter('reorder')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <span>View Reorder Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Filter Tabs & Search Controls */}
      <div className={`space-y-3 border rounded-xl p-4 shadow-md transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${inventory.length})` },
              { id: 'reorder', label: `⚠️ Reorder (${lowStockItems.length})` },
              { id: 'out_of_stock', label: `🔴 Out of Stock (${outOfStockItems.length})` },
              { id: 'healthy', label: `🟢 Healthy (${inventory.length - lowStockItems.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-md'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Search + Sort controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`py-1.5 px-2.5 text-xs rounded-lg border font-semibold transition focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500'
                }`}
                title="Sort inventory list"
              >
                <option value="default">Sort: Default (ID)</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="stock_asc">Stock: Low to High (Critical first)</option>
                <option value="stock_desc">Stock: High to Low</option>
                <option value="price_desc">Price: Highest first</option>
                <option value="price_asc">Price: Lowest first</option>
                <option value="lead_time">Lead Time: Shortest first</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search part name, SKU, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-lg pl-8 pr-7 py-1.5 text-xs transition focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
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

        {/* Second Row: Price Range Filter & Category Filter Chips */}
        <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <span className={`text-[11px] font-semibold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? isDark ? 'bg-slate-100 text-slate-900 font-bold' : 'bg-slate-900 text-white font-bold'
                    : isDark ? 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Price Range Filter Chips */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-semibold mr-1 flex items-center gap-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <DollarSign className="w-3 h-3 text-emerald-500" />
              <span>Price:</span>
            </span>
            {[
              { id: 'all', label: 'All Prices' },
              { id: 'under_10k', label: '< ₹10k' },
              { id: '10k_50k', label: '₹10k–₹50k' },
              { id: 'above_50k', label: '> ₹50k' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPriceRange(p.id as any)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  priceRange === p.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Inventory Table / Cards */}
      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-500" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              Raw Material Stock & Supplier Register ({filteredInventory.length} Items)
            </h3>
          </div>
          <span className={`text-xs hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Directly linked to 30kVA Generator BOM & Procurement
          </span>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Boxes className="w-10 h-10 mx-auto text-slate-400" />
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No inventory items matched your filter</p>
            <p className="text-xs">Try clearing the search query or category / price filters.</p>
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
            {filteredInventory.map((item) => {
              const isOutOfStock = item.currentStock <= 0;
              const isLowStock = !isOutOfStock && item.currentStock <= item.reorderPoint;
              const isCriticalBuffer = !isOutOfStock && item.currentStock <= item.minStockLevel;

              const totalValuationPaise = BigInt(Math.max(0, item.currentStock)) * BigInt(item.unitCost || '0');
              const bufferRatio = item.reorderPoint > 0 ? Math.min(100, Math.round((item.currentStock / item.reorderPoint) * 100)) : 100;

              return (
                <div
                  key={item.id}
                  className={`p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition hover:bg-slate-800/40 ${
                    isOutOfStock
                      ? 'bg-rose-950/15'
                      : isLowStock
                      ? 'bg-amber-950/10'
                      : ''
                  }`}
                >
                  {/* Left: Item SKU & Name */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {item.sku}
                      </span>
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        · {item.category}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}

                    {/* Supplier Contact Info Card */}
                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-purple-400" />
                        {item.supplierName}
                      </span>

                      {item.supplierContactPerson && (
                        <span>· Contact: <strong className="text-slate-300 font-normal">{item.supplierContactPerson}</strong></span>
                      )}

                      {item.supplierPhone && (
                        <a
                          href={`tel:${item.supplierPhone}`}
                          className="text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                          title="Call Supplier"
                        >
                          <Phone className="w-3 h-3 text-sky-400" />
                          <span>{item.supplierPhone}</span>
                        </a>
                      )}

                      {item.supplierEmail && (
                        <a
                          href={`mailto:${item.supplierEmail}`}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline hidden sm:flex"
                          title="Email Supplier"
                        >
                          <Mail className="w-3 h-3 text-emerald-400" />
                          <span>{item.supplierEmail}</span>
                        </a>
                      )}

                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Lead Time: {item.leadTimeDays || 7} Days
                      </span>
                    </div>
                  </div>

                  {/* Middle: Stock Level & Reorder Status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto shrink-0 py-2 lg:py-0 border-y lg:border-y-0 border-slate-800">
                    {/* Stock vs Reorder Point */}
                    <div className="space-y-1 min-w-[170px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Current Stock:</span>
                        <span className={`font-mono font-bold text-sm ${
                          isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </div>

                      {/* Visual progress bar against reorder point */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOutOfStock
                              ? 'bg-rose-500 w-0'
                              : isCriticalBuffer
                              ? 'bg-rose-500'
                              : isLowStock
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, bufferRatio))}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Min: {item.minStockLevel} {item.unit}</span>
                        <span className={isLowStock ? 'text-amber-400 font-bold' : ''}>
                          Reorder at: {item.reorderPoint} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Unit Cost & Total Value */}
                    <div className="text-left sm:text-right min-w-[130px]">
                      <span className="text-[10px] text-slate-500 block">Unit Cost / Valuation</span>
                      <div className="text-xs font-mono text-slate-300 font-semibold">
                        {formatPaiseToRupees(item.unitCost)} / {item.unit}
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        {formatPaiseToRupees(totalValuationPaise.toString())}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
                    {/* Quick Stock In (+) */}
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(item, 'in')}
                      className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 rounded-lg transition"
                      title="Quick Stock In (+ received delivery)"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>

                    {/* Quick Stock Out (-) */}
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(item, 'out')}
                      className="p-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 rounded-lg transition"
                      title="Quick Stock Out (- consumed for generator build)"
                    >
                      <PackageMinus className="w-4 h-4" />
                    </button>

                    {/* Prominent Edit Item Button (Available on ALL items) */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        isDark
                          ? 'bg-sky-950/70 hover:bg-sky-900 text-sky-300 hover:text-white border-sky-500/40'
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
                      }`}
                      title="Edit item specifications, unit cost, reorder point & supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Edit Item</span>
                    </button>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingItem(item);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg transition border border-slate-700"
                      title="Delete raw material from inventory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD RAW MATERIAL INVENTORY ITEM                  */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-amber-400" />
                  Add Raw Material to Inventory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Register new parts, set automated reorder points, and link supplier contact info.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              {/* Part Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 30kVA 4-Pole Brushless Alternator"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    SKU / Part Code (Optional - Auto generated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RAW-ALT-010"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Component Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Sets">Sets</option>
                    <option value="Kg">Kg (Kilograms)</option>
                    <option value="Meters">Meters</option>
                    <option value="Liters">Liters</option>
                  </select>
                </div>
              </div>

              {/* Stock Levels & Reorder Thresholds */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-slate-200 font-bold block uppercase tracking-wider text-[11px]">
                  Stock Quantities & Automated Reorder Point
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold font-mono focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Reorder Point *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formReorderPoint}
                      onChange={(e) => setFormReorderPoint(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-amber-300 font-bold font-mono focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Min Safety Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Unit Cost (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g. 45000"
                        value={formUnitCostRupees}
                        onChange={(e) => setFormUnitCostRupees(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-emerald-400 font-bold font-mono focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Details */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-slate-200 font-bold block uppercase tracking-wider text-[11px]">
                  Supplier & Procurement Contact Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Supplier / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Crompton Greaves Power"
                      value={formSupplierName}
                      onChange={(e) => setFormSupplierName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Harish Sharma"
                      value={formSupplierPerson}
                      onChange={(e) => setFormSupplierPerson(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98112 45890"
                      value={formSupplierPhone}
                      onChange={(e) => setFormSupplierPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="supplier@company.in"
                      value={formSupplierEmail}
                      onChange={(e) => setFormSupplierEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formLeadTime}
                      onChange={(e) => setFormLeadTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Supplier Location / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 42, Sector 25, Industrial Area, Faridabad, Haryana"
                    value={formSupplierAddress}
                    onChange={(e) => setFormSupplierAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Adding...' : 'Add to Stock Register'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT RAW MATERIAL INVENTORY ITEM                 */}
      {/* ======================================================== */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sky-400" />
                  Edit Raw Material Item
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update stock levels, reorder thresholds, or supplier contact details for <strong>{editingItem.sku}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Component Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Sets">Sets</option>
                    <option value="Kg">Kg (Kilograms)</option>
                    <option value="Meters">Meters</option>
                    <option value="Liters">Liters</option>
                  </select>
                </div>
              </div>

              {/* Stock Levels & Reorder Thresholds */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-slate-200 font-bold block uppercase tracking-wider text-[11px]">
                  Stock Quantities & Automated Reorder Point
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Current Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-bold font-mono focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Reorder Point *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formReorderPoint}
                      onChange={(e) => setFormReorderPoint(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-amber-300 font-bold font-mono focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Min Safety Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Unit Cost (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formUnitCostRupees}
                        onChange={(e) => setFormUnitCostRupees(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-emerald-400 font-bold font-mono focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Details */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-slate-200 font-bold block uppercase tracking-wider text-[11px]">
                  Supplier & Procurement Contact Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Supplier / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formSupplierName}
                      onChange={(e) => setFormSupplierName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formSupplierPerson}
                      onChange={(e) => setFormSupplierPerson(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formSupplierPhone}
                      onChange={(e) => setFormSupplierPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formSupplierEmail}
                      onChange={(e) => setFormSupplierEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formLeadTime}
                      onChange={(e) => setFormLeadTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Supplier Location / Address
                  </label>
                  <input
                    type="text"
                    value={formSupplierAddress}
                    onChange={(e) => setFormSupplierAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-950/50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Part Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: QUICK STOCK IN / OUT ADJUSTMENT                 */}
      {/* ======================================================== */}
      {isAdjustModalOpen && adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-amber-400" />
                  Adjust Stock: {adjustItem.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {adjustItem.sku} · Current: {adjustItem.currentStock} {adjustItem.unit}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdjustModalOpen(false);
                  setAdjustItem(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-3.5 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('in');
                    setAdjustReason('Received delivery from supplier');
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                    adjustType === 'in'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Stock In (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('out');
                    setAdjustReason('Consumed in 30kVA Generator assembly');
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                    adjustType === 'out'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <PackageMinus className="w-4 h-4" />
                  <span>Stock Out (-)</span>
                </button>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Quantity to {adjustType === 'in' ? 'Add' : 'Deduct'} ({adjustItem.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold font-mono focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received shipment, Assembly usage, Physical audit"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex justify-between items-center">
                <span>New Stock Balance:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {Math.max(0, adjustItem.currentStock + (adjustType === 'in' ? adjustDelta : -adjustDelta))} {adjustItem.unit}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustModalOpen(false);
                    setAdjustItem(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg ${
                    adjustType === 'in' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Updating...' : `Confirm ${adjustType === 'in' ? 'Addition' : 'Deduction'}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SUPPLIER DIRECTORY DRAWER                        */}
      {/* ======================================================== */}
      {isSupplierDirectoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />
                  Verified Suppliers & Vendor Directory ({uniqueSuppliers.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct procurement contacts for generator alternators, diesel engines, acoustic sheet metal, and AMF electronics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierDirectoryOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {uniqueSuppliers.map((supplier) => (
                <div
                  key={supplier.name}
                  className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {supplier.name}
                    </h4>
                    <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono shrink-0">
                      {supplier.itemsCount} Part(s)
                    </span>
                  </div>

                  {supplier.contact && (
                    <div className="text-xs text-slate-300 font-medium">
                      Contact: <span>{supplier.contact}</span>
                    </div>
                  )}

                  {supplier.phone && (
                    <div className="text-xs flex items-center gap-1.5 text-sky-400">
                      <Phone className="w-3.5 h-3.5" />
                      <a href={`tel:${supplier.phone}`} className="hover:underline font-mono">
                        {supplier.phone}
                      </a>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="text-xs flex items-center gap-1.5 text-emerald-400">
                      <Mail className="w-3.5 h-3.5" />
                      <a href={`mailto:${supplier.email}`} className="hover:underline truncate max-w-[240px]">
                        {supplier.email}
                      </a>
                    </div>
                  )}

                  {supplier.address && (
                    <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1 border-t border-slate-800/60">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSupplierDirectoryOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CONFIRM ITEM DELETION                            */}
      {/* ======================================================== */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                Delete Raw Material Item?
              </h3>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p>
                Are you sure you want to remove <strong>{deletingItem.name}</strong> ({deletingItem.sku}) from your inventory register?
              </p>
              <p className="text-[11px] text-slate-400">
                Supplier link to <strong>{deletingItem.supplierName}</strong> and stock records will be removed.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingItem(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Deleting...' : 'Yes, Delete Item'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
