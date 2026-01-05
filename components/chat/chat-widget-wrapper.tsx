"use client"

import dynamic from 'next/dynamic'

// Dynamically import the chat widget to avoid SSR issues
const ChatWidget = dynamic(
  () => import('./chat-widget').then(mod => ({ default: mod.ChatWidget })),
  { ssr: false }
)

export function ChatWidgetWrapper() {
  return <ChatWidget />
}
