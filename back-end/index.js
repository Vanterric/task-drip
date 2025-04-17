require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors());
app.use(express.json());
const { sendMagicLinkEmail } = require('./utils/sendMagicLink');


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

app.listen(process.env.PORT || 3001, () =>
  console.log("Backend running on port", process.env.PORT || 3001)
);




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

  
  app.post('/auth/request-link', async (req, res) => {
    const { email } = req.body;
  
    try {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });
  
      let user = await User.findOne({ email });
      if (!user) user = await User.create({ email });
  
      user.magicToken = token;
      await user.save();
  
      const url = `https://taskdrip.dev/unlock?token=${token}`;
  
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
  
      if (!user || user.magicToken !== token) return res.status(401).json({ error: 'Invalid token' });
  
      res.json({ token, user: { email: user.email, isPro: user.isPro } });
    } catch {
      res.status(400).json({ error: 'Token expired or invalid' });
    }
  });
  
  // user routes
  app.get('/user', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ email: user.email, isPro: user.isPro, createdAt: user.createdAt });
  });

  
  app.post('/user/upgrade', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id);
    user.isPro = true;
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
  
    const list = await TaskList.create({ userId: req.user.id, name: req.body.name });
    res.json(list);
  });

  app.delete('/tasklists/:id', verifyToken, async (req, res) => {
    await TaskList.deleteOne({ _id: req.params.id, userId: req.user.id });
    await Task.deleteMany({ tasklistId: req.params.id });
    res.json({ success: true });
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
  
  