import type { ContractMilestonePlan } from '../types/index.ts';
import { initialContacts } from './initialData.ts';

export const initialMilestonePlans: ContractMilestonePlan[] = [
  // ─── PO: 2607001 (Line ADC PLC Control Board & Data Center) ───────────────────
  {
    id: 'plan-pnp-po2607001',
    contractTitle: 'โครงการชุดบอร์ดควบคุม PLC Line ADC & Data Center Line',
    quotationDocNo: 'QT-2607-001',
    referencePoNo: '2607001',
    projectCode: 'PRJ-527',
    projectName: 'Tracking ability Line ADC (PLC Control Board & Data Center)',
    customerContact: initialContacts[0], // บจก. พีเอ็นพี เทคโนโลยี เกรท
    totalContractAmount: 2610620.24,
    createdAt: '2026-07-17',
    updatedAt: '2026-09-28',
    notes: 'ตามใบสั่งซื้อ PO: 2607001 (รวมส่วนลดพิเศษ ฿45,560.00, เงื่อนไขการชำระเงินตามงวดส่งมอบ)',
    milestones: [
      {
        id: 'ms-2607-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: มัดจำลงนามสัญญาและสั่งซื้ออุปกรณ์ PLC Control Board (50%)',
        percentage: 50,
        amount: 1305310.12,
        dueDate: '2026-07-30',
        status: 'INVOICED',
        invoiceDocNo: 'INV-2608-001',
        notes: 'ออกใบแจ้งหนี้ INV-2608-001 วางบิลงวดที่ 1 เรียบร้อย รอการชำระเงิน'
      },
      {
        id: 'ms-2607-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: วายริ่งตู้ ติดตั้งระบบหน้างาน และทดสอบระบบ FAT (40%)',
        percentage: 40,
        amount: 1044248.10,
        dueDate: '2026-09-15',
        status: 'WAITING',
        notes: 'อยู่ระหว่างดำเนินการทดสอบ FAT รอวางบิลงวดที่ 2'
      },
      {
        id: 'ms-2607-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบงานขั้นสุดท้าย SAT & ตรวจรับระบบสมบูรณ์ (10%)',
        percentage: 10,
        amount: 261062.02,
        dueDate: '2026-10-31',
        status: 'WAITING',
        notes: 'รอส่งมอบ Final SAT'
      }
    ]
  },

  // ─── PO: 2605001 (Zone 1-6 Fujipart Thailand) ──────────────────────────────
  {
    id: 'plan-pnp-po2605001',
    contractTitle: 'โครงการระบบสายการผลิต Zone 1-6 (Fujipart Thailand)',
    quotationDocNo: 'QT-2605-001',
    referencePoNo: '2605001',
    projectCode: 'PRJ-PNP-Z1-6',
    projectName: 'Zone 1-6 Automation & Structure Parts',
    customerContact: initialContacts[0],
    totalContractAmount: 2580305.00,
    createdAt: '2026-05-02',
    updatedAt: '2026-09-28',
    notes: 'ตามใบสั่งซื้อ PO: 2605001 (เงื่อนไข: ชำระค่าสินค้าเมื่อส่งของครบตามใบสั่งซื้อ, วางบิลวันที่ 1-25)',
    milestones: [
      {
        id: 'ms-26051-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำเริ่มต้นโครงการและจัดซื้อชิ้นส่วนมาตรฐาน (30%)',
        percentage: 30,
        amount: 774091.50,
        dueDate: '2026-05-20',
        status: 'PAID',
        notes: 'รับชำระมัดจำงวดที่ 1 แล้ว'
      },
      {
        id: 'ms-26051-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ประกอบชิ้นงานและติดตั้งระบบหน้างาน Zone 1-6 (50%)',
        percentage: 50,
        amount: 1290152.50,
        dueDate: '2026-08-30',
        status: 'WAITING',
        notes: 'อยู่ระหว่างประกอบชิ้นงาน Zone 1-6 รอวางบิลงวดที่ 2'
      },
      {
        id: 'ms-26051-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบงานและตรวจรับ SAT สมบูรณ์ (20%)',
        percentage: 20,
        amount: 516061.00,
        dueDate: '2026-10-31',
        status: 'WAITING',
        notes: 'รอกำหนดตรวจรับ SAT'
      }
    ]
  },

  // ─── PO: 2605002 (Zone 7 Fujipart Thailand) ────────────────────────────────
  {
    id: 'plan-pnp-po2605002',
    contractTitle: 'โครงการระบบสายการผลิต Zone 7 (Fujipart Thailand)',
    quotationDocNo: 'QT-2605-002',
    referencePoNo: '2605002',
    projectCode: 'PRJ-PNP-Z7',
    projectName: 'Zone 7 Automation & Structure Parts',
    customerContact: initialContacts[0],
    totalContractAmount: 1260246.00,
    createdAt: '2026-05-02',
    updatedAt: '2026-09-28',
    notes: 'ตามใบสั่งซื้อ PO: 2605002 (รับเงินมัดจำงวดที่ 1 แล้ว ใบเสร็จ REC-2605-002/1)',
    milestones: [
      {
        id: 'ms-26052-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำเริ่มต้นโครงการ 30% (Downpayment 30%)',
        percentage: 30,
        amount: 378073.80,
        dueDate: '2026-05-25',
        status: 'PAID',
        invoiceDocNo: 'REC-2605-002/1',
        notes: 'รับชำระเงินมัดจำแล้วเมื่อ 25 พ.ค. 2569 (ใบเสร็จ REC-2605-002/1)'
      },
      {
        id: 'ms-26052-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ประกอบชิ้นงานและติดตั้งระบบหน้างาน Zone 7 (50%)',
        percentage: 50,
        amount: 630123.00,
        dueDate: '2026-08-30',
        status: 'WAITING',
        notes: 'อยู่ระหว่างประกอบชิ้นงาน Zone 7 รอวางบิลงวดที่ 2'
      },
      {
        id: 'ms-26052-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบงานและตรวจรับ SAT สมบูรณ์ (20%)',
        percentage: 20,
        amount: 252049.20,
        dueDate: '2026-10-31',
        status: 'WAITING',
        notes: 'รอกำหนดตรวจรับ SAT'
      }
    ]
  },

  // ─── PO: 2505005 (Traceability Solenoid Line Software) ──────────────────────
  {
    id: 'plan-pnp-po2505005',
    contractTitle: 'โครงการซอฟต์แวร์ Traceability Solenoid Line Software & Expansion',
    quotationDocNo: 'QT-2505-005',
    referencePoNo: '2505005',
    projectCode: 'PRJ-2505-005',
    projectName: 'Traceability Solenoid Line Software & Expansion',
    customerContact: initialContacts[0],
    totalContractAmount: 2325558.33,
    createdAt: '2025-05-26',
    updatedAt: '2026-09-28',
    notes: 'ตามใบสั่งซื้อ PO: 2505005 (เงื่อนไขการชำระเงิน: 30% Downpayment, 60% Test run & BuyOff, 10% Manual - ออก INV และเก็บเงินครบถ้วน 100%)',
    milestones: [
      {
        id: 'ms-25055-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำลงนามและเริ่มพัฒนาซอฟต์แวร์ 30% (Downpayment 30%)',
        percentage: 30,
        amount: 697667.50,
        dueDate: '2025-06-10',
        status: 'PAID',
        invoiceDocNo: 'REC-2505-005/1',
        notes: 'รับชำระมัดจำงวดที่ 1 เรียบร้อย (ใบเสร็จ REC-2505-005/1)'
      },
      {
        id: 'ms-25055-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ติดตั้งซอฟต์แวร์และทดสอบ Test Run & BuyOff (60%)',
        percentage: 60,
        amount: 1395335.00,
        dueDate: '2025-09-30',
        status: 'PAID',
        invoiceDocNo: 'REC-2505-005/2',
        notes: 'ทดสอบระบบผ่านและรับชำระเงินงวดที่ 2 เรียบร้อย (ใบเสร็จ REC-2505-005/2)'
      },
      {
        id: 'ms-25055-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบคู่มือการใช้งานและฝึกอบรม Manual & Training (10%)',
        percentage: 10,
        amount: 232555.83,
        dueDate: '2025-11-30',
        status: 'PAID',
        invoiceDocNo: 'INV-690600005',
        notes: 'ออกใบแจ้งหนี้ INV-690600005 และรับชำระเงินงวดสุดท้าย 10% ครบถ้วน (ใบเสร็จ REC-2505-005/3) ปิดโครงการ 100%'
      }
    ]
  },

  // ─── PO: 2609002 (Network Infrastructure & Hardware Installation) ───────────
  {
    id: 'plan-pnp-po2609002',
    contractTitle: 'โครงการจัดซื้ออุปกรณ์ Network & งานบริการติดตั้ง',
    quotationDocNo: 'QT-2609-003',
    referencePoNo: '2609002',
    projectCode: 'PRJ-PNP-NET26',
    projectName: 'Network Infrastructure & Hardware Installation',
    customerContact: initialContacts[0],
    totalContractAmount: 158841.50,
    createdAt: '2026-09-24',
    updatedAt: '2026-09-28',
    notes: 'ตามใบสั่งซื้อ PO: 2609002 (ชำระเมื่อส่งมอบและติดตั้งครบตามใบสั่งซื้อ)',
    milestones: [
      {
        id: 'ms-26092-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: ส่งมอบอุปกรณ์ Network และบริการติดตั้งครบ 100%',
        percentage: 100,
        amount: 158841.50,
        dueDate: '2026-10-24',
        status: 'INVOICED',
        notes: 'วางบิลตามใบสั่งซื้อ PO: 2609002'
      }
    ]
  },

  // ─── PO: 2505004 (Traceability Solenoid Line IMV & 5 Stations) ─────────────
  {
    id: 'plan-pnp-solenoid',
    contractTitle: 'โครงการซอฟต์แวร์ Traceability Solenoid Line IMV & 5 Stations',
    quotationDocNo: 'QT-2505-004',
    referencePoNo: '2505004',
    projectCode: 'PRJ-PNP-SOL',
    projectName: 'Traceability Solenoid Line IMV Complete System',
    customerContact: initialContacts[0], // PNP
    totalContractAmount: 4646999.71,
    createdAt: '2025-05-07',
    updatedAt: '2026-09-28',
    notes: 'เงื่อนไขการชำระเงินตามสัญญา 30% - 50% - 20%',
    milestones: [
      {
        id: 'ms-pnp-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำลงนามสัญญาและเริ่มดำเนินงาน (30%)',
        percentage: 30,
        amount: 1394099.91,
        dueDate: '2025-05-20',
        status: 'PAID',
        notes: 'รับชำระเงินมัดจำงวดที่ 1 (30%) เรียบร้อย'
      },
      {
        id: 'ms-pnp-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ติดตั้งซอฟต์แวร์และทดสอบระบบ Factory Acceptance Test (50%)',
        percentage: 50,
        amount: 2323499.86,
        dueDate: '2026-08-22',
        status: 'WAITING',
        invoiceDocNo: 'INV-690800001',
        notes: 'อยู่ระหว่างทดสอบ Factory Acceptance Test รอวางบิลงวดที่ 2 (50%)'
      },
      {
        id: 'ms-pnp-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบงานขั้นสุดท้าย Site Acceptance Test & Training (20%)',
        percentage: 20,
        amount: 929399.94,
        dueDate: '2026-10-31',
        status: 'WAITING',
        notes: 'รอส่งมอบงาน Final Site Acceptance (20%)'
      }
    ]
  },

  // ─── PO: PO252155 (Thai Sekisui Foam Co., Ltd.) ───────────────────────────
  {
    id: 'plan-tsf-autopack',
    contractTitle: 'โครงการเครื่องจักร TSF1 Auto pack LM1 (Thai Sekisui Foam)',
    quotationDocNo: 'QT-2512-2155',
    referencePoNo: 'PO252155',
    projectCode: 'PRJ-107',
    projectName: 'TSF1 Auto pack LM1 (Stacker, Open Bag & Insert Foam)',
    customerContact: initialContacts[2], // Thai Sekisui Foam
    totalContractAmount: 3793792.00,
    createdAt: '2025-12-24',
    updatedAt: '2026-09-28',
    notes: 'ตามใบสั่งซื้อ PO: PO252155 (Ref: CAP250095/ เงื่อนไขชำระเงิน: 40% Down [฿1,517,516.80], 30% After Process Work [฿1,138,137.60], 30% After Complete Work [฿1,138,137.60])',
    milestones: [
      {
        id: 'ms-tsf-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำลงนามสัญญาและสั่งซื้ออุปกรณ์หลัก (40% Downpayment)',
        percentage: 40,
        amount: 1517516.80,
        dueDate: '2026-01-14',
        status: 'PAID',
        invoiceDocNo: 'IV-690100001',
        notes: 'รับชำระเงินมัดจำ 40% เรียบร้อยตามใบแจ้งหนี้ IV-690100001'
      },
      {
        id: 'ms-tsf-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ประกอบชิ้นส่วน ติดตั้งระบบไฟฟ้า & FAT (30% After Process Work)',
        percentage: 30,
        amount: 1138137.60,
        dueDate: '2026-06-15',
        status: 'WAITING',
        notes: 'อยู่ระหว่างประกอบและทดสอบ Process Work รอวางบิลงวดที่ 2'
      },
      {
        id: 'ms-tsf-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบเครื่องจักรหน้างานและตรวจรับ SAT (30% After Complete Work)',
        percentage: 30,
        amount: 1138137.60,
        dueDate: '2026-11-15',
        status: 'WAITING',
        notes: 'รับประกัน 1 ปี กำหนดส่งมอบเครื่องจักรปลายปี 2569'
      }
    ]
  }
];
