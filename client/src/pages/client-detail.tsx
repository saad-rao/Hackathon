import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Phone, MapPin, Wallet, Briefcase } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Client, LoanWithInstallments } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ClientDetail() {
  const { id } = useParams();
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", id],
  });

  const { data: loans, isLoading: loansLoading } = useQuery<LoanWithInstallments[]>({
    queryKey: ["/api/clients", id, "loans"],
  });

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/clients">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {client?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "NA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl" data-testid="text-client-name">{client.name}</CardTitle>
                  <p className="text-sm font-mono text-muted-foreground mt-1">{client.cnic}</p>
                </div>
                <RiskBadge level={client.riskLevel as "low" | "medium" | "high"} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-mono">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p>{client.address}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Wallet className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="font-semibold font-mono">{client.monthlyIncome.toLocaleString()} PKR</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Employment Status</p>
                  <p className="capitalize">{client.employmentStatus}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Existing Loans</p>
                  <p>{client.hasExistingLoans ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Risk Score</p>
                <p className="text-3xl font-bold mt-1">{client.riskScore}</p>
              </div>
              <RiskBadge level={client.riskLevel as "low" | "medium" | "high"} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Loan History</CardTitle>
          <Link href={`/loans/new?clientId=${client.id}`}>
            <Button size="sm" data-testid="button-create-loan">
              Create Loan
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loansLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : loans && loans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="capitalize font-medium">{loan.loanType}</TableCell>
                    <TableCell className="font-mono">{loan.amount} PKR</TableCell>
                    <TableCell>{loan.durationMonths} months</TableCell>
                    <TableCell className="capitalize">{loan.status}</TableCell>
                    <TableCell>
                      {new Date(loan.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No loans found for this client</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
