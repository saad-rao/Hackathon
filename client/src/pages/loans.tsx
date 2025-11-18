import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wallet } from "lucide-react";
import type { LoanWithClient } from "@shared/schema";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/risk-badge";

export default function Loans() {
  const { data: loans, isLoading } = useQuery<LoanWithClient[]>({
    queryKey: ["/api/loans"],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-loans-title">Loans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all active and completed loans
          </p>
        </div>
        <Link href="/loans/new">
          <Button data-testid="button-add-loan">
            <Plus className="w-4 h-4 mr-2" />
            Create Loan
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : loans && loans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>CNIC</TableHead>
                  <TableHead>Loan Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Monthly Installment</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.client.name}</TableCell>
                    <TableCell className="font-mono text-sm">{loan.client.cnic}</TableCell>
                    <TableCell className="capitalize">{loan.loanType}</TableCell>
                    <TableCell className="font-mono font-semibold">{loan.amount} PKR</TableCell>
                    <TableCell>{loan.durationMonths} months</TableCell>
                    <TableCell className="font-mono">{loan.monthlyInstallment} PKR</TableCell>
                    <TableCell>
                      <RiskBadge level={loan.client.riskLevel as "low" | "medium" | "high"} showIcon={false} />
                    </TableCell>
                    <TableCell>
                      <span className="capitalize px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        {loan.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-loan-${loan.id}`}>
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No loans found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first loan to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
