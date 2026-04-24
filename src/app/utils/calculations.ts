// src/app/utils/calculations.ts
import type {
  ConsortiumConfig,
  ProjectConfig,
  ScoreResult,
  QuantitativeScores,
  AdjustmentScores,
  ConsortiumMember,
} from '../types/simulation';

export function getCreditGradeScore(grade: string, isMainContractor: boolean): number {
  if (isMainContractor) {
    switch (grade) {
      case 'AAA': case 'AA+': case 'AA0': case 'AA-':
      case 'A+': case 'A0': case 'A20': return 65;
      case 'A-': return 63;
      case 'BBB+': return 61;
      case 'BBB0': return 59;
      case 'BBB-': return 57;
      case 'BB+': return 55;
      case 'BB0': return 53;
      case 'BB-': return 51;
      case 'B+': return 49;
      case 'B0': return 47;
      case 'B-': return 45;
      case 'CCC': return 30;
      case 'CC': return 15;
      case 'C': return 5;
      case 'D': return 0;
      default: return 0;
    }
  } else {
    switch (grade) {
      case 'AAA': case 'AA+': case 'AA0': case 'AA-':
      case 'A+': case 'A0': case 'A-': case 'A20':
      case 'BBB+': case 'BBB0': case 'BBB-': return 65;
      case 'BB+': return 63;
      case 'BB0': return 61;
      case 'BB-': return 59;
      case 'B+': return 57;
      case 'B0': return 50;
      case 'B-': return 45;
      case 'CCC': return 30;
      case 'CC': return 15;
      case 'C': return 5;
      case 'D': return 0;
      default: return 0;
    }
  }
}

// 👇 회사채/기업어음 등급 인식 로직 대폭 강화 (A1, A20, AAA 등 다양한 텍스트 대응)
export function getBondRatingBonus(type: string | undefined | null, grade: string | null): number {
  if (!type || type === '없음' || !grade) return 0;
  
  const g = grade.toUpperCase().replace(/\s/g, '');

  if (type.includes('회사채')) {
    if (g.includes('AAA') || g.includes('AA') || g.includes('A+') || g.includes('A0') || g === 'A' || g.includes('A이상')) return 4;
    if (g.includes('A-') || g.includes('BBB+')) return 2;
    return 0;
  }
  
  if (type.includes('어음')) {
    if (g.includes('A1') || g.includes('A2+') || g.includes('A20') || g === 'A2' || g.includes('A2이상')) return 4;
    if (g.includes('A2-') || g.includes('A3+')) return 2;
    return 0;
  }
  
  return 0;
}

// 👇 CS 지수 로직 강화
export function csIndexToScore(index: number | null): number {
  if (index === null) return 0;
  if (index >= 80) return 4;
  if (index >= 75) return 3; 
  if (index > 0) return 2; 
  return 0;
}

// 👇 동반성장지수 텍스트 인식 로직 강화
export function mutualGrowthToScore(rating: string): number {
  if (rating.includes('최우수')) return 4;
  if (rating.includes('우수')) return 2;
  if (rating.includes('양호')) return 1;
  if (rating.includes('개선')) return 0;
  return 0;
}

export function safetyActivityToDeduction(score: number | null): number {
  if (score === null) return -2.0; 
  if (score >= 95) return 0;
  if (score >= 90) return -0.4;   
  if (score >= 85) return -0.8;   
  if (score >= 80) return -1.2;   
  if (score >= 75) return -1.6;   
  return -2.0;
}

export function deathRateRatioToDeduction(ratio: number): number {
  if (ratio <= 0.2) return 0;
  if (ratio <= 0.4) return -1.2;
  if (ratio <= 0.6) return -2.4;
  if (ratio <= 0.8) return -3.6;
  if (ratio <= 1.0) return -4.8;
  if (ratio <= 1.2) return -6.0;
  if (ratio <= 1.4) return -7.2;
  if (ratio <= 1.6) return -8.4;
  if (ratio <= 1.8) return -9.6;
  if (ratio <= 2.0) return -10.8;
  return -12.0;
}

export function safetyMgmtViolationToDeduction(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return -0.5;
  return -1.0;
}

export function accidentReportViolationToDeduction(count: number): number {
  return Math.max(count * -0.2, -2.0);
}

export function safetyLawViolationToDeduction(count: number): number {
  if (count >= 3) return -1.0;
  if (count === 2) return -0.5;
  return 0;
}

