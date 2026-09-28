import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

import {
  initialCompanyProfile,
  initialBankAccounts,
  initialContacts,
  initialProducts,
  initialDocuments,
  initialChartOfAccounts,
  initialJournalEntries
} from '../src/data/initialData.ts';
import { initialMilestonePlans } from '../src/data/initialMilestonePlans.ts';
import { initialBillingNotes, initialWarrantyRetentions } from '../src/data/initialBillingNotes.ts';
import { initialStockMovements, STOCK_LOCATIONS } from '../src/data/initialStockMovements.ts';
import { AVAILABLE_USER_PROFILES } from '../src/data/userRoles.ts';
import { initialAuditLogs } from '../src/utils/auditLogger.ts';
import { defaultNumberingConfig } from '../src/utils/numbering.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backupsDir = path.resolve(projectRoot, 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Current date formatted YYYY-MM-DD
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
const timestampIso = `${dateStr}T${timeStr}+07:00`;

// 1. Prepare Full Database Backup Payload
const backupPayload = {
  version: '2.0.0',
  backupDate: timestampIso,
  appName: 'WARSGATE Accounting & ERP System',
  metadata: {
    documentsCount: initialDocuments.length,
    contactsCount: initialContacts.length,
    productsCount: initialProducts.length,
    chartOfAccountsCount: initialChartOfAccounts.length,
    journalEntriesCount: initialJournalEntries.length,
    bankAccountsCount: initialBankAccounts.length,
    milestonePlansCount: initialMilestonePlans.length,
    billingNotesCount: initialBillingNotes.length,
    warrantyRetentionsCount: initialWarrantyRetentions.length,
    stockMovementsCount: initialStockMovements.length,
    auditLogsCount: initialAuditLogs.length,
    userRolesCount: AVAILABLE_USER_PROFILES.length,
  },
  company: initialCompanyProfile,
  numberingConfig: defaultNumberingConfig,
  bankAccounts: initialBankAccounts,
  contacts: initialContacts,
  products: initialProducts,
  documents: initialDocuments,
  chartOfAccounts: initialChartOfAccounts,
  journalEntries: initialJournalEntries,
  milestonePlans: initialMilestonePlans,
  billingNotes: initialBillingNotes,
  warrantyRetentions: initialWarrantyRetentions,
  stockMovements: initialStockMovements,
  stockLocations: STOCK_LOCATIONS,
  userProfiles: AVAILABLE_USER_PROFILES,
  auditLogs: initialAuditLogs
};

// 2. Save JSON files
const latestJsonPath = path.join(backupsDir, 'warsgate_backup_latest.json');
const datedJsonPath = path.join(backupsDir, `warsgate_backup_${dateStr}.json`);

fs.writeFileSync(latestJsonPath, JSON.stringify(backupPayload, null, 2), 'utf8');
fs.writeFileSync(datedJsonPath, JSON.stringify(backupPayload, null, 2), 'utf8');

console.log(`✅ [JSON Backup] Created:`);
console.log(`   - ${latestJsonPath}`);
console.log(`   - ${datedJsonPath}`);

// 3. Generate Multi-sheet Excel Backup
const wb = XLSX.utils.book_new();

// Sheet: Company
const companyData = [
  { 'หัวข้อ': 'ชื่อบริษัท (ไทย)', 'ข้อมูล': initialCompanyProfile.name },
  { 'หัวข้อ': 'ชื่อบริษัท (English)', 'ข้อมูล': initialCompanyProfile.nameEn || '' },
  { 'หัวข้อ': 'เลขประจำตัวผู้เสียภาษี', 'ข้อมูล': initialCompanyProfile.taxId },
  { 'หัวข้อ': 'สาขา', 'ข้อมูล': initialCompanyProfile.branchCode },
  { 'หัวข้อ': 'ที่อยู่', 'ข้อมูล': initialCompanyProfile.address },
  { 'หัวข้อ': 'เบอร์โทร', 'ข้อมูล': initialCompanyProfile.phone },
  { 'หัวข้อ': 'อีเมล', 'ข้อมูล': initialCompanyProfile.email },
  { 'หัวข้อ': 'เว็บไซต์', 'ข้อมูล': initialCompanyProfile.website },
  { 'หัวข้อ': 'ผู้มีอำนาจลงนาม', 'ข้อมูล': initialCompanyProfile.authorizedSignatory },
  { 'หัวข้อ': 'ตำแหน่ง', 'ข้อมูล': initialCompanyProfile.signatoryPosition || '' },
];
const wsCompany = XLSX.utils.json_to_sheet(companyData);
XLSX.utils.book_append_sheet(wb, wsCompany, 'Company');

