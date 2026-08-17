/**
 * WARSGATE Accounting — RD Proxy Server
 * =========================================
 * Proxy สำหรับเรียก API กรมสรรพากร (SOAP → JSON)
 * รันที่ port 3010
 * 
 * Endpoint จริง: https://rdws.rd.go.th/jsonRD/vatserviceRD3.asmx
 * SOAPAction: https://rdws.rd.go.th/JserviceRD3/vatserviceRD3/Service
 * Credentials: anonymous / anonymous
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3010;

const RD_ENDPOINT = 'https://rdws.rd.go.th/jsonRD/vatserviceRD3.asmx';
const RD_NAMESPACE = 'https://rdws.rd.go.th/JserviceRD3/vatserviceRD3';
const RD_SOAP_ACTION = `${RD_NAMESPACE}/Service`;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// ตรวจสอบข้อมูล VAT จากกรมสรรพากร
// GET /api/rd/vat/:taxId
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/rd/vat/:taxId', async (req, res) => {
  const { taxId } = req.params;
  const cleanTaxId = taxId.replace(/[-\s]/g, '');

  if (cleanTaxId.length !== 13) {
    return res.status(400).json({
      success: false,
      message: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก'
    });
  }

  // SOAP Envelope (field จริงคือ TIN ไม่ใช่ TaxID)
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Service xmlns="${RD_NAMESPACE}">
      <username>anonymous</username>
      <password>anonymous</password>
      <TIN>${cleanTaxId}</TIN>
      <Name></Name>
      <ProvinceCode>0</ProvinceCode>
      <BranchNumber>0</BranchNumber>
      <AmphurCode>0</AmphurCode>
    </Service>
  </soap:Body>
</soap:Envelope>`;

  try {
    console.log(`[RD API] ค้นหาเลข Tax ID: ${cleanTaxId}`);

    const response = await axios.post(RD_ENDPOINT, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${RD_SOAP_ACTION}"`,
      },
      timeout: 20000,
    });

    // ดึง JSON string จาก ServiceResult
    const xmlText = response.data;
    const match = xmlText.match(/<ServiceResult[^>]*>([\s\S]*?)<\/ServiceResult>/);
    if (!match) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลจากกรมสรรพากร' });
    }

    // Decode HTML entities แล้ว parse JSON
    const jsonStr = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      return res.status(500).json({ success: false, message: `parse error: ${jsonStr}` });
    }

    // ตรวจสอบ error
    if (data.msgerr && data.msgerr.length > 0 && data.msgerr[0]) {
      return res.json({ success: false, message: data.msgerr[0] });
    }

    // ไม่พบข้อมูล
    if (!data.Name || !data.Name[0] || data.Name[0] === '-') {
      return res.json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ประกอบการ VAT สำหรับเลขนี้ — อาจไม่ได้จดทะเบียน VAT หรือเลขไม่ถูกต้อง'
      });
    }

    // สร้างที่อยู่แบบเต็ม
    const buildAddress = (prefix) => {
      const parts = [
        data[`${prefix}BuildingName`]?.[0] !== '-' ? data[`${prefix}BuildingName`]?.[0] : '',
        data[`${prefix}HouseNumber`]?.[0] ? `เลขที่ ${data[`${prefix}HouseNumber`][0]}` : '',
        data[`${prefix}MooNumber`]?.[0] && data[`${prefix}MooNumber`][0] !== '0' ? `หมู่ ${data[`${prefix}MooNumber`][0]}` : '',
        data[`${prefix}VillageName`]?.[0] !== '-' ? `หมู่บ้าน ${data[`${prefix}VillageName`][0]}` : '',
        data[`${prefix}SoiName`]?.[0] !== '-' ? `ซอย ${data[`${prefix}SoiName`][0]}` : '',
        data[`${prefix}StreetName`]?.[0] !== '-' ? `ถนน ${data[`${prefix}StreetName`][0]}` : '',
        data[`${prefix}Thambol`]?.[0] ? `ตำบล/แขวง ${data[`${prefix}Thambol`][0]}` : '',
        data[`${prefix}Amphur`]?.[0] ? `อำเภอ/เขต ${data[`${prefix}Amphur`][0]}` : '',
        data[`${prefix}Province`]?.[0] ? `จังหวัด ${data[`${prefix}Province`][0]}` : '',
        data[`${prefix}PostCode`]?.[0] || '',
      ].filter(s => s && s.trim() !== '');
      return parts.join(' ');
    };

    const result = {
      success: true,
      taxId: cleanTaxId,
      primary: {
        nid: data.NID?.[0] || cleanTaxId,
        titleName: data.TitleName?.[0] || '',
        name: data.Name?.[0] || '',
        surname: data.Surname?.[0] !== '-' ? data.Surname[0] : '',
        fullName: `${data.TitleName?.[0] || ''}${data.Name?.[0] || ''}`.trim(),
        branchNumber: data.BranchNumber?.[0] ?? 0,
        branchTitle: data.BranchTitleName?.[0] || '',
        branchName: data.BranchName?.[0] || '',
        branchCode: String(data.BranchNumber?.[0] ?? 0).padStart(5, '0'),
        branchLabel: (data.BranchNumber?.[0] ?? 0) === 0 ? 'สำนักงานใหญ่' : `สาขาที่ ${data.BranchNumber[0]}`,
        address: buildAddress(''),
        province: data.Province?.[0] || '',
        amphur: data.Amphur?.[0] || '',
        thambol: data.Thambol?.[0] || '',
        postCode: data.PostCode?.[0] || '',
        businessFirstDate: data.BusinessFirstDate?.[0] !== '-' ? data.BusinessFirstDate?.[0] : '',
      }
    };

    console.log(`[RD API] ✅ พบข้อมูล: ${result.primary.fullName} (${result.primary.branchLabel})`);
    return res.json(result);

  } catch (error) {
    console.error('[RD API] Error:', error.message);
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ success: false, message: 'หมดเวลาเชื่อมต่อกรมสรรพากร กรุณาลองใหม่อีกครั้ง' });
    }
    return res.status(500).json({ success: false, message: `เกิดข้อผิดพลาด: ${error.message}` });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WARSGATE RD Proxy Server กำลังทำงาน', port: PORT });
});

app.listen(PORT, () => {
  console.log(`\n🏛️  WARSGATE RD Proxy Server`);
  console.log(`✅  รันที่ http://localhost:${PORT}`);
  console.log(`📡  Endpoint: GET http://localhost:${PORT}/api/rd/vat/:taxId\n`);
});
