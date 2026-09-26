import React, { useState, useRef, useEffect } from "react";
import {
  FileText, Plus, Search, RefreshCw, Printer, Settings,
  BarChart3, DollarSign, ShoppingCart, Users, Package,
  BookOpen, ShieldCheck, HelpCircle, Cpu, Download,
  ExternalLink, ChevronRight, Check, Zap, Sparkles, Command
} from "lucide-react";
import { AccountingDocument } from "../types";
import { exportSalesToExcel } from "../utils/excelExport";

interface MenuBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCreateModal: (type: "QUOTATION" | "INVOICE" | "RECEIPT" | "PURCHASE_ORDER") => void;
  documents?: AccountingDocument[];
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenCostMatrix?: () => void;
  onOpenBomPoGenerator?: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  activeTab,
  setActiveTab,
  openCreateModal,
  documents = [],
  isSidebarCollapsed = false,
  onToggleSidebar,
  onOpenCostMatrix,
  onOpenBomPoGenerator
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (menuKey: string) => {
    setOpenMenu(openMenu === menuKey ? null : menuKey);
  };

  const handleMenuHover = (menuKey: string) => {
    if (openMenu !== null) {
      setOpenMenu(menuKey);
    }
  };

  const handleExportAll = () => {
    const salesDocs = documents.filter(d => 
      ["QUOTATION", "INVOICE", "TAX_INVOICE", "RECEIPT"].includes(d.type)
    );
    exportSalesToExcel(salesDocs, "รายงานเอกสารขายทั้งหมด_WARSGATE");
    setOpenMenu(null);
  };

  const handlePrint = () => {
    window.print();
    setOpenMenu(null);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const menuItems = [
    {
      key: "file",
      label: "File",
      dropdown: [
        {
          label: "สร้างใบเสนอราคา (Quotation)",
          icon: FileText,
          shortcut: "Alt+Q",
          action: () => { openCreateModal("QUOTATION"); setOpenMenu(null); }
        },
        {
          label: "สร้างใบแจ้งหนี้ / กำกับภาษี (Invoice)",
          icon: DollarSign,
          shortcut: "Alt+I",
          action: () => { openCreateModal("INVOICE"); setOpenMenu(null); }
        },
        {
          label: "สร้างใบเสร็จรับเงิน (Receipt)",
          icon: ShieldCheck,
          shortcut: "Alt+R",
          action: () => { openCreateModal("RECEIPT"); setOpenMenu(null); }
        },
        {
          label: "สร้างใบสั่งซื้อสินค้า (Purchase Order)",
          icon: ShoppingCart,
          shortcut: "Alt+P",
          action: () => { openCreateModal("PURCHASE_ORDER"); setOpenMenu(null); }
        },
        { type: "divider" },
        {
          label: "ส่งออกข้อมูล Excel (.xlsx)",
          icon: Download,
          shortcut: "Ctrl+E",
          action: handleExportAll
        },
        {
          label: "พิมพ์หน้านี้ (Print)",
          icon: Printer,
          shortcut: "⌘P",
          action: handlePrint
        },
        { type: "divider" },
        {
          label: "ตั้งค่าระบบและบริษัท (Settings)",
          icon: Settings,
          action: () => { setActiveTab("settings"); setOpenMenu(null); }
        }
      ]
    },
    {
      key: "edit",
      label: "Edit",
      dropdown: [
        {
          label: "ค้นหาข้อมูลด่วน (Global Search)",
          icon: Search,
          shortcut: "⌘K",
          action: () => {
            const searchInput = document.querySelector("input[type=text]") as HTMLInputElement;
            if (searchInput) searchInput.focus();
            setOpenMenu(null);
          }
        },
        {
          label: "ซิงค์และรีเฟรชฐานข้อมูล (Sync Data)",
          icon: RefreshCw,
          shortcut: "Ctrl+R",
          action: handleReload
        },
        { type: "divider" },
        {
          label: "กำหนดรูปแบบเลขที่เอกสาร (Numbering)",
          icon: Settings,
          action: () => { setActiveTab("settings"); setOpenMenu(null); }
        }
      ]
    },
    {
      key: "view",
      label: "View",
      dropdown: [
        {
          label: isSidebarCollapsed ? "แสดงแถบเมนูด้านซ้าย (Expand Sidebar)" : "ซ่อนแถบเมนูด้านซ้าย (Collapse Sidebar)",
          icon: Zap,
          shortcut: "⌘B",
          action: () => { if (onToggleSidebar) onToggleSidebar(); setOpenMenu(null); }
        },
        { type: "divider" },
        {
          label: "ภาพรวมการเงิน (Dashboard)",
          icon: BarChart3,
          active: activeTab === "dashboard",
          action: () => { setActiveTab("dashboard"); setOpenMenu(null); }
        },
        {
          label: "ศูนย์ขาย & เอกสารรายได้ (Sales Center)",
          icon: DollarSign,
          active: activeTab === "sales",
          action: () => { setActiveTab("sales"); setOpenMenu(null); }
        },
        {
          label: "ศูนย์รายจ่าย & สั่งซื้อ (Expenses)",
          icon: ShoppingCart,
          active: activeTab === "expense",
          action: () => { setActiveTab("expense"); setOpenMenu(null); }
        },
        {
          label: "รายชื่อลูกค้า & คู่ค้า (Contacts CRM)",
          icon: Users,
          active: activeTab === "contacts",
          action: () => { setActiveTab("contacts"); setOpenMenu(null); }
        },
        {
          label: "คลังสินค้า & รายการบริการ (Inventory)",
          icon: Package,
          active: activeTab === "inventory",
          action: () => { setActiveTab("inventory"); setOpenMenu(null); }
        },
        {
          label: "ผังบัญชี & สมุดรายวัน (Accounting)",
          icon: BookOpen,
          active: activeTab === "accounting",
          action: () => { setActiveTab("accounting"); setOpenMenu(null); }
        },
        {
          label: "รายงานภาษี ภ.พ.30 / 50 ทวิ (Tax Center)",
          icon: ShieldCheck,
          active: activeTab === "tax",
          action: () => { setActiveTab("tax"); setOpenMenu(null); }
        }
      ]
    },
    {
      key: "sales",
      label: "Sales",
      dropdown: [
        {
          label: "ใบเสนอราคา (Quotation)",
          icon: FileText,
          action: () => { setActiveTab("sales"); setOpenMenu(null); }
        },
        {
          label: "ใบแจ้งหนี้ / ใบกำกับภาษี (Invoice)",
          icon: DollarSign,
          action: () => { setActiveTab("sales"); setOpenMenu(null); }
        },
        {
          label: "ใบเสร็จรับเงิน (Receipt)",
          icon: ShieldCheck,
          action: () => { setActiveTab("sales"); setOpenMenu(null); }
        },
        { type: "divider" },
        {
          label: "สรุปยอด PO ลูกค้า (Customer PO Tracking)",
          icon: Zap,
          action: () => { setActiveTab("dashboard"); setOpenMenu(null); }
        },
        {
          label: "Export ข้อมูลการขายออก Excel",
          icon: Download,
          action: handleExportAll
        }
      ]
    },
    {
      key: "purchases",
      label: "Purchases",
      dropdown: [
        {
          label: "ใบสั่งซื้อสินค้า / อุปกรณ์ (PO)",
          icon: ShoppingCart,
          action: () => { setActiveTab("expense"); setOpenMenu(null); }
        },
        {
          label: "ใบสำคัญจ่าย (Payment Voucher)",
          icon: DollarSign,
          action: () => { setActiveTab("expense"); setOpenMenu(null); }
        },
        { type: "divider" },
        {
          label: "จัดซื้อฮาร์ดแวร์ PLC & Sensor",
          icon: Cpu,
          action: () => { setActiveTab("expense"); setOpenMenu(null); }
        }
      ]
    },
    {
      key: "bom-bridge",
      label: "BOM Bridge",
      dropdown: [
        {
          label: "📊 วิเคราะห์ต้นทุนโครงการ BOM vs บัญชีจริง (Cost Matrix)",
          icon: BarChart3,
          action: () => { if (onOpenCostMatrix) onOpenCostMatrix(); setOpenMenu(null); }
        },
        {
          label: "🛒 สร้างใบสั่งซื้อ (PO) จาก BOM แยกตาม Supplier",
          icon: ShoppingCart,
          action: () => { if (onOpenBomPoGenerator) onOpenBomPoGenerator(); setOpenMenu(null); }
        },
        { type: "divider" },
        {
          label: "เปิดระบบ Mechanical BOM Part List WebApp",
          icon: ExternalLink,
          action: () => { window.open("https://warsgate-bom.onrender.com", "_blank"); setOpenMenu(null); }
        }
      ]
    },
    {
      key: "tax",
      label: "Tax & Reports",
      dropdown: [
        {
          label: "แบบแสดงรายการ ภ.พ. 30 (VAT)",
          icon: ShieldCheck,
          action: () => { setActiveTab("tax"); setOpenMenu(null); }
        },
        {
          label: "หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)",
          icon: FileText,
          action: () => { setActiveTab("tax"); setOpenMenu(null); }
        },
        {
          label: "ภาษีหัก ณ ที่จ่าย ภ.ง.ด. 53 (นิติบุคคล)",
          icon: ShieldCheck,
          action: () => { setActiveTab("tax"); setOpenMenu(null); }
        },
        {
          label: "ภาษีหัก ณ ที่จ่าย ภ.ง.ด. 3 (บุคคลธรรมดา)",
          icon: ShieldCheck,
          action: () => { setActiveTab("tax"); setOpenMenu(null); }
        },
        { type: "divider" },
        {
          label: "วางแผนประหยัดภาษีประจำปี 2569",
          icon: Sparkles,
          action: () => { setActiveTab("tax"); setOpenMenu(null); }
        }
      ]
    },
    {
      key: "help",
      label: "Help",
      dropdown: [
        {
          label: "คู่มือการใช้งานระบบ WARSGATE",
          icon: HelpCircle,
          action: () => { alert("ระบบบัญชีและบริหารโครงการ WARSGATE Automation v2.5\nรองรับระบบใบเสนอราคา, ออกใบกำกับภาษี, ใบเสร็จ, หัก ณ ที่จ่าย, และ Export Excel ครบวงจร"); setOpenMenu(null); }
        },
        {
          label: "คีย์ลัดแป้นพิมพ์ (Keyboard Shortcuts)",
          icon: Command,
          action: () => { alert("คีย์ลัดระบบ:\n- Alt+Q: ออกใบเสนอราคา\n- Alt+I: ออกใบแจ้งหนี้\n- Alt+R: ออกใบเสร็จรับเงิน\n- Alt+P: ออกใบสั่งซื้อ (PO)\n- ⌘K: ค้นหาด่วน"); setOpenMenu(null); }
        },
        { type: "divider" },
        {
          label: "เกี่ยวกับโปรแกรมบัญชี วอร์สเกต (v2.5)",
          icon: Cpu,
          action: () => { alert("โปรแกรมบัญชี วอร์สเกต (WARSGATE Accounting v2.5.0)\n(C) 2026 Warsgate Automation Co., Ltd. All rights reserved."); setOpenMenu(null); }
        }
      ]
    }
  ];

  return (
    <div 
      ref={menuRef}
      className="bg-[#0b101b] text-slate-300 border-b border-slate-800/80 px-3 sm:px-4 py-1.5 flex items-center justify-between select-none text-[12px] font-sans tracking-wide z-40 relative shadow-inner"
    >
      {/* Left: Studio Branding & Menu Items */}
      <div className="flex items-center gap-1 sm:gap-2">
        
        {/* WARSGATE Logo & Branding */}
        <div className="flex items-center gap-2 mr-2 pl-0.5">
          <img 
            src="/warsgate-logo.png" 
            alt="WARSGATE" 
            className="h-5 w-auto object-contain brightness-110"
          />
          <span className="font-extrabold tracking-wide text-white text-[11px] sm:text-xs">
            โปรแกรมบัญชี <span className="text-rose-400 font-bold">วอร์สเกต</span>
          </span>

          <span className="hidden md:inline-flex items-center text-[9px] font-mono font-bold bg-rose-950/60 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
            WARSGATE
          </span>
          
          <span className="text-slate-700 ml-1">|</span>
        </div>

        {/* Horizontal Menu Items */}
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          {menuItems.map((menu) => {
            const isOpen = openMenu === menu.key;
            return (
              <div key={menu.key} className="relative">
                <button
                  onClick={() => handleMenuClick(menu.key)}
                  onMouseEnter={() => handleMenuHover(menu.key)}
                  className={`px-2 sm:px-2.5 py-1 rounded-md transition font-medium text-xs flex items-center gap-1 ${
                    isOpen
                      ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  {menu.label}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#0e1626] border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl">
                    {menu.dropdown.map((item: any, idx: number) => {
                      if (item.type === "divider") {
                        return <div key={idx} className="border-t border-slate-800 my-1 mx-2" />;
                      }
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={item.action}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition hover:bg-cyan-500/15 hover:text-cyan-300 ${
                            item.active ? "text-cyan-400 font-semibold bg-cyan-950/30" : "text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 shrink-0" />}
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.shortcut && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded ml-2 shrink-0">
                              {item.shortcut}
                            </span>
                          )}
                          {item.active && <Check className="w-3.5 h-3.5 text-cyan-400 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Right: Real-Time Engine Indicators */}
      <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
          <span className="text-slate-300 font-medium">PLC & ENGINE LIVE</span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="text-cyan-400/90 font-semibold">v2.5.0</span>
      </div>

    </div>
  );
};