// Sheet: Contacts
const contactsData = initialContacts.map(c => ({
  'ID': c.id,
  'ประเภท': c.type === 'CUSTOMER' ? 'ลูกค้า (Customer)' : c.type === 'SUPPLIER' ? 'ซัพพลายเออร์ (Supplier)' : 'ทั้งลูกค้าและคู่ค้า',
  'ชื่อผู้ติดต่อ': c.name,
  'ชื่อบริษัท/องค์กร': c.companyName,
  'เลขประจำตัวผู้เสียภาษี': c.taxId,
  'สาขา': c.branchCode || 'สำนักงานใหญ่',
  'ที่อยู่': c.address,
  'เบอร์โทรศัพท์': c.phone,
  'อีเมล': c.email,
  'เครดิตเทอม (วัน)': c.creditDays,
  'จำนวนธุรกรรม': c.totalTransactions || 0,
  'ยอดคงค้าง (บาท)': c.balanceDue || 0,
}));
const wsContacts = XLSX.utils.json_to_sheet(contactsData);
XLSX.utils.book_append_sheet(wb, wsContacts, 'Contacts');

// Sheet: Products
const productsData = initialProducts.map(p => ({
  'ID': p.id,
  'รหัสสินค้า': p.code,
  'ชื่อสินค้า/บริการ': p.name,
  'ประเภท': p.type,
  'หมวดหมู่': p.category,
  'หน่วยนับ': p.unit,
  'ราคาขาย (บาท)': p.unitPrice,
  'ราคาทุน (บาท)': p.costPrice || 0,
  'จำนวนคงเหลือ': p.stockQty,
  'จุดเตือนสั่งซื้อ': p.minStockAlert,
  'รายละเอียด': p.description || '',
}));
const wsProducts = XLSX.utils.json_to_sheet(productsData);
XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

// Sheet: Documents Summary
const docsData = initialDocuments.map(d => ({
  'ID': d.id,
  'ประเภทเอกสาร': d.type,
  'เลขที่เอกสาร': d.documentNo,
  'วันที่ออกเอกสาร': d.issueDate,
  'วันครบกำหนด': d.dueDate || '',
  'ชื่อลูกค้า/ซัพพลายเออร์': d.contact?.companyName || d.contact?.name || '',
  'เลขอ้างอิง PO ลูกค้า': d.referencePoNo || '',
  'โครงการ': d.projectNote || '',
  'ยอดก่อนภาษี (Subtotal)': d.subtotal,
  'ภาษีมูลค่าเพิ่ม (VAT 7%)': d.vatAmount,
  'ยอดรวมทั้งสิ้น (Grand Total)': d.grandTotal,
  'หัก ณ ที่จ่าย (WHT)': d.withholdingTaxTotal || 0,
  'ยอดชำระสุทธิ (Net Total)': d.netPayment || d.grandTotal,
  'สถานะ': d.status,
  'หมายเหตุ': d.notes || '',
}));
const wsDocs = XLSX.utils.json_to_sheet(docsData);
XLSX.utils.book_append_sheet(wb, wsDocs, 'Documents');

// Sheet: Document Items Detail
const docItemsData = [];
initialDocuments.forEach(d => {
  (d.items || []).forEach((item, idx) => {
    docItemsData.push({
      'เลขที่เอกสาร': d.documentNo,
      'ประเภทเอกสาร': d.type,
      'วันที่': d.issueDate,
      'ลูกค้า/คู่ค้า': d.contact?.companyName || d.contact?.name || '',
      'ลำดับที่': idx + 1,
      'รหัสสินค้า': item.code || '',
      'ชื่อรายการสินค้า/บริการ': item.name,
      'จำนวน': item.quantity,
      'หน่วย': item.unit || '',
      'ราคาต่อหน่วย': item.pricePerUnit || 0,
      'ส่วนลด (บาท)': item.discount || 0,
      'จำนวนเงิน (บาท)': item.amount || 0,
    });
  });
});
const wsDocItems = XLSX.utils.json_to_sheet(docItemsData);
XLSX.utils.book_append_sheet(wb, wsDocItems, 'Doc_Items');

