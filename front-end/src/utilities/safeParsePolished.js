export function safeParsePolished(raw) {
  if (typeof raw === 'object' && raw !== null) {
    return raw; // already valid ✅
  }

  if (typeof raw !== 'string') {
    console.error('❌ Unexpected type for polished data:', typeof raw);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Failed to parse polished result:', err, raw);
    return null;
  }
}