import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Filter, Eye, Printer, Pencil, Trash2, AlertTriangle, 
  CheckCircle2, RotateCcw, Calendar, Receipt, ShieldCheck, Clock, Download
} from 'lucide-react';
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
  const [activeTypeTab, setActiveTypeTab] = useState<string>('QUOTATION');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<AccountingDocument | null>(null);

  const salesDocs = documents.filter(d => ['QUOTATION', 'INVOICE', 'TAX_INVOICE', 'RECEIPT'].includes(d.type));

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

  const filteredDocs = salesDocs.filter(doc => {
    if (activeTypeTab === 'QUOTATION' && doc.type !== 'QUOTATION') return false;
    if (activeTypeTab === 'INVOICE' && doc.type !== 'INVOICE') return false;
    if (activeTypeTab === 'TAX_INVOICE' && doc.type !== 'TAX_INVOICE') return false;
    if (activeTypeTab === 'RECEIPT' && doc.type !== 'RECEIPT') return false;
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (startDate && doc.issueDate < startDate) return false;
    if (endDate && doc.issueDate > endDate) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        doc.documentNo.toLowerCase().includes(q) ||
        (doc.contact?.companyName || '').toLowerCase().includes(q) ||
        (doc.contact?.taxId || '').includes(q) ||
        (doc.contact?.name || '').toLowerCase().includes(q) ||
        (doc.notes || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalFilteredGrandTotal = filteredDocs.reduce((sum, d) => sum + d.grandTotal, 0);
  const totalFilteredVat = filteredDocs.reduce((sum, d) => sum + d.vatAmount, 0);
  const totalFilteredNet = filteredDocs.reduce((sum, d) => sum + (d.netPayment || d.grandTotal - (d.withholdingTaxTotal || 0)), 0);

  // Table Tabs Definition (เฉพาะ 4 ประเภทเอกสารชัดเจน ไม่มีแท็บ "ทั้งหมด")
  const tableTabs = [
    { 
      id: 'QUOTATION', 
      label: 'ใบเสนอราคา', 
      sublabel: 'Quotation (QT)',
      icon: FileText, 
      count: salesDocs.filter(d => d.type === 'QUOTATION').length,
      activeColor: 'bg-emerald-600 text-white shadow-emerald-200',
      badgeActive: 'bg-white text-emerald-700'
    },
    { 
      id: 'INVOICE', 
      label: 'ใบแจ้งหนี้', 
      sublabel: 'Invoice (INV)',
      icon: Receipt, 
      count: salesDocs.filter(d => d.type === 'INVOICE').length,
      activeColor: 'bg-sky-600 text-white shadow-sky-200',
      badgeActive: 'bg-white text-sky-700'
    },
    { 
      id: 'TAX_INVOICE', 
      label: 'ใบกำกับภาษี', 
      sublabel: 'Tax Invoice (TAX)',
      icon: ShieldCheck, 
      count: salesDocs.filter(d => d.type === 'TAX_INVOICE').length,
      activeColor: 'bg-indigo-600 text-white shadow-indigo-200',
      badgeActive: 'bg-white text-indigo-700'
    },
    { 
      id: 'RECEIPT', 
      label: 'ใบเสร็จรับเงิน', 
      sublabel: 'Receipt (REC)',
      icon: CheckCircle2, 
      count: salesDocs.filter(d => d.type === 'RECEIPT').length,
      activeColor: 'bg-amber-600 text-white shadow-amber-200',
      badgeActive: 'bg-white text-amber-700'
    },
  ];

  const hasActiveFilters = 
    statusFilter !== 'ALL' || 
    datePreset !== 'ALL' || 
    startDate !== '' || 
    endDate !== '' || 
    searchTerm.trim() !== '';

  const handleResetFilters = () => {
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

      {/* ── Search & Filter Toolbar ─────────────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        
        {/* Row 1: Search & Status Filter */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, Tax ID, รายละเอียด..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
            />
          </div>

          {/* Quick Filters & Reset */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            
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
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
                title="ล้างตัวกรองทั้งหมด"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}

            {/* Filtered Total Amount Badge */}
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2">
              <span className="text-emerald-700 font-semibold">ยอดรวมในแท็บนี้:</span>
              <span className="font-bold text-emerald-800 font-mono text-sm">฿{formatMoney(totalFilteredNet)}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Date Range Filter Bar */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>ช่วงวันที่:</span>
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

      {/* ── DOCUMENTS TABLE WITH INTEGRATED TYPE TABS (NO 'ALL' TAB) ────────── */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        
        {/* Table Type Tabs Header */}
        <div className="bg-slate-50/80 border-b border-slate-200 p-2 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTypeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTypeTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                    isActive
                      ? `${tab.activeColor} shadow-md`
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100/80 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? tab.badgeActive : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 sm:p-6 space-y-4">
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
                      <p className="font-medium">
                        ไม่พบรายการเอกสารในแท็บ &quot;{tableTabs.find(t => t.id === activeTypeTab)?.label}&quot; ตามเงื่อนไขที่เลือก
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 hover:bg-rose-100 transition"
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
                            className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
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
                              หัก ณ ที่จ่าย 3%: -{formatMoney(doc.withholdingTaxTotal)}
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

          {/* Table Footer Summary Bar */}
          {filteredDocs.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-medium">
                แสดงผล <span className="font-bold text-slate-800">{filteredDocs.length}</span> รายการ ในแท็บ <span className="font-bold text-rose-600">{tableTabs.find(t => t.id === activeTypeTab)?.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400">VAT 7%: </span>
                  <span className="font-bold text-slate-700">฿{formatMoney(totalFilteredVat)}</span>
                </div>
                <div>
                  <span className="text-slate-400">ยอดรวมทั้งสิ้น: </span>
                  <span className="font-bold text-slate-800">฿{formatMoney(totalFilteredGrandTotal)}</span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-100/80 text-emerald-800 font-bold border border-emerald-200">
                  <span>รับสุทธิ: ฿{formatMoney(totalFilteredNet)}</span>
                </div>
              </div>
            </div>
          )}
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
