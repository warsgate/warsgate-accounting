import React, { useState } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { ProductService } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface InventoryViewProps {
  products: ProductService[];
  onAddProduct: (product: ProductService) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ products, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', category: 'AUTOMATION_HARDWARE' as any, type: 'PRODUCT' as 'PRODUCT' | 'SERVICE', unit: 'เครื่อง', unitPrice: 0, costPrice: 0, stockQty: 10, minStockAlert: 3, description: '' });

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({ id: `prod-${Date.now()}`, ...formData });
    setShowAddModal(false);
    setFormData({ code: '', name: '', category: 'AUTOMATION_HARDWARE', type: 'PRODUCT', unit: 'เครื่อง', unitPrice: 0, costPrice: 0, stockQty: 10, minStockAlert: 3, description: '' });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-500" />
            <span>คลังสินค้า & บริการ (Inventory & Services)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">จัดการรหัสสินค้า อุปกรณ์ออโตเมชั่น ค่าบริการวิศวกรรม เช็คสต็อกคงเหลือ</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-100 transition active:scale-95">
          <Plus className="w-4 h-4" />
          <span>+ เพิ่มสินค้า / บริการใหม่</span>
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800">รายการสินค้าและบริการในระบบ</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-rose-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">รหัสสินค้า</th>
                <th className="py-3 px-4">ชื่อสินค้า / บริการ</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ราคาทุน</th>
                <th className="py-3 px-4">ราคาขาย</th>
                <th className="py-3 px-4">กำไรขั้นต้น</th>
                <th className="py-3 px-4">คงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const margin = item.unitPrice > 0 ? (((item.unitPrice - item.costPrice) / item.unitPrice) * 100).toFixed(1) : '0';
                const isLowStock = item.type === 'PRODUCT' && item.stockQty <= item.minStockAlert;
                return (
                  <tr key={item.id} className="hover:bg-rose-50/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{item.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <span className="text-[10px] text-slate-400">{item.description}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">{item.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{formatMoney(item.costPrice)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{formatMoney(item.unitPrice)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600">+{margin}%</td>
                    <td className="py-3.5 px-4 font-mono">
                      {item.type === 'SERVICE' ? (
                        <span className="text-slate-400 text-[11px]">บริการ</span>
                      ) : (
                        <span className={`font-bold text-sm ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                          {item.stockQty} {item.unit}
                          {isLowStock && <span className="ml-1 text-[9px] text-rose-500 font-bold">⚠ ต่ำ</span>}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-500" />
              <span>เพิ่มสินค้า / รายการบริการใหม่</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">รหัสสินค้า (SKU) *</label>
                  <input required type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ประเภท</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:border-rose-400">
                    <option value="PRODUCT">สินค้า (มีสต็อก)</option>
                    <option value="SERVICE">ค่าบริการ (Man-Day)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">ชื่อสินค้า / บริการ *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-rose-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ราคาทุน</label>
                  <input type="number" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ราคาขาย</label>
                  <input required type="number" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-rose-400" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs">ยกเลิก</button>
                <button type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm">บันทึกสินค้า</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
