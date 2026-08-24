import React from 'react';
import { AccountingDocument, CompanyProfile } from '../types';
import { formatNumber, formatThaiDate, arabicToThaiBahtText } from '../utils/formatters';

interface WhtCertificateViewProps {
  document: AccountingDocument;
  company: CompanyProfile;
}

// Helper to render 13-digit Tax ID box series
const TaxIdBoxes: React.FC<{ taxId: string }> = ({ taxId }) => {
  const clean = (taxId || '').replace(/\D/g, '').padEnd(13, ' ');
  const digits = clean.slice(0, 13).split('');

  return (
    <div className="inline-flex items-center gap-0.5 font-mono text-[11px] font-bold text-slate-900">
      {digits.map((d, i) => (
        <React.Fragment key={i}>
          <span className="w-4 h-5 border border-slate-700 flex items-center justify-center bg-white">
            {d.trim()}
          </span>
          {(i === 0 || i === 4 || i === 9 || i === 11) && <span className="text-slate-500 mx-0.5">-</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export const WhtCertificateView: React.FC<WhtCertificateViewProps> = ({ document: doc, company }) => {
  const isPayerCompany = doc.type === 'PURCHASE_ORDER' || doc.type === 'PURCHASE_INVOICE' || doc.type === 'PAYMENT_VOUCHER' || doc.type === 'WHT_CERTIFICATE';

  // Payer (ผู้มีหน้าที่หักภาษี ณ ที่จ่าย)
  const payer = isPayerCompany
    ? {
        name: company.name,
        taxId: company.taxId,
        address: company.address,
      }
    : {
        name: doc.contact?.companyName || doc.contact?.name || '-',
        taxId: doc.contact?.taxId || '',
        address: doc.contact?.address || '-',
      };

  // Payee (ผู้ถูกหักภาษี ณ ที่จ่าย)
  const payee = isPayerCompany
    ? {
        name: doc.contact?.companyName || doc.contact?.name || '-',
        taxId: doc.contact?.taxId || '',
        address: doc.contact?.address || '-',
        isJuristic: (doc.contact?.taxId || '').length === 13,
      }
    : {
        name: company.name,
        taxId: company.taxId,
        address: company.address,
        isJuristic: true,
      };

  const whtAmount = doc.withholdingTaxTotal || 0;
  const whtBahtText = arabicToThaiBahtText(whtAmount);

  // Determine income row details
  // By default, services/contracts fall under Row 5 (มาตรา 3 เตรส / ค่าจ้างทำของ ค่าบริการ)
  const paymentAmount = doc.subtotal || doc.grandTotal || 0;

  return (
    <div className="max-w-[210mm] mx-auto bg-white text-slate-900 p-6 md:p-8 rounded-lg shadow-xl print-shadow-none text-[11px] leading-tight font-sans border border-slate-400">
      
      {/* ── Form Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b border-slate-700 pb-2 mb-2">
        <div className="text-[9px] text-slate-600 space-y-0.5">
          <p className="font-semibold">ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมกับแบบแสดงรายการภาษี)</p>
          <p className="font-semibold">ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)</p>
        </div>
        <div className="text-right text-[10px] font-mono">
          <p>เล่มที่ ..............................</p>
          <p>เลขที่ <strong className="text-slate-900 underline font-bold">{doc.documentNo}</strong></p>
        </div>
      </div>

      <div className="text-center my-2">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          หนังสือรับรองการหักภาษี ณ ที่จ่าย
        </h1>
        <h2 className="text-xs font-semibold text-slate-700">
          ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร
        </h2>
      </div>

      {/* ── Main Form Frame ─────────────────────────────────────────────────── */}
      <div className="border-2 border-slate-800 divide-y divide-slate-800 mt-3 text-[10px]">

        {/* 1. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย */}
        <div className="p-2 space-y-1 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-bold text-slate-900">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย : -</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
              <TaxIdBoxes taxId={payer.taxId} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">ชื่อ :</span>
            <span className="font-bold text-slate-900 border-b border-dotted border-slate-600 flex-1 px-1">
              {payer.name}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 pl-8">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</p>
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">ที่อยู่ :</span>
            <span className="border-b border-dotted border-slate-600 flex-1 px-1 text-slate-800">
              {payer.address}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 pl-8">(ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</p>
        </div>

        {/* 2. ผู้ถูกหักภาษี ณ ที่จ่าย */}
        <div className="p-2 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-bold text-slate-900">ผู้ถูกหักภาษี ณ ที่จ่าย : -</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
              <TaxIdBoxes taxId={payee.taxId} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">ชื่อ :</span>
            <span className="font-bold text-slate-900 border-b border-dotted border-slate-600 flex-1 px-1">
              {payee.name}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 pl-8">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</p>
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">ที่อยู่ :</span>
            <span className="border-b border-dotted border-slate-600 flex-1 px-1 text-slate-800">
              {payee.address}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 pl-8">(ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</p>
        </div>

        {/* 3. ลำดับที่ในแบบ */}
        <div className="p-2 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-1">
            <span className="font-bold">ลำดับที่</span>
            <span className="border-b border-dotted border-slate-700 w-16 text-center font-mono">
              {doc.documentNo.replace(/\D/g, '').slice(-3) || '001'}
            </span>
            <span className="font-bold">ในแบบ</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px]">
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" readOnly checked={false} className="rounded" />
              <span>(1) ภ.ง.ด.1ก</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" readOnly checked={false} className="rounded" />
              <span>(2) ภ.ง.ด.1ก พิเศษ</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" readOnly checked={false} className="rounded" />
              <span>(3) ภ.ง.ด.2</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" readOnly checked={!payee.isJuristic} className="rounded" />
              <span className={!payee.isJuristic ? 'font-bold underline' : ''}>(4) ภ.ง.ด.3</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" readOnly checked={false} className="rounded" />
              <span>(5) ภ.ง.ด.2ก</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" readOnly checked={false} className="rounded" />
              <span>(6) ภ.ง.ด.3ก</span>
            </label>
            <label className="inline-flex items-center gap-1 font-bold">
              <input type="checkbox" readOnly checked={payee.isJuristic} className="rounded accent-slate-800" />
              <span className={payee.isJuristic ? 'font-bold underline text-slate-900' : ''}>(7) ภ.ง.ด.53</span>
            </label>
          </div>
        </div>

        {/* 4. ตารางประเภทเงินได้พึงประเมินที่จ่าย */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-100 font-bold text-center">
                <th className="py-2 px-2 border-r border-slate-800">ประเภทเงินได้พึงประเมินที่จ่าย</th>
                <th className="py-2 px-2 border-r border-slate-800 w-28">วัน เดือน หรือปีภาษีที่จ่าย</th>
                <th className="py-2 px-2 border-r border-slate-800 w-28">จำนวนเงินที่จ่าย</th>
                <th className="py-2 px-2 w-28">ภาษีที่หัก และนำส่งไว้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              <tr>
                <td className="p-1.5 border-r border-slate-800">1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)</td>
                <td className="p-1.5 border-r border-slate-800 text-center font-mono"></td>
                <td className="p-1.5 border-r border-slate-800 text-right font-mono"></td>
                <td className="p-1.5 text-right font-mono"></td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-slate-800">2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)</td>
                <td className="p-1.5 border-r border-slate-800 text-center font-mono"></td>
                <td className="p-1.5 border-r border-slate-800 text-right font-mono"></td>
                <td className="p-1.5 text-right font-mono"></td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-slate-800">3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)</td>
                <td className="p-1.5 border-r border-slate-800 text-center font-mono"></td>
                <td className="p-1.5 border-r border-slate-800 text-right font-mono"></td>
                <td className="p-1.5 text-right font-mono"></td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-slate-800">
                  4. (ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4)(ก)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;(ข) เงินปันผล เงินส่วนแบ่งของกำไร ฯลฯ ตามมาตรา 40 (4)(ข)
                </td>
                <td className="p-1.5 border-r border-slate-800 text-center font-mono"></td>
                <td className="p-1.5 border-r border-slate-800 text-right font-mono"></td>
                <td className="p-1.5 text-right font-mono"></td>
              </tr>
              <tr className="bg-amber-50/40">
                <td className="p-1.5 border-r border-slate-800">
                  <div className="font-bold text-slate-900">
                    5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากรที่ออกตามมาตรา 3 เตรส
                  </div>
                  <div className="text-[9px] text-slate-600">
                    (เช่น ค่าจ้างทำของ ค่าโฆษณา ค่าเช่า ค่าขนส่ง ค่าบริการวิศวกรรม ค่าเบี้ยประกันวินาศภัย ฯลฯ)
                  </div>
                  <div className="text-[9px] font-semibold text-rose-700 mt-0.5">
                    • {doc.items.map(i => i.name).join(', ')}
                  </div>
                </td>
                <td className="p-1.5 border-r border-slate-800 text-center font-mono align-middle font-semibold">
                  {formatThaiDate(doc.issueDate)}
                </td>
                <td className="p-1.5 border-r border-slate-800 text-right font-mono font-bold align-middle text-slate-900">
                  {formatNumber(paymentAmount)}
                </td>
                <td className="p-1.5 text-right font-mono font-bold align-middle text-rose-700">
                  {formatNumber(whtAmount)}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-slate-800">6. อื่นๆ (ระบุ) ..........................................................................</td>
                <td className="p-1.5 border-r border-slate-800 text-center font-mono"></td>
                <td className="p-1.5 border-r border-slate-800 text-right font-mono"></td>
                <td className="p-1.5 text-right font-mono"></td>
              </tr>

              {/* Total Row */}
              <tr className="border-t-2 border-slate-800 font-bold bg-slate-100">
                <td className="p-2 border-r border-slate-800 text-right font-bold text-[11px]">
                  รวมเงินที่จ่ายและภาษีที่หักนำส่ง
                </td>
                <td className="p-2 border-r border-slate-800 text-center"></td>
                <td className="p-2 border-r border-slate-800 text-right font-mono text-[11px] text-slate-900">
                  {formatNumber(paymentAmount)}
                </td>
                <td className="p-2 text-right font-mono text-[11px] text-rose-700">
                  {formatNumber(whtAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) */}
        <div className="p-2 bg-slate-50 flex items-center justify-between border-t border-slate-800 font-bold">
          <span>รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) :</span>
          <span className="text-sm text-slate-900 font-serif px-2 py-0.5 border border-slate-300 rounded bg-white font-bold">
            ({whtBahtText})
          </span>
        </div>

        {/* 6. เงินที่จ่ายเข้ากองทุน */}
        <div className="p-2 text-[9px] text-slate-600 space-x-3">
          <span>เงินที่จ่ายเข้า กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน .................. บาท</span>
          <span>กองทุนประกันสังคม .................. บาท</span>
          <span>กองทุนสำรองเลี้ยงชีพ .................. บาท</span>
        </div>

        {/* 7. ผู้จ่ายเงิน */}
        <div className="p-2 flex flex-wrap items-center gap-6 bg-slate-50/50">
          <span className="font-bold">ผู้จ่ายเงิน :</span>
          <label className="inline-flex items-center gap-1 font-bold">
            <input type="checkbox" readOnly checked={true} className="rounded accent-slate-800" />
            <span>(1) หัก ณ ที่จ่าย</span>
          </label>
          <label className="inline-flex items-center gap-1 text-slate-500">
            <input type="checkbox" readOnly checked={false} className="rounded" />
            <span>(2) ออกให้ตลอดไป</span>
          </label>
          <label className="inline-flex items-center gap-1 text-slate-500">
            <input type="checkbox" readOnly checked={false} className="rounded" />
            <span>(3) ออกให้ครั้งเดียว</span>
          </label>
          <label className="inline-flex items-center gap-1 text-slate-500">
            <input type="checkbox" readOnly checked={false} className="rounded" />
            <span>(4) อื่นๆ (ระบุ) ............................</span>
          </label>
        </div>

        {/* 8. คำเตือน & ลายมือชื่อ */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="p-3 text-[9px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">คำเตือน :</p>
            <p>
              ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร ต้องรับโทษทางอาญาตามมาตรา 35 แห่งประมวลรัษฎากร
            </p>
          </div>

          <div className="p-3 text-center space-y-2">
            <p className="text-[9px] text-slate-700">ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ</p>
            <div className="pt-6 border-b border-dotted border-slate-600 w-52 mx-auto" />
            <p className="text-[10px] font-bold text-slate-900">
              ลงชื่อ ({company.authorizedSignatory || 'ผู้มีอำนาจลงนาม'}) ผู้จ่ายเงิน
            </p>
            <p className="text-[9px] font-mono text-slate-600">
              วันที่ {formatThaiDate(doc.issueDate)}
            </p>
            <p className="text-[8px] text-slate-400">(วัน เดือน ปี ที่ออกหนังสือรับรองฯ)</p>
          </div>
        </div>

      </div>

      {/* ── Footer Note ────────────────────────────────────────────────────── */}
      <div className="mt-3 text-[8.5px] text-slate-500 space-y-0.5">
        <p><strong>หมายเหตุ</strong> เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)* หมายถึง</p>
        <p>1. กรณีบุคคลธรรมดาไทย ให้ใช้เลขประจำตัวประชาชนของกรมการปกครอง</p>
        <p>2. กรณีนิติบุคคล ให้ใช้เลขทะเบียนนิติบุคคลของกรมพัฒนาธุรกิจการค้า</p>
        <p>3. กรณีอื่นๆ นอกเหนือจาก 1. และ 2. ให้ใช้เลขประจำตัวผู้เสียภาษีอากร (13 หลัก) ของกรมสรรพากร</p>
      </div>

    </div>
  );
};
