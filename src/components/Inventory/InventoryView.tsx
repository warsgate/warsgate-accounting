import React, { useState, useMemo } from 'react';
import { 
  Package, Plus, Search, Pencil, Trash2, AlertTriangle, 
  Wrench, Box, TrendingUp, Zap, Cpu, ShieldCheck, ArrowRightLeft,
  Download, Filter, Layers, MapPin, Building2, CheckCircle2, Clock, Sparkles,
  ArrowDownLeft, ArrowUpRight, RefreshCw, ShoppingCart
} from 'lucide-react';
import { ProductService, StockMovement, StockMovementType } from '../../types';
import { formatMoney } from '../../utils/formatters';
import { STOCK_LOCATIONS, initialStockMovements } from '../../data/initialStockMovements';
import { addAuditLog } from '../../utils/auditLogger';

interface InventoryViewProps {
  products: ProductService[];
  onAddProduct: (product: ProductService) => void;
  onUpdateProduct: (product: ProductService) => void;
  onDeleteProduct: (id: string) => void;
  onOpenCreatePoForProduct?: (product: ProductService) => void;
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

const MOVEMENT_LABELS: Record<StockMovementType, { label: string; color: string; icon: any }> = {
  IN: { label: 'รับเข้า (Stock In)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowDownLeft },
  OUT: { label: 'เบิกใช้ (Stock Out)', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ArrowUpRight },
  TRANSFER: { label: 'โอนย้ายไซต์ (Transfer)', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: ArrowRightLeft },
  ADJUST: { label: 'ปรับปรุงสต็อก (Adjust)', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw },
};

const STOCK_STORAGE_KEY = 'warsgate_stock_movements';

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenCreatePoForProduct
}) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'LEDGER' | 'LOCATIONS'>('CATALOG');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE' | 'LOW_STOCK'>('ALL');
  
  // Modal States
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<ProductService | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ProductService | null>(null);

  // Stock Movement Ledger State
  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STOCK_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialStockMovements;
  });

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState<{
    productId: string;
    type: StockMovementType;
    quantity: number;
    locationFrom: string;
    locationTo: string;
    referenceDocNo: string;
    referenceProject: string;
    performedBy: string;
    notes: string;
  }>({
    productId: products[0]?.id || '',
    type: 'IN',
    quantity: 1,
    locationFrom: 'HQ_KHLONG_LUANG',
    locationTo: 'SITE_PNP',
    referenceDocNo: '',
    referenceProject: '',
    performedBy: 'สมชาย จัดหา',
    notes: ''
  });

  const saveMovements = (list: StockMovement[]) => {
    setMovements(list);
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(list));
  };

  // ── Valuation Analytics ──────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const hardwareProducts = products.filter(p => p.type === 'PRODUCT');
    const totalCostValue = hardwareProducts.reduce((sum, p) => sum + ((p.stockQty || 0) * (p.costPrice || 0)), 0);
    const totalRetailValue = hardwareProducts.reduce((sum, p) => sum + ((p.stockQty || 0) * (p.unitPrice || 0)), 0);
    const lowStockItems = hardwareProducts.filter(p => (p.stockQty || 0) <= (p.minStockAlert || 0));
    const totalUnits = hardwareProducts.reduce((sum, p) => sum + (p.stockQty || 0), 0);

    return {
      totalProducts: products.length,
      hardwareCount: hardwareProducts.length,
      totalCostValue,
      totalRetailValue,
      lowStockCount: lowStockItems.length,
      totalUnits,
      profitPotential: totalRetailValue - totalCostValue
    };
  }, [products]);

  // ── Filtered Products ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return products.filter(p => {
      let matchType = true;
      if (typeFilter === 'PRODUCT') matchType = p.type === 'PRODUCT';
      else if (typeFilter === 'SERVICE') matchType = p.type === 'SERVICE';
      else if (typeFilter === 'LOW_STOCK') matchType = p.type === 'PRODUCT' && (p.stockQty || 0) <= (p.minStockAlert || 0);

      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm ||
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [products, typeFilter, searchTerm]);

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    if (modalMode === 'add') {
      const newProduct: ProductService = {
        id: `prod-${Date.now()}`,
        ...formData,
      };
      onAddProduct(newProduct);
      addAuditLog({
        userName: 'สมชาย จัดหา',
        userRole: 'PURCHASING',
        action: 'CREATE_DOC',
        targetDocNo: newProduct.code,
        details: `เพิ่มสินค้าใหม่ในคลัง: ${newProduct.name} (${newProduct.code})`
      });
    } else if (modalMode === 'edit' && editingItem) {
      const updated: ProductService = {
        ...editingItem,
        ...formData,
      };
      onUpdateProduct(updated);
      addAuditLog({
        userName: 'สมชาย จัดหา',
        userRole: 'PURCHASING',
        action: 'UPDATE_DOC',
        targetDocNo: updated.code,
        details: `แก้ไขข้อมูลสินค้า: ${updated.name} (${updated.code})`
      });
    }
    closeModal();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteProduct(deleteTarget.id);
    addAuditLog({
      userName: 'สมชาย จัดหา',
      userRole: 'PURCHASING',
      action: 'DELETE_DOC',
      targetDocNo: deleteTarget.code,
      details: `ลบสินค้าออกจากคลัง: ${deleteTarget.name} (${deleteTarget.code})`
    });
    setDeleteTarget(null);
  };

  // Handle Save Stock Movement
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find(p => p.id === movementForm.productId);
    if (!targetProduct) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newMovement: StockMovement = {
      id: `sm-${Date.now()}`,
      date: dateStr,
      productId: targetProduct.id,
      productCode: targetProduct.code,
      productName: targetProduct.name,
      type: movementForm.type,
      quantity: Number(movementForm.quantity),
      locationFrom: movementForm.type === 'IN' ? undefined : movementForm.locationFrom,
      locationTo: movementForm.type === 'OUT' ? undefined : movementForm.locationTo,
      referenceDocNo: movementForm.referenceDocNo || undefined,
      referenceProject: movementForm.referenceProject || undefined,
      performedBy: movementForm.performedBy,
      notes: movementForm.notes || undefined
    };

    // Calculate stock update
    let newQty = targetProduct.stockQty;
    if (movementForm.type === 'IN') {
      newQty += Number(movementForm.quantity);
    } else if (movementForm.type === 'OUT') {
      newQty = Math.max(0, newQty - Number(movementForm.quantity));
    } else if (movementForm.type === 'ADJUST') {
      newQty = Number(movementForm.quantity);
    }

    onUpdateProduct({
      ...targetProduct,
      stockQty: newQty
    });

    saveMovements([newMovement, ...movements]);

    addAuditLog({
      userName: movementForm.performedBy,
      userRole: 'PURCHASING',
      action: 'STOCK_MOVEMENT',
      targetDocNo: targetProduct.code,
      details: `บันทึกความเคลื่อนไหวสต็อก [${newMovement.type}] สินค้า ${targetProduct.name} จำนวน ${movementForm.quantity} ${targetProduct.unit} (ยอดคงเหลือใหม่: ${newQty})`
    });

    setShowMovementModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-900/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                ระบบจัดการคลังสินค้า & บันทึกการเคลื่อนไหวสต็อก
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold uppercase tracking-wider">
                Multi-Site Ledger
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              ติดตามสต็อกอะไหล่เครื่องจักร, บันทึกการเบิกใช้ลงโครงการ, โอนย้ายข้ามไซต์งาน (PNP, TSF, Kuroda) และคำนวณมูลค่าสินค้าคงเหลือ
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'CATALOG'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>รายการสินค้า ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'LEDGER'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>บันทึกความเคลื่อนไหว</span>
          </button>

          <button
            onClick={() => setActiveTab('LOCATIONS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'LOCATIONS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>แยกตามไซต์งาน ({STOCK_LOCATIONS.length})</span>
          </button>
        </div>
      </div>

      {/* ── KPI Valuation Summary Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cost Value */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">มูลค่าต้นทุนสต็อกรวม</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono">
              ฿{formatMoney(analytics.totalCostValue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              จากฮาร์ดแวร์ {analytics.totalUnits} ชิ้น ({analytics.hardwareCount} รายการ)
            </div>
          </div>
        </div>

        {/* Total Retail Value */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">มูลค่าราคาขายตลาด</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700 font-mono">
              ฿{formatMoney(analytics.totalRetailValue)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
              กำไรส่วนต่างคาดการณ์ +฿{formatMoney(analytics.profitPotential)}
            </div>
          </div>
        </div>

        {/* Low Stock Items Alert */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">สต็อกใกล้หมดเตือนสั่งซื้อ</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-amber-700">
              {analytics.lowStockCount} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
            <div className="text-[11px] text-amber-600 mt-1 font-medium">
              ต่ำกว่าจุดสั่งซื้อ Min Stock Alert
            </div>
          </div>
        </div>

        {/* Multi-Location Sites */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">คลัง & ไซต์งานโครงการ</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-indigo-700">
              {STOCK_LOCATIONS.length} <span className="text-xs font-normal text-slate-400">สถานที่</span>
            </div>
            <div className="text-[11px] text-indigo-600 mt-1 font-medium">
              คลังคลองหลวง, ไซต์ PNP, TSF, Kuroda
            </div>
          </div>
        </div>

      </div>

      {/* ── TAB 1: Product Catalog View ────────────────────────────────────── */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารหัสสินค้า, ชื่ออุปกรณ์, คำอธิบาย..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === 'ALL' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({products.length})
              </button>
              <button
                onClick={() => setTypeFilter('PRODUCT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === 'PRODUCT' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ฮาร์ดแวร์ / สินค้า
              </button>
              <button
                onClick={() => setTypeFilter('SERVICE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === 'SERVICE' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                บริการ / ค่าแรง
              </button>
              <button
                onClick={() => setTypeFilter('LOW_STOCK')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  typeFilter === 'LOW_STOCK' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>สต็อกใกล้หมด ({analytics.lowStockCount})</span>
              </button>

              <button
                onClick={openAdd}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 whitespace-nowrap ml-auto"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            </div>
          </div>

          {/* Product Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-32">รหัสสินค้า</th>
                    <th className="py-3 px-4">ชื่อสินค้า / บริการ</th>
                    <th className="py-3 px-3 w-40">หมวดหมู่</th>
                    <th className="py-3 px-3 w-28 text-right">ราคาขาย (บาท)</th>
                    <th className="py-3 px-3 w-28 text-right">ต้นทุน (บาท)</th>
                    <th className="py-3 px-3 w-32 text-center">คงเหลือ / จุดเตือน</th>
                    <th className="py-3 px-4 w-32 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(p => {
                    const isProduct = p.type === 'PRODUCT';
                    const isLowStock = isProduct && (p.stockQty || 0) <= (p.minStockAlert || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {p.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block ${CATEGORY_COLORS[p.category] || 'bg-slate-100 text-slate-700'}`}>
                            {CATEGORY_LABELS[p.category] || p.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ฿{formatMoney(p.unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          ฿{formatMoney(p.costPrice)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isProduct ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border ${
                                isLowStock
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}>
                                {p.stockQty} {p.unit}
                              </span>
                              {isLowStock && (
                                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold" title={`ต่ำกว่าเกณฑ์เตือน ${p.minStockAlert}`}>
                                  ต่ำ
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">บริการ (N/A)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                              title="แก้ไขสินค้า"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="ลบสินค้า"
                            >
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
          </div>

        </div>
      )}

      {/* ── TAB 2: Stock Movement Ledger View ───────────────────────────────── */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          
          {/* Ledger Actions Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  สมุดบันทึกความเคลื่อนไหวสต็อก (Stock Movement Ledger)
                </h3>
                <p className="text-[11px] text-slate-400">
                  บันทึกประวัติการรับเข้า เบิกจ่าย และโอนย้ายพาร์ทลงเครื่องจักรรายโครงการ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const csv = "data:text/csv;charset=utf-8," +
                    ["Date,ProductCode,ProductName,Type,Quantity,LocationFrom,LocationTo,RefDoc,Project,PerformedBy,Notes"]
                    .concat(movements.map(m => `"${m.date}","${m.productCode}","${m.productName}","${m.type}","${m.quantity}","${m.locationFrom || ''}","${m.locationTo || ''}","${m.referenceDocNo || ''}","${m.referenceProject || ''}","${m.performedBy}","${m.notes || ''}"`))
                    .join("\n");
                  const link = document.createElement("a");
                  link.href = encodeURI(csv);
                  link.download = `stock_movement_ledger_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowMovementModal(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-200 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกความเคลื่อนไหวใหม่</span>
              </button>
            </div>
          </div>

          {/* Movement Ledger Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-36">วัน-เวลา</th>
                    <th className="py-3 px-3 w-32">ประเภทรายการ</th>
                    <th className="py-3 px-3 w-32">รหัสสินค้า</th>
                    <th className="py-3 px-4">ชื่อสินค้า / อุปกรณ์</th>
                    <th className="py-3 px-3 w-24 text-center">จำนวน</th>
                    <th className="py-3 px-3 w-48">ต้นทาง ➔ ปลายทาง</th>
                    <th className="py-3 px-3 w-32">เอกสาร / โครงการ</th>
                    <th className="py-3 px-3 w-28">ผู้ทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map(m => {
                    const meta = MOVEMENT_LABELS[m.type] || MOVEMENT_LABELS.IN;
                    const Icon = meta.icon;

                    const locFrom = STOCK_LOCATIONS.find(l => l.id === m.locationFrom)?.name || m.locationFrom || '-';
                    const locTo = STOCK_LOCATIONS.find(l => l.id === m.locationTo)?.name || m.locationTo || '-';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {m.date}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.color}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {m.productCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{m.productName}</div>
                          {m.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{m.notes}</div>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {m.type === 'OUT' ? `-${m.quantity}` : `+${m.quantity}`}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1 truncate max-w-[200px]" title={`${locFrom} ➔ ${locTo}`}>
                            <span className="truncate">{locFrom.split('(')[0]}</span>
                            <span>➔</span>
                            <span className="truncate font-semibold text-slate-800">{locTo.split('(')[0]}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {m.referenceDocNo && (
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 block truncate">
                              {m.referenceDocNo}
                            </span>
                          )}
                          {m.referenceProject && (
                            <span className="text-[10px] text-purple-600 font-semibold block truncate">
                              {m.referenceProject}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {m.performedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: Multi-Location Sites Matrix ──────────────────────────────── */}
      {activeTab === 'LOCATIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STOCK_LOCATIONS.map(loc => {
              // Calculate items present at this location from movements
              const locMovements = movements.filter(m => m.locationTo === loc.id || m.locationFrom === loc.id);
              
              return (
                <div key={loc.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${loc.badgeColor}`}>
                        ACTIVE SITE
                      </span>
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">
                      {loc.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ประวัติการเคลื่อนไหวสต็อกล่าสุด: {locMovements.length} รายการ
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">สถานะคลัง:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> เชื่อมโยงพร้อมเบิกจ่าย
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add / Edit Product Modal ───────────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                {modalMode === 'add' ? 'เพิ่มสินค้า / รายการบริการใหม่' : 'แก้ไขข้อมูลสินค้า'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสสินค้า *</label>
                  <input
                    type="text" required value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="เช่น PLC-S7-1200"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ประเภท</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="PRODUCT">สินค้า / ฮาร์ดแวร์</option>
                    <option value="SERVICE">บริการ / งานวิศวกรรม</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อสินค้า / บริการ *</label>
                <input
                  type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น Siemens PLC SIMATIC S7-1200"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="AUTOMATION_HARDWARE">ฮาร์ดแวร์ / อุปกรณ์อัตโนมัติ</option>
                    <option value="SOFTWARE">ซอฟต์แวร์ / ระบบโปรแกรม</option>
                    <option value="ENGINEERING_SERVICE">บริการวิศวกรรม / ติดตั้ง</option>
                    <option value="MAINTENANCE">บำรุงรักษา / PM</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text" value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="ชุด, เครื่อง, pcs, วัน"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ราคาขาย (บาท)</label>
                  <input
                    type="number" min="0" step="0.01" value={formData.unitPrice}
                    onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ราคาต้นทุน (บาท)</label>
                  <input
                    type="number" min="0" step="0.01" value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              {formData.type === 'PRODUCT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">จำนวนในสต็อก</label>
                    <input
                      type="number" min="0" value={formData.stockQty}
                      onChange={e => setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-purple-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">แจ้งเตือนขั้นต่ำ</label>
                    <input
                      type="number" min="0" value={formData.minStockAlert}
                      onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea
                  rows={2} value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดสเปกอุปกรณ์..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-200">
                  {modalMode === 'add' ? 'เพิ่มสินค้า' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Movement Modal ─────────────────────────────────────────────── */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                บันทึกความเคลื่อนไหวสต็อก (Stock Movement)
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">เลือกสินค้า / อุปกรณ์ *</label>
                <select
                  value={movementForm.productId}
                  onChange={e => setMovementForm({ ...movementForm, productId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  {products.filter(p => p.type === 'PRODUCT').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} (คงเหลือ: {p.stockQty} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ประเภทการทำรายการ</label>
                  <select
                    value={movementForm.type}
                    onChange={e => setMovementForm({ ...movementForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="IN">รับเข้าสต็อก (Stock In)</option>
                    <option value="OUT">เบิกใช้ลงโครงการ (Stock Out)</option>
                    <option value="TRANSFER">โอนย้ายข้ามไซต์งาน (Transfer)</option>
                    <option value="ADJUST">ปรับปรุงยอดนับจริง (Adjust)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จำนวน *</label>
                  <input
                    type="number" min="1" required value={movementForm.quantity}
                    onChange={e => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานที่ต้นทาง</label>
                  <select
                    value={movementForm.locationFrom}
                    onChange={e => setMovementForm({ ...movementForm, locationFrom: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {STOCK_LOCATIONS.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานที่ปลายทาง</label>
                  <select
                    value={movementForm.locationTo}
                    onChange={e => setMovementForm({ ...movementForm, locationTo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {STOCK_LOCATIONS.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เลขที่เอกสารอ้างอิง (PO / DO)</label>
                  <input
                    type="text" value={movementForm.referenceDocNo}
                    onChange={e => setMovementForm({ ...movementForm, referenceDocNo: e.target.value })}
                    placeholder="เช่น PO-2609-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัส/ชื่อโครงการ</label>
                  <input
                    type="text" value={movementForm.referenceProject}
                    onChange={e => setMovementForm({ ...movementForm, referenceProject: e.target.value })}
                    placeholder="เช่น PRJ-PNP-SOL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุ</label>
                <textarea
                  rows={2} value={movementForm.notes}
                  onChange={e => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="ระบุวัตถุประสงค์หรือรายละเอียดเพิ่มเติม..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowMovementModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-200">
                  ยืนยันบันทึกสต็อก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">ยืนยันการลบสินค้า?</h3>
                <p className="text-xs text-slate-500">{deleteTarget.name} ({deleteTarget.code})</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              การลบรายการนี้จะไม่สามารถกู้คืนได้ และจะถูกบันทึกลงใน Audit Trail Log
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                ยกเลิก
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200">
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
