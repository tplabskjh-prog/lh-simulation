// src/app/data/projectData.ts
import type { ProjectConfig, ConsortiumConfig, PhaseConfig, ConsortiumMember } from '../types/simulation';

// 1. 공모 회차 기본 데이터 (이름을 비워두어 '(회차명 작성)'이 뜨도록 함)
export const PHASES: PhaseConfig[] = [
  { id: '1-1', name: '' },
  { id: '1-2', name: '' },
  { id: '2-2', name: '' },
  { id: '2-5', name: '' },
];

// 2. 비어있는 블록(사업장) 생성 함수
const createEmptyBlock = (phaseId: string, id: string): ProjectConfig => ({
  id,
  phaseId,
  name: '',
  type: '일반형',
  units: 0,
  budget: '0억원',
  area: '',
  completionDate: '',
  creditMaxScore: 65,            // 평가 구조상 변하지 않는 배점 기준은 유지
  accidentDeathMaxPenalty: -12,  // 배점 기준 유지
  smeProductMaxScore: 15,        // 배점 기준 유지
  industryAvgDeathRate: 1.96,    // 업계 평균 상수 유지
});

export const PROJECTS: ProjectConfig[] = [
  // 1-1차 빈 블록 4개
  createEmptyBlock('1-1', '1-1-block1'),
  createEmptyBlock('1-1', '1-1-block2'),
  createEmptyBlock('1-1', '1-1-block3'),
  createEmptyBlock('1-1', '1-1-block4'),

  // 1-2차 빈 블록 4개
  createEmptyBlock('1-2', '1-2-block1'),
  createEmptyBlock('1-2', '1-2-block2'),
  createEmptyBlock('1-2', '1-2-block3'),
  createEmptyBlock('1-2', '1-2-block4'),

  // 2-2차 빈 블록 4개
  createEmptyBlock('2-2', '2-2-block1'),
  createEmptyBlock('2-2', '2-2-block2'),
  createEmptyBlock('2-2', '2-2-block3'),
  createEmptyBlock('2-2', '2-2-block4'),

  // 2-5차 빈 블록 4개
  createEmptyBlock('2-5', '2-5-block1'),
  createEmptyBlock('2-5', '2-5-block2'),
  createEmptyBlock('2-5', '2-5-block3'),
  createEmptyBlock('2-5', '2-5-block4'),
];

// 3. 비어있는 컨소시엄 멤버 템플릿 생성 함수
const createEmptyMember = (id: string, isMain: boolean = false): ConsortiumMember => ({
  id,
  name: '',
  equityShare: 0,
  isMainContractor: isMain,
  isSME: false,
  creditType: 'Corporate',
  creditGrade: 'B0',
  performanceUnits: 0,
  accidentDeathRate3yr: 0,
  safetyActivityScore: null,
  safetyMgmtViolations: 0,
  accidentReportViolations: 0,
  safetyLawViolations: 0,
  envViolations: 0,
  qualityDefectNoticeScore: 0,
  qualityExcellentNoticeScore: 0,
  penaltyScore: 0,
  isNewCompany: false,
  csIndex: null,
  bondTypeForBonus: '없음',
  bondRatingForBonus: null,
  mutualGrowthRating: '해당없음',
  businessPlanViolations: 0,
  defectHandlingPenalty: 0,
});

// 4. 초기화된 GS건설 측 컨소시엄 (이름만 남기고 데이터는 비움)
export const DEFAULT_GS_CONSORTIUM: ConsortiumConfig = {
  id: 'gs-consortium',
  name: 'GS건설 컨소시엄', 
  colorScheme: 'blue',
  members: [
    createEmptyMember('gs-1', true), // 주관사 슬롯
    createEmptyMember('gs-2'),
    createEmptyMember('gs-3'),
    createEmptyMember('gs-4'),
    createEmptyMember('gs-5'),
    createEmptyMember('gs-6'),
  ],
  financials: {
    profitability: 0,
    stability: 0,
    activity: 0,
    growth: 0,
  },
  smeParticipationBudget: 0,
  lhSpecialTechCount: 0,
  oscMaxScore: false,
  illegalActivityReports: 0,
  brandApplication: 'none',
  nonQuantitativeScore: 0, 
  priceScore: 200,
};

// 5. 초기화된 DL건설 측 컨소시엄 (이름만 남기고 데이터는 비움)
export const DEFAULT_DL_CONSORTIUM: ConsortiumConfig = {
  id: 'dl-consortium',
  name: 'DL건설 컨소시엄',
  colorScheme: 'orange',
  members: [
    createEmptyMember('dl-1', true), // 주관사 슬롯
    createEmptyMember('dl-2'),
    createEmptyMember('dl-3'),
    createEmptyMember('dl-4'),
    createEmptyMember('dl-5'),
    createEmptyMember('dl-6'),
  ],
  financials: {
    profitability: 0,
    stability: 0,
    activity: 0,
    growth: 0,
  },
  smeParticipationBudget: 0,
  lhSpecialTechCount: 0,
  oscMaxScore: false,
  illegalActivityReports: 0,
  brandApplication: 'none',
  nonQuantitativeScore: 0, 
  priceScore: 200,
};