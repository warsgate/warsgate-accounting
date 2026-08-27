import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Wrench, 
  Box, 
  TrendingUp, 
  Zap, 
  Cpu, 
  ShieldCheck, 
} from 'lucide-react';
import { ProductService } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface InventoryViewProps {
  products: ProductService[];
  onAddProduct: (product: ProductService) => void;
  onUpdateProduct: (product: ProductService) => void;
  onDeleteProduct: (id: string) => void;
}

type FormData = {
  code: string;
  name: string;
  category: 'AUTOMATION_HARDWARE' | 'SOFTWARE' | 'ENGINEERING_SERVICE' | 'MAINTENANCE';
  type: 'PRODUCT' | 'SERVICE';
  unit: string;
  unitPrice: number;
  costPrice: number;
  stockQty: number;
  minStockAlert: number;
  description: string;
};

const emptyForm: FormData = {
  code: '', name: '', category: 'AUTOMATION_HARDWARE', type: 'PRODUCT',
  unit: 'เครื่อง', unitPrice: 0, costPrice: 0, stockQty: 0, minStockAlert: 3, description: '',
};

const CATEGORY_LABELS: Record<string, string> = {
  AUTOMATION_HARDWARE: 'ฮาร์ดแวร์ / อุปกรณ์อัตโนมัติ',
  SOFTWARE: 'ซอฟต์แวร์ / ระบบโปรแกรม',
  ENGINEERING_SERVICE: 'บริการวิศวกรรม / ติดตั้ง',
  MAINTENANCE: 'บำรุงรักษา / PM',
};

