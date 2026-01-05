"use client"

import { useEffect, useState, useRef } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  MessageSquare,
  Search,
  Filter,
  User,
  Mail,
  Clock,
  Send,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  RefreshCw,
  Inbox,
  MessageCircle,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  guestEmail?: string
  guestName?: string
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignedAdminId?: string
  lastMessageAt: string
  createdAt: string
  unreadCount?: number
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  assignedAdmin?: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  messages?: ChatMessage[]
}

interface ChatStats {
  open: number
  pending: number
  unassigned: number
  total: number
}

const statusConfig = {
  open: { label: "Ouvert", variant: "default" as const, color: "bg-green-500" },
  pending: { label: "En attente", variant: "warning" as const, color: "bg-yellow-500" },
  resolved: { label: "Résolu", variant: "secondary" as const, color: "bg-blue-500" },
  closed: { label: "Fermé", variant: "outline" as const, color: "bg-gray-500" },
}

const priorityConfig = {
  low: { label: "Basse", color: "text-gray-500" },
  normal: { label: "Normale", color: "text-blue-500" },
  high: { label: "Haute", color: "text-orange-500" },
  urgent: { label: "Urgente", color: "text-red-500" },
}

export default function AdminChatPage() {
  const { user } = useUser()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [stats, setStats] = useState<ChatStats>({ open: 0, pending: 0, unassigned: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/admin/chat?${params}`)
      const data = await response.json()

      if (data.success) {
        setConversations(data.data)
        setStats(data.stats)
      } else {
        toast.error("Erreur lors du chargement des conversations")
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
      toast.error("Erreur de connexion")
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
        // Mark as read
        await fetch(`/api/admin/chat/${conversationId}/read`, { method: 'POST' })
        // Update conversation unread count
        setConversations(prev => prev.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ))
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      toast.error("Erreur lors du chargement des messages")
    } finally {
      setMessagesLoading(false)
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
            ? { ...c, lastMessageAt: new Date().toISOString(), status: 'pending' as const }
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

  const updateConversationStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success(`Statut mis à jour: ${statusConfig[status as keyof typeof statusConfig]?.label}`)
        fetchConversations()
        if (selectedConversation?.id === id) {
          setSelectedConversation(prev => prev ? { ...prev, status: status as any } : null)
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const assignToMe = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/chat/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user?.id }),
      })

      if (response.ok) {
        toast.success("Conversation assignée")
        fetchConversations()
        if (selectedConversation?.id === id) {
          fetchMessages(id)
        }
      }
    } catch (error) {
      toast.error("Erreur lors de l'assignation")
    }
  }

  const unassign = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/chat/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: null }),
      })

      if (response.ok) {
        toast.success("Assignation retirée")
        fetchConversations()
      }
    } catch (error) {
      toast.error("Erreur")
    }
  }

  useEffect(() => {
    fetchConversations()
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [statusFilter])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getContactName = (conv: ChatConversation) => {
    if (conv.user) {
      return `${conv.user.firstName} ${conv.user.lastName}`
    }
    return conv.guestName || conv.guestEmail || 'Visiteur'
  }

  const getContactEmail = (conv: ChatConversation) => {
    return conv.user?.email || conv.guestEmail || ''
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      const name = getContactName(conv).toLowerCase()
      const email = getContactEmail(conv).toLowerCase()
      const subject = conv.subject.toLowerCase()
      return name.includes(search) || email.includes(search) || subject.includes(search)
    }
    return true
  })

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Chat Support
            </h1>
            <p className="text-muted-foreground">
              Gérez les conversations avec les visiteurs et clients
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchConversations()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ouvertes</p>
                <p className="text-2xl font-bold text-green-600">{stats.open}</p>
              </div>
              <Inbox className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Non assignées</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-96 border-r flex flex-col",
          selectedConversation && "hidden md:flex"
        )}>
          {/* Filters */}
          <div className="p-4 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Aucune conversation</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.user?.profileImage} />
                        <AvatarFallback>
                          {getInitials(getContactName(conv))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">
                            {getContactName(conv)}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: true,
                              locale: fr
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={statusConfig[conv.status].variant} className="text-xs">
                            {statusConfig[conv.status].label}
                          </Badge>
                          {(conv.unreadCount ?? 0) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                          {!conv.assignedAdminId && (
                            <Badge variant="outline" className="text-xs text-orange-500">
                              Non assigné
                            </Badge>
                          )}
                        </div>
                      </div>
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
              <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConversation.user?.profileImage} />
                    <AvatarFallback>
                      {getInitials(getContactName(selectedConversation))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{getContactName(selectedConversation)}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {getContactEmail(selectedConversation)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedConversation.status}
                    onValueChange={(value) => updateConversationStatus(selectedConversation.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!selectedConversation.assignedAdminId ? (
                        <DropdownMenuItem onClick={() => assignToMe(selectedConversation.id)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Prendre en charge
                        </DropdownMenuItem>
                      ) : selectedConversation.assignedAdminId === user?.id ? (
                        <DropdownMenuItem onClick={() => unassign(selectedConversation.id)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Retirer l'assignation
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => updateConversationStatus(selectedConversation.id, 'closed')}
                        className="text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Fermer la conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                          message.senderType === 'admin' ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.messageType === 'system' ? (
                          <div className="text-center text-sm text-muted-foreground py-2 w-full">
                            {message.content}
                          </div>
                        ) : (
                          <div className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            message.senderType === 'admin'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}>
                            <p className="text-sm">{message.content}</p>
                            <p className={cn(
                              "text-xs mt-1",
                              message.senderType === 'admin'
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}>
                              {format(new Date(message.createdAt), "HH:mm", { locale: fr })}
                            </p>
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
                      className="min-h-[80px] resize-none"
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
