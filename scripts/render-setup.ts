#!/usr/bin/env tsx

/**
 * Render.com Post-Deployment Setup Script
 * 
 * This script runs after the build to set up the admin user and system settings
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Render.com post-deployment setup...')

  try {
    // Test database connection
    console.log('📊 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Create default roles
    console.log('👥 Setting up default roles...')
    
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {},
      create: {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        isSystem: true,
      },
    })

    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Administrative access with most permissions',
        isSystem: true,
      },
    })

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Standard user access',
        isSystem: true,
      },
    })

    console.log('✅ Default roles created/updated')

    // Create super admin user
    console.log('👤 Setting up super admin user...')
    
    const superAdminEmail = 'admin@mopgomglobal.com'
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!'
    
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: superAdminEmail },
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12)
      
      await prisma.admin.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          name: 'Super Administrator',
          roleId: superAdminRole.id,
          isActive: true,
        },
      })
      
      console.log('✅ Super admin user created')
      console.log(`📧 Email: ${superAdminEmail}`)
      console.log(`🔑 Password: ${superAdminPassword}`)
    } else {
      console.log('✅ Super admin user already exists')
    }

    // Create default system settings
    console.log('⚙️ Setting up default system settings...')
    
    const defaultSettings = [
      {
        category: 'branding',
        key: 'systemName',
        value: JSON.stringify('MopgomYouth Registration System'),
        type: 'text',
        name: 'System Name',
        description: 'The name of the system displayed in the UI',
        isSystem: true,
      },
      {
        category: 'branding',
        key: 'logoUrl',
        value: JSON.stringify(''),
        type: 'text',
        name: 'Logo URL',
        description: 'URL to the system logo',
        isSystem: false,
      },
      {
        category: 'security',
        key: 'sessionTimeout',
        value: JSON.stringify(3600),
        type: 'number',
        name: 'Session Timeout (seconds)',
        description: 'How long user sessions last before expiring',
        isSystem: true,
      },
      {
        category: 'notifications',
        key: 'emailNotifications',
        value: JSON.stringify(true),
        type: 'toggle',
        name: 'Email Notifications',
        description: 'Enable email notifications for new registrations',
        isSystem: false,
      },
    ]

    for (const setting of defaultSettings) {
      await prisma.setting.upsert({
        where: {
          category_key: {
            category: setting.category,
            key: setting.key,
          },
        },
        update: {},
        create: setting,
      })
    }

    console.log('✅ Default system settings created/updated')

    console.log('\n🎉 Render.com setup completed successfully!')
    console.log('\n📋 Your app is ready:')
    console.log(`🌐 App URL: ${process.env.RENDER_EXTERNAL_URL || 'https://mopgomyouth.onrender.com'}`)
    console.log(`👤 Admin Login: ${superAdminEmail}`)
    console.log(`🔑 Password: ${superAdminPassword}`)
    console.log('\n⚠️ IMPORTANT: Change the default password after first login!')

  } catch (error) {
    console.error('❌ Render.com setup failed:', error)
    // Don't exit with error code to avoid failing the deployment
    console.log('⚠️ Setup failed but deployment will continue')
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    // Don't exit with error code to avoid failing the deployment
    console.log('⚠️ Setup failed but deployment will continue')
  })
