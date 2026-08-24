import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, FileText, Award } from 'lucide-react';
import { AccountingDocument, CompanyProfile } from '../types';
import { formatMoney, formatNumber, formatThaiDate, arabicToThaiBahtText } from '../utils/formatters';
import { WhtCertificateView } from './WhtCertificateView';

interface DocumentViewerModalProps {
  document: AccountingDocument | null;
  company: CompanyProfile;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  company,
  onClose
}) => {
  if (!doc) return null;

  const isWhtCertificate = doc.type === 'WHT_CERTIFICATE';
  const hasWht = doc.withholdingTaxTotal > 0;

  // View mode: 'STANDARD' or 'WHT_50_TAWI'
  const [viewMode, setViewMode] = useState<'STANDARD' | 'WHT_50_TAWI'>(
    isWhtCertificate ? 'WHT_50_TAWI' : 'STANDARD'
  );

  const getDocTitle = () => {
    switch (doc.type) {
      case 'QUOTATION': return { main: 'ใบเสนอราคา', sub: 'QUOTATION' };
      case 'INVOICE': return { main: 'ใบแจ้งหนี้ / ใบกำกับภาษี', sub: 'INVOICE / TAX INVOICE' };
      case 'TAX_INVOICE': return { main: 'ใบกำกับภาษี / ใบเสร็จรับเงิน', sub: 'TAX INVOICE / RECEIPT' };
      case 'RECEIPT': return { main: 'ใบเสร็จรับเงิน', sub: 'RECEIPT' };
      case 'PURCHASE_ORDER': return { main: 'ใบสั่งซื้อ', sub: 'PURCHASE ORDER' };
      case 'PURCHASE_INVOICE': return { main: 'ใบแจ้งหนี้ค่าใช้จ่าย', sub: 'PURCHASE INVOICE' };
      case 'PAYMENT_VOUCHER': return { main: 'ใบสำคัญจ่าย', sub: 'PAYMENT VOUCHER' };
      case 'WHT_CERTIFICATE': return { main: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)', sub: 'WITHHOLDING TAX CERTIFICATE' };
      default: return { main: 'เอกสารทางการเงิน', sub: 'DOCUMENT' };
    }
  };

  const title = getDocTitle();
  const thaiBahtText = arabicToThaiBahtText(doc.netPayment || doc.grandTotal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-white px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
              {doc.documentNo}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {viewMode === 'WHT_50_TAWI' ? 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)' : title.main}
            </span>

            {/* Toggle Tabs if document has WHT */}
            {(hasWht || isWhtCertificate) && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {!isWhtCertificate && (
                  <button
                    onClick={() => setViewMode('STANDARD')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      viewMode === 'STANDARD'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📄 เอกสารหลัก
                  </button>
                )}
                <button
                  onClick={() => setViewMode('WHT_50_TAWI')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    viewMode === 'WHT_50_TAWI'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>📑 ใบ 50 ทวิ</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-glow transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร A4 / บันทึก PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Paper Document Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950">
          {viewMode === 'WHT_50_TAWI' ? (
            <WhtCertificateView document={doc} company={company} />
          ) : (
            <div className="max-w-[210mm] mx-auto bg-white text-slate-900 p-8 rounded-lg shadow-xl print-shadow-none text-xs leading-normal font-sans border border-slate-200">
              
              {/* Header: Official WARSGATE Logo & Document Title */}
              <div className="flex items-start justify-between pb-6 border-b-2 border-rose-600 gap-4">
                
                {/* WARSGATE Logo Component (Light Mode) & Company Details */}
                <div className="flex flex-col gap-2">
                  <img src="/warsgate-logo.png" alt="WARSGATE" className="h-12 w-auto object-contain" />
                  <div className="space-y-0.5 pt-1">
                    <h1 className="text-sm font-bold text-slate-900">{company.name}</h1>
                    <span className="text-[11px] font-semibold text-rose-700 block">{company.nameEn}</span>
                    <p className="text-[10px] text-slate-600 max-w-sm mt-0.5">
                      {company.address}
                    </p>
                    <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-3 pt-0.5 font-mono">
                      <span>เลขประจำตัวผู้เสียภาษี: <strong>{company.taxId}</strong></span>
                      <span>({company.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${company.branchCode}`})</span>
                      <span>โทร: {company.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Document Title Box */}
                <div className="text-right shrink-0">
                  <h2 className="text-lg font-bold text-rose-600 tracking-tight">{title.main}</h2>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">{title.sub}</span>
                  
                  <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] space-y-1 text-right">
                    <div>
                      <span className="text-slate-500">เลขที่ / No: </span>
                      <strong className="text-slate-900">{doc.documentNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">วันที่ / Date: </span>
                      <span>{formatThaiDate(doc.issueDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">ครบกำหนด / Due: </span>
                      <span>{formatThaiDate(doc.dueDate)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Customer Details Box */}
              <div className="my-6 p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    ชื่อและที่อยู่ลูกค้า (Customer Details)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{doc.contact?.companyName || '-'}</h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">{doc.contact?.address || '-'}</p>
                  <div className="text-[10px] text-slate-600 font-mono mt-1">
                    <span>เลขผู้เสียภาษี: {doc.contact?.taxId || '-'} ({doc.contact?.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${doc.contact?.branchCode || '00000'}`})</span>
                  </div>
                </div>

                <div className="space-y-1 text-right md:border-l md:border-slate-200 md:pl-4">
                  <div>
                    <span className="text-slate-500">ผู้ติดต่อ: </span>
                    <span className="font-semibold text-slate-800">{doc.contact?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">โทรศัพท์: </span>
                    <span className="font-mono text-slate-800">{doc.contact?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">เครดิตเทอม: </span>
                    <span className="font-semibold text-slate-800">{doc.contact?.creditDays || 30} วัน</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="my-6 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                      <th className="py-2.5 px-3">รหัสสินค้า / รายการ (Description)</th>
                      <th className="py-2.5 px-3 text-right w-16">จำนวน</th>
                      <th className="py-2.5 px-3 text-center w-16">หน่วย</th>
                      <th className="py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                      <th className="py-2.5 px-3 text-right w-24">ส่วนลด</th>
                      <th className="py-2.5 px-3 text-right w-28">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {doc.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">{index + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          {item.description && <div className="text-[10px] text-slate-500">{item.description}</div>}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">{item.quantity}</td>
                        <td className="py-3 px-3 text-center text-slate-600">{item.unit}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatNumber(item.pricePerUnit)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {item.discount > 0 ? formatNumber(item.discount) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatNumber(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary & Thai Baht Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                
                {/* Baht Text Box */}
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                      จำนวนเงินตัวอักษร (Baht Text)
                    </span>
                    <p className="text-sm font-bold text-rose-900 mt-1 font-serif">
                      ({thaiBahtText})
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-rose-200 text-[10px] text-slate-600">
                    <span className="block font-semibold">เงื่อนไขการชำระเงิน:</span>
                    <span>{doc.notes || '-'}</span>
                  </div>
                </div>

                {/* Total Calculation Table */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">รวมเป็นเงิน (Subtotal):</span>
                    <span className="font-semibold text-slate-900">{formatMoney(doc.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">ส่วนลดรวม (Discount):</span>
                    <span className="text-slate-600">-{formatMoney(doc.discountTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                    <span className="font-semibold text-slate-900">{formatMoney(doc.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b-2 border-slate-900 text-sm font-bold">
                    <span className="text-slate-900">จำนวนเงินรวมทั้งสิ้น (Grand Total):</span>
                    <span className="text-rose-700">{formatMoney(doc.grandTotal)}</span>
                  </div>
                  {doc.withholdingTaxTotal > 0 && (
                    <div className="flex justify-between py-1 text-rose-600">
                      <span>หัก ภาษี ณ ที่จ่าย (Withholding Tax):</span>
                      <span>-{formatMoney(doc.withholdingTaxTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 bg-slate-900 text-white px-3 rounded-lg font-bold text-sm">
                    <span>ยอดชำระสุทธิ (Net Payment):</span>
                    <span className="text-emerald-400">{formatMoney(doc.netPayment || doc.grandTotal)}</span>
                  </div>
                </div>

              </div>

              {/* Official Signature Boxes */}
              <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-8">
                  <p className="text-slate-600 font-medium">ในนาม {doc.contact?.companyName || 'ลูกค้า'}</p>
                  <div className="border-b border-dashed border-slate-400 w-48 mx-auto" />
                  <div>
                    <p className="font-semibold text-slate-800">ผู้รับบริการ / ผู้สั่งซื้อ</p>
                    <span className="text-[10px] text-slate-400 block font-mono">วันที่ ...... / ...... / ..........</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <p className="text-slate-600 font-medium">ในนาม {company.name}</p>
                  <div className="relative w-48 mx-auto">
                    <div className="border-b border-dashed border-slate-400 w-full" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-rose-600 font-serif italic text-xs font-bold opacity-85 rotate-[-4deg] border border-rose-500 px-2 py-0.5 rounded">
                      WARSGATE AUTOMATION
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{company.authorizedSignatory}</p>
                    <span className="text-[10px] text-slate-500 block">{company.signatoryPosition}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
