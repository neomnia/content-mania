"use client"

import { useState, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  Building2,
  Ban,
  Pencil,
  Users,
  CheckCircle2,
  FileDown,
  Download,
  Upload
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  createCompany,
  deleteCompany,
  updateCompany,
  updateCompanyStatus,
  bulkUpdateCompanyStatus
} from "@/app/actions/users"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  userRoles: {
    role: {
      name: string
    }
  }[]
}

interface Company {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  zipCode?: string | null
  siret?: string | null
  vatNumber?: string | null
  isActive: boolean
  users: User[]
  createdAt: Date
}

interface CompaniesTableProps {
  initialCompanies: Company[]
}

export function CompaniesTable({ initialCompanies }: CompaniesTableProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [viewingUsers, setViewingUsers] = useState<Company | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const csvImportInputRef = useRef<HTMLInputElement>(null)

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.siret?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && company.isActive) ||
      (statusFilter === "inactive" && !company.isActive)

    return matchesSearch && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(filteredCompanies.map(c => c.id))
    } else {
      setSelectedCompanies([])
    }
  }

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId])
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId))
    }
  }

  const handleCreateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      zipCode: formData.get("zipCode") as string || undefined,
      siret: formData.get("siret") as string || undefined,
      vatNumber: formData.get("vatNumber") as string || undefined,
    }

    const result = await createCompany(data)

    if (result.success) {
      toast.success("Company created successfully")
      setIsCreateOpen(false)
      window.location.reload()
    } else {
      toast.error(result.error || "Failed to create company")
    }
    setIsLoading(false)
  }

  const handleDeleteCompany = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company && company.users.length > 0) {
      toast.error(`Cannot delete company with ${company.users.length} user(s). Reassign or delete users first.`)
      return
    }

    if (!confirm("Are you sure you want to delete this company?")) return

    const result = await deleteCompany(companyId)
    if (result.success) {
      toast.success("Company deleted successfully")
      setCompanies(companies.filter(c => c.id !== companyId))
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId))
    } else {
      toast.error(result.error || "Failed to delete company")
    }
  }

  const handleStatusUpdate = async (companyId: string, isActive: boolean) => {
    const result = await updateCompanyStatus(companyId, isActive)
    if (result.success) {
      toast.success(result.message)
      setCompanies(companies.map(c => c.id === companyId ? { ...c, isActive } : c))
    } else {
      toast.error(result.error || "Failed to update status")
    }
  }

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedCompanies.length === 0) {
      toast.error("No companies selected")
      return
    }

    const action = isActive ? "activate" : "deactivate"
    if (!confirm(`Are you sure you want to ${action} ${selectedCompanies.length} company(ies)? This will also ${action} all users in these companies.`)) return

    setIsLoading(true)
    const result = await bulkUpdateCompanyStatus(selectedCompanies, isActive)
    if (result.success) {
      toast.success(result.message)
      setCompanies(companies.map(c =>
        selectedCompanies.includes(c.id) ? { ...c, isActive } : c
      ))
      setSelectedCompanies([])
    } else {
      toast.error(result.error || `Failed to ${action} companies`)
    }
    setIsLoading(false)
  }

  const handleExportCSV = () => {
    const companiesToExport = selectedCompanies.length > 0 
      ? companies.filter(c => selectedCompanies.includes(c.id))
      : companies

    if (companiesToExport.length === 0) {
      toast.error("No companies to export")
      return
    }

    const headers = ["ID", "Name", "Email", "Phone", "Address", "City", "Zip Code", "SIRET", "VAT Number", "Status", "Users Count", "Created At"]
    const rows = companiesToExport.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone || '',
      c.address ? `"${c.address.replace(/"/g, '""')}"` : '',
      c.city || '',
      c.zipCode || '',
      c.siret || '',
      c.vatNumber || '',
      c.isActive ? 'Active' : 'Inactive',
      c.users.length,
      new Date(c.createdAt).toISOString()
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `companies_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success(`${companiesToExport.length} company(ies) exported`)
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n')
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid")
        return
      }

      // Expected columns: name,email,phone,address,city,zipCode,siret,vatNumber
      const headers = lines[0].split(',').map(h => h.trim())
      const dataLines = lines.slice(1).filter(line => line.trim())
      
      let imported = 0
      let errors = 0

      for (const line of dataLines) {
        try {
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"')) || []
          
          if (values.length < 2) continue // At minimum need name and email

          const data = {
            name: values[0],
            email: values[1],
            phone: values[2] || undefined,
            address: values[3] || undefined,
            city: values[4] || undefined,
            zipCode: values[5] || undefined,
            siret: values[6] || undefined,
            vatNumber: values[7] || undefined,
          }

          const result = await createCompany(data)
          if (result.success) {
            imported++
          } else {
            errors++
            console.error('Failed to import company:', values[0], result.error)
          }
        } catch (err) {
          errors++
          console.error('Error parsing CSV line:', line, err)
        }
      }

      if (imported > 0) {
        toast.success(`${imported} company(ies) imported successfully${errors > 0 ? `, ${errors} error(s)` : ''}`)
        window.location.reload()
      } else {
        toast.error(`Import failed: ${errors} error(s)`)
      }
    } catch (error) {
      console.error('[CompaniesTable] Import error:', error)
      toast.error("Failed to import CSV file")
    }

    // Reset input
    if (csvImportInputRef.current) {
      csvImportInputRef.current.value = ''
    }
  }

  const handleEditCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCompany) return

    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      zipCode: formData.get("zipCode") as string || undefined,
      siret: formData.get("siret") as string || undefined,
      vatNumber: formData.get("vatNumber") as string || undefined,
    }

    const result = await updateCompany(editingCompany.id, data)

    if (result.success) {
      toast.success("Company updated successfully")
      setEditingCompany(null)
      window.location.reload()
    } else {
      toast.error(result.error || "Failed to update company")
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <input
        ref={csvImportInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportCSV}
      />
      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground mr-2">
            Total: {filteredCompanies.length}
          </span>
          
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => csvImportInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          
          {selectedCompanies.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedCompanies.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate(false)}
                disabled={isLoading}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Ban className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Revoke</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate(true)}
                disabled={isLoading}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Activate</span>
              </Button>
            </>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#CD7F32] hover:bg-[#B86F28] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company organization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input id="siret" name="siret" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input id="vatNumber" name="vatNumber" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input id="zipCode" name="zipCode" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Company"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Companies Table - Desktop */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id} className={!company.isActive ? "opacity-60" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={(checked) => handleSelectCompany(company.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {company.name}
                    </div>
                    {company.siret && (
                      <div className="text-xs text-muted-foreground">SIRET: {company.siret}</div>
                    )}
                  </TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>
                    {company.city ? (
                      <span>{company.city}{company.zipCode ? `, ${company.zipCode}` : ""}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      onClick={() => setViewingUsers(company)}
                    >
                      <Users className="mr-1 h-3 w-3" />
                      {company.users.length} user(s)
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.isActive ? "default" : "secondary"}>
                      {company.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingCompany(company)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Company
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewingUsers(company)}>
                          <Users className="mr-2 h-4 w-4" />
                          View Users
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(company.email)}>
                          Copy Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Status</DropdownMenuLabel>
                        {company.isActive ? (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(company.id, false)}
                            className="text-orange-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Revoke Access
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(company.id, true)}
                            className="text-green-600"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Activate Company
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteCompany(company.id)}
                          className="text-red-600 focus:text-red-600"
                          disabled={company.users.length > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No companies found
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <div key={company.id} className={`rounded-lg border bg-card p-4 space-y-3 ${!company.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={(checked) => handleSelectCompany(company.id, checked as boolean)}
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.email}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">SIRET:</span>
                  <p className="font-medium">{company.siret || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">{company.city ? `${company.city}${company.zipCode ? `, ${company.zipCode}` : ''}` : "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Users:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs font-medium"
                    onClick={() => setViewingUsers(company)}
                  >
                    <Users className="mr-1 h-3 w-3" />
                    {company.users.length} user(s)
                  </Button>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-0.5">
                    <Badge variant={company.isActive ? "default" : "secondary"} className="text-[10px]">
                      {company.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingCompany(company)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600" 
                  onClick={() => handleDeleteCompany(company.id)}
                  disabled={company.users.length > 0}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Company Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information.
            </DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <form onSubmit={handleEditCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Company Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingCompany.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingCompany.email}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={editingCompany.phone || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-siret">SIRET</Label>
                  <Input
                    id="edit-siret"
                    name="siret"
                    defaultValue={editingCompany.siret || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vatNumber">VAT Number</Label>
                <Input
                  id="edit-vatNumber"
                  name="vatNumber"
                  defaultValue={editingCompany.vatNumber || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  name="address"
                  defaultValue={editingCompany.address || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    name="city"
                    defaultValue={editingCompany.city || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zipCode">Zip Code</Label>
                  <Input
                    id="edit-zipCode"
                    name="zipCode"
                    defaultValue={editingCompany.zipCode || ""}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCompany(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Users Dialog */}
      <Dialog open={!!viewingUsers} onOpenChange={(open) => !open && setViewingUsers(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {viewingUsers?.name} - Users
              </div>
            </DialogTitle>
            <DialogDescription>
              List of users belonging to this company.
            </DialogDescription>
          </DialogHeader>
          {viewingUsers && (
            <div className="space-y-4">
              {viewingUsers.users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users in this company
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingUsers.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.userRoles.map((ur, i) => (
                                <Badge key={i} variant="outline">
                                  {ur.role.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setViewingUsers(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
