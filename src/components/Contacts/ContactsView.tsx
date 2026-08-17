import React, { useState } from 'react';
import {
  Users, Plus, Search, Phone, Mail, FileText,
  Loader2, CheckCircle2, XCircle, ShieldCheck,
  Pencil, Trash2, Building2, MapPin, AlertTriangle
} from 'lucide-react';
import { Contact } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface ContactsViewProps {
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
}

interface RDResult {
  success: boolean;
  message?: string;
  taxId?: string;
  primary?: {
    nid: string;
    titleName: string;
    name: string;
    fullName: string;
    branchCode: string;
    branchLabel: string;
    address: string;
    province: string;
    amphur: string;
    thambol: string;
    postCode: string;
    businessFirstDate: string;
  };
}

type FormData = {
  companyName: string;
  name: string;
  taxId: string;
  branchCode: string;
  address: string;
  phone: string;
  email: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  creditDays: number;
};

const emptyForm: FormData = {
  companyName: '', name: '', taxId: '', branchCode: '00000',
  address: '', phone: '', email: '', type: 'CUSTOMER' as 'CUSTOMER' | 'SUPPLIER' | 'BOTH', creditDays: 30
};

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts, onAddContact, onUpdateContact, onDeleteContact
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');

  // Modal states
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  // RD Lookup
  const [rdLoading, setRdLoading] = useState(false);
  const [rdResult, setRdResult] = useState<RDResult | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredContacts = contacts.filter(c => {
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.taxId.includes(q)
      );
    }
    return true;
  });

  // ── Open Add Modal ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(emptyForm);
    setRdResult(null);
    setEditingContact(null);
    setModalMode('add');
  };

  // ── Open Edit Modal ────────────────────────────────────────────────────────
  const openEdit = (contact: Contact) => {
    setFormData({
      companyName: contact.companyName,
      name: contact.name,
      taxId: contact.taxId,
      branchCode: contact.branchCode,
      address: contact.address || '',
      phone: contact.phone,
      email: contact.email,
      type: (contact.type === 'BOTH' ? 'CUSTOMER' : contact.type) as 'CUSTOMER' | 'SUPPLIER' | 'BOTH',
      creditDays: contact.creditDays,
    });
    setRdResult(null);
    setEditingContact(contact);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingContact(null);
    setFormData(emptyForm);
    setRdResult(null);
  };

  // ── RD Lookup ──────────────────────────────────────────────────────────────
  const handleRDLookup = async () => {
    const cleanId = formData.taxId.replace(/[-\s]/g, '');
    if (cleanId.length !== 13) {
      setRdResult({ success: false, message: 'กรุณากรอกเลขผู้เสียภาษี 13 หลักให้ครบ' });
      return;
    }
    setRdLoading(true);
    setRdResult(null);
    try {
      const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3010';
      const resp = await fetch(`${proxyUrl}/api/rd/vat/${cleanId}`);
      const data: RDResult = await resp.json();
      setRdResult(data);
      if (data.success && data.primary) {
        const p = data.primary;
        setFormData(prev => ({
          ...prev,
          companyName: p.fullName || prev.companyName,
          branchCode: p.branchCode || '00000',
          address: p.address || prev.address,
        }));
      }
    } catch {
      setRdResult({ success: false, message: 'ไม่สามารถเชื่อมต่อ Proxy Server — กรุณารัน: npm run proxy' });
    } finally {
      setRdLoading(false);
    }
  };

  // ── Submit Form ────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'edit' && editingContact) {
      onUpdateContact({
        ...editingContact,
        ...formData,
        isBranch: formData.branchCode !== '00000',
      });
    } else {
      onAddContact({
        id: `cont-${Date.now()}`,
        ...formData,
        isBranch: formData.branchCode !== '00000',
        totalTransactions: 0,
        balanceDue: 0,
      });
    }
    closeModal();
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (deleteTarget) {
      onDeleteContact(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const setField = (field: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" />
            <span>สมุดผู้ติดต่อ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            จัดการลูกค้าและซัพพลายเออร์ — ตรวจสอบ VAT จากกรมสรรพากรอัตโนมัติ
          </p>
        </div>
        <button onClick={openAdd}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-100 transition active:scale-95">
          <Plus className="w-4 h-4" />
          <span>+ เพิ่มผู้ติดต่อใหม่</span>
        </button>
      </div>

      {/* ── Summary Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'ทั้งหมด', count: contacts.length, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
          { label: 'ลูกค้า', count: contacts.filter(c => c.type === 'CUSTOMER').length, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
          { label: 'ซัพพลายเออร์', count: contacts.filter(c => c.type === 'SUPPLIER').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${s.bg} text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อบริษัท, ผู้ติดต่อ, เลขภาษี..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex items-center gap-2">
          {(['ALL', 'CUSTOMER', 'SUPPLIER'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                typeFilter === t ? 'bg-rose-50 border-rose-300 text-rose-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}>
              {t === 'ALL' ? 'ทั้งหมด' : t === 'CUSTOMER' ? '🧑‍💼 ลูกค้า' : '🏭 ซัพพลายเออร์'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contact Cards ──────────────────────────────────────────────────── */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">ไม่พบรายการผู้ติดต่อ</p>
          <p className="text-xs mt-1">ลองเปลี่ยน filter หรือเพิ่มผู้ติดต่อใหม่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="glass-card glass-card-hover p-5 rounded-2xl space-y-3 group relative">

              {/* Action buttons — โชว์เมื่อ hover */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(contact)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition shadow-sm"
                  title="แก้ไข"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(contact)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition shadow-sm"
                  title="ลบ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card Content */}
              <div className="flex items-start gap-3 pr-16">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  contact.type === 'CUSTOMER'
                    ? 'bg-sky-100 text-sky-700 border border-sky-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {contact.companyName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    contact.type === 'CUSTOMER'
                      ? 'bg-sky-50 text-sky-600 border-sky-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {contact.type === 'CUSTOMER' ? 'ลูกค้า' : 'ซัพพลายเออร์'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1 truncate">{contact.companyName}</h3>
                  <span className="text-[11px] text-slate-500">{contact.name}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2 text-[11px] text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="font-mono leading-tight">
                    {contact.taxId}
                    <span className="ml-1.5 text-slate-400">
                      ({contact.branchCode === '00000' ? 'สำนักงานใหญ่' : `สาขา ${contact.branchCode}`})
                    </span>
                  </span>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-start gap-2 text-[11px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-tight">{contact.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400">เครดิต: <span className="font-bold text-slate-600">{contact.creditDays} วัน</span></span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">ยอดค้างชำระ</span>
                  <span className={`font-mono font-bold ${contact.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatMoney(contact.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ══════════════════════════════════════════════════ */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">

            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              modalMode === 'edit'
                ? 'bg-gradient-to-r from-sky-600 to-sky-700'
                : 'bg-gradient-to-r from-rose-600 to-rose-700'
            }`}>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {modalMode === 'edit' ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {modalMode === 'edit' ? `แก้ไข: ${editingContact?.companyName}` : 'เพิ่มผู้ติดต่อใหม่'}
              </h2>
              <button onClick={closeModal} className="text-white/70 hover:text-white text-lg leading-none transition">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">

              {/* ── RD Lookup Box ─────────────────────────────────────────── */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-700 text-sm">ดึงข้อมูลจากกรมสรรพากร</span>
                </div>
                <p className="text-[11px] text-blue-600">กรอกเลขผู้เสียภาษี 13 หลัก แล้วกดปุ่ม เพื่อกรอกชื่อ+ที่อยู่อัตโนมัติ</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={e => { setField('taxId', e.target.value); setRdResult(null); }}
                    placeholder="0-0000-00000-00-0"
                    maxLength={17}
                    className="flex-1 bg-white border border-blue-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                  />
                  <button type="button" onClick={handleRDLookup} disabled={rdLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap shadow-sm">
                    {rdLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>กำลังตรวจสอบ...</span></>
                      : <><ShieldCheck className="w-3.5 h-3.5" /><span>ตรวจสอบ RD</span></>
                    }
                  </button>
                </div>

                {rdResult && (
                  <div className={`p-3 rounded-xl border text-xs ${rdResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    {rdResult.success && rdResult.primary ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>พบข้อมูลในระบบกรมสรรพากร ✓</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                          <div className="col-span-2">
                            <span className="text-slate-400">ชื่อ:</span>
                            <span className="ml-1 font-bold text-slate-800">{rdResult.primary.fullName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">สาขา:</span>
                            <span className="ml-1 font-semibold text-slate-700">{rdResult.primary.branchLabel}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">รหัสไปรษณีย์:</span>
                            <span className="ml-1 font-mono text-slate-700">{rdResult.primary.postCode}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400">ที่อยู่:</span>
                            <span className="ml-1 text-slate-700">{rdResult.primary.address}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 text-rose-600 font-medium">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{rdResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Form ──────────────────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="space-y-3">

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">ประเภทคู่ค้า</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['CUSTOMER', 'SUPPLIER'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setField('type', t)}
                        className={`py-2 rounded-xl font-bold border text-xs transition ${
                          formData.type === t
                            ? t === 'CUSTOMER' ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}>
                        {t === 'CUSTOMER' ? '🧑‍💼 ลูกค้า (Customer)' : '🏭 ซัพพลายเออร์ (Supplier)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-rose-400" />
                    ชื่อบริษัท / กิจการ *
                  </label>
                  <input required type="text" value={formData.companyName}
                    onChange={e => setField('companyName', e.target.value)}
                    placeholder="บริษัท / ห้างหุ้นส่วน / บุคคลธรรมดา"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-rose-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">รหัสสาขา</label>
                    <input type="text" value={formData.branchCode}
                      onChange={e => setField('branchCode', e.target.value)}
                      placeholder="00000 = สำนักงานใหญ่"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">เครดิตเทอม (วัน)</label>
                    <input type="number" min={0} max={365} value={formData.creditDays}
                      onChange={e => setField('creditDays', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    ที่อยู่ (สำหรับใบกำกับภาษี)
                  </label>
                  <textarea rows={2} value={formData.address}
                    onChange={e => setField('address', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 resize-none focus:outline-none focus:border-rose-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">ชื่อผู้ติดต่อ</label>
                    <input type="text" value={formData.name}
                      onChange={e => setField('name', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-rose-400" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">เบอร์โทรศัพท์</label>
                    <input type="text" value={formData.phone}
                      onChange={e => setField('phone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">อีเมล</label>
                  <input type="email" value={formData.email}
                    onChange={e => setField('email', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-rose-400" />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition">
                    ยกเลิก
                  </button>
                  <button type="submit"
                    className={`px-5 py-2 rounded-xl text-white font-bold shadow-sm transition active:scale-95 ${
                      modalMode === 'edit'
                        ? 'bg-sky-600 hover:bg-sky-500'
                        : 'bg-rose-600 hover:bg-rose-500'
                    }`}>
                    {modalMode === 'edit' ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มผู้ติดต่อ'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM DIALOG ═════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">ยืนยันการลบ</h3>
                <p className="text-xs text-slate-400 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <p className="text-xs font-bold text-rose-700">{deleteTarget.companyName}</p>
              <p className="text-[11px] text-rose-500 mt-0.5 font-mono">Tax ID: {deleteTarget.taxId}</p>
            </div>

            <p className="text-xs text-slate-500">
              คุณต้องการลบผู้ติดต่อนี้ออกจากระบบ? เอกสารที่เกี่ยวข้องจะยังคงอยู่
            </p>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition">
                ยกเลิก
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95">
                <Trash2 className="w-3.5 h-3.5" />
                ลบออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
