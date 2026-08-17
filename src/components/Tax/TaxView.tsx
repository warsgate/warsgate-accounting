import React from 'react';
import { Calculator, FileSpreadsheet, Printer } from 'lucide-react';
import { AccountingDocument } from '../../types';
import { formatMoney, formatThaiDate } from '../../utils/formatters';

interface TaxViewProps {
  documents: AccountingDocument[];
}

export const TaxView: React.FC<TaxViewProps> = ({ documents }) => {
  const vatSalesDocs = documents.filter(d => ['INVOICE', 'TAX_INVOICE', 'RECEIPT'].includes(d.type));
  const totalVatSalesBase = vatSalesDocs.reduce((sum, d) => sum + d.subtotal, 0);
  const totalVatSalesAmount = vatSalesDocs.reduce((sum, d) => sum + d.vatAmount, 0);
  const totalVatPurchaseBase = 132000.00;
  const totalVatPurchaseAmount = 9240.00;
  const netVatToPay = totalVatSalesAmount - totalVatPurchaseAmount;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            <span>รายงานภาษี & การนำส่งกรมสรรพากร</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">สรุปภาษีมูลค่าเพิ่ม ภ.พ.30 (ภาษีขาย - ภาษีซื้อ 7%) และภาษีหัก ณ ที่จ่าย ภ.ง.ด.3 / ภ.ง.ด.53</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-2 transition">
          <Printer className="w-4 h-4 text-rose-500" />
          <span>พิมพ์รายงาน ภ.พ. 30</span>
        </button>
      </div>

      {/* VAT Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-rose-400">
          <span className="text-xs text-slate-500 font-medium">ภาษีขายเดือนนี้ (Output VAT 7%)</span>
          <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1">{formatMoney(totalVatSalesAmount)}</h3>
          <span className="text-[11px] text-slate-400 block mt-1">ฐานภาษีขาย: {formatMoney(totalVatSalesBase)}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-400">
          <span className="text-xs text-slate-500 font-medium">ภาษีซื้อเดือนนี้ (Input VAT 7%)</span>
          <h3 className="text-2xl font-bold text-emerald-600 font-mono mt-1">{formatMoney(totalVatPurchaseAmount)}</h3>
          <span className="text-[11px] text-emerald-600 block mt-1">ฐานภาษีซื้อ: {formatMoney(totalVatPurchaseBase)}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-400 bg-amber-50/50">
          <span className="text-xs text-amber-700 font-semibold">ภาษีที่ต้องนำส่งสรรพากร (ภ.พ. 30 สุทธิ)</span>
          <h3 className="text-2xl font-bold text-amber-600 font-mono mt-1">{formatMoney(netVatToPay)}</h3>
          <span className="text-[11px] text-amber-600 block mt-1">กำหนดชำระภายในวันที่ 15 ของเดือนถัดไป</span>
        </div>
      </div>

      {/* VAT Sales Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-rose-500" />
            <span>รายงานภาษีขาย (Output VAT Register)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-full border border-slate-200">ประจำเดือน สิงหาคม 2569</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">วันที่</th>
                <th className="py-3 px-4">เลขที่ใบกำกับภาษี</th>
                <th className="py-3 px-4">ชื่อผู้ซื้อสินค้า / บริการ</th>
                <th className="py-3 px-4">เลขประจำตัวผู้เสียภาษี</th>
                <th className="py-3 px-4">สถานประกอบการ</th>
                <th className="py-3 px-4 text-right">มูลค่าสินค้า (ก่อน VAT)</th>
                <th className="py-3 px-4 text-right">จำนวนเงิน VAT (7%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vatSalesDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-rose-50/30 transition">
                  <td className="py-3 px-4 text-slate-600">{formatThaiDate(doc.issueDate)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{doc.documentNo}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{doc.contact.companyName}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{doc.contact.taxId}</td>
                  <td className="py-3 px-4 text-slate-500">{doc.contact.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${doc.contact.branchCode}`}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">{formatMoney(doc.subtotal)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatMoney(doc.vatAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
