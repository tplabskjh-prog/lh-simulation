// src/app/store/simulationStore.ts
import { create } from 'zustand';
import type { ConsortiumConfig, ConsortiumMember, ProjectConfig } from '../types/simulation';
import { fetchCompanyDB, type CompanyData } from '../utils/sheetApi';
import {
  PROJECTS,
  DEFAULT_GS_CONSORTIUM,
  DEFAULT_DL_CONSORTIUM,
} from '../data/projectData';

const PROJECT_DEFAULTS: Record<string, { gs: ConsortiumConfig; dl: ConsortiumConfig }> = {
  'pyeongtaek-a70': { gs: DEFAULT_GS_CONSORTIUM, dl: DEFAULT_DL_CONSORTIUM },
};

interface SimStore {
  projects: ProjectConfig[];
  selectedProjectId: string;
  selectedProject: () => ProjectConfig;
  setSelectedProject: (id: string) => void;
  updateProjectDetail: (patch: Partial<ProjectConfig>) => void; // 👇 사업개요 수정 함수

  gsConsortium: ConsortiumConfig;
  dlConsortium: ConsortiumConfig;

  companyDB: CompanyData[];
  isLoadingDB: boolean;
  loadCompanyDB: () => Promise<void>;
  applyCompanyData: (consortiumType: 'gs' | 'dl', memberId: string, companyName: string) => void;

  updateGsFinancials: (key: keyof ConsortiumConfig['financials'], value: number) => void;
  updateGsMember: (memberId: string, patch: Partial<ConsortiumMember>) => void;
  updateGsConsortium: (patch: Partial<Omit<ConsortiumConfig, 'members' | 'financials'>>) => void;
  updateGsEquity: (memberId: string, newShare: number) => void;

  updateDlFinancials: (key: keyof ConsortiumConfig['financials'], value: number) => void;
  updateDlMember: (memberId: string, patch: Partial<ConsortiumMember>) => void;
  updateDlConsortium: (patch: Partial<Omit<ConsortiumConfig, 'members' | 'financials'>>) => void;
  updateDlEquity: (memberId: string, newShare: number) => void;

  applyFinancials: (gsFin: Partial<ConsortiumConfig['financials']>, dlFin: Partial<ConsortiumConfig['financials']>) => void;

  nonQuantBaseScore: number;
  nonQuantJudgeDiff: number; 
  updateNonQuant: (base: number, diff: number) => void;

  projectBaseBudget: number; 
  gsProposedBudgetRate: number; 
  dlProposedBudgetRate: number; 
  gsProposedBudget: number; 
  dlProposedBudget: number; 
  updateProposedBudgetRate: (type: 'gs' | 'dl', rate: number) => void;

  resetToDefaults: () => void;
}

function patchMembers(members: ConsortiumMember[], memberId: string, patch: Partial<ConsortiumMember>): ConsortiumMember[] {
  return members.map((m) => (m.id === memberId ? { ...m, ...patch } : m));
}

