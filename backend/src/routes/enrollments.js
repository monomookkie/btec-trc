import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

function genCertNumber() {
  const date = new Date();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `HML-${date.getFullYear()}-${mm}${dd}-${rand}`;
}

// GET /api/enrollments  (admin: all, user: own)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: { course: { include: { materials: true } }, user: { select: { id: true, name: true, avatar: true, dept: true } }, certificate: true }
    });
    res.json(enrollments);
  } catch (e) { next(e); }
});

// POST /api/enrollments
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId } } });
    if (existing) return res.status(400).json({ error: 'Already enrolled' });
    const enrollment = await prisma.enrollment.create({
      data: { userId: req.user.id, courseId },
      include: { course: true }
    });
    res.status(201).json(enrollment);
  } catch (e) { next(e); }
});

// PUT /api/enrollments/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
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

    if (updated.completed && updated.score != null && !updated.certificate) {
      const course = await prisma.course.findUnique({ where: { id: updated.courseId } });
      if (updated.score >= course.passScore) {
        const certNumber = genCertNumber();
        await prisma.certificate.create({
          data: { enrollmentId: updated.id, userId: updated.userId, courseId: updated.courseId, certNumber, score: updated.score }
        });
      }
    }

    res.json(updated);
  } catch (e) { next(e); }
});

// POST /api/enrollments/:id/material/:materialId
router.post('/:id/material/:materialId', requireAuth, async (req, res, next) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: { course: { include: { materials: true } } }
    });
    if (!enrollment) return res.status(404).json({ error: 'Not found' });
    if (enrollment.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const completed = JSON.parse(enrollment.completedMaterials || '[]');
    if (!completed.includes(req.params.materialId)) completed.push(req.params.materialId);

    const materials = enrollment.course.materials;
    let progress;
    const totalWeight = materials.reduce((s, m) => s + (Number(m.weight) || 0), 0);
    if (totalWeight > 0) {
      const doneWeight = materials.filter(m => completed.includes(m.id)).reduce((s, m) => s + (Number(m.weight) || 0), 0);
      progress = Math.min(100, Math.round((doneWeight / totalWeight) * 100));
    } else if (materials.length > 0) {
      progress = Math.round((materials.filter(m => completed.includes(m.id)).length / materials.length) * 100);
    } else {
      progress = 0;
    }

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
  } catch (e) { next(e); }
});

// POST /api/enrollments/admin
router.post('/admin', requireAdmin, async (req, res, next) => {
  try {
    const { userId, courseId } = req.body;
    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (existing) return res.status(400).json({ error: 'Already enrolled' });
    const enrollment = await prisma.enrollment.create({ data: { userId, courseId }, include: { course: true, user: { select: { id: true, name: true } } } });
    res.status(201).json(enrollment);
  } catch (e) { next(e); }
});

// POST /api/enrollments/:id/quiz
router.post('/:id/quiz', requireAuth, async (req, res, next) => {
  try {
    const { correct, total, passed } = req.body;
    const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.id }, include: { course: true } });
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

// GET /api/enrollments/course/:courseId
router.get('/course/:courseId', requireAdmin, async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: req.params.courseId },
      include: { user: { select: { id: true, name: true, avatar: true, dept: true } } }
    });
    res.json(enrollments);
  } catch (e) { next(e); }
});

// DELETE /api/enrollments/:id
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.enrollment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Unenrolled' });
  } catch (e) { next(e); }
});

export default router;
