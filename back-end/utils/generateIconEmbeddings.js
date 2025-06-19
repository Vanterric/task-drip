const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Icon = require('../models/Icon'); // adjust path as needed

require('dotenv').config(); // for OPENAI_API_KEY and MONGO_URI

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DESCRIPTIONS_PATH = path.resolve('assets/icon-descriptions.json');
const TAGS_PATH = path.resolve('assets/icon-tags.json');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const getEmbedding = async (text) => {
  const res = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });

  return res.data[0].embedding;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const descriptions = JSON.parse(fs.readFileSync(DESCRIPTIONS_PATH, 'utf-8'));
    const tags = JSON.parse(fs.readFileSync(TAGS_PATH, 'utf-8'));

    const iconNames = Object.keys(descriptions);

    for (const name of iconNames) {
      const description = descriptions[name];
      const iconTags = tags[name]?.tags || [];

      const inputText = `${name} — ${description}`;
      let embedding;

      try {
        embedding = await getEmbedding(inputText);
      } catch (err) {
        console.error(`❌ Failed to embed "${name}":`, err.message);
        continue;
      }

      try {
        await Icon.findOneAndUpdate(
          { name },
          {
            name,
            embedding,
            description,
            tags: iconTags,
          },
          { upsert: true, new: true }
        );
        console.log(`💾 Saved "${name}"`);
      } catch (err) {
        console.error(`❌ Failed to save "${name}" to MongoDB:`, err.message);
      }

      await sleep(100); // be gentle with OpenAI API rate limits
    }

    console.log('🎉 Done embedding all icons!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Script error:', err);
    process.exit(1);
  }
};

module.exports = run;
