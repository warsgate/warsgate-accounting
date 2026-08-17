import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Calculator, CheckCircle2 } from 'lucide-react';
import { AccountingDocument, Contact, ProductService, DocumentType, DocumentItem } from '../types';
import { formatMoney } from '../utils/formatters';

interface CreateDocumentModalProps {
  type: DocumentType;
  contacts: Contact[];
  products: ProductService[];
  onClose: () => void;
  onSubmit: (newDoc: AccountingDocument) => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  type,
  contacts,
  products,
  onClose,
  onSubmit
}) => {
  const isPurchase = type === 'PURCHASE_ORDER';
  const filteredContacts = contacts.filter(c => isPurchase ? c.type === 'SUPPLIER' : c.type === 'CUSTOMER');

  const [selectedContactId, setSelectedContactId] = useState<string>(filteredContacts[0]?.id || contacts[0]?.id || '');
  const [issueDate, setIssueDate] = useState<string>('2026-07-30');
  const [dueDate, setDueDate] = useState<string>('2026-08-29');
  const [notes, setNotes] = useState<string>('กำหนดยอดชำระตามวงเงินเครดิต 30 วัน โอนเข้าบัญชี บจก. วอร์สเกต ออโตเมชั่น');

  const [items, setItems] = useState<DocumentItem[]>([
    {
      id: 'item-1',
      code: products[0]?.code || 'PROD-001',
      name: products[0]?.name || 'สินค้าออโตเมชั่น',
      description: products[0]?.description || '',
      quantity: 1,
      unit: products[0]?.unit || 'รายการ',
      pricePerUnit: products[0]?.unitPrice || 15000,
      discount: 0,
      amount: products[0]?.unitPrice || 15000,
      vatInclusive: false,
      withholdingTaxRate: products[0]?.type === 'SERVICE' ? 3 : 0,
    }
  ]);

  const handleAddItem = () => {
    const firstProd = products[0];
    const newItem: DocumentItem = {
      id: `item-${Date.now()}`,
      code: firstProd?.code || 'PROD-NEW',
      name: firstProd?.name || 'รายการสินค้าใหม่',
      description: firstProd?.description || '',
      quantity: 1,
      unit: firstProd?.unit || 'รายการ',
      pricePerUnit: firstProd?.unitPrice || 10000,
      discount: 0,
      amount: firstProd?.unitPrice || 10000,
      vatInclusive: false,
      withholdingTaxRate: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const handleItemProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      code: prod.code,
      name: prod.name,
      description: prod.description,
      unit: prod.unit,
      pricePerUnit: prod.unitPrice,
      amount: (newItems[index].quantity * prod.unitPrice) - newItems[index].discount,
      withholdingTaxRate: prod.type === 'SERVICE' ? 3 : 0,
    };
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items];
    const q = Math.max(1, qty);
    newItems[index].quantity = q;
    newItems[index].amount = (q * newItems[index].pricePerUnit) - newItems[index].discount;
    setItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].pricePerUnit = price;
    newItems[index].amount = (newItems[index].quantity * price) - newItems[index].discount;
    setItems(newItems);
  };

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const vatAmount = subtotal * 0.07;
  const grandTotal = subtotal + vatAmount;
  
  // WHT calculation (sum of wht rates on service items)
  const withholdingTaxTotal = items.reduce((sum, i) => {
    if (i.withholdingTaxRate > 0) {
      return sum + (i.amount * (i.withholdingTaxRate / 100));
    }
    return sum;
  }, 0);

  const netPayment = grandTotal - withholdingTaxTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find(c => c.id === selectedContactId) || contacts[0];
    const prefix = type === 'QUOTATION' ? 'QT' : type === 'INVOICE' ? 'INV' : type === 'RECEIPT' ? 'REC' : 'PO';
    const docNo = `${prefix}-202607-${Math.floor(100 + Math.random() * 900)}`;

    const newDoc: AccountingDocument = {
      id: `doc-${Date.now()}`,
      documentNo: docNo,
      type,
      issueDate,
      dueDate,
      contact,
      items,
      subtotal,
      discountTotal: items.reduce((sum, i) => sum + i.discount, 0),
      vatRate: 7,
      vatAmount,
      grandTotal,
      withholdingTaxTotal,
      netPayment,
      status: type === 'RECEIPT' ? 'PAID' : 'PENDING',
      notes,
      createdByName: 'คุณจีระวัฒน์ (MD)'
    };

    onSubmit(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-xs">
              W
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                สร้าง{type === 'QUOTATION' ? 'ใบเสนอราคา' : type === 'INVOICE' ? 'ใบแจ้งหนี้ / ใบกำกับภาษี' : type === 'RECEIPT' ? 'ใบเสร็จรับเงิน' : 'ใบสั่งซื้อ (PO)'} ใหม่
              </h2>
              <span className="text-[11px] text-slate-400">WARSGATE AUTOMATION Co., Ltd.</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Customer & Dates Box */}
          <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">เลือก{isPurchase ? 'ซัพพลายเออร์' : 'ลูกค้า'} *</label>
              <select
                value={selectedContactId}
                onChange={e => setSelectedContactId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-rose-400"
              >
                {filteredContacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">วันที่ออกเอกสาร</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">วันครบกำหนดชำระ</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="glass-panel p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">รายการสินค้า / ค่าบริการ</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-medium text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มบรรทัด</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 lg:col-span-4">
                    <label className="block text-[10px] text-slate-500 mb-0.5">เลือกจากสินค้า</label>
                    <select
                      onChange={e => handleItemProductSelect(idx, e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:outline-none focus:border-rose-400"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4 lg:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">จำนวน</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-center focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="col-span-4 lg:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">ราคา/หน่วย</label>
                    <input
                      type="number"
                      value={item.pricePerUnit}
                      onChange={e => handlePriceChange(idx, Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-mono text-right font-bold focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="col-span-3 lg:col-span-3 text-right">
                    <label className="block text-[10px] text-slate-500 mb-0.5">จำนวนเงิน (บาท)</label>
                    <span className="font-mono font-bold text-emerald-600 text-sm block py-1.5">
                      {formatMoney(item.amount)}
                    </span>
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl space-y-2">
              <label className="block text-slate-400 font-semibold">หมายเหตุ / เงื่อนไขการชำระเงิน</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">มูลค่าสินค้าก่อนภาษี:</span>
                <span className="font-semibold text-slate-700">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                <span className="font-semibold text-slate-700">{formatMoney(vatAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-sm text-rose-600 border-b border-slate-100">
                <span>จำนวนเงินรวมทั้งสิ้น:</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
              {withholdingTaxTotal > 0 && (
                <div className="flex justify-between py-1 text-amber-600">
                  <span>หัก ภาษี ณ ที่จ่าย:</span>
                  <span>-{formatMoney(withholdingTaxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 bg-emerald-50 border border-emerald-200 px-3 rounded-xl font-bold text-sm text-emerald-700">
                <span>ยอดรับสุทธิ (Net Payment):</span>
                <span>{formatMoney(netPayment)}</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-glow flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกและออกเอกสาร</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
