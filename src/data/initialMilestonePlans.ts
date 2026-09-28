import type { ContractMilestonePlan } from '../types/index.ts';
import { initialContacts } from './initialData.ts';


export const initialMilestonePlans: ContractMilestonePlan[] = [
  {
    id: 'plan-pnp-solenoid',
    contractTitle: 'โครงการระบบตรวจสอบย้อนกลับ Solenoid Line (5 สถานี)',
    quotationDocNo: 'QT-2505-004',
    referencePoNo: '2505004',
    projectCode: 'PRJ-PNP-SOL',
    projectName: 'Traceability Solenoid Line Complete System',
    customerContact: initialContacts[0], // PNP
    totalContractAmount: 2323499.85,
    createdAt: '2026-05-10',
    updatedAt: '2026-09-28',
    notes: 'เงื่อนไขการชำระเงินตามสัญญา 50% - 40% - 10%',
    milestones: [
      {
        id: 'ms-pnp-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำลงนามสัญญาและสั่งซื้ออุปกรณ์หลัก (50%)',
        percentage: 50,
        amount: 1161749.93,
        dueDate: '2026-05-20',
        status: 'PAID',
        invoiceDocNo: 'INV-690800001',
        notes: 'ชำระเรียบร้อยแล้วเมื่อ 2026-05-25'
      },
      {
        id: 'ms-pnp-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ติดตั้งซอฟต์แวร์และทดสอบระบบ Factory Acceptance Test (40%)',
        percentage: 40,
        amount: 929399.94,
        dueDate: '2026-08-30',
        status: 'INVOICED',
        invoiceDocNo: 'INV-690600005',
        notes: 'ออกใบแจ้งหนี้แล้ว รอการชำระเงินตามรอบเครดิต 30 วัน'
      },
      {
        id: 'ms-pnp-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบงานขั้นสุดท้าย Site Acceptance Test & Training (10%)',
        percentage: 10,
        amount: 232349.98,
        dueDate: '2026-10-31',
        status: 'WAITING',
        notes: 'รอส่งมอบงาน Final Site Acceptance'
      }
    ]
  },
  {
    id: 'plan-tsf-autopack',
    contractTitle: 'เครื่องจักร TSF1 Auto pack LM1 (Stacker & Bag Insert)',
    quotationDocNo: 'QT-2601-TSF',
    referencePoNo: 'TSF-PO-2601',
    projectCode: 'PRJ-TSF-LM1',
    projectName: 'Auto Pack LM1 Foam Packaging Machine',
    customerContact: initialContacts[2], // Thai Sekisui Foam
    totalContractAmount: 2442800.00,
    createdAt: '2026-01-15',
    updatedAt: '2026-09-28',
    notes: 'สัญญาว่าจ้างผลิตเครื่องจักรอัตโนมัติ แบ่งจ่าย 30% - 50% - 20%',
    milestones: [
      {
        id: 'ms-tsf-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำเริ่มงานออกแบบและสั่งผลิตชิ้นส่วน (30%)',
        percentage: 30,
        amount: 732840.00,
        dueDate: '2026-01-30',
        status: 'PAID',
        invoiceDocNo: 'INV-2601-TSF1',
        notes: 'รับชำระมัดจำเรียบร้อย'
      },
      {
        id: 'ms-tsf-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ประกอบเครื่องจักร ติดตั้งระบบไฟฟ้า & FAT (50%)',
        percentage: 50,
        amount: 1221400.00,
        dueDate: '2026-06-15',
        status: 'INVOICED',
        invoiceDocNo: 'INV-2603-TSF2',
        notes: 'ทดสอบ FAT ผ่าน วางบิลเรียบร้อย'
      },
      {
        id: 'ms-tsf-3',
        milestoneNo: 3,
        title: 'งวดที่ 3: ส่งมอบเครื่องจักรหน้างานและตรวจรับ SAT (20%)',
        percentage: 20,
        amount: 488560.00,
        dueDate: '2026-11-15',
        status: 'WAITING',
        notes: 'กำหนดส่งมอบเครื่องจักรปลายปี 2569'
      }
    ]
  },
  {
    id: 'plan-kuroda-vision',
    contractTitle: 'ชุดระบบกล้องตรวจสอบชิ้นงาน AI Vision Machine B60',
    quotationDocNo: 'QT-2605-KUR',
    referencePoNo: 'KURODA-PO-089',
    projectCode: 'PRJ-KUR-B60',
    projectName: 'Machine Vision Controller & Camera Inspection',
    customerContact: initialContacts[1], // Kuroda
    totalContractAmount: 1074658.78,
    createdAt: '2026-05-12',
    updatedAt: '2026-09-28',
    notes: 'แบ่งชำระ 2 งวด 50% - 50%',
    milestones: [
      {
        id: 'ms-kur-1',
        milestoneNo: 1,
        title: 'งวดที่ 1: เงินมัดจำและสั่งซื้ออุปกรณ์ Vision Hardware (50%)',
        percentage: 50,
        amount: 537329.39,
        dueDate: '2026-05-25',
        status: 'PAID',
        invoiceDocNo: 'INV-2605-001',
        notes: 'รับชำระเงินมัดจำแล้ว'
      },
      {
        id: 'ms-kur-2',
        milestoneNo: 2,
        title: 'งวดที่ 2: ติดตั้งหน้างาน สอบเทียบความแม่นยำ AI & ส่งมอบ (50%)',
        percentage: 50,
        amount: 537329.39,
        dueDate: '2026-10-15',
        status: 'WAITING',
        notes: 'รอกำหนดการติดตั้งหน้างาน'
      }
    ]
  }
];
