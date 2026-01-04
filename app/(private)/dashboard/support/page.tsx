"use client"

import { useState } from "react"
import Link from "next/link"
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Send,
  ChevronDown,
  ChevronRight,
  Book,
  Lightbulb,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { toast } from "sonner"

const faqItems = [
  {
    question: "Comment prendre un rendez-vous ?",
    answer: "Rendez-vous dans la section 'Rendez-vous' de votre tableau de bord, puis cliquez sur 'Nouveau rendez-vous'. Vous pourrez choisir le type de consultation, la date et l'heure souhaitées.",
  },
  {
    question: "Comment annuler ou modifier un rendez-vous ?",
    answer: "Accédez à la liste de vos rendez-vous, cliquez sur le rendez-vous concerné, puis utilisez les options 'Modifier' ou 'Annuler'. Les annulations doivent être effectuées au moins 24h à l'avance pour les rendez-vous payants.",
  },
  {
    question: "Quels sont les modes de paiement acceptés ?",
    answer: "Nous acceptons les paiements par carte bancaire (Visa, Mastercard, American Express), PayPal, et virement bancaire pour les montants supérieurs à 500€.",
  },
  {
    question: "Comment accéder à mes factures ?",
    answer: "Vos factures sont disponibles dans la section 'Paiements' de votre tableau de bord. Vous pouvez les télécharger au format PDF à tout moment.",
  },
  {
    question: "Comment mettre à jour mes informations de profil ?",
    answer: "Cliquez sur 'Profil' dans le menu de navigation. Vous pourrez y modifier vos informations personnelles, votre adresse email et votre mot de passe.",
  },
  {
    question: "Comment connecter mon calendrier externe ?",
    answer: "Accédez aux paramètres du calendrier via 'Calendrier' > 'Paramètres'. Vous pourrez y connecter Google Calendar ou Microsoft Outlook pour synchroniser automatiquement vos rendez-vous.",
  },
  {
    question: "Que faire si j'ai oublié mon mot de passe ?",
    answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre adresse email et vous recevrez un lien de réinitialisation.",
  },
  {
    question: "Comment gérer les membres de mon équipe ?",
    answer: "Dans 'Gestion de l'entreprise', vous pouvez inviter de nouveaux membres, modifier leurs rôles ou révoquer leur accès. Les invitations sont envoyées par email.",
  },
]

const categories = [
  { value: "general", label: "Question générale" },
  { value: "billing", label: "Facturation / Paiement" },
  { value: "appointment", label: "Rendez-vous" },
  { value: "technical", label: "Problème technique" },
  { value: "account", label: "Mon compte" },
  { value: "other", label: "Autre" },
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Implement actual support ticket submission
      // For now, simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success("Votre demande a été envoyée avec succès")
      setSubmitted(true)
      setFormData({ category: "", subject: "", message: "" })
    } catch (error) {
      toast.error("Erreur lors de l'envoi de votre demande")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Centre d'aide</h1>
        <p className="text-muted-foreground">
          Trouvez des réponses à vos questions ou contactez notre équipe support
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Documentation</h3>
                <p className="text-sm text-muted-foreground">
                  Guides et tutoriels complets
                </p>
                <Button variant="link" className="p-0 h-auto mt-2" asChild>
                  <Link href="/docs">
                    Voir la documentation <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Chat en direct</h3>
                <p className="text-sm text-muted-foreground">
                  Discutez avec notre équipe
                </p>
                <Button variant="link" className="p-0 h-auto mt-2">
                  Démarrer un chat <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-sm text-muted-foreground">
                  Réponse sous 24h
                </p>
                <Button variant="link" className="p-0 h-auto mt-2" asChild>
                  <a href="mailto:support@neosaas.com">
                    support@neosaas.com <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Questions fréquentes
            </CardTitle>
            <CardDescription>
              Trouvez rapidement des réponses aux questions les plus courantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nous contacter
            </CardTitle>
            <CardDescription>
              Envoyez-nous votre question et nous vous répondrons rapidement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Demande envoyée !</AlertTitle>
                <AlertDescription>
                  Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-2"
                    onClick={() => setSubmitted(false)}
                  >
                    Envoyer une autre demande
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Résumez votre question"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Décrivez votre question ou problème en détail..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !formData.category || !formData.subject || !formData.message}
                >
                  {loading ? (
                    "Envoi en cours..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer ma demande
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Conseils utiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Consultez la documentation</p>
                <p className="text-xs text-muted-foreground">
                  La plupart des réponses s'y trouvent
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                <AlertCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Soyez précis</p>
                <p className="text-xs text-muted-foreground">
                  Plus de détails = réponse plus rapide
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded">
                <Phone className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Urgence ?</p>
                <p className="text-xs text-muted-foreground">
                  Utilisez le chat en direct
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
