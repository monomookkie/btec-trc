import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/certificates
router.get('/', requireAuth, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
  const certs = await prisma.certificate.findMany({
    where,
    include: { user: { select: { id: true, name: true, avatar: true, dept: true } }, course: { select: { id: true, title: true, category: true } } },
    orderBy: { issuedAt: 'desc' }
  });
  res.json(certs);
});

// GET /api/certificates/templates
router.get('/templates', requireAuth, async (req, res) => {
  const templates = await prisma.certTemplate.findMany();
  res.json(templates);
});

// POST /api/certificates/templates
router.post('/templates', requireAdmin, async (req, res) => {
  const { name, orgName, orgSubtitle, signatory, signatoryTitle, footerText, primaryColor, accentColor, logoText, isDefault } = req.body;
  if (isDefault) await prisma.certTemplate.updateMany({ data: { isDefault: false } });
  const tpl = await prisma.certTemplate.create({ data: { name, orgName, orgSubtitle, signatory, signatoryTitle, footerText, primaryColor, accentColor, logoText, isDefault: !!isDefault } });
  res.status(201).json(tpl);
});

// PUT /api/certificates/templates/:id
router.put('/templates/:id', requireAdmin, async (req, res) => {
  const { isDefault, ...data } = req.body;
  if (isDefault) await prisma.certTemplate.updateMany({ data: { isDefault: false } });
  const tpl = await prisma.certTemplate.update({ where: { id: req.params.id }, data: { ...data, isDefault: !!isDefault } });
  res.json(tpl);
});

// POST /api/certificates/issue  (admin manually issue)
router.post('/issue', requireAdmin, async (req, res) => {
  const { enrollmentId, score } = req.body;
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { certificate: true } });
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  if (enrollment.certificate) return res.status(400).json({ error: 'Certificate already issued' });
  const date = new Date();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const count = await prisma.certificate.count();
  const certNumber = `HML-${date.getFullYear()}-${mm}${dd}-${String(count + 1).padStart(3, '0')}`;
  const cert = await prisma.certificate.create({
    data: { enrollmentId, userId: enrollment.userId, courseId: enrollment.courseId, certNumber, score: Number(score) },
    include: { user: { select: { id: true, name: true } }, course: { select: { id: true, title: true } } }
  });
  res.status(201).json(cert);
});

// DELETE /api/certificates/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.certificate.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

// GET /api/certificates/external
router.get('/external', requireAuth, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
  const certs = await prisma.externalCert.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  res.json(certs);
});

// GET /api/certificates/external/all  (admin — with user info)
router.get('/external/all', requireAdmin, async (req, res) => {
  const certs = await prisma.externalCert.findMany({
    orderBy: { createdAt: 'desc' }
  });
  const users = await prisma.user.findMany({ select: { id: true, name: true, avatar: true, dept: true } });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  res.json(certs.map(c => ({ ...c, user: userMap[c.userId] || null })));
});

// POST /api/certificates/external
router.post('/external', requireAuth, async (req, res) => {
  const { title, issuer, issuedAt, expiresAt, fileData, userId } = req.body;
  if (!title?.trim() || !issuer?.trim() || !issuedAt) return res.status(400).json({ error: 'Title, issuer and issue date are required' });
  const targetUserId = (req.user.role === 'ADMIN' && userId) ? userId : req.user.id;
  const cert = await prisma.externalCert.create({
    data: { userId: targetUserId, title: title.trim(), issuer: issuer.trim(), issuedAt: new Date(issuedAt), expiresAt: expiresAt ? new Date(expiresAt) : null, fileData: fileData || null }
  });
  res.status(201).json(cert);
});

// DELETE /api/certificates/external/:id
router.delete('/external/:id', requireAuth, async (req, res) => {
  const cert = await prisma.externalCert.findUnique({ where: { id: req.params.id } });
  if (!cert) return res.status(404).json({ error: 'Not found' });
  if (cert.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  await prisma.externalCert.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
