import * as XLSX from "xlsx";
import { AccountingDocument, DocumentType, DocumentStatus } from "../types";

// Helper to translate document type
export const getDocTypeLabel = (type: DocumentType): string => {
  switch (type) {
    case "QUOTATION":
      return "ใบเสนอราคา (QT)";
    case "INVOICE":
      return "ใบแจ้งหนี้ (INV)";
    case "TAX_INVOICE":
      return "ใบกำกับภาษี (TAX)";
    case "RECEIPT":
      return "ใบเสร็จรับเงิน (REC)";
    case "PURCHASE_ORDER":
      return "ใบสั่งซื้อ (PO)";
    case "PURCHASE_INVOICE":
      return "ใบแจ้งหนี้ค่าใช้จ่าย";
    case "PAYMENT_VOUCHER":
      return "ใบสำคัญจ่าย";
    case "WHT_CERTIFICATE":
      return "หนังสือรับรองหัก ณ ที่จ่าย";
    default:
      return type;
  }
};

// Helper to translate status
export const getStatusLabel = (status: DocumentStatus): string => {
  switch (status) {
    case "DRAFT":
      return "ร่างเอกสาร";
    case "PENDING":
      return "รอดำเนินการ / รอชำระ";
    case "APPROVED":
      return "อนุมัติแล้ว";
    case "PAID":
      return "ชำระเงินแล้ว";
    case "OVERDUE":
      return "เกินกำหนดชำระ";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return status;
  }
};

// Helper to translate payment method
export const getPaymentMethodLabel = (method?: string): string => {
  switch (method) {
    case "BANK_TRANSFER":
      return "โอนเงินผ่านธนาคาร";
    case "CASH":
      return "เงินสด";
    case "CHEQUE":
      return "เช็คธนาคาร";
    case "CREDIT_CARD":
      return "บัตรเครดิต";
    default:
      return "-";
  }
};

/**
 * Export Sales & Revenue Documents to Excel (.xlsx)
 * @param documents List of AccountingDocument to export
 * @param titlePrefix Title/category prefix for filename and headers
 */
