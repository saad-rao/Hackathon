import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, User, Calendar, TrendingUp } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { LoanWithDetails } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function LoanDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loan, isLoading } = useQuery<LoanWithDetails>({
    queryKey: ["/api/loans", id],
  });

  const markPaidMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      await apiRequest("POST", `/api/installments/${installmentId}/mark-paid`, {
        status: "paid",
        paidDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/overdue"] });
      toast({
        title: "Payment recorded",
        description: "Installment marked as paid successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loan not found</p>
      </div>
    );
  }

  const overdueCount = loan.installments.filter((i) => i.status === "overdue").length;
  const hasConsecutiveOverdue = loan.installments
    .sort((a, b) => a.installmentNumber - b.installmentNumber)
    .reduce((acc, curr, idx, arr) => {
      if (acc >= 2) return acc;
      if (curr.status === "overdue" && idx > 0 && arr[idx - 1].status === "overdue") {
        return acc + 1;
      }
      return curr.status === "overdue" ? 1 : 0;
    }, 0) >= 2;

  const showDefaultWarning = hasConsecutiveOverdue || loan.client.riskLevel === "high";

  return (
    <div className="space-y-6">
      <Link href="/loans">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Loans
        </Button>
      </Link>

      {showDefaultWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Default Risk</AlertTitle>
          <AlertDescription>
            {hasConsecutiveOverdue && "This loan has 2+ consecutive overdue installments. "}
            {loan.client.riskLevel === "high" && "Client has a high-risk profile. "}
            Immediate follow-up recommended.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="text-xl font-bold font-mono" data-testid="text-loan-amount">{loan.amount} PKR</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-bold">{loan.durationMonths} months</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Installment</p>
                <p className="text-xl font-bold font-mono">{loan.monthlyInstallment} PKR</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Repayable</p>
                <p className="text-xl font-bold font-mono">{loan.totalRepayable} PKR</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {new Date(loan.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Loan Type</p>
                  <p className="font-medium capitalize">{loan.loanType}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{loan.client.name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNIC</p>
              <p className="font-mono text-sm">{loan.client.cnic}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <div className="mt-2">
                <RiskBadge level={loan.client.riskLevel as "low" | "medium" | "high"} />
              </div>
            </div>
            <Link href={`/clients/${loan.client.id}`}>
              <Button variant="outline" className="w-full" size="sm">
                View Client Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repayment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Installment</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.installments
                .sort((a, b) => a.installmentNumber - b.installmentNumber)
                .map((installment) => {
                  const dueDate = new Date(installment.dueDate);
                  const isPast = dueDate < new Date();
                  const isOverdue = installment.status === "overdue";

                  return (
                    <TableRow key={installment.id}>
                      <TableCell className="font-medium">
                        #{installment.installmentNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {dueDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          {isPast && installment.status !== "paid" && (
                            <p className="text-xs text-destructive mt-1">
                              {formatDistanceToNow(dueDate, { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {installment.amountDue} PKR
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={installment.status as "paid" | "pending" | "overdue"} />
                      </TableCell>
                      <TableCell>
                        {installment.paidDate ? (
                          <span className="text-sm">
                            {new Date(installment.paidDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {installment.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markPaidMutation.mutate(installment.id)}
                            disabled={markPaidMutation.isPending}
                            data-testid={`button-mark-paid-${installment.id}`}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
