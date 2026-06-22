import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/summary
router.get('/summary', requireAdmin, async (req, res) => {
  const [users, courses, enrollments, certificates, training] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.enrollment.count(),
    prisma.certificate.count(),
    prisma.trainingLog.count()
  ]);
  const completed = await prisma.enrollment.count({ where: { completed: true } });
  res.json({ users, courses, enrollments, certificates, training, completionRate: enrollments ? Math.round(completed / enrollments * 100) : 0 });
});

// GET /api/reports/compliance
router.get('/compliance', requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    include: {
      enrollments: { include: { course: true, certificate: true } }
    }
  });
  const mandatoryCourses = await prisma.course.findMany({ where: { status: 'PUBLISHED', tags: { contains: 'mandatory' } } });
  const report = users.map(u => {
    const mandatory = mandatoryCourses.map(c => {
      const enr = u.enrollments.find(e => e.courseId === c.id);
      return { course: c.title, completed: enr?.completed || false, score: enr?.score || null };
    });
    const completed = mandatory.filter(m => m.completed).length;
    return { user: { id: u.id, name: u.name, dept: u.dept, avatar: u.avatar }, mandatory, complianceRate: mandatoryCourses.length ? Math.round(completed / mandatoryCourses.length * 100) : 100 };
  });
  res.json(report);
});

export default router;
