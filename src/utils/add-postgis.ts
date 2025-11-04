import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enablePostGIS() {
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;')
    console.log('PostGIS extension enabled')
  } catch (error) {
    console.error('Failed to enable PostGIS:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enablePostGIS()