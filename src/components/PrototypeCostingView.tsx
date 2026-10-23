// src/components/PrototypeCostingView.tsx
import React, { useState } from 'react';
import { ProductPrototype, BOMLineItem } from '../types.ts';
import { BOM_COMPONENT_CATEGORIES } from '../data/categories.ts';
import {
  formatPaiseToRupees,
  rupeesToPaise,
  calculatePrototypeUnitCost,
} from '../utils/calculations.ts';
import {
  Cpu,
  Plus,
  AlertOctagon,
  CheckCircle2,
  Filter,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PrototypeCostingViewProps {
  products: ProductPrototype[];
  bomLineItems: BOMLineItem[];
  onAddProduct: (prod: Partial<ProductPrototype>) => Promise<void>;
  onAddBomItem: (item: Partial<BOMLineItem>) => Promise<void>;
  userRole: string;
}

export const PrototypeCostingView: React.FC<PrototypeCostingViewProps> = ({
  products,
  bomLineItems,
  onAddProduct,
  onAddBomItem,
  userRole,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.productId || 'PROD-GEN-30KVA'
  );

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Form State for new BOM Item
  const [formCategory, setFormCategory] = useState<any>(BOM_COMPONENT_CATEGORIES[0]);
  const [formItemName, setFormItemName] = useState<string>('');
  const [formAmountRupees, setFormAmountRupees] = useState<string>('');
  const [formVendor, setFormVendor] = useState<string>('');
  const [formPaymentMode, setFormPaymentMode] = useState<'Bank' | 'Cash' | 'GPay' | 'Cheque'>('Bank');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form State for new Product
  const [formProdId, setFormProdId] = useState<string>('');
  const [formProdName, setFormProdName] = useState<string>('');
  const [formPowerKva, setFormPowerKva] = useState<string>('30');
  const [formProductLine, setFormProductLine] = useState<string>('Diesel Generator Sets');

  // Active product line items
  const activeBomItems = bomLineItems.filter((i) => i.productId === selectedProductId);
  const currentProduct = products.find((p) => p.productId === selectedProductId);

  // Calculate Unit Cost and Auto-Exclusions
  const costSummary = calculatePrototypeUnitCost(activeBomItems);

  const handleAddBomItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(formAmountRupees);

    await onAddBomItem({
      productId: selectedProductId,
      componentCategory: formCategory,
      itemName: formItemName,
      amount: amountPaise,
      vendorOrPersonName: formVendor,
      paymentMode: formPaymentMode,
      date: formDate,
      isEmployeeAdvance: false,
    });

    setIsAddItemModalOpen(false);
    setFormItemName('');
    setFormAmountRupees('');
    setFormVendor('');
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddProduct({
      productId: formProdId,
      productName: formProdName,
      productLine: formProductLine,
      powerRatingKva: parseInt(formPowerKva) || 30,
      status: 'Prototype',
      createdDate: new Date().toISOString().split('T')[0],
      targetLaunchDate: '2027-03-31',
      targetKvaBenchmark: parseInt(formPowerKva) || 30,
    });
    setSelectedProductId(formProdId);
    setIsAddProductModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Prototype Costing & Bill of Materials (BOM) Module
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Component-level cost breakdown with auto-exclusion rules for miscategorized items (e.g., software licenses excluded from prototype hardware BOM).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(userRole === 'Admin/Owner' || userRole === 'Finance/CA' || userRole === 'Department Head') && (
            <>
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                + New Product Prototype
              </button>
              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add BOM Line Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Selector Bar */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {products.map((p) => {
          const isSelected = p.productId === selectedProductId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProductId(p.productId)}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{p.productName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                {p.powerRatingKva} kVA
              </span>
            </button>
          );
        })}
      </div>

      {/* Prototype Unit Cost Analysis Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Total Valid Prototype Hardware Cost:</span>
          <div className="text-2xl font-extrabold text-white mt-1">
            {formatPaiseToRupees(costSummary.totalUnitCostPaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {costSummary.validItemCount} approved hardware components
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Excluded Miscategorized Cost:</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            {formatPaiseToRupees(costSummary.excludedCostPaise)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {costSummary.excludedItemCount} items flagged (software / SaaS licenses)
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <span className="text-slate-400">Product Line & Power Benchmark:</span>
          <div className="text-xl font-bold text-indigo-300 mt-1">
            {currentProduct?.productLine || 'Generators'} ({currentProduct?.powerRatingKva} kVA)
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Status: <span className="font-semibold text-emerald-400">{currentProduct?.status}</span>
          </div>
        </div>
      </div>

      {/* Auto-Exclusion Rule Notice if excluded items present */}
      {costSummary.excludedItemCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-200">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-300">
              Audit Rule Enforced: Software & SaaS Subscription Auto-Exclusion
            </div>
            <p className="text-slate-300 mt-0.5">
              The BOM engine automatically scans line items for recurring software, design licenses, or cloud subscriptions (e.g. AutoCAD, SolidWorks, ChatGPT, AWS). These items are strictly removed from unit BOM inventory cost and must be booked under <strong>Operating Expenses → Technology & IT</strong> to avoid distorting gross margins.
            </p>
          </div>
        </div>
      )}

      {/* Category Cost Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(costSummary.byCategory).map(([cat, amountPaise]) => (
          <div key={cat} className="p-3 bg-slate-800/70 border border-slate-700/70 rounded-lg text-xs">
            <div className="text-[11px] font-medium text-slate-400 truncate">{cat}</div>
            <div className="text-sm font-bold text-white mt-1">
              {formatPaiseToRupees(amountPaise, { compact: true })}
            </div>
          </div>
        ))}
      </div>

      {/* BOM Line Items Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Item Name</th>
                <th className="py-3 px-3">BOM Category</th>
                <th className="py-3 px-3">Vendor / Payee</th>
                <th className="py-3 px-2 text-center">Payment Mode</th>
                <th className="py-3 px-3 text-right font-bold text-white">Amount (Paise)</th>
                <th className="py-3 px-3 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-200">
              {activeBomItems.map((item) => (
                <tr
                  key={item.id}
                  className={`transition ${
                    item.isMiscategorized
                      ? 'bg-rose-950/20 hover:bg-rose-950/30'
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <td className="py-3 px-3 font-mono text-slate-400">{item.date}</td>
                  <td className="py-3 px-3">
                    <div className={`font-semibold ${item.isMiscategorized ? 'text-rose-300' : 'text-white'}`}>
                      {item.itemName}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-200">
                      {item.componentCategory}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{item.vendorOrPersonName}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                      {item.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-indigo-300">
                    {formatPaiseToRupees(item.amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.isMiscategorized ? (
                      <div className="inline-flex flex-col items-center" title={item.miscategorizedReason}>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-900/80 text-rose-200 border border-rose-700">
                          Excluded from BOM
                        </span>
                        <span className="text-[9px] text-rose-400 mt-0.5 max-w-[140px] truncate">
                          {item.miscategorizedReason}
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700">
                        Included in Prototype COGS
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add BOM Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-4">
              Add Component to {currentProduct?.productName} BOM
            </h3>
            <form onSubmit={handleAddBomItemSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Component / Item Name</label>
                <input
                  type="text"
                  required
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  placeholder="e.g. Copper Windings / SolidWorks CAD License"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    {BOM_COMPONENT_CATEGORIES.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹)</label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    required
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    placeholder="e.g. Copper Craft Ltd"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Bank">Bank</option>
                    <option value="GPay">GPay</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

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

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Add to BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 text-xs text-slate-200">
            <h3 className="text-base font-bold text-white mb-4">Create New Product Prototype</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Product ID / Code</label>
                <input
                  type="text"
                  required
                  value={formProdId}
                  onChange={(e) => setFormProdId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  placeholder="e.g. PROD-GEN-62.5KVA"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formProdName}
                  onChange={(e) => setFormProdName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  placeholder="e.g. 62.5 kVA Silent DG Set"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Power Rating (kVA)</label>
                  <input
                    type="number"
                    required
                    value={formPowerKva}
                    onChange={(e) => setFormPowerKva(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Product Line</label>
                  <input
                    type="text"
                    required
                    value={formProductLine}
                    onChange={(e) => setFormProductLine(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Create Prototype
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
