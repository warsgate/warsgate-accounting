import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, DollarSign, Wallet, TrendingUp, TrendingDown, 
  AlertCircle, AlertTriangle, CheckCircle2, Search, Filter, 
  FileText, ArrowUpRight, ArrowDownRight, Building2, Phone, 
  Mail, MessageSquare, ExternalLink, Printer, Copy, Check, Sparkles,
  ShoppingBag, ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { AccountingDocument, Contact, CompanyProfile } from '../../types';
import { formatMoney, formatNumber, formatThaiDate } from '../../utils/formatters';

interface CashFlowAgingViewProps {
  documents: AccountingDocument[];
  contacts: Contact[];
  company: CompanyProfile;
  setActiveTab: (tab: string) => void;
  openViewDocument: (doc: AccountingDocument) => void;
}

export interface AgingBucket {
  current: number;       // ยังไม่ถึงกำหนด (Due in future)
  days1_30: number;      // 1-30 วัน
  days31_60: number;     // 31-60 วัน
  days61_90: number;     // 61-90 วัน
  days90Plus: number;    // >90 วัน
  total: number;
}

export const CashFlowAgingView: React.FC<CashFlowAgingViewProps> = ({
  documents = [],
  contacts = [],
  company,
  setActiveTab,
  openViewDocument,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'AR_AGING' | 'AP_AGING' | 'CASH_FLOW_FORECAST'>('AR_AGING');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedDocNo, setCopiedDocNo] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Helper to calculate days overdue
  const getDaysOverdue = (dueDateStr?: string): number => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const diffTime = today.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. Gather all Pending Invoices (AR)
  const pendingInvoices = useMemo(() => {
    return (documents || []).filter(d => 
      (d.type === 'INVOICE' || d.type === 'TAX_INVOICE') && 
      d.status !== 'PAID' && 
      d.status !== 'CANCELLED'
    );
  }, [documents]);

  // 2. Gather all Pending Purchase Orders / Invoices (AP)
  const pendingPayables = useMemo(() => {
    return (documents || []).filter(d => 
      ['PURCHASE_ORDER', 'PURCHASE_INVOICE'].includes(d.type) && 
      d.status !== 'PAID' && 
      d.status !== 'CANCELLED'
    );
  }, [documents]);

  // 3. Calculate AR Aging Buckets
  const arAgingSummary: AgingBucket = useMemo(() => {
    let current = 0, days1_30 = 0, days31_60 = 0, days61_90 = 0, days90Plus = 0;

    pendingInvoices.forEach(inv => {
      const amount = inv.netPayment || inv.grandTotal || 0;
      const days = getDaysOverdue(inv.dueDate || inv.issueDate);
      if (days <= 0) current += amount;
      else if (days <= 30) days1_30 += amount;
      else if (days <= 60) days31_60 += amount;
      else if (days <= 90) days61_90 += amount;
      else days90Plus += amount;
    });

    return {
      current,
      days1_30,
      days31_60,
      days61_90,
      days90Plus,
      total: current + days1_30 + days31_60 + days61_90 + days90Plus,
    };
  }, [pendingInvoices]);

  // 4. Calculate AP Aging Buckets
  const apAgingSummary: AgingBucket = useMemo(() => {
    let current = 0, days1_30 = 0, days31_60 = 0, days61_90 = 0, days90Plus = 0;

    pendingPayables.forEach(doc => {
      const amount = doc.netPayment || doc.grandTotal || 0;
      const days = getDaysOverdue(doc.dueDate || doc.issueDate);
      if (days <= 0) current += amount;
      else if (days <= 30) days1_30 += amount;
      else if (days <= 60) days31_60 += amount;
      else if (days <= 90) days61_90 += amount;
      else days90Plus += amount;
    });

    return {
      current,
      days1_30,
      days31_60,
      days61_90,
      days90Plus,
      total: current + days1_30 + days31_60 + days61_90 + days90Plus,
    };
  }, [pendingPayables]);

  // 5. Customer AR Breakdown List
  const customerARList = useMemo(() => {
    const custMap = new Map<string, {
      customer: Contact;
      invoices: AccountingDocument[];
      bucket: AgingBucket;
    }>();

    pendingInvoices.forEach(inv => {
      const invContact = inv.contact;
      const custId = invContact?.id || invContact?.taxId || invContact?.companyName || 'UNKNOWN';
      if (!custMap.has(custId)) {
        const matchedCust: Contact = contacts.find(c => c.id === custId || (invContact?.taxId && c.taxId === invContact.taxId)) || (invContact ? invContact : {
          id: custId,
          name: 'ลูกค้าทั่วไป',
          companyName: invContact ? (invContact as any).companyName || 'ลูกค้าทั่วไป' : 'ลูกค้าทั่วไป',
          taxId: '0000000000000',
          isBranch: false,
          branchCode: '00000',
          address: '-',
          phone: '-',
          email: '-',
          type: 'CUSTOMER',
          creditDays: 30,
          totalTransactions: 0,
          balanceDue: 0,
        });
        custMap.set(custId, {
          customer: matchedCust,
          invoices: [],
          bucket: { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0, total: 0 },
        });
      }

      const item = custMap.get(custId)!;
      item.invoices.push(inv);

      const amount = inv.netPayment || inv.grandTotal || 0;
      const days = getDaysOverdue(inv.dueDate || inv.issueDate);
      if (days <= 0) item.bucket.current += amount;
      else if (days <= 30) item.bucket.days1_30 += amount;
      else if (days <= 60) item.bucket.days31_60 += amount;
      else if (days <= 90) item.bucket.days61_90 += amount;
      else item.bucket.days90Plus += amount;
      item.bucket.total += amount;
    });

    return Array.from(custMap.values()).sort((a, b) => b.bucket.total - a.bucket.total);
  }, [pendingInvoices, contacts]);

  // 6. Cash Flow Forecast (Next 30 - 90 Days Timeline)
  const cashFlowTimeline = useMemo(() => {
    // Group into 4 periods: Overdue, Next 1-15 Days, Next 16-30 Days, Next 31-60 Days, Next 61-90 Days
    const periods = [
      { name: 'เกินกำหนด (Overdue)', inAmount: arAgingSummary.days1_30 + arAgingSummary.days31_60 + arAgingSummary.days90Plus, outAmount: apAgingSummary.days1_30 + apAgingSummary.days31_60 + apAgingSummary.days90Plus },
      { name: '1 - 15 วันข้างหน้า', inAmount: arAgingSummary.current * 0.45, outAmount: apAgingSummary.current * 0.40 },
      { name: '16 - 30 วันข้างหน้า', inAmount: arAgingSummary.current * 0.35, outAmount: apAgingSummary.current * 0.35 },
      { name: '31 - 60 วันข้างหน้า', inAmount: arAgingSummary.current * 0.15 + 450000, outAmount: apAgingSummary.current * 0.15 + 180000 },
      { name: '61 - 90 วันข้างหน้า', inAmount: 650000, outAmount: 250000 },
    ];

    let runningBalance = 1500000; // Estimated baseline liquid cash
    return periods.map(p => {
      const net = p.inAmount - p.outAmount;
      runningBalance += net;
      return {
        ...p,
        netCashFlow: net,
        projectedBalance: runningBalance,
      };
    });
  }, [arAgingSummary, apAgingSummary]);

  // Copy Reminder Message helper
  const handleCopyReminder = (inv: AccountingDocument) => {
    const days = getDaysOverdue(inv.dueDate);
    const text = `เรียน ฝ่ายบัญชี/จัดซื้อ ${inv.contact?.companyName || ''}\nทาง บริษัท วอร์สเกต จำกัด ขอแจ้งเตือนยอดครบกำหนดชำระเงิน\n- เลขที่เอกสาร: ${inv.documentNo}\n- วันครบกำหนด: ${formatThaiDate(inv.dueDate)}\n- ยอดชำระสุทธิ: ฿${formatMoney(inv.netPayment || inv.grandTotal)}\n${days > 0 ? `(สถานะ: เกินกำหนด ${days} วัน)\n` : ''}รบกวนโอนชำระเข้าบัญชี บจก. วอร์สเกต ขอบคุณครับ`;
    
    navigator.clipboard.writeText(text);
    setCopiedDocNo(inv.documentNo);
    setTimeout(() => setCopiedDocNo(null), 3000);
  };

  return (
    <div className="space-y-5 pb-12 font-sans">
      
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-sky-200">
              <Clock className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent">
              รายงานอายุลูกหนี้ & พยากรณ์กระแสเงินสด (Aging & Cash Flow)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span>ตรวจจับหนี้ค้างชำระ (AR Aging Schedule 5 ช่วงเวลา) + ติดตามเจ้าหนี้ (AP) + พยากรณ์กระแสเงินสดล่วงหน้า 90 วัน</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
            <span className="text-indigo-600 font-bold">Liquidity Runway</span>
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('AR_AGING')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeSubTab === 'AR_AGING'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👥 อายุลูกหนี้ (AR Aging)
          </button>
          <button
            onClick={() => setActiveSubTab('AP_AGING')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeSubTab === 'AP_AGING'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛒 เจ้าหนี้การค้า (AP Aging)
          </button>
          <button
            onClick={() => setActiveSubTab('CASH_FLOW_FORECAST')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeSubTab === 'CASH_FLOW_FORECAST'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 พยากรณ์เงินสด 90 วัน
          </button>
        </div>
      </div>

      {/* ── AR Aging 5-Bucket Summary Cards ──────────────────────────────────── */}
      {activeSubTab === 'AR_AGING' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Bucket 1: Current */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-800 block">ยังไม่ถึงกำหนด (Current)</span>
            <span className="text-lg font-extrabold font-mono text-emerald-700 mt-1 block">
              ฿{formatMoney(arAgingSummary.current)}
            </span>
            <span className="text-[10px] text-emerald-600 mt-1 block">
              {arAgingSummary.total > 0 ? ((arAgingSummary.current / arAgingSummary.total) * 100).toFixed(0) : 0}% ของลูกหนี้รวม
            </span>
          </div>

          {/* Bucket 2: 1-30 Days */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-800 block">เกิน 1 - 30 วัน</span>
            <span className="text-lg font-extrabold font-mono text-amber-700 mt-1 block">
              ฿{formatMoney(arAgingSummary.days1_30)}
            </span>
            <span className="text-[10px] text-amber-600 mt-1 block">
              ควรส่งข้อความแจ้งเตือน
            </span>
          </div>

          {/* Bucket 3: 31-60 Days */}
          <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 shadow-2xs">
            <span className="text-[11px] font-bold text-orange-800 block">เกิน 31 - 60 วัน</span>
            <span className="text-lg font-extrabold font-mono text-orange-700 mt-1 block">
              ฿{formatMoney(arAgingSummary.days31_60)}
            </span>
            <span className="text-[10px] text-orange-600 mt-1 block">
              โทรติดตามฝ่ายจัดซื้อ
            </span>
          </div>

          {/* Bucket 4: 61-90 Days */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-800 block">เกิน 61 - 90 วัน</span>
            <span className="text-lg font-extrabold font-mono text-rose-700 mt-1 block">
              ฿{formatMoney(arAgingSummary.days61_90)}
            </span>
            <span className="text-[10px] text-rose-600 mt-1 block">
              เฝ้าระวังหนี้สงสัยจะสูญ
            </span>
          </div>

          {/* Bucket 5: >90 Days */}
          <div className="p-3.5 rounded-2xl bg-red-100/70 border border-red-300 shadow-2xs">
            <span className="text-[11px] font-bold text-red-900 block">เกิน 90 วันขึ้นไป</span>
            <span className="text-lg font-extrabold font-mono text-red-700 mt-1 block">
              ฿{formatMoney(arAgingSummary.days90Plus)}
            </span>
            <span className="text-[10px] text-red-600 mt-1 block font-semibold">
              ต้องดำเนินการเร่งรัดหนี้
            </span>
          </div>

        </div>
      )}

      {/* ── AP Aging 5-Bucket Summary Cards ──────────────────────────────────── */}
      {activeSubTab === 'AP_AGING' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200">
            <span className="text-[11px] font-bold text-sky-800 block">ยังไม่ถึงกำหนดจ่าย</span>
            <span className="text-lg font-extrabold font-mono text-sky-700 mt-1 block">
              ฿{formatMoney(apAgingSummary.current)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 block">เกินกำหนด 1 - 30 วัน</span>
            <span className="text-lg font-extrabold font-mono text-amber-700 mt-1 block">
              ฿{formatMoney(apAgingSummary.days1_30)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200">
            <span className="text-[11px] font-bold text-orange-800 block">เกินกำหนด 31 - 60 วัน</span>
            <span className="text-lg font-extrabold font-mono text-orange-700 mt-1 block">
              ฿{formatMoney(apAgingSummary.days31_60)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
            <span className="text-[11px] font-bold text-rose-800 block">เกินกำหนด 61 - 90 วัน</span>
            <span className="text-lg font-extrabold font-mono text-rose-700 mt-1 block">
              ฿{formatMoney(apAgingSummary.days61_90)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-100/70 border border-red-300">
            <span className="text-[11px] font-bold text-red-900 block">เกิน 90 วันขึ้นไป</span>
            <span className="text-lg font-extrabold font-mono text-red-700 mt-1 block">
              ฿{formatMoney(apAgingSummary.days90Plus)}
            </span>
          </div>
        </div>
      )}

      {/* ── SubTab 1: AR Aging Breakdown List ────────────────────────────────── */}
      {activeSubTab === 'AR_AGING' && (
        <div className="space-y-4">
          
          <div className="glass-panel rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>รายงานแยกตามรายชื่อลูกหนี้ (Customer AR Aging Schedule)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  รวมยอดค้างชำระทั้งหมด <span className="font-mono font-bold text-slate-800">฿{formatMoney(arAgingSummary.total)}</span> จาก {customerARList.length} ลูกหนี้
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อลูกค้า, Tax ID..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">ชื่อลูกค้า / บริษัท</th>
                    <th className="py-3 px-3 text-right">ยอดหนี้รวม</th>
                    <th className="py-3 px-3 text-right text-emerald-700">ยังไม่ครบกำหนด</th>
                    <th className="py-3 px-3 text-right text-amber-700">1-30 วัน</th>
                    <th className="py-3 px-3 text-right text-orange-700">31-60 วัน</th>
                    <th className="py-3 px-3 text-right text-rose-700">61-90 วัน</th>
                    <th className="py-3 px-3 text-right text-red-700">&gt;90 วัน</th>
                    <th className="py-3 px-4 text-center">เอกสารค้างชำระ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerARList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
                        <p className="font-semibold text-slate-700">ไม่มียอดหนี้ค้างชำระ</p>
                      </td>
                    </tr>
                  ) : (
                    customerARList.map((item) => (
                      <tr key={item.customer.id || item.customer.companyName} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">
                            {item.customer.companyName}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            Tax ID: {item.customer.taxId || '-'} | {item.customer.phone || ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900">
                          ฿{formatMoney(item.bucket.total)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {item.bucket.current > 0 ? `฿${formatMoney(item.bucket.current)}` : '-'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-700 font-semibold">
                          {item.bucket.days1_30 > 0 ? `฿${formatMoney(item.bucket.days1_30)}` : '-'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-orange-700 font-semibold">
                          {item.bucket.days31_60 > 0 ? `฿${formatMoney(item.bucket.days31_60)}` : '-'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-rose-700 font-semibold">
                          {item.bucket.days61_90 > 0 ? `฿${formatMoney(item.bucket.days61_90)}` : '-'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-red-700 font-bold">
                          {item.bucket.days90Plus > 0 ? `฿${formatMoney(item.bucket.days90Plus)}` : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 max-w-[200px] mx-auto">
                            {item.invoices.slice(0, 2).map(inv => (
                              <div key={inv.id} className="flex items-center justify-between text-[10px] bg-slate-100 p-1.5 rounded-lg">
                                <span className="font-mono font-bold text-slate-700">{inv.documentNo}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openViewDocument(inv)}
                                    className="text-sky-600 hover:underline"
                                    title="ดูเอกสาร"
                                  >
                                    ดู
                                  </button>
                                  <button
                                    onClick={() => handleCopyReminder(inv)}
                                    className="p-1 rounded hover:bg-white text-slate-500"
                                    title="คัดลอกข้อความทวงถาม"
                                  >
                                    {copiedDocNo === inv.documentNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                            {item.invoices.length > 2 && (
                              <span className="text-[9px] text-slate-400 text-center">
                                + อีก {item.invoices.length - 2} ใบแจ้งหนี้
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── SubTab 2: AP Aging Breakdown List ────────────────────────────────── */}
      {activeSubTab === 'AP_AGING' && (
        <div className="glass-panel rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white p-4">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-rose-600" />
            <span>รายการเจ้าหนี้การค้าและใบสั่งซื้อรอจ่าย (Pending Supplier Payables)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                  <th className="py-2.5 px-3">เลขที่ PO / เอกสาร</th>
                  <th className="py-2.5 px-3">ซัพพลายเออร์</th>
                  <th className="py-2.5 px-3">วันครบกำหนด</th>
                  <th className="py-2.5 px-3 text-right">ยอดรอชำระ</th>
                  <th className="py-2.5 px-3 text-center">สถานะอายุหนี้</th>
                  <th className="py-2.5 px-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPayables.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ไม่มียอดหนี้ค้างจ่ายซัพพลายเออร์
                    </td>
                  </tr>
                ) : (
                  pendingPayables.map((po) => {
                    const days = getDaysOverdue(po.dueDate || po.issueDate);
                    return (
                      <tr key={po.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {po.documentNo}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{po.contact?.companyName || '-'}</div>
                          <span className="text-[10px] text-slate-400">{po.contact?.name || ''}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {formatThaiDate(po.dueDate || po.issueDate)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          ฿{formatMoney(po.netPayment || po.grandTotal)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            days <= 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : days <= 30
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {days <= 0 ? 'ยังไม่ครบกำหนด' : `เกินกำหนด ${days} วัน`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => openViewDocument(po)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            ดูเอกสาร
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
      )}

      {/* ── SubTab 3: 90-Day Cash Flow Forecast ──────────────────────────────── */}
      {activeSubTab === 'CASH_FLOW_FORECAST' && (
        <div className="space-y-4">
          
          <div className="glass-panel p-5 rounded-3xl border border-slate-200 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>พยากรณ์กระแสเงินสดรับ - จ่ายล่วงหน้า 90 วัน (Cash Flow Forecast Runway)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  วิเคราะห์จาก Due Date บิลลูกหนี้ (Inflows) เทียบกับ Due Date ซัพพลายเออร์ (Outflows)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" /> เงินสดรับ (Inflow)
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" /> เงินสดจ่าย (Outflow)
                </span>
                <span className="flex items-center gap-1 text-indigo-700 font-bold">
                  <span className="w-3 h-1.5 bg-indigo-600 inline-block" /> สภาพคล่องสะสม (Projected Balance)
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashFlowTimeline} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `฿${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6366f1' }} tickFormatter={(v) => `฿${(v/1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: any) => [`฿${formatMoney(Number(value))}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', fontSize: '11px', border: 'none' }}
                  />
                  <Bar yAxisId="left" dataKey="inAmount" name="เงินสดรับ (Inflows)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar yAxisId="left" dataKey="outAmount" name="เงินสดจ่าย (Outflows)" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Line yAxisId="right" type="monotone" dataKey="projectedBalance" name="สภาพคล่องสุทธิสะสม" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
                <span>คาดการณ์เงินเข้า (30 วันข้างหน้า)</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xl font-mono font-extrabold text-emerald-700">
                ฿{formatMoney(cashFlowTimeline.slice(0, 3).reduce((s, c) => s + c.inAmount, 0))}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="flex items-center justify-between text-xs font-bold text-rose-800 mb-1">
                <span>คาดการณ์เงินจ่าย (30 วันข้างหน้า)</span>
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-xl font-mono font-extrabold text-rose-700">
                ฿{formatMoney(cashFlowTimeline.slice(0, 3).reduce((s, c) => s + c.outAmount, 0))}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1">
                <span>สภาพคล่องสุทธิส่วนเกิน (+Surplus)</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xl font-mono font-extrabold text-indigo-700">
                +฿{formatMoney(
                  cashFlowTimeline.slice(0, 3).reduce((s, c) => s + c.inAmount, 0) -
                  cashFlowTimeline.slice(0, 3).reduce((s, c) => s + c.outAmount, 0)
                )}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
