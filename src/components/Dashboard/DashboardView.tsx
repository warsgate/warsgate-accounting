import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Clock, 
  AlertCircle, FileText, Plus, ArrowUpRight, Eye, Printer, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { AccountingDocument, BankAccount, Contact } from '../../types';
import { formatMoney, getStatusBadge, formatThaiDate } from '../../utils/formatters';

interface DashboardViewProps {
  documents: AccountingDocument[];
  bankAccounts: BankAccount[];
  contacts: Contact[];
  setActiveTab: (tab: string) => void;
  openCreateModal: (type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'PURCHASE_ORDER') => void;
  openViewDocument: (doc: AccountingDocument) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents, bankAccounts, setActiveTab, openCreateModal, openViewDocument
}) => {
  // ── Dynamic calculations from actual documents ─────────────────────────────
  const totalRevenue = documents
    .filter(d => ['INVOICE', 'RECEIPT', 'TAX_INVOICE'].includes(d.type) && d.status !== 'CANCELLED')
    .reduce((sum, d) => sum + d.grandTotal, 0);

  const totalExpense = documents
    .filter(d => ['PURCHASE_ORDER', 'PURCHASE_INVOICE', 'PAYMENT_VOUCHER'].includes(d.type) && d.status !== 'CANCELLED')
    .reduce((sum, d) => sum + d.grandTotal, 0);

  // Cash In: Actual money received into bank accounts from PAID receipts (net after 3% WHT)
  const totalCashIn = documents
    .filter(d => ['RECEIPT', 'INVOICE', 'TAX_INVOICE'].includes(d.type) && d.status === 'PAID')
    .reduce((sum, d) => sum + (d.netPayment || d.grandTotal - (d.withholdingTaxTotal || 0)), 0);

  // Cash Out: Actual money paid out from PAID payment vouchers / purchase docs
  const totalCashOut = documents
    .filter(d => ['PAYMENT_VOUCHER', 'PURCHASE_INVOICE', 'PURCHASE_ORDER'].includes(d.type) && d.status === 'PAID')
    .reduce((sum, d) => sum + (d.netPayment || d.grandTotal - (d.withholdingTaxTotal || 0)), 0);

  const totalAR = documents
    .filter(d => d.type === 'INVOICE' && d.status === 'PENDING')
    .reduce((sum, d) => sum + d.grandTotal, 0);

  // Calculate actual dynamic balance per bank account
  const dynamicBankAccounts = bankAccounts.map(account => {
    const isMain = account.isDefault || account.bankName.includes('กสิกร');
    if (isMain) {
      const kbankCashIn = documents
        .filter(d => ['RECEIPT', 'INVOICE', 'TAX_INVOICE'].includes(d.type) && d.status === 'PAID' && (!d.bankAccount || d.bankAccount.includes('089-2-54321-9') || d.bankAccount.includes('KBANK') || d.bankAccount.includes('กสิกร')))
        .reduce((sum, d) => sum + (d.netPayment || d.grandTotal - (d.withholdingTaxTotal || 0)), 0);
      const kbankCashOut = documents
        .filter(d => ['PAYMENT_VOUCHER', 'PURCHASE_INVOICE', 'PURCHASE_ORDER'].includes(d.type) && d.status === 'PAID' && (!d.bankAccount || d.bankAccount.includes('089-2-54321-9') || d.bankAccount.includes('KBANK') || d.bankAccount.includes('กสิกร')))
        .reduce((sum, d) => sum + (d.netPayment || d.grandTotal - (d.withholdingTaxTotal || 0)), 0);
      const txCount = documents.filter(d => ['RECEIPT', 'INVOICE', 'TAX_INVOICE', 'PAYMENT_VOUCHER'].includes(d.type) && d.status === 'PAID').length;
      return {
        ...account,
        balance: account.balance + kbankCashIn - kbankCashOut,
        txCount
      };
    } else {
      const scbCashIn = documents
        .filter(d => ['RECEIPT', 'INVOICE', 'TAX_INVOICE'].includes(d.type) && d.status === 'PAID' && d.bankAccount && (d.bankAccount.includes('SCB') || d.bankAccount.includes('142-3-98765-4') || d.bankAccount.includes('ไทยพาณิชย์')))
        .reduce((sum, d) => sum + (d.netPayment || d.grandTotal - (d.withholdingTaxTotal || 0)), 0);
      const txCount = documents.filter(d => d.status === 'PAID' && d.bankAccount && (d.bankAccount.includes('SCB') || d.bankAccount.includes('142-3-98765-4'))).length;
      return {
        ...account,
        balance: account.balance + scbCashIn,
        txCount
      };
    }
  });

  const totalBankBalance = dynamicBankAccounts.reduce((sum, b) => sum + b.balance, 0);

  const kpiCards = [
    {
      label: 'เงินสด & เงินฝากธนาคารจริง (Cash Balance)',
      value: formatMoney(totalBankBalance),
      sub: `รับเข้าจริง ฿${formatMoney(totalCashIn)} / จ่าย ฿${formatMoney(totalCashOut)}`,
      subColor: 'text-emerald-700 font-bold',
      icon: Wallet,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-l-4 border-l-emerald-500'
    },
    {
      label: 'รายได้รวมสะสม (Total Sales)',
      value: formatMoney(totalRevenue),
      sub: `${documents.filter(d => ['INVOICE', 'RECEIPT', 'TAX_INVOICE'].includes(d.type)).length} รายการเอกสารขาย`,
      subColor: 'text-sky-700 font-bold',
      icon: TrendingUp,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      border: 'border-l-4 border-l-sky-500'
    },
    {
      label: 'รายจ่ายรวม (Total Expenses)',
      value: formatMoney(totalExpense),
      sub: `${documents.filter(d => ['PURCHASE_ORDER', 'PURCHASE_INVOICE', 'PAYMENT_VOUCHER'].includes(d.type)).length} รายการเอกสารซื้อ/จ่าย`,
      subColor: 'text-rose-700 font-bold',
      icon: TrendingDown,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      border: 'border-l-4 border-l-rose-500'
    },
    {
      label: 'ลูกหนี้ค้างรับ (AR)',
      value: formatMoney(totalAR),
      sub: totalAR > 0 ? 'รอดำเนินการเรียกเก็บ' : 'ไม่มีหนี้ค้างชำระ (ปิดครบ)',
      subColor: totalAR > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      border: 'border-l-4 border-l-amber-500'
    },
  ];

  const monthlyData = [
    { month: 'พ.ค. 68', revenue: 2173419, expense: 0 },
    { month: 'มิ.ย. 68', revenue: 652025.70, expense: 0 },
    { month: 'ก.ค. 68', revenue: 1304051.40, expense: 0 },
    { month: 'ส.ค. 68', revenue: 217341.90, expense: 0 },
  ];

  const categoryData = [
    { name: 'ซอฟต์แวร์ & Traceability', value: 2173419, color: '#e11d48' },
    { name: 'บริการวิศวกรรม & ติดตั้ง', value: 205000, color: '#0ea5e9' },
    { name: 'สัญญาบริการบำรุงรักษา', value: 120000, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-6 md:p-8 shadow-lg shadow-rose-100">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              WARSGATE ACCOUNTING SYSTEM — LIVE
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              ภาพรวมการเงิน & ผลประกอบการ
            </h1>
            <p className="text-sm text-rose-100 mt-1 max-w-xl">
              สรุปยอดรายรับ-รายจ่าย เงินเข้าบัญชีจริง และสถานะเอกสารแบบ Real-time ของ บริษัท วอร์สเกต จำกัด
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => openCreateModal('QUOTATION')}
              className="px-4 py-2.5 rounded-xl bg-white text-rose-600 font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-rose-50 transition active:scale-95">
              <Plus className="w-4 h-4" />
              <span>ออกใบเสนอราคา</span>
            </button>
            <button onClick={() => openCreateModal('INVOICE')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/30 flex items-center gap-2 transition">
              <FileText className="w-4 h-4" />
              <span>ออกใบแจ้งหนี้</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`glass-card glass-card-hover p-5 rounded-2xl ${card.border}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{card.value}</h3>
                <div className={`flex items-center gap-1.5 mt-2 text-[11px] font-medium ${card.subColor}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{card.sub}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Bank Accounts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue vs Expense Trend */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800">แนวโน้มรายรับ-รายจ่าย (Cash Flow Trend)</h2>
              <p className="text-xs text-slate-400">เปรียบเทียบผลดำเนินงานตามช่วงเวลาจริง</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600">รายรับ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                <span className="text-slate-500">รายจ่าย</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`฿${formatMoney(Number(value))}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Bank Accounts & Breakdown */}
        <div className="space-y-5">

          {/* Bank Balances based on actual cash in */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-rose-500" />
                <span>บัญชีธนาคาร (คำนวณตามเงินรับจริง)</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                ฿{formatMoney(totalBankBalance)}
              </span>
            </div>

            {dynamicBankAccounts.map(account => (
              <div key={account.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm ${
                    account.bankName.includes('กสิกร') ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}>
                    {account.bankName.includes('กสิกร') ? 'K' : 'S'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">{account.bankName}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{account.accountNo}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800 font-mono block">฿{formatMoney(account.balance)}</span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {account.txCount ? `รับเงินแล้ว ${account.txCount} รายการ` : 'พร้อมใช้งาน'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Breakdown Pie */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-slate-800">สัดส่วนรายได้แยกหมวด</h3>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }} formatter={(v: any) => [`฿${formatMoney(Number(v))}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-600 truncate max-w-[150px] text-[11px]">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-700 text-[11px] font-mono">฿{formatMoney(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">รายการเอกสารล่าสุด</h2>
            <p className="text-xs text-slate-400">ใบเสนอราคา, ใบแจ้งหนี้, ใบเสร็จรับเงิน</p>
          </div>
          <button onClick={() => setActiveTab('sales')} className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1">
            <span>ดูทั้งหมด ({documents.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">เลขที่เอกสาร</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">ลูกค้า / บริษัท</th>
                <th className="py-3 px-4">วันที่ออก</th>
                <th className="py-3 px-4 text-right">ยอดรวมสุทธิ</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.slice(0, 8).map((doc) => {
                const badge = getStatusBadge(doc.status);
                return (
                  <tr key={doc.id} className="hover:bg-rose-50/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                        {doc.type === 'QUOTATION' ? 'ใบเสนอราคา' : doc.type === 'INVOICE' ? 'ใบแจ้งหนี้' : doc.type === 'TAX_INVOICE' ? 'ใบกำกับภาษี' : 'ใบเสร็จรับเงิน'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{doc.contact?.companyName}</td>
                    <td className="py-3 px-4 text-slate-600">{formatThaiDate(doc.issueDate)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{formatMoney(doc.netPayment || doc.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => openViewDocument(doc)} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition shadow-sm">
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
