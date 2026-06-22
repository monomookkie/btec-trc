import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/training
router.get('/', requireAuth, async (req, res) => {
  const logs = await prisma.trainingLog.findMany({
    include: { attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    orderBy: { date: 'desc' }
  });
  res.json(logs);
});

// GET /api/training/:id
router.get('/:id', requireAuth, async (req, res) => {
  const log = await prisma.trainingLog.findUnique({
    where: { id: req.params.id },
    include: { attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } } }
  });
  if (!log) return res.status(404).json({ error: 'Not found' });
  res.json(log);
});

// POST /api/training
router.post('/', requireAdmin, async (req, res) => {
  const { title, date, trainer, location, duration, type, topics, doc, attendeeIds } = req.body;
  const log = await prisma.trainingLog.create({
    data: {
      title, date: new Date(date), trainer, location,
      duration: Number(duration), type, topics, doc: doc || null,
      attendees: { create: (attendeeIds || []).map(userId => ({ userId })) }
    },
    include: { attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } } }
  });
  res.status(201).json(log);
});

// PUT /api/training/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { title, date, trainer, location, duration, type, topics, doc, attendeeIds } = req.body;
  await prisma.trainingAttendee.deleteMany({ where: { trainingId: req.params.id } });
  const log = await prisma.trainingLog.update({
    where: { id: req.params.id },
    data: {
      title, date: new Date(date), trainer, location,
      duration: Number(duration), type, topics, doc: doc || null,
      attendees: { create: (attendeeIds || []).map(userId => ({ userId })) }
    },
    include: { attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } } }
  });
  res.json(log);
});

// DELETE /api/training/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.trainingLog.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
