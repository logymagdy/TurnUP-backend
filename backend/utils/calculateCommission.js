const calculateCommission = (amount, visitCount) => {
  const adminRate = visitCount <= 10 ? 0.05 : 0.07;
  const storeRate = 1 - adminRate;
  const adminCut = parseFloat((amount * adminRate).toFixed(2));
  const storeCut = parseFloat((amount * storeRate).toFixed(2));
  return { adminCut, storeCut };
};

module.exports = { calculateCommission };