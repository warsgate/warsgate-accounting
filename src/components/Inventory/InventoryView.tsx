import React, { useState } from 'react';
import { Package, Plus, Search, Pencil, Trash2, AlertTriangle, Tag, Wrench, Box, TrendingUp, Zap } from 'lucide-react';
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
  AUTOMATION_HARDWARE: '⚙️ Hardware',
  SOFTWARE: '💾 Software',
  ENGINEERING_SERVICE: '🔧 Engineering',
  MAINTENANCE: '🛠️ Maintenance',
};

const CATEGORY_COLORS: Record<string, string> = {
  AUTOMATION_HARDWARE: 'bg-blue-50 text-blue-700 border-blue-200',
  SOFTWARE: 'bg-purple-50 text-purple-700 border-purple-200',
  ENGINEERING_SERVICE: 'bg-amber-50 text-amber-700 border-amber-200',
  MAINTENANCE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  products, onAddProduct, onUpdateProduct, onDeleteProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ProductService | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  // ── Open Modals ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
    setModalMode('add');
  };

  const openEdit = (p: ProductService) => {
    setFormData({
      code: p.code, name: p.name, category: p.category, type: p.type,
      unit: p.unit, unitPrice: p.unitPrice, costPrice: p.costPrice,
      stockQty: p.stockQty, minStockAlert: p.minStockAlert, description: p.description,
    });
    setEditingProduct(p);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingProduct(null);
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
    // หา SKU ที่มีอยู่แล้วที่ขึ้นต้นด้วย prefix นี้
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'edit' && editingProduct) {
      onUpdateProduct({ ...editingProduct, ...formData });
    } else {
      onAddProduct({ id: `prod-${Date.now()}`, ...formData });
    }
    closeModal();
  };

  const setF = (field: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const margin = (p: ProductService) =>
    p.unitPrice > 0 ? (((p.unitPrice - p.costPrice) / p.unitPrice) * 100).toFixed(1) : '0';

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalProducts = products.filter(p => p.type === 'PRODUCT').length;
  const totalServices = products.filter(p => p.type === 'SERVICE').length;
  const lowStock = products.filter(p => p.type === 'PRODUCT' && p.stockQty <= p.minStockAlert).length;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-500" />
            <span>คลังสินค้า & บริการ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">จัดการรายการสินค้า อุปกรณ์ และค่าบริการวิศวกรรม</p>
        </div>
        <button onClick={openAdd}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-100 transition active:scale-95">
          <Plus className="w-4 h-4" />
          + เพิ่มสินค้า / บริการ
        </button>
      </div>

      {/* ── Summary Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'รายการสินค้า', count: totalProducts, icon: Box, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'รายการบริการ', count: totalServices, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'สต็อกต่ำ ⚠️', count: lowStock, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`p-4 rounded-2xl border ${s.bg} text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-purple-400" />
        </div>
        <div className="flex items-center gap-2">
          {(['ALL', 'PRODUCT', 'SERVICE'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                typeFilter === t ? 'bg-purple-50 border-purple-300 text-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}>
              {t === 'ALL' ? 'ทั้งหมด' : t === 'PRODUCT' ? '📦 สินค้า' : '🔧 บริการ'}
            </button>
          ))}
        </div>
      </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div className="glass-panel p-3 sm:p-5 rounded-2xl">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">ไม่พบรายการ</p>
              <p className="text-xs mt-1">ลองเปลี่ยน filter หรือเพิ่มสินค้าใหม่</p>
            </div>
          ) : (
            <div className="table-scroll max-h-[620px] rounded-2xl border border-slate-200 shadow-inner">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="py-3 px-4">รหัส</th>
                    <th className="py-3 px-4">ชื่อสินค้า / บริการ</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4 text-right">ราคาทุน</th>
                    <th className="py-3 px-4 text-right">ราคาขาย</th>
                    <th className="py-3 px-4 text-right">กำไร %</th>
                    <th className="py-3 px-4 text-center">สต็อก</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(item => {
                  const isLowStock = item.type === 'PRODUCT' && item.stockQty <= item.minStockAlert;
                  return (
                    <tr key={item.id} className="hover:bg-purple-50/20 transition group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 text-[11px]">{item.code}</td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                        {item.description && <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${CATEGORY_COLORS[item.category]}`}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{formatMoney(item.costPrice)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatMoney(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-sky-600">+{margin(item)}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
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
                {modalMode === 'edit' ? `แก้ไข: ${editingProduct?.name}` : 'เพิ่มสินค้า / บริการใหม่'}
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
