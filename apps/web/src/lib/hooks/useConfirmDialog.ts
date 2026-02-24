import { useState, useCallback, useRef } from 'react'

interface ConfirmOptions {
  title: string
  description: string
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setTitle(opts.title)
    setDescription(opts.description)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const onConfirm = useCallback(() => {
    setIsOpen(false)
    resolverRef.current?.(true)
    resolverRef.current = null
  }, [])

  const onCancel = useCallback(() => {
    setIsOpen(false)
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  return {
    confirm,
    dialogProps: { open: isOpen, title, description, onConfirm, onCancel },
  }
}
