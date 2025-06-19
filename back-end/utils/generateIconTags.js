import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LUCIDE_PATH = path.resolve('assets/icon-descriptions.json');
const OUTPUT_PATH = path.resolve('assets/icon-tags.json');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const MAX_TOTAL_ATTEMPTS = 100;
const MAX_RETRIES_PER_BATCH = 5;
const BATCH_SIZE = 25;

const generateTagsBatch = async (batchData) => {
  const formattedList = Object.entries(batchData)
    .map(([name, description]) => `"${name}": "${description}"`)
    .join(',\n');

  const prompt = `You are a UX iconography assistant. Your goal is to generate highly relevant, searchable tags for icons, based on what users might type into a search bar to find that icon.

Use simple, lowercase keywords that reflect **user intent**, not just literal design elements. Think like a person looking for a certain concept or visual symbol — what would they type?

Only return valid JSON. Do not include comments, explanations, or single quotes. Each icon must have exactly 5 tags that are commonly searched terms.

Example:
{
  "shirt": {
    "tags": ["clothing", "apparel", "fashion", "garment", "top"]
  },
  "camera": {
    "tags": ["photo", "picture", "media", "photography", "snapshot"]
  }
}

Here are the icons:
${formattedList}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a precise JSON-generating assistant. Always return valid JSON. Do not use single quotes or commentary.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  const raw = response.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(raw);

    // Ensure all keys are accounted for
    const missing = Object.keys(batchData).filter((key) => !(key in parsed));
    if (missing.length > 0) {
      throw new Error(`Missing tags for: ${missing.join(', ')}`);
    }

    return parsed;
  } catch (err) {
    console.error('❌ JSON parse/validation error:', err.message);
    throw err;
  }
};

const generateAllTags = async () => {
  const descriptions = JSON.parse(fs.readFileSync(LUCIDE_PATH, 'utf-8'));
  const iconNames = Object.keys(descriptions);

  const tags = {};
  let totalAttempts = 0;

  for (let i = 0; i < iconNames.length; i += BATCH_SIZE) {
    const batchKeys = iconNames.slice(i, i + BATCH_SIZE);
    const batchData = Object.fromEntries(batchKeys.map((k) => [k, descriptions[k]]));

    let success = false;
    let attempts = 0;

    while (!success && attempts < MAX_RETRIES_PER_BATCH && totalAttempts < MAX_TOTAL_ATTEMPTS) {
      attempts++;
      totalAttempts++;
      console.log(`🔄 Batch ${i / BATCH_SIZE + 1}, Attempt ${attempts} (Total: ${totalAttempts})`);

      try {
        const result = await generateTagsBatch(batchData);
        Object.assign(tags, result);
        success = true;
      } catch (err) {
        console.warn('⚠️ Retry failed batch. Sleeping...');
        await sleep(2000);
      }

      if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
        console.warn('⛔️ Reached total attempt limit. Ending early.');
        break;
      }
    }

    if (!success) {
      console.error(`❌ Failed permanently on batch ${i / BATCH_SIZE + 1}. Aborting.`);
      break;
    }

    await sleep(2000);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tags, null, 2));
  console.log(`✅ Tags saved to ${OUTPUT_PATH}`);
};

export default generateAllTags;
