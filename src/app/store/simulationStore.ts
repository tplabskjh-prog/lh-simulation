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

  gsConsortium: ConsortiumConfig;
  dlConsortium: ConsortiumConfig;

  // 👇 CSV 데이터를 들고 있을 상태와 함수
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

  resetToDefaults: () => void;
}

function patchMembers(members: ConsortiumMember[], memberId: string, patch: Partial<ConsortiumMember>): ConsortiumMember[] {
  return members.map((m) => (m.id === memberId ? { ...m, ...patch } : m));
}

function adjustEquity(members: ConsortiumMember[], targetId: string, newShare: number): ConsortiumMember[] {
  const clamped = Math.max(1, Math.min(99, newShare));
  const others = members.filter((m) => m.id !== targetId);
  const othersTotal = others.reduce((s, m) => s + m.equityShare, 0);
  const remaining = 100 - clamped;

  const adjusted = others.map((m) => ({
    ...m,
    equityShare: othersTotal > 0
      ? Math.max(0, parseFloat(((m.equityShare / othersTotal) * remaining).toFixed(2)))
      : parseFloat((remaining / others.length).toFixed(2)),
  }));

  const sum = clamped + adjusted.reduce((s, m) => s + m.equityShare, 0);
  const diff = parseFloat((100 - sum).toFixed(2));
  if (diff !== 0 && adjusted.length > 0) {
    const maxIdx = adjusted.reduce((mi, m, i, arr) => (m.equityShare > arr[mi].equityShare ? i : mi), 0);
    adjusted[maxIdx].equityShare = parseFloat((adjusted[maxIdx].equityShare + diff).toFixed(2));
  }

  return members.map((m) => {
    if (m.id === targetId) return { ...m, equityShare: clamped };
    return adjusted.find((a) => a.id === m.id) ?? m;
  });
}

export const useSimStore = create<SimStore>((set, get) => ({
  projects: PROJECTS,
  selectedProjectId: 'pyeongtaek-a70',

  selectedProject: () => {
    const { projects, selectedProjectId } = get();
    return projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  },

  setSelectedProject: (id) => {
    const defaults = PROJECT_DEFAULTS[id];
    set({
      selectedProjectId: id,
      gsConsortium: defaults?.gs ?? DEFAULT_GS_CONSORTIUM,
      dlConsortium: defaults?.dl ?? DEFAULT_DL_CONSORTIUM,
    });
  },

  gsConsortium: DEFAULT_GS_CONSORTIUM,
  dlConsortium: DEFAULT_DL_CONSORTIUM,

  // 👇 CSV 데이터 로드 및 덮어쓰기 로직
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
  updateGsEquity: (memberId, newShare) => set((s) => ({ gsConsortium: { ...s.gsConsortium, members: adjustEquity(s.gsConsortium.members, memberId, newShare) } })),

  updateDlFinancials: (key, value) => set((s) => ({ dlConsortium: { ...s.dlConsortium, financials: { ...s.dlConsortium.financials, [key]: value } } })),
  updateDlMember: (memberId, patch) => set((s) => ({ dlConsortium: { ...s.dlConsortium, members: patchMembers(s.dlConsortium.members, memberId, patch) } })),
  updateDlConsortium: (patch) => set((s) => ({ dlConsortium: { ...s.dlConsortium, ...patch } })),
  updateDlEquity: (memberId, newShare) => set((s) => ({ dlConsortium: { ...s.dlConsortium, members: adjustEquity(s.dlConsortium.members, memberId, newShare) } })),

  resetToDefaults: () => {
    const { selectedProjectId } = get();
    const defaults = PROJECT_DEFAULTS[selectedProjectId] ?? PROJECT_DEFAULTS['pyeongtaek-a70'];
    set({ gsConsortium: defaults.gs, dlConsortium: defaults.dl });
  },
}));