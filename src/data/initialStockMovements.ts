import type { StockMovement } from '../types/index.ts';


export const STOCK_LOCATIONS = [
  { id: 'HQ_KHLONG_LUANG', name: 'คลังหลัก คลองหลวง (HQ Warehouse)', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'SITE_PNP', name: 'ไซต์งาน บจก. พีเอ็นพี (Chonburi)', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'SITE_TSF', name: 'ไซต์งาน บจก. ไทย เซกิซุย โฟม (TSF)', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'SITE_KURODA', name: 'ไซต์งาน บจก. คูโรดา เทคโน (Ayutthaya)', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'RND_LAB', name: 'คลังห้องปฏิบัติการ R&D & Test Bench', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'sm-1',
    date: '2026-09-20 10:30',
    productId: 'prod-wenglor-mvca101',
    productCode: 'MVCA101',
    productName: 'Machine Vision Controller uniVision AI',
    type: 'IN',
    quantity: 5,
    locationTo: 'HQ_KHLONG_LUANG',
    referenceDocNo: 'PO-2609-001',
    referenceProject: 'Vision Inspection Project',
    performedBy: 'สมชาย จัดหา',
    notes: 'รับสินค้าเข้าคลังหลักจากการสั่งซื้อ บจก. เวงเลอร์'
  },
  {
    id: 'sm-2',
    date: '2026-09-22 14:15',
    productId: 'prod-wenglor-mvca101',
    productCode: 'MVCA101',
    productName: 'Machine Vision Controller uniVision AI',
    type: 'TRANSFER',
    quantity: 2,
    locationFrom: 'HQ_KHLONG_LUANG',
    locationTo: 'SITE_KURODA',
    referenceDocNo: 'DO-2609-001',
    referenceProject: 'Vision Inspection Project',
    performedBy: 'ธนกฤต วิศวกรรม',
    notes: 'ส่งมอบเครื่องควบคุมวิชั่นไปยังไซต์งานคูโรดา โรจนะ'
  },
  {
    id: 'sm-3',
    date: '2026-09-24 09:00',
    productId: 'prod-1',
    productCode: 'PLC-S7-1200',
    productName: 'Siemens PLC SIMATIC S7-1200 CPU 1214C DC/DC/DC',
    type: 'OUT',
    quantity: 4,
    locationFrom: 'HQ_KHLONG_LUANG',
    referenceDocNo: 'DO-2609-002',
    referenceProject: 'PRJ-PNP-SOL',
    performedBy: 'ธนกฤต วิศวกรรม',
    notes: 'เบิกใช้ประกอบตู้คอนโทรลโครงการ Solenoid Line Zone 1-4'
  },
  {
    id: 'sm-4',
    date: '2026-09-25 16:45',
    productId: 'prod-2',
    productCode: 'SERVO-750W',
    productName: 'Omron Servo Motor & Driver Set 750W 3000RPM',
    type: 'TRANSFER',
    quantity: 3,
    locationFrom: 'HQ_KHLONG_LUANG',
    locationTo: 'SITE_TSF',
    referenceDocNo: 'DO-2609-003',
    referenceProject: 'PRJ-TSF-LM1',
    performedBy: 'สมชาย จัดหา',
    notes: 'โอนย้ายเซอร์โวมอเตอร์ไปติดตั้งเครื่อง TSF1 Auto Pack LM1'
  },
  {
    id: 'sm-5',
    date: '2026-09-27 11:20',
    productId: 'prod-wenglor-lmdx202',
    productCode: 'LMDX202',
    productName: 'Dome Light white-infrared light, 130 mm',
    type: 'IN',
    quantity: 10,
    locationTo: 'HQ_KHLONG_LUANG',
    referenceDocNo: 'PO-2609-004',
    performedBy: 'สมชาย จัดหา',
    notes: 'รับไฟส่องสว่างแบบโดมเข้าสต็อกสำรอง'
  }
];
