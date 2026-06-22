import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = Router();
const ALLOWED_DOMAIN = 'redcross.or.th';

// OTP store: { [email]: { otp, expiresAt } }
const otpStore = new Map();

function makeToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Incorrect email or password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect email or password' });
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (e) { next(e); }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, dept } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ error: 'All required fields missing' });
    if (!email.toLowerCase().endsWith('@' + ALLOWED_DOMAIN)) return res.status(400).json({ error: `Only @${ALLOWED_DOMAIN} emails allowed` });
    if (password.length < 6) return res.status(400).json({ error: 'Password min 6 characters' });
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const avatar = name.trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), password: hashed, role: 'USER', dept: dept?.trim() || 'User', avatar }
    });
    res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (e) { next(e); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });
    if (!user) return res.status(404).json({ error: 'Email not found' });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`[OTP] ${email}: ${otp}`);
    // NOTE: In production replace console.log with email service (SendGrid/Resend)
    res.json({ message: 'OTP sent' });
  } catch (e) { next(e); }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email?.toLowerCase());
    if (!record) return res.status(400).json({ error: 'No OTP requested for this email' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP expired' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    // Mark as verified (keep in store but flag it)
    otpStore.set(email.toLowerCase(), { ...record, verified: true });
    res.json({ message: 'OTP verified' });
  } catch (e) { next(e); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Invalid request' });
    const record = otpStore.get(email.toLowerCase());
    if (!record || !record.verified || Date.now() > record.expiresAt) {
      return res.status(403).json({ error: 'OTP not verified or expired' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email: email.toLowerCase() }, data: { password: hashed } });
    otpStore.delete(email.toLowerCase());
    res.json({ message: 'Password reset successfully' });
  } catch (e) { next(e); }
});

export default router;
