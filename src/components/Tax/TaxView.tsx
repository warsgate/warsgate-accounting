import React, { useState } from 'react';
import { 
  Calculator, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  ShieldCheck, 
  Download, 
  Filter,
  Sparkles,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Clock,
  Coins,
  Cpu,
  GraduationCap,
  HeartHandshake,
  PackageX,
  UserCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { AccountingDocument } from '../../types';
import { formatMoney, formatThaiDate } from '../../utils/formatters';

interface TaxViewProps {
  documents: AccountingDocument[];
}

export const TaxView: React.FC<TaxViewProps> = ({ documents }) => {
  const [activeTab, setActiveTab] = useState<'TAX_PLANNING' | 'TAX_ALERTS' | 'PP30' | 'PND53' | 'PND3'>('TAX_PLANNING');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // ─── Tax Planning Interactive Strategy States (อิงจากงบประมาณการ 2569) ──────
  // 1. ลงทุนเครื่องจักร & ฮาร์ดแวร์ Automation (1.5x / Initial Allowance 40%)
  const [enableMachinery, setEnableMachinery] = useState<boolean>(true);
  const [machineryInvest, setMachineryInvest] = useState<number>(350000);

  // 2. ค่าวิจัย พัฒนา และนวัตกรรมซอฟต์แวร์ R&D (200% - หักได้ 2 เท่า)
  const [enableRnD, setEnableRnD] = useState<boolean>(true);
  const [rndCost, setRndCost] = useState<number>(400000);

  // 3. ค่าอบรมและสัมมนาทักษะวิศวกร (Training 200%)
  const [enableTraining, setEnableTraining] = useState<boolean>(true);
  const [trainingCost, setTrainingCost] = useState<number>(100000);

  // 4. สวัสดิการประกันสุขภาพกลุ่ม & กองทุนสำรองเลี้ยงชีพ (Provident Fund & Group Insurance)
  const [enableInsurance, setEnableInsurance] = useState<boolean>(true);
  const [insuranceCost, setInsuranceCost] = useState<number>(180000);

  // 5. ตัดจ่ายสินค้าคงคลังล้าสมัย / อะไหล่ชำรุด (Obsolete Inventory Write-off)
  const [enableStockScrap, setEnableStockScrap] = useState<boolean>(true);
  const [stockScrapCost, setStockScrapCost] = useState<number>(150000);

  // 6. บริหารค่าตอบแทนและเงินเดือนกรรมการ (Director Salary Optimization)
  const [enableDirectorSalary, setEnableDirectorSalary] = useState<boolean>(true);
  const [directorSalaryCost, setDirectorSalaryCost] = useState<number>(180000);

  // Filter documents by month if selected
  const filterByMonth = (docs: AccountingDocument[]) => {
    if (selectedMonth === 'ALL') return docs;
    return docs.filter(d => (d.issueDate || '').startsWith(selectedMonth));
  };

  // ── 1. ภาษีขาย (Output VAT) ────────────────────────────────────────────────
  const allSalesVatDocs = documents.filter(d =>
    ['RECEIPT', 'TAX_INVOICE'].includes(d.type) && d.status === 'PAID' && (d.vatAmount || 0) > 0
  );
  const salesVatDocs = filterByMonth(allSalesVatDocs);
  const totalSalesBase = salesVatDocs.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  const totalSalesVat = salesVatDocs.reduce((sum, d) => sum + (d.vatAmount || 0), 0);

  // ── 2. ภาษีซื้อ (Input VAT) ────────────────────────────────────────────────
  const allPurchaseVatDocs = documents.filter(d =>
    ['PURCHASE_INVOICE', 'PAYMENT_VOUCHER'].includes(d.type) && (d.vatAmount || 0) > 0
  );
  const purchaseVatDocs = filterByMonth(allPurchaseVatDocs);
  const totalPurchaseBase = purchaseVatDocs.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  const totalPurchaseVat = purchaseVatDocs.reduce((sum, d) => sum + (d.vatAmount || 0), 0);

  // ── 3. ภาษีมูลค่าเพิ่มสุทธิ ภ.พ. 30 ──────────────────────────────────────
  const netVatToPay = totalSalesVat - totalPurchaseVat;

  // ── 4. ภาษีหัก ณ ที่จ่าย ภ.ง.ด. 53 (นิติบุคคล) ───────────────────────────
  const allPnd53Docs = documents.filter(d =>
    ['PURCHASE_INVOICE', 'PAYMENT_VOUCHER', 'WHT_CERTIFICATE'].includes(d.type) &&
    (d.withholdingTaxTotal || 0) > 0 &&
    (d.contact?.companyName?.includes('บริษัท') || d.contact?.companyName?.includes('บจก') || d.contact?.companyName?.includes('หจก') || (d.contact?.taxId?.length === 13))
  );
  const pnd53Docs = filterByMonth(allPnd53Docs);
  const totalPnd53Payment = pnd53Docs.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  const totalPnd53Wht = pnd53Docs.reduce((sum, d) => sum + (d.withholdingTaxTotal || 0), 0);

  // ── 5. ภาษีหัก ณ ที่จ่าย ภ.ง.ด. 3 (บุคคลธรรมดา) ─────────────────────────
  const allPnd3Docs = documents.filter(d =>
    ['PURCHASE_INVOICE', 'PAYMENT_VOUCHER', 'WHT_CERTIFICATE'].includes(d.type) &&
    (d.withholdingTaxTotal || 0) > 0 &&
    !allPnd53Docs.some(p => p.id === d.id)
  );
  const pnd3Docs = filterByMonth(allPnd3Docs);
  const totalPnd3Payment = pnd3Docs.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  const totalPnd3Wht = pnd3Docs.reduce((sum, d) => sum + (d.withholdingTaxTotal || 0), 0);

  // ── 6. เครดิตภาษีถูกหัก ณ ที่จ่าย 3% จากลูกค้าทั้งระบบ (WHT Receivable) ────
  const totalWhtCreditFromCustomers = documents
    .filter(d => ['QUOTATION', 'INVOICE', 'RECEIPT'].includes(d.type))
    .reduce((sum, d) => sum + (d.withholdingTaxTotal || 0), 0) || 240492.70;

  // ─── ข้อมูลประมาณการ 2569 (จากงบกำไรขาดทุนจริง) ────────────────────────────
  const projectedRevenue = 8016423.30;
  const projectedCost = 5409015.03;
  const projectedAdminExpense = 307408.27;
  const baselineNetProfit = 2300000.00;

  // ฟังก์ชันคำนวณภาษีนิติบุคคลขั้นบันไดสำหรับ SME (กำไรสุทธิไม่เกิน 30 ล้าน, ทุนไม่เกิน 5 ล้าน)
  const calculateSmeTax = (profit: number) => {
    if (profit <= 0) return 0;
    let tax = 0;
    if (profit <= 300000) {
      tax = 0; // 0%
    } else if (profit <= 3000000) {
      tax = (profit - 300000) * 0.15; // 15%
    } else {
      tax = (2700000 * 0.15) + ((profit - 3000000) * 0.20); // 20%
    }
    return tax;
  };

  // ภาษีปกติก่อนวางแผน (Baseline)
  const baselineTaxYear = calculateSmeTax(baselineNetProfit); // 300,000.00
  const baselineTaxHalfYear = baselineTaxYear / 2; // 150,000.00

  // รวมสิทธิประโยชน์ทางภาษีที่ลดหย่อนได้เพิ่ม (Additional Tax Deductions)
  let totalAdditionalTaxDeductions = 0;
  if (enableMachinery) totalAdditionalTaxDeductions += machineryInvest * 0.5; // สิทธิประโยชน์เพิ่ม 50% - 100%
  if (enableRnD) totalAdditionalTaxDeductions += rndCost * 1.0; // สิทธิเพิ่มอีก 1 เท่า (รวม 200%)
  if (enableTraining) totalAdditionalTaxDeductions += trainingCost * 1.0; // สิทธิเพิ่มอีก 1 เท่า (รวม 200%)
  if (enableInsurance) totalAdditionalTaxDeductions += insuranceCost;
  if (enableStockScrap) totalAdditionalTaxDeductions += stockScrapCost;
  if (enableDirectorSalary) totalAdditionalTaxDeductions += directorSalaryCost;

  // กำไรสุทธิทางภาษีหลังวางแผน
  const optimizedNetProfit = Math.max(0, baselineNetProfit - totalAdditionalTaxDeductions);
  const optimizedTaxYear = calculateSmeTax(optimizedNetProfit);
  const optimizedTaxHalfYear = optimizedTaxYear / 2;
  const totalTaxSavings = baselineTaxYear - optimizedTaxYear;

  // ภาษีสุทธิที่ต้องจ่ายจริงหลังหักเครดิตภาษีหัก ณ ที่จ่าย 3%
  const netPayableBaseline = Math.max(0, baselineTaxYear - totalWhtCreditFromCustomers);
  const netPayableOptimized = Math.max(0, optimizedTaxYear - totalWhtCreditFromCustomers);
  const refundClaimable = optimizedTaxYear < totalWhtCreditFromCustomers ? totalWhtCreditFromCustomers - optimizedTaxYear : 0;

  // Extract available months from documents
  const availableMonths = Array.from(
    new Set(documents.map(d => (d.issueDate || '').slice(0, 7)).filter(m => m.length === 7))
  ).sort().reverse();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            <span>ศูนย์วางแผนลดหย่อนภาษี & รายงานสรรพากร (Tax Optimization & RD Center)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            วางแผนประหยัดภาษีเงินได้นิติบุคคล (ภ.ง.ด.50 / ภ.ง.ด.51) ให้เหลือน้อยที่สุดอย่างถูกต้องตามกฎหมาย และแจ้งเตือนกำหนดเวลาล่วงหน้า
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">🗓️ ทุกช่วงเวลา (ทั้งหมด)</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                🗓️ งวดประจำเดือน {m}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-100 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* ── Top Alert Banner (Smart Pre-Alerts) ─────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-sky-500/10 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                ⏰ แจ้งเตือนภาษีเร่งด่วน: ภ.ง.ด. 51 (ประมาณการครึ่งปี 2569) & ภ.พ. 30
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                สำคัญมาก
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              ยื่นแบบ ภ.ง.ด. 51 ภายใน <strong>31 ส.ค. 2569</strong> (ออนไลน์ถึง 8 ก.ย.) เพื่อป้องกันเบี้ยปรับ 20% จากการประมาณการขาดเกิน 25%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('TAX_PLANNING')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ดูแผนประหยัดภาษี</span>
          </button>
          <button
            onClick={() => setActiveTab('TAX_ALERTS')}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm transition flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>ปฏิทินภาษีทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* ── Tax Report Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('TAX_PLANNING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
            activeTab === 'TAX_PLANNING'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-200'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>🎯 วางแผนลดหย่อนภาษี & ภ.ง.ด.50/51 (Tax Optimization)</span>
        </button>

        <button
          onClick={() => setActiveTab('TAX_ALERTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'TAX_ALERTS'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-200'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>⏰ แจ้งเตือนภาษีล่วงหน้า & ปฏิทิน (Smart Alerts)</span>
        </button>

        <button
          onClick={() => setActiveTab('PP30')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'PP30'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>ภาษีมูลค่าเพิ่ม ภ.พ. 30 (VAT)</span>
        </button>

        <button
          onClick={() => setActiveTab('PND53')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'PND53'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>หัก ณ ที่จ่าย ภ.ง.ด. 53 (นิติบุคคล)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">{pnd53Docs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('PND3')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'PND3'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>หัก ณ ที่จ่าย ภ.ง.ด. 3 (บุคคลธรรมดา)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">{pnd3Docs.length}</span>
        </button>
      </div>

      {/* ── TAB 1: 🎯 วางแผนลดหย่อนภาษี & ภ.ง.ด.50/51 (Tax Optimization) ──── */}
      {activeTab === 'TAX_PLANNING' && (
        <div className="space-y-6">

          {/* Top Comparison KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Projected Net Profit */}
            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-sky-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">กำไรสุทธิก่อนวางแผน</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
                  งบ 2569
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1.5">{formatMoney(baselineNetProfit)}</h3>
              <span className="text-[11px] text-slate-400 block mt-1">
                รายได้ ฿8.01M - ต้นทุน/ค่าใช้จ่าย ฿5.71M
              </span>
            </div>

            {/* Optimized Net Profit */}
            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-500 bg-teal-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800">กำไรสุทธิหลังวางแผนภาษี</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-300">
                  ลดหย่อน ฿{formatMoney(totalAdditionalTaxDeductions)}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-teal-700 font-mono mt-1.5">{formatMoney(optimizedNetProfit)}</h3>
              <span className="text-[11px] text-teal-600 block mt-1">
                ฐานภาษีลดลง <strong>{((totalAdditionalTaxDeductions / baselineNetProfit) * 100).toFixed(1)}%</strong>
              </span>
            </div>

            {/* Total Tax Savings */}
            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500 bg-emerald-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">💰 ประหยัดภาษีนิติบุคคล</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  ลดลง {((totalTaxSavings / (baselineTaxYear || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-emerald-700 font-mono mt-1.5">฿{formatMoney(totalTaxSavings)}</h3>
              <span className="text-[11px] text-emerald-600 block mt-1">
                จากเดิมต้องจ่าย ฿{formatMoney(baselineTaxYear)} เหลือ ฿{formatMoney(optimizedTaxYear)}
              </span>
            </div>

            {/* Actual Cash Outflow / Refund */}
            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 bg-amber-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {refundClaimable > 0 ? '✨ ยอดขอคืนภาษี (Refund)' : 'ภาษีสุทธิที่ต้องจ่ายจริง'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  เครดิต 3%: ฿{formatMoney(totalWhtCreditFromCustomers)}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-amber-800 font-mono mt-1.5">
                {refundClaimable > 0 ? `+฿${formatMoney(refundClaimable)}` : `฿${formatMoney(netPayableOptimized)}`}
              </h3>
              <span className="text-[11px] text-amber-700 block mt-1">
                {refundClaimable > 0 ? '🎉 ไม่ต้องจ่ายภาษีเพิ่มสิ้นปี (ขอคืนได้)' : 'หลังหักเครดิตภาษีหัก ณ ที่จ่าย 3%'}
              </span>
            </div>
          </div>

          {/* ── Interactive Tax Deduction Strategies Panel ─────────────────────── */}
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>กลยุทธ์ลดหย่อนภาษีนิติบุคคลที่ถูกต้องตามกฎหมายสรรพากร 100% (Legal SME Tax Strategies)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  เลือกเปิด/ปิด หรือปรับตัวเลขประมาณการ เพื่อจำลองการลดหย่อนภาษีและดูผลลัพธ์แบบ Real-time
                </p>
              </div>
              <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                รวมสิทธิลดหย่อนเพิ่ม: ฿{formatMoney(totalAdditionalTaxDeductions)}
              </div>
            </div>

            {/* Strategies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* 1. ลงทุนเครื่องจักร & Automation Hardware */}
              <div className={`p-4 rounded-2xl border transition ${enableMachinery ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">1. ลงทุนเครื่องจักร & Hardware (1.5x)</h4>
                      <span className="text-[10px] text-emerald-600 font-semibold">หักค่าเสื่อมเร่ง 40% วันแรก + สิทธิพิเศษ</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableMachinery}
                    onChange={e => setEnableMachinery(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                  ลงทุนอุปกรณ์ทดสอบ, PLC, Server, เครื่องจักรเพื่อโครงการ Automation หักค่าเสื่อมราคาเบื้องต้น 40% ทันที
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ยอดลงทุน:</span>
                  <input
                    type="number"
                    disabled={!enableMachinery}
                    value={machineryInvest}
                    onChange={e => setMachineryInvest(Number(e.target.value))}
                    className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="text-right text-[10px] text-emerald-600 font-bold mt-1">
                  ลดฐานภาษีเพิ่ม: ฿{formatMoney(enableMachinery ? machineryInvest * 0.5 : 0)}
                </div>
              </div>

              {/* 2. วิจัย พัฒนา และนวัตกรรมซอฟต์แวร์ R&D 200% */}
              <div className={`p-4 rounded-2xl border transition ${enableRnD ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">2. นวัตกรรมซอฟต์แวร์ R&D (200%)</h4>
                      <span className="text-[10px] text-sky-600 font-semibold">หักรายจ่ายได้ 2 เท่า (200% Deduction)</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableRnD}
                    onChange={e => setEnableRnD(e.target.checked)}
                    className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                  ค่าจ้างพัฒนาซอฟต์แวร์ Traceability / PLC Framework / AI ตรวจจับชิ้นงาน ลงทะเบียนสิทธิประโยชน์ R&D สวทช.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ค่าใช้จ่าย R&D:</span>
                  <input
                    type="number"
                    disabled={!enableRnD}
                    value={rndCost}
                    onChange={e => setRndCost(Number(e.target.value))}
                    className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="text-right text-[10px] text-sky-600 font-bold mt-1">
                  หักภาษีเพิ่มได้อีก 1 เท่า: ฿{formatMoney(enableRnD ? rndCost : 0)}
                </div>
              </div>

              {/* 3. อบรมและสัมมนาทักษะวิศวกร 200% */}
              <div className={`p-4 rounded-2xl border transition ${enableTraining ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">3. อบรมทักษะวิศวกร (200%)</h4>
                      <span className="text-[10px] text-indigo-600 font-semibold">ส่งอบรมวิชาชีพ/เทคนิค หักได้ 2 เท่า</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableTraining}
                    onChange={e => setEnableTraining(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                  ส่งทีมช่างและวิศวกรอบรมหลักสูตร Automation, Siemens PLC, มาตรฐานความปลอดภัย ISO/ความปลอดภัยโรงงาน
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ค่าจัดอบรม:</span>
                  <input
                    type="number"
                    disabled={!enableTraining}
                    value={trainingCost}
                    onChange={e => setTrainingCost(Number(e.target.value))}
                    className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="text-right text-[10px] text-indigo-600 font-bold mt-1">
                  หักภาษีเพิ่มได้อีก 1 เท่า: ฿{formatMoney(enableTraining ? trainingCost : 0)}
                </div>
              </div>

              {/* 4. สวัสดิการประกันสุขภาพกลุ่ม & กองทุนสำรองเลี้ยงชีพ */}
              <div className={`p-4 rounded-2xl border transition ${enableInsurance ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">4. ประกันกลุ่ม & กองทุนสำรอง</h4>
                      <span className="text-[10px] text-rose-600 font-semibold">หักรายจ่ายบริษัท 100% ปลอดภาษี</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableInsurance}
                    onChange={e => setEnableInsurance(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                  ทำประกันชีวิต/สุขภาพกลุ่มให้ผู้บริหารและพนักงานทุกคนอย่างเท่าเทียม หักเป็นรายจ่ายบริษัทได้เต็มจำนวน
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">เบี้ยประกัน/กองทุน:</span>
                  <input
                    type="number"
                    disabled={!enableInsurance}
                    value={insuranceCost}
                    onChange={e => setInsuranceCost(Number(e.target.value))}
                    className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div className="text-right text-[10px] text-rose-600 font-bold mt-1">
                  หักเป็นรายจ่ายได้: ฿{formatMoney(enableInsurance ? insuranceCost : 0)}
                </div>
              </div>

              {/* 5. ตัดจ่ายสินค้าคงคลังล้าสมัย / อะไหล่ชำรุด */}
              <div className={`p-4 rounded-2xl border transition ${enableStockScrap ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <PackageX className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">5. ตัดสต็อกชำรุด/ล้าสมัย</h4>
                      <span className="text-[10px] text-amber-600 font-semibold">Write-off ตามระเบียบสรรพากร</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableStockScrap}
                    onChange={e => setEnableStockScrap(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                  ตรวจนับอะไหล่ PLC หรือสายไฟที่ชำรุด/ตกรุ่น ทำลายตามระเบียบพร้อมผู้สอบบัญชี หักเป็นรายจ่ายได้ทันที
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">มูลค่าตัดจำหน่าย:</span>
                  <input
                    type="number"
                    disabled={!enableStockScrap}
                    value={stockScrapCost}
                    onChange={e => setStockScrapCost(Number(e.target.value))}
                    className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="text-right text-[10px] text-amber-600 font-bold mt-1">
                  หักเป็นรายจ่ายได้: ฿{formatMoney(enableStockScrap ? stockScrapCost : 0)}
                </div>
              </div>

              {/* 6. จัดสรรเงินเดือนและค่าตอบแทนกรรมการ */}
              <div className={`p-4 rounded-2xl border transition ${enableDirectorSalary ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">6. บริหารเงินเดือนกรรมการ</h4>
                      <span className="text-[10px] text-teal-600 font-semibold">เกลี่ยฐานภาษีบุคคล (0-5%)</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDirectorSalary}
                    onChange={e => setEnableDirectorSalary(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                  ตั้งเงินเดือนกรรมการหรือค่าตอบแทนการเป็นที่ปรึกษาทางเทคนิค เพื่อเกลี่ยฐานภาษีจากนิติบุคคล (15-20%) ไปยังบุคคลธรรมดาขั้นต่ำ
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">เงินเดือน/โบนัสเพิ่ม:</span>
                  <input
                    type="number"
                    disabled={!enableDirectorSalary}
                    value={directorSalaryCost}
                    onChange={e => setDirectorSalaryCost(Number(e.target.value))}
                    className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div className="text-right text-[10px] text-teal-600 font-bold mt-1">
                  หักรายจ่ายบริษัทได้: ฿{formatMoney(enableDirectorSalary ? directorSalaryCost : 0)}
                </div>
              </div>

            </div>
          </div>

          {/* ── Step-by-Step Tax Calculation Comparison Table (ภ.ง.ด. 50 & 51) ─── */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <span>ตารางเปรียบเทียบการคำนวณภาษีเงินได้นิติบุคคล (ก่อน vs หลังวางแผนภาษี)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  อัตราภาษีเงินได้นิติบุคคลสำหรับ SMEs: กำไร 0-300K (0%), 300K-3M (15%), เกิน 3M (20%)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                ประหยัดภาษีทั้งสิ้น ฿{formatMoney(totalTaxSavings)}
              </span>
            </div>

            <div className="table-scroll max-h-[620px] rounded-2xl border border-slate-200 shadow-inner">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-700 font-semibold border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="py-3 px-4">รายการคำนวณภาษี (Tax Item)</th>
                    <th className="py-3 px-4 text-right">งบประมาณการเดิม (Baseline)</th>
                    <th className="py-3 px-4 text-right text-emerald-700 bg-emerald-50/50">หลังวางแผนภาษี (Optimized)</th>
                    <th className="py-3 px-4 text-right">ผลต่างที่ประหยัดได้ (Savings)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">รายได้จากการขายและบริการทั้งปี (Total Revenue)</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">฿{formatMoney(projectedRevenue)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 bg-emerald-50/30">฿{formatMoney(projectedRevenue)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">หัก: ต้นทุนขายและบริการ (COGS)</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">-฿{formatMoney(projectedCost)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 bg-emerald-50/30">-฿{formatMoney(projectedCost)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">หัก: ค่าใช้จ่ายในการบริหารเดิม (Admin Expenses)</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">-฿{formatMoney(projectedAdminExpense)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 bg-emerald-50/30">-฿{formatMoney(projectedAdminExpense)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                  <tr className="bg-emerald-50/20 font-bold">
                    <td className="py-3 px-4 text-emerald-800">หัก: สิทธิประโยชน์และรายจ่ายทางภาษีเพิ่ม (Tax Deductions)</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">฿0.00</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 bg-emerald-50/50">-฿{formatMoney(totalAdditionalTaxDeductions)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">+฿{formatMoney(totalAdditionalTaxDeductions)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td className="py-3.5 px-4 text-slate-900">กำไรสุทธิทางภาษี (Taxable Net Profit)</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 text-sm">฿{formatMoney(baselineNetProfit)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 bg-emerald-100/50 text-sm">฿{formatMoney(optimizedNetProfit)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 text-sm">-฿{formatMoney(baselineNetProfit - optimizedNetProfit)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-600 pl-8">↳ ขั้นที่ 1: กำไร 0 - 300,000 (อัตรา 0%)</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">฿0.00</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 bg-emerald-50/30">฿0.00</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-600 pl-8">↳ ขั้นที่ 2: กำไรส่วนที่เกิน 300,000 ถึง 3,000,000 (อัตรา 15%)</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">฿{formatMoney(baselineTaxYear)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold bg-emerald-50/30">฿{formatMoney(optimizedTaxYear)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">-฿{formatMoney(totalTaxSavings)}</td>
                  </tr>
                  <tr className="bg-amber-50/40 font-bold border-t border-amber-200">
                    <td className="py-3.5 px-4 text-amber-900">รวมภาษีเงินได้นิติบุคคลทั้งปี (ภ.ง.ด. 50 คำนวณได้)</td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-600 text-sm">฿{formatMoney(baselineTaxYear)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 bg-emerald-100/70 text-sm">฿{formatMoney(optimizedTaxYear)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 text-sm">ประหยัด ฿{formatMoney(totalTaxSavings)}</td>
                  </tr>
                  <tr className="bg-amber-100/50 font-bold">
                    <td className="py-3 px-4 text-amber-900">📅 ภาษีครึ่งปีที่ต้องชำระ (ภ.ง.ด. 51 = ภาษีทั้งปี ÷ 2)</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-700">฿{formatMoney(baselineTaxHalfYear)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 bg-emerald-100/80">฿{formatMoney(optimizedTaxHalfYear)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">ประหยัด ฿{formatMoney(baselineTaxHalfYear - optimizedTaxHalfYear)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700 font-semibold">หัก: เครดิตภาษีถูกหัก ณ ที่จ่าย 3% สะสมทั้งปี (WHT Credit)</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">-฿{formatMoney(totalWhtCreditFromCustomers)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 bg-emerald-50/30">-฿{formatMoney(totalWhtCreditFromCustomers)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">เครดิตจากลูกค้า</td>
                  </tr>
                  <tr className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 font-bold border-t-2 border-emerald-500">
                    <td className="py-4 px-4 text-slate-900 text-sm">
                      💰 ภาษีสุทธิที่ต้องชำระจริงสิ้นปี (หรือขอคืนภาษี)
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-rose-700 text-sm">
                      ฿{formatMoney(netPayableBaseline)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-700 bg-emerald-200/50 text-base font-extrabold">
                      {refundClaimable > 0 ? `ขอคืนได้ ฿${formatMoney(refundClaimable)}` : `฿${formatMoney(netPayableOptimized)}`}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-600 text-sm font-bold">
                      {refundClaimable > 0 ? '🎉 ไม่ต้องจ่ายภาษีเพิ่ม' : `ลดลง ฿${formatMoney(netPayableBaseline - netPayableOptimized)}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: ⏰ แจ้งเตือนภาษีล่วงหน้า & ปฏิทิน (Smart Alerts) ──────────── */}
      {activeTab === 'TAX_ALERTS' && (
        <div className="space-y-6">

          {/* Alert Cards Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Alert 1: ภ.ง.ด. 51 */}
            <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-rose-500 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ภาษีเงินได้นิติบุคคลครึ่งปี (ภ.ง.ด. 51)</h3>
                    <span className="text-[10px] text-rose-600 font-semibold">รอบระยะเวลาบัญชีครึ่งปี 2569</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold animate-pulse">
                  ยื่นภายใน 31 ส.ค. 2569
                </span>
              </div>

              <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-rose-600" />
                  <span>ข้อควรระวัง: กฎประมาณการขาดเกิน 25% (มาตรา 67 ตรี)</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  หากประมาณการกำไรสุทธิขาดไปเกินกว่า 25% ของกำไรสุทธิตลอดปีจริงโดยไม่มีเหตุอันสมควร จะต้องเสีย<strong>เงินเพิ่มอีก 20%</strong> ของจำนวนภาษีที่ขาด
                </p>
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-600">ประมาณการภาษีครึ่งปี (วางแผนแล้ว):</span>
                  <strong className="text-emerald-700 text-sm">฿{formatMoney(optimizedTaxHalfYear)}</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>📅 <strong>กำหนดยื่นแบบกระดาษ:</strong> ภายใน 31 สิงหาคม 2569</div>
                <div>🌐 <strong>กำหนดยื่นออนไลน์ (e-Filing):</strong> ภายใน 8 กันยายน 2569</div>
              </div>
            </div>

            {/* Alert 2: ภ.พ. 30 (VAT) */}
            <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-amber-500 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ภาษีมูลค่าเพิ่มรายเดือน (ภ.พ. 30)</h3>
                    <span className="text-[10px] text-amber-700 font-semibold">สรุปภาษีขาย vs ภาษีซื้อ</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  ยื่นทุกวันที่ 15 ของเดือน
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">ภาษีขายรวมสะสม (Output VAT):</span>
                  <strong className="font-mono text-rose-600">฿{formatMoney(totalSalesVat)}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">ภาษีซื้อรวมสะสม (Input VAT):</span>
                  <strong className="font-mono text-emerald-600">฿{formatMoney(totalPurchaseVat)}</strong>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">ภาษีมูลค่าเพิ่มสุทธิ ({netVatToPay >= 0 ? 'ต้องนำส่ง' : 'ขอคืน'}):</span>
                  <span className={`font-mono text-sm ${netVatToPay >= 0 ? 'text-amber-800' : 'text-sky-700'}`}>
                    ฿{formatMoney(Math.abs(netVatToPay))}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>📅 <strong>กำหนดยื่นแบบกระดาษ:</strong> วันที่ 15 ของเดือนถัดไป</div>
                <div>🌐 <strong>กำหนดยื่นออนไลน์ (e-Filing):</strong> วันที่ 23 ของเดือนถัดไป</div>
              </div>
            </div>

            {/* Alert 3: ภ.ง.ด. 53 & ภ.ง.ด. 3 */}
            <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-sky-500 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ภาษีหัก ณ ที่จ่าย (ภ.ง.ด. 3 / 53)</h3>
                    <span className="text-[10px] text-sky-600 font-semibold">นำส่งภาษีที่หักจากคู่ค้า/ผู้รับจ้าง</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                  ยื่นทุกวันที่ 7 ของเดือน
                </span>
              </div>

              <div className="p-3.5 bg-sky-50/50 border border-sky-200 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">ภ.ง.ด. 53 (นิติบุคคล):</span>
                  <strong className="font-mono text-sky-800">฿{formatMoney(totalPnd53Wht)} ({pnd53Docs.length} รายการ)</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">ภ.ง.ด. 3 (บุคคลธรรมดา):</span>
                  <strong className="font-mono text-sky-800">฿{formatMoney(totalPnd3Wht)} ({pnd3Docs.length} รายการ)</strong>
                </div>
                <div className="pt-2 border-t border-sky-200 flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>รวมภาษีหัก ณ ที่จ่ายต้องนำส่ง:</span>
                  <span className="font-mono text-sm text-sky-700">฿{formatMoney(totalPnd53Wht + totalPnd3Wht)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>📅 <strong>กำหนดยื่นแบบกระดาษ:</strong> วันที่ 7 ของเดือนถัดไป</div>
                <div>🌐 <strong>กำหนดยื่นออนไลน์ (e-Filing):</strong> วันที่ 15 ของเดือนถัดไป</div>
              </div>
            </div>

            {/* Alert 4: ภ.ง.ด. 50 (ภาษีสิ้นปี) */}
            <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-indigo-500 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ภาษีเงินได้นิติบุคคลสิ้นปี (ภ.ง.ด. 50)</h3>
                    <span className="text-[10px] text-indigo-600 font-semibold">ปิดงบการเงินประจำปี 2569</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  ยื่นภายใน 31 พ.ค. 2570
                </span>
              </div>

              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">ภาษีนิติบุคคลทั้งปี (วางแผนแล้ว):</span>
                  <strong className="font-mono text-emerald-700">฿{formatMoney(optimizedTaxYear)}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">หัก: เครดิต 3% จากลูกค้า:</span>
                  <strong className="font-mono text-indigo-700">-฿{formatMoney(totalWhtCreditFromCustomers)}</strong>
                </div>
                <div className="pt-2 border-t border-indigo-200 flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>ผลลัพธ์ภาษีสุทธิ:</span>
                  <span className="font-mono text-sm text-emerald-700">
                    {refundClaimable > 0 ? `ขอคืนได้ ฿${formatMoney(refundClaimable)}` : `ชำระ ฿${formatMoney(netPayableOptimized)}`}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>📅 <strong>กำหนดยื่นแบบ:</strong> ภายใน 150 วันนับแต่วันสุดท้ายของรอบบัญชี (31 พฤษภาคม 2570)</div>
                <div>📑 <strong>สิ่งที่ต้องเตรียม:</strong> งบการเงินผ่านการตรวจสอบโดยผู้สอบบัญชีรับอนุญาต (CPA)</div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── TAB 3: ภ.พ. 30 (รายงานภาษีขาย & รายงานภาษีซื้อ) ───────────────── */}
      {activeTab === 'PP30' && (
        <div className="space-y-6">

          {/* Output VAT Table */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h2 className="text-base font-bold text-slate-800">
                  รายงานภาษีขาย (Output VAT Register)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  เกณฑ์เงินสด / ใบเสร็จรับเงิน (Cash Basis)
                </span>
              </div>
              <div className="text-xs font-mono text-slate-500">
                รวมภาษีขาย: <strong className="text-rose-600 font-bold">{formatMoney(totalSalesVat)}</strong>
              </div>
            </div>

            <div className="table-scroll max-h-[500px] rounded-2xl border border-slate-200 shadow-inner">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="py-3 px-4">ลำดับ</th>
                    <th className="py-3 px-4">วันที่ออก</th>
                    <th className="py-3 px-4">เลขที่ใบกำกับภาษี</th>
                    <th className="py-3 px-4">ชื่อผู้ซื้อสินค้า / บริการ</th>
                    <th className="py-3 px-4">เลขประจำตัวผู้เสียภาษี</th>
                    <th className="py-3 px-4">สถานประกอบการ</th>
                    <th className="py-3 px-4 text-right">มูลค่าสินค้าก่อน VAT</th>
                    <th className="py-3 px-4 text-right">ภาษีขาย (7%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {salesVatDocs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        ไม่พบรายการภาษีขายในงวดที่เลือก
                      </td>
                    </tr>
                  ) : (
                    salesVatDocs.map((doc, idx) => (
                      <tr key={doc.id} className="hover:bg-rose-50/30 transition">
                        <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 text-slate-600">{formatThaiDate(doc.issueDate)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{doc.contact?.companyName || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{doc.contact?.taxId || '-'}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {doc.contact?.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${doc.contact?.branchCode || '00000'}`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                          {formatMoney(doc.subtotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {formatMoney(doc.vatAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {salesVatDocs.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10 bg-slate-100/95 backdrop-blur-sm font-bold border-t-2 border-slate-200 shadow-sm">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-right">ยอดรวมภาษีขายทั้งสิ้น:</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">{formatMoney(totalSalesBase)}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">{formatMoney(totalSalesVat)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Input VAT Table */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-base font-bold text-slate-800">
                  รายงานภาษีซื้อ (Input VAT Register)
                </h2>
              </div>
              <div className="text-xs font-mono text-slate-500">
                รวมภาษีซื้อ: <strong className="text-emerald-600 font-bold">{formatMoney(totalPurchaseVat)}</strong>
              </div>
            </div>

            <div className="table-scroll max-h-[500px] rounded-2xl border border-slate-200 shadow-inner">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="py-3 px-4">ลำดับ</th>
                    <th className="py-3 px-4">วันที่สั่ง/ใบกำกับ</th>
                    <th className="py-3 px-4">เลขที่เอกสาร / PO</th>
                    <th className="py-3 px-4">ชื่อผู้ขายสินค้า / บริการ</th>
                    <th className="py-3 px-4">เลขประจำตัวผู้เสียภาษี</th>
                    <th className="py-3 px-4">สถานประกอบการ</th>
                    <th className="py-3 px-4 text-right">มูลค่าสินค้าก่อน VAT</th>
                    <th className="py-3 px-4 text-right">ภาษีซื้อ (7%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {purchaseVatDocs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        ไม่พบรายการภาษีซื้อในงวดที่เลือก
                      </td>
                    </tr>
                  ) : (
                    purchaseVatDocs.map((doc, idx) => (
                      <tr key={doc.id} className="hover:bg-emerald-50/30 transition">
                        <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 text-slate-600">{formatThaiDate(doc.issueDate)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{doc.contact?.companyName || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{doc.contact?.taxId || '-'}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {doc.contact?.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${doc.contact?.branchCode || '00000'}`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                          {formatMoney(doc.subtotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {formatMoney(doc.vatAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {purchaseVatDocs.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10 bg-slate-100/95 backdrop-blur-sm font-bold border-t-2 border-slate-200 shadow-sm">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-right">ยอดรวมภาษีซื้อทั้งสิ้น:</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">{formatMoney(totalPurchaseBase)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">{formatMoney(totalPurchaseVat)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: ภ.ง.ด. 53 (ภาษีหัก ณ ที่จ่าย นิติบุคคล) ─────────────────── */}
      {activeTab === 'PND53' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>รายการนำส่งภาษีหัก ณ ที่จ่าย แบบ ภ.ง.ด. 53 (นิติบุคคล)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ภาษีที่บริษัทหักไว้จากการจ่ายเงินให้คู่ค้าที่เป็นนิติบุคคล / บริษัทจำกัด / ห้างหุ้นส่วน
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-slate-600">รวมภาษีหักนำส่ง: </span>
              <strong className="text-amber-700 font-bold">{formatMoney(totalPnd53Wht)}</strong>
            </div>
          </div>

          <div className="table-scroll max-h-[500px] rounded-2xl border border-slate-200 shadow-inner">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="py-3 px-4">ลำดับ</th>
                  <th className="py-3 px-4">วันที่จ่าย</th>
                  <th className="py-3 px-4">เลขที่เอกสาร</th>
                  <th className="py-3 px-4">ชื่อผู้รับเงิน (นิติบุคคล)</th>
                  <th className="py-3 px-4">เลขประจำตัว 13 หลัก</th>
                  <th className="py-3 px-4">ประเภทเงินได้</th>
                  <th className="py-3 px-4 text-right">จำนวนเงินที่จ่าย</th>
                  <th className="py-3 px-4 text-center">อัตรา %</th>
                  <th className="py-3 px-4 text-right">ภาษีที่หักและนำส่ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pnd53Docs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      ไม่พบรายการภาษีหัก ณ ที่จ่าย ภ.ง.ด.53 ในงวดนี้
                    </td>
                  </tr>
                ) : (
                  pnd53Docs.map((doc, idx) => {
                    const avgRate = doc.subtotal > 0 ? ((doc.withholdingTaxTotal / doc.subtotal) * 100).toFixed(0) : '3';
                    return (
                      <tr key={doc.id} className="hover:bg-amber-50/30 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 text-slate-600">{formatThaiDate(doc.issueDate)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{doc.contact?.companyName || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{doc.contact?.taxId || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {doc.items.map(i => i.name).join(', ') || 'ค่าบริการ / จ้างทำของ'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{formatMoney(doc.subtotal)}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">{avgRate}%</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                          {formatMoney(doc.withholdingTaxTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {pnd53Docs.length > 0 && (
                <tfoot className="sticky bottom-0 z-10 bg-slate-100/95 backdrop-blur-sm font-bold border-t-2 border-slate-200 shadow-sm">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right">ยอดรวม ภ.ง.ด. 53 ทั้งสิ้น:</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">{formatMoney(totalPnd53Payment)}</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">{formatMoney(totalPnd53Wht)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: ภ.ง.ด. 3 (ภาษีหัก ณ ที่จ่าย บุคคลธรรมดา) ────────────────── */}
      {activeTab === 'PND3' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-500" />
                <span>รายการนำส่งภาษีหัก ณ ที่จ่าย แบบ ภ.ง.ด. 3 (บุคคลธรรมดา)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ภาษีที่บริษัทหักไว้จากการจ่ายค่าจ้าง/ค่าบริการให้แก่บุคคลธรรมดา
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200">
              <span className="text-slate-600">รวมภาษีหักนำส่ง: </span>
              <strong className="text-sky-700 font-bold">{formatMoney(totalPnd3Wht)}</strong>
            </div>
          </div>

          <div className="table-scroll max-h-[500px] rounded-2xl border border-slate-200 shadow-inner">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="py-3 px-4">ลำดับ</th>
                  <th className="py-3 px-4">วันที่จ่าย</th>
                  <th className="py-3 px-4">เลขที่เอกสาร</th>
                  <th className="py-3 px-4">ชื่อผู้รับเงิน (บุคคลธรรมดา)</th>
                  <th className="py-3 px-4">เลขบัตรประชาชน 13 หลัก</th>
                  <th className="py-3 px-4">ประเภทเงินได้</th>
                  <th className="py-3 px-4 text-right">จำนวนเงินที่จ่าย</th>
                  <th className="py-3 px-4 text-center">อัตรา %</th>
                  <th className="py-3 px-4 text-right">ภาษีที่หักและนำส่ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pnd3Docs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      ไม่พบรายการภาษีหัก ณ ที่จ่าย ภ.ง.ด.3 ในงวดนี้
                    </td>
                  </tr>
                ) : (
                  pnd3Docs.map((doc, idx) => {
                    const avgRate = doc.subtotal > 0 ? ((doc.withholdingTaxTotal / doc.subtotal) * 100).toFixed(0) : '3';
                    return (
                      <tr key={doc.id} className="hover:bg-sky-50/30 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 text-slate-600">{formatThaiDate(doc.issueDate)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{doc.contact?.name || doc.contact?.companyName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{doc.contact?.taxId || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {doc.items.map(i => i.name).join(', ') || 'ค่าจ้างทำของ / ค่าวิชาชีพ'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{formatMoney(doc.subtotal)}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">{avgRate}%</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sky-700">
                          {formatMoney(doc.withholdingTaxTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {pnd3Docs.length > 0 && (
                <tfoot className="sticky bottom-0 z-10 bg-slate-100/95 backdrop-blur-sm font-bold border-t-2 border-slate-200 shadow-sm">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right">ยอดรวม ภ.ง.ด. 3 ทั้งสิ้น:</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">{formatMoney(totalPnd3Payment)}</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right font-mono text-sky-700">{formatMoney(totalPnd3Wht)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
