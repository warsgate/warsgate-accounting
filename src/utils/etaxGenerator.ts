import { AccountingDocument, CompanyProfile } from '../types';

/**
 * Generate standard ETDA (Electronic Transactions Development Agency) compliant
 * XML schema for Thai Revenue Department e-Tax Invoice by Email / Web Portal
 */
export const generateEtaxXml = (doc: AccountingDocument, company: CompanyProfile): string => {
  const issueDateIso = doc.issueDate || new Date().toISOString().split('T')[0];
  const totalAmount = doc.grandTotal || 0;
  const subtotal = doc.subtotal || 0;
  const vatAmount = doc.vatAmount || 0;

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
    <ram:ID>${doc.documentNo}</ram:ID>
    <ram:Name>${doc.type === 'TAX_INVOICE' ? 'ใบกำกับภาษี' : doc.type === 'RECEIPT' ? 'ใบเสร็จรับเงิน' : 'ใบแจ้งหนี้'}</ram:Name>
    <ram:TypeCode>${doc.type === 'TAX_INVOICE' ? 'T03' : doc.type === 'RECEIPT' ? 'T01' : '380'}</ram:TypeCode>
    <ram:IssueDateTime>${issueDateIso}T08:30:00.000</ram:IssueDateTime>
    <ram:Purpose>${doc.notes ? doc.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'ชำระค่าสินค้าและบริการระบบอัตโนมัติ'}</ram:Purpose>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
    <!-- Seller (ผู้ขาย/ผู้ออกเอกสาร) -->
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${company.name}</ram:Name>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="TXID">${company.taxId}</ram:ID>
        </ram:SpecifiedTaxRegistration>
        <ram:PostalTradeAddress>
          <ram:LineOne>${company.address}</ram:LineOne>
          <ram:CountryID>TH</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:SellerTradeParty>

      <!-- Buyer (ผู้ซื้อ/ลูกค้า) -->
      <ram:BuyerTradeParty>
        <ram:Name>${doc.contact.companyName}</ram:Name>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="TXID">${doc.contact.taxId || 'N/A'}</ram:ID>
        </ram:SpecifiedTaxRegistration>
        <ram:PostalTradeAddress>
          <ram:LineOne>${doc.contact.address || 'ประเทศไทย'}</ram:LineOne>
          <ram:CountryID>TH</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <!-- Trade Settlement & Monetary Summation -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>THB</ram:InvoiceCurrencyCode>
      
      <ram:ApplicableTradeTax>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:CalculatedRate>7.00</ram:CalculatedRate>
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
    ${doc.items.map((item, idx) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:ID>${item.code || `ITEM-${idx + 1}`}</ram:ID>
        <ram:Name>${item.name ? item.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'รายการสินค้า'}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:GrossPriceProductTradePrice>
          <ram:ChargeAmount currencyID="THB">${(item.pricePerUnit || 0).toFixed(2)}</ram:ChargeAmount>
        </ram:GrossPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${item.unit || 'C62'}">${item.quantity || 1}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount currencyID="THB">${(item.amount || 0).toFixed(2)}</ram:LineTotalAmount>
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
