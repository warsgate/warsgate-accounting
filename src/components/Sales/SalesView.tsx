import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Eye, Printer } from 'lucide-react';
import { AccountingDocument, DocumentType, DocumentStatus } from '../../types';
import { formatMoney, getStatusBadge, formatThaiDate } from '../../utils/formatters';

interface SalesViewProps {
  documents: AccountingDocument[];
  openCreateModal: (type: DocumentType) => void;
  openViewDocument: (doc: AccountingDocument) => void;
  onUpdateStatus: (docId: string, status: DocumentStatus) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ documents, openCreateModal, openViewDocument, onUpdateStatus }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'QUOTATION' | 'INVOICE' | 'RECEIPT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const salesDocs = documents.filter(d => ['QUOTATION', 'INVOICE', 'TAX_INVOICE', 'RECEIPT'].includes(d.type));

  const filteredDocs = salesDocs.filter(doc => {
    if (activeSubTab === 'QUOTATION' && doc.type !== 'QUOTATION') return false;
    if (activeSubTab === 'INVOICE' && !['INVOICE', 'TAX_INVOICE'].includes(doc.type)) return false;
    if (activeSubTab === 'RECEIPT' && doc.type !== 'RECEIPT') return false;
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return doc.documentNo.toLowerCase().includes(q) || doc.contact.companyName.toLowerCase().includes(q) || doc.contact.taxId.includes(q);
    }
    return true;
  });

  const totalFilteredAmount = filteredDocs.reduce((sum, d) => sum + d.grandTotal, 0);

  const subTabs = [
    { id: 'ALL', label: 'เอกสารทั้งหมด', count: salesDocs.length, accent: 'rose' },
    { id: 'QUOTATION', label: 'ใบเสนอราคา (QT)', count: salesDocs.filter(d => d.type === 'QUOTATION').length, accent: 'emerald' },
    { id: 'INVOICE', label: 'ใบแจ้งหนี้ (INV)', count: salesDocs.filter(d => ['INVOICE','TAX_INVOICE'].includes(d.type)).length, accent: 'sky' },
    { id: 'RECEIPT', label: 'ใบเสร็จรับเงิน (REC)', count: salesDocs.filter(d => d.type === 'RECEIPT').length, accent: 'amber' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-500" />
            <span>ระบบรายรับ & การขาย (Sales & Income)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">สร้าง ออกเอกสาร และติดตามสถานะ ใบเสนอราคา (QT), ใบแจ้งหนี้ (INV), ใบเสร็จรับเงิน (REC)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openCreateModal('QUOTATION')}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm flex items-center gap-1.5 transition">
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>+ ใบเสนอราคา</span>
          </button>
          <button onClick={() => openCreateModal('INVOICE')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95">
            <Plus className="w-4 h-4" />
            <span>+ ใบแจ้งหนี้ / ใบกำกับภาษี</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {subTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)}
            className={`p-4 rounded-2xl border text-left transition ${
              activeSubTab === tab.id
                ? 'bg-rose-50 border-rose-300 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}>
            <span className={`text-[11px] uppercase tracking-wider font-bold block ${activeSubTab === tab.id ? 'text-rose-600' : 'text-slate-400'}`}>{tab.label}</span>
            <span className="text-2xl font-bold text-slate-800 block mt-1">{tab.count} รายการ</span>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่เอกสาร, ชื่อบริษัท, Tax ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400">
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="PENDING">รอดำเนินการ / รอชำระ</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="PAID">ชำระเงินแล้ว</option>
              <option value="OVERDUE">เกินกำหนด</option>
            </select>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">มูลค่ารวม: </span>
            <span className="font-bold text-emerald-600 font-mono">{formatMoney(totalFilteredAmount)}</span>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">เลขที่เอกสาร</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">ลูกค้า / บริษัทคู่ค้า</th>
                <th className="py-3 px-4">วันที่ออก / ครบกำหนด</th>
                <th className="py-3 px-4">มูลค่ารวม (VAT 7%)</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">จัดการ & พิมพ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">ไม่พบรายการเอกสารตามเงื่อนไขที่เลือก</td></tr>
              ) : (
                filteredDocs.map((doc) => {
                  const badge = getStatusBadge(doc.status);
                  return (
                    <tr key={doc.id} className="hover:bg-rose-50/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                          doc.type === 'QUOTATION' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          doc.type === 'INVOICE' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {doc.type === 'QUOTATION' ? 'ใบเสนอราคา' : doc.type === 'INVOICE' ? 'ใบแจ้งหนี้/กำกับภาษี' : 'ใบเสร็จรับเงิน'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{doc.contact.companyName}</div>
                        <span className="text-[10px] text-slate-400">{doc.contact.name} ({doc.contact.phone})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{formatThaiDate(doc.issueDate)}</div>
                        <span className="text-[10px] text-slate-400">ครบกำหนด: {formatThaiDate(doc.dueDate)}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <div>{formatMoney(doc.grandTotal)}</div>
                        {doc.withholdingTaxTotal > 0 && (
                          <span className="text-[10px] text-rose-500 block font-normal">หัก ณ ที่จ่าย: -{formatMoney(doc.withholdingTaxTotal)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.status === 'PENDING' && (
                            <button onClick={() => onUpdateStatus(doc.id, 'PAID')}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition">
                              ชำระแล้ว
                            </button>
                          )}
                          <button onClick={() => openViewDocument(doc)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
