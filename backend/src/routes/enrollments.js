import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/enrollments  (admin: all, user: own)
router.get('/', requireAuth, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
  const enrollments = await prisma.enrollment.findMany({
    where,
    include: { course: { include: { materials: true } }, user: { select: { id: true, name: true, avatar: true, dept: true } }, certificate: true }
  });
  res.json(enrollments);
});

// POST /api/enrollments  (user enrolls in a course)
router.post('/', requireAuth, async (req, res) => {
  const { courseId } = req.body;
  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId } } });
  if (existing) return res.status(400).json({ error: 'Already enrolled' });
  const enrollment = await prisma.enrollment.create({
    data: { userId: req.user.id, courseId },
    include: { course: true }
  });
  res.status(201).json(enrollment);
});

// PUT /api/enrollments/:id  (update progress / score)
router.put('/:id', requireAuth, async (req, res) => {
  const { progress, score, completed } = req.body;
  const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.id } });
  if (!enrollment) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'ADMIN' && enrollment.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const data = {};
  if (progress !== undefined) data.progress = Number(progress);
  if (score !== undefined) data.score = Number(score);
  if (completed !== undefined) {
    data.completed = completed;
    if (completed && !enrollment.completedAt) data.completedAt = new Date();
  }

  const updated = await prisma.enrollment.update({ where: { id: req.params.id }, data, include: { course: true, certificate: true } });

  // Auto-issue certificate if completed and score meets passScore
  if (updated.completed && updated.score != null && !updated.certificate) {
    const course = await prisma.course.findUnique({ where: { id: updated.courseId } });
    if (updated.score >= course.passScore) {
      const date = new Date();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const count = await prisma.certificate.count();
      const certNumber = `HML-${date.getFullYear()}-${mm}${dd}-${String(count + 1).padStart(3, '0')}`;
      await prisma.certificate.create({
        data: { enrollmentId: updated.id, userId: updated.userId, courseId: updated.courseId, certNumber, score: updated.score }
      });
    }
  }

  res.json(updated);
});

// POST /api/enrollments/:id/material/:materialId  (mark material as viewed)
router.post('/:id/material/:materialId', requireAuth, async (req, res) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: req.params.id },
    include: { course: { include: { materials: true } } }
  });
  if (!enrollment) return res.status(404).json({ error: 'Not found' });
  if (enrollment.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const completed = JSON.parse(enrollment.completedMaterials || '[]');
  if (!completed.includes(req.params.materialId)) completed.push(req.params.materialId);

  // Recalculate progress
  const materials = enrollment.course.materials;
  let progress;
  const totalWeight = materials.reduce((s, m) => s + (Number(m.weight) || 0), 0);
  if (totalWeight > 0) {
    // Use weight-based calculation
    const doneWeight = materials
      .filter(m => completed.includes(m.id))
      .reduce((s, m) => s + (Number(m.weight) || 0), 0);
    progress = Math.min(100, Math.round((doneWeight / totalWeight) * 100));
  } else if (materials.length > 0) {
    // Fallback: count-based (each material worth equal share)
    const doneCount = materials.filter(m => completed.includes(m.id)).length;
    progress = Math.round((doneCount / materials.length) * 100);
  } else {
    progress = 0;
  }

  // Auto-complete only when 100% AND (no quiz OR quiz already passed)
  const questions = JSON.parse(enrollment.course.questions || '[]');
  const hasQuiz = questions.length > 0;
  const shouldComplete = progress >= 100 && (!hasQuiz || enrollment.quizPassed);

  const updated = await prisma.enrollment.update({
    where: { id: req.params.id },
    data: {
      completedMaterials: JSON.stringify(completed),
      progress,
      ...(shouldComplete && !enrollment.completed ? { completed: true, completedAt: new Date() } : {})
    }
  });
  res.json({ completedMaterials: completed, progress: updated.progress, completed: updated.completed });
});

// Admin: enroll a user into a course
router.post('/admin', requireAdmin, async (req, res) => {
  const { userId, courseId } = req.body;
  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return res.status(400).json({ error: 'Already enrolled' });
  const enrollment = await prisma.enrollment.create({ data: { userId, courseId }, include: { course: true, user: { select: { id: true, name: true } } } });
  res.status(201).json(enrollment);
});

// POST /api/enrollments/:id/quiz  (submit quiz result)
router.post('/:id/quiz', requireAuth, async (req, res) => {
  try {
    const { correct, total, passed } = req.body;
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: { course: true }
    });
    if (!enrollment) return res.status(404).json({ error: 'Not found' });
    if (enrollment.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const shouldComplete = enrollment.progress >= 100 && passed;
    const updated = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: {
        quizPassed: passed,
        quizScore: Math.round((correct / total) * 100),
        ...(shouldComplete && !enrollment.completed ? { completed: true, completedAt: new Date() } : {})
      }
    });
    res.json({ quizPassed: updated.quizPassed, quizScore: updated.quizScore, completed: updated.completed });
  } catch (e) { next(e); }
});

// Admin: get enrollments for a specific course
router.get('/course/:courseId', requireAdmin, async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: req.params.courseId },
    include: { user: { select: { id: true, name: true, avatar: true, dept: true } } }
  });
  res.json(enrollments);
});

// Admin: unenroll a user
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.enrollment.delete({ where: { id: req.params.id } });
  res.json({ message: 'Unenrolled' });
});

export default router;
