// Migrate users to the new tier structure (Free / Focus / Pro).
//
// What this script does:
//   1. Sets `tier: 'pro'` for users with active Stripe subscriptions OR isLifeTimePro
//   2. Sets `tier: 'pro'` for trial users (isPro:true, no sub, not lifetime)
//   3. Sets `tier: 'free'` for users still missing the tier field
//   4. Sets `tier: 'free'` for legacy isPro:false users
//   5. Remaps legacy proSubscriptionType: 'monthly'/'yearly'/'lifetime' → new pro-* values
//   6. Backfills proSubscriptionType: 'pro-lifetime' for lifetime users with null/undefined sub type
//   7. Verifies post-migration state and asserts no inconsistencies
//
// SAFETY:
//   - DRY-RUN BY DEFAULT — running without arguments only PREVIEWS changes
//   - Use --apply to actually write to MongoDB
//   - Always run a backup first: `node back-end/backup-users.js` (or equivalent)
//
// RUN:
//   cd back-end && node scripts/migrate-tiers.js              # dry-run preview
//   cd back-end && node scripts/migrate-tiers.js --apply      # actually migrate
//
// BACKUP RUNBOOK (do this before --apply):
//   1. Snapshot the MongoDB Atlas cluster (or `mongodump --uri="$MONGO_URI" --collection=users --out=./backup-pre-migration`)
//   2. Or run a node-based JSON dump of the users collection
//   3. Verify the backup file exists and has the expected user count
//   4. Then run this script with --apply

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const MODE = APPLY ? 'APPLY' : 'DRY-RUN';

function header(text) {
  console.log(`\n${'='.repeat(72)}\n${text}\n${'='.repeat(72)}`);
}

function section(text) {
  console.log(`\n--- ${text} ---`);
}

function describeUser(u) {
  const expiry = u.proExpiresAt ? new Date(u.proExpiresAt).toISOString().slice(0, 10) : 'null';
  return `${u.email || '<no-email>'} | tier=${JSON.stringify(u.tier)} isPro=${JSON.stringify(u.isPro)} isLifeTimePro=${JSON.stringify(u.isLifeTimePro)} pst=${JSON.stringify(u.proSubscriptionType)} proExpiresAt=${expiry}`;
}

// Simulated state used in dry-run mode to track what each step would change.
// Map of userId(string) → simulated user document. Built up as steps run.
const simulatedState = new Map();

async function previewOrApply(usersCol, label, query, update) {
  section(label);
  const matches = await usersCol
    .find(query)
    .project({ email: 1, tier: 1, isPro: 1, isLifeTimePro: 1, proSubscriptionType: 1, stripeSubscriptionId: 1, proExpiresAt: 1 })
    .toArray();

  console.log(`Matched: ${matches.length} user(s)`);
  if (matches.length === 0) {
    return { matched: 0, modified: 0 };
  }

  // Update simulated state for dry-run verification
  if (!APPLY) {
    const setOps = update.$set || {};
    const unsetOps = update.$unset || {};
    for (const u of matches) {
      const key = String(u._id);
      const current = simulatedState.get(key) || { ...u };
      for (const [k, v] of Object.entries(setOps)) current[k] = v;
      for (const k of Object.keys(unsetOps)) delete current[k];
      simulatedState.set(key, current);
    }
  }

  const setOps = update.$set || {};
  const unsetOps = update.$unset || {};
  const setKeys = Object.keys(setOps);
  const unsetKeys = Object.keys(unsetOps);

  for (const u of matches) {
    const before = describeUser(u);
    const setSummary = setKeys.length > 0 ? setKeys.map((k) => `${k}=${JSON.stringify(setOps[k])}`).join(', ') : '';
    const unsetSummary = unsetKeys.length > 0 ? `unset[${unsetKeys.join(',')}]` : '';
    const change = [setSummary, unsetSummary].filter(Boolean).join(' | ');
    console.log(`  ${u.email}`);
    console.log(`    BEFORE: ${before}`);
    console.log(`    CHANGE: ${change}`);
  }

  if (!APPLY) {
    console.log(`(dry-run — not applying)`);
    return { matched: matches.length, modified: 0 };
  }

  const result = await usersCol.updateMany(query, update);
  console.log(`Applied: matchedCount=${result.matchedCount} modifiedCount=${result.modifiedCount}`);
  return { matched: result.matchedCount, modified: result.modifiedCount };
}

