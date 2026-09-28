import type { BillingNote, WarrantyRetentionItem } from "../types/index.ts";
import { initialContacts } from "./initialData.ts";

export const initialBillingNotes: BillingNote[] = [
  {
    id: "bn-2608-001",
    documentNo: "BN-2608-001",
    issueDate: "2026-08-25",
    dueDate: "2026-09-30",
    contact: initialContacts[0], // บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด
    items: [
      {
        invoiceId: "inv-690800001",
        invoiceDocNo: "INV-690800001",
        referencePoNo: "2505004",
        projectName: "โครงการซอฟต์แวร์ Traceability Solenoid Line IMV & 5 Stations",
        issueDate: "2026-08-22",
        dueDate: "2026-09-22",
        subtotal: 2171495.20,
        vatAmount: 152004.66,
        whtAmount: 65144.86,
        grandTotal: 2323499.86,
        netPayment: 2258355.00
      },
      {
        invoiceId: "inv-2608-001",
        invoiceDocNo: "INV-2608-001",
        referencePoNo: "2607001",
        projectName: "โครงการชุดบอร์ดควบคุม PLC Line ADC & Data Center Line",
        issueDate: "2026-08-25",
        dueDate: "2026-09-25",
        subtotal: 1219916.00,
        vatAmount: 85394.12,
        whtAmount: 36597.48,
        grandTotal: 1305310.12,
        netPayment: 1268712.64
      }
    ],
    subtotal: 3391411.20,
    vatAmount: 237398.78,
    whtAmount: 101742.34,
    grandTotal: 3628809.98,
    netPayment: 3527067.64,
    notes: "วางบิลรอบประจำเดือนสิงหาคม 2569 ตามสัญญา PO: 2505004 และ PO: 2607001 เงื่อนไขชำระเงินโอนเข้าบัญชี บจก.วอร์สเกต",
    status: "PENDING",
    createdAt: "2026-08-25"
  }
];

export const initialWarrantyRetentions: WarrantyRetentionItem[] = [
  {
    id: "ret-25055",
    projectCode: "PRJ-PNP-EXP25",
    projectName: "Traceability Solenoid Line Software & Expansion",
    referencePoNo: "2505005",
    customerContact: initialContacts[0],
    contractAmount: 2325558.33,
    retentionPercent: 5,
    retentionAmount: 116277.92,
    warrantyPeriodMonths: 12,
    warrantyStartDate: "2025-11-30",
    warrantyEndDate: "2026-11-30",
    status: "UNDER_WARRANTY",
    notes: "รับประกันซอฟต์แวร์ 1 ปี ครบกำหนดปลดเงินประกันผลงาน 30 พ.ย. 2569"
  },
  {
    id: "ret-25054",
    projectCode: "PRJ-PNP-SOL",
    projectName: "Traceability Solenoid Line IMV & 5 Stations",
    referencePoNo: "2505004",
    customerContact: initialContacts[0],
    contractAmount: 4646999.71,
    retentionPercent: 5,
    retentionAmount: 232349.99,
    warrantyPeriodMonths: 12,
    warrantyStartDate: "2026-10-31",
    warrantyEndDate: "2027-10-31",
    status: "UNDER_WARRANTY",
    notes: "รับประกันระบบ 1 ปี นับจากวันตรวจรับ SAT ปลายเดือน ต.ค. 2569"
  },
  {
    id: "ret-26071",
    projectCode: "PRJ-PNP-PLC26",
    projectName: "ชุดบอร์ดควบคุม PLC Line ADC & Data Center Line",
    referencePoNo: "2607001",
    customerContact: initialContacts[0],
    contractAmount: 2610620.24,
    retentionPercent: 5,
    retentionAmount: 130531.01,
    warrantyPeriodMonths: 12,
    warrantyStartDate: "2026-10-30",
    warrantyEndDate: "2027-10-30",
    status: "UNDER_WARRANTY",
    notes: "รับประกันชุดควบคุมและบอร์ด PLC 1 ปี"
  },
  {
    id: "ret-26051",
    projectCode: "PRJ-PNP-FUJI1",
    projectName: "ระบบสายการผลิต Zone 1-6 (Fujipart Thailand)",
    referencePoNo: "2605001",
    customerContact: initialContacts[0],
    contractAmount: 2580305.00,
    retentionPercent: 5,
    retentionAmount: 129015.25,
    warrantyPeriodMonths: 12,
    warrantyStartDate: "2026-11-15",
    warrantyEndDate: "2027-11-15",
    status: "UNDER_WARRANTY",
    notes: "รับประกันโครงสร้างและระบบลำเลียง Zone 1-6"
  },
  {
    id: "ret-26052",
    projectCode: "PRJ-PNP-FUJI2",
    projectName: "ระบบสายการผลิต Zone 7 (Fujipart Thailand)",
    referencePoNo: "2605002",
    customerContact: initialContacts[0],
    contractAmount: 1260246.00,
    retentionPercent: 5,
    retentionAmount: 63012.30,
    warrantyPeriodMonths: 12,
    warrantyStartDate: "2026-11-15",
    warrantyEndDate: "2027-11-15",
    status: "UNDER_WARRANTY",
    notes: "รับประกันโครงสร้างและระบบลำเลียง Zone 7"
  },
  {
    id: "ret-252155",
    projectCode: "PRJ-107",
    projectName: "เครื่องจักร TSF1 Auto pack LM1 (Stacker & Insert Foam)",
    referencePoNo: "PO252155",
    customerContact: initialContacts[2], // บริษัท ไทย เซกิซุย โฟม จำกัด
    contractAmount: 3793792.00,
    retentionPercent: 5,
    retentionAmount: 189689.60,
    warrantyPeriodMonths: 12,
    warrantyStartDate: "2026-11-15",
    warrantyEndDate: "2027-11-15",
    status: "UNDER_WARRANTY",
    notes: "รับประกันเครื่องจักรกลและระบบ Automation 1 ปีเต็มตามสัญญา PO252155"
  },
  {
    id: "ret-26092",
    projectCode: "PRJ-PNP-NET26",
    projectName: "จัดซื้ออุปกรณ์ Network & งานบริการติดตั้ง",
    referencePoNo: "2609002",
    customerContact: initialContacts[0],
    contractAmount: 158841.50,
    retentionPercent: 5,
    retentionAmount: 7942.08,
    warrantyPeriodMonths: 12,
    warrantyStartDate: "2026-10-24",
    warrantyEndDate: "2027-10-24",
    status: "UNDER_WARRANTY",
    notes: "รับประกันอุปกรณ์เน็ตเวิร์กและสายสัญญาณ 1 ปี"
  }
];
