import React, { useState } from 'react';
import { Settings, Building2, Phone, MapPin, Hash, ChevronRight, Save, Trash2, AlertTriangle } from 'lucide-react';
import { CompanyProfile } from '../../types';

interface SettingsViewProps {
  company: CompanyProfile;
  onUpdateCompany: (c: CompanyProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ company, onUpdateCompany }) => {
  const [form, setForm] = useState<CompanyProfile>(company);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAllData = () => {
    localStorage.removeItem('warsgate_documents');
    localStorage.removeItem('warsgate_contacts');
    localStorage.removeItem('warsgate_products');
    setShowClearConfirm(false);
    window.location.reload();
  };

  const settingSections = [
    { label: 'ข้อมูลองค์กร & ระบบบัญชี', icon: Building2, active: true },
    { label: 'การตั้งค่าเลขที่เอกสารรัน', icon: Hash, active: false },
    { label: 'ผู้ใช้งานและสิทธิ์', icon: Settings, active: false },
    { label: 'การเชื่อมต่อ API กรมสรรพากร', icon: Settings, active: false },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-500" />
          <span>การตั้งค่าระบบ (System Settings)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">จัดการข้อมูลบริษัท, เลขประจำตัวผู้เสียภาษี, และการตั้งค่าเอกสารบัญชี</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Nav */}
        <div className="space-y-1.5">
          {settingSections.map((section, i) => {
            const Icon = section.icon;
            return (
              <button key={i} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left text-xs font-semibold transition ${
                section.active
                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${section.active ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span>{section.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${section.active ? 'text-rose-400' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-3">
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

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                  ชื่อบริษัท / กิจการ
                </label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30" />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                  ที่อยู่สำนักงานใหญ่ / สำหรับใบกำกับภาษี
                </label>
                <textarea rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 resize-none focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    <Hash className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                    เลขประจำตัวผู้เสียภาษี 13 หลัก
                  </label>
                  <input type="text" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono font-bold focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">รหัสสาขา</label>
                  <input type="text" value={form.branchCode} onChange={e => setForm({ ...form, branchCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                    ผู้มีอำนาจลงนาม (MD / Managing Director)
                  </label>
                  <input type="text" value={form.authorizedSignatory} onChange={e => setForm({ ...form, authorizedSignatory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">เบอร์โทรศัพท์</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  {saved && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      บันทึกข้อมูลเรียบร้อยแล้ว ✓
                    </span>
                  )}
                </div>
                <button type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-100 flex items-center gap-2 transition active:scale-95">
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Danger Zone ────────────────────────────────────────────────────── */}
      <div className="mt-2 p-5 rounded-2xl border-2 border-rose-200 bg-rose-50 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h3 className="font-bold text-rose-700 text-sm">Danger Zone — ล้างข้อมูลระบบ</h3>
        </div>
        <p className="text-xs text-rose-600">
          ล้างข้อมูลเอกสาร, ผู้ติดต่อ และสินค้า/บริการทั้งหมดออกจากระบบ (ข้อมูลบริษัทจะยังคงอยู่)
        </p>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs flex items-center gap-2 transition"
        >
          <Trash2 className="w-4 h-4" />
          ล้างข้อมูลทั้งหมด
        </button>
      </div>

      {/* ─── Confirm Dialog ─────────────────────────────────────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการล้างข้อมูล</h3>
                <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs">
              <p className="font-bold text-rose-700">ข้อมูลที่จะถูกลบ:</p>
              <ul className="text-rose-600 space-y-1 list-disc list-inside">
                <li>เอกสารทั้งหมด (ใบเสนอราคา, ใบแจ้งหนี้, ใบกำกับภาษี ฯลฯ)</li>
                <li>รายชื่อผู้ติดต่อทั้งหมด</li>
                <li>รายการสินค้าและบริการทั้งหมด</li>
              </ul>
              <p className="text-emerald-600 font-semibold mt-2">✓ ข้อมูลบริษัทจะยังคงอยู่</p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้างข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
