/** @fileoverview Image avec chargement differe et placeholder skeleton */
import { useState, useEffect, useRef } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  alt: string
  /**
   * Show skeleton loader while image is loading
   * @default true
   */
  showSkeleton?: boolean
  /**
   * Custom skeleton component
   */
  skeleton?: React.ReactNode
  /**
   * Fallback component if image fails to load
   */
  fallback?: React.ReactNode
  /**
   * Root margin for IntersectionObserver
   * @default '50px' - Start loading 50px before visible
   */
  rootMargin?: string
  /**
   * Callback when image loads successfully
   */
  onLoad?: () => void
  /**
   * Callback when image fails to load
   */
  onError?: () => void
}

/**
 * Optimized lazy loading image component
 *
 * Features:
 * - Native lazy loading with `loading="lazy"`
 * - Intersection Observer for early loading
 * - Skeleton placeholder during load
 * - Error fallback
 * - Fade-in animation when loaded
 *
 * @example
 * ```tsx
 * <LazyImage
 *   src="/uploads/signatures/abc123.png"
 *   alt="Signature de retrait"
 *   className="w-full rounded-lg"
 * />
 * ```
 */
export function LazyImage({
  src,
  alt,
  showSkeleton = true,
  skeleton,
  fallback,
  rootMargin = '50px',
  onLoad: onLoadProp,
  onError: onErrorProp,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer pour détecter quand l'image entre dans le viewport
  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    )

    observer.observe(img)

    return () => {
      observer.disconnect()
    }
  }, [rootMargin])

  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
    onLoadProp?.()
  }

  const handleError = () => {
    setIsLoaded(false)
    setHasError(true)
    onErrorProp?.()
  }

  // Default skeleton
  const defaultSkeleton = (
    <div
      className={cn(
        'animate-pulse bg-muted rounded-lg w-full',
        className
      )}
      style={{ aspectRatio: '16/9' }}
    />
  )

  // Default fallback
  const defaultFallback = (
    <div
      className={cn(
        'flex items-center justify-center bg-muted text-muted-foreground rounded-lg w-full',
        className
      )}
      style={{ aspectRatio: '16/9' }}
    >
      <div className="text-center p-4">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm">Image non disponible</p>
      </div>
    </div>
  )

  // Show error fallback
  if (hasError) {
    return <>{fallback || defaultFallback}</>
  }

  return (
    <div className="relative">
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && !shouldLoad && (
        skeleton || defaultSkeleton
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={shouldLoad ? src : undefined}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          !shouldLoad && 'absolute inset-0',
          className
        )}
        {...props}
      />
    </div>
  )
}
