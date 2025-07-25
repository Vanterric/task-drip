require('dotenv').config();
const webpush = require( 'web-push');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const TaskList = require('./models/TaskList');
const Task = require('./models/Task');
const Icon = require('./models/Icon');
const app = express();
const {Resend} = require('resend');
const { OpenAI } = require('openai');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const upload = multer({ dest: 'uploads/' }); 
const { promisify } = require('util');
const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);

app.use(cors({
  origin: ['https://dewlist.app', 'http://localhost:5173'], // add your live and dev origins
}));

const { sendMagicLinkEmail } = require('./utils/sendMagicLink');
const { systemPromptTaskBreakdown } = require('./system-prompts/systemPromptTaskBreakdown');
const { systemPromptPolishTask } = require('./system-prompts/systemPromptPolishTask');
const { systemPromptTaskBreakdownSingle } = require('./system-prompts/SystemPromptSingleTaskBreakdown');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

app.listen(process.env.PORT || 3001, () =>
  console.log("Backend running on port", process.env.PORT || 3001)
);

//Stripe Payment Fulfillment
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(`✅ Webhook received: ${event.type}`);
  } catch (err) {
    console.error('❌ Webhook Signature Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    //
    //  LIFETIME PLAN — One-time payment
    //
    case 'payment_intent.succeeded': {
  const intent = event.data.object;

  const customerId = intent.customer;
  const plan = intent.metadata?.plan;

  if (plan !== 'lifetime') {
    return res.status(200).json({ skipped: true });
  }

  let user;

  if (customerId) {
    user = await User.findOne({ stripeCustomerId: customerId });
  }

  // Fallback to email match ONLY if customerId is missing or not matched
  if (!user && intent.receipt_email) {
    user = await User.findOne({ email: intent.receipt_email });
  }

  if (!user) {
    console.warn(`⚠️ No user found for payment_intent with customerId: ${customerId}`);
    return res.status(404).json({ error: 'User not found' });
  }

  await User.updateOne(
    { _id: user._id },
    {
      isPro: true,
      isLifeTimePro: true,
      proSubscriptionType: 'lifetime',
      proExpiresAt: null,
      lastDatePaid: Date.now(),
      ...(customerId && !user.stripeCustomerId && { stripeCustomerId: customerId }),
    }
  );

  console.log(`💰 Lifetime upgrade for user ${user.email}`);
  return res.status(200).json({ received: true });
}


    //
    //  NEW SUBSCRIPTION 
    //
        case 'checkout.session.completed': {
          const session = event.data.object;

          const subscriptionId = session.subscription;
          const customerId = session.customer;
          const email = session.customer_email || session.customer_details?.email;


          if (!subscriptionId || !customerId || !email) {
            return res.status(400).json({ error: 'Missing subscription, customer ID, or email' });
          }

          // Fetch full subscription to get current_period_end and interval
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price'],
        });


          // Grab the first subscription item
          const item = subscription.items?.data?.[0];
          if (!item) {
            throw new Error(`No subscription items found for subscription ID: ${subscriptionId}`);
          }

          // ✅ Updated for Stripe 2025 API structure
          const currentPeriodEndSeconds = item?.current_period?.end ?? item?.current_period_end;
          const proExpiresAt = currentPeriodEndSeconds
            ? new Date(currentPeriodEndSeconds * 1000)
            : null;


          // New interval
          const interval = item?.price?.recurring?.interval;
          console.log(`Interval: ${interval}`);
          console.log( `Subscription item details:`, item);
          if (!interval) {
            throw new Error(`Missing interval on subscription item ${item.id}`);
          }
          const proSubscriptionType = interval === 'year' ? 'yearly' : 'monthly';


          // Try to find user by customerId
          let user = await User.findOne({ stripeCustomerId: customerId });

          // Fallback: use email if customerId not yet linked
          if (!user) {
            user = await User.findOne({ email });
          }

          if (!user) {
            console.warn(`⚠️ No user found for email ${email} or customerId ${customerId}`);
            return res.status(404).json({ error: 'User not found' });
          }

          // Update user fields
          await User.updateOne(
            { _id: user._id },
            {
              isPro: true,
              isLifeTimePro: false,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              proSubscriptionType,
              proExpiresAt: proExpiresAt,
              lastDatePaid: Date.now(),
            }
          );

          console.log(`✅ Checkout complete: ${email} → ${proSubscriptionType}`);
          return res.status(200).json({ received: true });
        }


    //
    //  RENEWAL
    //
    case 'invoice.payment_succeeded': {
  const invoice = event.data.object;
  const line = invoice.lines?.data?.[0];
  const subscriptionId = line?.parent?.subscription_item_details?.subscription;

  if (!subscriptionId) {
    console.warn('⚠️ Missing subscription ID in invoice line');
    return res.status(400).json({ error: 'Missing subscription ID' });
  }

  // 🔄 Fetch the full subscription with expanded pricing
  let subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });
  } catch (err) {
    console.error(`❌ Failed to retrieve subscription ${subscriptionId}:`, err.message);
    return res.status(500).json({ error: 'Subscription fetch failed' });
  }

  const item = subscription.items?.data?.[0];
  const interval = item?.price?.recurring?.interval;
  const currentPeriodEnd = item?.current_period?.end ?? item?.current_period_end;
  const proExpiresAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;

  if (!interval) {
    console.warn(`⚠️ Missing interval for subscription item ${item?.id}`);
    return res.status(400).json({ error: 'Missing billing interval' });
  }

  const proSubscriptionType = interval === 'year' ? 'yearly' : 'monthly';

  await User.updateOne(
    { stripeSubscriptionId: subscriptionId },
    {
      isPro: true,
      isLifeTimePro: false,
      proSubscriptionType,
      lastDatePaid: Date.now(),
      proExpiresAt,
    }
  );

  console.log(`💸 Invoice paid: ${subscriptionId} → ${proSubscriptionType}`);
  return res.status(200).json({ received: true });
}


    //
    // PLAN SWITCHING
    //
    case 'customer.subscription.updated': {
  const rawSub = event.data.object;
  const subscriptionId = rawSub.id;

  if (rawSub.cancel_at_period_end) {
    console.log(`Subscription ${subscriptionId} marked to cancel. Skipping update.`);
    return res.status(200).json({ skipped: true });
  }

  // 🔄 Re-fetch the subscription with expanded price
  let sub;
  try {
    sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });
  } catch (err) {
    console.error(`❌ Failed to retrieve subscription ${subscriptionId}:`, err.message);
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }

  const item = sub.items.data?.[0];
  const interval = item?.price?.recurring?.interval;

  if (!interval) {
    console.warn(`⚠️ Missing interval for subscription ${subscriptionId}`);
    return res.status(400).json({ error: 'Missing interval' });
  }

  console.log(`Interval: ${interval}`);
  console.log( `Subscription item details:`, item);

  const proSubscriptionType = interval === 'year' ? 'yearly' : 'monthly';

  await User.updateOne(
    { stripeSubscriptionId: subscriptionId },
    { proSubscriptionType }
  );

  console.log(`🔁 Updated subscription type → ${proSubscriptionType} for ${subscriptionId}`);
  return res.status(200).json({ received: true });
}


    //
    // FINAL CANCELLATION
    //
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const subscriptionId = sub.id;

      await User.updateOne(
        { stripeSubscriptionId: subscriptionId },
        {
          isPro: false,
          isLifeTimePro: false,
          stripeSubscriptionId: null,
          proSubscriptionType: null,
          proExpiresAt: null,
        }
      );

      console.log(`Subscription ${subscriptionId} ended — user downgraded`);
      return res.status(200).json({ received: true });
    }

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
      return res.status(200).json({ received: true });
  }
});




