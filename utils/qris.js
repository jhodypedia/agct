// utils/qris.js

// CRC-16/CCITT-FALSE
function crc16ccitt(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * baseWithoutAmount:
 *  Payload QRIS merchant TANPA Tag 54 & 63
 */
function buildPayloadWithAmount(baseWithoutAmount, amountIdr) {
  const base = baseWithoutAmount.trim().replace(/\s+/g, "");

  const amountStr = String(amountIdr);
  const len = amountStr.length.toString().padStart(2, "0");
  const tag54 = "54" + len + amountStr;

  const payloadNoCRC = base + tag54 + "6304";
  const crc = crc16ccitt(payloadNoCRC);
  return payloadNoCRC + crc;
}

/**
 * baseAmount: misal 15000
 */
function generateUniqueAmount(baseAmount) {
  const unique = Math.floor(100 + Math.random() * 900); // 100-999
  return {
    uniqueCode: unique,
    finalAmount: baseAmount + unique
  };
}

/**
 * Admin input full payload; kita simpan base tanpa 54 & 63
 */
function normalizeBasePayloadFromFull(fullPayload) {
  if (!fullPayload) return "";
  let s = fullPayload.trim().replace(/\s+/g, "");

  function removeTagTLV(tag) {
    const idx = s.indexOf(tag);
    if (idx === -1) return;
    const lenHex = s.substr(idx + 2, 2);
    const len = parseInt(lenHex, 10);
    if (isNaN(len) || len < 0) return;
    const total = 2 + 2 + len;
    s = s.slice(0, idx) + s.slice(idx + total);
  }

  removeTagTLV("54");

  const idx63 = s.indexOf("63");
  if (idx63 !== -1) {
    s = s.slice(0, idx63);
  }

  return s;
}

module.exports = {
  crc16ccitt,
  buildPayloadWithAmount,
  generateUniqueAmount,
  normalizeBasePayloadFromFull
};
