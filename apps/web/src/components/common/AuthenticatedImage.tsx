/** @fileoverview Image protégée par JWT, chargée via fetch + blob URL */
import { useEffect, useRef, useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils'

interface AuthenticatedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Chemin relatif servi par l'API (ex: "/uploads/signatures/xxx.png") */
  src: string
  alt: string
  fallback?: React.ReactNode
}

export function AuthenticatedImage({
  src,
  alt,
  fallback,
  className,
  ...props
}: AuthenticatedImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const currentUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setHasError(false)

    apiClient
      .get(src, { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return
        const url = URL.createObjectURL(response.data)
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current)
        }
        currentUrlRef.current = url
        setBlobUrl(url)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setHasError(true)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [src])

  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current)
        currentUrlRef.current = null
      }
    }
  }, [])

  if (hasError) {
    if (fallback) return <>{fallback}</>
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground rounded-lg w-full',
          className
        )}
        style={{ aspectRatio: '16/9' }}
      >
        <p className="text-sm">Image non disponible</p>
      </div>
    )
  }

  if (isLoading || !blobUrl) {
    return (
      <div
        className={cn('animate-pulse bg-muted rounded-lg w-full', className)}
        style={{ aspectRatio: '16/9' }}
      />
    )
  }

  return <img src={blobUrl} alt={alt} className={className} {...props} />
}
