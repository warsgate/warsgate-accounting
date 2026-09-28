import React, { useState } from 'react';
import { 
  X, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, 
  Loader2, RefreshCw, Layers, DollarSign, Calendar, Building, ShieldCheck, Tag
} from 'lucide-react';
import { AccountingDocument, DocumentType, Contact } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface AiOcrExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onSaveDocument: (doc: Partial<AccountingDocument>) => void;
}

interface ExtractedData {
  supplierName: string;
  taxId: string;
  docNo: string;
  date: string;
  projectName: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    amount: number;
  }>;
  subtotal: number;
  vatAmount: number;
  withholdingTaxTotal: number;
  grandTotal: number;
  category: string;
}

export const AiOcrExpenseModal: React.FC<AiOcrExpenseModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSaveDocument
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  
  const [extracted, setExtracted] = useState<ExtractedData>({
    supplierName: '',
    taxId: '',
    docNo: '',
    date: new Date().toISOString().split('T')[0],
    projectName: 'TSF (Line Assembly)',
    items: [],
    subtotal: 0,
    vatAmount: 0,
    withholdingTaxTotal: 0,
    grandTotal: 0,
    category: 'PART_AND_MATERIAL'
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setScanSuccess(false);

      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRunAiScan = () => {
    if (!file) return;
    setIsScanning(true);

    // High-precision AI OCR Simulation (Extracting structured data from bill / invoice)
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);

      const fileName = file.name.toLowerCase();
      let mockSupplier = 'บริษัท มิซูมิ (ประเทศไทย) จำกัด';
      let mockTaxId = '0105537025810';
      let mockDocNo = 'INV-' + Math.floor(100000 + Math.random() * 900000);
      let mockItems = [
        {
          name: 'Linear Guide Rail & Block (HSR25)',
          description: 'พาร์ทระบบสไลด์แกน Z สำหรับโปรเจกต์ประกอบเครื่อง',
          quantity: 2,
          unit: 'ชุด',
          pricePerUnit: 12500,
          amount: 25000
        },
        {
          name: 'Pneumatic Cylinder SMC 32x50mm',
          description: 'กระบอกลมตำแหน่งจับชิ้นงาน',
          quantity: 4,
          unit: 'ตัว',
          pricePerUnit: 1850,
          amount: 7400
        }
      ];

      if (fileName.includes('smc') || fileName.includes('pneumatic')) {
        mockSupplier = 'บริษัท เอสเอ็มซี (ประเทศไทย) จำกัด';
        mockTaxId = '0105536098711';
      } else if (fileName.includes('omron') || fileName.includes('sensor')) {
        mockSupplier = 'บริษัท ออมรอน อีเลคทรอนิคส์ จำกัด';
        mockTaxId = '0105533061234';
      }

      const subtotal = mockItems.reduce((s, i) => s + i.amount, 0);
      const vatAmount = subtotal * 0.07;
      const grandTotal = subtotal + vatAmount;

      setExtracted({
        supplierName: mockSupplier,
        taxId: mockTaxId,
        docNo: mockDocNo,
        date: new Date().toISOString().split('T')[0],
        projectName: 'TSF (Line Assembly)',
        items: mockItems,
        subtotal: subtotal,
        vatAmount: vatAmount,
        withholdingTaxTotal: 0,
        grandTotal: grandTotal,
        category: 'PART_AND_MATERIAL'
      });
    }, 1800);
  };

  const handleConfirmAndCreate = () => {
    // Find or construct contact
    let matchedContact = contacts.find(c => 
      c.taxId === extracted.taxId || 
      (c.companyName && extracted.supplierName && c.companyName.includes(extracted.supplierName))
    );

    if (!matchedContact) {
      matchedContact = {
        id: `supp-ai-${Date.now()}`,
        name: extracted.supplierName,
        companyName: extracted.supplierName,
        taxId: extracted.taxId || '0105500000000',
        isBranch: false,
        branchCode: '00000',
        address: 'สำนักงานใหญ่ (นำเข้าผ่านระบบ AI OCR)',
        phone: '02-000-0000',
        email: 'sales@supplier.co.th',
        type: 'SUPPLIER',
        creditDays: 30,
        totalTransactions: 1,
        balanceDue: extracted.grandTotal
      };
    }

    const newDoc: Partial<AccountingDocument> = {
      type: 'PURCHASE_INVOICE',
      documentNo: extracted.docNo,
      issueDate: extracted.date,
      dueDate: extracted.date,
      projectNote: extracted.projectName,
      contact: matchedContact,
      items: extracted.items.map((item, idx) => ({
        id: `item-ai-${idx}-${Date.now()}`,
        code: `AI-PART-${idx + 1}`,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        discount: 0,
        amount: item.amount,
        vatInclusive: false,
        withholdingTaxRate: 0
      })),
      subtotal: extracted.subtotal,
      discountTotal: 0,
      vatRate: 7,
      vatAmount: extracted.vatAmount,
      grandTotal: extracted.grandTotal,
      withholdingTaxTotal: extracted.withholdingTaxTotal,
      netPayment: extracted.grandTotal - extracted.withholdingTaxTotal,
      status: 'APPROVED',
      notes: `สร้างอัตโนมัติด้วย Warsgate AI OCR Scanner (หมวดหมู่: ${extracted.category})`,
      createdByName: 'AI Smart OCR Agent'
    };

    onSaveDocument(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>AI Smart OCR & Invoice Auto-Capture</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Gemini Vision 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                อัปโหลดรูปบิล/ใบเสร็จ/PDF เพื่อดึงข้อมูลเลขภาษี, ยอด VAT, รายการพาร์ทอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Upload & Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 text-center bg-indigo-50/40 transition flex flex-col items-center justify-center min-h-[220px] relative">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-100 text-indigo-600 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'ลากไฟล์รูปภาพ หรือ คลิกเพื่อเลือกบิล/ใบเสร็จ'}
                </p>
                <span className="text-xs text-slate-500 mt-1">
                  รองรับไฟล์ PNG, JPG, JPEG, PDF (ไม่เกิน 20MB)
                </span>
              </div>

              {filePreview && (
                <div className="rounded-2xl border border-slate-200 p-2 bg-slate-50 overflow-hidden max-h-48 flex items-center justify-center">
                  <img src={filePreview} alt="Bill Preview" className="max-h-44 object-contain rounded-xl shadow-xs" />
                </div>
              )}

              <button
                type="button"
                onClick={handleRunAiScan}
                disabled={!file || isScanning}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
                  !file 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isScanning
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังประมวลผลด้วย AI Vision...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>กดสแกนและดึงข้อมูลด้วย AI (Scan Bill)</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Col: Extracted Data Review & Form */}
            <div className="lg:col-span-7 bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  ผลการสแกนและดึงข้อมูล (Extracted Data)
                </span>
                {scanSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ดึงข้อมูลสำเร็จ 100%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-500 font-semibold mb-1">ชื่อผู้จำหน่าย / ร้านค้า</label>
                  <input 
                    type="text"
                    value={extracted.supplierName}
                    onChange={e => setExtracted({...extracted, supplierName: e.target.value})}
                    placeholder="เช่น บริษัท มิซูมิ (ประเทศไทย) จำกัด"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-500 font-semibold mb-1">เลขประจำตัวผู้เสียภาษี 13 หลัก</label>
                  <input 
                    type="text"
                    value={extracted.taxId}
                    onChange={e => setExtracted({...extracted, taxId: e.target.value})}
                    placeholder="0105537025810"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-500 font-semibold mb-1">เลขที่บิล / ใบแจ้งหนี้</label>
                  <input 
                    type="text"
                    value={extracted.docNo}
                    onChange={e => setExtracted({...extracted, docNo: e.target.value})}
                    placeholder="INV-990812"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-500 font-semibold mb-1">วันที่เอกสาร</label>
                  <input 
                    type="date"
                    value={extracted.date}
                    onChange={e => setExtracted({...extracted, date: e.target.value})}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1">ผูกเข้าโครงการ (Project Allocation)</label>
                  <input 
                    type="text"
                    value={extracted.projectName}
                    onChange={e => setExtracted({...extracted, projectName: e.target.value})}
                    placeholder="เช่น TSF (Line Assembly), PNP Site"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 block mb-2">รายการสินค้า / อะไหล่ที่ตรวจพบ:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-1.5 px-3 text-left">รายการ</th>
                        <th className="py-1.5 px-2 text-center w-14">จำนวน</th>
                        <th className="py-1.5 px-3 text-right w-24">รวมเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extracted.items.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400 italic">
                            กดปุ่มสแกนด้านซ้ายเพื่อดึงรายการพาร์ท
                          </td>
                        </tr>
                      ) : (
                        extracted.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-800">{item.name}</div>
                              <div className="text-[10px] text-slate-400">{item.description}</div>
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-600">{item.quantity} {item.unit}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatMoney(item.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">ยอดก่อน VAT:</span>
                  <span>{formatMoney(extracted.subtotal)} บาท</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span>{formatMoney(extracted.vatAmount)} บาท</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-indigo-900 pt-1 border-t border-slate-100">
                  <span className="font-sans">ยอดรวมสุทธิ (Grand Total):</span>
                  <span className="text-indigo-600">{formatMoney(extracted.grandTotal)} บาท</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ระบบจะสร้างเป็นใบแจ้งหนี้ซื้อ (Purchase Invoice) ลงบัญชีให้อัตโนมัติ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirmAndCreate}
              disabled={extracted.grandTotal === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md ${
                extracted.grandTotal === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกและสร้างเอกสารซื้อทันที</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
