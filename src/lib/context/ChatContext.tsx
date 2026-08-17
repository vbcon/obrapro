'use client'

import { createContext, useContext, useState } from 'react'

interface ChatCtx { isOpen: boolean; open: () => void; close: () => void; toggle: () => void }

const ChatContext = createContext<ChatCtx>({ isOpen: false, open: () => {}, close: () => {}, toggle: () => {} })

export function useChat() { return useContext(ChatContext) }

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <ChatContext.Provider value={{
      isOpen,
      open:   () => setIsOpen(true),
      close:  () => setIsOpen(false),
      toggle: () => setIsOpen(v => !v),
    }}>
      {children}
    </ChatContext.Provider>
  )
}
