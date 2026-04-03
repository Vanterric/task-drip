# DewList Tier Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace DewList's binary Free/Pro model with a three-tier structure (Free, Focus, Pro) with new pricing, tighter free limits, and a 3-day trial.

**Architecture:** Backend User model gains a `tier` enum field replacing the `isPro` boolean. A shared `tier.js` utility provides gating functions used by both backend endpoints and frontend components. Stripe gets new price IDs for Focus and Pro tiers. Frontend subscribe page becomes a three-column comparison layout.

**Tech Stack:** Express, MongoDB/Mongoose, Stripe, React, Tailwind CSS, Framer Motion

**Codebase:** `C:\Users\derri\OneDrive\Documents\task-drip`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `back-end/utils/tier.js` | Create | Tier gating helpers: `canUseOneTaskView`, `canUseAI`, `getMaxLists`, `getMaxTasksPerList`, `tierFromPriceId` |
| `back-end/models/User.js` | Modify | Replace `isPro` with `tier` enum, remove `isFirstHundredUser`, update `proSubscriptionType` enum |
| `back-end/index.js` | Modify | Use tier helpers for all gating, update Stripe price maps and webhooks, update signup and downgrade logic |
| `back-end/utils/resetScheduledTaskLists.js` | Modify | Replace `user.isPro` check with `user.tier === 'pro'` |
| `scripts/migrate-tiers.js` | Create | One-time migration script for existing users |
| `front-end/src/utils/tier.js` | Create | Frontend tier helpers (same logic as backend) |
| `front-end/src/context/AuthContext.jsx` | Modify | Replace `isPro` with `tier`, remove `isFirst100User`, update downgrade logic |
| `front-end/src/pages/home/HomePage.jsx` | Modify | Gate one-task view, update limit checks, update AI checks, remove first-100 banner |
| `front-end/src/components/Sidebar.jsx` | Modify | Update reset schedule gate |
| `front-end/src/components/UpgradePromptModal.jsx` | Modify | Context-aware messaging for Focus vs Pro |
| `front-end/src/pages/subscribe/SubscribePage.jsx` | Modify | Three-tier layout with new pricing |

---

### Task 1: Create Tier Helper Utilities

**Files:**
- Create: `back-end/utils/tier.js`
- Create: `front-end/src/utils/tier.js`

- [ ] **Step 1: Create backend tier helpers**

Create `back-end/utils/tier.js`:

```js
// Stripe price ID → tier mapping
// Replace placeholder IDs with real Stripe price IDs after creating them in the dashboard
const PRICE_TO_TIER = {
  // Test
  'price_FOCUS_MONTHLY_TEST': 'focus',
  'price_FOCUS_YEARLY_TEST': 'focus',
  'price_PRO_MONTHLY_TEST': 'pro',
  'price_PRO_YEARLY_TEST': 'pro',
  // Production
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
```

- [ ] **Step 2: Create frontend tier helpers**

Create `front-end/src/utils/tier.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add back-end/utils/tier.js front-end/src/utils/tier.js
git commit -m "feat: add tier helper utilities for three-tier gating"
```

---

### Task 2: Update User Model

**Files:**
- Modify: `back-end/models/User.js`

- [ ] **Step 1: Replace `isPro` with `tier`, remove `isFirstHundredUser`, update `proSubscriptionType`**

In `back-end/models/User.js`, replace lines 6, 11, 13:

Replace:
```js
  isPro: { type: Boolean, default: false },
```
With:
```js
  tier: { type: String, enum: ['free', 'focus', 'pro'], default: 'free' },
```

Replace:
```js
  proSubscriptionType: { type: String, enum: ['monthly', 'yearly', "lifetime", null], default: null }, // Subscription type
```
With:
```js
  proSubscriptionType: { type: String, enum: ['focus-monthly', 'focus-yearly', 'pro-monthly', 'pro-yearly', 'pro-lifetime', null], default: null },
```

Remove this line entirely:
```js
  isFirstHundredUser: { type: Boolean, default: false }, // For first 100 users
```

- [ ] **Step 2: Commit**

```bash
git add back-end/models/User.js
git commit -m "feat: replace isPro boolean with tier enum in User model"
```

---

### Task 3: Create Migration Script

**Files:**
- Create: `scripts/migrate-tiers.js`

- [ ] **Step 1: Write migration script**

