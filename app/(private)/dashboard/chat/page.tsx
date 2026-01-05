"use client"

import { useEffect, useState, useRef } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  MessageSquare,
  Send,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/contexts/user-context"

interface ChatMessage {
  id: string
  conversationId: string
  senderId?: string
  senderType: 'guest' | 'user' | 'admin' | 'system'
  senderName?: string
  senderEmail?: string
  content: string
  messageType: string
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
}

interface ChatConversation {
  id: string
  userId?: string
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  lastMessageAt: string
  createdAt: string
  assignedAdmin?: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  messages?: ChatMessage[]
}

const statusConfig = {
  open: { label: "Ouvert", variant: "default" as const, icon: Clock },
  pending: { label: "En attente de réponse", variant: "warning" as const, icon: Clock },
  resolved: { label: "Résolu", variant: "success" as const, icon: CheckCircle },
  closed: { label: "Fermé", variant: "secondary" as const, icon: XCircle },
}

export default function UserChatPage() {
  const { user } = useUser()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newContent, setNewContent] = useState("")
  const [creating, setCreating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()

      if (data.success) {
        setConversations(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true)
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const createConversation = async () => {
    if (!newSubject.trim() || !newContent.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          message: newContent.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Conversation créée")
        setNewChatOpen(false)
        setNewSubject("")
        setNewContent("")
        await fetchConversations()
        setSelectedConversation(data.data.conversation)
        setMessages([data.data.message])
      } else {
        toast.error("Erreur lors de la création")
      }
    } catch (error) {
      console.error("Failed to create conversation:", error)
      toast.error("Erreur de connexion")
    } finally {
      setCreating(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, data.data])
        setNewMessage("")
        // Update conversation in list
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, lastMessageAt: new Date().toISOString(), status: 'open' as const }
            : c
        ))
      } else {
        toast.error("Erreur lors de l'envoi du message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Erreur de connexion")
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Mes Conversations
            </h1>
            <p className="text-muted-foreground">
              Discutez avec notre équipe support
            </p>
          </div>
          <Button onClick={() => setNewChatOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle conversation
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={cn(
            "w-full md:w-80 border-r flex flex-col",
            selectedConversation && "hidden md:flex"
          )}>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Chargement...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune conversation</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setNewChatOpen(true)}
                  >
                    Démarrer une conversation
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.subject}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: true,
                              locale: fr
                            })}
                          </p>
                        </div>
                        <Badge variant={statusConfig[conv.status].variant} className="text-xs shrink-0">
                          {statusConfig[conv.status].label}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat View */}
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedConversation && "hidden md:flex"
          )}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="border-b p-4 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedConversation.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusConfig[selectedConversation.status].variant}>
                        {statusConfig[selectedConversation.status].label}
                      </Badge>
                      {selectedConversation.assignedAdmin && (
                        <span className="text-sm text-muted-foreground">
                          Assigné à {selectedConversation.assignedAdmin.firstName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Chargement des messages...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            message.senderType === 'user' ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.messageType === 'system' ? (
                            <div className="text-center text-sm text-muted-foreground py-2 w-full">
                              {message.content}
                            </div>
                          ) : (
                            <div className="flex items-end gap-2 max-w-[70%]">
                              {message.senderType === 'admin' && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={message.sender?.profileImage} />
                                  <AvatarFallback>
                                    {message.senderName?.[0] || 'S'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                "rounded-lg p-3",
                                message.senderType === 'user'
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}>
                                {message.senderType === 'admin' && (
                                  <p className="text-xs font-medium mb-1">
                                    {message.senderName || 'Support'}
                                  </p>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <p className={cn(
                                  "text-xs mt-1",
                                  message.senderType === 'user'
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                )}>
                                  {format(new Date(message.createdAt), "HH:mm", { locale: fr })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                {selectedConversation.status !== 'closed' && (
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Écrire un message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        className="min-h-[60px] resize-none"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedConversation.status === 'closed' && (
                  <div className="border-t p-4 text-center text-muted-foreground">
                    Cette conversation est fermée
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Sélectionnez une conversation</p>
                  <p className="text-sm mt-2">ou créez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* New Conversation Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
            <DialogDescription>
              Décrivez votre question ou problème, notre équipe vous répondra rapidement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                placeholder="Ex: Question sur mon compte"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Décrivez votre demande..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={createConversation}
              disabled={creating || !newSubject.trim() || !newContent.trim()}
            >
              {creating ? "Envoi..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