// Sheet: Milestone Progressive Billing Plans
const milestoneData = [];
initialMilestonePlans.forEach(p => {
  p.milestones.forEach(m => {
    milestoneData.push({
      'รหัสสัญญา': p.id,
      'ชื่อสัญญา/โครงการ': p.contractTitle,
      'ลูกค้า': p.customerContact.companyName,
      'เลขที่ PO': p.referencePoNo || '',
      'ใบเสนอราคา QT': p.quotationDocNo || '',
      'มูลค่าสัญญารวม (บาท)': p.totalContractAmount,
      'งวดที่': m.milestoneNo,
      'ชื่องวดงาน': m.title,
      'สัดส่วน (%)': m.percentage,
      'จำนวนเงินงวด (บาท)': m.amount,
      'กำหนดวางบิล': m.dueDate || '',
      'สถานะงวด': m.status,
      'เลขที่ใบแจ้งหนี้ Invoice': m.invoiceDocNo || '',
    });
  });
});
const wsMilestones = XLSX.utils.json_to_sheet(milestoneData);
XLSX.utils.book_append_sheet(wb, wsMilestones, 'MilestonePlans');


// Sheet: Billing Notes (ใบวางบิลรวม)
const billingNotesData = [];
initialBillingNotes.forEach(bn => {
  bn.items.forEach(item => {
    billingNotesData.push({
      "เลขที่ใบวางบิล": bn.documentNo,
      "วันที่ออก": bn.issueDate,
      "กำหนดชำระ": bn.dueDate,
      "วันนัดจ่ายเช็ค": bn.chequeDate || "",
      "ลูกค้า": bn.contact.companyName,
      "เลขที่ใบแจ้งหนี้": item.invoiceDocNo,
      "โครงการ / PO": item.projectName || item.referencePoNo || "",
      "ยอดก่อนภาษี (บาท)": item.subtotal,
      "ภาษี VAT 7%": item.vatAmount,
      "หัก ณ ที่จ่าย 3%": item.whtAmount,
      "ยอดสุทธิ (บาท)": item.netPayment,
      "สถานะใบวางบิล": bn.status,
      "หมายเหตุ": bn.notes || "",
    });
  });
});
const wsBillingNotes = XLSX.utils.json_to_sheet(billingNotesData);
XLSX.utils.book_append_sheet(wb, wsBillingNotes, "BillingNotes");

// Sheet: Warranty & Retention (เงินประกันผลงาน & รับประกัน)
const retentionData = initialWarrantyRetentions.map(r => ({
  "รหัส": r.id,
  "โครงการ": r.projectName,
  "เลขที่ PO": r.referencePoNo,
  "ลูกค้า": r.customerContact.companyName,
  "มูลค่าสัญญา (บาท)": r.contractAmount,
  "สัดส่วน Retention (%)": r.retentionPercent,
  "ยอดเงินประกันผลงาน (บาท)": r.retentionAmount,
  "ระยะเวลารับประกัน (เดือน)": r.warrantyPeriodMonths,
  "วันเริ่มรับประกัน": r.warrantyStartDate,
  "วันสิ้นสุดรับประกัน": r.warrantyEndDate,
  "สถานะเงินประกัน": r.status,
  "หมายเหตุ": r.notes || "",
}));
const wsRetention = XLSX.utils.json_to_sheet(retentionData);
XLSX.utils.book_append_sheet(wb, wsRetention, "WarrantyRetentions");

