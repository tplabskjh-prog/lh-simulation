// src/app/types/simulation.ts

export type CreditGrade =
  | 'AAA' | 'AA+' | 'AA0' | 'AA-'
  | 'A+' | 'A0' | 'A-' | 'A20'
  | 'BBB+' | 'BBB0' | 'BBB-'
  | 'BB+' | 'BB0' | 'BB-'
  | 'B+' | 'B0' | 'B-'
  | 'CCC' | 'CC' | 'C' | 'D';

export type MutualGrowthRating = '최우수' | '우수' | '양호' | '개선' | '해당없음';

export interface ConsortiumMember {
  id: string;
  name: string;
  equityShare: number;
  isMainContractor: boolean;
  isSME: boolean;

  creditType: 'CP' | 'Corporate' | 'Bond';
  creditGrade: CreditGrade;
  performanceUnits: number;
  accidentDeathRate3yr: number;
  safetyActivityScore: number | null;

  safetyMgmtViolations: number;
  accidentReportViolations: number;
  safetyLawViolations: number;
  envViolations: number;

  qualityDefectNoticeScore: number;
  qualityExcellentNoticeScore: number;
  penaltyScore: number;
  isNewCompany: boolean;
  csIndex: number | null;

  bondTypeForBonus: '회사채' | '기업어음' | '없음'; 
  bondRatingForBonus: string | null;
  
  mutualGrowthRating: MutualGrowthRating;

  businessPlanViolations: number; 
  defectHandlingPenalty: number;  
}

export interface ConsortiumConfig {
  id: string;
  name: string;
  colorScheme: 'blue' | 'orange';
  members: ConsortiumMember[];

  financials: {
    profitability: number;
    stability: number;
    activity: number;
    growth: number;
  };

  smeParticipationBudget: number;
  lhSpecialTechCount: number;
  oscMaxScore: boolean;
  illegalActivityReports: number;

  brandApplication: 'main' | 'rental' | 'none';

  nonQuantitativeScore: number;
  priceScore: number;
}

// 👇 회차(Phase) 데이터 타입 추가
export interface PhaseConfig {
  id: string;
  name: string;
}

export interface ProjectConfig {
  id: string;
  phaseId: string; // 👇 어느 회차에 속하는지 식별
  name: string;
  type: string;
  units: number;
  budget: string;
  area: string;
  completionDate: string;

  creditMaxScore: number;
  accidentDeathMaxPenalty: number;
  smeProductMaxScore: number;
  industryAvgDeathRate: number;
}

export interface QuantitativeScores {
  financialState: number;
  creditRating: number;
  businessPerformance: number;
  mainContractorPenalty: number;
  smeProduct: number;
  total: number;
}

export interface AdjustmentScores {
  accidentDeath: number;
  safetyActivity: number;
  safetyMgmtViolation: number;
  accidentReport: number;
  safetyLawViolation: number;
  envViolation: number;
  smeParticipation: number;
  lhSpecialTech: number;
  csIndex: number;
  bondRating: number;
  mutualGrowth: number;
  newCompany: number;
  illegalActivity: number;
  businessPlan: number;
  defectHandling: number;
  brand: number; 
  osc: number;
  qualityDefect: number;
  qualityExcellent: number;
  penalty: number;
  total: number;
}

export interface ScoreResult {
  quantitative: QuantitativeScores;
  adjustment: AdjustmentScores;
  quantitativeTotal: number;
  adjustmentTotal: number;
  combinedTotal: number;
  nonQuantitative: number;
  priceEvaluation: number;
  grandTotal: number;
}