const PRICE_TO_TIER = {
  'price_FOCUS_MONTHLY_TEST': 'focus',
  'price_FOCUS_YEARLY_TEST': 'focus',
  'price_PRO_MONTHLY_TEST': 'pro',
  'price_PRO_YEARLY_TEST': 'pro',
  'price_FOCUS_MONTHLY_PROD': 'focus',
  'price_FOCUS_YEARLY_PROD': 'focus',
  'price_PRO_MONTHLY_PROD': 'pro',
  'price_PRO_YEARLY_PROD': 'pro',
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
