import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/courses
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: { materials: true, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(courses.map(c => ({
      ...c,
      tags: JSON.parse(c.tags || '[]'),
      questions: JSON.parse(c.questions || '[]')
    })));
  } catch (e) { next(e); }
});

// GET /api/courses/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { materials: true }
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ ...course, tags: JSON.parse(course.tags || '[]'), questions: JSON.parse(course.questions || '[]') });
  } catch (e) { next(e); }
});

// POST /api/courses
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { title, category, description, status, duration, passScore, tags, materials, questions, quizRequired } = req.body;
    const course = await prisma.course.create({
      data: {
        title, category, description,
        status: status?.toUpperCase() || 'DRAFT',
        duration: Number(duration),
        passScore: Number(passScore) || 80,
        tags: JSON.stringify(tags || []),
        questions: JSON.stringify(questions || []),
        quizRequired: Number(quizRequired) || 0,
        materials: {
          create: (materials || []).map(({ type, title: mTitle, url, dataUrl, weight }) => ({
            type,
            title: mTitle,
            url: url || null,
            dataUrl: dataUrl || null,
            weight: Number(weight) || 0
          }))
        }
      },
      include: { materials: true }
    });
    res.status(201).json({ ...course, tags: JSON.parse(course.tags), questions: JSON.parse(course.questions) });
  } catch (e) { next(e); }
});

// PUT /api/courses/:id
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { title, category, description, status, duration, passScore, tags, materials, questions, quizRequired } = req.body;
    await prisma.material.deleteMany({ where: { courseId: req.params.id } });
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        title, category, description,
        status: status?.toUpperCase(),
        duration: Number(duration),
        passScore: Number(passScore),
        tags: JSON.stringify(tags || []),
        questions: JSON.stringify(questions || []),
        quizRequired: Number(quizRequired) || 0,
        materials: {
          create: (materials || []).map(({ type, title: mTitle, url, dataUrl, weight }) => ({
            type,
            title: mTitle,
            url: url || null,
            dataUrl: dataUrl || null,
            weight: Number(weight) || 0
          }))
        }
      },
      include: { materials: true }
    });
    res.json({ ...course, tags: JSON.parse(course.tags), questions: JSON.parse(course.questions) });
  } catch (e) { next(e); }
});

// DELETE /api/courses/:id
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
});

export default router;
