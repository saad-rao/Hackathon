import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "lucide-react";
import type { LoanWithClient } from "@shared/schema";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/risk-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Repayments() {
  const { data: overdueLoans, isLoading: overdueLoading } = useQuery<LoanWithClient[]>({
    queryKey: ["/api/loans/overdue"],
  });

  const { data: activeLoans, isLoading: activeLoading } = useQuery<LoanWithClient[]>({
    queryKey: ["/api/loans"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-repayments-title">Repayments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage loan repayment schedules
        </p>
      </div>

      <Tabs defaultValue="overdue" className="w-full">
        <TabsList>
          <TabsTrigger value="overdue" data-testid="tab-overdue">
            Overdue ({overdueLoans?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            All Active Loans ({activeLoans?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {overdueLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : overdueLoans && overdueLoans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Monthly Installment</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.client.name}</TableCell>
                        <TableCell className="font-mono text-sm">{loan.client.cnic}</TableCell>
                        <TableCell className="capitalize">{loan.loanType}</TableCell>
                        <TableCell className="font-mono font-semibold">{loan.amount} PKR</TableCell>
                        <TableCell className="font-mono">{loan.monthlyInstallment} PKR</TableCell>
                        <TableCell>
                          <RiskBadge level={loan.client.riskLevel as "low" | "medium" | "high"} showIcon={false} />
                        </TableCell>
                        <TableCell>
                          <Link href={`/loans/${loan.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-loan-${loan.id}`}>
                              View Schedule
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No overdue loans</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All installments are up to date
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {activeLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : activeLoans && activeLoans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Monthly Installment</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.client.name}</TableCell>
                        <TableCell className="font-mono text-sm">{loan.client.cnic}</TableCell>
                        <TableCell className="capitalize">{loan.loanType}</TableCell>
                        <TableCell className="font-mono font-semibold">{loan.amount} PKR</TableCell>
                        <TableCell className="font-mono">{loan.monthlyInstallment} PKR</TableCell>
                        <TableCell>{loan.durationMonths} months</TableCell>
                        <TableCell>
                          <RiskBadge level={loan.client.riskLevel as "low" | "medium" | "high"} showIcon={false} />
                        </TableCell>
                        <TableCell>
                          <Link href={`/loans/${loan.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-loan-${loan.id}`}>
                              View Schedule
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No active loans</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a loan to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