// Sheet: Stock Movements Ledger
const stockMovementsData = initialStockMovements.map(m => ({
  'ID': m.id,
  'วัน-เวลา': m.date,
  'รหัสสินค้า': m.productCode,
  'ชื่อสินค้า/อุปกรณ์': m.productName,
  'ประเภท': m.type,
  'จำนวน': m.quantity,
  'สถานที่ต้นทาง': m.locationFrom || '',
  'สถานที่ปลายทาง': m.locationTo || '',
  'เอกสารอ้างอิง': m.referenceDocNo || '',
  'โครงการ': m.referenceProject || '',
  'ผู้ทำรายการ': m.performedBy,
  'หมายเหตุ': m.notes || '',
}));
const wsStockMovements = XLSX.utils.json_to_sheet(stockMovementsData);
XLSX.utils.book_append_sheet(wb, wsStockMovements, 'StockMovements');

// Sheet: Chart of Accounts
const coaData = initialChartOfAccounts.map(c => ({
  'รหัสบัญชี': c.code,
  'ชื่อบัญชี': c.name,
  'หมวดบัญชี': c.category,
  'ประเภทเดบิต/เครดิตปกติ': c.type || '',
  'เดบิต (Dr)': c.debit,
  'เครดิต (Cr)': c.credit,
}));
const wsCoa = XLSX.utils.json_to_sheet(coaData);
XLSX.utils.book_append_sheet(wb, wsCoa, 'ChartOfAccounts');

// Sheet: Journal Entries
const jvData = [];
initialJournalEntries.forEach(j => {
  (j.entries || []).forEach((entry, idx) => {
    jvData.push({
      'เลขที่ใบสำคัญ': j.jvNo,
      'วันที่': j.date,
      'คำอธิบายรายการ': j.description,
      'เอกสารอ้างอิง': j.referenceNo || '',
      'ลำดับ': idx + 1,
      'รหัสบัญชี': entry.accountCode,
      'ชื่อบัญชี': entry.accountName,
      'เดบิต (Debit)': entry.debit || 0,
      'เครดิต (Credit)': entry.credit || 0,
    });
  });
});
const wsJv = XLSX.utils.json_to_sheet(jvData);
XLSX.utils.book_append_sheet(wb, wsJv, 'JournalEntries');

// Sheet: Bank Accounts
const bankData = initialBankAccounts.map(b => ({
  'ID': b.id,
  'ธนาคาร': b.bankName,
  'ชื่อบัญชี': b.accountName,
  'เลขที่บัญชี': b.accountNo,
  'สาขา': b.branch,
  'ประเภทบัญชี': b.accountType,
  'ยอดเงินคงเหลือ': b.balance,
  'บัญชีหลัก': b.isDefault ? 'ใช่ (Default)' : 'ไม่ใช่',
}));
const wsBank = XLSX.utils.json_to_sheet(bankData);
XLSX.utils.book_append_sheet(wb, wsBank, 'BankAccounts');

// Sheet: User Roles & Permissions
const userRolesData = AVAILABLE_USER_PROFILES.map(u => ({
  'ID': u.id,
  'ชื่อ-นามสกุล': u.name,
  'ตำแหน่ง': u.roleTitle,
  'รหัสบทบาท': u.role,
  'แผนก': u.department,
  'อีเมล': u.email,
  'อนุมัติเอกสาร': u.permissions.canApprove ? 'ใช่' : 'ไม่ใช่',
  'ดูงบ P&L': u.permissions.canViewPnL ? 'ใช่' : 'ไม่ใช่',
  'ออก Invoice': u.permissions.canIssueInvoices ? 'ใช่' : 'ไม่ใช่',
  'ออก PO': u.permissions.canIssuePO ? 'ใช่' : 'ไม่ใช่',
  'จัดการ BOM': u.permissions.canEditBOM ? 'ใช่' : 'ไม่ใช่',
  'จัดการภาษี': u.permissions.canManageTax ? 'ใช่' : 'ไม่ใช่',
}));
const wsUserRoles = XLSX.utils.json_to_sheet(userRolesData);
XLSX.utils.book_append_sheet(wb, wsUserRoles, 'UserRoles');

// Sheet: Audit Trail Logs
const auditLogsData = initialAuditLogs.map(l => ({
  'ID': l.id,
  'วัน-เวลา': l.timestamp,
  'ผู้ทำรายการ': l.userName,
  'บทบาท': l.userRole,
  'ประเภทการกระทำ': l.action,
  'เอกสารอ้างอิง': l.targetDocNo || '',
  'รายละเอียด': l.details,
  'IP Address': l.ipAddress || '',
}));
const wsAuditLogs = XLSX.utils.json_to_sheet(auditLogsData);
XLSX.utils.book_append_sheet(wb, wsAuditLogs, 'AuditLogs');

