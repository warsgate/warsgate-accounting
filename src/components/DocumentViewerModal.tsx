import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, FileText, Award, Cpu, ShoppingBag } from 'lucide-react';
import { AccountingDocument, CompanyProfile } from '../types';
import { formatMoney, formatNumber, formatThaiDate, arabicToThaiBahtText, getProjectName } from '../utils/formatters';
import { WhtCertificateView } from './WhtCertificateView';
import { downloadEtaxXml } from '../utils/etaxGenerator';
import { getPromptPayQrUrl } from '../utils/promptpay';


interface DocumentViewerModalProps {
  document: AccountingDocument | null;
  company: CompanyProfile;
  onClose: () => void;
  onIssueReceipt?: (doc: AccountingDocument) => void;
  onGeneratePoFromQuotation?: (doc: AccountingDocument) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  company,
  onClose,
  onIssueReceipt,
  onGeneratePoFromQuotation
}) => {
  if (!doc) return null;

  const isWhtCertificate = doc.type === 'WHT_CERTIFICATE';
  const hasWht = doc.withholdingTaxTotal > 0;

  // View mode: 'STANDARD' or 'WHT_50_TAWI'
  const [viewMode, setViewMode] = useState<'STANDARD' | 'WHT_50_TAWI'>(
    isWhtCertificate ? 'WHT_50_TAWI' : 'STANDARD'
  );

  // Copy Mode: 'BOTH' (ต้นฉบับ + สำเนา 2 หน้าในไฟล์เดียว), 'ORIGINAL' (เฉพาะต้นฉบับ), 'COPY' (เฉพาะสำเนา)
  const isInvoiceLike = ['INVOICE', 'TAX_INVOICE', 'RECEIPT', 'DELIVERY_ORDER'].includes(doc.type);
  const [copyMode, setCopyMode] = useState<'BOTH' | 'ORIGINAL' | 'COPY'>(
    isInvoiceLike ? 'BOTH' : 'ORIGINAL'
  );

  const getDocTitle = () => {
    switch (doc.type) {
      case 'QUOTATION': return { main: 'ใบเสนอราคา', sub: 'QUOTATION' };
      case 'INVOICE': return { main: 'ใบแจ้งหนี้ / ใบวางบิล', sub: 'INVOICE / BILLING NOTE' };
      case 'TAX_INVOICE': return { main: 'ใบกำกับภาษี', sub: 'TAX INVOICE' };
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
  const safeDocNo = doc.documentNo ? doc.documentNo.replace(/[\/\\:*?"<>|]/g, '-') : 'document';

  const getSafeDocFilename = () => {
    if (copyMode === 'BOTH') return `${safeDocNo}-Original-Copy`;
    if (copyMode === 'ORIGINAL') return `${safeDocNo}-Original`;
    return `${safeDocNo}-Copy`;
  };

  // Set document.title to safe filename so browser print / Save as PDF defaults to documentNo as filename
  React.useEffect(() => {
    if (!doc) return;
    const prevTitle = document.title;
    document.title = getSafeDocFilename();
    return () => {
      document.title = prevTitle;
    };
  }, [doc, safeDocNo, copyMode]);

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-document-content');
    const printDocName = getSafeDocFilename();
    if (!printableElement) {
      document.title = printDocName;
      window.print();
      return;
    }

    // Ensure window document title is safe filename so browser PDF save dialog uses document number
    document.title = printDocName;

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
        <title>${printDocName}</title>
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
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 0;">
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

  const renderDocumentSheet = (copyType: 'ORIGINAL' | 'COPY') => {
    const isOriginal = copyType === 'ORIGINAL';

    return (
      <div className="print-document-container max-w-[210mm] mx-auto bg-white text-slate-900 p-5 sm:p-7 rounded-xl shadow-xl print-shadow-none text-xs leading-normal font-sans border border-slate-200">
        
        {/* Header: Official WARSGATE Logo & Document Title (Strict 2-Column Row) */}
        <div className="pb-3 border-b-2 border-slate-900">
          <div className="flex flex-row items-start justify-between gap-4">
            
            {/* Left: WARSGATE Brand & Company Details */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-3">
                <div className="shrink-0 p-1 bg-white rounded-lg border border-slate-100 shadow-2xs">
                  <img 
                    src="/warsgate-logo.png" 
                    alt="WARSGATE" 
                    className="h-10 sm:h-11 w-auto object-contain" 
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-[15px] sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                    {company.name}
                  </h1>
                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase font-mono block ${
                    doc.type === 'DELIVERY_ORDER' ? 'text-indigo-600' : 'text-rose-600'
                  }`}>
                    {company.nameEn}
                  </span>
                </div>
              </div>

              <div className="text-[10.5px] text-slate-600 leading-snug space-y-0.5">
                <p className="line-clamp-2">
                  {company.address}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-600 pt-0.5 font-sans">
                  <span>
                    เลขประจำตัวผู้เสียภาษี: <strong className="font-mono text-slate-900 font-bold bg-slate-100 px-1 rounded border border-slate-200">{company.taxId}</strong>
                  </span>
                  <span className="text-slate-500 font-medium">
                    ({company.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${company.branchCode}`})
                  </span>
                  <span className="text-slate-300 font-bold">•</span>
                  <span>
                    โทร: <strong className="font-mono text-slate-800">{company.phone}</strong>
                  </span>
                  {company.email && (
                    <>
                      <span className="text-slate-300 font-bold">•</span>
                      <span>อีเมล: <strong className="text-slate-700">{company.email}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Document Title & Compact Meta Box */}
            <div className="text-right shrink-0 flex flex-col items-end w-[245px]">
              <div className="text-right mb-1.5">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${
                  doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700' : 'text-rose-600'
                }`}>
                  {title.main}
                </h2>
                <span className="text-[9.5px] font-bold text-slate-400 tracking-widest uppercase block mt-0.5">
                  {title.sub}
                </span>

                {/* Explicit Badge for ต้นฉบับ vs สำเนา inside the document file */}
                <div className="mt-1 flex items-center justify-end gap-1.5">
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded border tracking-wider uppercase font-sans shadow-2xs ${
                    isOriginal
                      ? (doc.type === 'DELIVERY_ORDER' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-rose-50 text-rose-700 border-rose-300')
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {isOriginal ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY'}
                  </span>
                </div>
                <span className="text-[8.5px] text-slate-500 font-sans block mt-0.5">
                  {isOriginal ? '(สำหรับลูกค้า / Customer Copy)' : '(สำหรับผู้ออกเอกสาร / สำเนาบัญชี)'}
                </span>
              </div>
              
              <div className="w-full p-2 bg-slate-50/90 rounded-xl border border-slate-200/90 font-mono text-[10.5px] space-y-1 text-right shadow-2xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 font-sans text-[10px]">เลขที่ / No:</span>
                  <strong className="text-slate-900 font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {doc.documentNo}
                  </strong>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 font-sans text-[10px]">ประเภทเอกสาร:</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] font-sans ${
                    isOriginal
                      ? (doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700 bg-indigo-50 border border-indigo-200' : 'text-rose-700 bg-rose-50 border border-rose-200')
                      : 'text-slate-700 bg-slate-100 border border-slate-200'
                  }`}>
                    {isOriginal ? 'ต้นฉบับ (Original)' : 'สำเนา (Copy)'}
                  </span>
                </div>
                {doc.referencePoNo && (
                  <div className="flex justify-between items-center gap-2">
                    <span className={`font-sans font-bold text-[10px] ${doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700' : 'text-rose-600'}`}>
                      อ้างอิง PO:
                    </span>
                    <strong className={`px-1.5 py-0.2 rounded border font-bold text-[10.5px] ${
                      doc.type === 'DELIVERY_ORDER' 
                        ? 'text-indigo-800 bg-indigo-50 border-indigo-200' 
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                      {doc.referencePoNo}
                    </strong>
                  </div>
                )}
                {doc.referenceDocNo && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-sans text-[10px]">อ้างอิงเอกสาร:</span>
                    <span className="text-slate-800 font-semibold text-[10.5px]">{doc.referenceDocNo}</span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 font-sans text-[10px]">วันที่ / Date:</span>
                  <span className="text-slate-800 font-medium text-[10.5px]">{formatThaiDate(doc.issueDate)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 font-sans text-[10px]">ครบกำหนด / Due:</span>
                  <span className="text-slate-800 font-medium text-[10.5px]">{formatThaiDate(doc.dueDate)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Customer / Supplier Details Box (Compact 2-Column Card) */}
        <div className="my-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 grid grid-cols-2 gap-3 text-xs print-avoid-break">
          <div>
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              {['PURCHASE_ORDER', 'PURCHASE_INVOICE', 'PAYMENT_VOUCHER'].includes(doc.type) 
                ? 'ชื่อและที่อยู่ผู้จำหน่าย / ผู้ให้บริการ (Supplier Details)' 
                : 'ชื่อและที่อยู่ลูกค้า (Customer Details)'}
            </span>
            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">{doc.contact?.companyName || '-'}</h3>
            <p className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">{doc.contact?.address || '-'}</p>
            <div className="text-[10px] text-slate-600 font-mono mt-1">
              <span>เลขผู้เสียภาษี: <strong className="text-slate-800">{doc.contact?.taxId || '-'}</strong> ({doc.contact?.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${doc.contact?.branchCode || '00000'}`})</span>
            </div>
          </div>

          <div className="space-y-0.5 text-right border-l border-slate-200 pl-3 text-[10.5px]">
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
            <div className="pt-1 border-t border-slate-200/60 mt-0.5">
              <span className="text-slate-500">โครงการ: </span>
              <strong className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
                {getProjectName(doc)}
              </strong>
            </div>
          </div>
        </div>

        {/* Items Table (Crisp & Space-Optimized) */}
        <div className="my-2.5 overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-bold text-[10.5px] border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-2 text-center w-10">ลำดับ</th>
                <th className="py-1.5 px-2">รหัสสินค้า / รายการ (Description)</th>
                <th className="py-1.5 px-2 text-center w-16">จำนวน</th>
                <th className="py-1.5 px-2 text-center w-14">หน่วย</th>
                <th className="py-1.5 px-2 text-right w-24">ราคา/หน่วย</th>
                <th className="py-1.5 px-2 text-right w-16">ส่วนลด</th>
                <th className="py-1.5 px-2 text-right w-28">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {doc.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-50/60">
                  <td className="py-1.5 px-2 text-center text-slate-400 font-mono align-top text-[10.5px]">{index + 1}</td>
                  <td className="py-1.5 px-2 align-top">
                    <div className="font-bold text-slate-900 leading-snug">{item.name}</div>
                    {item.description && (
                      <div className="text-[9.5px] text-slate-500 whitespace-pre-line leading-relaxed mt-0.5 font-mono pl-1 border-l-2 border-slate-300">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-semibold align-top">{item.quantity}</td>
                  <td className="py-1.5 px-2 text-center text-slate-600 align-top">{item.unit}</td>
                  <td className="py-1.5 px-2 text-right font-mono align-top">{formatNumber(item.pricePerUnit)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-400 align-top">
                    {item.discount > 0 ? formatNumber(item.discount) : '-'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 align-top">
                    {formatNumber(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Thai Baht Text */}
        <div className="grid grid-cols-2 gap-3 my-2.5 print-avoid-break">
          
          {/* Left: Baht Text Box & Notes & Bank Transfer */}
          <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            doc.type === 'DELIVERY_ORDER' 
              ? 'bg-indigo-50/60 border-indigo-100 text-indigo-950' 
              : 'bg-rose-50/50 border-rose-100 text-rose-950'
          }`}>
            <div>
              <span className={`text-[9.5px] font-bold uppercase tracking-wider block ${
                doc.type === 'DELIVERY_ORDER' ? 'text-indigo-800' : 'text-rose-800'
              }`}>
                จำนวนเงินตัวอักษร (Baht Text)
              </span>
              <p className={`text-[11.5px] font-bold mt-0.5 font-serif ${
                doc.type === 'DELIVERY_ORDER' ? 'text-indigo-900' : 'text-rose-900'
              }`}>
                ({thaiBahtText})
              </p>
            </div>
            
            <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-200/70 text-[9.5px] text-slate-600">
              {/* Bank payment & PromptPay info for Sales documents */}
              {['QUOTATION', 'INVOICE', 'TAX_INVOICE'].includes(doc.type) && (
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-2.5">
                  <div className="font-mono text-[9px] text-slate-700 space-y-0.5 min-w-0 flex-1">
                    <span className="font-bold text-slate-900 block font-sans flex items-center gap-1 text-[9.5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      การชำระเงิน / Payment:
                    </span>
                    <div className="text-slate-800 flex items-center gap-1">
                      <span>• Kasikorn Bank (กสิกรไทย):</span>
                      <strong className="font-mono text-slate-950 font-bold bg-slate-50 px-1 rounded border border-slate-200">1701912566</strong>
                    </div>
                    <div className="text-slate-800 flex items-center gap-1">
                      <span>• Siam Commercial Bank (ไทยพาณิชย์):</span>
                      <strong className="font-mono text-slate-950 font-bold bg-slate-50 px-1 rounded border border-slate-200">383-443-1293</strong>
                    </div>
                    <div className="text-slate-600 font-sans text-[8.5px] pt-0.5">
                      ชื่อบัญชี: <strong className="text-slate-900 font-bold">บริษัท วอร์สเกต จำกัด</strong>
                    </div>
                    <div className="text-emerald-700 font-semibold text-[8.5px]">PromptPay Tax ID: {company.taxId || '0135564010972'}</div>
                  </div>
                  <div className="shrink-0 text-center bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <img 
                      src={getPromptPayQrUrl(company.taxId || '0135564010972', doc.netPayment || doc.grandTotal)} 
                      alt="PromptPay QR"
                      className="w-16 h-16 object-contain rounded"
                    />
                    <span className="text-[7.5px] font-bold text-slate-600 block mt-0.5 font-mono">
                      สแกนจ่าย {formatMoney(doc.netPayment || doc.grandTotal)}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700">หมายเหตุ / เงื่อนไข: </span>
                <span>{doc.notes || '-'}</span>
              </div>
              <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                <span>* เอกสารออกเป็นชุด (Issued in sets)</span>
                <span className="font-semibold text-slate-700">
                  {isOriginal ? 'ต้นฉบับสำหรับลูกค้า' : 'สำเนาสำหรับบันทึกบัญชีและการเงิน'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Total Calculation Table */}
          <div className="space-y-0.5 font-mono text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-600 font-sans text-[10.5px]">รวมเป็นเงิน (Subtotal):</span>
              <span className="font-semibold text-slate-900">{formatMoney(doc.subtotal)}</span>
            </div>
            {doc.discountTotal > 0 && (
              <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                <span className="text-slate-600 font-sans text-[10.5px]">ส่วนลดรวม (Discount):</span>
                <span className="text-rose-600">-{formatMoney(doc.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-600 font-sans text-[10.5px]">ภาษีมูลค่าเพิ่ม VAT 7%:</span>
              <span className="font-semibold text-slate-900">{formatMoney(doc.vatAmount)}</span>
            </div>
            <div className="flex justify-between py-0.5 text-xs font-bold">
              <span className="text-slate-900 font-sans">จำนวนเงินรวมทั้งสิ้น (Grand Total):</span>
              <span className={doc.type === 'DELIVERY_ORDER' ? 'text-indigo-700' : 'text-rose-700'}>
                {formatMoney(doc.grandTotal)}
              </span>
            </div>
            {doc.withholdingTaxTotal > 0 && (
              <div className="flex justify-between py-0.5 text-rose-600 text-[10.5px] border-t border-slate-200/60">
                <span className="font-sans">หัก ภาษี ณ ที่จ่าย (Withholding Tax 3%):</span>
                <span>-{formatMoney(doc.withholdingTaxTotal)}</span>
              </div>
            )}
            <div className={`flex justify-between py-1 px-2.5 rounded-lg font-bold text-xs mt-1 ${
              doc.type === 'DELIVERY_ORDER' ? 'bg-indigo-950 text-white' : 'bg-slate-900 text-white'
            }`}>
              <span className="font-sans text-[11px]">ยอดชำระสุทธิ (Net Payment):</span>
              <span className="text-emerald-400 font-bold">{formatMoney(doc.netPayment || doc.grandTotal)}</span>
            </div>
          </div>

        </div>

        {/* Official Signature Boxes (Space Optimized & Modern) */}
        {doc.type === 'DELIVERY_ORDER' ? (
          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-[10.5px] print-avoid-break">
            <div className="space-y-4">
              <p className="text-slate-600 font-medium">ผู้ส่งของ / เจ้าหน้าที่จัดส่ง</p>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto" />
              <div>
                <p className="font-semibold text-slate-800">ผู้ส่งมอบสินค้า</p>
                <span className="text-[9.5px] text-slate-400 block font-mono">วันที่ ...... / ...... / ..........</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 font-medium truncate">ในนาม {doc.contact?.companyName || 'ผู้รับสินค้า'}</p>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto" />
              <div>
                <p className="font-semibold text-slate-800">ผู้รับสินค้า / ตรวจรับของ</p>
                <span className="text-[9.5px] text-slate-400 block font-mono">วันที่ ...... / ...... / ..........</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 font-medium">ในนาม {company.name}</p>
              <div className="relative w-32 mx-auto">
                <div className="border-b border-dashed border-slate-300 w-full" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-rose-600 font-serif italic text-[10px] font-bold opacity-85 rotate-[-4deg] border border-rose-500 px-1.5 py-0.2 rounded bg-white/90">
                  WARSGATE AUTOMATION
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{company.authorizedSignatory}</p>
                <span className="text-[9.5px] text-slate-500 block">{company.signatoryPosition}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-[10.5px] print-avoid-break">
            <div className="space-y-4">
              <p className="text-slate-600 font-medium truncate">
                ในนาม {doc.contact?.companyName || (doc.type === 'PURCHASE_ORDER' ? 'ผู้จำหน่าย' : 'ลูกค้า')}
              </p>
              <div className="border-b border-dashed border-slate-300 w-40 mx-auto" />
              <div>
                <p className="font-semibold text-slate-800">
                  {doc.type === 'PURCHASE_ORDER' 
                    ? 'ผู้รับใบสั่งซื้อ / ผู้จำหน่าย' 
                    : ['PURCHASE_INVOICE', 'PAYMENT_VOUCHER'].includes(doc.type)
                    ? 'ผู้รับเงิน / ผู้ให้บริการ'
                    : 'ผู้รับบริการ / ลูกค้า'}
                  {!isOriginal && <span className="text-[9.5px] text-slate-500 font-normal"> (สำเนา)</span>}
                </p>
                <span className="text-[9.5px] text-slate-400 block font-mono">วันที่ ...... / ...... / ..........</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 font-medium">ในนาม {company.name}</p>
              <div className="relative w-40 mx-auto">
                <div className="border-b border-dashed border-slate-300 w-full" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-rose-600 font-serif italic text-[10px] font-bold opacity-85 rotate-[-4deg] border border-rose-500 px-1.5 py-0.2 rounded bg-white/90">
                  WARSGATE AUTOMATION
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{company.authorizedSignatory}</p>
                <span className="text-[9.5px] text-slate-500 block">
                  {doc.type === 'PURCHASE_ORDER' ? 'ผู้มีอำนาจสั่งซื้อ / กรรมการผู้จัดการ' : company.signatoryPosition}
                </span>
                {!isOriginal && (
                  <span className="text-[8.5px] text-slate-400 block mt-0.5 font-sans">
                    * สำเนาสำหรับเก็บเป็นหลักฐานทางบัญชี (Accounting Copy)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-white px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
              {doc.documentNo}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {title.main}
            </span>

            {/* Document Copy Switcher (ต้นฉบับ / สำเนา) */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs shadow-inner">
              <button
                type="button"
                onClick={() => setCopyMode('BOTH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  copyMode === 'BOTH'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="รวมต้นฉบับและสำเนาครบชุด 2 หน้าในไฟล์เดียวกัน"
              >
                <span>📑 ชุด 2 หน้า (ต้นฉบับ + สำเนา)</span>
              </button>
              <button
                type="button"
                onClick={() => setCopyMode('ORIGINAL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  copyMode === 'ORIGINAL'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="เฉพาะต้นฉบับสำหรับลูกค้า"
              >
                <span>📄 ต้นฉบับ</span>
              </button>
              <button
                type="button"
                onClick={() => setCopyMode('COPY')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  copyMode === 'COPY'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="เฉพาะสำเนาสำหรับฝ่ายบัญชี"
              >
                <span>📄 สำเนา</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onGeneratePoFromQuotation && doc.type === 'QUOTATION' && (
              <button
                onClick={() => onGeneratePoFromQuotation(doc)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-800 font-bold text-xs border border-indigo-300 flex items-center gap-1.5 transition shadow-sm"
                title="สร้างใบสั่งซื้อ (PO) พาร์ทจาก BOM สำหรับโครงการตามใบเสนอราคานี้"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>🛒 สร้าง PO จาก BOM</span>
              </button>
            )}
            {onIssueReceipt && (doc.type === 'INVOICE' || doc.type === 'TAX_INVOICE') && (
              <button
                onClick={() => onIssueReceipt(doc)}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1.5 transition shadow-sm"
                title="ออกใบเสร็จรับเงินจากใบแจ้งหนี้นี้"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>📑 ออกใบเสร็จ</span>
              </button>
            )}
            {['TAX_INVOICE', 'INVOICE', 'RECEIPT'].includes(doc.type) && (
              <button
                onClick={() => downloadEtaxXml(doc, company)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5 transition shadow-sm"
                title="ดาวน์โหลดไฟล์ XML ตามมาตรฐาน e-Tax Invoice ของกรมสรรพากร และ ETDA"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚡ e-Tax XML</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-glow transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>
                {copyMode === 'BOTH' ? 'พิมพ์ชุด 2 หน้า (ต้นฉบับ+สำเนา) / PDF' : copyMode === 'ORIGINAL' ? 'พิมพ์ต้นฉบับ / PDF' : 'พิมพ์สำเนา / PDF'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
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
            <div id="printable-document-content" className="space-y-6 print:space-y-0">
              {copyMode === 'BOTH' ? (
                <>
                  {renderDocumentSheet('ORIGINAL')}

                  {/* Page Break Separator between Original and Copy */}
                  <div className="no-print my-6 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-slate-800 text-slate-200 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>📄 หน้าที่ 2: สำเนา (COPY) - สำหรับฝ่ายบัญชี / ผู้ออกเอกสาร</span>
                    </div>
                  </div>
                  <div className="page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />

                  {renderDocumentSheet('COPY')}
                </>
              ) : copyMode === 'ORIGINAL' ? (
                renderDocumentSheet('ORIGINAL')
              ) : (
                renderDocumentSheet('COPY')
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
