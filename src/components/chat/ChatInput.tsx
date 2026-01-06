'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Paperclip, Smile, X } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ChatInputProps {
  onSend: (content: string, attachments?: unknown[]) => Promise<void>
  onTyping: (isTyping: boolean) => void
  isSending: boolean
  disabled?: boolean
  placeholder?: string
}

// ============================================================================
// CHAT INPUT
// ============================================================================

export function ChatInput({
  onSend,
  onTyping,
  isSending,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    onTyping(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false)
    }, 2000)
  }, [onTyping])

  // Handle message change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value)
      if (e.target.value.trim()) {
        handleTyping()
      }
    },
    [handleTyping]
  )

  // Handle send
  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage && attachments.length === 0) return
    if (isSending || disabled) return

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    onTyping(false)

    try {
      // TODO: Upload attachments first and get URLs
      await onSend(trimmedMessage, undefined)
      setMessage('')
      setAttachments([])

      // Focus back on textarea
      textareaRef.current?.focus()
    } catch {
      // Error handled in parent
    }
  }, [message, attachments, isSending, disabled, onSend, onTyping])

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files].slice(0, 5)) // Max 5 files
    e.target.value = '' // Reset input
  }, [])

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className="border-t bg-white">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm"
            >
              <Paperclip className="w-3 h-3 text-gray-400" />
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-0.5 hover:bg-gray-200 rounded"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 flex items-end gap-2">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachments.length >= 5}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              w-full px-4 py-2.5 pr-10
              bg-gray-100 rounded-2xl
              text-sm text-gray-800 placeholder-gray-400
              resize-none
              focus:outline-none focus:ring-2 focus:ring-burnt-orange-500 focus:bg-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />

          {/* Emoji Button (inside input) */}
          <button
            disabled={disabled}
            className="absolute right-3 bottom-2.5 p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
          className="
            p-2.5 rounded-xl
            bg-gradient-to-br from-burnt-orange-500 to-burnt-orange-600
            text-white
            hover:from-burnt-orange-600 hover:to-burnt-orange-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
            shadow-sm hover:shadow
          "
          aria-label="Send message"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hint */}
      <div className="px-4 pb-2 text-[10px] text-gray-400 text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
