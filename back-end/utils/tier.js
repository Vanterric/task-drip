const PRICE_TO_TIER = {
  // Test / Dev
  'price_1THvtPDFl6DTTJEmNA87sOTn': 'focus',  // Focus Monthly
  'price_1THvtoDFl6DTTJEmigE5B2e7': 'focus',  // Focus Yearly
  'price_1THvu4DFl6DTTJEmtIi1hlTl': 'pro',    // Pro Monthly
  'price_1THvuNDFl6DTTJEmdlf0kcQY': 'pro',    // Pro Yearly
  // Production (add when live mode prices are created)
};

function canUseOneTaskView(user) {
  return user.tier === 'focus' || user.tier === 'pro';
}

function canUseAI(user) {
  return user.tier === 'pro';
}

function getMaxLists(user) {
  if (user.tier === 'pro') return Infinity;
  if (user.tier === 'focus') return 3;
  return 1;
}

function getMaxTasksPerList(user) {
  if (user.tier === 'pro') return Infinity;
  return 5;
}

function tierFromPriceId(priceId) {
  return PRICE_TO_TIER[priceId] || null;
}

module.exports = { canUseOneTaskView, canUseAI, getMaxLists, getMaxTasksPerList, tierFromPriceId, PRICE_TO_TIER };