app.use(express.json());
const prerender = require('prerender-node');

// Your API key (get from https://prerender.io)
prerender.set('prerenderToken', process.env.PRERENDER_API_KEY);

// 1. Only allow `/login` (ignore all other paths)
prerender.set('whitelisted', ['/login']);

// 2. Ignore any query params so `/login?ref=abc` is treated same as `/login`
prerender.set('blacklistedQueryParams', [
  'ref',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]);

// 3. Use the middleware (place before your static serve)
app.use(prerender);




// auth routes

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
  
    if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });
  
    const token = authHeader.split(' ')[1]; // Expected format: Bearer <token>
    if (!token) return res.status(401).json({ error: 'Invalid token format' });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // decoded = { email, id }
      next();
    } catch (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  };

  app.get('/auth/verifyToken', verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
  });

  app.post("/auth/resetPassword", verifyToken, async (req, res) => {
    console.log("Reset password request for user:", req.user.id);
  const { password } = req.body;
  

  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});
  
  app.post('/auth/request-link', async (req, res) => {
    const { email, referrer } = req.body;
    const lowerCaseEmail = email.toLowerCase().trim();
    try {
      let user = await User.findOne({ email: lowerCaseEmail });
      if (!user) {
      const userCount = await User.countDocuments();
      const isFirstHundredUser = userCount < 100;
      let proExpiresAt = null;

        if (isFirstHundredUser) {
          proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        if (referrer) {
          if (proExpiresAt) {
            proExpiresAt = new Date(proExpiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
          } else {
            proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
        }

      const isPro = isFirstHundredUser || !!referrer;

      user = await User.create({
        email: lowerCaseEmail,
        referrer: referrer || null, // Store referrer if provided
        proExpiresAt: proExpiresAt,
        isPro: isPro,
        isFirstHundredUser: isFirstHundredUser,
      });

      const firstTaskList = await TaskList.create({ name: "Getting Started", userId: user._id, icon:"droplet", order: 0 });
      await Task.create({ content: "Create My DewList Account", description: "If you're seeing this, you can go ahead and check this one off your list 😉", tasklistId: firstTaskList._id });
      await Task.create({ content: "Create My First List", description: `To create a new task list, tap the menu button (☰) at the top left of the screen, then click "Add New Task List" at the top of the sidebar.\n\nExample Lists:\n☀️ Morning Routine\n🛁 Self-Care Ritual\n🛒 Groceries`, tasklistId: firstTaskList._id });
      await Task.create({ content: "Add 3-5 Tasks to My List", description: `To add a new task to your list, first navigate to your list by clicking on it in the sidebar, then tap the “Add Task” button at the bottom center of your screen.\n\nExample Tasks:\n☀️ Make the bed\n🛁 Put on moisturizer\n🛒 Buy oat milk`, tasklistId: firstTaskList._id });
    }
  
      const token = jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
  
      user.magicToken = token;
      await user.save();
  
      const url = `https://dewlist.app/unlock?token=${token}`;
  
      const sent = await sendMagicLinkEmail(email, url);
      if (!sent) return res.status(500).json({ error: "Failed to send email." });
  
      res.json({ message: 'Magic login link sent!' });
    } catch (err) {
      console.error("Auth error:", err);
      res.status(500).json({ error: 'Something went wrong.' });
    }
  });

  app.post('/auth/login', async (req, res) => {
  const { email, password, referrer } = req.body;
  const lowerCaseEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ email: lowerCaseEmail });

    // If user doesn't exist, create them
    if (!user) {
      const userCount = await User.countDocuments();
      const isFirstHundredUser = userCount < 100;

      let proExpiresAt = isFirstHundredUser
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

      if (referrer) {
        proExpiresAt = new Date((proExpiresAt || Date.now()) + 30 * 24 * 60 * 60 * 1000);
      }

      const isPro = isFirstHundredUser || !!referrer;
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        email: lowerCaseEmail,
        password: hashedPassword,
        referrer: referrer || null,
        proExpiresAt,
        isPro,
        isFirstHundredUser,
      });
      const firstTaskList = await TaskList.create({ name: "Getting Started", userId: user._id, icon:"droplet", order: 0 });
      await Task.create({ content: "Create My DewList Account", description: "If you're seeing this, you can go ahead and check this one off your list 😉", tasklistId: firstTaskList._id });
      await Task.create({ content: "Create My First List", description: `To create a new task list, tap the menu button (☰) at the top left of the screen, then click "Add New Task List" at the top of the sidebar.\n\nExample Lists:\n☀️ Morning Routine\n🛁 Self-Care Ritual\n🛒 Groceries`, tasklistId: firstTaskList._id });
      await Task.create({ content: "Add 3-5 Tasks to My List", description: `To add a new task to your list, first navigate to your list by clicking on it in the sidebar, then tap the “Add Task” button at the bottom center of your screen.\n\nExample Tasks:\n☀️ Make the bed\n🛁 Put on moisturizer\n🛒 Buy oat milk`, tasklistId: firstTaskList._id });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'No password set' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Optionally store the session token (e.g. if used for magic links too)
    user.magicToken = token;
    await user.save();

    res.json({
      token,
      user: {
        email: user.email,
        isPro: user.isPro,
        isLifeTimePro: user.isLifeTimePro,
        proExpiresAt: user.proExpiresAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


  


  app.get('/auth/validate', async (req, res) => {
    const { token } = req.query;
  
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
  
      const user = await User.findOne({ email: payload.email });
      if (!user) return res.status(401).json({ error: 'User not found' });
  
      // Issue a new 7-day token
      const sessionToken = jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      // Store it if needed
      user.magicToken = sessionToken;
      await user.save();
  
      res.json({
        token: sessionToken,
        user: {
          email: user.email,
          isPro: user.isPro,
          isLifeTimePro: user.isLifeTimePro,
          proExpiresAt: user.proExpiresAt,
        },
      });
    } catch (err) {
      console.error("Token validation failed:", err);
      res.status(400).json({ error: 'Token expired or invalid' });
    }
  });
  
  app.post('/auth/downgrade', verifyToken, async (req, res) => {
    const { email } = req.body;
  
    try {
      await User.updateOne({ email }, { isPro: false });
      res.json({ success: true });
    } catch (err) {
      console.error("Downgrade error:", err);
      res.status(500).json({ error: "Failed to downgrade" });
    }
  });

  // Push notifications
webpush.setVapidDetails(
  'mailto:hello@dewlist.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    

    const { device, type = 'inactivity', label, listId, taskId, ...subscription } = req.body;

    const alreadyExists = user.pushSubscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint && sub.type === type && sub.listId === listId && sub.taskId === taskId
    );

    if (!alreadyExists) {
      console.log('Adding new push subscription for user:', user.email);
      user.pushSubscriptions.push({ ...subscription, device, type, label, listId, taskId });
      console.log('New push subscription added:', subscription);
      await user.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving push subscription:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

app.post('/unsubscribe', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log('Unsubscribing user:', user.email);
    console.log('Unsubscribing from endpoint:', req.body.endpoint);
    console.log('Unsubscribing from type:', req.body.type);
    console.log('Unsubscribing from listId:', req.body.listId);
    console.log('Unsubscribing from taskId:', req.body.taskId);

    const { endpoint, type = 'reset', listId, taskId } = req.body;

    const before = user.pushSubscriptions.length;
    console.log('Number of subscriptions before:', before);

    user.pushSubscriptions = user.pushSubscriptions.filter((sub) => {
      if (listId) return sub.listId !== listId || sub.type !== type;
      if (taskId) return sub.taskId !== taskId || sub.type !== type;
      // If no listId or taskId, just filter by endpoint and type
      return sub.endpoint !== endpoint || sub.type !== type;
    });

    if (user.pushSubscriptions.length < before) {
      await user.save();
      return res.json({ success: true });
    }

    res.status(404).json({ error: 'No matching subscriptions found' });
  } catch (err) {
    console.error('Error unsubscribing:', err);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});



app.post('/snoozePush', async (req, res) => {
  console.log('✅ Snoozed push for user', req.body.userId);
  try {
    console.log('finding user with ID:', req.body.userId);
    const user = await User.findById(req.body.userId);
    console.log('found user:', user);    
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log('snoozing push for user:', user.email);
    user.lastPushSentAt = null;
    console.log('setting lastPushSentAt to null for user:', user.email);
    await user.save();
    console.log('✅ Push snoozed successfully for user:', user.email);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to snooze push:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

  // user routes
  app.get('/user', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    user.lastActiveAt = new Date();
    await user.save();
    res.json({ id:user._id, email: user.email, isPro: user.isPro, createdAt: user.createdAt, isFirstTimeUser: user.isFirstTimeUser, isFirstHundredUser: user.isFirstHundredUser, isLifeTimePro: user.isLifeTimePro, proExpiresAt: user.proExpiresAt, pushSubscriptions: user.pushSubscriptions || [], isReferrer: user.isReferrer, referrer: user.referrer, proSubscriptionType: user.proSubscriptionType });
  });

  
  app.post('/user/upgrade', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    user.isPro = true;
    await user.save();
    res.json({ success: true });
  });
  
  app.post('/user/noLongerFirstTime', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user.isFirstTimeUser) return res.status(400).json({ error: "User is not a first-time user" });
    user.isFirstTimeUser = false;
    user.lastActiveAt = new Date();
    await user.save();
    res.json({ success: true });
  });

  app.post('/user/setLastActiveAt', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    user.lastActiveAt = new Date();
    user.save();
    res.json({ success: true });
  })
  
  app.post('/user/changeEmail', verifyToken, async (req, res) => {
    const { newEmail, userId } = req.body;
    if (!newEmail || !newEmail.includes('@')) return res.status(400).json({ error: 'Invalid email' });
  
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
  
    user.email = newEmail.toLowerCase().trim();
    await user.save();
  
    res.json({ success: true, email: user.email });
  });

  
  // tasklist routes
  app.get('/tasklists', verifyToken, async (req, res) => {
    const lists = await TaskList.find({ userId: req.user.id });
    lists.sort((a, b) => a.order - b.order); 
    res.json(lists);
  });

  app.post('/tasklists', verifyToken, async (req, res) => {
    const count = await TaskList.countDocuments({ userId: req.user.id });
    const user = await User.findById(req.user.id);
    const creationPrompt = req.body.creationPrompt;
    const order = req.body.order || 0;
    
  
    if (!user.isPro && count >= 3) return res.status(403).json({ error: 'Free tier limit reached' });

    const { name, icon = "clipboard-check" } = req.body;
  
    const list = await TaskList.create({ userId: req.user.id, name, icon, order, creationPrompt: creationPrompt || null });
    user.lastActiveAt = new Date();
    user.save();
    res.json(list);
  });

  app.delete('/tasklists/:id', verifyToken, async (req, res) => {
  const listId = req.params.id;

  // Step 1: Find all tasks in the list
  const tasksInList = await Task.find({ tasklistId: listId }, { _id: 1 });
  const taskIds = tasksInList.map(task => task._id.toString());

  // Step 2: Delete the task list and its tasks
  await TaskList.deleteOne({ _id: listId, userId: req.user.id });
  await Task.deleteMany({ tasklistId: listId });

  // Step 3: Remove matching dewDate subscriptions
  if (taskIds.length > 0) {
    await User.updateMany(
      { 'pushSubscriptions': { $elemMatch: { taskId: { $in: taskIds }, type: 'dewDate' } } },
      { $pull: { pushSubscriptions: { taskId: { $in: taskIds }, type: 'dewDate' } } }
    );
    console.log(`🧹 Cleaned up dewDate subs for ${taskIds.length} tasks deleted with list ${listId}`);
  }

  res.json({ success: true });
});

  
  app.put('/tasklists/:id', verifyToken, async (req, res) => {
    const { name, icon, resetSchedule, order } = req.body;
    console.log("Updating task list:", req.params.id, "with data:", req.body);
  
    if (name && name.trim() === "") {
      return res.status(400).json({ error: "Name cannot be empty" });
    }
  
    try {
      const updateFields = {};
        if (name) updateFields.name = name;
        if (icon) updateFields.icon = icon;
        if (order !== undefined) updateFields.order = order; 
        if (resetSchedule) updateFields.resetSchedule = resetSchedule

        const updated = await TaskList.findByIdAndUpdate(
          req.params.id,
          updateFields,
          { new: true }
      );
  
      if (!updated) return res.status(404).json({ error: "Task list not found" });
  
      res.json(updated);
    } catch (err) {
      console.error("Error updating task list:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });
  


  // task routes
  app.get('/tasks', verifyToken, async (req, res) => {
    const { tasklistId } = req.query;
    const tasks = await Task.find({ tasklistId }).sort({ order: 1 });
    res.json(tasks);
  });
    
  app.post('/tasks', verifyToken, async (req, res) => {
    const tasklistId = req.body.tasklistId;
    const user = await User.findById(req.user.id);
    const taskCount = await Task.countDocuments({ tasklistId });
    console.log(`req.body:`, req.body);
    console.log(`req.body.content:`, req.body.content);
    if (!user.isPro && taskCount >= 5) return res.status(403).json({ error: 'Free tier limit' });
  
    const task = await Task.create({ tasklistId, content: req.body.content, order: req.body.order || 0, description: req.body.description || '', timeEstimate: req.body.timeEstimate || null, dewDate: req.body.dewDate || null });
    user.lastActiveAt = new Date();
    user.save();
    res.json(task);
  });

  app.put('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const allowedFields = ['content', 'isComplete', 'order', 'timeEstimate']; // whitelist keys
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

  
  app.delete('/tasks/:id', verifyToken, async (req, res) => {
    const taskId = req.params.id;
    await User.updateMany(
  { 'pushSubscriptions.taskId': taskId },
  { $pull: { pushSubscriptions: { taskId, type: 'dewDate' } } }
);
    await Task.deleteOne({ _id: taskId });
    res.json({ success: true });
  });

  app.patch('/tasks/:id', verifyToken, async (req, res) => {
    try {
      const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ error: "Task not found" });
      res.json(updated);
    } catch (err) {
      console.error("PATCH error:", err);
      res.status(500).json({ error: "Something went wrong." });
    }
  });
  
  // stripe endpoints
  

  app.post('/create-payment-intent', async (req, res) => {
    const { email, plan } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
      });

      user.stripeCustomerId = customer.id;
      await user.save();
    }
  
    const amountMap = {
      monthly: 500,
      yearly: 3000,
      lifetime: 10000,
    };
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountMap[plan],
      currency: 'usd',
      customer: user.stripeCustomerId,
      receipt_email: email,
      metadata: { plan, referrer: user.referrer || null },
    });
  
    res.json({ clientSecret: paymentIntent.client_secret });
  });

  app.post('/create-checkout-session', async (req, res) => {
  const { email, plan } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
      });

      user.stripeCustomerId = customer.id;
      await user.save();
    }

  const priceMap =
  process.env.ENVIRONMENT === 'dev'
    ? {
        monthly: 'price_1RFIo6RWVGtxvtb5uf6mF81I',    
        yearly: 'price_1RFIouRWVGtxvtb51zP0eT2J',
      }
    : {
        monthly: 'price_1RgXtiDFl6DTTJEmAOXQr2A4',  
        yearly: 'price_1RgXtiDFl6DTTJEm7g5gS59Z',
      };


  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: user.stripeCustomerId,
    line_items: [
      {
        price: priceMap[plan],
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    metadata:{ plan, referrer: user.referrer || null },
    success_url: 'https://dewlist.app/subscribe?status=success',
    cancel_url: 'https://dewlist.app/subscribe',
  });

  res.json({ url: session.url });
});

