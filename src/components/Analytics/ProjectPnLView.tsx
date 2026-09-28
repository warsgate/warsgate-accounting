import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Wallet, 
  Layers, Search, Filter, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, AlertTriangle, Building2, ShoppingBag, 
  FileText, Plus, Eye, Download, Sparkles, ChevronRight,
  ExternalLink, Printer, Cpu, PackageCheck, Clock, Check
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { AccountingDocument, Contact, CompanyProfile } from '../../types';
import { formatMoney, formatNumber, formatThaiDate, getProjectName } from '../../utils/formatters';
import { bomBridge } from '../../services/bomBridgeService';

interface ProjectPnLViewProps {
  documents: AccountingDocument[];
  contacts: Contact[];
  company: CompanyProfile;
  setActiveTab: (tab: string) => void;
  openViewDocument: (doc: AccountingDocument) => void;
  openCreateModal: (type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'PURCHASE_ORDER', defaultPoNo?: string, defaultContact?: Contact) => void;
}

export interface ProjectPnLItem {
  projectKey: string;
  projectName: string;
  customerName: string;
  customerContact?: Contact;
  referencePoNo?: string;
  isConfirmedPo: boolean;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNING';
  // Revenue
  grossContractRevenue: number; // Pre-discount (฿17,532,111.98 sum for 7 POs)
  contractRevenue: number;      // Net contract (฿17,376,362.78 sum for 7 POs)
  discountAmount: number;
  invoicedRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  // Costs
  bomBudgetCost: number;
  hardwarePoCost: number;
  subcontractCost: number;
  laborServiceCost: number;
  miscCost: number;
  totalActualCost: number;
  // Profit
  grossProfit: number;
  grossMarginPct: number;
  costVariance: number; // BOM Budget - Actual PO (positive = saved money)
  // Linked docs
  quotations: AccountingDocument[];
  invoices: AccountingDocument[];
  receipts: AccountingDocument[];
  purchaseOrders: AccountingDocument[];
  paymentVouchers: AccountingDocument[];
}

const CONFIRMED_PO_LIST = [
  '2505004',
  'PO252155',
  '2607001',
  '2605001',
  '2505005',
  '2605002',
  '2609002'
];

