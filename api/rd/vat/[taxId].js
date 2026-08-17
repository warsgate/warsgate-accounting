/**
 * Vercel Serverless Function — RD VAT Lookup
 * ============================================
 * Route: GET /api/rd/vat/[taxId]
 * ไม่ต้องรัน server แยก — Vercel จัดการให้เลย
 */

const https = require('https');

const RD_ENDPOINT_HOST = 'rdws.rd.go.th';
const RD_ENDPOINT_PATH = '/jsonRD/vatserviceRD3.asmx';
const RD_NAMESPACE = 'https://rdws.rd.go.th/JserviceRD3/vatserviceRD3';
const RD_SOAP_ACTION = `${RD_NAMESPACE}/Service`;

function buildAddress(data, prefix) {
  const get = (key) => data[`${prefix}${key}`]?.[0];
  const parts = [
    get('BuildingName') !== '-' ? get('BuildingName') : '',
    get('HouseNumber') ? `เลขที่ ${get('HouseNumber')}` : '',
    get('MooNumber') && get('MooNumber') !== '0' ? `หมู่ ${get('MooNumber')}` : '',
    get('VillageName') !== '-' ? `หมู่บ้าน ${get('VillageName')}` : '',
    get('SoiName') !== '-' ? `ซอย ${get('SoiName')}` : '',
    get('StreetName') !== '-' ? `ถนน ${get('StreetName')}` : '',
    get('Thambol') ? `ตำบล ${get('Thambol')}` : '',
    get('Amphur') ? `อำเภอ ${get('Amphur')}` : '',
    get('Province') ? `จังหวัด ${get('Province')}` : '',
    get('PostCode') || '',
  ].filter(s => s && s.trim() !== '');
  return parts.join(' ');
}

function soapRequest(taxId) {
  return new Promise((resolve, reject) => {
    const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Service xmlns="${RD_NAMESPACE}">
      <username>anonymous</username>
      <password>anonymous</password>
      <TIN>${taxId}</TIN>
      <Name></Name>
      <ProvinceCode>0</ProvinceCode>
      <BranchNumber>0</BranchNumber>
      <AmphurCode>0</AmphurCode>
    </Service>
  </soap:Body>
</soap:Envelope>`;

    const options = {
      hostname: RD_ENDPOINT_HOST,
      path: RD_ENDPOINT_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${RD_SOAP_ACTION}"`,
        'Content-Length': Buffer.byteLength(body, 'utf8'),
      },
      timeout: 20000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { taxId } = req.query;
  const cleanTaxId = (taxId || '').replace(/[-\s]/g, '');

  if (cleanTaxId.length !== 13) {
    return res.status(400).json({ success: false, message: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก' });
  }

  try {
    const xmlText = await soapRequest(cleanTaxId);

    const match = xmlText.match(/<ServiceResult[^>]*>([\s\S]*?)<\/ServiceResult>/);
    if (!match) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลจากกรมสรรพากร' });
    }

    const jsonStr = match[1]
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');

    const data = JSON.parse(jsonStr);

    if (data.msgerr?.[0]) {
      return res.json({ success: false, message: data.msgerr[0] });
    }

    if (!data.Name?.[0] || data.Name[0] === '-') {
      return res.json({ success: false, message: 'ไม่พบข้อมูลผู้ประกอบการ VAT — อาจไม่ได้จดทะเบียน VAT' });
    }

    return res.json({
      success: true,
      taxId: cleanTaxId,
      primary: {
        nid: data.NID?.[0] || cleanTaxId,
        titleName: data.TitleName?.[0] || '',
        name: data.Name?.[0] || '',
        fullName: `${data.TitleName?.[0] || ''}${data.Name?.[0] || ''}`.trim(),
        branchNumber: data.BranchNumber?.[0] ?? 0,
        branchCode: String(data.BranchNumber?.[0] ?? 0).padStart(5, '0'),
        branchLabel: (data.BranchNumber?.[0] ?? 0) === 0 ? 'สำนักงานใหญ่' : `สาขาที่ ${data.BranchNumber[0]}`,
        address: buildAddress(data, ''),
        province: data.Province?.[0] || '',
        amphur: data.Amphur?.[0] || '',
        thambol: data.Thambol?.[0] || '',
        postCode: data.PostCode?.[0] || '',
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: `เกิดข้อผิดพลาด: ${error.message}` });
  }
};
