import { AccountingDocument, CompanyProfile } from '../types';

/**
 * Generate standard ETDA (Electronic Transactions Development Agency) compliant
 * XML schema for Thai Revenue Department e-Tax Invoice by Email / Web Portal
 */
export const generateEtaxXml = (doc: AccountingDocument, company: CompanyProfile): string => {
  const escapeXml = (str?: string | number | null): string =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const mapUnitToUnEce = (unit?: string): string => {
    const u = (unit || '').trim().toLowerCase();
    if (!u) return 'C62';
    if (/^[a-z0-9]{2,3}$/i.test(u) && u.toUpperCase() !== 'SET' && u.toUpperCase() !== 'PCS') {
      return u.toUpperCase();
    }
    if (u === 'set' || u.includes('เซต') || u.includes('ชุด') || u.includes('ระบบ')) return 'SET';
    if (u.includes('เมตร') || u === 'm' || u === 'mtr') return 'MTR';
    if (u.includes('กก') || u.includes('กิโล') || u === 'kg' || u === 'kgm') return 'KGM';
    if (u.includes('กล่อง') || u === 'box' || u === 'bx') return 'BX';
    if (u.includes('แพ็ค') || u.includes('แพค') || u === 'pack' || u === 'pk') return 'PK';
    // Default UN/ECE code for piece/item/unit/job ('ชิ้น', 'อัน', 'ตัว', 'เครื่อง', 'งาน', 'รายการ', 'pcs', 'ea')
    return 'C62';
  };

  const issueDateIso = doc.issueDate || new Date().toISOString().split('T')[0];
  const totalAmount = doc.grandTotal ?? 0;
  const subtotal = doc.subtotal ?? 0;
  const vatAmount = doc.vatAmount ?? 0;
  const vatRate = doc.vatRate ?? 7;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:TaxInvoice_CrossIndustryInvoice 
  xmlns:rsm="urn:etda:uncefact:data:standard:TaxInvoice_CrossIndustryInvoice:2"
  xmlns:ccts="urn:un:unece:uncefact:documentation:standard:CoreComponentsTechnicalSpecification:2"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:16"
  xmlns:qdt="urn:etda:uncefact:data:standard:QualifiedDataType:1"
  xmlns:ram="urn:etda:uncefact:data:standard:TaxInvoice_ReusableAggregateBusinessInformationEntity:2">
  
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID schemeAgencyID="ETDA" schemeVersionID="v2.0">ER3-2560</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(doc.documentNo)}</ram:ID>
    <ram:Name>${doc.type === 'TAX_INVOICE' ? 'ใบกำกับภาษี' : doc.type === 'RECEIPT' ? 'ใบเสร็จรับเงิน' : 'ใบแจ้งหนี้'}</ram:Name>
    <ram:TypeCode>${doc.type === 'TAX_INVOICE' ? 'T03' : doc.type === 'RECEIPT' ? 'T01' : '380'}</ram:TypeCode>
    <ram:IssueDateTime>${escapeXml(issueDateIso)}T08:30:00.000</ram:IssueDateTime>
    <ram:Purpose>${doc.notes ? escapeXml(doc.notes) : 'ชำระค่าสินค้าและบริการระบบอัตโนมัติ'}</ram:Purpose>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
    <!-- Seller (ผู้ขาย/ผู้ออกเอกสาร) -->
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(company.name)}</ram:Name>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="TXID">${escapeXml(company.taxId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(company.address)}</ram:LineOne>
          <ram:CountryID>TH</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:SellerTradeParty>

      <!-- Buyer (ผู้ซื้อ/ลูกค้า) -->
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(doc.contact?.companyName || doc.contact?.name)}</ram:Name>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="TXID">${escapeXml(doc.contact?.taxId || 'N/A')}</ram:ID>
        </ram:SpecifiedTaxRegistration>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(doc.contact?.address || 'ประเทศไทย')}</ram:LineOne>
          <ram:CountryID>TH</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <!-- Trade Settlement & Monetary Summation -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>THB</ram:InvoiceCurrencyCode>
      
      <ram:ApplicableTradeTax>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CalculatedRate>${vatRate.toFixed(2)}</ram:CalculatedRate>
        <ram:BasisAmount currencyID="THB">${subtotal.toFixed(2)}</ram:BasisAmount>
        <ram:CalculatedAmount currencyID="THB">${vatAmount.toFixed(2)}</ram:CalculatedAmount>
      </ram:ApplicableTradeTax>

      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount currencyID="THB">${subtotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount currencyID="THB">${subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="THB">${vatAmount.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="THB">${totalAmount.toFixed(2)}</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

    <!-- Document Line Items -->
    ${(doc.items || []).map((item, idx) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:ID>${escapeXml(item.code || `ITEM-${idx + 1}`)}</ram:ID>
        <ram:Name>${item.name ? escapeXml(item.name) : 'รายการสินค้า'}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:GrossPriceProductTradePrice>
          <ram:ChargeAmount currencyID="THB">${(item.pricePerUnit ?? 0).toFixed(2)}</ram:ChargeAmount>
        </ram:GrossPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${escapeXml(mapUnitToUnEce(item.unit))}">${item.quantity ?? 1}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount currencyID="THB">${(item.amount ?? 0).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('\n')}

  </rsm:SupplyChainTradeTransaction>
</rsm:TaxInvoice_CrossIndustryInvoice>`;

  return xml.trim();
};

/**
 * Download e-Tax XML file
 */
export const downloadEtaxXml = (doc: AccountingDocument, company: CompanyProfile): void => {
  const xmlContent = generateEtaxXml(doc, company);
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `etax_${doc.documentNo.replace(/\//g, '_')}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