export function envViolationToDeduction(count: number): number {
  if (count >= 2) return -1.0;
  if (count === 1) return -0.5;
  return 0;
}

export function penaltyToDeduction(penalty: number): number {
  if (penalty === 0) return 0;
  if (penalty <= 3.0) return -4.0;
  if (penalty <= 6.0) return -8.0;
  return -12.0;
}

export function qualityDefectToDeduction(noticeCount: number): number {
  return -(noticeCount * 4);
}

export function qualityExcellentToBonus(noticeCount: number): number {
  return Math.min(noticeCount * 2, 6);
}

export function calcPerformanceScore(
  totalUnits: number,
  baseUnits: number
): number {
  const ratio = totalUnits / baseUnits;
  if (ratio >= 5.0) return 50;       
  if (ratio >= 4.0) return 48;
  if (ratio >= 3.0) return 46;
  if (ratio >= 2.0) return 44;
  if (ratio >= 1.0) return 42;
  return 40;
}

export function calcMainContractorPenalty(
  mainContractorUnits: number,
  projectUnits: number,
  equityShare: number
): number {
  const baseUnits = Math.round(projectUnits * (equityShare / 100));
  if (baseUnits === 0) return -15;

  const ratio = mainContractorUnits / baseUnits;
  if (ratio >= 5.0) return 0;   
  if (ratio >= 4.0) return -3;
  if (ratio >= 3.0) return -6;
  if (ratio >= 2.0) return -9;
  if (ratio >= 1.0) return -12;
  return -15;
}

export function calcSmeParticipationScore(budgetBillion: number): number {
  if (budgetBillion >= 300) return 6;
  if (budgetBillion >= 200) return 4;
  if (budgetBillion >= 100) return 2;
  return 0;
}

export function calcLhTechScore(count: number): number {
  return Math.min(count * 0.5, 3);
}

export function calcNewCompanyScore(members: ConsortiumMember[]): number {
  const rawScore = members.reduce((sum, m) => {
    if (!m.isNewCompany || m.equityShare < 10) return sum;
    return sum + (m.isMainContractor ? 4 : 1);
  }, 0);
  return Math.min(rawScore, 3);
}

export function illegalActivityToBonus(count: number): number {
  if (count >= 3) return 5;
  if (count === 2) return 3;
  if (count === 1) return 1;
  return 0;
}

