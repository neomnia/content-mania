"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { upsertProduct } from "@/app/actions/ecommerce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Upload, X, ImageIcon } from "lucide-react"
import Link from "next/link"
import * as Icons from "lucide-react"
import Image from "next/image"

interface VatRate {
  id: string
  name: string
  country: string
  rate: number
  isDefault: boolean
  isActive: boolean
}

interface ProductFormProps {
  initialData?: {
    id: string
    title: string
    description: string | null
    price: number
    type: string | null
    isPublished: boolean
    fileUrl: string | null
    outlookEventTypeId: string | null
    icon: string | null
    features?: unknown
    currency?: string | null
    upsellProductId?: string | null
    imageUrl?: string | null
    vatRateId?: string | null
  }
  products?: { id: string; title: string }[]
  vatRates: VatRate[]
}

export function ProductForm({ initialData, products = [], vatRates }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  
  // Find default VAT rate or first active rate
  const defaultVatRate = vatRates.find(r => r.isDefault && r.isActive) || vatRates.find(r => r.isActive)
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price ? (initialData.price / 100).toString() : "",
    currency: initialData?.currency || "EUR",
    type: initialData?.type || "standard", // 'standard' | 'free' | 'appointment'
    isPublished: initialData?.isPublished || false,
    isFeatured: (initialData as any)?.isFeatured || false,
    fileUrl: initialData?.fileUrl || "",
    outlookEventTypeId: initialData?.outlookEventTypeId || "",
    icon: initialData?.icon || "ShoppingBag",
    focusAreas: (initialData?.features as any)?.focusAreas?.join("\n") || (Array.isArray(initialData?.features) ? initialData.features.join("\n") : ""),
    deliverables: (initialData?.features as any)?.deliverables?.join("\n") || "",
    upsellProductId: initialData?.upsellProductId || "none",
    vatRateId: initialData?.vatRateId || defaultVatRate?.id || "",
    hourlyRate: (initialData as any)?.hourlyRate ? ((initialData as any).hourlyRate / 100).toString() : "",
  })

  const handleImageUpload = async (file: File) => {
    // For new products, store the file temporarily and show preview
    if (!initialData?.id) {
      setPendingImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      toast.success("Image ready for upload (will be saved with product)")
      return
    }

    // For existing products, upload immediately
    const formData = new FormData()
    formData.append("image", file)
    formData.append("productId", initialData.id)

    try {
      const response = await fetch("/api/products/image", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setImagePreview(data.imageUrl)
        toast.success("Image uploaded")
        router.refresh()
      } else {
        toast.error("Failed to upload image")
      }
    } catch (error) {
      toast.error("Upload error")
    }
  }

  const removeImage = async () => {
    if (!initialData?.id) {
      // For new products, just clear the preview and pending file
      setImagePreview(null)
      setPendingImageFile(null)
      toast.success("Image removed")
      return
    }

    // For existing products, update in database
    try {
      const result = await upsertProduct({
        id: initialData.id,
        imageUrl: null
      })

      if (result.success) {
        setImagePreview(null)
        setPendingImageFile(null)
        toast.success("Image removed")
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to remove image")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const features = {
        focusAreas: formData.focusAreas.split("\n").filter((s: string) => s.trim() !== ""),
        deliverables: formData.deliverables.split("\n").filter((s: string) => s.trim() !== ""),
      }

      // Price handling based on type
      const price = (formData.type === 'free' || formData.type === 'appointment') 
        ? 0 
        : Math.round(parseFloat(formData.price) * 100)

      const result = await upsertProduct({
        id: initialData?.id,
        title: formData.title,
        description: formData.description,
        price: price,
        currency: formData.currency,
        type: formData.type,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        fileUrl: (formData.type === 'standard' || formData.type === 'digital' || formData.type === 'free') ? formData.fileUrl : null,
        outlookEventTypeId: formData.type === 'appointment' ? formData.outlookEventTypeId : null,
        icon: formData.icon,
        features: features,
        upsellProductId: formData.upsellProductId === "none" ? null : formData.upsellProductId,
        vatRateId: (formData.type === 'standard' || formData.type === 'digital') ? (formData.vatRateId || null) : null,
        hourlyRate: formData.type === 'appointment' && formData.hourlyRate ? Math.round(parseFloat(formData.hourlyRate) * 100) : null,
      })

      if (result.success) {
        // If we have a pending image file and the product was just created, upload it now
        if (pendingImageFile && result.data?.id) {
          const imgFormData = new FormData()
          imgFormData.append("image", pendingImageFile)
          imgFormData.append("productId", result.data.id)

          try {
            await fetch("/api/products/image", {
              method: "POST",
              body: imgFormData
            })
          } catch (error) {
            console.error("Image upload error:", error)
            toast.error("Product created but image upload failed")
          }
        }

        toast.success(initialData ? "Product updated" : "Product created")
        router.push("/admin/products")
        router.refresh()
      } else {
        toast.error("Failed to save product")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{initialData ? "Edit Product" : "New Product"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 border p-6 rounded-lg bg-card">
        {/* Image Upload Section */}
        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
          <Label>Product Image</Label>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              {imagePreview ? (
                <div className="relative w-full max-w-xs">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-[#CD7F32]/20">
                    <Image 
                      src={imagePreview} 
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-48 h-48 border-2 border-dashed rounded-lg bg-muted/50">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No image uploaded</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {initialData?.id ? "Upload Image" : "Select Image"}
              </Button>
              {!initialData?.id && pendingImageFile && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Image ready to upload with product
                </p>
              )}
              {!initialData?.id && !pendingImageFile && (
                <p className="text-xs text-muted-foreground mt-2">
                  You can select an image now. It will be uploaded when you create the product.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Icon</Label>
          <Select
            value={formData.icon}
            onValueChange={(value) => setFormData({ ...formData, icon: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select icon" />
            </SelectTrigger>
            <SelectContent>
              {["ShoppingBag", "Package", "Zap", "Shield", "Globe", "Server", "Cloud", "Database", "Code", "Smartphone"].map((iconName) => {
                 const Icon = Icons[iconName as keyof typeof Icons] as any
                 return (
                   <SelectItem key={iconName} value={iconName}>
                     <div className="flex items-center gap-2">
                       {Icon && <Icon className="h-4 w-4" />}
                       <span>{iconName}</span>
                     </div>
                   </SelectItem>
                 )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="focusAreas">Possible Focus Areas (One per line)</Label>
          <Textarea
            id="focusAreas"
            value={formData.focusAreas}
            onChange={(e) => setFormData({ ...formData, focusAreas: e.target.value })}
            placeholder="e.g. Docker setup&#10;CLI usage"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliverables">You'll Receive (One per line)</Label>
          <Textarea
            id="deliverables"
            value={formData.deliverables}
            onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
            placeholder="e.g. Setup notes&#10;Recorded session"
            rows={3}
          />
        </div>

        {/* Product Type Selection */}
        <div className="space-y-4 border p-4 rounded-md bg-muted/10">
          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  <div className="flex flex-col">
                    <span className="font-medium">Standard Product</span>
                    <span className="text-xs text-muted-foreground">Paid product with unit price</span>
                  </div>
                </SelectItem>
                <SelectItem value="digital">
                  <div className="flex flex-col">
                    <span className="font-medium">Digital Product</span>
                    <span className="text-xs text-muted-foreground">Digital product accessible online (with price)</span>
                  </div>
                </SelectItem>
                <SelectItem value="free">
                  <div className="flex flex-col">
                    <span className="font-medium">Free Download</span>
                    <span className="text-xs text-muted-foreground">Free downloadable product (no payment)</span>
                  </div>
                </SelectItem>
                <SelectItem value="appointment">
                  <div className="flex flex-col">
                    <span className="font-medium">Appointment / Lead</span>
                    <span className="text-xs text-muted-foreground">Booking product (no payment, lead generation)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.type === 'standard' && '💰 Customer pays at checkout'}
              {formData.type === 'digital' && '🚀 Digital product accessible online'}
              {formData.type === 'free' && '🎁 Free download, no payment required'}
              {formData.type === 'appointment' && '📅 No payment, tracks lead for appointment booking'}
            </p>
          </div>
        </div>

        {/* Pricing Section - Standard and Digital Products Only */}
        {(formData.type === 'standard' || formData.type === 'digital') && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price Excl. VAT</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vatRateId">VAT Rate</Label>
                <Link href="/admin/vat-rates" className="text-xs text-[#CD7F32] hover:underline">
                  Manage rates
                </Link>
              </div>
              <Select
                value={formData.vatRateId}
                onValueChange={(value) => setFormData({ ...formData, vatRateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select VAT rate" />
                </SelectTrigger>
                <SelectContent>
                  {vatRates.filter(r => r.isActive).map(rate => (
                    <SelectItem key={rate.id} value={rate.id}>
                      <div className="flex items-center gap-2">
                        <span>{rate.name}</span>
                        <span className="text-muted-foreground">({(rate.rate / 100).toFixed(2)}%)</span>
                        {rate.isDefault && <span className="text-xs text-[#CD7F32]">★</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Currency - All Types */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File URL for Standard, Digital and Free Products */}
        {(formData.type === 'standard' || formData.type === 'digital' || formData.type === 'free') && (
          <div className="space-y-2">
            <Label htmlFor="fileUrl">Download URL / File URL (S3)</Label>
            <Input
              id="fileUrl"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              {formData.type === 'free' ? 'Direct download link for the free product' : 
               formData.type === 'digital' ? 'Download link for digital product access' :
               'Optional download link provided after purchase'}
            </p>
          </div>
        )}

        {/* Appointment Configuration */}
        {formData.type === 'appointment' && (
          <div className="space-y-4 border p-4 rounded-md bg-blue-50 dark:bg-blue-950/20">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (for display only)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="150.00"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Display an indicative hourly rate. No payment is collected.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outlookEventTypeId">Outlook Event Type ID</Label>
              <Input
                id="outlookEventTypeId"
                value={formData.outlookEventTypeId}
                onChange={(e) => setFormData({ ...formData, outlookEventTypeId: e.target.value })}
                placeholder="Event Type ID from Outlook Booking"
              />
              <p className="text-xs text-muted-foreground">
                Event type ID for automatic appointment booking integration.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 border p-4 rounded-md">
          <Label>Upsell Configuration</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select a product to offer as an upsell during checkout.
          </p>
          <Select
            value={formData.upsellProductId}
            onValueChange={(value) => setFormData({ ...formData, upsellProductId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an upsell product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {products.filter(p => p.id !== initialData?.id).map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label htmlFor="isPublished">Published</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
            />
            <Label htmlFor="isFeatured" className="flex items-center gap-2">
              ⭐ Most Popular
            </Label>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving..." : (initialData ? "Update Product" : "Create Product")}
        </Button>
      </form>
    </div>
  )
}
