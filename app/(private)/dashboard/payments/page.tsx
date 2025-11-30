"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Check } from "lucide-react"

const MastercardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="33"
    height="32"
    viewBox="0 0 33 32"
    fill="none"
    className="w-full h-full"
  >
    <circle cx="10.5" cy="16" r="9" fill="#E80B26"></circle>
    <circle cx="22.5" cy="16" r="9" fill="#F59D31"></circle>
    <path
      d="M16.5 22.7085C18.3413 21.0605 19.5 18.6658 19.5 16.0002C19.5 13.3347 18.3413 10.9399 16.5 9.29199C14.6587 10.9399 13.5 13.3347 13.5 16.0002C13.5 18.6658 14.6587 21.0605 16.5 22.7085Z"
      fill="#FC6020"
    ></path>
  </svg>
)

const VisaIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="33"
    height="18"
    viewBox="0 0 33 18"
    fill="none"
    className="w-full h-full"
  >
    <g clipPath="url(#clip0_5607_13291)">
      <path
        d="M21.2243 3.90918C18.9651 3.90918 16.9462 5.06569 16.9462 7.20245C16.9462 9.65285 20.5268 9.82209 20.5268 11.0531C20.5268 11.5715 19.9254 12.0355 18.8981 12.0355C17.4403 12.0355 16.3507 11.3871 16.3507 11.3871L15.8844 13.5434C15.8844 13.5434 17.1396 14.091 18.8061 14.091C21.2762 14.091 23.2198 12.8777 23.2198 10.7045C23.2198 8.11511 19.6243 7.95089 19.6243 6.80831C19.6243 6.4022 20.118 5.95732 21.1423 5.95732C22.298 5.95732 23.2409 6.42885 23.2409 6.42885L23.6972 4.34631C23.6972 4.34631 22.6712 3.90918 21.2243 3.90918ZM0.554718 4.06638L0.5 4.38071C0.5 4.38071 1.45047 4.55249 2.3065 4.89522C3.40871 5.28816 3.48725 5.51692 3.67287 6.22747L5.69567 13.9289H8.40731L12.5848 4.06638H9.87935L7.19509 10.7719L6.09978 5.08798C5.99931 4.43747 5.49047 4.06638 4.86767 4.06638H0.554718ZM13.6726 4.06638L11.5503 13.9289H14.1301L16.245 4.06634L13.6726 4.06638ZM28.0612 4.06638C27.4391 4.06638 27.1095 4.39529 26.8676 4.97009L23.088 13.9289H25.7934L26.3168 12.4357H29.6128L29.9311 13.9289H32.3182L30.2357 4.06638H28.0612ZM28.413 6.73093L29.2149 10.4318H27.0665L28.413 6.73093Z"
        fill="#1434CB"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_5607_13291">
        <rect width="32" height="17.4545" fill="white" transform="translate(0.5 0.272949)"></rect>
      </clipPath>
    </defs>
  </svg>
)

const PayPalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="33"
    height="32"
    viewBox="0 0 33 32"
    fill="none"
    className="w-full h-full"
  >
    <rect x="0.5" width="32" height="32" rx="16" fill="#1B4BF1"></rect>
    <path
      opacity="0.5"
      d="M23.2413 12.5812C23.457 11.1743 23.2413 10.2365 22.4861 9.37074C21.6589 8.39679 20.1486 8 18.2066 8H12.6326C12.237 8 11.9133 8.28858 11.8414 8.68537L9.50392 23.4749C9.46796 23.7635 9.68373 24.016 9.97142 24.016H13.4237L13.172 25.5311C13.136 25.7836 13.3159 26 13.6035 26H16.5164C16.8761 26 17.1637 25.7475 17.1997 25.4228L17.8111 21.5992C17.847 21.2745 18.1707 21.022 18.4943 21.022H18.9259C21.7309 21.022 23.9605 19.8677 24.6078 16.5491C24.8595 15.1784 24.7516 13.988 24.0324 13.1944C23.8166 12.9419 23.5649 12.7615 23.2413 12.5812Z"
      fill="white"
    ></path>
    <path
      d="M23.2413 12.5812C23.457 11.1743 23.2413 10.2365 22.4861 9.37074C21.6589 8.39679 20.1486 8 18.2066 8H12.6326C12.237 8 11.9133 8.28858 11.8414 8.68537L9.50392 23.4749C9.46796 23.7635 9.68373 24.016 9.97142 24.016H13.4237L14.2509 18.6774C14.3228 18.2806 14.6464 17.992 15.042 17.992H16.6962C19.9328 17.992 22.4501 16.6934 23.1693 12.8697C23.2053 12.7976 23.2053 12.6894 23.2413 12.5812Z"
      fill="white"
    ></path>
  </svg>
)

const paymentMethods = [
  {
    id: "pm_1",
    type: "Mastercard",
    last4: "9029",
    expiry: "01/24",
    isDefault: true,
    icon: <MastercardIcon />,
    color: "bg-white",
  },
  {
    id: "pm_2",
    type: "Visa",
    last4: "4328",
    expiry: "01/25",
    isDefault: false,
    icon: <VisaIcon />,
    color: "bg-white",
  },
  {
    id: "pm_3",
    type: "Paypal",
    email: "name@example.com",
    isDefault: false,
    icon: <PayPalIcon />,
    color: "bg-white",
  },
]

const transactions = [
  {
    id: "TRX001",
    date: "2024-11-15",
    customer: "Alice Johnson",
    amount: 99.99,
    status: "Completed",
    method: "Credit Card",
  },
  {
    id: "TRX002",
    date: "2024-11-14",
    customer: "Bob Smith",
    amount: 149.99,
    status: "Completed",
    method: "PayPal",
  },
  {
    id: "TRX003",
    date: "2024-11-13",
    customer: "Carol Williams",
    amount: 79.99,
    status: "Pending",
    method: "Stripe",
  },
]

export default function PaymentsPage() {
  const [methods, setMethods] = useState(paymentMethods)

  const handleMakeDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === id,
      })),
    )
  }

  const handleDelete = (id: string) => {
    setMethods((prev) => prev.filter((method) => method.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage payment methods and transactions</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </div>
          <Button className="bg-[#CD7F32] hover:bg-[#B86F28] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add New Card
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {methods.map((method) => (
              <Card
                key={method.id}
                className="relative overflow-hidden border-2 hover:border-[#CD7F32] transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center p-1 border border-gray-200`}
                      >
                        {method.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#1A1A1A]">{method.type}</p>
                          {method.isDefault && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        {method.last4 ? (
                          <>
                            <p className="text-sm text-[#6B7280]">**** **** **** {method.last4}</p>
                            <p className="text-xs text-[#6B7280]">Expiry {method.expiry}</p>
                          </>
                        ) : (
                          <p className="text-sm text-[#6B7280]">{method.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMakeDefault(method.id)}
                        className="text-xs"
                      >
                        Make Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-xs bg-transparent">
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>View all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.id}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.customer}</TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.status === "Completed" ? "default" : "secondary"}
                      className={
                        transaction.status === "Completed"
                          ? "bg-[#CD7F32] hover:bg-[#B86F28] text-white"
                          : "bg-[#6B7280] hover:bg-[#6B7280] text-white"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
