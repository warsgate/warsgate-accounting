import { BomProject, BomPart } from '../types';

const BOM_API_STORAGE_KEY = 'warsgate_bom_api_url';
const DEFAULT_API_URLS = [
  'http://localhost:5000/api',
  'http://localhost:5001/api',
  'https://warsgate-bom-api.onrender.com/api'
];

// ─── Offline Fallback BOM Data (Realistic Warsgate Projects) ───
export const FALLBACK_BOM_PROJECTS: BomProject[] = [
  {
    id: 'proj-527',
    code: 'PRJ-527',
    name: 'Tracking ability Line ADC',
    customer: 'บริษัท ชินเอทสึ โพลีเมอร์ (ประเทศไทย) จำกัด',
    customerId: '001',
    dwgNo: 'ADC-2608-001',
    targetBudget: 850000,
    status: 'Active',
    totalPartsCount: 16,
    totalEstimatedCost: 846340,
    suppliers: ['OMRON', 'SMC', 'Misumi', 'Warsgate'],
    parts: [
      {
        id: 'p-527-01',
        projectId: 'proj-527',
        itemNo: 1,
        dwgNo: 'ADC-2608-001-01',
        partName: 'PLC Control Board (Ethernet IP)',
        typeSpec: 'CJ1W-EIP21',
        category: 'EE',
        partType: 'Standard Part',
        qty: 21,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 35040,
        unitPrice: 35040,
        totalAmount: 735840,
        poNumber: 'PO-2607001',
        status: 'Ordered',
        remarks: 'Part: CJ1W-EIP21 | Brand: OMRON (Line ADC)'
      },
      {
        id: 'p-527-02',
        projectId: 'proj-527',
        itemNo: 2,
        dwgNo: 'ADC-2608-001-02A',
        partName: 'PLC POWER SUPPLY UNIT',
        typeSpec: 'CJ1W-PA202',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 6500,
        unitPrice: 6500,
        totalAmount: 39000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.1'
      },
      {
        id: 'p-527-03',
        projectId: 'proj-527',
        itemNo: 3,
        dwgNo: 'ADC-2608-001-02B',
        partName: 'MODULE LINK RACK UNIT',
        typeSpec: 'CJ1W-IC101',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 8500,
        unitPrice: 8500,
        totalAmount: 51000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.2'
      },
      {
        id: 'p-527-04',
        projectId: 'proj-527',
        itemNo: 4,
        dwgNo: 'ADC-2608-001-02C',
        partName: 'MODULE LINK RACK UNIT',
        typeSpec: 'CJ1W-II101',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 8500,
        unitPrice: 8500,
        totalAmount: 51000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.3'
      },
      {
        id: 'p-527-05',
        projectId: 'proj-527',
        itemNo: 5,
        dwgNo: 'ADC-2608-001-02D',
        partName: 'CABLE LINK RACK',
        typeSpec: 'CS1W-CN223 2M',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 2500,
        unitPrice: 2500,
        totalAmount: 15000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.4'
      }
    ]
  },
  {
    id: 'proj-smartcam',
    code: 'PRJ-2609-002',
    name: 'Smart Camera Pick & Place / MVC with Camera 12 MP Inspection Parts',
    customer: 'บริษัท คูโรดา เทคโน ทูลลิง แมชชีน (ไทยแลนด์) จํากัด',
    customerId: '002',
    dwgNo: 'WGL-MVC-2026',
    targetBudget: 1100000,
    status: 'Active',
    totalPartsCount: 13,
    totalEstimatedCost: 1004354,
    suppliers: ['Wenglor', 'Warsgate'],
    parts: [
      {
        id: 'p-sc-01',
        projectId: 'proj-smartcam',
        itemNo: 1,
        dwgNo: 'MVCA101',
        partName: 'Machine Vision Controller uniVision AI',
        typeSpec: 'Controller ประมวลผลภาพอัจฉริยะ',
        category: 'VISION',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 247520,
        unitPrice: 247520,
        totalAmount: 247520,
        status: 'Approved',
        remarks: 'Vision Controller unit'
      },
      {
        id: 'p-sc-02',
        projectId: 'proj-smartcam',
        itemNo: 2,
        dwgNo: 'BBVK005',
        partName: 'Machine Vision Camera (12.3 MP Inspection with AI)',
        typeSpec: '12.3 MP Inspection AI Camera',
        category: 'VISION',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 235040,
        unitPrice: 235040,
        totalAmount: 235040,
        status: 'Approved',
        remarks: 'Inspection Camera'
      },
      {
        id: 'p-sc-03',
        projectId: 'proj-smartcam',
        itemNo: 3,
        dwgNo: 'B60E101',
        partName: 'Smart Camera uniVision Extended',
        typeSpec: '1.6 MP Auto-Focus Integrated Vision',
        category: 'VISION',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 358800,
        unitPrice: 358800,
        totalAmount: 358800,
        status: 'Approved',
        remarks: 'Smart Camera'
      },
      {
        id: 'p-sc-04',
        projectId: 'proj-smartcam',
        itemNo: 4,
        dwgNo: 'ZVZG303',
        partName: 'High-Resolution Lens for Smart Camera',
        typeSpec: 'High-Resolution C-Mount Lens',
        category: 'OPTIC',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 46280,
        unitPrice: 46280,
        totalAmount: 46280,
        status: 'Approved',
        remarks: 'Camera Lens'
      },
      {
        id: 'p-sc-05',
        projectId: 'proj-smartcam',
        itemNo: 5,
        dwgNo: 'LMDX202',
        partName: 'Dome Light white-infrared light 130 mm',
        typeSpec: 'Dome Light 130 mm',
        category: 'LIGHT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 37440,
        unitPrice: 37440,
        totalAmount: 37440,
        status: 'Approved',
        remarks: 'Illumination'
      }
    ]
  },
  {
    id: 'proj-dashboard',
    code: 'PRJ-2609-004',
    name: 'งานระบบ Dashboard Data Monitor (Hardware & Network)',
    customer: 'บริษัท คูโรดา เทคโน ทูลลิง แมชชีน (ไทยแลนด์) จํากัด',
    customerId: '002',
    dwgNo: 'DBM-2026-01',
    targetBudget: 60000,
    status: 'Active',
    totalPartsCount: 4,
    totalEstimatedCost: 47190,
    suppliers: ['Dell', 'Samsung/LG', 'Logitech', 'APC/Syndome'],
    parts: [
      {
        id: 'p-db-01',
        projectId: 'proj-dashboard',
        itemNo: 1,
        dwgNo: 'COMP-DELL-5090',
        partName: 'ชุดคอมพิวเตอร์ Dell OptiPlex 5090 SFF',
        typeSpec: 'Core i7-10700, RAM 16GB, SSD 256GB + HDD 1TB, Win11 Pro',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'ชุด',
        maker: 'Dell',
        supplier: 'IT City / Advice',
        targetUnitPrice: 35000,
        unitPrice: 35000,
        totalAmount: 35000,
        status: 'Approved',
        remarks: 'Industrial Data Logger Host'
      },
      {
        id: 'p-db-02',
        projectId: 'proj-dashboard',
        itemNo: 2,
        dwgNo: 'MON-LED-24FHD',
        partName: 'จอแสดงผล Dashboard LED Monitor 24 นิ้ว (Full HD)',
        typeSpec: 'IPS 24" 1920x1080 FHD 24/7 Support',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'ชุด',
        maker: 'Dell / Samsung',
        supplier: 'IT Supplier',
        targetUnitPrice: 7800,
        unitPrice: 7800,
        totalAmount: 7800,
        status: 'Approved',
        remarks: 'Realtime Monitor'
      },
      {
        id: 'p-db-03',
        projectId: 'proj-dashboard',
        itemNo: 3,
        dwgNo: 'ACC-KBM-WL',
        partName: 'ชุดคีย์บอร์ดและเมาส์ไร้สาย (Wireless Keyboard & Mouse)',
        typeSpec: 'USB Nano Receiver 2.4GHz',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'ชุด',
        maker: 'Logitech',
        supplier: 'IT Supplier',
        targetUnitPrice: 890,
        unitPrice: 890,
        totalAmount: 890,
        status: 'Approved',
        remarks: 'Wireless KBM'
      },
      {
        id: 'p-db-04',
        projectId: 'proj-dashboard',
        itemNo: 4,
        dwgNo: 'UPS-800VA-480W',
        partName: 'เครื่องสำรองไฟอัตโนมัติ (UPS 800VA / 480W)',
        typeSpec: 'Surge Protection & AVR 800VA/480W',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'เครื่อง',
        maker: 'Syndome / APC',
        supplier: 'IT Supplier',
        targetUnitPrice: 3500,
        unitPrice: 3500,
        totalAmount: 3500,
        status: 'Approved',
        remarks: 'UPS Backup Power'
      }
    ]
  },
  {
    id: 'proj-autopack',
    code: 'PRJ-107',
    name: 'TSF1 Auto pack LM1 (Stacker, Open Bag & Insert Foam)',
    customer: 'บริษัท ไทย เซกิซุย โฟม จำกัด',
    customerId: '003',
    dwgNo: 'TSF1-LM1-2026',
    targetBudget: 3545600,
    status: 'Active',
    totalPartsCount: 7,
    totalEstimatedCost: 3100000,
    suppliers: ['Misumi', 'SMC', 'Mitsubishi', 'Warsgate'],
    parts: [
      {
        id: 'p-tsf-01',
        projectId: 'proj-autopack',
        itemNo: 1,
        dwgNo: 'TSF-ST-001',
        partName: 'Station Stacker Foam',
        typeSpec: 'ชุดสถานีเรียงโฟมอัตโนมัติ',
        category: 'ME',
        partType: 'Standard Part',
        qty: 1,
        unit: 'SET',
        maker: 'Warsgate',
        supplier: 'Warsgate Workshop',
        targetUnitPrice: 765394,
        unitPrice: 765394,
        totalAmount: 765394,
        poNumber: 'PO252155',
        status: 'Ordered',
        remarks: 'Stacker Station'
      },
      {
        id: 'p-tsf-02',
        projectId: 'proj-autopack',
        itemNo: 2,
        dwgNo: 'TSF-ST-002',
        partName: 'Station Open Bag & Insert Foam',
        typeSpec: 'ชุดสถานีเปิดถุงและบรรจุโฟม',
        category: 'ME',
        partType: 'Standard Part',
        qty: 1,
        unit: 'SET',
        maker: 'Warsgate',
        supplier: 'Warsgate Workshop',
        targetUnitPrice: 650215,
        unitPrice: 650215,
        totalAmount: 650215,
        poNumber: 'PO252155',
        status: 'Ordered',
        remarks: 'Bag Insert Station'
      },
      {
        id: 'p-tsf-03',
        projectId: 'proj-autopack',
        itemNo: 3,
        dwgNo: 'TSF-ST-003',
        partName: 'Station Pallet Stacker Foam',
        typeSpec: 'ชุดสถานีเรียงพาเลทโฟม',
        category: 'ME',
        partType: 'Standard Part',
        qty: 1,
        unit: 'SET',
        maker: 'Warsgate',
        supplier: 'Warsgate Workshop',
        targetUnitPrice: 690391,
        unitPrice: 690391,
        totalAmount: 690391,
        poNumber: 'PO252155',
        status: 'Ordered',
        remarks: 'Pallet Stacker'
      },
      {
        id: 'p-tsf-04',
        projectId: 'proj-autopack',
        itemNo: 4,
        dwgNo: 'TSF-ST-004',
        partName: 'Contron Box System',
        typeSpec: 'ตู้ควบคุมระบบไฟฟ้าและ PLC',
        category: 'EE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'SET',
        maker: 'Mitsubishi/OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 312000,
        unitPrice: 312000,
        totalAmount: 312000,
        poNumber: 'PO252155',
        status: 'Ordered',
        remarks: 'Control Box'
      },
      {
        id: 'p-tsf-05',
        projectId: 'proj-autopack',
        itemNo: 5,
        dwgNo: 'TSF-SRV-001',
        partName: 'Manpower and labor cost',
        typeSpec: 'ค่าแรงวิศวกร ประกอบ ติดตั้ง และทดสอบระบบ',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'JOB',
        maker: 'Warsgate',
        supplier: 'Engineering Team',
        targetUnitPrice: 575000,
        unitPrice: 575000,
        totalAmount: 575000,
        poNumber: 'PO252155',
        status: 'Ordered',
        remarks: 'Assembly & Labor'
      },
      {
        id: 'p-tsf-06',
        projectId: 'proj-autopack',
        itemNo: 6,
        dwgNo: 'TSF-SRV-002',
        partName: 'Transportation and accommodation',
        typeSpec: 'ค่าขนส่งและที่พักเดินทางหน้างานโรงงานชลบุรี',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'JOB',
        maker: 'Warsgate',
        supplier: 'Logistics',
        targetUnitPrice: 45000,
        unitPrice: 45000,
        totalAmount: 45000,
        poNumber: 'PO252155',
        status: 'Ordered',
        remarks: 'Logistics'
      },
      {
        id: 'p-tsf-07',
        projectId: 'proj-autopack',
        itemNo: 7,
        dwgNo: 'TSF-SRV-003',
        partName: 'Profit / Project Management & Warranty 1 year',
        typeSpec: 'ค่าบริหารโครงการและรับประกันระบบ 1 ปี',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'JOB',
        maker: 'Warsgate',
        supplier: 'Engineering Team',
        targetUnitPrice: 607600,
        unitPrice: 607600,
        totalAmount: 607600,
        poNumber: 'PO252155',
        status: 'Ordered',
        remarks: 'PM & Warranty 1 Year'
      }
    ]
  },
  {
    id: 'proj-pnp-z16',
    code: 'PRJ-2605-001',
    name: 'Zone 1-6 Automation & Structure Parts (Fujipart)',
    customer: 'บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด',
    customerId: '001',
    dwgNo: 'FJP-Z16-2026',
    targetBudget: 2411500,
    status: 'Active',
    totalPartsCount: 4,
    totalEstimatedCost: 2200000,
    suppliers: ['Warsgate', 'Misumi'],
    parts: [
      {
        id: 'p-z16-01',
        projectId: 'proj-pnp-z16',
        itemNo: 1,
        dwgNo: 'FJP-Z16-FAB',
        partName: 'Standard and Feb Part (Zone 1-6)',
        typeSpec: 'ชุดโครงสร้างและชิ้นส่วนประกอบมาตรฐาน Zone 1-6',
        category: 'ME',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Set',
        maker: 'Warsgate',
        supplier: 'Warsgate Workshop',
        targetUnitPrice: 1140000,
        unitPrice: 1140000,
        totalAmount: 1140000,
        poNumber: 'PO-2605001',
        status: 'Ordered',
        remarks: 'Zone 1-6 Structure Part'
      },
      {
        id: 'p-z16-02',
        projectId: 'proj-pnp-z16',
        itemNo: 2,
        dwgNo: 'FJP-Z16-LAB',
        partName: 'Manpower and Labor Cost',
        typeSpec: 'ค่าแรงประกอบ ติดตั้ง และทดสอบระบบ',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Job',
        maker: 'Warsgate',
        supplier: 'Engineering Team',
        targetUnitPrice: 670000,
        unitPrice: 670000,
        totalAmount: 670000,
        poNumber: 'PO-2605001',
        status: 'Ordered',
        remarks: 'Zone 1-6 Assembly Labor'
      },
      {
        id: 'p-z16-03',
        projectId: 'proj-pnp-z16',
        itemNo: 3,
        dwgNo: 'FJP-Z16-LOG',
        partName: 'Transportation and accommodation',
        typeSpec: 'ค่าขนส่งและที่พักหน้างานชลบุรี',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'EA',
        maker: 'Warsgate',
        supplier: 'Logistics',
        targetUnitPrice: 45000,
        unitPrice: 45000,
        totalAmount: 45000,
        poNumber: 'PO-2605001',
        status: 'Ordered',
        remarks: 'Site Logistics'
      },
      {
        id: 'p-z16-04',
        projectId: 'proj-pnp-z16',
        itemNo: 4,
        dwgNo: 'FJP-Z16-PM',
        partName: 'Project Management',
        typeSpec: 'ค่าบริหารโครงการและทดสอบระบบ Zone 1-6',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'EA',
        maker: 'Warsgate',
        supplier: 'Engineering Team',
        targetUnitPrice: 556500,
        unitPrice: 556500,
        totalAmount: 556500,
        poNumber: 'PO-2605001',
        status: 'Ordered',
        remarks: 'PM & Commissioning'
      }
    ]
  },
  {
    id: 'proj-pnp-z7',
    code: 'PRJ-2605-002',
    name: 'Zone 7 Automation & Structure Parts (Fujipart)',
    customer: 'บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด',
    customerId: '001',
    dwgNo: 'FJP-Z7-2026',
    targetBudget: 1177800,
    status: 'Active',
    totalPartsCount: 4,
    totalEstimatedCost: 1050000,
    suppliers: ['Warsgate', 'Misumi'],
    parts: [
      {
        id: 'p-z7-01',
        projectId: 'proj-pnp-z7',
        itemNo: 1,
        dwgNo: 'FJP-Z7-FAB',
        partName: 'Standard and Feb Part (Zone 7)',
        typeSpec: 'ชุดโครงสร้างและชิ้นส่วนประกอบมาตรฐาน Zone 7',
        category: 'ME',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Set',
        maker: 'Warsgate',
        supplier: 'Warsgate Workshop',
        targetUnitPrice: 641000,
        unitPrice: 641000,
        totalAmount: 641000,
        poNumber: 'PO-2605002',
        status: 'Ordered',
        remarks: 'Zone 7 Structure Part'
      },
      {
        id: 'p-z7-02',
        projectId: 'proj-pnp-z7',
        itemNo: 2,
        dwgNo: 'FJP-Z7-LAB',
        partName: 'Manpower and Labor Cost',
        typeSpec: 'ค่าแรงประกอบ ติดตั้ง และทดสอบระบบ Zone 7',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Job',
        maker: 'Warsgate',
        supplier: 'Engineering Team',
        targetUnitPrice: 220000,
        unitPrice: 220000,
        totalAmount: 220000,
        poNumber: 'PO-2605002',
        status: 'Ordered',
        remarks: 'Zone 7 Assembly Labor'
      },
      {
        id: 'p-z7-03',
        projectId: 'proj-pnp-z7',
        itemNo: 3,
        dwgNo: 'FJP-Z7-LOG',
        partName: 'Transportation and accommodation',
        typeSpec: 'ค่าขนส่งและที่พักหน้างานชลบุรี Zone 7',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'EA',
        maker: 'Warsgate',
        supplier: 'Logistics',
        targetUnitPrice: 45000,
        unitPrice: 45000,
        totalAmount: 45000,
        poNumber: 'PO-2605002',
        status: 'Ordered',
        remarks: 'Site Logistics'
      },
      {
        id: 'p-z7-04',
        projectId: 'proj-pnp-z7',
        itemNo: 4,
        dwgNo: 'FJP-Z7-PM',
        partName: 'Project Management',
        typeSpec: 'ค่าบริหารโครงการและทดสอบระบบ Zone 7',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'EA',
        maker: 'Warsgate',
        supplier: 'Engineering Team',
        targetUnitPrice: 271800,
        unitPrice: 271800,
        totalAmount: 271800,
        poNumber: 'PO-2605002',
        status: 'Ordered',
        remarks: 'PM & Commissioning'
      }
    ]
  },
  {
    id: 'proj-pnp-net',
    code: 'PRJ-2609-003',
    name: 'Network Infrastructure & Hardware Installation',
    customer: 'บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด',
    customerId: '001',
    dwgNo: 'NET-2609-01',
    targetBudget: 148450,
    status: 'Active',
    totalPartsCount: 7,
    totalEstimatedCost: 135000,
    suppliers: ['TP-Link', 'Link Cat6', 'Warsgate'],
    parts: [
      {
        id: 'p-net-01',
        projectId: 'proj-pnp-net',
        itemNo: 1,
        dwgNo: 'CONV-USB-LAN',
        partName: 'Convert USB to Lan',
        typeSpec: 'USB to RJ45 Adapter',
        category: 'IT',
        partType: 'Standard Part',
        qty: 15,
        unit: 'Sets',
        maker: 'TP-Link',
        supplier: 'IT Supplier',
        targetUnitPrice: 1500,
        unitPrice: 1500,
        totalAmount: 22500,
        poNumber: 'PO-2609002',
        status: 'Received',
        remarks: 'USB Lan Adapter'
      },
      {
        id: 'p-net-02',
        projectId: 'proj-pnp-net',
        itemNo: 2,
        dwgNo: 'PWR-DC-DC',
        partName: 'Power DC to DC Converter',
        typeSpec: 'DC-DC Step Down Converter',
        category: 'EE',
        partType: 'Standard Part',
        qty: 15,
        unit: 'Sets',
        maker: 'Mean Well',
        supplier: 'Omron/MeanWell Dealer',
        targetUnitPrice: 1990,
        unitPrice: 1990,
        totalAmount: 29850,
        poNumber: 'PO-2609002',
        status: 'Received',
        remarks: 'DC Converter'
      },
      {
        id: 'p-net-03',
        projectId: 'proj-pnp-net',
        itemNo: 3,
        dwgNo: 'SW-HUB-5P',
        partName: 'Switching Hub 5 Port',
        typeSpec: '5-Port 10/100/1000Mbps Switch',
        category: 'IT',
        partType: 'Standard Part',
        qty: 15,
        unit: 'Sets',
        maker: 'TP-Link',
        supplier: 'IT Supplier',
        targetUnitPrice: 1500,
        unitPrice: 1500,
        totalAmount: 22500,
        poNumber: 'PO-2609002',
        status: 'Received',
        remarks: 'Hub 5 Port'
      },
      {
        id: 'p-net-04',
        projectId: 'proj-pnp-net',
        itemNo: 4,
        dwgNo: 'LAN-CAT6-100',
        partName: 'สาย Lan Cat6 ความยาว 100 เมตร',
        typeSpec: 'UTP Cat6 Cable 100M',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Sets',
        maker: 'LINK',
        supplier: 'IT Supplier',
        targetUnitPrice: 3600,
        unitPrice: 3600,
        totalAmount: 3600,
        poNumber: 'PO-2609002',
        status: 'Received',
        remarks: 'Lan Cable 100m'
      },
      {
        id: 'p-net-05',
        projectId: 'proj-pnp-net',
        itemNo: 5,
        dwgNo: 'SW-HUB-IND',
        partName: 'Switching Hub 5 Port (Industrial)',
        typeSpec: '5-Port Industrial Grade DIN-Rail',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Set',
        maker: 'Moxa',
        supplier: 'Industrial Dealer',
        targetUnitPrice: 7000,
        unitPrice: 7000,
        totalAmount: 7000,
        poNumber: 'PO-2609002',
        status: 'Received',
        remarks: 'Industrial Hub'
      },
      {
        id: 'p-net-06',
        projectId: 'proj-pnp-net',
        itemNo: 6,
        dwgNo: 'ROLLER-PRN',
        partName: 'Roller Paper Printer',
        typeSpec: 'Thermal Printer Paper Roller Unit',
        category: 'ME',
        partType: 'Standard Part',
        qty: 15,
        unit: 'Sets',
        maker: 'Epson',
        supplier: 'Printer Supplier',
        targetUnitPrice: 1200,
        unitPrice: 1200,
        totalAmount: 18000,
        poNumber: 'PO-2609002',
        status: 'Received',
        remarks: 'Roller Unit'
      },
      {
        id: 'p-net-07',
        projectId: 'proj-pnp-net',
        itemNo: 7,
        dwgNo: 'SRV-INSTALL',
        partName: 'ค่าบริการติดตั้ง',
        typeSpec: 'Network Installation & Setup Service',
        category: 'SERVICE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Job',
        maker: 'Warsgate',
        supplier: 'Engineering Team',
        targetUnitPrice: 45000,
        unitPrice: 45000,
        totalAmount: 45000,
        poNumber: 'PO-2609002',
        status: 'Received',
        remarks: 'Network Setup'
      }
    ]
  },
  {
    id: 'proj-pnp-solsw',
    code: 'PRJ-2505-005',
    name: 'Traceability Solenoid Line Software (Fujipart)',
    customer: 'บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด',
    customerId: '001',
    dwgNo: 'SOL-SW-2025',
    targetBudget: 2173419,
    status: 'Completed',
    totalPartsCount: 2,
    totalEstimatedCost: 1850000,
    suppliers: ['Warsgate Software'],
    parts: [
      {
        id: 'p-solsw-01',
        projectId: 'proj-pnp-solsw',
        itemNo: 1,
        dwgNo: 'SW-TRACE-01',
        partName: 'Traceability Solenoid Line Software',
        typeSpec: 'Core Traceability Production Engine',
        category: 'SOFTWARE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Job',
        maker: 'Warsgate',
        supplier: 'Warsgate Software',
        targetUnitPrice: 2023419,
        unitPrice: 2023419,
        totalAmount: 2023419,
        poNumber: 'PO-2505005',
        status: 'Received',
        remarks: 'Main Software Engine'
      },
      {
        id: 'p-solsw-02',
        projectId: 'proj-pnp-solsw',
        itemNo: 2,
        dwgNo: 'SW-TRACE-02',
        partName: 'Traceability Solenoid Line Software เพิ่มเติม',
        typeSpec: 'Extended Module & Station Sync',
        category: 'SOFTWARE',
        partType: 'Standard Part',
        qty: 1,
        unit: 'Job',
        maker: 'Warsgate',
        supplier: 'Warsgate Software',
        targetUnitPrice: 150000,
        unitPrice: 150000,
        totalAmount: 150000,
        poNumber: 'PO-2505005',
        status: 'Received',
        remarks: 'Extended Module'
      }
    ]
  }
];

