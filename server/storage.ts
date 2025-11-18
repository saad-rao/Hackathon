import {
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Loan,
  type InsertLoan,
  type Installment,
  type UpdateInstallment,
  type LoanWithClient,
  type LoanWithInstallments,
  type LoanWithDetails,
  type DashboardStats,
  type RiskDistribution,
  type RecentActivity,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getClient(id: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient & { riskScore: number; riskLevel: string }): Promise<Client>;

  getLoan(id: string): Promise<Loan | undefined>;
  getLoans(): Promise<Loan[]>;
  getLoanWithClient(id: string): Promise<LoanWithClient | undefined>;
  getLoansWithClient(): Promise<LoanWithClient[]>;
  getLoanWithDetails(id: string): Promise<LoanWithDetails | undefined>;
  getClientLoans(clientId: string): Promise<LoanWithInstallments[]>;
  createLoan(loan: Omit<Loan, "id" | "createdAt">): Promise<Loan>;

  getInstallments(loanId: string): Promise<Installment[]>;
  createInstallment(installment: Omit<Installment, "id" | "createdAt">): Promise<Installment>;
  updateInstallment(id: string, update: UpdateInstallment): Promise<Installment>;

  getDashboardStats(): Promise<DashboardStats>;
  getRiskDistribution(): Promise<RiskDistribution>;
  getRecentActivity(): Promise<RecentActivity[]>;
  getOverdueLoans(): Promise<LoanWithClient[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private loans: Map<string, Loan>;
  private installments: Map<string, Installment>;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.loans = new Map();
    this.installments = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createClient(client: InsertClient & { riskScore: number; riskLevel: string }): Promise<Client> {
    const id = randomUUID();
    const newClient: Client = {
      ...client,
      id,
      createdAt: new Date(),
    };
    this.clients.set(id, newClient);
    return newClient;
  }

  async getLoan(id: string): Promise<Loan | undefined> {
    return this.loans.get(id);
  }

  async getLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getLoanWithClient(id: string): Promise<LoanWithClient | undefined> {
    const loan = this.loans.get(id);
    if (!loan) return undefined;
    const client = this.clients.get(loan.clientId);
    if (!client) return undefined;
    return { ...loan, client };
  }

  async getLoansWithClient(): Promise<LoanWithClient[]> {
    const loans = await this.getLoans();
    const loansWithClient: LoanWithClient[] = [];
    for (const loan of loans) {
      const client = this.clients.get(loan.clientId);
      if (client) {
        loansWithClient.push({ ...loan, client });
      }
    }
    return loansWithClient;
  }

  async getLoanWithDetails(id: string): Promise<LoanWithDetails | undefined> {
    const loan = this.loans.get(id);
    if (!loan) return undefined;
    const client = this.clients.get(loan.clientId);
    if (!client) return undefined;
    const installments = await this.getInstallments(loan.id);
    return { ...loan, client, installments };
  }

  async getClientLoans(clientId: string): Promise<LoanWithInstallments[]> {
    const loans = Array.from(this.loans.values()).filter((l) => l.clientId === clientId);
    const loansWithInstallments: LoanWithInstallments[] = [];
    for (const loan of loans) {
      const installments = await this.getInstallments(loan.id);
      loansWithInstallments.push({ ...loan, installments });
    }
    return loansWithInstallments;
  }

  async createLoan(loan: Omit<Loan, "id" | "createdAt">): Promise<Loan> {
    const id = randomUUID();
    const newLoan: Loan = {
      ...loan,
      id,
      createdAt: new Date(),
    };
    this.loans.set(id, newLoan);
    return newLoan;
  }

  async getInstallments(loanId: string): Promise<Installment[]> {
    return Array.from(this.installments.values())
      .filter((i) => i.loanId === loanId)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  async createInstallment(installment: Omit<Installment, "id" | "createdAt">): Promise<Installment> {
    const id = randomUUID();
    const newInstallment: Installment = {
      ...installment,
      id,
      createdAt: new Date(),
    };
    this.installments.set(id, newInstallment);
    return newInstallment;
  }

  async updateInstallment(id: string, update: UpdateInstallment): Promise<Installment> {
    const installment = this.installments.get(id);
    if (!installment) {
      throw new Error("Installment not found");
    }
    const updated: Installment = {
      ...installment,
      status: update.status,
      paidDate: update.paidDate ? new Date(update.paidDate) : installment.paidDate,
    };
    this.installments.set(id, updated);
    return updated;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const clients = await this.getClients();
    const loans = await this.getLoans();
    const activeLoans = loans.filter((l) => l.status === "active");

    const totalDisbursed = loans.reduce((sum, loan) => sum + parseFloat(loan.amount.toString()), 0);

    let totalCollected = 0;
    for (const loan of loans) {
      const installments = await this.getInstallments(loan.id);
      const paidInstallments = installments.filter((i) => i.status === "paid");
      totalCollected += paidInstallments.reduce((sum, i) => sum + parseFloat(i.amountDue.toString()), 0);
    }

    const overdueLoans = (await this.getOverdueLoans()).length;

    return {
      totalClients: clients.length,
      activeLoans: activeLoans.length,
      totalDisbursed: totalDisbursed.toFixed(2),
      totalCollected: totalCollected.toFixed(2),
      overdueLoans,
    };
  }

  async getRiskDistribution(): Promise<RiskDistribution> {
    const clients = await this.getClients();
    return {
      low: clients.filter((c) => c.riskLevel === "low").length,
      medium: clients.filter((c) => c.riskLevel === "medium").length,
      high: clients.filter((c) => c.riskLevel === "high").length,
    };
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    const loans = await this.getLoans();
    const activities: RecentActivity[] = [];

    for (const loan of loans.slice(0, 10)) {
      const client = await this.getClient(loan.clientId);
      if (client) {
        activities.push({
          id: randomUUID(),
          type: "loan_created",
          description: `Loan created for ${client.name}`,
          amount: loan.amount.toString(),
          timestamp: loan.createdAt.toISOString(),
        });
      }
    }

    for (const installment of Array.from(this.installments.values())) {
      if (installment.status === "paid" && installment.paidDate) {
        const loan = await this.getLoan(installment.loanId);
        if (loan) {
          const client = await this.getClient(loan.clientId);
          if (client) {
            activities.push({
              id: randomUUID(),
              type: "payment_made",
              description: `Payment received from ${client.name}`,
              amount: installment.amountDue.toString(),
              timestamp: installment.paidDate.toISOString(),
            });
          }
        }
      }
    }

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  async getOverdueLoans(): Promise<LoanWithClient[]> {
    const loans = await this.getLoansWithClient();
    const overdueLoans: LoanWithClient[] = [];

    for (const loan of loans) {
      const installments = await this.getInstallments(loan.id);
      const hasOverdue = installments.some((i) => i.status === "overdue");
      if (hasOverdue) {
        overdueLoans.push(loan);
      }
    }

    return overdueLoans;
  }
}

export const storage = new MemStorage();