export const exportSalesToExcel = (
  documents: AccountingDocument[],
  titlePrefix: string = "รายงานเอกสารขาย"
) => {
  if (!documents || documents.length === 0) {
    alert("ไม่พบข้อมูลเอกสารสำหรับการส่งออก Excel");
    return;
  }

  // Create a new Workbook
  const workbook = XLSX.utils.book_new();

  // ── Sheet 1: สรุปรายการเอกสารขาย (Sales Summary) ───────────────────────────
  const summaryRows = documents.map((doc, index) => {
    // Combine items summary text
    const itemsSummary = (doc.items || [])
      .map((item) => `${item.name || item.description || ""} (${item.quantity} ${item.unit || "รายการ"})`)
      .join(", ");

    return {
      "ลำดับ": index + 1,
      "เลขที่เอกสาร": doc.documentNo || "-",
      "ประเภทเอกสาร": getDocTypeLabel(doc.type),
      "วันที่ออกเอกสาร": doc.issueDate || "-",
      "วันที่ครบกำหนด": doc.dueDate || "-",
      "เลขที่ PO ลูกค้า": doc.referencePoNo || "-",
      "เลขที่เอกสารอ้างอิง": doc.referenceDocNo || "-",
      "ชื่อลูกค้า / นิติบุคคล": doc.contact?.companyName || doc.contact?.name || "-",
      "ผู้ติดต่อ": doc.contact?.name || "-",
      "เบอร์โทรศัพท์": doc.contact?.phone || "-",
      "อีเมล": doc.contact?.email || "-",
      "เลขประจำตัวผู้เสียภาษี": doc.contact?.taxId || "-",
      "สาขา": doc.contact?.isBranch ? (doc.contact?.branchCode || "สาขาย่อย") : "สำนักงานใหญ่",
      "ที่อยู่ลูกค้า": doc.contact?.address || "-",
      "รายการสินค้า/บริการ": itemsSummary || "-",
      "มูลค่ารวมก่อนภาษี (บาท)": Number(doc.subtotal || 0),
      "ส่วนลดรวม (บาท)": Number(doc.discountTotal || 0),
      "มูลค่าหลังหักส่วนลด (บาท)": Number((doc.subtotal || 0) - (doc.discountTotal || 0)),
      "ภาษีมูลค่าเพิ่ม 7% (บาท)": Number(doc.vatAmount || 0),
      "ยอดรวมทั้งสิ้น (บาท)": Number(doc.grandTotal || 0),
      "ภาษีหัก ณ ที่จ่าย (บาท)": Number(doc.withholdingTaxTotal || 0),
      "ยอดรับสุทธิ (บาท)": Number(doc.netPayment || doc.grandTotal || 0),
      "สถานะ": getStatusLabel(doc.status),
      "วิธีการชำระเงิน": getPaymentMethodLabel(doc.paymentMethod),
      "บัญชีรับเงิน": doc.bankAccount || "-",
      "ผู้สร้างเอกสาร": doc.createdByName || "-",
      "หมายเหตุ": doc.notes || "-",
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  // Auto-fit column widths for Sheet 1
  const summaryColWidths = [
    { wch: 6 },  // ลำดับ
    { wch: 18 }, // เลขที่เอกสาร
    { wch: 18 }, // ประเภทเอกสาร
    { wch: 14 }, // วันที่ออกเอกสาร
    { wch: 14 }, // วันที่ครบกำหนด
    { wch: 18 }, // เลขที่ PO ลูกค้า
    { wch: 18 }, // เลขที่เอกสารอ้างอิง
    { wch: 32 }, // ชื่อลูกค้า
    { wch: 20 }, // ผู้ติดต่อ
    { wch: 16 }, // เบอร์โทร
    { wch: 24 }, // อีเมล
    { wch: 18 }, // เลขประจำตัวผู้เสียภาษี
    { wch: 15 }, // สาขา
    { wch: 35 }, // ที่อยู่
    { wch: 40 }, // รายการสินค้า
    { wch: 22 }, // มูลค่ารวมก่อนภาษี
    { wch: 16 }, // ส่วนลด
    { wch: 22 }, // มูลค่าหลังหักส่วนลด
    { wch: 20 }, // VAT 7%
    { wch: 20 }, // ยอดรวมทั้งสิ้น
    { wch: 20 }, // WHT
    { wch: 20 }, // ยอดรับสุทธิ
    { wch: 18 }, // สถานะ
    { wch: 20 }, // วิธีการชำระเงิน
    { wch: 20 }, // บัญชีรับเงิน
    { wch: 16 }, // ผู้สร้าง
    { wch: 30 }, // หมายเหตุ
  ];
  wsSummary["!cols"] = summaryColWidths;

  XLSX.utils.book_append_sheet(workbook, wsSummary, "สรุปรายการเอกสาร");

  // ── Sheet 2: รายละเอียดสินค้าและบริการ (Item Breakdown) ─────────────────────
  const itemRows: any[] = [];
  let itemCounter = 1;

  documents.forEach((doc) => {
    if (doc.items && doc.items.length > 0) {
      doc.items.forEach((item) => {
        itemRows.push({
          "ลำดับ": itemCounter++,
          "เลขที่เอกสาร": doc.documentNo || "-",
          "ประเภทเอกสาร": getDocTypeLabel(doc.type),
          "วันที่ออกเอกสาร": doc.issueDate || "-",
          "เลขที่ PO ลูกค้า": doc.referencePoNo || "-",
          "ชื่อลูกค้า / นิติบุคคล": doc.contact?.companyName || doc.contact?.name || "-",
          "รหัสสินค้า/บริการ": item.code || "-",
          "ชื่อสินค้า/รายการ": item.name || "-",
          "รายละเอียด": item.description || "-",
          "จำนวน": Number(item.quantity || 0),
          "หน่วยนับ": item.unit || "รายการ",
          "ราคาต่อหน่วย (บาท)": Number(item.pricePerUnit || 0),
          "ส่วนลดต่อรายการ (บาท)": Number(item.discount || 0),
          "จำนวนเงินรวม (บาท)": Number(item.amount || 0),
          "มีภาษี VAT": item.vatInclusive ? "รวมภาษี" : "แยกภาษี",
          "อัตราหัก ณ ที่จ่าย (%)": Number(item.withholdingTaxRate || 0),
          "สถานะเอกสาร": getStatusLabel(doc.status),
        });
      });
    }
  });

  if (itemRows.length > 0) {
    const wsItems = XLSX.utils.json_to_sheet(itemRows);
    const itemsColWidths = [
      { wch: 6 },  // ลำดับ
      { wch: 18 }, // เลขที่เอกสาร
      { wch: 18 }, // ประเภทเอกสาร
      { wch: 14 }, // วันที่ออกเอกสาร
      { wch: 18 }, // เลขที่ PO ลูกค้า
      { wch: 32 }, // ชื่อลูกค้า
      { wch: 16 }, // รหัสสินค้า
      { wch: 28 }, // ชื่อสินค้า
      { wch: 35 }, // รายละเอียด
      { wch: 10 }, // จำนวน
      { wch: 10 }, // หน่วย
      { wch: 18 }, // ราคาต่อหน่วย
      { wch: 16 }, // ส่วนลด
      { wch: 18 }, // จำนวนเงินรวม
      { wch: 12 }, // มีภาษี VAT
      { wch: 18 }, // อัตราหัก ณ ที่จ่าย
      { wch: 18 }, // สถานะเอกสาร
    ];
    wsItems["!cols"] = itemsColWidths;
    XLSX.utils.book_append_sheet(workbook, wsItems, "รายละเอียดสินค้าและบริการ");
  }

  // Generate Filename with Timestamp
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const cleanTitle = titlePrefix.replace(/[/\\?%*:|"<>]/g, "_");
  const filename = `${cleanTitle}_${dateStr}_${timeStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, filename);
};
