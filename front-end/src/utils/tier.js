export function canUseOneTaskView(user) {
  return user?.tier === 'focus' || user?.tier === 'pro';
}

export function canUseAI(user) {
  return user?.tier === 'pro';
}

export function getMaxLists(user) {
  if (user?.tier === 'pro') return Infinity;
  if (user?.tier === 'focus') return 3;
  return 1;
}

export function getMaxTasksPerList(user) {
  if (user?.tier === 'pro') return Infinity;
  return 5;
}
