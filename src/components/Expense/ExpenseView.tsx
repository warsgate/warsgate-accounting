import React, { useState } from 'react';
import { TrendingDown, Plus, Search, Filter, Printer, Pencil, Trash2, AlertTriangle, FileText, CheckCircle2, RotateCcw, Calendar } from 'lucide-react';
import { AccountingDocument, DocumentType, DocumentStatus } from '../../types';
import { formatMoney, getStatusBadge, formatThaiDate } from '../../utils/formatters';

interface ExpenseViewProps {
  documents: AccountingDocument[];
  openCreateModal: (type: DocumentType) => void;
  openEditDocument: (doc: AccountingDocument) => void;
  openViewDocument: (doc: AccountingDocument) => void;
  onUpdateStatus: (docId: string, status: DocumentStatus) => void;
  onDeleteDocument: (docId: string) => void;
}

const EXPENSE_DOC_TYPES = ['PURCHASE_ORDER', 'PURCHASE_INVOICE', 'PAYMENT_VOUCHER', 'WHT_CERTIFICATE'];

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  documents,
  openCreateModal,
  openEditDocument,
  openViewDocument,
  onUpdateStatus,
  onDeleteDocument
}) => {
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<AccountingDocument | null>(null);

  const expenseDocs = documents.filter(d => EXPENSE_DOC_TYPES.includes(d.type));

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    if (preset === 'THIS_MONTH') {
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'THIS_YEAR') {
      const firstDay = `${year}-01-01`;
      const lastDay = `${year}-12-31`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredDocs = expenseDocs.filter(doc => {
    if (activeTypeFilter !== 'ALL' && doc.type !== activeTypeFilter) return false;
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (startDate && doc.issueDate < startDate) return false;
    if (endDate && doc.issueDate > endDate) return false;
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

  // Calculate live KPI metrics
  const totalExpenseAmount = filteredDocs.reduce((sum, d) => sum + d.grandTotal, 0);
  const totalInputVat = filteredDocs.reduce((sum, d) => sum + d.vatAmount, 0);
  const totalWht = filteredDocs.reduce((sum, d) => sum + (d.withholdingTaxTotal || 0), 0);

  const subTabs = [
    { id: 'ALL', label: 'เอกสารรายจ่ายทั้งหมด', count: expenseDocs.length },
    { id: 'PURCHASE_ORDER', label: 'ใบสั่งซื้อ (PO)', count: expenseDocs.filter(d => d.type === 'PURCHASE_ORDER').length },
    { id: 'PURCHASE_INVOICE', label: 'ใบแจ้งหนี้ซื้อ (PINV)', count: expenseDocs.filter(d => d.type === 'PURCHASE_INVOICE').length },
    { id: 'PAYMENT_VOUCHER', label: 'ใบสำคัญจ่าย (PV)', count: expenseDocs.filter(d => d.type === 'PAYMENT_VOUCHER').length },
    { id: 'WHT_CERTIFICATE', label: 'หัก ณ ที่จ่าย (50 ทวิ)', count: expenseDocs.filter(d => d.type === 'WHT_CERTIFICATE').length },
  ];

  const hasActiveFilters = 
    activeTypeFilter !== 'ALL' || 
    statusFilter !== 'ALL' || 
    datePreset !== 'ALL' || 
    startDate !== '' || 
    endDate !== '' || 
    searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setActiveTypeFilter('ALL');
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-500" />
            <span>ระบบจัดการรายจ่าย & การซื้อ (Expense & Purchasing)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            สร้าง ออกเอกสาร แก้ไข ลบ ใบสั่งซื้อ (PO), ค่าใช้จ่ายโครงการ, ใบสำคัญจ่าย (PV), และหนังสือรับรอง 50 ทวิ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openCreateModal('PURCHASE_ORDER')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ใบสั่งซื้อ (PO)</span>
          </button>
          <button
            onClick={() => openCreateModal('PURCHASE_INVOICE')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>+ ใบแจ้งหนี้ซื้อ</span>
          </button>
          <button
            onClick={() => openCreateModal('PAYMENT_VOUCHER')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ ใบสำคัญจ่าย</span>
          </button>
          <button
            onClick={() => openCreateModal('WHT_CERTIFICATE')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>+ 50 ทวิ</span>
          </button>
        </div>
      </div>

      {/* ── Summary KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'ยอดสั่งซื้อ / ค่าใช้จ่ายรวม',
            value: formatMoney(totalExpenseAmount),
            sub: `${filteredDocs.length} รายการที่กำลังแสดง`,
            subColor: 'text-sky-600',
            borderColor: 'border-l-4 border-l-sky-400',
          },
          {
            label: 'ภาษีหัก ณ ที่จ่ายรวม (WHT)',
            value: formatMoney(totalWht),
            sub: 'ภ.ง.ด. 3/53 รอนำส่งกรมสรรพากร',
            subColor: 'text-amber-600',
            borderColor: 'border-l-4 border-l-amber-400',
          },
          {
            label: 'ภาษีซื้อรวม (Input VAT 7%)',
            value: formatMoney(totalInputVat),
            sub: 'สามารถนำไปหักภาษีขาย (ภ.พ.30)',
            subColor: 'text-emerald-600',
            borderColor: 'border-l-4 border-l-emerald-400',
          },
        ].map((card, i) => (
          <div key={i} className={`glass-card p-5 rounded-2xl ${card.borderColor}`}>
            <span className="text-xs text-slate-500 font-medium">{card.label}</span>
            <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1">{card.value}</h3>
            <span className={`text-[11px] block mt-1 font-medium ${card.subColor}`}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Sub-Tab Filter Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
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
              className={`text-[10px] uppercase tracking-wider font-bold block ${
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
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        
        {/* Row 1: Search & Type & Status */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาเลขที่ PO, ชื่อซัพพลายเออร์, Tax ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            
            {/* Document Type Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={activeTypeFilter}
                onChange={(e) => setActiveTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-rose-400"
              >
                <option value="ALL">📁 ประเภทเอกสารรายจ่ายทั้งหมด</option>
                <option value="PURCHASE_ORDER">📦 ใบสั่งซื้อ (PO)</option>
                <option value="PURCHASE_INVOICE">📥 ใบแจ้งหนี้ซื้อ (PINV)</option>
                <option value="PAYMENT_VOUCHER">💸 ใบสำคัญจ่าย (PV)</option>
                <option value="WHT_CERTIFICATE">📜 หัก ณ ที่จ่าย (50 ทวิ)</option>
              </select>
            </div>

            {/* Status Dropdown Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-rose-400"
            >
              <option value="ALL">🏷️ สถานะทั้งหมด</option>
              <option value="PENDING">⏳ รอดำเนินการ / รอส่งมอบ</option>
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
              <span className="font-bold text-emerald-800 font-mono">฿{formatMoney(totalExpenseAmount)}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Date Range Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>ช่วงวันที่ออกเอกสาร:</span>
            </span>

            {/* Preset selector */}
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-rose-400"
            >
              <option value="ALL">📅 ทุกช่วงเวลา (ทั้งหมด)</option>
              <option value="THIS_MONTH">เดือนนี้</option>
              <option value="LAST_MONTH">เดือนที่แล้ว</option>
              <option value="THIS_YEAR">ปีนี้ (2026 / 2569)</option>
              <option value="CUSTOM">กำหนดช่วงวันที่เอง</option>
            </select>

            {/* Start Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">ตั้งแต่:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 text-xs focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">ถึง:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 text-xs focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <div className="text-[11px] text-rose-600 font-medium bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              กรองช่วงวันที่: {startDate ? formatThaiDate(startDate) : 'เริ่มต้น'} — {endDate ? formatThaiDate(endDate) : 'ปัจจุบัน'} ({filteredDocs.length} รายการ)
            </div>
          )}
        </div>

      </div>

      {/* ── Expense Table ───────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">เลขที่เอกสาร</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">ซัพพลายเออร์ / ผู้จำหน่าย</th>
                <th className="py-3 px-4">วันที่สั่ง / กำหนดส่งมอบ</th>
                <th className="py-3 px-4 text-right">ยอดรวม (VAT 7%)</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">ไม่พบรายการเอกสารรายจ่ายตามประเภท สถานะ หรือช่วงวันที่ที่เลือก</p>
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
                            doc.type === 'PURCHASE_ORDER'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : doc.type === 'PURCHASE_INVOICE'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : doc.type === 'PAYMENT_VOUCHER'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {doc.type === 'PURCHASE_ORDER'
                            ? 'ใบสั่งซื้อ (PO)'
                            : doc.type === 'PURCHASE_INVOICE'
                            ? 'ใบแจ้งหนี้ซื้อ'
                            : doc.type === 'PAYMENT_VOUCHER'
                            ? 'ใบสำคัญจ่าย'
                            : '50 ทวิ'}
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
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบเอกสารรายจ่าย</h3>
                <p className="text-xs text-rose-600 font-medium mt-0.5">
                  ระบบจะลบข้อมูลออกจากฐานข้อมูลอย่างถาวร (ไม่สามารถย้อนกลับได้)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ประเภทเอกสาร:</span>
                <span className="font-bold text-slate-800">
                  {deleteTarget.type === 'PURCHASE_ORDER'
                    ? 'ใบสั่งซื้อ (PO)'
                    : deleteTarget.type === 'PURCHASE_INVOICE'
                    ? 'ใบแจ้งหนี้ซื้อ (PINV)'
                    : deleteTarget.type === 'PAYMENT_VOUCHER'
                    ? 'ใบสำคัญจ่าย (PV)'
                    : 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">เลขที่เอกสาร:</span>
                <span className="font-mono font-bold text-rose-700">{deleteTarget.documentNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ซัพพลายเออร์:</span>
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
