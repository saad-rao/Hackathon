import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cnic: text("cnic").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  monthlyIncome: integer("monthly_income").notNull(),
  hasExistingLoans: boolean("has_existing_loans").notNull().default(false),
  employmentStatus: text("employment_status").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  loanType: text("loan_type").notNull(),
  durationMonths: integer("duration_months").notNull(),
  startDate: timestamp("start_date").notNull(),
  monthlyInstallment: decimal("monthly_installment", { precision: 12, scale: 2 }).notNull(),
  totalRepayable: decimal("total_repayable", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const installments = pgTable("installments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").notNull().references(() => loans.id),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amountDue: decimal("amount_due", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  riskScore: true,
  riskLevel: true,
  createdAt: true,
}).extend({
  cnic: z.string().length(13, "CNIC must be exactly 13 digits").regex(/^\d+$/, "CNIC must contain only digits"),
  monthlyIncome: z.number().min(1, "Monthly income must be greater than 0"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  monthlyInstallment: true,
  totalRepayable: true,
  status: true,
  createdAt: true,
}).extend({
  amount: z.string().min(1, "Loan amount is required"),
  durationMonths: z.number().min(1, "Duration must be at least 1 month").max(60, "Duration cannot exceed 60 months"),
});

export const updateInstallmentSchema = z.object({
  status: z.enum(["paid", "pending", "overdue"]),
  paidDate: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

export type Installment = typeof installments.$inferSelect;
export type UpdateInstallment = z.infer<typeof updateInstallmentSchema>;

export type LoanWithClient = Loan & { client: Client };
export type LoanWithInstallments = Loan & { installments: Installment[] };
export type LoanWithDetails = Loan & { client: Client; installments: Installment[] };

export type DashboardStats = {
  totalClients: number;
  activeLoans: number;
  totalDisbursed: string;
  totalCollected: string;
  overdueLoans: number;
};

export type RiskDistribution = {
  low: number;
  medium: number;
  high: number;
};

export type RecentActivity = {
  id: string;
  type: "loan_created" | "payment_made";
  description: string;
  amount?: string;
  timestamp: string;
};
