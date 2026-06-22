import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const list = await prisma.announcement.findMany({ orderBy: { date: 'desc' } });
    res.json(list);
  } catch (e) { next(e); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { title, content, type, fileName, fileData, link } = req.body;
    const item = await prisma.announcement.create({ data: { title, content, type: type || 'info', fileName, fileData, link: link || null } });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { title, content, type, fileName, fileData, link } = req.body;
    const item = await prisma.announcement.update({ where: { id: req.params.id }, data: { title, content, type, fileName, fileData, link: link || null } });
    res.json(item);
  } catch (e) { next(e); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
});

export default router;
