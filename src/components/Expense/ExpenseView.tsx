import React, { useState } from 'react';
import { TrendingDown, Plus, Search, Printer } from 'lucide-react';
import { AccountingDocument, DocumentType } from '../../types';
import { formatMoney, getStatusBadge, formatThaiDate } from '../../utils/formatters';

interface ExpenseViewProps {
  documents: AccountingDocument[];
  openCreateModal: (type: DocumentType) => void;
  openViewDocument: (doc: AccountingDocument) => void;
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({ documents, openCreateModal, openViewDocument }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const poDocs = documents.filter(d => d.type === 'PURCHASE_ORDER');
  const filtered = poDocs.filter(d =>
    d.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contact.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-500" />
            <span>ระบบจัดการรายจ่าย & การซื้อ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">บันทึกใบสั่งซื้อ (PO), ค่าใช้จ่ายโครงการ, และการจัดการภาษีหัก ณ ที่จ่าย (50 ทวิ)</p>
        </div>
        <button onClick={() => openCreateModal('PURCHASE_ORDER')}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-100 transition active:scale-95">
          <Plus className="w-4 h-4" />
          <span>+ สร้างใบสั่งซื้อ (PO)</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'ยอดสั่งซื้อคงค้าง (Open PO Total)', value: '฿141,240.00', sub: 'รอการจัดส่งสินค้าจาก Siemens', subColor: 'text-sky-600', borderColor: 'border-l-4 border-l-sky-400' },
          { label: 'ภาษีหัก ณ ที่จ่ายรอนำส่ง (WHT)', value: '฿5,250.00', sub: 'ภ.ง.ด. 53 ประจำเดือน ก.ค. 2026', subColor: 'text-amber-600', borderColor: 'border-l-4 border-l-amber-400' },
          { label: 'ภาษีซื้อรอเรียกคืน (Input VAT)', value: '฿9,240.00', sub: 'สามารถนำไปหักลบภาษีขายได้', subColor: 'text-emerald-600', borderColor: 'border-l-4 border-l-emerald-400' },
        ].map((card, i) => (
          <div key={i} className={`glass-card p-5 rounded-2xl ${card.borderColor}`}>
            <span className="text-xs text-slate-500 font-medium">{card.label}</span>
            <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1">{card.value}</h3>
            <span className={`text-[11px] block mt-1 font-medium ${card.subColor}`}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* PO Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800">รายการใบสั่งซื้อ (Purchase Orders)</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา PO หรือ ชื่อซัพพลายเออร์..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-rose-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">เลขที่ PO</th>
                <th className="py-3 px-4">ซัพพลายเออร์ / ผู้จำหน่าย</th>
                <th className="py-3 px-4">วันที่สั่งซื้อ</th>
                <th className="py-3 px-4">กำหนดส่งมอบ</th>
                <th className="py-3 px-4">ยอดสั่งซื้อรวม (VAT 7%)</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">พิมพ์ PO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(doc => {
                const badge = getStatusBadge(doc.status);
                return (
                  <tr key={doc.id} className="hover:bg-rose-50/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{doc.contact.companyName}</div>
                      <span className="text-[10px] text-slate-400">Tax ID: {doc.contact.taxId}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatThaiDate(doc.issueDate)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatThaiDate(doc.dueDate)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{formatMoney(doc.grandTotal)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => openViewDocument(doc)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
