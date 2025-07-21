export function safeParsePolished(raw) {
  if (typeof raw === 'object' && raw !== null) {
    return raw; // already valid ✅
  }

  if (typeof raw !== 'string') {
    console.error('❌ Unexpected type for polished data:', typeof raw);
    return null;
  }

  try {
    // Pre-clean raw string
    const cleaned = raw
      .replace(/([^\s{,])\s*("dewDate")/g, '$1,\n$2') // fix missing comma before "dewDate"
      .replace(/([^\s{,])\s*("timeEstimate")/g, '$1,\n$2') // fix missing comma before "timeEstimate"
      .replace(/([^\s{,])\s*("content")/g, '$1,\n$2') // in case other fields are affected
      .replace(/([^\s{,])\s*("description")/g, '$1,\n$2')
      .replace(/,\s*}/g, '}'); // remove trailing commas

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Failed to parse polished result:', err, raw);
    return null;
  }
}
