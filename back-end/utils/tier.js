// Built dynamically from env — no hardcoded price IDs
function buildPriceToTier() {
  const map = {};
  if (process.env.STRIPE_PRICE_FOCUS_MONTHLY) map[process.env.STRIPE_PRICE_FOCUS_MONTHLY] = 'focus';
  if (process.env.STRIPE_PRICE_FOCUS_YEARLY) map[process.env.STRIPE_PRICE_FOCUS_YEARLY] = 'focus';
  if (process.env.STRIPE_PRICE_PRO_MONTHLY) map[process.env.STRIPE_PRICE_PRO_MONTHLY] = 'pro';
  if (process.env.STRIPE_PRICE_PRO_YEARLY) map[process.env.STRIPE_PRICE_PRO_YEARLY] = 'pro';
  return map;
}

const PRICE_TO_TIER = buildPriceToTier();

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