// Save Excel files
const latestExcelPath = path.join(backupsDir, 'warsgate_accounting_backup_latest.xlsx');
const datedExcelPath = path.join(backupsDir, `warsgate_accounting_backup_${dateStr}.xlsx`);

XLSX.writeFile(wb, latestExcelPath);
XLSX.writeFile(wb, datedExcelPath);

console.log(`✅ [Excel Backup] Created:`);
console.log(`   - ${latestExcelPath}`);
console.log(`   - ${datedExcelPath}`);

// 4. Create README in backups directory
const readmeContent = `# WARSGATE Accounting & ERP System - Full Database Backups

ไดเรกทอรีนี้บรรจุไฟล์สำรองฐานข้อมูลทั้งหมดของระบบบัญชีและ ERP **บริษัท วอร์สเกต จำกัด** 
เพื่อความปลอดภัยสูงสุดของข้อมูลการเงิน, สัญญาโครงการ, และสต็อกอะไหล่เครื่องจักร

## 📁 ไฟล์สำรองข้อมูลล่าสุด (Latest Backups ณ วันที่ ${timestampIso})

1. **\`warsgate_backup_latest.json\`** (และไฟล์ประจำวัน \`warsgate_backup_${dateStr}.json\`)
   - ไฟล์ JSON ครบถ้วน 100% รวมเอกสารทั้งหมด, รายการสินค้า, ลูกค้า, ผังบัญชี, แผนงวดงานสัญญา, สต็อก Ledger, ผู้ใช้งาน และ Audit Logs
   - ใช้สำหรับกู้คืนระบบ (Restore) ผ่านหน้าเว็บหรือ CLI

2. **\`warsgate_accounting_backup_latest.xlsx\`** (และไฟล์ประจำวัน \`warsgate_accounting_backup_${dateStr}.xlsx\`)
   - ไฟล์ Excel รวม 11 Sheets ครอบคลุม:
     - **Company**: ข้อมูลองค์กร และเลขประจำตัวผู้เสียภาษี
     - **Contacts**: รายชื่อลูกค้า / ซัพพลายเออร์ และยอดคงเหลือ
     - **Products**: แคตตาล็อกสินค้า, ราคาขาย, ราคาทุน, สต็อกคงเหลือ
     - **Documents**: สรุปเอกสารบัญชีทุกฉบับ (ใบเสนอราคา, ใบแจ้งหนี้, ใบเสร็จ, ใบส่งของ, ใบสั่งซื้อ ฯลฯ)
     - **Doc_Items**: รายการสินค้าย่อยในเอกสารแต่ละใบ
     - **MilestonePlans**: สัญญาและแผนวางบิลตามงวดงาน (50-40-10, 30-50-20)
     - **StockMovements**: สมุดบันทึกความเคลื่อนไหวสต็อก (Stock Ledger)
     - **ChartOfAccounts**: ผังบัญชี 5 หมวด
     - **JournalEntries**: สมุดรายวันทั่วไป (JV)
     - **BankAccounts**: บัญชีธนาคาร
     - **UserRoles**: สิทธิ์ผู้ใช้งาน 5 แผนก
     - **AuditLogs**: ประวัติการทำรายการในระบบ

## 🚀 คำสั่งสำรองและกู้คืนข้อมูลผ่าน Terminal
- **สำรองข้อมูลทันที**:
  \`\`\`bash
  npm run backup
  \`\`\`
- **ตรวจสอบ / กู้คืนข้อมูล**:
  \`\`\`bash
  npm run restore
  \`\`\`

---
*สร้างอัตโนมัติเมื่อ: ${timestampIso} โดย WARSGATE Accounting & ERP Backup Utility*
`;

fs.writeFileSync(path.join(backupsDir, 'README.md'), readmeContent, 'utf8');

console.log(`\n🎉 Backup completed successfully! (Version 2.0.0 Enterprise)`);
