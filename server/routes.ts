import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateToken, hashPassword, comparePassword, authMiddleware } from "./auth";
import { calculateRiskScore } from "./ml-model";
import { insertClientSchema, insertLoanSchema } from "@shared/schema";
import { z } from "zod";

async function seedData() {
  const existingUser = await storage.getUserByUsername("admin");
  if (!existingUser) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
    });
  }

  const existingClients = await storage.getClients();
  if (existingClients.length === 0) {
    const sampleClients = [
      { name: "Ahmed Khan", cnic: "3520212345678", phone: "03001234567", address: "Karachi, Sindh", monthlyIncome: 45000, hasExistingLoans: false, employmentStatus: "salaried" },
      { name: "Fatima Ali", cnic: "3520298765432", phone: "03009876543", address: "Lahore, Punjab", monthlyIncome: 25000, hasExistingLoans: true, employmentStatus: "self-employed" },
      { name: "Hassan Raza", cnic: "3520256781234", phone: "03005678123", address: "Islamabad", monthlyIncome: 60000, hasExistingLoans: false, employmentStatus: "salaried" },
      { name: "Ayesha Malik", cnic: "3520234567890", phone: "03003456789", address: "Faisalabad, Punjab", monthlyIncome: 20000, hasExistingLoans: true, employmentStatus: "unemployed" },
      { name: "Bilal Ahmed", cnic: "3520287654321", phone: "03008765432", address: "Multan, Punjab", monthlyIncome: 35000, hasExistingLoans: false, employmentStatus: "self-employed" },
      { name: "Sana Tariq", cnic: "3520245678901", phone: "03004567890", address: "Peshawar, KPK", monthlyIncome: 50000, hasExistingLoans: false, employmentStatus: "salaried" },
      { name: "Usman Farooq", cnic: "3520267890123", phone: "03006789012", address: "Rawalpindi, Punjab", monthlyIncome: 18000, hasExistingLoans: true, employmentStatus: "unemployed" },
      { name: "Maria Hussain", cnic: "3520278901234", phone: "03007890123", address: "Sialkot, Punjab", monthlyIncome: 55000, hasExistingLoans: false, employmentStatus: "salaried" },
      { name: "Kamran Shah", cnic: "3520289012345", phone: "03008901234", address: "Quetta, Balochistan", monthlyIncome: 30000, hasExistingLoans: true, employmentStatus: "self-employed" },
      { name: "Zainab Akhtar", cnic: "3520290123456", phone: "03009012345", address: "Gujranwala, Punjab", monthlyIncome: 42000, hasExistingLoans: false, employmentStatus: "salaried" },
    ];

    const clients = [];
    for (const clientData of sampleClients) {
      const { riskScore, riskLevel } = calculateRiskScore(clientData as any);
      const client = await storage.createClient({ ...clientData, riskScore, riskLevel });
      clients.push(client);
    }

    const sampleLoans = [
      { clientId: clients[0].id, amount: "150000", loanType: "business", durationMonths: 12, startDate: new Date("2024-01-15") },
      { clientId: clients[2].id, amount: "250000", loanType: "business", durationMonths: 24, startDate: new Date("2024-02-01") },
      { clientId: clients[5].id, amount: "100000", loanType: "personal", durationMonths: 12, startDate: new Date("2024-03-10") },
      { clientId: clients[7].id, amount: "200000", loanType: "agriculture", durationMonths: 18, startDate: new Date("2023-12-01") },
      { clientId: clients[1].id, amount: "80000", loanType: "personal", durationMonths: 12, startDate: new Date("2024-01-20") },
    ];

    for (const loanData of sampleLoans) {
      const amount = parseFloat(loanData.amount);
      const profitRate = 0.15;
      const totalRepayable = amount * (1 + profitRate);
      const monthlyInstallment = totalRepayable / loanData.durationMonths;

      const loan = await storage.createLoan({
        ...loanData,
        amount: amount.toString(),
        monthlyInstallment: monthlyInstallment.toFixed(2),
        totalRepayable: totalRepayable.toFixed(2),
        status: "active",
      });

      for (let i = 1; i <= loanData.durationMonths; i++) {
        const dueDate = new Date(loanData.startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const isPast = dueDate < new Date();
        let status = "pending";
        let paidDate: Date | undefined = undefined;

        if (i <= 2 && Math.random() > 0.3) {
          status = "paid";
          const paymentDate = new Date(dueDate);
          paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 5));
          paidDate = paymentDate;
        } else if (isPast && Math.random() > 0.6) {
          status = "paid";
          const paymentDate = new Date(dueDate);
          paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 3));
          paidDate = paymentDate;
        } else if (isPast) {
          status = "overdue";
        }

        await storage.createInstallment({
          loanId: loan.id,
          installmentNumber: i,
          dueDate,
          amountDue: monthlyInstallment.toFixed(2),
          status,
          paidDate,
        });
      }
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await seedData();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).send("Username and password required");
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).send("Invalid credentials");
      }

      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).send("Invalid credentials");
      }

      const token = generateToken({ userId: user.id, username: user.username });
      res.json({ token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/clients", authMiddleware, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/clients/:id", authMiddleware, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).send("Client not found");
      }
      res.json(client);
    } catch (error) {
      console.error("Get client error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.post("/api/clients", authMiddleware, async (req, res) => {
    try {
      const parsed = insertClientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send(parsed.error.message);
      }

      const { riskScore, riskLevel } = calculateRiskScore(parsed.data);
      const client = await storage.createClient({
        ...parsed.data,
        riskScore,
        riskLevel,
      });

      res.json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/clients/:id/loans", authMiddleware, async (req, res) => {
    try {
      const loans = await storage.getClientLoans(req.params.id);
      res.json(loans);
    } catch (error) {
      console.error("Get client loans error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/loans", authMiddleware, async (req, res) => {
    try {
      const loans = await storage.getLoansWithClient();
      res.json(loans);
    } catch (error) {
      console.error("Get loans error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/loans/overdue", authMiddleware, async (req, res) => {
    try {
      const loans = await storage.getOverdueLoans();
      res.json(loans);
    } catch (error) {
      console.error("Get overdue loans error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/loans/:id", authMiddleware, async (req, res) => {
    try {
      const loan = await storage.getLoanWithDetails(req.params.id);
      if (!loan) {
        return res.status(404).send("Loan not found");
      }
      res.json(loan);
    } catch (error) {
      console.error("Get loan error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.post("/api/loans", authMiddleware, async (req, res) => {
    try {
      const parsed = insertLoanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send(parsed.error.message);
      }

      const amount = parseFloat(parsed.data.amount);
      const profitRate = 0.15;
      const totalRepayable = amount * (1 + profitRate);
      const monthlyInstallment = totalRepayable / parsed.data.durationMonths;

      const loan = await storage.createLoan({
        clientId: parsed.data.clientId,
        amount: amount.toString(),
        loanType: parsed.data.loanType,
        durationMonths: parsed.data.durationMonths,
        startDate: new Date(parsed.data.startDate),
        monthlyInstallment: monthlyInstallment.toFixed(2),
        totalRepayable: totalRepayable.toFixed(2),
        status: "active",
      });

      const installments = [];
      for (let i = 1; i <= parsed.data.durationMonths; i++) {
        const dueDate = new Date(parsed.data.startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const installment = await storage.createInstallment({
          loanId: loan.id,
          installmentNumber: i,
          dueDate,
          amountDue: monthlyInstallment.toFixed(2),
          status: "pending",
          paidDate: undefined,
        });
        installments.push(installment);
      }

      res.json({ ...loan, installments });
    } catch (error) {
      console.error("Create loan error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.post("/api/installments/:id/mark-paid", authMiddleware, async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["paid", "pending", "overdue"]),
        paidDate: z.string().optional(),
      });

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send(parsed.error.message);
      }

      const installment = await storage.updateInstallment(req.params.id, parsed.data);
      res.json(installment);
    } catch (error) {
      console.error("Update installment error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/dashboard/risk-distribution", authMiddleware, async (req, res) => {
    try {
      const distribution = await storage.getRiskDistribution();
      res.json(distribution);
    } catch (error) {
      console.error("Get risk distribution error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/api/dashboard/recent-activity", authMiddleware, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Get recent activity error:", error);
      res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
