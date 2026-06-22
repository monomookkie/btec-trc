import { PrismaClient } from '@prisma/client';

const prisma = globalThis._prisma ?? new PrismaClient();
globalThis._prisma = prisma;

export default prisma;
