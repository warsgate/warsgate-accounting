import React, { useState } from 'react';
import { Calculator, FileSpreadsheet, Printer, TrendingUp, TrendingDown, ArrowRightLeft, ShieldCheck, Download, Filter } from 'lucide-react';
import { AccountingDocument } from '../../types';
import { formatMoney, formatThaiDate } from '../../utils/formatters';

interface TaxViewProps {
  documents: AccountingDocument[];
}

export const TaxView: React.FC<TaxViewProps> = ({ documents }) => {
  const [activeTab, setActiveTab] = useState<'PP30' | 'PND53' | 'PND3'>('PP30');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Filter documents by month if selected
  const filterByMonth = (docs: AccountingDocument[]) => {
    if (selectedMonth === 'ALL') return docs;
    return docs.filter(d => (d.issueDate || '').startsWith(selectedMonth));
  };

  // ── 1. ภาษีขาย (Output VAT) ────────────────────────────────────────────────
  // เกณฑ์เงินสด/รับชำระจริง (Cash Basis สำหรับธุรกิจบริการ/ซอฟต์แวร์):
  // ดึงเฉพาะ RECEIPT (ใบเสร็จรับเงิน) ที่ชำระแล้ว และ TAX_INVOICE (ใบกำกับภาษี)
  const allSalesVatDocs = documents.filter(d =>
    ['RECEIPT', 'TAX_INVOICE'].includes(d.type) && d.status === 'PAID' && (d.vatAmount || 0) > 0
  );
  const salesVatDocs = filterByMonth(allSalesVatDocs);
  const totalSalesBase = salesVatDocs.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  const totalSalesVat = salesVatDocs.reduce((sum, d) => sum + (d.vatAmount || 0), 0);

  // ── 2. ภาษีซื้อ (Input VAT) ────────────────────────────────────────────────
  // มาจาก PURCHASE_INVOICE (ใบแจ้งหนี้/ใบกำกับภาษีซื้อ) และ PAYMENT_VOUCHER (ใบสำคัญจ่าย) ที่มี VAT > 0
  const allPurchaseVatDocs = documents.filter(d =>
    ['PURCHASE_INVOICE', 'PAYMENT_VOUCHER'].includes(d.type) && (d.vatAmount || 0) > 0
  );
  const purchaseVatDocs = filterByMonth(allPurchaseVatDocs);
  const totalPurchaseBase = purchaseVatDocs.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  const totalPurchaseVat = purchaseVatDocs.reduce((sum, d) => sum + (d.vatAmount || 0), 0);

  // ── 3. ภาษีมูลค่าเพิ่มสุทธิ ภ.พ. 30 ──────────────────────────────────────
  const netVatToPay = totalSalesVat - totalPurchaseVat; // บวก = ต้องนำส่ง, ลบ = ขอคืน/ยกไป

  // ── 4. ภาษีหัก ณ ที่จ่าย ภ.ง.ด. 53 (นิติบุคคล) ───────────────────────────
  // เอกสารรายจ่ายที่มี withholdingTaxTotal > 0 และคู่ค้าเป็นนิติบุคคล
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
            <span>รายงานภาษี & การนำส่งกรมสรรพากร (Tax & RD Center)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            คำนวณและเชื่อมโยงข้อมูลภาษีมูลค่าเพิ่ม (ภ.พ.30) และภาษีหัก ณ ที่จ่าย (ภ.ง.ด.3 / ภ.ง.ด.53) จากเอกสารจริงแบบ Real-time
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

      {/* ── Top Summary KPI Cards (เชื่อมโยงข้อมูลจริงทั้งหมด) ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Output VAT */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">ภาษีขาย (Output VAT 7%)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
              {salesVatDocs.length} รายการ
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1.5">{formatMoney(totalSalesVat)}</h3>
          <span className="text-[11px] text-slate-400 block mt-1">
            ฐานภาษีขาย: <strong className="text-slate-700">{formatMoney(totalSalesBase)}</strong>
          </span>
        </div>

        {/* Input VAT */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">ภาษีซื้อ (Input VAT 7%)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {purchaseVatDocs.length} รายการ
            </span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 font-mono mt-1.5">{formatMoney(totalPurchaseVat)}</h3>
          <span className="text-[11px] text-slate-400 block mt-1">
            ฐานภาษีซื้อ: <strong className="text-slate-700">{formatMoney(totalPurchaseBase)}</strong>
          </span>
        </div>

        {/* Net VAT to pay (ภ.พ.30) */}
        <div className={`glass-card p-5 rounded-2xl border-l-4 ${netVatToPay >= 0 ? 'border-l-amber-500 bg-amber-50/40' : 'border-l-sky-500 bg-sky-50/40'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {netVatToPay >= 0 ? 'ภาษีที่ต้องนำส่ง (ภ.พ. 30 สุทธิ)' : 'ภาษีชำระเกิน / ขอคืน (ภ.พ. 30)'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${netVatToPay >= 0 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-sky-100 text-sky-800 border-sky-300'}`}>
              {netVatToPay >= 0 ? 'ต้องชำระ' : 'ขอคืนได้'}
            </span>
          </div>
          <h3 className={`text-2xl font-bold font-mono mt-1.5 ${netVatToPay >= 0 ? 'text-amber-700' : 'text-sky-700'}`}>
            {formatMoney(Math.abs(netVatToPay))}
          </h3>
          <span className="text-[11px] text-slate-500 block mt-1">
            ยื่นแบบภายในวันที่ 15 (ออนไลน์ วันที่ 23) ของเดือนถัดไป
          </span>
        </div>
      </div>

      {/* ── Tax Report Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('PP30')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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

      {/* ── TAB 1: ภ.พ. 30 (รายงานภาษีขาย & รายงานภาษีซื้อ) ───────────────── */}
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
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
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
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
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
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
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
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
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
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