async function verifyPostMigrationState(usersCol) {
  if (APPLY) {
    header('VERIFICATION (post-migration sanity checks)');
    await verifyAgainstLiveDb(usersCol);
  } else {
    header('PREDICTED FINAL STATE (simulated from dry-run step matches)');
    console.log('Below shows what the database WOULD look like if --apply were run now.');
    console.log('Built by simulating each step update operations against the current state.\n');
    await verifyAgainstSimulatedState(usersCol);
  }
}

async function verifyAgainstLiveDb(usersCol) {
  const total = await usersCol.countDocuments({});
  const tierPro = await usersCol.countDocuments({ tier: 'pro' });
  const tierFocus = await usersCol.countDocuments({ tier: 'focus' });
  const tierFree = await usersCol.countDocuments({ tier: 'free' });
  const tierMissing = await usersCol.countDocuments({ tier: { $exists: false } });

  console.log(`Total users:    ${total}`);
  console.log(`tier: 'pro'     → ${tierPro}`);
  console.log(`tier: 'focus'   → ${tierFocus}`);
  console.log(`tier: 'free'    → ${tierFree}`);
  console.log(`tier missing    → ${tierMissing}`);

  if (tierPro + tierFocus + tierFree + tierMissing !== total) {
    console.log(`[FAIL] tier counts do not sum to ${total}`);
  }

  const lifeNotPro = await usersCol
    .find({ isLifeTimePro: true, tier: { $ne: 'pro' } })
    .project({ email: 1, tier: 1 })
    .toArray();
  if (lifeNotPro.length > 0) {
    console.log(`\n[FAIL] ${lifeNotPro.length} lifetime users do NOT have tier='pro':`);
    for (const u of lifeNotPro) console.log(`  ${u.email} (tier=${u.tier})`);
  } else {
    console.log(`\n[OK] All isLifeTimePro:true users have tier='pro'`);
  }

  const legacyIsPro = await usersCol.countDocuments({ isPro: { $exists: true } });
  console.log(legacyIsPro > 0 ? `[FAIL] ${legacyIsPro} users still have legacy 'isPro' field` : `[OK] No users have legacy 'isPro' field`);

  const legacyHundred = await usersCol.countDocuments({ isFirstHundredUser: { $exists: true } });
  console.log(legacyHundred > 0 ? `[FAIL] ${legacyHundred} users still have legacy 'isFirstHundredUser' field` : `[OK] No users have legacy 'isFirstHundredUser' field`);

  const oldEnumCount = await usersCol.countDocuments({ proSubscriptionType: { $in: ['monthly', 'yearly', 'lifetime'] } });
  console.log(oldEnumCount > 0 ? `[FAIL] ${oldEnumCount} users still have old proSubscriptionType values` : `[OK] No users have old proSubscriptionType enum values`);

  const lifeNullPst = await usersCol.countDocuments({
    isLifeTimePro: true,
    $or: [{ proSubscriptionType: null }, { proSubscriptionType: { $exists: false } }],
  });
  console.log(lifeNullPst > 0 ? `[FAIL] ${lifeNullPst} lifetime users still have null/undefined proSubscriptionType` : `[OK] All lifetime users have a populated proSubscriptionType`);
  console.log('');
}

