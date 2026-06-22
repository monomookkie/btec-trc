import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Users
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('pass123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hemolabs.org' },
    update: {},
    create: { name: 'Dr. Sarah Chen', email: 'admin@hemolabs.org', password: adminPass, role: 'ADMIN', dept: 'Laboratory Management', avatar: 'SC' }
  });

  const james = await prisma.user.upsert({
    where: { email: 'james@hemolabs.org' },
    update: {},
    create: { name: 'James Ramos', email: 'james@hemolabs.org', password: userPass, role: 'USER', dept: 'Blood Screening', avatar: 'JR' }
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya@hemolabs.org' },
    update: {},
    create: { name: 'Priya Nair', email: 'priya@hemolabs.org', password: userPass, role: 'USER', dept: 'Quality Assurance', avatar: 'PN' }
  });

  const marcus = await prisma.user.upsert({
    where: { email: 'marcus@hemolabs.org' },
    update: {},
    create: { name: 'Marcus Webb', email: 'marcus@hemolabs.org', password: userPass, role: 'USER', dept: 'Blood Screening', avatar: 'MW' }
  });

  // Courses
  const c1 = await prisma.course.create({
    data: {
      title: 'Blood Typing & Cross-Matching Fundamentals', category: 'Core Screening',
      description: 'ABO/Rh typing, compatibility testing, gel card technique, and interpretation of results in a clinical setting.',
      status: 'PUBLISHED', duration: 90, tags: JSON.stringify(['mandatory', 'core']), passScore: 80,
      createdAt: new Date('2025-01-10'),
      materials: {
        create: [
          { type: 'pdf', title: 'ABO Blood Group System Guide.pdf', url: '#' },
          { type: 'video', title: 'Gel Card Technique Demo', url: 'https://youtube.com' },
          { type: 'link', title: 'AABB Standards Reference', url: 'https://aabb.org' }
        ]
      }
    }
  });

  const c2 = await prisma.course.create({
    data: {
      title: 'Infectious Disease Marker Screening (NAT/ELISA)', category: 'Serology',
      description: 'HIV, HCV, HBV, Syphilis NAT and ELISA techniques, window period considerations, and result interpretation.',
      status: 'PUBLISHED', duration: 120, tags: JSON.stringify(['mandatory']), passScore: 85,
      createdAt: new Date('2025-01-15'),
      materials: {
        create: [
          { type: 'ppt', title: 'NAT Technology Overview.pptx', url: '#' },
          { type: 'link', title: 'WHO Screening Guidelines', url: 'https://who.int' },
          { type: 'word', title: 'SOP-ELISA-v4.docx', url: '#' }
        ]
      }
    }
  });

  const c3 = await prisma.course.create({
    data: {
      title: 'Cold Chain & Component Storage Protocols', category: 'Storage',
      description: 'Temperature monitoring, component labelling, quarantine procedures, and storage failure response.',
      status: 'PUBLISHED', duration: 60, tags: JSON.stringify(['sop']), passScore: 75,
      createdAt: new Date('2025-02-01'),
      materials: {
        create: [
          { type: 'word', title: 'Storage SOP v3.2.docx', url: '#' },
          { type: 'pdf', title: 'Temperature Log Template.pdf', url: '#' }
        ]
      }
    }
  });

  const c4 = await prisma.course.create({
    data: {
      title: 'Donor Eligibility & Deferral Guidelines', category: 'Donor Management',
      description: 'Pre-donation screening, eligibility criteria, temporary and permanent deferral management.',
      status: 'DRAFT', duration: 75, tags: JSON.stringify(['donor-facing']), passScore: 80,
      createdAt: new Date('2025-02-10')
    }
  });

  const c5 = await prisma.course.create({
    data: {
      title: 'Laboratory Biosafety Level 2 Procedures', category: 'Safety',
      description: 'PPE requirements, spill decontamination, waste disposal, and emergency response for BSL-2 environments.',
      status: 'PUBLISHED', duration: 45, tags: JSON.stringify(['mandatory', 'safety']), passScore: 90,
      createdAt: new Date('2025-02-20'),
      materials: { create: [{ type: 'pdf', title: 'BSL2 Safety Manual.pdf', url: '#' }] }
    }
  });

  // Enrollments
  const e1 = await prisma.enrollment.create({ data: { userId: james.id, courseId: c1.id, progress: 100, score: 92, completed: true, startedAt: new Date('2025-02-10'), completedAt: new Date('2025-02-14') } });
  const e2 = await prisma.enrollment.create({ data: { userId: james.id, courseId: c2.id, progress: 65, completed: false, startedAt: new Date('2025-03-01') } });
  const e3 = await prisma.enrollment.create({ data: { userId: james.id, courseId: c5.id, progress: 40, completed: false, startedAt: new Date('2025-03-08') } });
  const e4 = await prisma.enrollment.create({ data: { userId: priya.id, courseId: c1.id, progress: 100, score: 88, completed: true, startedAt: new Date('2025-02-15'), completedAt: new Date('2025-02-20') } });
  const e5 = await prisma.enrollment.create({ data: { userId: priya.id, courseId: c2.id, progress: 100, score: 91, completed: true, startedAt: new Date('2025-03-01'), completedAt: new Date('2025-03-05') } });
  const e6 = await prisma.enrollment.create({ data: { userId: priya.id, courseId: c3.id, progress: 100, score: 84, completed: true, startedAt: new Date('2025-03-08'), completedAt: new Date('2025-03-10') } });
  const e7 = await prisma.enrollment.create({ data: { userId: marcus.id, courseId: c1.id, progress: 30, completed: false, startedAt: new Date('2025-03-10') } });
  const e8 = await prisma.enrollment.create({ data: { userId: marcus.id, courseId: c5.id, progress: 100, score: 95, completed: true, startedAt: new Date('2025-03-12'), completedAt: new Date('2025-03-15') } });

  // Certificates
  const pad = (n) => String(n).padStart(3, '0');
  await prisma.certificate.createMany({
    data: [
      { enrollmentId: e1.id, userId: james.id, courseId: c1.id, issuedAt: new Date('2025-02-14'), certNumber: 'BTEC-2025-0214-001', score: 92 },
      { enrollmentId: e4.id, userId: priya.id, courseId: c1.id, issuedAt: new Date('2025-02-20'), certNumber: 'BTEC-2025-0220-002', score: 88 },
      { enrollmentId: e5.id, userId: priya.id, courseId: c2.id, issuedAt: new Date('2025-03-05'), certNumber: 'BTEC-2025-0305-003', score: 91 },
      { enrollmentId: e6.id, userId: priya.id, courseId: c3.id, issuedAt: new Date('2025-03-10'), certNumber: 'BTEC-2025-0310-004', score: 84 },
      { enrollmentId: e8.id, userId: marcus.id, courseId: c5.id, issuedAt: new Date('2025-03-15'), certNumber: 'BTEC-2025-0315-005', score: 95 }
    ]
  });

  // Training Logs
  const t1 = await prisma.trainingLog.create({
    data: {
      title: 'Annual BioSafety Refresher', date: new Date('2025-01-25'), trainer: 'Dr. Lena Kovacs',
      location: 'Training Lab B', duration: 180, type: 'classroom',
      topics: 'Level 2 biosafety precautions, PPE donning/doffing, spill decontamination procedure, waste segregation.', doc: 'BTEC-TR-2025-001',
      attendees: { create: [{ userId: james.id }, { userId: priya.id }, { userId: marcus.id }] }
    }
  });

  const t2 = await prisma.trainingLog.create({
    data: {
      title: 'NAT Instrument Calibration Workshop', date: new Date('2025-02-05'), trainer: 'Vendor Representative (Roche)',
      location: 'Main Screening Lab', duration: 240, type: 'practical',
      topics: 'cobas 6800 daily calibration, preventive maintenance schedule, troubleshooting common error codes.', doc: 'BTEC-TR-2025-002',
      attendees: { create: [{ userId: james.id }, { userId: priya.id }] }
    }
  });

  const t3 = await prisma.trainingLog.create({
    data: {
      title: 'New Donor Deferral Policy Briefing', date: new Date('2025-03-01'), trainer: 'Dr. Sarah Chen',
      location: 'Conference Room A', duration: 60, type: 'classroom',
      topics: 'Updated WHO/AABB deferral criteria for 2025, documentation requirements, staff Q&A.', doc: 'BTEC-TR-2025-003',
      attendees: { create: [{ userId: james.id }, { userId: priya.id }, { userId: marcus.id }] }
    }
  });

  // Announcements
  await prisma.announcement.createMany({
    data: [
      { title: 'Annual Biosafety Recertification Due', content: 'All staff must complete the BSL-2 Biosafety refresher course by the end of this quarter.', type: 'important', date: new Date('2025-03-01') },
      { title: 'Lab Closed for Equipment Calibration', content: 'The main screening lab will be closed on Saturday for the annual cobas 6800 calibration.', type: 'event', date: new Date('2025-03-10') }
    ]
  });

  // Certificate Template
  await prisma.certTemplate.create({
    data: {
      name: 'Medical Blue (Default)', orgName: 'HemoLabs Diagnostic Centre',
      orgSubtitle: 'Accredited Blood Donation Screening Laboratory', signatory: 'Dr. Sarah Chen',
      signatoryTitle: 'Laboratory Director & Chief Pathologist',
      footerText: 'This certificate is issued in accordance with ISO 15189:2022 and AABB Accreditation Standards.',
      primaryColor: '#1A56DB', accentColor: '#C0392B', logoText: 'BTEC', isDefault: true
    }
  });

  console.log('Seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