app.post('/create-customer-portal-session', async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const user = await User.findById(userId);
  if (!user || !user.stripeCustomerId) {
    return res.status(404).json({ error: 'User or Stripe customer not found' });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: 'https://dewlist.app/',
  });

  res.json({ url: session.url });
});




  
  // AI endpoints
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  // AI Task List Creation
  app.post('/ai/breakdown', verifyToken, async (req, res) => {
    const { goal } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.isPro) return res.status(403).json({ error: 'Pro feature' });
    if (!goal || goal.length < 5) {
      return res.status(400).json({ error: 'Invalid goal' });
    }
  
    try {
      const prompt = `Today's date is ${new Date().toLocaleDateString()}. The day is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.
      
      Here is the user's goal:
      Goal: "${goal}"
`;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPromptTaskBreakdown},
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    response_format: { type: "json_object" }
  });
      const raw = response.choices?.[0]?.message?.content;
      const taskList = JSON.parse(raw); // try-catch optional
      console.log('AI task breakdown result:', taskList);
      
      res.json({ taskList });
    } catch (err) {
      console.error('OpenAI error:', err);
      res.status(500).json({ error: 'AI breakdown failed.' });
    }
  });

  // polish task 
  app.post('/ai/polish', verifyToken, async (req, res) => {
    const { task } = req.body;
    const user = await User.findById(req.user.id);
    console.log("currentTasks:", req.body.currentTasks);
    if (!user.isPro) return res.status(403).json({ error: 'Pro feature' });
    if (!task || task.length < 5) {
      return res.status(400).json({ error: 'Invalid task' });
    }
    try {
      const prompt = `Today's date is ${new Date().toLocaleDateString()}. The day is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.
      Here is the user's current tasklist details (be sure to pay particular attention to the creationPrompt. It may have details that will help determine the dewDate):
      ${req.body.currentTaskList || '(empty)'}
      Here are the tasks within that list (if any):
      ${req.body.currentTasks || '(none)'}
      Here is the user's task that needs polishing (it won't necessarily be going at the end of the task list, so consider that):
      Task: "${task}"`;
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPromptPolishTask},
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });
      const polished = response.choices?.[0]?.message?.content?.trim();
      console.log('AI polish result:', polished);
      res.json({ polished });
    } catch (err) {
      console.error('OpenAI error:', err);
      res.status(500).json({ error: 'AI polish failed.' });
    }
  });

  // AI Transcription
  app.post('/ai/transcribe', verifyToken, upload.single('audio'), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.isPro) return res.status(403).json({ error: 'Pro feature' });

  const filePath = req.file?.path;
  const originalName = req.file?.originalname;

  if (!filePath || !originalName) {
    return res.status(400).json({ error: 'Audio file is required.' });
  }

  const extension = path.extname(originalName) || '.webm'; // fallback
  const newPath = `${filePath}${extension}`;

  try {
    await rename(filePath, newPath); // Add the extension

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(newPath),
      model: 'whisper-1',
      response_format: 'text',
      language: 'en',
    });

    res.json({ text: transcription });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed.' });
  } finally {
    unlink(filePath).catch(() => {}); // In case rename fails
    unlink(newPath).catch(() => {});
  }
});

