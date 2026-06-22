import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// GET /api/users
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, dept: true, avatar: true, createdAt: true,
        _count: { select: { enrollments: true, certificates: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(users);
  } catch (e) { next(e); }
});

// GET /api/users/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(safeUser(user));
  } catch (e) { next(e); }
});

// PUT /api/users/me
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, dept, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const data = {};
    if (name?.trim()) {
      data.name = name.trim();
      data.avatar = name.trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
    }
    if (dept?.trim()) data.dept = dept.trim();
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ error: 'Current password incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'Password min 6 characters' });
      data.password = await bcrypt.hash(newPassword, 10);
    }
    const updated = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json(safeUser(updated));
  } catch (e) { next(e); }
});

// POST /api/users  (admin create)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, email, password, role, dept } = req.body;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const avatar = name.trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
    const hashed = await bcrypt.hash(password || 'pass123', 10);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), password: hashed, role: role?.toUpperCase() || 'USER', dept: dept?.trim() || 'User', avatar }
    });
    res.status(201).json(safeUser(user));
  } catch (e) { next(e); }
});

// PUT /api/users/:id  (admin update)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, email, role, dept, password } = req.body;
    const data = {};
    if (name?.trim()) { data.name = name.trim(); data.avatar = name.trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
    if (email) data.email = email.toLowerCase();
    if (role) data.role = role.toUpperCase();
    if (dept) data.dept = dept;
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password min 6 characters' });
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(safeUser(user));
  } catch (e) { next(e); }
});

// DELETE /api/users/:id  (admin delete)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
});

export default router;
