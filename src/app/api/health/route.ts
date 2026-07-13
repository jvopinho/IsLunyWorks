import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Verify Database Connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'UP',
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      services: {
        database: 'DOWN',
      },
      error: error.message || 'Unknown error occurred during database check.'
    }, { status: 500 });
  }
}
