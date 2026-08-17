import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Clock, 
  AlertCircle, FileText, Plus, ArrowUpRight, Eye, Printer
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
  const totalRevenue = documents
    .filter(d => ['INVOICE', 'RECEIPT', 'TAX_INVOICE'].includes(d.type) && d.status !== 'CANCELLED')
    .reduce((sum, d) => sum + d.grandTotal, 0);

  const totalExpense = 453000.00;
  const netProfit = totalRevenue - totalExpense;
  const totalAR = documents.filter(d => d.type === 'INVOICE' && d.status === 'PENDING').reduce((sum, d) => sum + d.grandTotal, 0);
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.balance, 0);

  const monthlyData = [
    { month: 'ม.ค.', revenue: 1450000, expense: 920000 },
    { month: 'ก.พ.', revenue: 1680000, expense: 1050000 },
    { month: 'มี.ค.', revenue: 1200000, expense: 890000 },
    { month: 'เม.ย.', revenue: 1950000, expense: 1100000 },
    { month: 'พ.ค.', revenue: 2100000, expense: 1250000 },
    { month: 'มิ.ย.', revenue: 2400000, expense: 1380000 },
    { month: 'ก.ค.', revenue: totalRevenue > 0 ? totalRevenue : 2850000, expense: 1530000 },
  ];

  const categoryData = [
    { name: 'อุปกรณ์ Automation', value: 1850000, color: '#e11d48' },
    { name: 'บริการวิศวกรรม', value: 1420000, color: '#0ea5e9' },
    { name: 'สัญญาบำรุงรักษา', value: 580000, color: '#10b981' },
  ];

  const kpiCards = [
    { label: 'รายได้รวมสะสม (Revenue)', value: formatMoney(totalRevenue), sub: '+18.4% จากเดือนที่แล้ว', subColor: 'text-emerald-600', icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-l-4 border-l-emerald-400' },
    { label: 'รายจ่ายรวม (Expenses)', value: formatMoney(totalExpense), sub: 'ต้นทุนสินค้า & ค่าแรง', subColor: 'text-slate-400', icon: TrendingDown, iconBg: 'bg-rose-50', iconColor: 'text-rose-500', border: 'border-l-4 border-l-rose-400' },
    { label: 'กำไรสุทธิ (Net Profit)', value: formatMoney(netProfit), sub: 'อัตรากำไรสุทธิ ~38.5%', subColor: 'text-sky-600', icon: DollarSign, iconBg: 'bg-sky-50', iconColor: 'text-sky-600', border: 'border-l-4 border-l-sky-400' },
    { label: 'ลูกหนี้ค้างรับ (AR)', value: formatMoney(totalAR), sub: 'รอดำเนินการเรียกเก็บ', subColor: 'text-amber-600', icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', border: 'border-l-4 border-l-amber-400' },
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
              ระบบสรุปรายรับ-รายจ่าย ยอดค้างชำระ และกระแสเงินสดประจำเดือนของ บริษัท วอร์สเกต จำกัด
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue vs Expense Trend */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800">แนวโน้มรายรับ-รายจ่าย (Cash Flow Trend)</h2>
              <p className="text-xs text-slate-400">เปรียบเทียบผลดำเนินงานรายเดือน 2026</p>
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

        {/* Right Column */}
        <div className="space-y-5">

          {/* Bank Balances */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-rose-500" />
                <span>บัญชีธนาคาร</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {formatMoney(totalBankBalance)}
              </span>
            </div>
            {bankAccounts.map(account => (
              <div key={account.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                    {account.bankName.includes('กสิกร') ? 'K' : 'S'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">{account.bankName}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{account.accountNo}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800 font-mono block">{formatMoney(account.balance)}</span>
                  <span className="text-[10px] text-emerald-500 font-medium">พร้อมใช้</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Breakdown Pie */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-slate-800">สัดส่วนรายได้แยกหมวด</h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
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
                  <span className="font-bold text-slate-700 text-[11px]">{((cat.value / 3850000) * 100).toFixed(0)}%</span>
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
                <th className="py-3 px-4">ยอดรวมสุทธิ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const badge = getStatusBadge(doc.status);
                return (
                  <tr key={doc.id} className="hover:bg-rose-50/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                        {doc.type === 'QUOTATION' ? 'ใบเสนอราคา' : doc.type === 'INVOICE' ? 'ใบแจ้งหนี้' : 'ใบเสร็จรับเงิน'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{doc.contact.companyName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Tax ID: {doc.contact.taxId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatThaiDate(doc.issueDate)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatMoney(doc.grandTotal)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openViewDocument(doc)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-500 transition" title="ดูเอกสาร">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openViewDocument(doc)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition" title="พิมพ์ PDF">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