Create `scripts/migrate-tiers.js`:

```js
require('dotenv').config({ path: require('path').join(__dirname, '..', 'back-end', '.env') });
const mongoose = require('mongoose');
const User = require('../back-end/models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Users with active Stripe subscriptions or lifetime → pro
  const proResult = await User.updateMany(
    {
      $or: [
        { isPro: true, stripeSubscriptionId: { $ne: null } },
        { isPro: true, isLifeTimePro: true },
      ],
    },
    { $set: { tier: 'pro' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${proResult.modifiedCount} users to pro tier`);

  // Users with isPro true but no subscription (trial users) → pro (keep proExpiresAt)
  const trialResult = await User.updateMany(
    {
      isPro: true,
      stripeSubscriptionId: null,
      isLifeTimePro: { $ne: true },
    },
    { $set: { tier: 'pro' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${trialResult.modifiedCount} trial users to pro tier`);

  // Everyone else → free
  const freeResult = await User.updateMany(
    { tier: { $exists: false } },
    { $set: { tier: 'free' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${freeResult.modifiedCount} users to free tier`);

  // Also catch any remaining isPro: false users
  const remainingResult = await User.updateMany(
    { isPro: false },
    { $set: { tier: 'free' }, $unset: { isPro: 1, isFirstHundredUser: 1 } }
  );
  console.log(`Migrated ${remainingResult.modifiedCount} remaining users to free tier`);

  // Update old proSubscriptionType values to new format
  await User.updateMany(
    { proSubscriptionType: 'monthly' },
    { $set: { proSubscriptionType: 'pro-monthly' } }
  );
  await User.updateMany(
    { proSubscriptionType: 'yearly' },
    { $set: { proSubscriptionType: 'pro-yearly' } }
  );
  await User.updateMany(
    { proSubscriptionType: 'lifetime' },
    { $set: { proSubscriptionType: 'pro-lifetime' } }
  );
  console.log('Updated proSubscriptionType values');

  await mongoose.disconnect();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/migrate-tiers.js
git commit -m "feat: add tier migration script for existing users"
```

---

### Task 4: Update Backend Gating and Signup Logic

**Files:**
- Modify: `back-end/index.js`
- Modify: `back-end/utils/resetScheduledTaskLists.js`

- [ ] **Step 1: Add tier imports at top of `back-end/index.js`**

After the existing requires (around line 6), add:

```js
const { canUseAI, getMaxLists, getMaxTasksPerList, tierFromPriceId } = require('./utils/tier');
```

- [ ] **Step 2: Update Stripe webhook — `payment_intent.succeeded` (lifetime)**

In the `payment_intent.succeeded` case (around line 87), replace:
```js
      isPro: true,
      isLifeTimePro: true,
      proSubscriptionType: 'lifetime',
```
With:
```js
      tier: 'pro',
      isLifeTimePro: true,
      proSubscriptionType: 'pro-lifetime',
```

- [ ] **Step 3: Update Stripe webhook — `checkout.session.completed`**

In the `checkout.session.completed` case (around line 162), replace:
```js
            {
              isPro: true,
              isLifeTimePro: false,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              proSubscriptionType,
              proExpiresAt: proExpiresAt,
              lastDatePaid: Date.now(),
            }
```
With:
```js
            {
              tier: tierFromPriceId(item?.price?.id) || 'pro',
              isLifeTimePro: false,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              proSubscriptionType: `${tierFromPriceId(item?.price?.id) || 'pro'}-${interval === 'year' ? 'yearly' : 'monthly'}`,
              proExpiresAt: proExpiresAt,
              lastDatePaid: Date.now(),
            }
```

- [ ] **Step 4: Update Stripe webhook — `invoice.payment_succeeded`**

In the `invoice.payment_succeeded` case (around line 216), replace:
```js
    {
      isPro: true,
      isLifeTimePro: false,
      proSubscriptionType,
      lastDatePaid: Date.now(),
      proExpiresAt,
    }
```
With:
```js
    {
      tier: tierFromPriceId(item?.price?.id) || 'pro',
      isLifeTimePro: false,
      proSubscriptionType: `${tierFromPriceId(item?.price?.id) || 'pro'}-${interval === 'year' ? 'yearly' : 'monthly'}`,
      lastDatePaid: Date.now(),
      proExpiresAt,
    }
```

- [ ] **Step 5: Update Stripe webhook — `customer.subscription.updated`**

In the `customer.subscription.updated` case (around line 268), replace:
```js
    { proSubscriptionType }
```
With:
```js
    {
      tier: tierFromPriceId(item?.price?.id) || 'pro',
      proSubscriptionType: `${tierFromPriceId(item?.price?.id) || 'pro'}-${interval === 'year' ? 'yearly' : 'monthly'}`,
    }
```

- [ ] **Step 6: Update Stripe webhook — `customer.subscription.deleted`**

In the `customer.subscription.deleted` case (around line 285), replace:
```js
        {
          isPro: false,
          isLifeTimePro: false,
          stripeSubscriptionId: null,
          proSubscriptionType: null,
          proExpiresAt: null,
        }
```
With:
```js
        {
          tier: 'free',
          isLifeTimePro: false,
          stripeSubscriptionId: null,
          proSubscriptionType: null,
          proExpiresAt: null,
        }
```

- [ ] **Step 7: Update signup — magic link (`/auth/request-link`)**

In the `/auth/request-link` handler (around lines 370-394), replace the entire new-user creation block:

```js
      if (!user) {
      let proExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3-day trial

      if (referrer) {
        proExpiresAt = new Date(proExpiresAt.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days for referral
      }

      user = await User.create({
        email: lowerCaseEmail,
        referrer: referrer || null,
        proExpiresAt: proExpiresAt,
        tier: 'pro',
      });
```

This replaces the old `isFirstHundredUser`, 30-day trial, and `isPro` logic with a flat 3-day Pro trial for everyone.

- [ ] **Step 8: Update signup — password login (`/auth/login`)**

In the `/auth/login` handler (around lines 431-458), replace the new-user creation block with the same pattern:

```js
    if (!user) {
      let proExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      if (referrer) {
        proExpiresAt = new Date(proExpiresAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        email: lowerCaseEmail,
        password: hashedPassword,
        referrer: referrer || null,
        proExpiresAt,
        tier: 'pro',
      });
```

- [ ] **Step 9: Update `/auth/validate` response**

Around line 520, replace:
```js
          isPro: user.isPro,
```
With:
```js
          tier: user.tier,
```

- [ ] **Step 10: Update `/auth/downgrade`**

Around line 537, replace:
```js
      await User.updateOne({ email }, { isPro: false });
```
With:
```js
      await User.updateOne({ email }, { tier: 'free' });
```

- [ ] **Step 11: Update `/user` response**

Around line 655, replace `isPro: user.isPro` with `tier: user.tier` and remove `isFirstHundredUser: user.isFirstHundredUser` from the response object.

- [ ] **Step 12: Update `/user/upgrade`**

Around line 661, replace:
```js
    user.isPro = true;
```
With:
```js
    user.tier = 'pro';
```

- [ ] **Step 13: Update list creation limit**

Around line 723, replace:
```js
    if (!user.isPro && count >= 3) return res.status(403).json({ error: 'Free tier limit reached' });
```
With:
```js
    if (count >= getMaxLists(user)) return res.status(403).json({ error: 'List limit reached for your plan' });
```

- [ ] **Step 14: Update task creation limit**

Around line 802, replace:
```js
    if (!user.isPro && taskCount >= 5) return res.status(403).json({ error: 'Free tier limit' });
```
With:
```js
    if (taskCount >= getMaxTasksPerList(user)) return res.status(403).json({ error: 'Task limit reached for your plan' });
```

- [ ] **Step 15: Update AI endpoint gates**

Replace every occurrence of `if (!user.isPro) return res.status(403).json({ error: 'Pro feature' });` in the AI endpoints (lines ~985, 1019, 1055, 1087, 1123) with:
```js
    if (!canUseAI(user)) return res.status(403).json({ error: 'Pro feature' });
```

- [ ] **Step 16: Update Stripe price maps**

Replace `amountMap` (around line 864):
```js
    const amountMap = {
      'pro-lifetime': 15000,
    };
```

Replace `priceMap` (around line 895):
```js
  const priceMap =
  process.env.ENVIRONMENT === 'dev'
    ? {
        'focus-monthly': 'price_FOCUS_MONTHLY_TEST',
        'focus-yearly': 'price_FOCUS_YEARLY_TEST',
        'pro-monthly': 'price_PRO_MONTHLY_TEST',
        'pro-yearly': 'price_PRO_YEARLY_TEST',
      }
    : {
        'focus-monthly': 'price_FOCUS_MONTHLY_PROD',
        'focus-yearly': 'price_FOCUS_YEARLY_PROD',
        'pro-monthly': 'price_PRO_MONTHLY_PROD',
        'pro-yearly': 'price_PRO_YEARLY_PROD',
      };
```

Note: The actual Stripe price IDs must be created in the Stripe Dashboard before deploying. Replace the placeholder values with real IDs.

- [ ] **Step 17: Update `resetScheduledTaskLists.js`**

In `back-end/utils/resetScheduledTaskLists.js`, line 28, replace:
```js
    if (!user || !user.isPro) continue;
```
With:
```js
    if (!user || user.tier !== 'pro') continue;
```

- [ ] **Step 18: Commit**

```bash
git add back-end/index.js back-end/utils/resetScheduledTaskLists.js
git commit -m "feat: update all backend gating to use tier enum"
```

---

### Task 5: Update AuthContext

**Files:**
- Modify: `front-end/src/context/AuthContext.jsx`

- [ ] **Step 1: Update the expiration check**

Replace lines 21-44 (the `useEffect` that checks `isPro` and `proExpiresAt`):

```jsx
  useEffect(() => {
    if (user?.tier !== 'pro' && user?.tier !== 'focus') return;
    if (!user?.proExpiresAt) return;
  
    const now = new Date();
    const expiry = new Date(user.proExpiresAt);
    
    if (expiry < now) {
      const downgradedUser = { ...user, tier: 'free' };
  
      fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ email: user.email }),
      });
      
      setUser(downgradedUser);
      localStorage.setItem('user', JSON.stringify(downgradedUser)); 
      setWasDowngraded(true);
    }
  }, [user]);
```

- [ ] **Step 2: Remove `isFirst100User` state and update `fetchUser`**

Remove the state declaration:
```jsx
  const [isFirst100User, setIsFirst100User] = useState(false);
```

In the `fetchUser` effect, remove:
```jsx
        setIsFirst100User(data.isFirstHundredUser || false);
```

- [ ] **Step 3: Update the context provider value**

Replace the Provider value — remove `isFirst100User` and `setIsFirst100User`:

```jsx
    <AuthContext.Provider value={{ token, user, isAuthenticated, setToken, setUser, logout, wasDowngraded, setWasDowngraded, isFirstTimeUser, setIsFirstTimeUser, isSubscribedToPushNotifications, setIsSubscribedToPushNotifications, isMuted, setIsMuted }}>
```

- [ ] **Step 4: Commit**

```bash
git add front-end/src/context/AuthContext.jsx
git commit -m "feat: update AuthContext to use tier enum"
```

---

### Task 6: Update HomePage Gating

**Files:**
- Modify: `front-end/src/pages/home/HomePage.jsx`

- [ ] **Step 1: Add tier utility imports**

At the top of `HomePage.jsx`, add:
```jsx
import { canUseOneTaskView, canUseAI, getMaxLists, getMaxTasksPerList } from '../../utils/tier';
```

- [ ] **Step 2: Update `viewType` default**

Find the `useState` for `viewType` (around line 82):
```jsx
const [viewType, setViewType] = useState(localStorage.getItem("defaultView") || 'one-task');
```

Replace with:
```jsx
const [viewType, setViewType] = useState(() => {
  const saved = localStorage.getItem("defaultView");
  return saved || 'list';
});
```

Then add a `useEffect` to force list view when user can't use one-task:
```jsx
useEffect(() => {
  if (user && !canUseOneTaskView(user)) {
    setViewType('list');
  }
}, [user]);
```

- [ ] **Step 3: Update the view toggle button**

Find the toggle button onClick (around line 1327-1350). Wrap the toggle logic:

```jsx
onClick={() => {
  if (!canUseOneTaskView(user)) {
    setShowUpgradeModal(true);
    return;
  }
  setTimeout(() => { setViewType(viewType === 'one-task' ? 'list' : 'one-task') }, 0);
}}
```

- [ ] **Step 4: Update task limit check**

Find (around line 1314):
```jsx
if (tasks.length >= 5 && !user.isPro) {
```
Replace with:
```jsx
if (tasks.length >= getMaxTasksPerList(user)) {
```

- [ ] **Step 5: Update list limit check**

Find (around line 1425):
```jsx
if (!user.isPro && taskLists.length >= 3) {
```
Replace with:
```jsx
if (taskLists.length >= getMaxLists(user)) {
```

- [ ] **Step 6: Update AI feature checks**

Find all instances of `user.isPro` used for AI gating (around lines 428, 1305) and replace with `canUseAI(user)`. For example:

```jsx
if (canUseAI(user)) { setShowAIModal(true) } else { setShowUpgradeModal(true) }
```

- [ ] **Step 7: Remove first-100 banner**

Find and remove the first-100 banner logic (around lines 178-190) and its JSX (around lines 838-849). Remove all references to `isFirst100User` and `firstHundredBannerDismissed` localStorage.

- [ ] **Step 8: Commit**

```bash
git add front-end/src/pages/home/HomePage.jsx
git commit -m "feat: update HomePage to use tier-based gating"
```

---

### Task 7: Update Sidebar and UpgradePromptModal

**Files:**
- Modify: `front-end/src/components/Sidebar.jsx`
- Modify: `front-end/src/components/UpgradePromptModal.jsx`

- [ ] **Step 1: Update Sidebar reset schedule gate**

In `Sidebar.jsx`, find the reset schedule check (around line 440) that uses `user.isPro`. Replace with:
```jsx
user?.tier === 'pro'
```

- [ ] **Step 2: Update UpgradePromptModal with context-aware messaging**

Replace the content of `UpgradePromptModal.jsx` with:

```jsx
import React from 'react';
import { vibration } from '../utilities/vibration';
const dewListLogo = '/DewListGold.png';
import { AnimatePresence, motion } from 'framer-motion';
import { audio } from '../utilities/audio';
import { useAuth } from '../context/AuthContext';

export default function UpgradePromptModal({ isOpen, onClose, onUpgrade, reason }) {
  if (!isOpen) return null;
  const { isMuted } = useAuth();

  const isAIBlock = reason === 'ai';
  const tierName = isAIBlock ? 'Pro' : 'Focus';
  const price = isAIBlock ? '$8/month' : '$4/month';

  const features = isAIBlock
    ? [
        'AI-powered task list creation',
        'AI task polishing & breakdown',
        'Voice-to-task input',
        'Unlimited lists & tasks',
        'Scheduled task list resets',
      ]
    : [
        'One-task-at-a-time focus view',
        'Up to 3 task lists',
        'Upgrade to Pro for AI features',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <AnimatePresence>
      <motion.div 
      layout
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md p-6 space-y-4 text-center dark:bg-[#4F5962]">
      <img src={dewListLogo} alt="DewList Logo" className="w-16 h-16 mx-auto mb-5" />
        <h2 className="text-2xl font-bold text-yellow-500 dark:text-yellow-300 cursor-default border py-2 w-fit mx-auto px-4 rounded-full">Upgrade to {tierName}</h2>
        <p className="text-[#4F5962] dark:text-white text-base cursor-default">
          {isAIBlock ? 'AI features require a Pro subscription.' : "Unlock the full DewList experience."}
        </p>
        <ul className="text-left text-[#4F5962] dark:text-white text-sm pl-4 list-disc space-y-1 cursor-default">
          {features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
        <p className="font-semibold text-yellow-500 dark:text-yellow-300 cursor-default">Starting at {price}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="cursor-pointer bg-[#4C6CA8] text-white py-2 px-4 rounded-xl hover:bg-opacity-90 transition hover:bg-[#3A5D91]"
            onClick={()=>{audio('button-press', isMuted) ;vibration('button-press'); onUpgrade()}}
          >
            See Plans
          </button>
          <button
            className="text-[#91989E] hover:text-[#4F5962] dark:hover:text-white transition cursor-pointer"
            onClick={()=>{audio('close-modal', isMuted);vibration('button-press'); onClose()}}
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Update UpgradePromptModal call sites in HomePage**

Pass `reason` prop when showing the upgrade modal. For AI-triggered upgrades:
```jsx
<UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={() => navigate('/subscribe')} reason="ai" />
```

For limit/view-triggered upgrades:
```jsx
<UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={() => navigate('/subscribe')} reason="limit" />
```

You'll need to track which reason triggered the modal — add a `upgradeReason` state:
```jsx
const [upgradeReason, setUpgradeReason] = useState('limit');
```

Set it to `'ai'` before showing the modal for AI features, `'limit'` for everything else. Pass `reason={upgradeReason}` to the modal.

- [ ] **Step 4: Commit**

```bash
git add front-end/src/components/Sidebar.jsx front-end/src/components/UpgradePromptModal.jsx front-end/src/pages/home/HomePage.jsx
git commit -m "feat: update sidebar gate and upgrade modal for tier system"
```

---

### Task 8: Rebuild Subscribe Page

**Files:**
- Modify: `front-end/src/pages/subscribe/SubscribePage.jsx`

- [ ] **Step 1: Replace SubscribePage with three-tier layout**

Replace the entire contents of `SubscribePage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vibration } from '../../utilities/vibration';
import { audio } from '../../utilities/audio';
import { AnimatePresence, motion } from 'framer-motion';
import { DotLoader } from '../../components/DotLoader';

const dewlistLogo = '/DewListGold.png';

const tiers = {
  free: {
    name: 'Free',
    features: ['1 task list', '5 tasks per list', 'List view only', 'Push notifications'],
  },
  focus: {
    name: 'Focus',
    monthly: '$4/mo',
    yearly: '$36/yr',
    features: ['3 task lists', '5 tasks per list', 'One-task-at-a-time view', 'Push notifications'],
    plans: {
      monthly: { label: 'Monthly', price: '$4/mo', stripePlan: 'focus-monthly' },
      yearly: { label: 'Yearly', price: '$36/yr', stripePlan: 'focus-yearly' },
    },
  },
  pro: {
    name: 'Pro',
    badge: 'BEST VALUE',
    monthly: '$8/mo',
    yearly: '$72/yr',
    lifetime: '$150 once',
    features: ['Unlimited lists & tasks', 'One-task-at-a-time view', 'AI task breakdown & polish', 'AI voice input', 'Scheduled resets'],
    plans: {
      monthly: { label: 'Monthly', price: '$8/mo', stripePlan: 'pro-monthly' },
      yearly: { label: 'Yearly', price: '$72/yr', stripePlan: 'pro-yearly' },
      lifetime: { label: 'Lifetime', price: '$150', stripePlan: 'pro-lifetime' },
    },
  },
};

export default function SubscribePage() {
  const { user, setUser, isMuted } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const checkoutSuccess = queryParams.get('status') === 'success';

  useEffect(() => {
    if (checkoutSuccess) handleUpgradeComplete();
  }, [checkoutSuccess]);

  const handleUpgradeComplete = async () => {
    const pollUntilUpgraded = async (retries = 10) => {
      for (let i = 0; i < retries; i++) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/validate?token=${localStorage.getItem('authToken')}`);
        const data = await res.json();
        if (data?.user?.tier === 'pro' || data?.user?.tier === 'focus') {
          localStorage.setItem('token', data.token);
          setUser(data.user);
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      throw new Error("Timed out waiting for upgrade");
    };
    await pollUntilUpgraded();
    setLoading(false);
    vibration('button-press');
    setSubscribed(true);
  };

  const handleSubscribe = async (tierKey, plan) => {
    vibration('button-press');
    setLoading(true);
    setError(null);
    setSelectedTier(tierKey);

    if (plan === 'pro-lifetime') {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan: 'pro-lifetime' }),
      });
      const { clientSecret } = await res.json();
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { email: user.email },
        },
      });
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        handleUpgradeComplete();
      }
    } else {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan }),
      });
      const { url } = await res.json();
      setLoading(false);
      audio('open-modal', isMuted);
      setTimeout(() => { window.location.href = url; }, 200);
    }
  };

  if (subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAECE5] dark:bg-[#212732] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-[#4F5962] shadow-xl rounded-xl p-6 space-y-6 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-[#6DBF67]" />
          <h2 className="text-xl font-semibold text-[#4F5962] dark:text-white cursor-default">Success!</h2>
          <p className="text-sm text-text-info dark:text-text-darkinfo cursor-default">Your upgrade was successful.</p>
          <button onClick={() => { audio('button-press', isMuted); vibration('button-press'); navigate('/app'); }} className="bg-[#4C6CA8] text-white px-6 py-3 rounded-full font-medium hover:bg-[#3A5D91] transition cursor-pointer">
            Go back to DewList
          </button>
        </motion.div>
      </div>
    );
  }

  const currentTier = user?.tier || 'free';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAECE5] dark:bg-[#212732] px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <img src={dewlistLogo} alt="DewList Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#4F5962] dark:text-white">Choose Your Plan</h1>
          <div className="flex justify-center gap-2 mt-4">
            {['monthly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => { audio('button-press', isMuted); vibration('button-press'); setBillingCycle(cycle); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${billingCycle === cycle ? 'bg-[#4C6CA8] text-white' : 'bg-white dark:bg-[#4F5962] text-[#4F5962] dark:text-white border border-[#4C6CA8] dark:border-[#7A8A9E]'}`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(tiers).map(([key, tier]) => {
            const isCurrent = currentTier === key;
            const isPro = key === 'pro';
            const price = key === 'free' ? 'Free' : tier[billingCycle];

            return (
              <motion.div
                key={key}
                layout
                className={`relative bg-white dark:bg-[#4F5962] rounded-xl p-5 shadow-lg space-y-4 ${isPro ? 'border-2 border-yellow-500 dark:border-yellow-300' : 'border border-gray-200 dark:border-[#7A8A9E]'}`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#4F5962] dark:text-white">{tier.name}</h3>
                <p className="text-2xl font-bold text-[#4C6CA8] dark:text-[#7AB5E8]">{price}</p>
                <ul className="space-y-2">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#4F5962] dark:text-white">
                      <Check className="w-4 h-4 mt-0.5 text-[#6DBF67] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center text-sm font-medium text-[#91989E] py-2">Current Plan</div>
                ) : key === 'free' ? (
                  <div className="text-center text-sm text-[#91989E] py-2">—</div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(key, tier.plans[billingCycle]?.stripePlan)}
                    disabled={loading}
                    className="w-full bg-[#4C6CA8] text-white py-2 rounded-lg font-medium hover:bg-[#3A5D91] transition cursor-pointer disabled:opacity-60"
                  >
                    {loading && selectedTier === key ? <span className="flex justify-center items-center gap-1">Processing<span className="mt-2"><DotLoader /></span></span> : isCurrent ? 'Current Plan' : 'Subscribe'}
                  </button>
                )}

                {isPro && (
                  <button
                    onClick={() => handleSubscribe('pro', 'pro-lifetime')}
                    disabled={loading || isCurrent}
                    className="w-full text-sm text-[#4C6CA8] dark:text-[#7AB5E8] underline cursor-pointer disabled:opacity-40"
                  >
                    Or pay $150 once, forever
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Lifetime CardElement — hidden until needed */}
        <AnimatePresence>
          {selectedTier === 'pro' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-md mx-auto overflow-hidden"
            >
              <CardElement className="p-3 border rounded-md bg-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <p className="text-xs text-center text-text-info dark:text-text-darkinfo cursor-default">
          Secure checkout powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front-end/src/pages/subscribe/SubscribePage.jsx
git commit -m "feat: rebuild subscribe page with three-tier layout"
```

---

### Task 9: Manual Verification & Stripe Setup

- [ ] **Step 1: Create Stripe Price IDs**

In the Stripe Dashboard (test mode), create 4 new recurring prices:
- Focus Monthly: $4/month
- Focus Yearly: $36/year
- Pro Monthly: $8/month
- Pro Yearly: $72/year

Copy the price IDs and update:
- `back-end/utils/tier.js` — `PRICE_TO_TIER` map
- `back-end/index.js` — `priceMap` object

- [ ] **Step 2: Run migration**

```bash
cd back-end && node ../scripts/migrate-tiers.js
```

Verify output shows all users migrated.

- [ ] **Step 3: Start backend and test**

```bash
cd back-end && node index.js
```

Test signup flow (creates user with `tier: 'pro'` and 3-day `proExpiresAt`).
Test list creation limit (free user: 1 list max).
Test task creation limit (5 tasks max for free and focus).
Test AI endpoint rejection for non-pro users.

- [ ] **Step 4: Start frontend and test**

```bash
cd front-end && npm run dev
```

Verify:
- Free users see list view only, toggle shows upgrade modal
- Subscribe page shows three tiers with correct pricing
- Focus/Pro checkout flows work in Stripe test mode
- After subscribing, user gets correct tier and features unlock

- [ ] **Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "feat: complete DewList three-tier pricing restructure"
```
