const QRCode = require("qrcode");

const generateQRCode = async (storeId) => {
  const payload = JSON.stringify({ storeId: storeId.toString() });
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 2,
  });
  return qrDataUrl;
};

module.exports = { generateQRCode };