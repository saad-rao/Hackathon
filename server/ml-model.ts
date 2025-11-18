import type { InsertClient } from "@shared/schema";

interface TrainingData {
  monthlyIncome: number;
  hasExistingLoans: number;
  employmentStatus: number;
  riskScore: number;
}

function employmentToNumber(status: string): number {
  if (status === "salaried") return 0;
  if (status === "self-employed") return 1;
  return 2;
}

function generateSyntheticData(): TrainingData[] {
  const data: TrainingData[] = [];
  
  for (let i = 0; i < 200; i++) {
    const income = Math.random() * 100000;
    const hasLoans = Math.random() > 0.5 ? 1 : 0;
    const employment = Math.floor(Math.random() * 3);
    
    let score = 0;
    if (income < 30000) score += 2;
    if (hasLoans === 1) score += 2;
    if (employment === 2) score += 3;
    
    score += Math.random() * 2;
    
    data.push({
      monthlyIncome: income,
      hasExistingLoans: hasLoans,
      employmentStatus: employment,
      riskScore: Math.min(10, Math.max(0, score)),
    });
  }
  
  return data;
}

class SimpleRandomForest {
  private trainingData: TrainingData[];
  
  constructor() {
    this.trainingData = generateSyntheticData();
  }
  
  predict(features: Omit<TrainingData, "riskScore">): number {
    const k = 5;
    const distances = this.trainingData.map((point) => {
      const incomeNorm = (point.monthlyIncome - features.monthlyIncome) / 50000;
      const loansNorm = point.hasExistingLoans - features.hasExistingLoans;
      const employmentNorm = point.employmentStatus - features.employmentStatus;
      
      const distance = Math.sqrt(
        incomeNorm * incomeNorm +
        loansNorm * loansNorm * 2 +
        employmentNorm * employmentNorm * 3
      );
      
      return { distance, score: point.riskScore };
    });
    
    const nearest = distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k);
    
    const avgScore = nearest.reduce((sum, p) => sum + p.score, 0) / k;
    return avgScore;
  }
}

const model = new SimpleRandomForest();

export function calculateRiskScore(client: InsertClient): { riskScore: number; riskLevel: string } {
  let ruleBasedScore = 0;
  
  if (client.monthlyIncome < 30000) {
    ruleBasedScore += 2;
  }
  
  if (client.hasExistingLoans) {
    ruleBasedScore += 2;
  }
  
  if (client.employmentStatus === "unemployed") {
    ruleBasedScore += 3;
  } else if (client.employmentStatus === "self-employed") {
    ruleBasedScore += 1;
  }
  
  const mlScore = model.predict({
    monthlyIncome: client.monthlyIncome,
    hasExistingLoans: client.hasExistingLoans ? 1 : 0,
    employmentStatus: employmentToNumber(client.employmentStatus),
  });
  
  const finalScore = Math.round((ruleBasedScore + mlScore) / 2);
  const clampedScore = Math.min(10, Math.max(0, finalScore));
  
  let riskLevel: string;
  if (clampedScore <= 3) {
    riskLevel = "low";
  } else if (clampedScore <= 6) {
    riskLevel = "medium";
  } else {
    riskLevel = "high";
  }
  
  return { riskScore: clampedScore, riskLevel };
}