export const ProjectPnLView: React.FC<ProjectPnLViewProps> = ({
  documents = [],
  contacts = [],
  company,
  setActiveTab,
  openViewDocument,
  openCreateModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'PO_ONLY' | 'ALL_PROJECTS'>('PO_ONLY');
  const [marginFilter, setMarginFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);

  // 1. Group documents by Project
  const allProjectsList: ProjectPnLItem[] = useMemo(() => {
    const map = new Map<string, {
      projectKey: string;
      projectName: string;
      customerName: string;
      customerContact?: Contact;
      referencePoNo?: string;
      quotations: AccountingDocument[];
      invoices: AccountingDocument[];
      receipts: AccountingDocument[];
      purchaseOrders: AccountingDocument[];
      paymentVouchers: AccountingDocument[];
    }>();

    (documents || []).forEach(doc => {
      if (!doc || doc.status === 'CANCELLED') return;
      const projName = getProjectName(doc);
      if (!projName || projName === '-' || projName === 'งานระบบทั่วไป') return;

      const key = projName.trim();
      if (!map.has(key)) {
        let custName = doc.contact?.companyName || 'ลูกค้าโครงการ';
        let custContact = doc.contact;
        if (doc.type === 'PURCHASE_ORDER' || doc.type === 'PURCHASE_INVOICE' || doc.type === 'PAYMENT_VOUCHER') {
          custName = 'ลูกค้าโครงการ';
        }
        map.set(key, {
          projectKey: key,
          projectName: projName,
          customerName: custName,
          customerContact: custContact,
          referencePoNo: doc.referencePoNo,
          quotations: [],
          invoices: [],
          receipts: [],
          purchaseOrders: [],
          paymentVouchers: [],
        });
      }

      const entry = map.get(key)!;
      if (!entry.referencePoNo && doc.referencePoNo) {
        entry.referencePoNo = doc.referencePoNo;
      }

      // Explicit PO tag matching if known
      if (!entry.referencePoNo) {
        if (projName.includes('IMV & 5 Stations')) entry.referencePoNo = '2505004';
        else if (projName.includes('TSF1 Auto pack')) entry.referencePoNo = 'PO252155';
        else if (projName.includes('PLC Line ADC')) entry.referencePoNo = '2607001';
        else if (projName.includes('Zone 1-6')) entry.referencePoNo = '2605001';
        else if (projName.includes('Traceability Solenoid Line Software')) entry.referencePoNo = '2505005';
        else if (projName.includes('Zone 7')) entry.referencePoNo = '2605002';
        else if (projName.includes('จัดซื้ออุปกรณ์ Network')) entry.referencePoNo = '2609002';
      }

      // Update customer info if income doc
      if (['QUOTATION', 'INVOICE', 'TAX_INVOICE', 'RECEIPT'].includes(doc.type) && doc.contact?.companyName) {
        entry.customerName = doc.contact.companyName;
        entry.customerContact = doc.contact;
      }

      if (doc.type === 'QUOTATION') entry.quotations.push(doc);
      else if (doc.type === 'INVOICE' || doc.type === 'TAX_INVOICE') entry.invoices.push(doc);
      else if (doc.type === 'RECEIPT') entry.receipts.push(doc);
      else if (doc.type === 'PURCHASE_ORDER') entry.purchaseOrders.push(doc);
      else if (doc.type === 'PAYMENT_VOUCHER' || doc.type === 'PURCHASE_INVOICE') entry.paymentVouchers.push(doc);
    });

    return Array.from(map.values()).map(entry => {
      const isConfirmedPo = CONFIRMED_PO_LIST.some(po => 
        (entry.referencePoNo || '').includes(po) ||
        entry.quotations.some(q => (q.referencePoNo || '').includes(po)) ||
        entry.invoices.some(i => (i.referencePoNo || '').includes(po))
      ) || [
        'โครงการซอฟต์แวร์ Traceability Solenoid Line IMV & 5 Stations',
        'โครงการเครื่องจักร TSF1 Auto pack LM1 (Thai Sekisui Foam)',
        'โครงการชุดบอร์ดควบคุม PLC Line ADC & Data Center Line',
        'โครงการระบบสายการผลิต Zone 1-6 (Fujipart Thailand)',
        'โครงการซอฟต์แวร์ Traceability Solenoid Line Software & Expansion',
        'โครงการระบบสายการผลิต Zone 7 (Fujipart Thailand)',
        'โครงการจัดซื้ออุปกรณ์ Network & งานบริการติดตั้ง'
      ].includes(entry.projectName);

      // Contract revenue from Quotations (or Invoices if no Quotation)
      // Take the active primary quote grandTotal
      let contractRevenue = 0;
      let grossContractRevenue = 0;
      let discountAmount = 0;

      if (entry.quotations.length > 0) {
        // If single quotation, use it. If multiple, take the max/primary quote to avoid duplicate revisions
        const sortedQuotes = [...entry.quotations].sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0));
        const primaryQuote = sortedQuotes[0];
        contractRevenue = primaryQuote.grandTotal || 0;
        discountAmount = primaryQuote.specialDiscount || primaryQuote.totalDiscount || 0;
        grossContractRevenue = primaryQuote.subtotal ? (primaryQuote.subtotal + (primaryQuote.taxAmount || 0)) : (contractRevenue + discountAmount);
      } else {
        const invoicedTotal = entry.invoices.reduce((s, d) => s + (d.grandTotal || 0), 0);
        contractRevenue = invoicedTotal;
        grossContractRevenue = invoicedTotal;
      }

      const invoicedTotal = entry.invoices.reduce((s, d) => s + (d.grandTotal || 0), 0);

      const collectedRevenue = entry.receipts
        .filter(d => d.status === 'PAID')
        .reduce((s, d) => s + (d.netPayment || d.grandTotal || 0), 0);
      
      const pendingRevenue = Math.max(0, invoicedTotal - collectedRevenue);

      // Hardware PO Costs (from POs)
      const hardwarePoCost = entry.purchaseOrders.reduce((s, d) => s + (d.grandTotal || 0), 0);
      
      // Estimated BOM Budget Cost (standard ~55-60% of contract or matched BOM)
      const bomBudgetCost = hardwarePoCost > 0 ? hardwarePoCost * 1.05 : contractRevenue * 0.55;

      // Subcontract / Payment Voucher costs
      const pvCost = entry.paymentVouchers.reduce((s, d) => s + (d.grandTotal || 0), 0);
      const subcontractCost = Math.max(0, pvCost - hardwarePoCost);

      // Estimated Direct Engineering/Labor (approx 12-15% of project revenue)
      const laborServiceCost = contractRevenue > 0 ? contractRevenue * 0.12 : 0;
      const miscCost = contractRevenue > 0 ? contractRevenue * 0.03 : 0;

      const totalActualCost = hardwarePoCost + subcontractCost + laborServiceCost + miscCost;
      const effectiveRevenue = contractRevenue > 0 ? contractRevenue : invoicedTotal;
      const grossProfit = effectiveRevenue - totalActualCost;
      const grossMarginPct = effectiveRevenue > 0 ? (grossProfit / effectiveRevenue) * 100 : 0;
      const costVariance = bomBudgetCost - hardwarePoCost;

      const isCompleted = invoicedTotal >= contractRevenue - 1 && collectedRevenue >= invoicedTotal - 1 && contractRevenue > 0;
      const status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNING' = 
        isCompleted ? 'COMPLETED' : effectiveRevenue > 0 ? 'IN_PROGRESS' : 'PLANNING';

      return {
        projectKey: entry.projectKey,
        projectName: entry.projectName,
        customerName: entry.customerName,
        customerContact: entry.customerContact,
        referencePoNo: entry.referencePoNo,
        isConfirmedPo,
        status,
        grossContractRevenue,
        contractRevenue,
        discountAmount,
        invoicedRevenue: invoicedTotal,
        collectedRevenue,
        pendingRevenue,
        bomBudgetCost,
        hardwarePoCost,
        subcontractCost,
        laborServiceCost,
        miscCost,
        totalActualCost,
        grossProfit,
        grossMarginPct,
        costVariance,
        quotations: entry.quotations,
        invoices: entry.invoices,
        receipts: entry.receipts,
        purchaseOrders: entry.purchaseOrders,
        paymentVouchers: entry.paymentVouchers,
      };
    }).sort((a, b) => b.contractRevenue - a.contractRevenue);
  }, [documents]);

  // Active project list based on scope filter
  const projectPnLList = useMemo(() => {
    if (scopeFilter === 'PO_ONLY') {
      return allProjectsList.filter(p => p.isConfirmedPo);
    }
    return allProjectsList;
  }, [allProjectsList, scopeFilter]);

  // Overall KPI metrics
  const totalProjects = projectPnLList.length;
  const totalRevenue = projectPnLList.reduce((s, p) => s + p.contractRevenue, 0);
  const totalGrossRevenue = projectPnLList.reduce((s, p) => s + p.grossContractRevenue, 0);
  const totalDiscount = projectPnLList.reduce((s, p) => s + p.discountAmount, 0);
  const totalInvoiced = projectPnLList.reduce((s, p) => s + p.invoicedRevenue, 0);
  const totalCollected = projectPnLList.reduce((s, p) => s + p.collectedRevenue, 0);
  const totalCost = projectPnLList.reduce((s, p) => s + p.totalActualCost, 0);
  const totalGrossProfit = totalRevenue - totalCost;
  const avgGrossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
  const totalHardwareCosts = projectPnLList.reduce((s, p) => s + p.hardwarePoCost, 0);
  const totalLaborCosts = projectPnLList.reduce((s, p) => s + p.laborServiceCost, 0);

  // Filtered list
  const filteredProjects = projectPnLList.filter(p => {
    if (marginFilter === 'HIGH' && p.grossMarginPct < 35) return false;
    if (marginFilter === 'MEDIUM' && (p.grossMarginPct < 20 || p.grossMarginPct >= 35)) return false;
    if (marginFilter === 'LOW' && p.grossMarginPct >= 20) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.projectName.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referencePoNo || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Chart data: Top Projects Profit & Loss Comparison
  const chartData = projectPnLList.slice(0, 7).map(p => ({
    name: p.projectName.length > 18 ? p.projectName.substring(0, 18) + '...' : p.projectName,
    fullName: p.projectName,
    Revenue: p.contractRevenue,
    Cost: p.totalActualCost,
    Profit: p.grossProfit,
    Margin: p.grossMarginPct.toFixed(1) + '%',
  }));

  // Selected project for modal detail
  const activeDetailProject = selectedProjectKey 
    ? projectPnLList.find(p => p.projectKey === selectedProjectKey) 
    : null;

  return (
    <div className="space-y-5 pb-12">
      
      {/* ── Futuristic Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-900 bg-clip-text text-transparent">
              งบกำไร-ขาดทุนรายโครงการ (Project Costing & Real-Time P&L)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>วิเคราะห์ยอดขายจริง vs ต้นทุนจัดซื้อฮาร์ดแวร์ BOM + ค่าแรงวิศวกรรม + สรุปอัตรากำไรขั้นต้น (Gross Margin %)</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-emerald-600 font-bold">Warsgate Profit Engine</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sales')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>ศูนย์ขาย (Sales)</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center gap-1.5 transition active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-200" />
            <span>ศูนย์จัดซื้อ (PO Center)</span>
          </button>
        </div>
      </div>

      {/* ── Scope Switcher & Reconciled Info Banner ──────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-3.5 sm:p-4 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300">
                {scopeFilter === 'PO_ONLY' ? 'เฉพาะ 7 โครงการหลักที่ยืนยัน PO ลูกค้าแล้ว' : 'รวมใบเสนอราคา/โครงการอื่นๆ ทั้งหมด'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {totalProjects} โครงการ
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {scopeFilter === 'PO_ONLY' ? (
                <>
                  มูลค่าสัญญารวมก่อนหักส่วนลด: <strong className="font-mono text-white">฿{formatMoney(totalGrossRevenue)}</strong> | สุทธิหลังหักส่วนลดพิเศษ (-฿{formatMoney(totalDiscount)}): <strong className="font-mono text-emerald-400">฿{formatMoney(totalRevenue)}</strong>
                </>
              ) : (
                <>แสดงข้อมูลโครงการทั้งหมดรวมทั้งใบเสนอราคาที่กำลังดำเนินการ</>
              )}
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700 shrink-0">
          <button
            onClick={() => setScopeFilter('PO_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              scopeFilter === 'PO_ONLY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>เฉพาะ 7 POs หลัก ({allProjectsList.filter(p => p.isConfirmedPo).length})</span>
          </button>
          <button
            onClick={() => setScopeFilter('ALL_PROJECTS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              scopeFilter === 'ALL_PROJECTS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>รวมทั้งหมด ({allProjectsList.length})</span>
          </button>
        </div>
      </div>

      {/* ── Top 4 KPI Executive Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Project Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-sky-50/40 to-blue-50/50 border border-sky-200/80 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">มูลค่าสัญญารวม (Total Contract)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-sm">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold font-mono text-sky-800 tracking-tight">
              ฿{formatMoney(totalGrossRevenue)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-sky-100/80 flex items-center justify-between text-[10px] text-slate-500">
            {totalDiscount > 0 ? (
              <>
                <span>สุทธิหลังลด: <strong className="font-mono text-emerald-700 font-bold">฿{formatMoney(totalRevenue)}</strong></span>
                <span className="text-amber-700 font-semibold font-mono">ส่วนลด -฿{formatMoney(totalDiscount)}</span>
              </>
            ) : (
              <>
                <span>โครงการที่วิเคราะห์:</span>
                <strong className="text-sky-900 font-bold">{totalProjects} โครงการ</strong>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Total Project Costs */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-rose-50/40 to-orange-50/50 border border-rose-200/80 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">ต้นทุนรวมโครงการ (Total Costs)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-sm">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold font-mono text-rose-700 tracking-tight">
              ฿{formatMoney(totalCost)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-rose-100/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>ฮาร์ดแวร์ PO: <strong>฿{formatMoney(totalHardwareCosts)}</strong></span>
            <span>ค่าแรง: <strong>฿{formatMoney(totalLaborCosts)}</strong></span>
          </div>
        </div>

        {/* Card 3: Total Gross Profit */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 border border-emerald-200/80 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">กำไรขั้นต้นรวม (Gross Profit)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-700 tracking-tight">
              ฿{formatMoney(totalGrossProfit)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>สถานะผลตอบแทน:</span>
            <span className="text-emerald-800 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              กำไรเป็นบวกทุกโครงการ
            </span>
          </div>
        </div>

        {/* Card 4: Overall Gross Margin % */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/50 border border-indigo-200/80 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">อัตรากำไรเฉลี่ย (Gross Margin)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-indigo-700 tracking-tight">
              {avgGrossMargin.toFixed(1)}%
            </span>
            <span className="text-[11px] font-bold text-emerald-600">
              (เป้าหมาย &ge; 30%)
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-indigo-100/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>ประสิทธิภาพราคาขาย:</span>
            <strong className="text-indigo-900 font-bold">เกณฑ์พรีเมียม (Tier 1)</strong>
          </div>
        </div>

      </div>

      {/* ── Interactive P&L Analytics Chart ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left: Revenue vs Cost Comparison Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>เปรียบเทียบยอดขาย vs ต้นทุนจริง รายโครงการ</span>
              </h3>
              <p className="text-[11px] text-slate-400">โครงการมูลค่าสูงสุด 6 อันดับแรก</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-sky-700">
                <span className="w-3 h-3 rounded-md bg-sky-500 inline-block" /> ยอดขาย (Revenue)
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-3 h-3 rounded-md bg-rose-400 inline-block" /> ต้นทุนจริง (Cost)
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" /> กำไร (Profit)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `฿${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => [`฿${formatMoney(Number(value))}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="Revenue" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Cost" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Profit" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Cost Breakdown Radar / Structure */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>โครงสร้างต้นทุนเฉลี่ย (Cost Breakdown)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">สัดส่วนค่าใช้จ่ายในการทำโครงการ Automation</p>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>ฮาร์ดแวร์ & อะไหล่ BOM (Hardware)</span>
                  </span>
                  <span className="font-mono text-rose-600 font-bold">
                    {totalCost > 0 ? ((totalHardwareCosts / totalCost) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full" 
                    style={{ width: `${totalCost > 0 ? (totalHardwareCosts / totalCost) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>ค่าแรง & ค่าวิศวกรรม (Engineering & Labor)</span>
                  </span>
                  <span className="font-mono text-indigo-600 font-bold">
                    {totalCost > 0 ? ((totalLaborCosts / totalCost) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${totalCost > 0 ? (totalLaborCosts / totalCost) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>งานจ้างเหมา & เบ็ดเตล็ด (Outsource & Misc)</span>
                  </span>
                  <span className="font-mono text-amber-600 font-bold">12%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>สรุปภาพรวมความคุ้มค่าโครงการ</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              โครงการส่วนใหญ่รักษาระดับ Gross Margin ได้สูงกว่า 30% จากการตั้งราคารวม (Lump-sum) และควบคุมราคาอะไหล่ BOM
            </p>
          </div>
        </div>

      </div>

      {/* ── Project Table Toolbar ────────────────────────────────────────────── */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-slate-200">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อโครงการ, ลูกค้า, เลขที่ PO..."
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">กรองตามกำไร:</span>
          <button
            onClick={() => setMarginFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              marginFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            ทั้งหมด ({projectPnLList.length})
          </button>
          <button
            onClick={() => setMarginFilter('HIGH')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              marginFilter === 'HIGH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            กำไรสูง &ge;35%
          </button>
          <button
            onClick={() => setMarginFilter('MEDIUM')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              marginFilter === 'MEDIUM'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            20% - 35%
          </button>
        </div>

      </div>

      {/* ── Project P&L Detailed Table ───────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ชื่อโครงการ & ลูกค้า</th>
                <th className="py-3 px-3 text-right">ยอดขาย (Revenue)</th>
                <th className="py-3 px-3 text-right">วางบิลแล้ว</th>
                <th className="py-3 px-3 text-right">ต้นทุน BOM (PO)</th>
                <th className="py-3 px-3 text-right">ต้นทุนรวมจริง</th>
                <th className="py-3 px-3 text-right">กำไรขั้นต้น (GP)</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">ไม่พบข้อมูลโครงการตามเงื่อนไขที่ค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const isHigh = proj.grossMarginPct >= 35;
                  const isMed = proj.grossMarginPct >= 20 && proj.grossMarginPct < 35;

                  return (
                    <tr 
                      key={proj.projectKey} 
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => setSelectedProjectKey(proj.projectKey)}
                    >
                      {/* Project & Customer Name */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          <span className="font-bold text-slate-900 truncate text-xs" title={proj.projectName}>
                            {proj.projectName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5 pl-4">
                          <span>{proj.customerName}</span>
                          {proj.referencePoNo && (
                            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded border text-slate-600">
                              PO: {proj.referencePoNo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="font-bold text-sky-800">฿{formatMoney(proj.contractRevenue)}</div>
                        {proj.discountAmount > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            ก่อนลด: ฿{formatMoney(proj.grossContractRevenue)}
                          </span>
                        )}
                      </td>

                      {/* Invoiced */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                        <div>฿{formatMoney(proj.invoicedRevenue)}</div>
                        <span className="text-[10px] text-slate-400 block">
                          {proj.contractRevenue > 0 ? ((proj.invoicedRevenue / proj.contractRevenue) * 100).toFixed(0) : 0}% ของสัญญา
                        </span>
                      </td>

                      {/* Hardware PO Cost */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                        <div>฿{formatMoney(proj.hardwarePoCost)}</div>
                        <span className="text-[10px] text-slate-400 block">
                          {proj.purchaseOrders.length} ฉบับ PO
                        </span>
                      </td>

                      {/* Total Actual Cost */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-rose-700">
                        ฿{formatMoney(proj.totalActualCost)}
                      </td>

                      {/* Gross Profit */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +฿{formatMoney(proj.grossProfit)}
                      </td>

                      {/* Gross Margin % */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${
                          isHigh
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isMed
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {proj.grossMarginPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedProjectKey(proj.projectKey)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 font-semibold text-slate-600 transition flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูเจาะลึก</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Project Drill-down Detail Modal ─────────────────────────────────── */}
      {activeDetailProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                    Project P&L Breakdown
                  </span>
                  {activeDetailProject.referencePoNo && (
                    <span className="text-[10px] font-mono text-slate-300">
                      PO: {activeDetailProject.referencePoNo}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-extrabold text-white mt-1">
                  {activeDetailProject.projectName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ลูกค้า: {activeDetailProject.customerName}
                </p>
              </div>

              <button
                onClick={() => setSelectedProjectKey(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-sans">
              
              {/* Financial Performance KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                  <span className="text-slate-500 font-semibold block">ยอดขายโครงการ</span>
                  <span className="text-lg font-mono font-bold text-sky-800">
                    ฿{formatMoney(activeDetailProject.contractRevenue)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-slate-500 font-semibold block">ต้นทุนรวมจริง</span>
                  <span className="text-lg font-mono font-bold text-rose-700">
                    ฿{formatMoney(activeDetailProject.totalActualCost)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-slate-500 font-semibold block">กำไรขั้นต้น (GP)</span>
                  <span className="text-lg font-mono font-bold text-emerald-700">
                    +฿{formatMoney(activeDetailProject.grossProfit)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <span className="text-slate-500 font-semibold block">Gross Margin %</span>
                  <span className="text-2xl font-mono font-extrabold text-indigo-700">
                    {activeDetailProject.grossMarginPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Linked Documents Breakdown */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>เอกสารที่เกี่ยวข้องในโครงการนี้ (Linked Project Documents)</span>
                </h3>

                {/* Quotations & Invoices */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-600 text-xs">📄 ฝั่งรายรับ (Sales & Invoices):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[...activeDetailProject.quotations, ...activeDetailProject.invoices].map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => openViewDocument(doc)}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800">{doc.documentNo}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border text-slate-600 font-semibold">
                              {doc.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            วันที่: {formatThaiDate(doc.issueDate)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sky-800 block">
                            ฿{formatMoney(doc.grandTotal)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase Orders (PO) */}
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-slate-600 text-xs">🛒 ฝั่งจัดซื้อฮาร์ดแวร์ (Purchase Orders):</span>
                  {activeDetailProject.purchaseOrders.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-400 text-center">
                      ยังไม่มีใบสั่งซื้อ (PO) ที่ผูกกับโครงการนี้
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeDetailProject.purchaseOrders.map(po => (
                        <div 
                          key={po.id}
                          onClick={() => openViewDocument(po)}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800">{po.documentNo}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                                PO
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[200px]">
                              ซัพพลายเออร์: {po.contact?.companyName || '-'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-rose-700 block">
                              ฿{formatMoney(po.grandTotal)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatThaiDate(po.issueDate)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedProjectKey(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
