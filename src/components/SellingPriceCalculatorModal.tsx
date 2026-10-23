// src/components/SellingPriceCalculatorModal.tsx
import React, { useState, useMemo } from 'react';
import { ProductPrototype, BOMLineItem } from '../types.ts';
import { formatPaiseToRupees, rupeesToPaise } from '../utils/calculations.ts';
import {
  Calculator,
  X,
  TrendingUp,
  Percent,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  ShieldCheck,
  Building,
  Target,
  ArrowRight,
  Sliders,
} from 'lucide-react';

interface SellingPriceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductPrototype[];
  bomLineItems: BOMLineItem[];
  corporateTaxRate?: number;
  onUpdateProductPrice?: (id: number, updates: Partial<ProductPrototype>) => Promise<void>;
}

export const SellingPriceCalculatorModal: React.FC<SellingPriceCalculatorModalProps> = ({
  isOpen,
  onClose,
  products,
  bomLineItems,
  corporateTaxRate = 25,
  onUpdateProductPrice,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<number>(
    products[0]?.id || 1
  );

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Actual BOM unit cost for selected product
  const actualBomCostPaise = useMemo(() => {
    if (!selectedProduct) return 38000000n; // Default ~₹3.8L
    const pid = selectedProduct.productId;
    const unitBoms = bomLineItems.filter(
      (b) => b.productId === pid || b.productId === selectedProduct.serialNumber
    );
    const validBoms = unitBoms.filter((b) => !b.isMiscategorized);
    const total = validBoms.reduce((acc, b) => acc + BigInt(b.amount || 0), 0n);
    return total > 0n ? total : 38000000n;
  }, [selectedProduct, bomLineItems]);

  const costRupees = Number(actualBomCostPaise) / 100;
  const costLakhs = costRupees / 100000;

  // Simulator Price in Lakhs (default initialized from product selling price)
  const initialPriceLakhs = selectedProduct?.sellingPrice
    ? Number(selectedProduct.sellingPrice) / 100 / 100000
    : 18.5;

  const [targetPriceLakhs, setTargetPriceLakhs] = useState<number>(initialPriceLakhs);
  const [desiredMarginPercent, setDesiredMarginPercent] = useState<number>(25);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  // Calculations
  const targetPricePaise = BigInt(Math.round(targetPriceLakhs * 100000 * 100));
  const targetPriceRupees = targetPriceLakhs * 100000;

  const isLoss = targetPricePaise < actualBomCostPaise;
  const grossProfitPaise = !isLoss ? targetPricePaise - actualBomCostPaise : 0n;
  const grossLossPaise = isLoss ? actualBomCostPaise - targetPricePaise : 0n;
  const grossProfitRupees = Number(grossProfitPaise) / 100;

  // Margin % = (Profit / Selling Price) * 100
  const grossMarginPercent =
    targetPricePaise > 0n
      ? !isLoss
        ? Number((grossProfitPaise * 10000n) / targetPricePaise) / 100
        : -Number((grossLossPaise * 10000n) / targetPricePaise) / 100
      : 0;

  // Markup % = (Profit / Cost) * 100
  const markupPercent =
    actualBomCostPaise > 0n
      ? !isLoss
        ? Number((grossProfitPaise * 10000n) / actualBomCostPaise) / 100
        : -Number((grossLossPaise * 10000n) / actualBomCostPaise) / 100
      : 0;

  // Corporate Tax and Net Profit
  const taxLiabilityPaise = !isLoss
    ? (grossProfitPaise * BigInt(corporateTaxRate)) / 100n
    : 0n;
  const netProfitPaise = !isLoss ? grossProfitPaise - taxLiabilityPaise : 0n;
  const netProfitRupees = Number(netProfitPaise) / 100;
  const netMarginPercent =
    targetPricePaise > 0n ? Number((netProfitPaise * 10000n) / targetPricePaise) / 100 : 0;

  // Break-even price
  const breakEvenRupees = costRupees;
  const breakEvenLakhs = costLakhs;

  // Calculate required price from desired margin %
  const calculatePriceForMargin = (margin: number) => {
    if (margin >= 100) return;
    const requiredPriceRupees = costRupees / (1 - margin / 100);
    const requiredLakhs = Math.round((requiredPriceRupees / 100000) * 100) / 100;
    setTargetPriceLakhs(requiredLakhs);
    setDesiredMarginPercent(margin);
  };

  const handleApplyToProduct = async () => {
    if (!selectedProduct || !onUpdateProductPrice) return;
    setIsApplying(true);
    try {
      await onUpdateProductPrice(selectedProduct.id, {
        sellingPrice: targetPricePaise.toString(),
      });
      setAppliedSuccess(
        `Applied ₹${targetPriceLakhs.toFixed(2)} Lakhs (${grossMarginPercent.toFixed(1)}% margin) as official selling price for ${selectedProduct.productName}!`
      );
      setTimeout(() => setAppliedSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
    >
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-6 text-slate-100">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Selling Price & Profit Margin Percentage Calculator
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulate unit pricing, gross margins, markup percentages, and post-tax net profit return.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {appliedSuccess && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-xs font-semibold text-emerald-200 flex items-center gap-2 animate-fadeIn shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedSuccess}</span>
          </div>
        )}

        {/* Product Selection & Actual Unit Cost Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Select Generator Unit:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} (SN #{p.serialNumber || p.productId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Actual Unit BOM Cost (Build Cost):
            </label>
            <div className="px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center">
              <span className="font-mono text-emerald-300 font-bold">
                {formatPaiseToRupees(actualBomCostPaise.toString())}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                (~₹{costLakhs.toFixed(2)}L)
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Price Input & Slider */}
        <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Target Selling Price:
            </span>

            {/* Price in Lakhs + Direct input */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="60"
                  value={targetPriceLakhs}
                  onChange={(e) => setTargetPriceLakhs(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-28 bg-slate-900 border border-emerald-500/60 rounded-xl pl-6 pr-2 py-1.5 text-emerald-300 font-mono font-black text-sm focus:outline-none focus:border-emerald-400 text-right"
                />
              </div>
              <span className="text-xs font-bold text-slate-300">Lakhs</span>
              <span className="text-xs text-slate-400 font-mono">
                (= ₹{targetPriceRupees.toLocaleString('en-IN')})
              </span>
            </div>
          </div>

          {/* Range Slider from ₹2.0L to ₹30.0L */}
          <input
            type="range"
            min="2.0"
            max="35.0"
            step="0.1"
            value={targetPriceLakhs}
            onChange={(e) => setTargetPriceLakhs(parseFloat(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition"
          />

          {/* Quick Target Margin Buttons */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>Quick Target Margin Presets (Click to Auto-Calculate Selling Price):</span>
              <span className="font-mono text-slate-500">Break-even: ₹{breakEvenLakhs.toFixed(2)}L</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: 'Break-even (0%)', margin: 0 },
                { label: '10% Margin', margin: 10 },
                { label: '15% Margin', margin: 15 },
                { label: '20% Margin', margin: 20 },
                { label: '25% Margin', margin: 25 },
                { label: '30% Margin', margin: 30 },
                { label: '40% Margin', margin: 40 },
              ].map((m) => {
                const isSelected = Math.abs(grossMarginPercent - m.margin) < 1.0;
                return (
                  <button
                    key={m.margin}
                    type="button"
                    onClick={() => calculatePriceForMargin(m.margin)}
                    className={`px-2.5 py-1 rounded-lg border font-mono transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Metrics Grid: Margin %, Profit, Markup, Net Return */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Gross Profit Margin % */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isLoss
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span className="text-[11px] block text-slate-400 font-medium">Gross Profit Margin:</span>
            <span className="text-xl sm:text-2xl font-black font-mono block mt-1">
              {grossMarginPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] block text-slate-400 mt-0.5">
              {isLoss ? 'Selling at Loss' : 'of Selling Price'}
            </span>
          </div>

          {/* 2. Gross Unit Profit ₹ */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isLoss
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}
          >
            <span className="text-[11px] block text-slate-400 font-medium">
              {isLoss ? 'Unit Loss:' : 'Gross Unit Profit:'}
            </span>
            <span
              className={`text-xl sm:text-2xl font-black font-mono block mt-1 ${
                isLoss ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isLoss ? '-' : '+'}₹
              {(isLoss ? Number(grossLossPaise) / 100 : grossProfitRupees).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] block text-slate-400 mt-0.5">
              Price - Direct Cost
            </span>
          </div>

          {/* 3. Markup % on Cost */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100">
            <span className="text-[11px] block text-slate-400 font-medium">Markup on Cost:</span>
            <span className="text-xl sm:text-2xl font-black font-mono block mt-1 text-sky-400">
              {markupPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] block text-slate-400 mt-0.5">
              Profit / BOM Cost
            </span>
          </div>

          {/* 4. Net Margin after Tax */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/30 text-indigo-200">
            <span className="text-[11px] block text-slate-400 font-medium">
              Net Margin (Post {corporateTaxRate}% Tax):
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono block mt-1 text-indigo-300">
              {netMarginPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] block text-slate-400 mt-0.5">
              Net Profit: ₹{netProfitRupees.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="text-slate-400 text-[11px]">
            Formula: <span className="font-mono text-slate-300">Margin% = (Price - Cost) / Price × 100</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition cursor-pointer"
            >
              Close
            </button>

            {onUpdateProductPrice && (
              <button
                type="button"
                disabled={isApplying}
                onClick={handleApplyToProduct}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isApplying ? 'Saving Price...' : `Apply ₹${targetPriceLakhs.toFixed(2)}L to Generator`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
