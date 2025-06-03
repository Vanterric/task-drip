require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const TaskList = require('./models/TaskList');
const Task = require('./models/Task');
const app = express();
const {Resend} = require('resend');
const { OpenAI } = require('openai');
app.use(cors({
  origin: ['https://dewlist.app', 'http://localhost:5173'], // add your live and dev origins
}));

const { sendMagicLinkEmail } = require('./utils/sendMagicLink');


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

app.listen(process.env.PORT || 3001, () =>
  console.log("Backend running on port", process.env.PORT || 3001)
);

//Stripe Payment Fulfillment
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const email = intent.receipt_email || intent.billing_details.email;

    // ✅ Update your DB (MongoDB, etc)
    await User.updateOne(
      { email },
      {
        isPro: true,
        isLifeTimePro: intent.metadata?.plan === 'lifetime',
        proExpiresAt: intent.metadata?.plan === 'lifetime' ? null : Date.now() + 1000 * 60 * 60 * 24 * 30 // or Stripe's subscription end
      }
    );
  }

  res.json({ received: true });
});

app.use(express.json());
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
  
  app.post('/auth/request-link', async (req, res) => {
    const { email } = req.body;
    const lowerCaseEmail = email.toLowerCase().trim();
    try {
      let user = await User.findOne({ email: lowerCaseEmail });
      if (!user) {
      const userCount = await User.countDocuments();
      const isFirstHundredUser = userCount < 100;

      user = await User.create({
        email: lowerCaseEmail,
        ...(isFirstHundredUser && {
          isPro: true,
          isFirstHundredUser: true,
          proExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        })
      });
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

  // user routes
  app.get('/user', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    console.log("User data:", user);
    res.json({ email: user.email, isPro: user.isPro, createdAt: user.createdAt, isFirstTimeUser: user.isFirstTimeUser, isFirstHundredUser: user.isFirstHundredUser, isLifeTimePro: user.isLifeTimePro, proExpiresAt: user.proExpiresAt });
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
    await user.save();
    res.json({ success: true });
  });

  
  // tasklist routes
  app.get('/tasklists', verifyToken, async (req, res) => {
    const lists = await TaskList.find({ userId: req.user.id });
    res.json(lists);
  });

  app.post('/tasklists', verifyToken, async (req, res) => {
    const count = await TaskList.countDocuments({ userId: req.user.id });
    const user = await User.findById(req.user.id);
  
    if (!user.isPro && count >= 3) return res.status(403).json({ error: 'Free tier limit reached' });

    const { name, icon = "clipboard-check" } = req.body;
  
    const list = await TaskList.create({ userId: req.user.id, name, icon });
    res.json(list);
  });

  app.delete('/tasklists/:id', verifyToken, async (req, res) => {
    await TaskList.deleteOne({ _id: req.params.id, userId: req.user.id });
    await Task.deleteMany({ tasklistId: req.params.id });
    res.json({ success: true });
  });
  
  app.put('/tasklists/:id', verifyToken, async (req, res) => {
    const { name, icon } = req.body;
  
    if (name && name.trim() === "") {
      return res.status(400).json({ error: "Name cannot be empty" });
    }
  
    try {
      const updateFields = {};
        if (name) updateFields.name = name;
        if (icon) updateFields.icon = icon;

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
    const tasks = await Task.find({ tasklistId });
    res.json(tasks);
  });
  
  
  app.post('/tasks', verifyToken, async (req, res) => {
    const tasklistId = req.body.tasklistId;
    const user = await User.findById(req.user.id);
    const taskCount = await Task.countDocuments({ tasklistId });
  
    if (!user.isPro && taskCount >= 5) return res.status(403).json({ error: 'Free tier limit' });
  
    const task = await Task.create({ tasklistId, content: req.body.content });
    res.json(task);
  });

  app.put('/tasks/:id', verifyToken, async (req, res) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  });
  
  app.delete('/tasks/:id', verifyToken, async (req, res) => {
    await Task.deleteOne({ _id: req.params.id });
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
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  app.post('/create-payment-intent', async (req, res) => {
    const { email, plan } = req.body;
  
    const amountMap = {
      monthly: 500,
      yearly: 3000,
      lifetime: 10000,
    };
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountMap[plan],
      currency: 'usd',
      receipt_email: email,
      metadata: { plan },
    });
  
    res.json({ clientSecret: paymentIntent.client_secret });
  });

  
  // AI endpoints
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  app.post('/ai/breakdown', verifyToken, async (req, res) => {
    console.log('AI breakdown request:', req.body);
    const { goal } = req.body;
  
    if (!goal || goal.length < 5) {
      return res.status(400).json({ error: 'Invalid goal' });
    }
  
    try {
      const prompt = `
You're an intelligent productivity assistant.

Break down the following goal into 5–10 clear, actionable tasks. Then, suggest a short, descriptive title for this task list.

Respond with a JSON object in the following format:

{
  "title": "Short, helpful title",
  "tasks": [
    { "content": "First task" },
    { "content": "Second task" }
    ...
  ]
}

Goal: "${goal}"
`;

  console.log('sending prompt to OpenAI:');
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful productivity assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
  });
  
  console.log('response recieved from OpenAI:', response);
      const raw = response.choices?.[0]?.message?.content;
      const taskList = JSON.parse(raw); // try-catch optional
      console.log('AI tasks:', taskList);
      res.json({ taskList });
    } catch (err) {
      console.error('OpenAI error:', err);
      res.status(500).json({ error: 'AI breakdown failed.' });
    }
  });


  // send feedback endpoint
  const resend = new Resend(process.env.RESEND_API_KEY);
  app.post("/sendFeedback", verifyToken, async (req, res) => {
  const { type, message } = req.body;

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