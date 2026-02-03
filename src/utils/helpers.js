const generateReceiptNo = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RCP${timestamp}${random}`;
};

module.exports = {
  generateReceiptNo
};
