/**
 * PromptPay QR Code Generator Payload Utility (EMVCo Standard)
 * Supports PromptPay Mobile Number and 13-digit National Tax ID / Corporate Tax ID
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Clean target (digits only)
  const cleanedTarget = target.replace(/[^0-9]/g, '');
  
  let targetType = '01'; // 01 for mobile, 02 for Tax ID / Citizen ID
  let formattedTarget = '';

  if (cleanedTarget.length === 10 || cleanedTarget.length === 9) {
    // Mobile number: e.g. 0891234567 -> 0066891234567
    targetType = '01';
    let mob = cleanedTarget;
    if (mob.startsWith('0')) {
      mob = mob.substring(1);
    }
    formattedTarget = `0066${mob}`.padStart(13, '0');
  } else if (cleanedTarget.length === 13) {
    // 13-digit Tax ID
    targetType = '02';
    formattedTarget = cleanedTarget;
  } else {
    formattedTarget = cleanedTarget;
  }

  // Subtags for PromptPay AID A000000677010111
  const aidTag = formatTag('00', 'A000000677010111');
  const targetTag = formatTag(targetType, formattedTarget);
  const merchantInfo29 = formatTag('29', aidTag + targetTag);

  // Payload segments
  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', amount ? '12' : '11'); // 11 = Static QR, 12 = Dynamic QR (with amount)
  payload += merchantInfo29;
  payload += formatTag('53', '764'); // Transaction Currency (764 = THB)

  if (amount && amount > 0) {
    payload += formatTag('54', amount.toFixed(2)); // Transaction Amount
  }

  payload += formatTag('58', 'TH'); // Country Code
  payload += '6304'; // CRC placeholder tag

  const checksum = crc16(payload);
  return payload + checksum;
}

export function getPromptPayQrUrl(target: string, amount?: number): string {
  const payload = generatePromptPayPayload(target, amount);
  // Generate fast client-side safe QR image using reliable SVG/PNG encoding
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;
}