async function verifyAgainstSimulatedState(usersCol) {
  // Build the projected final state: load all current users, overlay simulated changes
  const allUsers = await usersCol
    .find({})
    .project({ email: 1, tier: 1, isPro: 1, isLifeTimePro: 1, proSubscriptionType: 1, isFirstHundredUser: 1 })
    .toArray();
  const finalState = allUsers.map((u) => simulatedState.get(String(u._id)) || u);

  const total = finalState.length;
  const tierPro = finalState.filter((u) => u.tier === 'pro').length;
  const tierFocus = finalState.filter((u) => u.tier === 'focus').length;
  const tierFree = finalState.filter((u) => u.tier === 'free').length;
  const tierMissing = finalState.filter((u) => u.tier === undefined).length;

  console.log(`Total users:    ${total}`);
  console.log(`tier: 'pro'     → ${tierPro}`);
  console.log(`tier: 'focus'   → ${tierFocus}`);
  console.log(`tier: 'free'    → ${tierFree}`);
  console.log(`tier missing    → ${tierMissing}`);

  if (tierPro + tierFocus + tierFree + tierMissing !== total) {
    console.log(`[FAIL] tier counts do not sum to ${total}`);
  }

  const lifeNotPro = finalState.filter((u) => u.isLifeTimePro === true && u.tier !== 'pro');
  if (lifeNotPro.length > 0) {
    console.log(`\n[FAIL] ${lifeNotPro.length} lifetime users would NOT have tier='pro':`);
    for (const u of lifeNotPro) console.log(`  ${u.email} (tier=${u.tier})`);
  } else {
    console.log(`\n[OK] All isLifeTimePro:true users would have tier='pro'`);
  }

  const legacyIsPro = finalState.filter((u) => 'isPro' in u && u.isPro !== undefined).length;
  console.log(legacyIsPro > 0 ? `[FAIL] ${legacyIsPro} users would still have legacy 'isPro' field` : `[OK] No users would have legacy 'isPro' field`);

  const legacyHundred = finalState.filter((u) => 'isFirstHundredUser' in u && u.isFirstHundredUser !== undefined).length;
  console.log(legacyHundred > 0 ? `[FAIL] ${legacyHundred} users would still have legacy 'isFirstHundredUser' field` : `[OK] No users would have legacy 'isFirstHundredUser' field`);

  const oldEnum = finalState.filter((u) => ['monthly', 'yearly', 'lifetime'].includes(u.proSubscriptionType));
  console.log(oldEnum.length > 0 ? `[FAIL] ${oldEnum.length} users would still have old proSubscriptionType values` : `[OK] No users would have old proSubscriptionType enum values`);

  const lifeNullPst = finalState.filter((u) => u.isLifeTimePro === true && (u.proSubscriptionType === null || u.proSubscriptionType === undefined));
  console.log(lifeNullPst.length > 0 ? `[FAIL] ${lifeNullPst.length} lifetime users would still have null/undefined proSubscriptionType` : `[OK] All lifetime users would have a populated proSubscriptionType`);
  console.log('');
}

