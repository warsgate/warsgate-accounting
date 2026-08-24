import React from 'react';
import { 
  LayoutDashboard, TrendingUp, TrendingDown, Users, Package,
  BookOpen, Calculator, Settings, ChevronRight, Zap, BarChart3
} from 'lucide-react';
import { AccountingDocument, Contact, ProductService } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  documents?: AccountingDocument[];
  contacts?: Contact[];
  products?: ProductService[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  documents = [],
  contacts = [],
  products = []
}) => {
  const salesCount = documents.filter(d => ['QUOTATION', 'INVOICE', 'TAX_INVOICE', 'RECEIPT'].includes(d.type)).length;
  const expenseCount = documents.filter(d => ['PURCHASE_ORDER', 'PURCHASE_INVOICE', 'PAYMENT_VOUCHER', 'WHT_CERTIFICATE'].includes(d.type)).length;
  const contactsCount = contacts.length;
  const productsCount = products.length;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'ภาพรวมระบบ',
      subtitle: 'Financial Dashboard',
      icon: LayoutDashboard,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'sales',
      label: 'รายรับ (Sales)',
      subtitle: 'ใบเสนอราคา / ใบแจ้งหนี้ / ใบเสร็จ',
      icon: TrendingUp,
      badge: `${salesCount} รายการ`,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'expenses',
      label: 'รายจ่าย (Expenses)',
      subtitle: 'ใบสั่งซื้อ / ค่าใช้จ่าย / 50 ทวิ',
      icon: TrendingDown,
      badge: `${expenseCount} รายการ`,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'contacts',
      label: 'ผู้ติดต่อ (Contacts)',
      subtitle: 'ลูกค้า / ซัพพลายเออร์',
      icon: Users,
      badge: `${contactsCount} ราย`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'inventory',
      label: 'สินค้า & บริการ',
      subtitle: 'คลังสินค้า / อะไหล่ / งานบริการ',
      icon: Package,
      badge: `${productsCount} รายการ`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'accounting',
      label: 'การเงิน & บัญชี',
      subtitle: 'ผังบัญชี / JV / งบทดลอง',
      icon: BookOpen,
    },
    {
      id: 'tax',
      label: 'รายงานภาษี',
      subtitle: 'ภ.พ. 30 / ภ.ง.ด. 3, 53',
      icon: Calculator,
    },
    {
      id: 'settings',
      label: 'ตั้งค่าระบบ',
      subtitle: 'ข้อมูล WARSGATE / ล้างข้อมูล',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0 shadow-sm">
      
      <div className="p-3 space-y-1 pt-4">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          เมนูหลัก (Main Navigation)
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg transition shrink-0 ${
                  isActive 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-500 group-hover:text-rose-500 group-hover:bg-rose-50'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className={`block text-xs truncate ${isActive ? 'text-rose-700 font-bold' : 'text-slate-700 font-semibold'}`}>
                    {item.label}
                  </span>
                  <span className={`text-[10px] block truncate ${isActive ? 'text-rose-500' : 'text-slate-400'}`}>
                    {item.subtitle}
                  </span>
                </div>
              </div>

              {item.badge ? (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold whitespace-nowrap shrink-0 ml-1 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-rose-400 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Info Box */}
      <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700">WARSGATE Cloud</h4>
            <span className="text-[10px] text-slate-400 font-mono">v2.5.0 Pro</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight mb-3">
          ระบบเชื่อมต่อสรรพากร ภ.พ. 30 & 50 ทวิ พร้อมใช้งาน
        </p>
        <button 
          onClick={() => setActiveTab('tax')}
          className="w-full py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>ตรวจสอบรายงานภาษี</span>
        </button>
      </div>

    </aside>
  );
};