export function calculateScores(
  consortium: ConsortiumConfig,
  project: ProjectConfig
): ScoreResult {
  const { members, financials } = consortium;

  const financialState =
    financials.profitability +
    financials.stability +
    financials.activity +
    financials.growth;

  const creditRating = members.reduce((sum, m) => {
    const gradeScore = getCreditGradeScore(m.creditGrade, m.isMainContractor);
    return sum + (gradeScore * project.creditMaxScore / 65) * (m.equityShare / 100);
  }, 0);

  const totalPerformance = members.reduce((sum, m) => sum + m.performanceUnits, 0);
  const businessPerformance = calcPerformanceScore(totalPerformance, project.units);

  const mainContractor = members.find((m) => m.isMainContractor);
  const mainContractorPenalty = mainContractor
    ? calcMainContractorPenalty(mainContractor.performanceUnits, project.units, mainContractor.equityShare)
    : 0;

  const smeProduct = project.smeProductMaxScore;

  const quantitative: QuantitativeScores = {
    financialState,
    creditRating,
    businessPerformance,
    mainContractorPenalty,
    smeProduct,
    total: financialState + creditRating + businessPerformance + mainContractorPenalty + smeProduct,
  };

  const accidentDeath = members.reduce((sum, m) => {
    const ratio = m.accidentDeathRate3yr / project.industryAvgDeathRate;
    const deduction = deathRateRatioToDeduction(ratio);
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const safetyActivity = members.reduce((sum, m) => {
    const deduction = safetyActivityToDeduction(m.safetyActivityScore);
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const safetyMgmtViolation = members.reduce((sum, m) => {
    const deduction = safetyMgmtViolationToDeduction(m.safetyMgmtViolations);
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const accidentReport = members.reduce((sum, m) => {
    const deduction = accidentReportViolationToDeduction(m.accidentReportViolations);
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const safetyLawViolation = members.reduce((sum, m) => {
    const deduction = safetyLawViolationToDeduction(m.safetyLawViolations);
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const envViolation = members.reduce((sum, m) => {
    const deduction = envViolationToDeduction(m.envViolations);
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const projectBaseBudget = parseInt(project.budget.replace(/,/g, '').match(/\d+/)?.[0] || '0', 10);
  const smeEquityTotal = members.filter((m) => m.isSME).reduce((sum, m) => sum + m.equityShare, 0);
  const autoSmeBudget = projectBaseBudget * (smeEquityTotal / 100);
  const smeParticipation = calcSmeParticipationScore(autoSmeBudget);

  const lhSpecialTech = calcLhTechScore(consortium.lhSpecialTechCount);

  const csIndex = mainContractor ? csIndexToScore(mainContractor.csIndex) : 0;

  const bondRatingScore = mainContractor 
    ? getBondRatingBonus(mainContractor.bondTypeForBonus, mainContractor.bondRatingForBonus)
    : 0;

  const mutualGrowth = mainContractor
    ? mutualGrowthToScore(mainContractor.mutualGrowthRating)
    : 0;

  const newCompany = calcNewCompanyScore(members);

  const illegalActivity = illegalActivityToBonus(consortium.illegalActivityReports ?? 0);

  const businessPlan = members.reduce((sum, m) => {
    return sum + ((m.businessPlanViolations || 0) * -5) * (m.equityShare / 100);
  }, 0);

  const defectHandling = members.reduce((sum, m) => {
    return sum + (-Math.abs(m.defectHandlingPenalty || 0)) * (m.equityShare / 100);
  }, 0);

  const brand = consortium.brandApplication === 'main' ? 5 : 0;

  const osc = consortium.oscMaxScore ? 3 : 0;

  const qualityDefect = members.reduce((sum, m) => {
    if (m.qualityDefectNoticeScore === 0) return sum;
    const deduction = qualityDefectToDeduction(m.qualityDefectNoticeScore); 
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const qualityExcellent = members.reduce((sum, m) => {
    if (m.qualityExcellentNoticeScore === 0) return sum;
    const bonus = qualityExcellentToBonus(m.qualityExcellentNoticeScore);
    return sum + bonus * (m.equityShare / 100);
  }, 0);

  const penalty = members.reduce((sum, m) => {
    if (m.penaltyScore === 0) return sum;
    const deduction = penaltyToDeduction(m.penaltyScore);
    return sum + deduction * (m.equityShare / 100);
  }, 0);

  const adjustmentTotal =
    accidentDeath + safetyActivity + safetyMgmtViolation +
    accidentReport + safetyLawViolation + envViolation +
    smeParticipation + lhSpecialTech + csIndex + bondRatingScore +
    mutualGrowth + newCompany + illegalActivity + businessPlan +
    defectHandling + brand + osc + qualityDefect + qualityExcellent + penalty;

  const adjustment: AdjustmentScores = {
    accidentDeath,
    safetyActivity,
    safetyMgmtViolation,
    accidentReport,
    safetyLawViolation,
    envViolation,
    smeParticipation,
    lhSpecialTech,
    csIndex,
    bondRating: bondRatingScore,
    mutualGrowth,
    newCompany,
    illegalActivity,
    businessPlan,
    defectHandling,
    brand,
    osc,
    qualityDefect,
    qualityExcellent,
    penalty,
    total: adjustmentTotal,
  };

  const quantitativeTotal = quantitative.total;
  const combinedTotal = quantitativeTotal + adjustmentTotal;
  const grandTotal = combinedTotal + consortium.nonQuantitativeScore + consortium.priceScore;

  return {
    quantitative,
    adjustment,
    quantitativeTotal,
    adjustmentTotal,
    combinedTotal,
    nonQuantitative: consortium.nonQuantitativeScore,
    priceEvaluation: consortium.priceScore,
    grandTotal,
  };
}

export function fmt(n: number, decimals = 2): string {
  if (typeof n !== 'number' || isNaN(n)) return '0.00';
  return n.toFixed(decimals);
}

export function fmtDiff(n: number, decimals = 2): string {
  if (typeof n !== 'number' || isNaN(n)) return '0.00';
  return (n >= 0 ? '+' : '') + n.toFixed(decimals);
}

export function getConsortiumName(consortium: ConsortiumConfig): string {
  const main = consortium.members.find((m) => m.isMainContractor);
  return main && main.name ? `${main.name} 컨소시엄` : 'oo건설 컨소시엄';
}

export function getShortName(consortium: ConsortiumConfig): string {
  const main = consortium.members.find((m) => m.isMainContractor);
  return main && main.name ? main.name : 'oo건설';
}