export function safeParsePolished(raw) {
  if (typeof raw === 'object' && raw !== null) return raw;

  if (typeof raw !== 'string') {
    console.error('❌ Unexpected type for polished data:', typeof raw);
    return null;
  }

  // Try to extract JSON block from inside the string
  const match = raw.match(/{[\s\S]*}/); // greedy match for first full {...} block

  if (!match) {
    console.error('❌ No JSON found in string:', raw.slice(0, 100));
    return null;
  }

  try {
    const cleaned = match[0]
      .replace(/([^\s{,])\s*("dewDate")/g, '$1,\n$2')
      .replace(/([^\s{,])\s*("timeEstimate")/g, '$1,\n$2')
      .replace(/([^\s{,])\s*("content")/g, '$1,\n$2')
      .replace(/([^\s{,])\s*("description")/g, '$1,\n$2')
      .replace(/,\s*}/g, '}');

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Failed to parse extracted JSON:', err, match[0]);
    return null;
  }
}
