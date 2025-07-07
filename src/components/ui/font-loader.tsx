'use client'

import { useEffect, useState } from 'react'
import { verifyApercuFonts, areApercuFontsLoaded } from '@/lib/font-verification'

interface FontLoaderProps {
  children: React.ReactNode
  showLoadingScreen?: boolean
  timeout?: number
}

export function FontLoader({
  children,
  showLoadingScreen = true,
  timeout = 3000
}: FontLoaderProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    const loadFonts = async () => {
      try {
        console.log('🔤 Starting Apercu Pro font loading...')
        setLoadingProgress(10)

        // Check if FontFace API is supported
        if ('fonts' in document) {
          setLoadingProgress(20)

          // Define the fonts to load with proper paths
          const fonts = [
            new FontFace('Apercu Pro', 'url(/fonts/ApercuPro-Regular.woff)', {
              weight: '400',
              style: 'normal',
              display: 'block'
            }),
            new FontFace('Apercu Pro', 'url(/fonts/ApercuPro-Medium.woff)', {
              weight: '500',
              style: 'normal',
              display: 'block'
            }),
            new FontFace('Apercu Pro', 'url(/fonts/ApercuPro-Bold.woff)', {
              weight: '700',
              style: 'normal',
              display: 'block'
            })
          ]

          setLoadingProgress(40)

          // Load all fonts with error handling
          const loadPromises = fonts.map(async (font, index) => {
            try {
              console.log(`Loading ${font.family} ${font.weight}...`)
              const loadedFont = await font.load()
              document.fonts.add(loadedFont)
              setLoadingProgress(40 + (index + 1) * 15)
              console.log(`✅ Loaded ${font.family} ${font.weight}`)
              return loadedFont
            } catch (error) {
              console.warn(`❌ Failed to load font: ${font.family} ${font.weight}`, error)
              return null
            }
          })

          // Wait for all fonts to load
          await Promise.all(loadPromises)
          setLoadingProgress(85)

          // Additional check to ensure fonts are ready
          await document.fonts.ready
          setLoadingProgress(95)

          // Verify fonts using our verification system
          const fontStatuses = await verifyApercuFonts()
          const allLoaded = areApercuFontsLoaded()

          console.log('📊 Font loading summary:', fontStatuses)

          if (allLoaded) {
            console.log('✅ All Apercu Pro fonts loaded and verified successfully')
          } else {
            console.warn('⚠️ Some Apercu Pro fonts failed to load, using fallbacks')
          }

          setLoadingProgress(100)
          setFontsLoaded(true)
        } else {
          // Fallback for browsers without FontFace API
          console.warn('FontFace API not supported, using CSS fallback')
          setLoadingProgress(100)

          // Use a timeout as fallback
          setTimeout(() => {
            setFontsLoaded(true)
          }, 500)
        }
      } catch (error) {
        console.error('Error loading fonts:', error)
        setLoadingProgress(100)
        // Still show content even if fonts fail to load
        setFontsLoaded(true)
      }
    }

    // Set a maximum timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Font loading timeout reached, showing content with fallback fonts')
      setFontsLoaded(true)
    }, timeout)

    loadFonts().finally(() => {
      clearTimeout(timeoutId)
    })

    return () => {
      clearTimeout(timeoutId)
    }
  }, [timeout])

  // Show loading state while fonts are loading
  if (!fontsLoaded && showLoadingScreen) {
    return (
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          color: '#374151',
          flexDirection: 'column'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          {/* Logo or Brand */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#111827'
            }}>
              Mopgomglobal
            </h1>
            <p style={{
              fontSize: '14px',
              margin: 0,
              color: '#6b7280'
            }}>
              Loading Application...
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              backgroundColor: '#4f46e5',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Spinner */}
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #4f46e5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}
          />

          <p style={{
            fontSize: '12px',
            margin: '12px 0 0 0',
            color: '#9ca3af'
          }}>
            {loadingProgress}% complete
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return <>{children}</>
}
