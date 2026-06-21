import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/courses
router.get('/', requireAuth, async (req, res) => {
  const courses = await prisma.course.findMany({
    include: { materials: true, _count: { select: { enrollments: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(courses.map(c => ({ ...c, tags: JSON.parse(c.tags || '[]'), questions: JSON.parse(c.questions || '[]') })));
});

// GET /api/courses/:id
router.get('/:id', requireAuth, async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: { materials: true }
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json({ ...course, tags: JSON.parse(course.tags || '[]'), questions: JSON.parse(course.questions || '[]') });
});

// POST /api/courses
router.post('/', requireAdmin, async (req, res) => {
  const { title, category, description, status, duration, passScore, tags, materials, questions, quizRequired } = req.body;
  const course = await prisma.course.create({
    data: {
      title, category, description,
      status: status?.toUpperCase() || 'DRAFT',
      duration: Number(duration), passScore: Number(passScore) || 80,
      tags: JSON.stringify(tags || []),
      questions: JSON.stringify(questions || []),
      quizRequired: Number(quizRequired) || 0,
      materials: { create: (materials || []).map(({ type, title, url, weight }) => ({ type, title, url: url || null, weight: Number(weight) || 0 })) }
    },
    include: { materials: true }
  });
  res.status(201).json({ ...course, tags: JSON.parse(course.tags), questions: JSON.parse(course.questions) });
});

// PUT /api/courses/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { title, category, description, status, duration, passScore, tags, materials, questions, quizRequired } = req.body;
  await prisma.material.deleteMany({ where: { courseId: req.params.id } });
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: {
      title, category, description,
      status: status?.toUpperCase(),
      duration: Number(duration), passScore: Number(passScore),
      tags: JSON.stringify(tags || []),
      questions: JSON.stringify(questions || []),
      quizRequired: Number(quizRequired) || 0,
      materials: { create: (materials || []).map(({ type, title, url, dataUrl, weight }) => ({ type, title, url: url || null, dataUrl: dataUrl || null, weight: Number(weight) || 0 })) }
    },
    include: { materials: true }
  });
  res.json({ ...course, tags: JSON.parse(course.tags), questions: JSON.parse(course.questions) });
});

// DELETE /api/courses/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.course.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
