import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { insertLoanSchema, type InsertLoan, type LoanWithInstallments, type Client } from "@shared/schema";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";

export default function LoanForm() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createdLoan, setCreatedLoan] = useState<LoanWithInstallments | null>(null);

  const urlParams = new URLSearchParams(search);
  const preselectedClientId = urlParams.get("clientId");

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<InsertLoan>({
    resolver: zodResolver(insertLoanSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      amount: "",
      loanType: "business",
      durationMonths: 12,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchedClientId = form.watch("clientId");

  useEffect(() => {
    if (watchedClientId && clients) {
      const client = clients.find((c) => c.id === watchedClientId);
      setSelectedClient(client || null);
    }
  }, [watchedClientId, clients]);

  const getMaxLoanAmount = () => {
    if (!selectedClient) return 0;
    const riskLevel = selectedClient.riskLevel;
    if (riskLevel === "low") return 300000;
    if (riskLevel === "medium") return 150000;
    return 50000;
  };

  const createLoanMutation = useMutation({
    mutationFn: async (data: InsertLoan) => {
      const result = await apiRequest<LoanWithInstallments>("POST", "/api/loans", data);
      return result;
    },
    onSuccess: (data) => {
      setCreatedLoan(data);
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      toast({
        title: "Loan created successfully",
        description: "Repayment schedule has been generated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create loan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLoan) => {
    createLoanMutation.mutate(data);
  };

  if (createdLoan) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/loans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Loans
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Loan Created Successfully</CardTitle>
            <CardDescription>
              Repayment schedule has been generated with 15% flat profit rate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="text-xl font-bold font-mono">{createdLoan.amount} PKR</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-bold">{createdLoan.durationMonths} months</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Installment</p>
                <p className="text-xl font-bold font-mono">{createdLoan.monthlyInstallment} PKR</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Repayable</p>
                <p className="text-xl font-bold font-mono">{createdLoan.totalRepayable} PKR</p>
              </div>
            </div>

            <Link href={`/loans/${createdLoan.id}`}>
              <Button className="w-full" data-testid="button-view-schedule">
                View Full Repayment Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/loans">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Loans
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Loan</CardTitle>
          <CardDescription>
            Generate a loan with automatic repayment schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.cnic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedClient && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>AI Recommendation</AlertTitle>
                  <AlertDescription>
                    Based on <strong>{selectedClient.name}'s</strong> risk level ({selectedClient.riskLevel}), 
                    the recommended maximum loan amount is{" "}
                    <strong className="font-mono">{getMaxLoanAmount().toLocaleString()} PKR</strong>.
                    {selectedClient.riskLevel === "high" && (
                      <span className="block mt-2 text-destructive font-medium">
                        ⚠️ Warning: This client has a high default risk. Proceed with caution.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount (PKR)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="100000"
                          {...field}
                          className="font-mono"
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loanType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-loan-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="durationMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="12"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-muted rounded-md text-sm">
                <p className="font-medium mb-2">Profit Rate Information</p>
                <p className="text-muted-foreground">
                  This system uses a 15% flat profit rate, common in Pakistani microfinance institutions.
                  The repayment schedule will be automatically generated with equal monthly installments.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createLoanMutation.isPending}
                data-testid="button-submit-loan"
              >
                {createLoanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Loan...
                  </>
                ) : (
                  "Create Loan & Generate Schedule"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
