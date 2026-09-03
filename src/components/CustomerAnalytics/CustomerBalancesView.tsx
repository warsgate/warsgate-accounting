import React, { useState } from 'react';
import { 
  Building2, FileText, Clock, CheckCircle2, AlertCircle, 
  Search, ArrowUpRight, Eye, Plus, Printer, ChevronDown, 
  ChevronUp, Sparkles, Filter, Layers, DollarSign, Wallet,
  Calendar, CheckCircle, ExternalLink, ArrowRight, TrendingUp
} from 'lucide-react';
import { AccountingDocument, Contact, CompanyProfile } from '../../types';
import { formatMoney, formatThaiDate } from '../../utils/formatters';

interface CustomerBalancesViewProps {
  documents: AccountingDocument[];
  contacts: Contact[];
  company: CompanyProfile;
  setActiveTab: (tab: string) => void;
  openCreateModal: (type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'PURCHASE_ORDER', defaultPoNo?: string, defaultContact?: Contact) => void;
  openViewDocument: (doc: AccountingDocument) => void;
}

export const CustomerBalancesView: React.FC<CustomerBalancesViewProps> = ({
  documents = [],
  contacts = [],
  company,
  setActiveTab,
  openCreateModal,
  openViewDocument,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNBILLED_ONLY' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({
    '2505004': true,
    '2605001': true,
    '2605002': true,
    'PO252155': true,
    '2607001': true,
    '2505005': false,
  });

  const toggleExpand = (poNo: string) => {
    setExpandedPOs(prev => ({
      ...prev,
      [poNo]: !prev[poNo]
    }));
  };

  // 1. Gather all POs from QUOTATION documents with referencePoNo
  const poDocuments = (documents || []).filter(
    d => d.type === 'QUOTATION' && d.referencePoNo && d.status !== 'CANCELLED'
  );

  // 2. Gather all Invoices
  const allInvoices = (documents || []).filter(
    d => (d.type === 'INVOICE' || d.type === 'TAX_INVOICE') && d.status !== 'CANCELLED'
  );

  // 3. Customer analysis data aggregation
  const customerList = (contacts || []).filter(c => c && (c.type === 'CUSTOMER' || c.type === 'BOTH'));

  const customerAnalytics = customerList.map(cust => {
    // Find POs for this customer
    const custPOs = poDocuments.filter(po => 
      (po.contact?.id && po.contact.id === cust.id) ||
      (po.contact?.taxId && cust.taxId && po.contact.taxId.replace(/[-\s]/g, '') === cust.taxId.replace(/[-\s]/g, '')) ||
      (po.contact?.companyName && cust.companyName && po.contact.companyName.trim().toLowerCase() === cust.companyName.trim().toLowerCase())
    );

    // Find all invoices for this customer
    const custInvoices = allInvoices.filter(inv => 
      (inv.contact?.id && inv.contact.id === cust.id) ||
      (inv.contact?.taxId && cust.taxId && inv.contact.taxId.replace(/[-\s]/g, '') === cust.taxId.replace(/[-\s]/g, '')) ||
      (inv.contact?.companyName && cust.companyName && inv.contact.companyName.trim().toLowerCase() === cust.companyName.trim().toLowerCase())
    );

    // PO Detailed breakdown
    const poBreakdowns = custPOs.map(po => {
      const poNo = po.referencePoNo || '';
      const linkedInvoices = custInvoices.filter(inv => inv.referencePoNo === poNo);
      
      const totalPoAmount = po.grandTotal || 0;
      const invoicedTotal = linkedInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const uninvoicedAmount = Math.max(0, totalPoAmount - invoicedTotal);
      
      const paidInvoices = linkedInvoices.filter(inv => inv.status === 'PAID');
      const paidTotal = paidInvoices.reduce((sum, inv) => sum + (inv.netPayment || inv.grandTotal || 0), 0);
      
      const pendingInvoices = linkedInvoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
      const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + (inv.netPayment || inv.grandTotal || 0), 0);

      const isInvoicedComplete = invoicedTotal >= totalPoAmount - 1;

      return {
        poDoc: po,
        poNo,
        title: po.items?.[0]?.name || po.projectNote || po.notes || 'โครงการตามสัญญา PO',
        description: po.items?.[0]?.description || '',
        issueDate: po.issueDate,
        totalPoAmount,
        subtotal: po.subtotal || 0,
        vatAmount: po.vatAmount || 0,
        whtTotal: po.withholdingTaxTotal || 0,
        netPayment: po.netPayment || (totalPoAmount - (po.withholdingTaxTotal || 0)),
        invoices: linkedInvoices,
        invoicedTotal,
        uninvoicedAmount,
        paidTotal,
        pendingTotal,
        isInvoicedComplete,
        percentInvoiced: totalPoAmount > 0 ? (invoicedTotal / totalPoAmount) * 100 : 0,
        percentPaid: totalPoAmount > 0 ? (paidTotal / totalPoAmount) * 100 : 0,
      };
    });

    const totalCustPoValue = poBreakdowns.reduce((sum, p) => sum + p.totalPoAmount, 0);
    const totalCustInvoiced = poBreakdowns.reduce((sum, p) => sum + p.invoicedTotal, 0);
    const totalCustUninvoiced = poBreakdowns.reduce((sum, p) => sum + p.uninvoicedAmount, 0);
    const totalCustPendingAR = poBreakdowns.reduce((sum, p) => sum + p.pendingTotal, 0);
    const totalCustPaidCash = poBreakdowns.reduce((sum, p) => sum + p.paidTotal, 0);

    return {
      customer: cust,
      poList: poBreakdowns,
      totalPoValue: totalCustPoValue,
      totalInvoiced: totalCustInvoiced,
      totalUninvoiced: totalCustUninvoiced,
      totalPendingAR: totalCustPendingAR,
      totalPaidCash: totalCustPaidCash,
      invoicedPercent: totalCustPoValue > 0 ? (totalCustInvoiced / totalCustPoValue) * 100 : 0,
      paidPercent: totalCustPoValue > 0 ? (totalCustPaidCash / totalCustPoValue) * 100 : 0,
    };
  }).filter(c => c.totalPoValue > 0 || c.poList.length > 0);

  // Overall Global KPI Summary
  const globalTotalPoValue = customerAnalytics.reduce((sum, c) => sum + c.totalPoValue, 0);
  const globalTotalInvoiced = customerAnalytics.reduce((sum, c) => sum + c.totalInvoiced, 0);
  const globalTotalUninvoiced = customerAnalytics.reduce((sum, c) => sum + c.totalUninvoiced, 0);
  const globalTotalPendingAR = customerAnalytics.reduce((sum, c) => sum + c.totalPendingAR, 0);
  const globalTotalPaidCash = customerAnalytics.reduce((sum, c) => sum + c.totalPaidCash, 0);

  // Filtered customers and POs based on search and filters
  const filteredCustomers = customerAnalytics
    .filter(c => {
      if (selectedCustomerId !== 'ALL' && c.customer.id !== selectedCustomerId) return false;
      return true;
    })
    .map(c => {
      let filteredPos = c.poList;

      if (statusFilter === 'UNBILLED_ONLY') {
        filteredPos = filteredPos.filter(p => !p.isInvoicedComplete && p.uninvoicedAmount > 1);
      } else if (statusFilter === 'COMPLETED') {
        filteredPos = filteredPos.filter(p => p.isInvoicedComplete);
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredPos = filteredPos.filter(p => 
          p.poNo.toLowerCase().includes(term) ||
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.invoices.some(inv => inv.documentNo.toLowerCase().includes(term))
        );
      }

      return {
        ...c,
        poList: filteredPos
      };
    })
    .filter(c => c.poList.length > 0 || !searchTerm.trim());

  return (
    <div className="space-y-6 pb-16">
      
      {/* ── Page Header & Title ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              CUSTOMER PO & UNBILLED CONTRACT ANALYTICS
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              เจาะลึกยอดคงเหลือ & สัญญา PO รายลูกค้า
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              ติดตามมูลค่าโครงการตามใบสั่งซื้อ (PO), ยอดที่เปิดใบแจ้งหนี้แล้ว, ลูกหนี้รอเก็บเงิน, และยอด Backlog คงเหลือที่ยังไม่ได้เปิด INV
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-2 transition active:scale-95"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              <span>พิมพ์รายงานสรุปผู้บริหาร</span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <span>ไปที่ศูนย์การขาย</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Highlight Summary Mini-Bar */}
        <div className="mt-6 pt-5 border-t border-indigo-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">📋 มูลค่า PO รวมตามสัญญา</span>
            <span className="font-extrabold font-mono text-base block mt-0.5 text-white">฿{formatMoney(globalTotalPoValue)}</span>
            <span className="text-[10px] text-indigo-300 font-medium">{poDocuments.length} สัญญา PO</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">🧾 เปิด INV ไปแล้ว</span>
            <span className="font-extrabold font-mono text-base block mt-0.5 text-sky-300">฿{formatMoney(globalTotalInvoiced)}</span>
            <span className="text-[10px] text-sky-400 font-medium">{globalTotalPoValue > 0 ? ((globalTotalInvoiced / globalTotalPoValue) * 100).toFixed(1) : 0}% ของสัญญา</span>
          </div>

          <div className="bg-indigo-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-indigo-400/30 text-white shadow-inner">
            <span className="text-indigo-200 block text-[11px] font-bold">⏳ ยังไม่ได้เปิด INV (Backlog)</span>
            <span className="font-black font-mono text-base block mt-0.5 text-indigo-300">฿{formatMoney(globalTotalUninvoiced)}</span>
            <span className="text-[10px] text-indigo-200 font-medium">{globalTotalPoValue > 0 ? ((globalTotalUninvoiced / globalTotalPoValue) * 100).toFixed(1) : 0}% รอเปิดบิล</span>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/30 text-white shadow-inner">
            <span className="text-amber-200 block text-[11px] font-bold">💰 ลูกหนี้รอเก็บเงิน (AR)</span>
            <span className="font-black font-mono text-base block mt-0.5 text-amber-300">฿{formatMoney(globalTotalPendingAR)}</span>
            <span className="text-[10px] text-amber-200 font-medium">5 ใบแจ้งหนี้รอลูกค้าโอน</span>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ─────────────────────────────────────────── */}
      <div className="glass-panel p-3 sm:p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm border border-slate-200 bg-white">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่ PO (เช่น 2505004), ชื่อโครงการ, เลขที่ใบแจ้งหนี้..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/20 transition"
          />
        </div>

        {/* Customer & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Customer Selector */}
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="ALL">ลูกค้าทั้งหมด ({customerAnalytics.length} บริษัท)</option>
            {customerAnalytics.map(c => (
              <option key={c.customer.id} value={c.customer.id}>
                {c.customer.companyName}
              </option>
            ))}
          </select>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('UNBILLED_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                statusFilter === 'UNBILLED_ONLY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>ยังไม่ครบ</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                ฿9.9M
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statusFilter === 'COMPLETED'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เปิดครบแล้ว
            </button>
          </div>

        </div>

      </div>

      {/* ── Customers Drilldown Section ─────────────────────────────────────── */}
      <div className="space-y-8">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 glass-panel rounded-3xl">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">ไม่พบข้อมูลสัญญา PO ตามเงื่อนไขค้นหา</p>
            <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น "ทั้งหมด"</p>
          </div>
        ) : (
          filteredCustomers.map((custData, cIdx) => {
            const { customer, poList, totalPoValue, totalInvoiced, totalUninvoiced, totalPendingAR, totalPaidCash, invoicedPercent, paidPercent } = custData;

            return (
              <div key={customer.id || cIdx} className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6 border border-slate-200/90 shadow-md bg-white">
                
                {/* 1. Customer Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                      {(customer.companyName || 'C').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          🧑‍💼 ลูกค้าองค์กร
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Tax ID: {customer.taxId || '-'}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                          {customer.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${customer.branchCode}`}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 mt-1">{customer.companyName}</h2>
                      <p className="text-xs text-slate-500 font-medium">{customer.name || 'ฝ่ายจัดซื้อและบัญชี'} • {customer.phone || '02-xxx-xxxx'}</p>
                    </div>
                  </div>

                  {/* Customer Quick Stats Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="p-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                      <span className="text-[10px] font-semibold text-slate-500 block">มูลค่า PO รวม</span>
                      <span className="text-xs font-bold font-mono text-slate-800">฿{formatMoney(totalPoValue)}</span>
                    </div>

                    <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                      <span className="text-[10px] font-bold text-emerald-700 block">รับเงินแล้ว</span>
                      <span className="text-xs font-extrabold font-mono text-emerald-700">฿{formatMoney(totalPaidCash)}</span>
                    </div>

                    <div className="p-2.5 px-3.5 rounded-xl bg-amber-50 border border-amber-200 text-right">
                      <span className="text-[10px] font-bold text-amber-700 block">รอเก็บเงิน (AR)</span>
                      <span className="text-xs font-extrabold font-mono text-amber-700">฿{formatMoney(totalPendingAR)}</span>
                    </div>

                    <div className="p-2.5 px-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-right shadow-sm">
                      <span className="text-[10px] font-bold text-indigo-700 block">⏳ ยังไม่เปิด INV</span>
                      <span className="text-xs font-black font-mono text-indigo-800">฿{formatMoney(totalUninvoiced)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Visual Multi-segment Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">ความคืบหน้าการเปิดบิล & รับชำระเงินของสัญญา:</span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-emerald-700 font-bold">🟢 รับชำระ {paidPercent.toFixed(1)}%</span>
                      <span className="text-amber-700 font-bold">🟡 รอเก็บเงิน {totalPoValue > 0 ? ((totalPendingAR / totalPoValue) * 100).toFixed(1) : 0}%</span>
                      <span className="text-indigo-700 font-bold">🔵 ยังไม่เปิด INV {totalPoValue > 0 ? ((totalUninvoiced / totalPoValue) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>

                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
                    <div 
                      style={{ width: `${paidPercent}%` }} 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      title={`รับเงินแล้ว ฿${formatMoney(totalPaidCash)} (${paidPercent.toFixed(1)}%)`}
                    />
                    <div 
                      style={{ width: `${totalPoValue > 0 ? (totalPendingAR / totalPoValue) * 100 : 0}%` }} 
                      className="bg-amber-400 h-full transition-all duration-500" 
                      title={`เปิด INV แล้ว รอลูกค้าโอน ฿${formatMoney(totalPendingAR)}`}
                    />
                    <div 
                      style={{ width: `${totalPoValue > 0 ? (totalUninvoiced / totalPoValue) * 100 : 0}%` }} 
                      className="bg-indigo-500/80 h-full transition-all duration-500" 
                      title={`ยังไม่ได้เปิด INV ฿${formatMoney(totalUninvoiced)}`}
                    />
                  </div>
                </div>

                {/* 3. Detailed PO Projects Grid / Accordions */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>รายการใบสั่งซื้อและงวดงานที่ผูกกับสัญญา ({poList.length} โครงการ):</span>
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {poList.map(poItem => {
                      const isExpanded = expandedPOs[poItem.poNo] !== false;
                      const hasUninvoiced = poItem.uninvoicedAmount > 1;

                      return (
                        <div 
                          key={poItem.poNo}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            hasUninvoiced 
                              ? 'bg-slate-50/60 border-slate-200 hover:border-indigo-300' 
                              : 'bg-emerald-50/20 border-emerald-200'
                          }`}
                        >
                          {/* PO Accordion Header */}
                          <div 
                            onClick={() => toggleExpand(poItem.poNo)}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition"
                          >
                            <div className="flex items-start gap-3">
                              <button className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 mt-0.5">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    PO: {poItem.poNo}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    ออกเมื่อ: {formatThaiDate(poItem.issueDate)}
                                  </span>
                                  {poItem.isInvoicedComplete ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      เปิดบิลครบ 100%
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      ค้างเปิด INV ({((poItem.uninvoicedAmount / poItem.totalPoAmount) * 100).toFixed(0)}%)
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900 mt-1">{poItem.title}</h4>
                                {poItem.description && (
                                  <p className="text-xs text-slate-500 line-clamp-1">{poItem.description}</p>
                                )}
                              </div>
                            </div>

                            {/* PO Right Summary Amounts */}
                            <div className="flex items-center gap-4 text-right shrink-0 pl-9 sm:pl-0">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-medium">มูลค่าโครงการรวม</span>
                                <span className="text-xs font-bold font-mono text-slate-800">฿{formatMoney(poItem.totalPoAmount)}</span>
                              </div>

                              <div className="pl-3 border-l border-slate-200">
                                <span className="text-[10px] font-bold text-indigo-600 block">ยอดค้างเปิด INV</span>
                                <span className={`text-sm font-black font-mono block ${hasUninvoiced ? 'text-indigo-700' : 'text-emerald-600'}`}>
                                  ฿{formatMoney(poItem.uninvoicedAmount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* PO Accordion Body */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/80 bg-white space-y-4">
                              
                              {/* 1. Invoices Issued for this PO */}
                              <div className="space-y-2 pt-3">
                                <span className="text-xs font-bold text-slate-700 block">
                                  📄 ใบแจ้งหนี้ที่ออกแล้วสำหรับ PO นี้ ({poItem.invoices.length} ฉบับ):
                                </span>

                                {poItem.invoices.length === 0 ? (
                                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                                    ยังไม่เคยมีการเปิดใบแจ้งหนี้สำหรับ PO นี้
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                    <table className="w-full text-left text-xs min-w-[550px]">
                                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2.5 px-3">เลขที่ใบแจ้งหนี้</th>
                                          <th className="py-2.5 px-3">งวดงาน / รายการ</th>
                                          <th className="py-2.5 px-3">วันที่ออก</th>
                                          <th className="py-2.5 px-3 text-right">ยอดรวม (บาท)</th>
                                          <th className="py-2.5 px-3 text-center">สถานะ</th>
                                          <th className="py-2.5 px-3 text-center">จัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {poItem.invoices.map(inv => (
                                          <tr key={inv.id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{inv.documentNo}</td>
                                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                                              {inv.items?.[0]?.name || 'ค่างวดงานตามสัญญา'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{formatThaiDate(inv.issueDate)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                              ฿{formatMoney(inv.netPayment || inv.grandTotal)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                inv.status === 'PAID'
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                              }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {inv.status === 'PAID' ? 'ชำระแล้ว' : 'รอรับชำระ'}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <button 
                                                onClick={() => openViewDocument(inv)}
                                                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition shadow-sm"
                                                title="ดูเอกสาร"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              {/* 2. Next Action & Unbilled Milestone Card */}
                              {hasUninvoiced ? (
                                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                                  <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                                      <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-indigo-950">ยอดคงเหลือที่ยังไม่ได้เปิดใบแจ้งหนี้:</span>
                                        <span className="text-xs font-black font-mono text-indigo-700">฿{formatMoney(poItem.uninvoicedAmount)}</span>
                                      </div>
                                      <p className="text-[11px] text-indigo-700 mt-0.5">
                                        งวดงานถัดไปตามสัญญา PO พร้อมสำหรับการออกใบแจ้งหนี้เพื่อส่งเรียกเก็บเงินกับลูกค้า
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => openCreateModal('INVOICE', poItem.poNo, customer)}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95 shrink-0"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ออกใบแจ้งหนี้งวดนี้</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>โครงการนี้ได้ทำการเปิดใบแจ้งหนี้ครบตามยอด PO ทั้งหมดเรียบร้อยแล้ว</span>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