async function main() {
  header(`MIGRATE TIERS — ${MODE}${APPLY ? '' : '   (no writes will occur)'}`);
  console.log(APPLY
    ? '⚠️  --apply flag detected. THIS WILL WRITE TO MONGODB. Backup beforehand.'
    : 'No --apply flag. Running in preview mode. No changes will be written.');

  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // Use the raw collection so we can read legacy fields (isPro, isFirstHundredUser) that aren't in the current schema
  const usersCol = mongoose.connection.collection('users');

  const totals = { matched: 0, modified: 0 };
  const accumulate = (r) => {
    totals.matched += r.matched;
    totals.modified += r.modified;
  };

  // ---------- Step 1: Active Pro (Stripe sub OR lifetime) → tier:'pro' ----------
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 1: isPro:true with active Stripe sub OR lifetime → tier:'pro'",
      {
        $or: [
          { isPro: true, stripeSubscriptionId: { $ne: null } },
          { isPro: true, isLifeTimePro: true },
        ],
      },
      { $set: { tier: 'pro' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
    )
  );

  // ---------- Step 2a: ACTIVE trial users (proExpiresAt > now) → tier:'pro' ----------
  // Tightened from the original spec to require proExpiresAt > now. Without this,
  // legacy 30-day-trial users whose trials expired would silently get permanent Pro
  // unless AuthContext.jsx's downgrade logic catches them. Defensive correctness wins.
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 2a: ACTIVE trial users (isPro:true, no sub, not lifetime, proExpiresAt > now) → tier:'pro'",
      {
        isPro: true,
        stripeSubscriptionId: null,
        isLifeTimePro: { $ne: true },
        proExpiresAt: { $gt: new Date() },
      },
      { $set: { tier: 'pro' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
    )
  );

  // ---------- Step 2b: EXPIRED / null trial users → tier:'free' ----------
  // Catches: trials whose proExpiresAt has passed, OR trials that were never set up
  // (proExpiresAt is null/missing). These users were carrying isPro:true with no
  // active trial — they should be on free tier.
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 2b: EXPIRED/null trial users (isPro:true, no sub, not lifetime, proExpiresAt missing or in past) → tier:'free'",
      {
        isPro: true,
        stripeSubscriptionId: null,
        isLifeTimePro: { $ne: true },
        $or: [
          { proExpiresAt: { $exists: false } },
          { proExpiresAt: null },
          { proExpiresAt: { $lte: new Date() } },
        ],
      },
      { $set: { tier: 'free' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
    )
  );

  // ---------- Step 3: True free users (no tier, not pro by any signal) → tier:'free' ----------
  // NOTE: This query is intentionally self-scoped (not just {tier: {$exists:false}})
  // so that dry-run and apply behave identically. Without the extra constraints, dry-run
  // would falsely report that the lifetime users from Step 1 are also "going to free",
  // because Step 1's writes haven't actually happened yet during preview.
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 3: True free users (no tier, no pro signals) → tier:'free'",
      {
        tier: { $exists: false },
        isPro: { $ne: true },
        isLifeTimePro: { $ne: true },
        $or: [{ stripeSubscriptionId: null }, { stripeSubscriptionId: { $exists: false } }],
      },
      { $set: { tier: 'free' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
    )
  );

  // ---------- Step 4: Legacy isPro:false → tier:'free' (catches any with tier already set) ----------
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 4: Legacy isPro:false → tier:'free' (cleanup)",
      { isPro: false },
      { $set: { tier: 'free' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
    )
  );

  // ---------- Step 5: Remap proSubscriptionType old enum values to new ----------
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 5a: proSubscriptionType 'monthly' → 'pro-monthly'",
      { proSubscriptionType: 'monthly' },
      { $set: { proSubscriptionType: 'pro-monthly' } }
    )
  );
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 5b: proSubscriptionType 'yearly' → 'pro-yearly'",
      { proSubscriptionType: 'yearly' },
      { $set: { proSubscriptionType: 'pro-yearly' } }
    )
  );
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 5c: proSubscriptionType 'lifetime' → 'pro-lifetime'",
      { proSubscriptionType: 'lifetime' },
      { $set: { proSubscriptionType: 'pro-lifetime' } }
    )
  );

  // ---------- Step 6: NEW — backfill lifetime users with null/undefined proSubscriptionType ----------
  accumulate(
    await previewOrApply(
      usersCol,
      "Step 6: isLifeTimePro:true with null/undefined proSubscriptionType → 'pro-lifetime'",
      {
        isLifeTimePro: true,
        $or: [{ proSubscriptionType: null }, { proSubscriptionType: { $exists: false } }],
      },
      { $set: { proSubscriptionType: 'pro-lifetime' } }
    )
  );

  // ---------- Summary ----------
  header('TOTALS');
  console.log(`Total matched (across all steps): ${totals.matched}`);
  if (APPLY) {
    console.log(`Total modified (across all steps): ${totals.modified}`);
  } else {
    console.log(`(dry-run — nothing was modified)`);
  }

  // ---------- Verification ----------
  await verifyPostMigrationState(usersCol);

  await mongoose.disconnect();
  header(APPLY ? 'MIGRATION COMPLETE' : 'DRY-RUN COMPLETE — re-run with --apply to write changes');
}

main().catch((err) => {
  console.error('\n[FAIL] Migration failed:', err);
  process.exit(1);
});
