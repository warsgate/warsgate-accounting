import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, FileText, Award } from 'lucide-react';
import { AccountingDocument, CompanyProfile } from '../types';
import { formatMoney, formatNumber, formatThaiDate, arabicToThaiBahtText } from '../utils/formatters';
import { WhtCertificateView } from './WhtCertificateView';

interface DocumentViewerModalProps {
  document: AccountingDocument | null;
  company: CompanyProfile;
  onClose: () => void;
  onIssueReceipt?: (doc: AccountingDocument) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  company,
  onClose,
  onIssueReceipt
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
      case 'DELIVERY_ORDER': return { main: 'ใบส่งของชั่วคราว / ใบส่งสินค้า', sub: 'TEMPORARY DELIVERY ORDER / DELIVERY NOTE' };
      case 'WHT_CERTIFICATE': return { main: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)', sub: 'WITHHOLDING TAX CERTIFICATE' };
      default: return { main: 'เอกสารทางการเงิน', sub: 'DOCUMENT' };
    }
  };

  const title = getDocTitle();
  const thaiBahtText = arabicToThaiBahtText(doc.netPayment || doc.grandTotal);

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-document-content');
    if (!printableElement) {
      window.print();
      return;
    }

    // Create an invisible iframe to print ONLY the document without modal scroll clipping
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>${title.main} - ${doc.documentNo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm 8mm 8mm;
          }
          *, ::before, ::after {
            box-sizing: border-box;
          }
          body {
            font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .font-mono {
            font-family: 'JetBrains Mono', monospace !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 4px;">
          ${printableElement.innerHTML}
        </div>
      </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch {
          // ignore
        }
      }, 1500);
    }, 450);
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
              {title.main}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onIssueReceipt && (doc.type === 'INVOICE' || doc.type === 'TAX_INVOICE') && (
              <button
                onClick={() => onIssueReceipt(doc)}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1.5 transition shadow-sm"
                title="ออกใบเสร็จรับเงินจากใบแจ้งหนี้นี้"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>📑 ออกใบเสร็จรับเงิน</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-glow transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร A4 / PDF</span>
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
            <div id="printable-document-content" className="print-document-container max-w-[210mm] mx-auto bg-white text-slate-900 p-6 sm:p-8 rounded-lg shadow-xl print-shadow-none text-xs leading-normal font-sans border border-slate-200">
              
              {/* Header: Official WARSGATE Logo & Document Title */}
              <div className={`flex items-start justify-between pb-5 border-b-2 gap-4 ${
                doc.type === 'DELIVERY_ORDER' ? 'border-indigo-600' : 'border-rose-600'
              }`}>
                
                {/* WARSGATE Logo Component (Light Mode) & Company Details */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <img src="/warsgate-logo.png" alt="WARSGATE" className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    <div>
                      <h1 className="text-sm font-extrabold text-slate-900">{company.name}</h1>
                      <span className={`text-[11px] font-bold block ${
                        doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700' : 'text-rose-700'
                      }`}>{company.nameEn}</span>
                    </div>
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <p className="text-[10px] text-slate-600 max-w-sm">
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
                  <h2 className={`text-lg font-black tracking-tight ${
                    doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700' : 'text-rose-600'
                  }`}>{title.main}</h2>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">{title.sub}</span>
                  
                  <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-0.5 text-right">
                    <div>
                      <span className="text-slate-500">เลขที่ / No: </span>
                      <strong className="text-slate-900 font-bold">{doc.documentNo}</strong>
                    </div>
                    {doc.referencePoNo && (
                      <div className="pt-0.5">
                        <span className={`font-bold ${doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700' : 'text-rose-600'}`}>
                          อ้างอิง PO ลูกค้า: 
                        </span>
                        <strong className={`px-1.5 py-0.2 rounded border font-bold ${
                          doc.type === 'DELIVERY_ORDER' 
                            ? 'text-indigo-800 bg-indigo-50 border-indigo-200' 
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}>
                          {doc.referencePoNo}
                        </strong>
                      </div>
                    )}
                    {doc.referenceDocNo && (
                      <div>
                        <span className="text-slate-500">อ้างอิงเอกสาร: </span>
                        <span className="text-slate-800 font-semibold">{doc.referenceDocNo}</span>
                      </div>
                    )}
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
              <div className="my-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 print-avoid-break">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    ชื่อและที่อยู่ลูกค้า (Customer Details)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{doc.contact?.companyName || '-'}</h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">{doc.contact?.address || '-'}</p>
                  <div className="text-[10px] text-slate-600 font-mono mt-1">
                    <span>เลขผู้เสียภาษี: {doc.contact?.taxId || '-'} ({doc.contact?.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${doc.contact?.branchCode || '00000'}`})</span>
                  </div>
                </div>

                <div className="space-y-0.5 text-right md:border-l md:border-slate-200 md:pl-4">
                  <div>
                    <span className="text-slate-500">ผู้ติดต่อ: </span>
                    <span className="font-semibold text-slate-800">{doc.contact?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">โทรศัพท์: </span>
                    <span className="font-mono text-slate-800">{doc.contact?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">เงื่อนไข: </span>
                    <span className="font-semibold text-slate-800">{doc.contact?.creditDays ? `เครดิต ${doc.contact.creditDays} วัน` : 'ส่งมอบตรวจรับหน้างาน'}</span>
                  </div>
                  {doc.projectNote && (
                    <div className="pt-0.5">
                      <span className="text-indigo-700 font-medium text-[10px]">โครงการ: {doc.projectNote}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="my-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-10">ลำดับ</th>
                      <th className="py-2 px-2.5">รหัสสินค้า / รายการ (Description)</th>
                      <th className="py-2 px-2.5 text-center w-16">จำนวน</th>
                      <th className="py-2 px-2.5 text-center w-14">หน่วย</th>
                      <th className="py-2 px-2.5 text-right w-24">ราคา/หน่วย</th>
                      <th className="py-2 px-2.5 text-right w-20">ส่วนลด</th>
                      <th className="py-2 px-2.5 text-right w-28">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {doc.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 text-center text-slate-500 font-mono align-top">{index + 1}</td>
                        <td className="py-2 px-2.5 align-top">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.description && (
                            <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed mt-0.5 font-mono pl-1 border-l-2 border-indigo-200">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-semibold align-top">{item.quantity}</td>
                        <td className="py-2 px-2.5 text-center text-slate-600 align-top">{item.unit}</td>
                        <td className="py-2 px-2.5 text-right font-mono align-top">{formatNumber(item.pricePerUnit)}</td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-500 align-top">
                          {item.discount > 0 ? formatNumber(item.discount) : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 align-top">
                          {formatNumber(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary & Thai Baht Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 print-avoid-break">
                
                {/* Baht Text Box */}
                <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                  doc.type === 'DELIVERY_ORDER' 
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                      doc.type === 'DELIVERY_ORDER' ? 'text-indigo-800' : 'text-rose-800'
                    }`}>
                      จำนวนเงินตัวอักษร (Baht Text)
                    </span>
                    <p className={`text-xs font-bold mt-1 font-serif ${
                      doc.type === 'DELIVERY_ORDER' ? 'text-indigo-900' : 'text-rose-900'
                    }`}>
                      ({thaiBahtText})
                    </p>
                  </div>
                  <div className={`mt-3 pt-2 border-t text-[10px] text-slate-600 ${
                    doc.type === 'DELIVERY_ORDER' ? 'border-indigo-200' : 'border-rose-200'
                  }`}>
                    <span className="block font-semibold">หมายเหตุ / เงื่อนไข:</span>
                    <span>{doc.notes || '-'}</span>
                  </div>
                </div>

                {/* Total Calculation Table */}
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-sans">รวมเป็นเงิน (Subtotal):</span>
                    <span className="font-semibold text-slate-900">{formatMoney(doc.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-sans">ส่วนลดรวม (Discount):</span>
                    <span className="text-slate-600">-{formatMoney(doc.discountTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-sans">ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                    <span className="font-semibold text-slate-900">{formatMoney(doc.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b-2 border-slate-900 text-xs font-bold">
                    <span className="text-slate-900 font-sans">จำนวนเงินรวมทั้งสิ้น (Grand Total):</span>
                    <span className={doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700' : 'text-rose-700'}>
                      {formatMoney(doc.grandTotal)}
                    </span>
                  </div>
                  {doc.withholdingTaxTotal > 0 && (
                    <div className="flex justify-between py-0.5 text-rose-600 text-[11px]">
                      <span className="font-sans">หัก ภาษี ณ ที่จ่าย (Withholding Tax 3%):</span>
                      <span>-{formatMoney(doc.withholdingTaxTotal)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between py-1.5 px-3 rounded-lg font-bold text-xs ${
                    doc.type === 'DELIVERY_ORDER' ? 'bg-indigo-950 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    <span className="font-sans">ยอดชำระสุทธิ (Net Payment):</span>
                    <span className="text-emerald-400 font-bold">{formatMoney(doc.netPayment || doc.grandTotal)}</span>
                  </div>
                </div>

              </div>

              {/* Official Signature Boxes */}
              {doc.type === 'DELIVERY_ORDER' ? (
                <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="space-y-8">
                    <p className="text-slate-600 font-medium">ผู้ส่งของ / เจ้าหน้าที่จัดส่ง</p>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div>
                      <p className="font-semibold text-slate-800">ผู้ส่งมอบสินค้า</p>
                      <span className="text-[10px] text-slate-400 block font-mono">วันที่ ...... / ...... / ..........</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <p className="text-slate-600 font-medium">ในนาม {doc.contact?.companyName || 'ผู้รับสินค้า'}</p>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto" />
                    <div>
                      <p className="font-semibold text-slate-800">ผู้รับสินค้า / ตรวจรับของถูกต้อง</p>
                      <span className="text-[10px] text-slate-400 block font-mono">วันที่ ...... / ...... / ..........</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <p className="text-slate-600 font-medium">ในนาม {company.name}</p>
                    <div className="relative w-36 mx-auto">
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
              ) : (
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
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