const CATEGORY_COLORS: Record<string, string> = {
  AUTOMATION_HARDWARE: 'bg-blue-500/10 text-blue-700 border-blue-200/80',
  SOFTWARE: 'bg-purple-500/10 text-purple-700 border-purple-200/80',
  ENGINEERING_SERVICE: 'bg-emerald-500/10 text-emerald-700 border-emerald-200/80',
  MAINTENANCE: 'bg-amber-500/10 text-amber-700 border-amber-200/80',
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  products, onAddProduct, onUpdateProduct, onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<ProductService | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ProductService | null>(null);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchType = typeFilter === 'ALL' || p.type === typeFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  // ── Open Add / Edit ────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(emptyForm);
    setEditingItem(null);
    setModalMode('add');
  };

  const openEdit = (p: ProductService) => {
    setFormData({
      code: p.code, name: p.name, category: p.category, type: p.type,
      unit: p.unit, unitPrice: p.unitPrice, costPrice: p.costPrice,
      stockQty: p.stockQty, minStockAlert: p.minStockAlert, description: p.description || '',
    });
    setEditingItem(p);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingItem(null);
    setFormData(emptyForm);
  };

  // ── Auto-generate SKU ──────────────────────────────────────────────────────
  const SKU_PREFIXES: Record<string, string> = {
    AUTOMATION_HARDWARE: 'HW',
    SOFTWARE: 'SW',
    ENGINEERING_SERVICE: 'ENG',
    MAINTENANCE: 'MNT',
  };

  const autoGenerateSKU = () => {
    const prefix = SKU_PREFIXES[formData.category] || 'SKU';
    const existing = products
      .map(p => p.code)
      .filter(code => code.startsWith(`${prefix}-`))
      .map(code => {
        const num = parseInt(code.split('-').pop() || '0', 10);
        return isNaN(num) ? 0 : num;
      });
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    const newSKU = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    setF('code', newSKU);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (modalMode === 'add') {
      const newItem: ProductService = {
        id: `PROD-${Date.now()}`,
        code: formData.code || `ITEM-${Math.floor(Math.random() * 9000 + 1000)}`,
        name: formData.name.trim(),
        category: formData.category,
        type: formData.type,
        unit: formData.unit || 'ชิ้น',
        unitPrice: Number(formData.unitPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stockQty: formData.type === 'PRODUCT' ? (Number(formData.stockQty) || 0) : 0,
        minStockAlert: Number(formData.minStockAlert) || 0,
        description: formData.description.trim(),
      };
      onAddProduct(newItem);
    } else if (modalMode === 'edit' && editingItem) {
      onUpdateProduct({
        ...editingItem,
        code: formData.code,
        name: formData.name.trim(),
        category: formData.category,
        type: formData.type,
        unit: formData.unit,
        unitPrice: Number(formData.unitPrice),
        costPrice: Number(formData.costPrice),
        stockQty: formData.type === 'PRODUCT' ? Number(formData.stockQty) : 0,
        minStockAlert: Number(formData.minStockAlert),
        description: formData.description.trim(),
      });
    }
    closeModal();
  };

  const setF = (field: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const margin = (p: ProductService) =>
    p.unitPrice > 0 ? (((p.unitPrice - p.costPrice) / p.unitPrice) * 100).toFixed(1) : '0';

  // ── Summary Metrics ─────────────────────────────────────────────────────────
  const totalProducts = products.filter(p => p.type === 'PRODUCT').length;
  const totalServices = products.filter(p => p.type === 'SERVICE').length;
  const lowStock = products.filter(p => p.type === 'PRODUCT' && p.stockQty <= p.minStockAlert).length;
  const totalUnitsInStock = products.filter(p => p.type === 'PRODUCT').reduce((sum, p) => sum + (p.stockQty || 0), 0);
  const totalInventoryRetailValue = products.filter(p => p.type === 'PRODUCT').reduce((sum, p) => sum + ((p.stockQty || 0) * (p.unitPrice || 0)), 0);
  const totalInventoryCostValue = products.filter(p => p.type === 'PRODUCT').reduce((sum, p) => sum + ((p.stockQty || 0) * (p.costPrice || 0)), 0);

  return (
    <div className="space-y-3 pb-2 flex flex-col h-[calc(100vh-80px)] overflow-hidden">

      {/* ── Compact Futuristic Header & Action Bar ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-purple-200">
              <Package className="w-4 h-4" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-900 bg-clip-text text-transparent">
              คลังสินค้า & รายการบริการ (Inventory Matrix)
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <span>ฐานข้อมูลฮาร์ดแวร์ Automation, บอร์ด PLC, ระบบซอฟต์แวร์ และค่าแรงวิศวกรรม</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-purple-600 font-bold">WARSGATE System</span>
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-200/70 transition-all hover:scale-[1.01] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ เพิ่มสินค้า / บริการใหม่</span>
        </button>
      </div>

      {/* ── Compact Futuristic KPI Cards (4 Balanced Cards) ────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        
        {/* Card 1: Hardware Products */}
        <div className="relative overflow-hidden p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white via-sky-50/30 to-blue-50/50 border border-sky-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">สินค้าและฮาร์ดแวร์</span>
            <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold font-mono text-sky-700">{totalProducts}</span>
            <span className="text-[10px] font-semibold text-slate-400">รายการ SKU</span>
          </div>
          <div className="mt-1 pt-1 border-t border-sky-100/80 flex items-center justify-between text-[9px] text-slate-500">
            <span>สต็อกคงเหลือรวม:</span>
            <strong className="font-mono text-slate-700">{totalUnitsInStock} ชิ้น</strong>
          </div>
        </div>

        {/* Card 2: Software & Engineering Services */}
        <div className="relative overflow-hidden p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50 border border-purple-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">บริการ & ซอฟต์แวร์</span>
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold font-mono text-purple-700">{totalServices}</span>
            <span className="text-[10px] font-semibold text-slate-400">รายการบริการ</span>
          </div>
          <div className="mt-1 pt-1 border-t border-purple-100/80 flex items-center justify-between text-[9px] text-slate-500">
            <span>ประเภท:</span>
            <strong className="text-purple-700 truncate max-w-[120px]">PLC, SCADA, Manpower</strong>
          </div>
        </div>

        {/* Card 3: Stock Health Radar */}
        <div className="relative overflow-hidden p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 border border-emerald-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">สุขภาพสต็อก</span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${lowStock > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
              {lowStock > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-lg sm:text-xl font-extrabold font-mono ${lowStock > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {lowStock > 0 ? `${lowStock} รายการ` : '100%'}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {lowStock > 0 ? 'สต็อกต่ำเกณฑ์' : 'สต็อกสมบูรณ์'}
            </span>
          </div>
          <div className="mt-1 pt-1 border-t border-emerald-100/80 flex items-center justify-between text-[9px]">
            <span className="text-slate-500">สถานะ:</span>
            <span className={`font-bold flex items-center gap-1 ${lowStock > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${lowStock > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              {lowStock > 0 ? 'ต้องสั่งซื้อเพิ่ม' : 'พร้อมส่งมอบ'}
            </span>
          </div>
        </div>

        {/* Card 4: Inventory Asset Valuation */}
        <div className="relative overflow-hidden p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white via-amber-50/30 to-orange-50/50 border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">มูลค่าสต็อกคงคลัง</span>
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-extrabold font-mono text-amber-800 tracking-tight">฿{formatMoney(totalInventoryRetailValue)}</span>
          </div>
          <div className="mt-1 pt-1 border-t border-amber-100/80 flex items-center justify-between text-[9px] text-slate-500">
            <span>ต้นทุนรวม:</span>
            <strong className="font-mono text-slate-700">฿{formatMoney(totalInventoryCostValue)}</strong>
          </div>
        </div>

      </div>

      {/* ── Compact Cyber-Toolbar ───────────────────────────────────────────── */}
      <div className="glass-panel p-2 sm:p-2.5 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-sm border border-slate-200/90 bg-white/90 shrink-0">
        
        {/* Left: Cyber Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหารหัส SKU, ชื่อสินค้า, บอร์ด PLC, สเปกบริการ..."
            className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400/20 transition"
          />
        </div>

        {/* Right: Futuristic Pill Category Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200 text-xs shrink-0">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 text-xs ${
              typeFilter === 'ALL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${typeFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setTypeFilter('PRODUCT')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 text-xs ${
              typeFilter === 'PRODUCT'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3 h-3" />
            <span>สินค้า ({totalProducts})</span>
          </button>

          <button
            onClick={() => setTypeFilter('SERVICE')}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 text-xs ${
              typeFilter === 'SERVICE'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span>บริการ ({totalServices})</span>
          </button>
        </div>

      </div>

      {/* ── Table Container (Flex 1 to occupy remaining height) ──────────────── */}
      <div className="glass-panel p-2 sm:p-3 rounded-2xl shadow-sm border border-slate-200 flex-1 min-h-0 flex flex-col">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 my-auto">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-xs">ไม่พบรายการสินค้าหรือบริการตามคำค้นหา</p>
            <p className="text-[11px] mt-0.5">ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มรายการใหม่</p>
          </div>
        ) : (
          <div className="table-scroll flex-1 min-h-0 rounded-xl border border-slate-200 shadow-inner">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="py-2.5 px-3">รหัสสินค้า / SKU</th>
                  <th className="py-2.5 px-3">ชื่อสินค้า / บริการ</th>
                  <th className="py-2.5 px-3">หมวดหมู่ระบบ</th>
                  <th className="py-2.5 px-3 text-right">ราคาทุน</th>
                  <th className="py-2.5 px-3 text-right">ราคาขาย</th>
                  <th className="py-2.5 px-3 text-right">มาร์จิ้น %</th>
                  <th className="py-2.5 px-3 text-center">สถานะสต็อก</th>
                  <th className="py-2.5 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(item => {
                  const isLowStock = item.type === 'PRODUCT' && item.stockQty <= item.minStockAlert;
                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition group">
                      <td className="py-2 px-3">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-2 px-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate text-[11px]">{item.name}</div>
                        {item.description && <div className="text-[9px] text-slate-400 truncate mt-0.5">{item.description}</div>}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold ${CATEGORY_COLORS[item.category]}`}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-400 text-[11px]">฿{formatMoney(item.costPrice)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 text-[11px]">฿{formatMoney(item.unitPrice)}</td>
                      <td className="py-2 px-3 text-right">
                        <span className="font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[10px]">
                          +{margin(item)}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.type === 'SERVICE' ? (
                          <span className="text-slate-400 text-[11px]">—</span>
                        ) : (
                          <span className={`font-mono font-bold text-sm ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                            {item.stockQty} {item.unit}
                            {isLowStock && <span className="ml-1 text-[9px] text-rose-500">⚠ ต่ำ</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition shadow-sm"
                            title="แก้ไข">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition shadow-sm"
                            title="ลบ">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ═════════════════════════════════════════════════ */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">

            <div className={`px-6 py-4 flex items-center justify-between ${
              modalMode === 'edit' ? 'bg-gradient-to-r from-sky-600 to-sky-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'
            }`}>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {modalMode === 'edit' ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {modalMode === 'edit' ? `แก้ไข: ${editingItem?.name}` : 'เพิ่มสินค้า / บริการใหม่'}
              </h2>
              <button onClick={closeModal} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">

              {/* ประเภท */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">ประเภทรายการ</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PRODUCT', 'SERVICE'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setF('type', t)}
                      className={`py-2 rounded-xl font-bold border text-xs transition ${
                        formData.type === t
                          ? t === 'PRODUCT' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>
                      {t === 'PRODUCT' ? '📦 สินค้า (มีสต็อก)' : '🔧 บริการ (Man-Day)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* รหัส + หมวดหมู่ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 flex items-center justify-between">
                    <span>รหัสสินค้า (SKU) *</span>
                    <button type="button" onClick={autoGenerateSKU}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-[10px] transition">
                      <Zap className="w-3 h-3" />
                      Auto
                    </button>
                  </label>
                  <input required type="text" value={formData.code} onChange={e => setF('code', e.target.value)}
                    placeholder="กด Auto หรือพิมพ์เอง"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">หมวดหมู่</label>
                  <select value={formData.category} onChange={e => {
                    setF('category', e.target.value);
                  }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:border-purple-400">
                    <option value="AUTOMATION_HARDWARE">⚙️ Automation Hardware</option>
                    <option value="SOFTWARE">💾 Software</option>
                    <option value="ENGINEERING_SERVICE">🔧 Engineering Service</option>
                    <option value="MAINTENANCE">🛠️ Maintenance</option>
                  </select>
                </div>
              </div>

              {/* ชื่อสินค้า */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">ชื่อสินค้า / บริการ *</label>
                <input required type="text" value={formData.name} onChange={e => setF('name', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-400" />
              </div>

              {/* คำอธิบาย */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">คำอธิบาย</label>
                <textarea rows={2} value={formData.description} onChange={e => setF('description', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 resize-none focus:outline-none focus:border-purple-400" />
              </div>

              {/* ราคา */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">หน่วย</label>
                  <select
                    value={[
                      'เครื่อง','ชุด','อัน','ตัว','กล่อง','ใบ','แผ่น','เส้น','ม้วน','กิโลกรัม',
                      'ลิตร','บาร์เรล','Man-Day','Man-Hour','เดือน','ปี','สัญญา','งวด','โปรเจค','ชิ้น'
                    ].includes(formData.unit) ? formData.unit : '__custom__'}
                    onChange={e => {
                      if (e.target.value !== '__custom__') setF('unit', e.target.value);
                      else setF('unit', '');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:border-purple-400"
                  >
                    <optgroup label="📦 สินค้า / อุปกรณ์">
                      <option value="เครื่อง">เครื่อง</option>
                      <option value="ชุด">ชุด</option>
                      <option value="อัน">อัน</option>
                      <option value="ตัว">ตัว</option>
                      <option value="ชิ้น">ชิ้น</option>
                      <option value="กล่อง">กล่อง</option>
                      <option value="ใบ">ใบ</option>
                      <option value="แผ่น">แผ่น</option>
                      <option value="เส้น">เส้น</option>
                      <option value="ม้วน">ม้วน</option>
                      <option value="กิโลกรัม">กิโลกรัม</option>
                      <option value="ลิตร">ลิตร</option>
                      <option value="บาร์เรล">บาร์เรล</option>
                    </optgroup>
                    <optgroup label="🔧 บริการ / โปรเจค">
                      <option value="Man-Day">Man-Day</option>
                      <option value="Man-Hour">Man-Hour</option>
                      <option value="เดือน">เดือน</option>
                      <option value="ปี">ปี</option>
                      <option value="สัญญา">สัญญา</option>
                      <option value="งวด">งวด</option>
                      <option value="โปรเจค">โปรเจค</option>
                    </optgroup>
                    <option value="__custom__">✏️ กำหนดเอง...</option>
                  </select>
                  {/* Custom unit input */}
                  {!['เครื่อง','ชุด','อัน','ตัว','กล่อง','ใบ','แผ่น','เส้น','ม้วน','กิโลกรัม',
                     'ลิตร','บาร์เรล','Man-Day','Man-Hour','เดือน','ปี','สัญญา','งวด','โปรเจค','ชิ้น'].includes(formData.unit) && (
                    <input
                      autoFocus
                      type="text"
                      placeholder="พิมพ์หน่วยที่ต้องการ..."
                      value={formData.unit}
                      onChange={e => setF('unit', e.target.value)}
                      className="mt-2 w-full bg-purple-50 border border-purple-300 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ราคาทุน (บาท)</label>
                  <input type="number" min={0} value={formData.costPrice} onChange={e => setF('costPrice', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ราคาขาย (บาท) *</label>
                  <input required type="number" min={0} value={formData.unitPrice} onChange={e => setF('unitPrice', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-400" />
                </div>
              </div>

              {/* สต็อก — เฉพาะ PRODUCT */}
              {formData.type === 'PRODUCT' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div>
                    <label className="block text-blue-600 font-semibold mb-1">จำนวนสต็อกคงเหลือ</label>
                    <input type="number" min={0} value={formData.stockQty} onChange={e => setF('stockQty', Number(e.target.value))}
                      className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-blue-600 font-semibold mb-1">แจ้งเตือนสต็อกต่ำ</label>
                    <input type="number" min={0} value={formData.minStockAlert} onChange={e => setF('minStockAlert', Number(e.target.value))}
                      className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
              )}

              {/* กำไรขั้นต้น preview */}
              {formData.unitPrice > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    <span>กำไรขั้นต้น:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700">
                      {formatMoney(formData.unitPrice - formData.costPrice)}
                    </span>
                    <span className="text-emerald-500 ml-2 font-bold">
                      ({formData.unitPrice > 0 ? (((formData.unitPrice - formData.costPrice) / formData.unitPrice) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition">
                  ยกเลิก
                </button>
                <button type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-sm transition active:scale-95 ${
                    modalMode === 'edit' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-purple-600 hover:bg-purple-500'
                  }`}>
                  {modalMode === 'edit' ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ═══════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">ยืนยันการลบ</h3>
                <p className="text-xs text-slate-400 mt-0.5">ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-xs font-bold text-rose-700">{deleteTarget.name}</p>
              <p className="text-[11px] text-rose-500 font-mono mt-0.5">รหัส: {deleteTarget.code}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition">
                ยกเลิก
              </button>
              <button onClick={() => { onDeleteProduct(deleteTarget.id); setDeleteTarget(null); }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95">
                <Trash2 className="w-3.5 h-3.5" />
                ลบออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