// AI Single Task Breakdown
app.post('/ai/singleTaskBreakdown', verifyToken, async (req, res) => {
    const { task, list} = req.body;
    const user = await User.findById(req.user.id);
    if (!user.isPro) return res.status(403).json({ error: 'Pro feature' });
    if (!task || task.length < 5 || !list) {
      return res.status(400).json({ error: 'Missing Task or Task List from Fetch' });
    }
  
    try {
      const prompt = `Today's date is ${new Date().toLocaleDateString()}. The day is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.
      
      Here is the entire task list for context:
      ${JSON.stringify(list)}

      Here is the task that needs to be broken down into three new tasks:
      Task: "${JSON.stringify(task)}"

      As a reminder, your response MUST be in valid JSON format, containing a single object with a "tasks" key that is an array of task objects. 
`;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPromptTaskBreakdownSingle},
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    response_format: { type: "json_object" }
  });
      const raw = response.choices?.[0]?.message?.content;
      const tasks = JSON.parse(raw); // try-catch optional
      console.log('AI single task breakdown result:', tasks);
      
      res.json({ tasks });
    } catch (err) {
      console.error('OpenAI error:', err);
      res.status(500).json({ error: 'AI breakdown failed.' });
    }
  });


  // semantically choose an icon
  app.get('/icon', async (req, res) => {
  const { prompt } = req.query;

  if (!prompt || prompt.length < 2) {
    return res.status(400).json({ error: 'Missing or invalid prompt' });
  }

  try {
    // Step 1: Get embedding for the user's prompt
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: prompt,
    });

    const queryEmbedding = embedRes.data[0].embedding;

    // Step 2: MongoDB vector search
    const results = await Icon.aggregate([
      {
        $vectorSearch: {
          index: 'icon_embedding_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 1  // ← must be inside here!
        }
      },
      {
        $project: {
          _id: 0,
          name: 1,
          description: 1,
          tags: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]);



    if (!results.length) {
      return res.status(404).json({ error: 'No matching icon found' });
    }

    res.json({ icon: results[0] });
  } catch (err) {
    console.error('🔥 Icon search error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve matching icon' });
  }
});


  // send feedback endpoint
  const resend = new Resend(process.env.RESEND_API_KEY);
  app.post("/sendFeedback", verifyToken, async (req, res) => {
  const { type, message } = req.body;
  const user = await User.findById(req.user.id);
  if (!message || !type) {
    return res.status(400).json({ error: "Missing feedback type or message." });
  }

  try {
    await resend.emails.send({
      from: "DewList Feedback <feedback@dewlist.app>",
      to: ["derrick@gallegoslabs.com"],
      subject: `New DewList Feedback: ${type}`,
      html: `
        <div style="font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #F6F8FA; color: #4F5962; border-radius: 16px;">
          <h2 style="color: #4C6CA8; margin-bottom: 12px;">New Feedback Submitted for DewList</h2>

          <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #E0ECFC;">
          <p style="margin: 0 0 8px;"><strong>From:</strong> ${user.email}</p>
          <p style="margin: 0 0 8px;"><strong>Type:</strong> ${type}</p>
            <p style="margin: 0;"><strong>Message:</strong></p>
            <div style="margin-top: 6px; padding-left: 8px; border-left: 3px solid #4C6CA8; color: #333;">
              ${message.replace(/\n/g, "<br/>")}
            </div>
          </div>

          <p style="margin-top: 24px; font-size: 0.85rem; color: #91989E;">
            Submitted via the DewList feedback modal.
          </p>
        </div>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to send feedback email:", err);
    res.status(500).json({ error: "Failed to send feedback." });
  }
});


//referrer endpoints
app.get('/getReferredUsers', async (req, res) => {
  const { referrer } = req.query;
  if (!referrer) {
    return res.status(400).json({ error: 'Missing referrer parameter' });
  }
  // if referrer is derrickgallegos, get all users
  
  if (referrer === 'derrickgallegos') {
    try {
      const users = await User.find().select('email createdAt isPro proExpiresAt -_id lastDatePaid proSubscriptionType lastActiveAt').lean();
      return res.json({ users });
    } catch (err) {
      console.error('Error fetching all users:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // if referrer is anyone else, get just their referred users
  try {
    const users = await User.find({ referrer }).select('email createdAt isPro proExpiresAt -_id lastDatePaid proSubscriptionType').lean();
    res.json({ users });
  } catch (err) {
    console.error('Error fetching referred users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});