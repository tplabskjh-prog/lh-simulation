// ─────────────────────────────────────────────
// Core type definitions for LH 평가 Simulator
// ─────────────────────────────────────────────

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

  // 👇 여기가 원인입니다! 이 줄이 빠져있었습니다.
  bondTypeForBonus: '회사채' | '기업어음' | '없음'; 
  bondRatingForBonus: string | null;
  
  mutualGrowthRating: MutualGrowthRating;

  // [추가됨] 업체별 가감점 항목
  businessPlanViolations: number; // 사업계획 이행 노력도 위반 건수
  defectHandlingPenalty: number;  // 하자처리 이행 노력도 감점 (점수)
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

  // [추가됨] 브랜드 적용 여부
  brandApplication: 'main' | 'rental' | 'none';

  nonQuantitativeScore: number;
  priceScore: number;
}

export interface ProjectConfig {
  id: string;
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
  brand: number; // [추가됨]
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

export interface SimulationState {
  selectedProjectId: string;
  projects: ProjectConfig[];
  gsConsortium: ConsortiumConfig;
  dlConsortium: ConsortiumConfig;
}