import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const LUCIDE_PATH = path.resolve('assets/lucide-icons.json');
const OUTPUT_PATH = path.resolve('assets/icon-descriptions.json');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const generateDescriptionBatch = async (iconNames) => {
  const prompt = `For each of the following icon names, write a short, intuitive one-sentence description of what the icon likely represents. Return only a valid JSON object with keys matching the icon names.

Example format:
{
  "alarm": "An icon of an alarm clock, used to represent time or reminders.",
  "camera": "An icon of a camera, typically used to indicate photography or media."
}

Now describe these icons:
${iconNames.join('\n')}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are a professional iconographer. Describe each icon in a one-sentence JSON object using strict double quotes only. Do not use single quotes or explanations.`
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

    // ✅ Validate all icon names were returned
    const missing = iconNames.filter((name) => !(name in parsed));
    if (missing.length > 0) {
      throw new Error(`Missing ${missing.length} icons: ${missing.join(', ')}`);
    }

    return parsed;
  } catch (err) {
    console.error('❌ Parsing or validation error:', err.message);
    throw err;
  }
};

const generateAllDescriptions = async () => {
  const data = JSON.parse(fs.readFileSync(LUCIDE_PATH, 'utf-8'));
  const allIcons = Object.keys(data.icons);

  const batchSize = 25;
  const maxTotalAttempts = 100;
  let totalAttempts = 0;
  const descriptions = {};

  for (let i = 0; i < allIcons.length; i += batchSize) {
    const batch = allIcons.slice(i, i + batchSize);
    let success = false;
    let attempts = 0;

    while (!success && attempts < 5 && totalAttempts < maxTotalAttempts) {
      attempts++;
      totalAttempts++;
      console.log(`🔄 Batch ${i / batchSize + 1}, Attempt ${attempts} (Total: ${totalAttempts})`);

      try {
        const result = await generateDescriptionBatch(batch);
        Object.assign(descriptions, result);
        success = true;
      } catch (err) {
        console.warn('⚠️ Retry after error. Sleeping...');
        await sleep(2000);
      }
    }

    if (!success) {
      console.error(`❌ Failed permanently on batch ${i / batchSize + 1}. Aborting.`);
      break;
    }

    await sleep(2000); // Sleep between batches
    if (totalAttempts >= maxTotalAttempts) {
      console.warn('⛔️ Reached total attempt limit. Ending early.');
      break;
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(descriptions, null, 2));
  console.log(`✅ Descriptions written to ${OUTPUT_PATH}`);
};

export default generateAllDescriptions;