class BomBridgeService {
  private activeUrl: string | null = null;
  private isOnline: boolean = false;

  public getApiUrl(): string {
    const saved = localStorage.getItem(BOM_API_STORAGE_KEY);
    if (saved) return saved;
    return this.activeUrl || DEFAULT_API_URLS[0];
  }

  public setApiUrl(url: string) {
    localStorage.setItem(BOM_API_STORAGE_KEY, url);
    this.activeUrl = url;
  }

  // Check connection to BOM API
  public async checkConnection(): Promise<{ online: boolean; url: string; latency?: number }> {
    const customUrl = localStorage.getItem(BOM_API_STORAGE_KEY);
    const urlsToTry = customUrl ? [customUrl, ...DEFAULT_API_URLS] : DEFAULT_API_URLS;

    for (const url of urlsToTry) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
        
        const res = await fetch(`${url}/integration/projects-with-bom`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          this.activeUrl = url;
          this.isOnline = true;
          return { online: true, url, latency: Date.now() - startTime };
        }
      } catch (err) {
        // Continue to try next url
      }
    }

    this.isOnline = false;
    return { online: false, url: this.getApiUrl() };
  }

  // Fetch all projects with BOM parts
  public async fetchProjects(): Promise<{ projects: BomProject[]; isOnline: boolean; source: string }> {
    const check = await this.checkConnection();
    
    if (check.online && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/projects-with-bom`);
        if (res.ok) {
          const data: BomProject[] = await res.json();
          // Merge with fallback data for any missing projects
          const merged = [...data];
          for (const fb of FALLBACK_BOM_PROJECTS) {
            if (!merged.some(m => m.code === fb.code)) {
              merged.push(fb);
            }
          }
          return { projects: merged, isOnline: true, source: `Live BOM Server (${this.activeUrl})` };
        }
      } catch (err) {
        console.warn('Failed to parse live BOM data, using fallback cache:', err);
      }
    }

    return {
      projects: FALLBACK_BOM_PROJECTS,
      isOnline: false,
      source: 'ออฟไลน์แคช / ฐานข้อมูลตัวอย่างโครงการ Warsgate'
    };
  }

  // Fetch single project parts
  public async fetchProjectParts(projectId: string): Promise<BomPart[]> {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/projects/${projectId}/parts`);
        if (res.ok) {
          const data = await res.json();
          return data.parts || [];
        }
      } catch (err) {
        console.warn('Failed to fetch parts online, falling back:', err);
      }
    }

    const found = FALLBACK_BOM_PROJECTS.find(p => p.id === projectId || p.code === projectId);
    return found?.parts || [];
  }

  // Sync Quotation data back to BOM project
  public async syncQuotationToBom(projectId: string, payload: { quotationNo: string; customerPoNo?: string; grandTotal: number }) {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/sync-quotation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...payload })
        });
        return await res.json();
      } catch (err) {
        console.warn('Error syncing quotation to BOM:', err);
      }
    }
    return { success: true, mocked: true, message: 'Saved to local history' };
  }

  // Sync PO back to BOM parts (mark as ordered)
  public async syncPoToBom(partIds: string[], payload: { poNumber: string; supplier: string; orderDate?: string }) {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/sync-po`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partIds, ...payload })
        });
        return await res.json();
      } catch (err) {
        console.warn('Error syncing PO to BOM:', err);
      }
    }
    return { success: true, mocked: true, count: partIds.length };
  }

  // Sync Goods Receipt back to BOM parts (mark as received)
  public async syncGoodsReceiptToBom(partIds: string[], payload: { receiveDate?: string; storeLocation?: string; deliveryNoteNo?: string }) {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/sync-goods-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partIds, ...payload })
        });
        return await res.json();
      } catch (err) {
        console.warn('Error syncing goods receipt to BOM:', err);
      }
    }
    return { success: true, mocked: true, count: partIds.length };
  }

  // Fetch Project Cost & Procurement Analysis
  public async fetchProjectCostAnalysis(projectId: string) {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/cost-analysis/${projectId}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Error fetching cost analysis:', err);
      }
    }

    // Fallback calculation for offline mode
    const proj = FALLBACK_BOM_PROJECTS.find(p => p.id === projectId || p.code === projectId) || FALLBACK_BOM_PROJECTS[0];
    const totalParts = proj.parts?.length || proj.totalPartsCount || 0;
    const partsList = proj.parts || [];
    const ordered = partsList.filter(p => p.status === 'Ordered' || p.poNumber);
    const received = partsList.filter(p => p.status === 'Received');
    const estimatedCost = proj.totalEstimatedCost || proj.targetBudget || 0;
    const actualPurchasedCost = partsList.reduce((sum, p) => sum + ((p.unitPrice || p.targetUnitPrice) * p.qty), 0);

    return {
      project: {
        id: proj.id,
        code: proj.code,
        name: proj.name,
        customer: proj.customer,
        targetBudget: proj.targetBudget,
        status: proj.status
      },
      metrics: {
        totalParts,
        plannedCount: totalParts - ordered.length - received.length,
        orderedCount: ordered.length,
        receivedCount: received.length,
        orderedPercentage: totalParts > 0 ? Math.round(((ordered.length + received.length) / totalParts) * 100) : 0,
        receivedPercentage: totalParts > 0 ? Math.round((received.length / totalParts) * 100) : 0,
        estimatedCost,
        actualPurchasedCost,
        costVariance: actualPurchasedCost - estimatedCost,
        variancePercentage: 0
      },
      parts: partsList,
      modules: []
    };
  }
}

export const bomBridge = new BomBridgeService();
