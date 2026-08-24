import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Eye, Printer, Pencil, Trash2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { AccountingDocument, DocumentType, DocumentStatus } from '../../types';
import { formatMoney, getStatusBadge, formatThaiDate } from '../../utils/formatters';

interface SalesViewProps {
  documents: AccountingDocument[];
  openCreateModal: (type: DocumentType) => void;
  openEditDocument: (doc: AccountingDocument) => void;
  openViewDocument: (doc: AccountingDocument) => void;
  onIssueReceipt?: (doc: AccountingDocument) => void;
  onUpdateStatus: (docId: string, status: DocumentStatus) => void;
  onDeleteDocument: (docId: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  documents,
  openCreateModal,
  openEditDocument,
  openViewDocument,
  onIssueReceipt,
  onUpdateStatus,
  onDeleteDocument
}) => {
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<AccountingDocument | null>(null);

  const salesDocs = documents.filter(d => ['QUOTATION', 'INVOICE', 'TAX_INVOICE', 'RECEIPT'].includes(d.type));

  const filteredDocs = salesDocs.filter(doc => {
    if (activeTypeFilter === 'QUOTATION' && doc.type !== 'QUOTATION') return false;
    if (activeTypeFilter === 'INVOICE' && doc.type !== 'INVOICE') return false;
    if (activeTypeFilter === 'TAX_INVOICE' && doc.type !== 'TAX_INVOICE') return false;
    if (activeTypeFilter === 'RECEIPT' && doc.type !== 'RECEIPT') return false;
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        doc.documentNo.toLowerCase().includes(q) ||
        (doc.contact?.companyName || '').toLowerCase().includes(q) ||
        (doc.contact?.taxId || '').includes(q) ||
        (doc.contact?.name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalFilteredAmount = filteredDocs.reduce((sum, d) => sum + (d.netPayment || d.grandTotal), 0);

  const subTabs = [
    { id: 'ALL', label: 'เอกสารทั้งหมด', count: salesDocs.length },
    { id: 'QUOTATION', label: 'ใบเสนอราคา (QT)', count: salesDocs.filter(d => d.type === 'QUOTATION').length },
    { id: 'INVOICE', label: 'ใบแจ้งหนี้ (INV)', count: salesDocs.filter(d => d.type === 'INVOICE').length },
    { id: 'TAX_INVOICE', label: 'ใบกำกับภาษี (TAX)', count: salesDocs.filter(d => d.type === 'TAX_INVOICE').length },
    { id: 'RECEIPT', label: 'ใบเสร็จรับเงิน (REC)', count: salesDocs.filter(d => d.type === 'RECEIPT').length },
  ];

  const hasActiveFilters = activeTypeFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setActiveTypeFilter('ALL');
    setStatusFilter('ALL');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-500" />
            <span>ระบบรายรับ & การขาย (Sales & Income)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            สร้าง ออกเอกสาร แก้ไข ลบ และติดตามสถานะ ใบเสนอราคา (QT), ใบแจ้งหนี้ (INV), ใบกำกับภาษี (TAX), ใบเสร็จรับเงิน (REC)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openCreateModal('QUOTATION')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-200 text-emerald-700 text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ ใบเสนอราคา</span>
          </button>
          <button
            onClick={() => openCreateModal('INVOICE')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 hover:border-sky-200 text-sky-700 text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>+ ใบแจ้งหนี้ / กำกับภาษี</span>
          </button>
          <button
            onClick={() => openCreateModal('RECEIPT')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ใบเสร็จรับเงิน</span>
          </button>
        </div>
      </div>

      {/* ── Sub-Tab Filter Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTypeFilter(tab.id)}
            className={`p-3.5 rounded-2xl border text-left transition ${
              activeTypeFilter === tab.id
                ? 'bg-rose-50 border-rose-300 shadow-sm ring-1 ring-rose-200'
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <span
              className={`text-[11px] uppercase tracking-wider font-bold block ${
                activeTypeFilter === tab.id ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </span>
            <span className="text-xl font-bold text-slate-800 block mt-1 font-mono">{tab.count} รายการ</span>
          </button>
        ))}
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, Tax ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          
          {/* Document Type Dropdown Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={activeTypeFilter}
              onChange={(e) => setActiveTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-rose-400"
            >
              <option value="ALL">📁 ประเภทเอกสารทั้งหมด</option>
              <option value="QUOTATION">📄 ใบเสนอราคา (QT)</option>
              <option value="INVOICE">🧾 ใบแจ้งหนี้ (INV)</option>
              <option value="TAX_INVOICE">🏛️ ใบกำกับภาษี (TAX)</option>
              <option value="RECEIPT">💰 ใบเสร็จรับเงิน (REC)</option>
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-rose-400"
          >
            <option value="ALL">🏷️ สถานะทั้งหมด</option>
            <option value="PENDING">⏳ รอดำเนินการ / รอชำระ</option>
            <option value="APPROVED">✓ อนุมัติแล้ว</option>
            <option value="PAID">✓ ชำระเงินแล้ว</option>
            <option value="OVERDUE">⚠️ เกินกำหนด</option>
            <option value="CANCELLED">✕ ยกเลิก</option>
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 transition"
              title="ล้างตัวกรองทั้งหมด"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}

          {/* Filtered Total Amount Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-700 font-semibold">ยอดรวม: </span>
            <span className="font-bold text-emerald-800 font-mono">฿{formatMoney(totalFilteredAmount)}</span>
          </div>
        </div>
      </div>

      {/* ── Documents Table ─────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">เลขที่เอกสาร</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">ลูกค้า / บริษัทคู่ค้า</th>
                <th className="py-3 px-4">วันที่ออก / ครบกำหนด</th>
                <th className="py-3 px-4 text-right">มูลค่ารวม (VAT 7%)</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">ไม่พบรายการเอกสารตามประเภทหรือสถานะที่เลือก</p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 hover:bg-rose-100 transition"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const badge = getStatusBadge(doc.status);
                  return (
                    <tr key={doc.id} className="hover:bg-rose-50/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {doc.documentNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                            doc.type === 'QUOTATION'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : doc.type === 'INVOICE'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : doc.type === 'TAX_INVOICE'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {doc.type === 'QUOTATION'
                            ? 'ใบเสนอราคา'
                            : doc.type === 'INVOICE'
                            ? 'ใบแจ้งหนี้'
                            : doc.type === 'TAX_INVOICE'
                            ? 'ใบกำกับภาษี'
                            : 'ใบเสร็จรับเงิน'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {doc.contact?.companyName || '-'}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {doc.contact?.name || ''} {doc.contact?.phone ? `(${doc.contact.phone})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{formatThaiDate(doc.issueDate)}</div>
                        <span className="text-[10px] text-slate-400">ครบกำหนด: {formatThaiDate(doc.dueDate)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        <div>{formatMoney(doc.grandTotal)}</div>
                        {doc.withholdingTaxTotal > 0 && (
                          <span className="text-[10px] text-rose-500 block font-normal">
                            หัก ณ ที่จ่าย: -{formatMoney(doc.withholdingTaxTotal)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {onIssueReceipt && (doc.type === 'INVOICE' || doc.type === 'TAX_INVOICE') && (
                            <button
                              onClick={() => onIssueReceipt(doc)}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold transition flex items-center gap-1 whitespace-nowrap shadow-sm"
                              title="ออกใบเสร็จรับเงินจากใบแจ้งหนี้นี้"
                            >
                              <FileText className="w-3 h-3 text-amber-600" />
                              <span>ออกใบเสร็จ</span>
                            </button>
                          )}
                          {doc.status === 'PENDING' && (
                            <button
                              onClick={() => onUpdateStatus(doc.id, 'PAID')}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition whitespace-nowrap"
                              title="เปลี่ยนเป็นชำระแล้ว"
                            >
                              ✓ ชำระแล้ว
                            </button>
                          )}
                          <button
                            onClick={() => openViewDocument(doc)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 transition shadow-sm"
                            title="ดูตัวอย่าง / พิมพ์เอกสาร"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditDocument(doc)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 text-slate-500 transition shadow-sm"
                            title="แก้ไขเอกสาร"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 transition shadow-sm"
                            title="ลบเอกสาร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบเอกสาร</h3>
                <p className="text-xs text-rose-600 font-medium mt-0.5">
                  ระบบจะลบข้อมูลออกจากฐานข้อมูลอย่างถาวร (ไม่สามารถย้อนกลับได้)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ประเภทเอกสาร:</span>
                <span className="font-bold text-slate-800">
                  {deleteTarget.type === 'QUOTATION'
                    ? 'ใบเสนอราคา (Quotation)'
                    : deleteTarget.type === 'INVOICE'
                    ? 'ใบแจ้งหนี้ (Invoice)'
                    : deleteTarget.type === 'TAX_INVOICE'
                    ? 'ใบกำกับภาษี (Tax Invoice)'
                    : 'ใบเสร็จรับเงิน (Receipt)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">เลขที่เอกสาร:</span>
                <span className="font-mono font-bold text-rose-700">{deleteTarget.documentNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ลูกค้า / คู่ค้า:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {deleteTarget.contact?.companyName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">วันที่ออกเอกสาร:</span>
                <span className="text-slate-700">{formatThaiDate(deleteTarget.issueDate)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-rose-200 pt-2 font-bold text-sm">
                <span className="text-rose-800">มูลค่ารวมทั้งสิ้น:</span>
                <span className="font-mono text-rose-700">{formatMoney(deleteTarget.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDocument(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบออกจากฐานข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
