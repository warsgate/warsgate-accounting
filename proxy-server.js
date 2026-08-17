/**
 * WARSGATE Accounting — RD Proxy Server
 * =========================================
 * Proxy สำหรับเรียก API กรมสรรพากร (SOAP)
 * เพื่อหลีกเลี่ยง CORS ที่ browser บล็อก
 * รันที่ port 3010
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const PORT = 3010;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// ตรวจสอบข้อมูล VAT จากกรมสรรพากร
// GET /api/rd/vat/:taxId
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/rd/vat/:taxId', async (req, res) => {
  const { taxId } = req.params;
  const cleanTaxId = taxId.replace(/[-\s]/g, ''); // ตัด - และ space ออก

  if (cleanTaxId.length !== 13) {
    return res.status(400).json({
      success: false,
      message: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก'
    });
  }

  // SOAP Envelope สำหรับเรียก RD Web Service
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ServiceByTaxID xmlns="http://tempuri.org/">
      <username>rdws</username>
      <password>rdws</password>
      <TaxID>${cleanTaxId}</TaxID>
    </ServiceByTaxID>
  </soap:Body>
</soap:Envelope>`;

  try {
    console.log(`[RD API] Querying Tax ID: ${cleanTaxId}`);

    const response = await axios.post(
      'https://rdws.rd.go.th/serviceRD3/vatserviceRD3.asmx',
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '"http://tempuri.org/ServiceByTaxID"',
        },
        timeout: 15000,
      }
    );

    // Parse XML → JSON
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const parsed = await parser.parseStringPromise(response.data);

    // เข้าถึง result จาก SOAP Response
    const body = parsed['soap:Envelope']?.['soap:Body'];
    const serviceResult = body?.['ServiceByTaxIDResponse']?.['ServiceByTaxIDResult'];

    if (!serviceResult) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลจากกรมสรรพากร'
      });
    }

    // ดึงข้อมูลออกจาก result (array ของ anyType)
    const items = serviceResult?.['diffgr:diffgram']?.['NewDataSet']?.['Table'];

    if (!items) {
      return res.json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ประกอบการ VAT สำหรับเลขนี้ — อาจไม่ได้จดทะเบียน VAT'
      });
    }

    // อาจมีหลายสาขา — เอาทั้งหมด
    const tableArr = Array.isArray(items) ? items : [items];

    const branches = tableArr.map(row => ({
      taxId: row.vat_id || cleanTaxId,
      titleName: row.title_name_th || '',
      nameTh: row.name_th || '',
      nameEn: row.name_en || '',
      branchNo: row.brn || row.branch_no || '00000',
      branchName: row.brn_name || (row.branch_no === '00000' ? 'สำนักงานใหญ่' : `สาขาที่ ${row.branch_no}`),
      address: [
        row.adr_building_name,
        row.adr_floor_no ? `ชั้น ${row.adr_floor_no}` : '',
        row.adr_room_no ? `ห้อง ${row.adr_room_no}` : '',
        row.adr_no,
        row.adr_village_no ? `หมู่ ${row.adr_village_no}` : '',
        row.adr_street,
        row.adr_sub_district,
        row.adr_district,
        row.adr_province,
        row.adr_postcode,
      ].filter(Boolean).join(' '),
      vatRegistrationDate: row.regist_date || '',
      status: row.status || 'ปกติ',
    }));

    console.log(`[RD API] Found ${branches.length} branch(es) for Tax ID: ${cleanTaxId}`);

    return res.json({
      success: true,
      taxId: cleanTaxId,
      branches,
      // เอาสาขาแรก (สำนักงานใหญ่) เป็น default
      primary: branches[0],
    });

  } catch (error) {
    console.error('[RD API] Error:', error.message);

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        message: 'หมดเวลาเชื่อมต่อกรมสรรพากร กรุณาลองใหม่อีกครั้ง'
      });
    }

    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาด: ${error.message}`
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Health Check
// GET /api/health
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WARSGATE RD Proxy Server กำลังทำงาน', port: PORT });
});

app.listen(PORT, () => {
  console.log(`\n🏛️  WARSGATE RD Proxy Server`);
  console.log(`✅  รันที่ http://localhost:${PORT}`);
  console.log(`📡  Endpoint: GET http://localhost:${PORT}/api/rd/vat/:taxId\n`);
});
