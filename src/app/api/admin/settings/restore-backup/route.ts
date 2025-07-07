/**
 * Quick Backup Restore API
 * POST /api/admin/settings/restore-backup
 * 
 * Quickly restores your system backup with SMTP password configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-helpers'
import { PrismaClient } from '@prisma/client'
import { Logger } from '@/lib/logger'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const logger = new Logger('BackupRestore')

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    const currentUser = authResult.user!

    // Check if user has permission to restore backup
    const allowedRoles = ['Super Admin']
    if (!allowedRoles.includes(currentUser.role?.name || '')) {
      return NextResponse.json({ error: 'Insufficient permissions to restore backup' }, { status: 403 })
    }

    logger.info('Backup restore requested', { userId: currentUser.id })

    // Load the backup file from the project directory
    const backupFilePath = path.join(process.cwd(), 'system-backup-2025-07-06-complete.json')
    
    if (!fs.existsSync(backupFilePath)) {
      return NextResponse.json({ 
        error: 'Backup file not found',
        message: 'The system backup file is not available. Please ensure system-backup-2025-07-06-complete.json exists in the project root.'
      }, { status: 404 })
    }

    // Read and parse the backup file
    const backupContent = fs.readFileSync(backupFilePath, 'utf8')
    const backupData = JSON.parse(backupContent)

    if (!backupData.data || !backupData.data.settings) {
      return NextResponse.json({ 
        error: 'Invalid backup file',
        message: 'The backup file does not contain valid settings data.'
      }, { status: 400 })
    }

    let importedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []
    const importResults: Array<{
      category: string
      key: string
      name: string
      action: 'imported' | 'updated' | 'skipped'
      reason?: string
    }> = []

    // Import all settings from backup
    for (const setting of backupData.data.settings) {
      try {
        // Check if setting already exists
        const existingSetting = await prisma.setting.findFirst({
          where: {
            category: setting.category,
            key: setting.key
          }
        })

        if (existingSetting) {
          // Update existing setting
          await prisma.setting.update({
            where: { id: existingSetting.id },
            data: {
              value: setting.value,
              name: setting.name,
              description: setting.description || existingSetting.description,
              type: setting.type,
              options: setting.options || existingSetting.options,
              updatedAt: new Date()
            }
          })
          updatedCount++
          importResults.push({
            category: setting.category,
            key: setting.key,
            name: setting.name,
            action: 'updated',
            reason: 'Setting existed and was updated with backup values'
          })
        } else {
          // Create new setting
          await prisma.setting.create({
            data: {
              category: setting.category,
              key: setting.key,
              value: setting.value,
              name: setting.name,
              description: setting.description || '',
              type: setting.type,
              options: setting.options,
              isSystem: setting.isSystem || false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
          importedCount++
          importResults.push({
            category: setting.category,
            key: setting.key,
            name: setting.name,
            action: 'imported',
            reason: 'New setting created from backup'
          })
        }
      } catch (error) {
        const errorMsg = `Failed to restore ${setting.category}.${setting.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        logger.error(errorMsg, error)
        importResults.push({
          category: setting.category,
          key: setting.key,
          name: setting.name,
          action: 'skipped',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
        skippedCount++
      }
    }

    // Verify email configuration after restore
    const emailSettings = await prisma.setting.findMany({
      where: { category: 'email' }
    })

    const emailSettingsMap = emailSettings.reduce((acc, setting) => {
      try {
        acc[setting.key] = JSON.parse(setting.value)
      } catch {
        acc[setting.key] = setting.value
      }
      return acc
    }, {} as Record<string, any>)

    const isEmailConfigured = !!(emailSettingsMap.smtpHost && emailSettingsMap.smtpUser && emailSettingsMap.smtpPass)

    logger.info('Backup restore completed', {
      userId: currentUser.id,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errors.length,
      emailConfigured: isEmailConfigured
    })

    return NextResponse.json({
      success: true,
      message: 'System backup restored successfully',
      summary: {
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: importedCount + updatedCount + skippedCount,
        errors: errors.length
      },
      email_status: {
        configured: isEmailConfigured,
        smtp_host: emailSettingsMap.smtpHost || null,
        smtp_user: emailSettingsMap.smtpUser || null,
        from_name: emailSettingsMap.emailFromName || null,
        has_password: !!emailSettingsMap.smtpPass
      },
      backup_info: backupData.data.system_info,
      results: importResults.slice(0, 10), // Show first 10 results
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Show first 5 errors
      restoredAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Backup restore failed', error)
    return NextResponse.json(
      { 
        error: 'Failed to restore backup',
        message: error instanceof Error ? error.message : 'Unknown error occurred during backup restore'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to restore backup.' },
    { status: 405 }
  )
}
