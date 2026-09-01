import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Filter, Eye, Printer, Pencil, Trash2, AlertTriangle, 
  CheckCircle2, RotateCcw, Calendar, Receipt, ShieldCheck, Clock, Download,
  TrendingUp, Zap, Sparkles, Building2, Layers, DollarSign, Activity,
  FileSpreadsheet, ChevronDown
} from 'lucide-react';
import { AccountingDocument, DocumentType, DocumentStatus } from '../../types';
import { formatMoney, getStatusBadge, formatThaiDate } from '../../utils/formatters';
import { exportSalesToExcel } from '../../utils/excelExport';

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
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // ── Excel Export Handlers ──────────────────────────────────────────────────
  const handleExportFiltered = () => {
    const activeTab = tableTabs.find(t => t.id === activeTypeTab);
    const tabName = activeTab ? activeTab.label.split(' ')[0] : 'เอกสารขาย';
    exportSalesToExcel(filteredDocs, `รายงาน_${tabName}`);
  };

  const handleExportAllSales = () => {
    exportSalesToExcel(salesDocs, 'รายงานเอกสารขายและรายได้ทั้งหมด');
  };

  // Sales-only document categories
  const salesTypes: DocumentType[] = ['QUOTATION', 'INVOICE', 'TAX_INVOICE', 'RECEIPT'];
  const salesDocs = documents.filter(d => salesTypes.includes(d.type));

  // ── High-Tech KPI Computations ──────────────────────────────────────────────
  const qtDocs = salesDocs.filter(d => d.type === 'QUOTATION');
  const qtTotal = qtDocs.reduce((s, d) => s + (d.grandTotal || 0), 0);
  
  const invDocs = salesDocs.filter(d => d.type === 'INVOICE' || d.type === 'TAX_INVOICE');
  const invTotal = invDocs.reduce((s, d) => s + (d.grandTotal || 0), 0);
  
  const recDocs = salesDocs.filter(d => d.type === 'RECEIPT');
  const recTotal = recDocs.reduce((s, d) => s + (d.netPayment || d.grandTotal || 0), 0);

  const pendingInv = invDocs.filter(d => d.status !== 'PAID');
  const pendingTotal = pendingInv.reduce((s, d) => s + (d.netPayment || d.grandTotal || 0), 0);

  // Tabs for table filtering
  const tableTabs = [
    {
      id: 'QUOTATION',
      label: 'ใบเสนอราคา (Quotation)',
      icon: FileText,
      count: salesDocs.filter(d => d.type === 'QUOTATION').length,
      activeColor: 'bg-emerald-600 text-white',
      badgeActive: 'bg-emerald-700 text-emerald-100',
    },
    {
      id: 'INVOICE',
      label: 'ใบแจ้งหนี้ / ใบกำกับภาษี (Invoice)',
      icon: Receipt,
      count: salesDocs.filter(d => d.type === 'INVOICE' || d.type === 'TAX_INVOICE').length,
      activeColor: 'bg-sky-600 text-white',
      badgeActive: 'bg-sky-700 text-sky-100',
    },
    {
      id: 'RECEIPT',
      label: 'ใบเสร็จรับเงิน (Receipt)',
      icon: CheckCircle2,
      count: salesDocs.filter(d => d.type === 'RECEIPT').length,
      activeColor: 'bg-rose-600 text-white',
      badgeActive: 'bg-rose-700 text-rose-100',
    },
  ];

  // Quick Date Preset Handler
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (preset === 'THIS_MONTH') {
      const firstDay = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const lastDay = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'THIS_YEAR') {
      const firstDay = `${currentYear}-01-01`;
      const lastDay = `${currentYear}-12-31`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter pipeline
  const filteredDocs = salesDocs.filter((doc) => {
    // 1. Table Type Tab Filter
    if (activeTypeTab === 'INVOICE') {
      if (doc.type !== 'INVOICE' && doc.type !== 'TAX_INVOICE') return false;
    } else {
      if (doc.type !== activeTypeTab) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;

    // 3. Date Range Filter
    if (startDate && doc.issueDate < startDate) return false;
    if (endDate && doc.issueDate > endDate) return false;

    // 4. Search Filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchDocNo = doc.documentNo.toLowerCase().includes(term);
      const matchPo = (doc.referencePoNo || '').toLowerCase().includes(term);
      const matchCustomer = (doc.contact?.companyName || doc.contact?.name || '').toLowerCase().includes(term);
      const matchTaxId = (doc.contact?.taxId || '').toLowerCase().includes(term);
      const matchItems = doc.items?.some(i => i.description.toLowerCase().includes(term));
      if (!matchDocNo && !matchPo && !matchCustomer && !matchTaxId && !matchItems) return false;
    }

    return true;
  });

  // Calculate Net Total of Currently Filtered Documents
  const totalFilteredGrandTotal = filteredDocs.reduce((acc, doc) => acc + (doc.grandTotal || 0), 0);
  const totalFilteredVat = filteredDocs.reduce((acc, doc) => acc + (doc.vatAmount || 0), 0);
  const totalFilteredNet = filteredDocs.reduce((acc, doc) => acc + (doc.netPayment || doc.grandTotal || 0), 0);

  // Check if any filter is actively applied
  const hasActiveFilters = statusFilter !== 'ALL' || datePreset !== 'ALL' || startDate !== '' || endDate !== '' || searchTerm !== '';

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-5 pb-12">

      {/* ── Futuristic Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-rose-950 to-pink-900 bg-clip-text text-transparent">
              ศูนย์ขาย & เอกสารรายได้ (Sales & Revenue Center)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>จัดการใบเสนอราคา (QT), ใบแจ้งหนี้ (INV), ใบกำกับภาษี และออกใบเสร็จรับเงิน (REC)</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-rose-600 font-bold">Automation PO Linked</span>
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
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-200/80 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ใบเสร็จรับเงิน</span>
          </button>

          {/* Export Excel Button & Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
              title="ส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-3.5 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ตัวเลือก Export Excel (.xlsx)
                </div>
                <button
                  onClick={() => {
                    handleExportFiltered();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">ส่งออกตามที่กรองอยู่ ({filteredDocs.length} รายการ)</div>
                    <div className="text-[10px] text-slate-500">แท็บ {tableTabs.find(t => t.id === activeTypeTab)?.label.split(' ')[0]}</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    handleExportAllSales();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition border-t border-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">ส่งออกเอกสารขายทั้งหมด ({salesDocs.length} รายการ)</div>
                    <div className="text-[10px] text-slate-500">รวม QT, INV, TAX, REC ทุกสถานะ</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ultra-Modern Single-Line Filter Toolbar ─────────────────────────── */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shadow-sm border border-slate-200/90">
        
        {/* Left: Futuristic Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่เอกสาร, Refer PO, ลูกค้า, Tax ID..."
            className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition"
          />
        </div>

        {/* Right: Controls & Badges on Single Line */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Date Filter Group */}
          <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">📅 ทุกช่วงเวลา</option>
              <option value="THIS_MONTH">เดือนนี้</option>
              <option value="LAST_MONTH">เดือนที่แล้ว</option>
              <option value="THIS_YEAR">ปีนี้ (2569)</option>
              <option value="CUSTOM">กำหนดวันที่เอง</option>
            </select>

            {datePreset === 'CUSTOM' && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none focus:border-rose-400"
                />
                <span className="text-slate-400 text-[10px]">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none focus:border-rose-400"
                />
              </div>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-rose-400 cursor-pointer"
          >
            <option value="ALL">🏷️ สถานะทั้งหมด</option>
            <option value="PENDING">⏳ รอดำเนินการ</option>
            <option value="APPROVED">✓ อนุมัติแล้ว</option>
            <option value="PAID">✓ ชำระแล้ว</option>
            <option value="OVERDUE">⚠️ เกินกำหนด</option>
            <option value="CANCELLED">✕ ยกเลิก</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
              title="ล้างตัวกรองทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Total Amount Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-xs flex items-center gap-1.5 shadow-sm">
            <span className="text-emerald-700 font-semibold text-[11px]">ยอดรวมในแท็บนี้:</span>
            <span className="font-bold text-emerald-800 font-mono text-xs sm:text-sm">฿{formatMoney(totalFilteredNet)}</span>
          </div>

          {/* Quick Export Button */}
          <button
            onClick={handleExportFiltered}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-300 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title={`ส่งออก Excel (${filteredDocs.length} รายการ)`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel ({filteredDocs.length})</span>
          </button>

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
        <div className="p-3 sm:p-5 space-y-4">
          <div className="table-scroll max-h-[620px] rounded-2xl border border-slate-200 shadow-inner">
            <table className="w-full text-left text-xs min-w-[860px]">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
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
              <tbody className="divide-y divide-slate-100 bg-white">
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
                          <div>{doc.documentNo}</div>
                          {doc.referencePoNo && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200" title={`เลขที่ PO ลูกค้า: ${doc.referencePoNo}`}>
                                <span className="font-bold">PO:</span> {doc.referencePoNo}
                              </span>
                            </div>
                          )}
                          {doc.referenceDocNo && !doc.referencePoNo && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                Ref: {doc.referenceDocNo}
                              </span>
                            </div>
                          )}
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
