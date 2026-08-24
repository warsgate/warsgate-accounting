import React, { useState } from 'react';
import { Settings, Building2, Phone, MapPin, Hash, ChevronRight, Save, Trash2, AlertTriangle, FileText, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { CompanyProfile, DocumentNumberingConfig, DocumentType } from '../../types';
import { defaultNumberingConfig, previewDocumentNo } from '../../utils/numbering';

interface SettingsViewProps {
  company: CompanyProfile;
  onUpdateCompany: (c: CompanyProfile) => void;
  numberingConfig?: DocumentNumberingConfig;
  onUpdateNumberingConfig?: (cfg: DocumentNumberingConfig) => void;
}

const DOCUMENT_LABELS: Record<DocumentType, { name: string; desc: string; category: string; badgeColor: string }> = {
  QUOTATION: { name: 'ใบเสนอราคา (Quotation)', desc: 'เอกสารเสนอราคาสินค้า/บริการให้ลูกค้า', category: 'รายรับ (Sales)', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  INVOICE: { name: 'ใบแจ้งหนี้ (Invoice)', desc: 'เอกสารแจ้งยอดชำระและวางบิล', category: 'รายรับ (Sales)', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  TAX_INVOICE: { name: 'ใบกำกับภาษี (Tax Invoice)', desc: 'เอกสารใบกำกับภาษีขาย (VAT 7%)', category: 'รายรับ (Sales)', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RECEIPT: { name: 'ใบเสร็จรับเงิน (Receipt)', desc: 'เอกสารยืนยันการรับชำระเงิน', category: 'รายรับ (Sales)', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PURCHASE_ORDER: { name: 'ใบสั่งซื้อ (Purchase Order)', desc: 'เอกสารสั่งซื้อสินค้า/บริการจากซัพพลายเออร์', category: 'รายจ่าย (Expenses)', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  PURCHASE_INVOICE: { name: 'ใบแจ้งหนี้ค่าใช้จ่าย (Purchase Invoice)', desc: 'เอกสารบันทึกค่าใช้จ่ายและใบกำกับภาษีซื้อ', category: 'รายจ่าย (Expenses)', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  PAYMENT_VOUCHER: { name: 'ใบสำคัญจ่าย (Payment Voucher)', desc: 'เอกสารหลักฐานการจ่ายเงิน', category: 'รายจ่าย (Expenses)', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  WHT_CERTIFICATE: { name: 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)', desc: 'เอกสารรับรองภาษีหัก ณ ที่จ่าย', category: 'ภาษี (Tax)', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  company,
  onUpdateCompany,
  numberingConfig: propNumberingConfig,
  onUpdateNumberingConfig
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'numbering' | 'danger'>('company');

  // Company Form State
  const [form, setForm] = useState<CompanyProfile>(company);
  const [companySaved, setCompanySaved] = useState(false);

  // Numbering Form State
  const [numbering, setNumbering] = useState<DocumentNumberingConfig>(() => {
    if (propNumberingConfig) return propNumberingConfig;
    const saved = localStorage.getItem('warsgate_doc_numbering');
    return saved ? JSON.parse(saved) : defaultNumberingConfig;
  });
  const [numberingSaved, setNumberingSaved] = useState(false);

  // Clear data modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(form);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const handleSaveNumbering = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('warsgate_doc_numbering', JSON.stringify(numbering));
    if (onUpdateNumberingConfig) {
      onUpdateNumberingConfig(numbering);
    }
    setNumberingSaved(true);
    setTimeout(() => setNumberingSaved(false), 3000);
  };

  const handleNumberingFieldChange = (
    type: DocumentType,
    field: keyof DocumentNumberingConfig[DocumentType],
    value: any
  ) => {
    setNumbering(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleResetNumberingToDefault = () => {
    setNumbering(defaultNumberingConfig);
    localStorage.setItem('warsgate_doc_numbering', JSON.stringify(defaultNumberingConfig));
    if (onUpdateNumberingConfig) {
      onUpdateNumberingConfig(defaultNumberingConfig);
    }
  };

  const handleClearAllData = () => {
    localStorage.removeItem('warsgate_documents');
    localStorage.removeItem('warsgate_contacts');
    localStorage.removeItem('warsgate_products');
    setShowClearConfirm(false);
    window.location.reload();
  };

  const navItems = [
    { id: 'company' as const, label: 'ข้อมูลองค์กร & บริษัท', icon: Building2, subtitle: 'Tax ID, ที่อยู่, ผู้มีอำนาจลงนาม' },
    { id: 'numbering' as const, label: 'การตั้งค่าเลขที่เอกสารรัน', icon: Hash, subtitle: 'กำหนด Prefix, รูปแบบวันที่, ลำดับรัน' },
    { id: 'danger' as const, label: 'จัดการฐานข้อมูล & ล้างระบบ', icon: AlertTriangle, subtitle: 'รีเซ็ตข้อมูลทดสอบทั้งหมด' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-500" />
          <span>การตั้งค่าระบบ (System Settings)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">จัดการข้อมูลบริษัท, เลขประจำตัวผู้เสียภาษี, และการตั้งค่าเลขรันเอกสารบัญชี</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Nav */}
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
                  isActive
                    ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition ${
                    isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`block text-xs font-bold ${isActive ? 'text-rose-700' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-3">

          {/* ─── TAB 1: Company Profile ────────────────────────────────────── */}
          {activeTab === 'company' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6">

              {/* Preview Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 flex items-center gap-5 text-white shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 p-1">
                  <img src="/warsgate-logo-white.png" alt="WARSGATE" className="h-12 w-auto object-contain" />
                </div>
                <div>
                  <h2 className="font-bold text-base">{form.name}</h2>
                  <p className="text-xs text-rose-100 mt-0.5">{form.address}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-rose-100">
                    <span>Tax ID: {form.taxId}</span>
                    <span>|</span>
                    <span>{form.phone}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                    ชื่อบริษัท / กิจการ (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    ชื่อบริษัท (English)
                  </label>
                  <input
                    type="text"
                    value={form.nameEn || ''}
                    onChange={e => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="WARSGATE CO., LTD."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                    ที่อยู่สำนักงานใหญ่ / สำหรับออกใบกำกับภาษี
                  </label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 resize-none focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      <Hash className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                      เลขประจำตัวผู้เสียภาษี 13 หลัก
                    </label>
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={e => setForm({ ...form, taxId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono font-bold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">รหัสสาขา</label>
                    <input
                      type="text"
                      value={form.branchCode}
                      onChange={e => setForm({ ...form, branchCode: e.target.value })}
                      placeholder="00000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      ผู้มีอำนาจลงนาม (MD / Managing Director)
                    </label>
                    <input
                      type="text"
                      value={form.authorizedSignatory}
                      onChange={e => setForm({ ...form, authorizedSignatory: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    {companySaved && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        บันทึกข้อมูลเรียบร้อยแล้ว ✓
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-100 flex items-center gap-2 transition active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าองค์กร</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── TAB 2: Document Numbering Configuration ────────────────────── */}
          {activeTab === 'numbering' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-rose-600" />
                    <span>การตั้งค่าเลขที่เอกสารรันอัตโนมัติ (Document Running Number)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    กำหนดรูปแบบคำนำหน้า, รูปแบบวันที่, จำนวนหลัก, และลำดับเลขที่เริ่มต้นสำหรับเอกสารแต่ละประเภท
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetNumberingToDefault}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="รีเซ็ตเป็นค่าเริ่มต้น"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>
              </div>

              <form onSubmit={handleSaveNumbering} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((type) => {
                    const info = DOCUMENT_LABELS[type];
                    const cfg = numbering[type] || defaultNumberingConfig[type];
                    const preview = previewDocumentNo(cfg);

                    return (
                      <div
                        key={type}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{info.name}</div>
                            <span className="text-[10px] text-slate-400 block">{info.desc}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${info.badgeColor}`}>
                            {info.category}
                          </span>
                        </div>

                        {/* Live Preview Display */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> ตัวอย่างเลขที่:
                          </span>
                          <span className="font-mono font-bold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {preview}
                          </span>
                        </div>

                        {/* Configuration Inputs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">คำนำหน้า (Prefix)</label>
                            <input
                              type="text"
                              value={cfg.prefix}
                              onChange={e => handleNumberingFieldChange(type, 'prefix', e.target.value)}
                              placeholder="QT"
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono font-bold text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">รูปแบบวันที่</label>
                            <select
                              value={cfg.dateFormat}
                              onChange={e => handleNumberingFieldChange(type, 'dateFormat', e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            >
                              <option value="YYYYMM">202608 (YYYYMM)</option>
                              <option value="YYMM">2608 (YYMM)</option>
                              <option value="YYYY">2026 (YYYY)</option>
                              <option value="NONE">ไม่มีวันที่</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">จำนวนหลัก</label>
                            <select
                              value={cfg.digits}
                              onChange={e => handleNumberingFieldChange(type, 'digits', Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            >
                              <option value={3}>3 หลัก (001)</option>
                              <option value={4}>4 หลัก (0001)</option>
                              <option value={5}>5 หลัก (00001)</option>
                              <option value={6}>6 หลัก (000001)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">เลขถัดไป</label>
                            <input
                              type="number"
                              min={1}
                              value={cfg.nextNumber}
                              onChange={e => handleNumberingFieldChange(type, 'nextNumber', Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono font-bold text-slate-800 text-center focus:outline-none focus:border-rose-400"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    {numberingSaved && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        บันทึกการตั้งค่าเลขรันเอกสารเรียบร้อยแล้ว ✓
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-100 flex items-center gap-2 transition active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าเลขรันเอกสาร</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── TAB 3: Danger Zone ────────────────────────────────────────── */}
          {activeTab === 'danger' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-900">ล้างข้อมูลทั้งหมดในระบบ (Reset All Data)</h3>
                    <p className="text-xs text-rose-600 mt-0.5">
                      ลบข้อมูลเอกสาร, ผู้ติดต่อ, และรายการสินค้าทั้งหมดออกจากเบราว์เซอร์ และโหลดข้อมูลตั้งต้นใหม่
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ล้างข้อมูลในระบบทิ้งทั้งหมด</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการล้างข้อมูลทั้งหมด?</h3>
                <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้จะลบข้อมูลเอกสาร ผู้ติดต่อ และสินค้าทั้งหมด</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              ⚠️ ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้ ระบบจะทำการรีโหลดหน้าเว็บและเริ่มใหม่อีกครั้ง
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleClearAllData}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-100 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันล้างข้อมูลทิ้งทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