export const useSimStore = create<SimStore>((set, get) => ({
  projects: PROJECTS,
  selectedProjectId: 'pyeongtaek-a70',

  selectedProject: () => {
    const { projects, selectedProjectId } = get();
    return projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  },

  setSelectedProject: (id) => {
    const defaults = PROJECT_DEFAULTS[id] || PROJECT_DEFAULTS['pyeongtaek-a70'];
    const p = get().projects.find((proj) => proj.id === id);
    const budgetMatch = p ? p.budget.replace(/,/g, '').match(/\d+/) : null;
    const defaultBudget = budgetMatch ? parseInt(budgetMatch[0], 10) : 4119;

    set({
      selectedProjectId: id,
      gsConsortium: { ...defaults.gs, priceScore: 200 },
      dlConsortium: { ...defaults.dl, priceScore: 200 },
      nonQuantBaseScore: defaults.gs.nonQuantitativeScore || 440,
      nonQuantJudgeDiff: 0,
      projectBaseBudget: defaultBudget,
      gsProposedBudgetRate: 100,
      dlProposedBudgetRate: 100,
      gsProposedBudget: defaultBudget,
      dlProposedBudget: defaultBudget,
    });
  },

  // 👇 사업개요 텍스트 수정 액션
  updateProjectDetail: (patch) => set((s) => {
    const newProjects = s.projects.map((p) => p.id === s.selectedProjectId ? { ...p, ...patch } : p);

    let newBaseBudget = s.projectBaseBudget;
    let gsBudget = s.gsProposedBudget;
    let dlBudget = s.dlProposedBudget;

    // 만약 예산 텍스트가 수정되었다면, 숫자만 뽑아서 가격점수 베이스 예산으로 자동 업데이트
    if (patch.budget) {
      const budgetMatch = patch.budget.replace(/,/g, '').match(/\d+/);
      if (budgetMatch) {
        newBaseBudget = parseInt(budgetMatch[0], 10);
        gsBudget = newBaseBudget * (s.gsProposedBudgetRate / 100);
        dlBudget = newBaseBudget * (s.dlProposedBudgetRate / 100);
      }
    }

    const minBudget = Math.min(gsBudget, dlBudget);
    const calcScore = (myBudget: number) => {
      if (!myBudget || myBudget <= 0) return 0;
      if (myBudget === minBudget) return 200;
      const score = 200 * (1 - 0.5 * (1 - minBudget / myBudget));
      return Math.round(score * 100) / 100;
    };

    return {
      projects: newProjects,
      projectBaseBudget: newBaseBudget,
      gsProposedBudget: gsBudget,
      dlProposedBudget: dlBudget,
      gsConsortium: patch.budget ? { ...s.gsConsortium, priceScore: calcScore(gsBudget) } : s.gsConsortium,
      dlConsortium: patch.budget ? { ...s.dlConsortium, priceScore: calcScore(dlBudget) } : s.dlConsortium,
    };
  }),

  gsConsortium: { ...DEFAULT_GS_CONSORTIUM, priceScore: 200 },
  dlConsortium: { ...DEFAULT_DL_CONSORTIUM, priceScore: 200 },

  companyDB: [],
  isLoadingDB: false,
  loadCompanyDB: async () => {
    set({ isLoadingDB: true });
    try {
      const db = await fetchCompanyDB();
      set({ companyDB: db });
    } catch (error) {
      console.error('DB 로드 실패:', error);
    } finally {
      set({ isLoadingDB: false });
    }
  },

  applyCompanyData: (consortiumType, memberId, companyName) => {
    const { companyDB, gsConsortium, dlConsortium } = get();
    const targetCompany = companyDB.find(c => c.name === companyName);
    if (!targetCompany) return; 

    const updatePatch: Partial<ConsortiumMember> = {
      name: targetCompany.name,
      isSME: targetCompany.isSME,
      creditType: targetCompany.creditType,
      creditGrade: targetCompany.creditGrade as any,
      performanceUnits: targetCompany.performanceUnits,
      accidentDeathRate3yr: targetCompany.accidentDeathRate3yr,
      safetyActivityScore: targetCompany.safetyActivityScore,
      safetyMgmtViolations: targetCompany.safetyMgmtViolations,
      accidentReportViolations: targetCompany.accidentReportViolations,
      safetyLawViolations: targetCompany.safetyLawViolations,
      envViolations: targetCompany.envViolations,
      qualityDefectNoticeScore: targetCompany.qualityDefectNoticeScore,
      qualityExcellentNoticeScore: targetCompany.qualityExcellentNoticeScore,
      penaltyScore: targetCompany.penaltyScore,
      businessPlanViolations: targetCompany.businessPlanViolations,
      defectHandlingPenalty: targetCompany.defectHandlingPenalty,
    };

    if (consortiumType === 'gs') {
      set({ gsConsortium: { ...gsConsortium, members: patchMembers(gsConsortium.members, memberId, updatePatch) } });
    } else {
      set({ dlConsortium: { ...dlConsortium, members: patchMembers(dlConsortium.members, memberId, updatePatch) } });
    }
  },

  updateGsFinancials: (key, value) => set((s) => ({ gsConsortium: { ...s.gsConsortium, financials: { ...s.gsConsortium.financials, [key]: value } } })),
  updateGsMember: (memberId, patch) => set((s) => ({ gsConsortium: { ...s.gsConsortium, members: patchMembers(s.gsConsortium.members, memberId, patch) } })),
  updateGsConsortium: (patch) => set((s) => ({ gsConsortium: { ...s.gsConsortium, ...patch } })),
  updateGsEquity: (memberId, newShare) => set((s) => ({ gsConsortium: { ...s.gsConsortium, members: patchMembers(s.gsConsortium.members, memberId, { equityShare: newShare }) } })),

  updateDlFinancials: (key, value) => set((s) => ({ dlConsortium: { ...s.dlConsortium, financials: { ...s.dlConsortium.financials, [key]: value } } })),
  updateDlMember: (memberId, patch) => set((s) => ({ dlConsortium: { ...s.dlConsortium, members: patchMembers(s.dlConsortium.members, memberId, patch) } })),
  updateDlConsortium: (patch) => set((s) => ({ dlConsortium: { ...s.dlConsortium, ...patch } })),
  updateDlEquity: (memberId, newShare) => set((s) => ({ dlConsortium: { ...s.dlConsortium, members: patchMembers(s.dlConsortium.members, memberId, { equityShare: newShare }) } })),

  applyFinancials: (gsFin, dlFin) => set((s) => ({
    gsConsortium: { ...s.gsConsortium, financials: { ...s.gsConsortium.financials, ...gsFin } },
    dlConsortium: { ...s.dlConsortium, financials: { ...s.dlConsortium.financials, ...dlFin } },
  })),

  nonQuantBaseScore: 440,
  nonQuantJudgeDiff: 0,
  updateNonQuant: (base, diff) => set((s) => {
    const gsScore = diff >= 0 ? base : base - Math.abs(diff) * 4;
    const dlScore = diff <= 0 ? base : base - Math.abs(diff) * 4;
    return {
      nonQuantBaseScore: base,
      nonQuantJudgeDiff: diff,
      gsConsortium: { ...s.gsConsortium, nonQuantitativeScore: gsScore },
      dlConsortium: { ...s.dlConsortium, nonQuantitativeScore: dlScore },
    };
  }),

  projectBaseBudget: 4119,
  gsProposedBudgetRate: 100,
  dlProposedBudgetRate: 100,
  gsProposedBudget: 4119,
  dlProposedBudget: 4119,
  updateProposedBudgetRate: (type, rate) => set((s) => {
    const newGsRate = type === 'gs' ? rate : s.gsProposedBudgetRate;
    const newDlRate = type === 'dl' ? rate : s.dlProposedBudgetRate;
    
    const newGsBudget = s.projectBaseBudget * (newGsRate / 100);
    const newDlBudget = s.projectBaseBudget * (newDlRate / 100);
    
    const minBudget = Math.min(newGsBudget, newDlBudget);
    
    const calcScore = (myBudget: number) => {
      if (!myBudget || myBudget <= 0) return 0;
      if (myBudget === minBudget) return 200; 
      const score = 200 * (1 - 0.5 * (1 - minBudget / myBudget));
      return Math.round(score * 100) / 100;
    };

    return {
      gsProposedBudgetRate: newGsRate,
      dlProposedBudgetRate: newDlRate,
      gsProposedBudget: newGsBudget,
      dlProposedBudget: newDlBudget,
      gsConsortium: { ...s.gsConsortium, priceScore: calcScore(newGsBudget) },
      dlConsortium: { ...s.dlConsortium, priceScore: calcScore(newDlBudget) },
    };
  }),

  resetToDefaults: () => {
    const { selectedProjectId, projects } = get();
    const defaults = PROJECT_DEFAULTS[selectedProjectId] ?? PROJECT_DEFAULTS['pyeongtaek-a70'];
    const p = projects.find((proj) => proj.id === selectedProjectId);
    const budgetMatch = p ? p.budget.replace(/,/g, '').match(/\d+/) : null;
    const defaultBudget = budgetMatch ? parseInt(budgetMatch[0], 10) : 4119;

    set({ 
      gsConsortium: { ...defaults.gs, priceScore: 200 }, 
      dlConsortium: { ...defaults.dl, priceScore: 200 },
      nonQuantBaseScore: defaults.gs.nonQuantitativeScore || 440,
      nonQuantJudgeDiff: 0,
      projectBaseBudget: defaultBudget,
      gsProposedBudgetRate: 100,
      dlProposedBudgetRate: 100,
      gsProposedBudget: defaultBudget,
      dlProposedBudget: defaultBudget,
    });
  },
}));