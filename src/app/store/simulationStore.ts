// src/app/store/simulationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConsortiumConfig, ConsortiumMember, ProjectConfig, PhaseConfig } from '../types/simulation';
import { fetchCompanyDB, type CompanyData } from '../utils/sheetApi';
import {
  PROJECTS,
  PHASES,
  DEFAULT_GS_CONSORTIUM,
  DEFAULT_DL_CONSORTIUM,
} from '../data/projectData';

interface SimStore {
  phases: PhaseConfig[];
  selectedPhaseId: string;
  setSelectedPhase: (id: string) => void;
  updatePhaseName: (id: string, name: string) => void;

  projects: ProjectConfig[];
  selectedProjectId: string;
  selectedProject: () => ProjectConfig;
  setSelectedProject: (id: string) => void;
  updateProjectDetail: (patch: Partial<ProjectConfig>) => void;

  // 상태 저장을 위한 속성 추가
  savedStates: Record<string, any>;

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

export const useSimStore = create<SimStore>()(
  persist(
    (set, get) => ({
      phases: PHASES,
      selectedPhaseId: '1-1',
      savedStates: {}, // 초기 저장 상태 빈 객체로 설정
      
      setSelectedPhase: (id) => {
        const { projects, setSelectedProject } = get();
        const phaseProjects = projects.filter(p => p.phaseId === id);
        const firstProjectId = phaseProjects.length > 0 ? phaseProjects[0].id : '';
        set({ selectedPhaseId: id });
        if (firstProjectId) {
          setSelectedProject(firstProjectId);
        }
      },

      updatePhaseName: (id, name) => set((s) => ({
        phases: s.phases.map((p) => (p.id === id ? { ...p, name } : p)),
      })),

      projects: PROJECTS,
      selectedProjectId: '1-1-block1',

      selectedProject: () => {
        const { projects, selectedProjectId } = get();
        return projects.find((p) => p.id === selectedProjectId) ?? projects[0];
      },

      setSelectedProject: (id) => {
        const state = get();
        const prevId = state.selectedProjectId;
        
        // 1. 현재 화면에 있던 상태를 백업
        const currentSavedStates = { ...state.savedStates };
        if (prevId) {
          currentSavedStates[prevId] = {
            gsConsortium: state.gsConsortium,
            dlConsortium: state.dlConsortium,
            nonQuantBaseScore: state.nonQuantBaseScore,
            nonQuantJudgeDiff: state.nonQuantJudgeDiff,
            projectBaseBudget: state.projectBaseBudget,
            gsProposedBudgetRate: state.gsProposedBudgetRate,
            dlProposedBudgetRate: state.dlProposedBudgetRate,
            gsProposedBudget: state.gsProposedBudget,
            dlProposedBudget: state.dlProposedBudget,
          };
        }

        // 2. 이동할 새 프로젝트의 기본 예산 계산
        const p = state.projects.find((proj) => proj.id === id);
        const budgetMatch = p ? p.budget.replace(/,/g, '').match(/\d+/) : null;
        const defaultBudget = budgetMatch ? parseInt(budgetMatch[0], 10) : 0;

        // 3. 이동할 프로젝트의 저장된 기록이 있으면 복원, 없으면 초기화
        if (currentSavedStates[id]) {
          set({
            selectedProjectId: id,
            savedStates: currentSavedStates,
            ...currentSavedStates[id] // 저장된 상태 덮어쓰기
          });
        } else {
          set({
            selectedProjectId: id,
            savedStates: currentSavedStates,
            gsConsortium: { ...DEFAULT_GS_CONSORTIUM, priceScore: 200 },
            dlConsortium: { ...DEFAULT_DL_CONSORTIUM, priceScore: 200 },
            nonQuantBaseScore: 0,
            nonQuantJudgeDiff: 0,
            projectBaseBudget: defaultBudget,
            gsProposedBudgetRate: 100,
            dlProposedBudgetRate: 100,
            gsProposedBudget: defaultBudget,
            dlProposedBudget: defaultBudget,
          });
        }
      },

      updateProjectDetail: (patch) => set((s) => {
        const newProjects = s.projects.map((p) => p.id === s.selectedProjectId ? { ...p, ...patch } : p);

        let newBaseBudget = s.projectBaseBudget;
        let gsBudget = s.gsProposedBudget;
        let dlBudget = s.dlProposedBudget;

        if (patch.budget) {
          const budgetMatch = patch.budget.replace(/,/g, '').match(/\d+/);
          if (budgetMatch) {
            newBaseBudget = parseInt(budgetMatch[0], 10);
            gsBudget = newBaseBudget * (s.gsProposedBudgetRate / 100);
            dlBudget = newBaseBudget * (s.dlProposedBudgetRate / 100);
          } else {
            newBaseBudget = 0;
            gsBudget = 0;
            dlBudget = 0;
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
          
          csIndex: targetCompany.csIndex,
          bondTypeForBonus: targetCompany.bondTypeForBonus as any,
          bondRatingForBonus: targetCompany.bondRatingForBonus,
          mutualGrowthRating: targetCompany.mutualGrowthRating as any,
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

      nonQuantBaseScore: 0,
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

      projectBaseBudget: 0,
      gsProposedBudgetRate: 100,
      dlProposedBudgetRate: 100,
      gsProposedBudget: 0,
      dlProposedBudget: 0,
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
        const p = projects.find((proj) => proj.id === selectedProjectId);
        const budgetMatch = p ? p.budget.replace(/,/g, '').match(/\d+/) : null;
        const defaultBudget = budgetMatch ? parseInt(budgetMatch[0], 10) : 0;

        set({ 
          gsConsortium: { ...DEFAULT_GS_CONSORTIUM, priceScore: 200 }, 
          dlConsortium: { ...DEFAULT_DL_CONSORTIUM, priceScore: 200 },
          nonQuantBaseScore: 0,
          nonQuantJudgeDiff: 0,
          projectBaseBudget: defaultBudget,
          gsProposedBudgetRate: 100,
          dlProposedBudgetRate: 100,
          gsProposedBudget: defaultBudget,
          dlProposedBudget: defaultBudget,
        });
      },
    }),
    {
      name: 'lh-simulation-storage', 
      partialize: (state) => ({
        phases: state.phases,
        selectedPhaseId: state.selectedPhaseId,
        projects: state.projects,
        selectedProjectId: state.selectedProjectId,
        gsConsortium: state.gsConsortium,
        dlConsortium: state.dlConsortium,
        nonQuantBaseScore: state.nonQuantBaseScore,
        nonQuantJudgeDiff: state.nonQuantJudgeDiff,
        projectBaseBudget: state.projectBaseBudget,
        gsProposedBudgetRate: state.gsProposedBudgetRate,
        dlProposedBudgetRate: state.dlProposedBudgetRate,
        gsProposedBudget: state.gsProposedBudget,
        dlProposedBudget: state.dlProposedBudget,
        savedStates: state.savedStates, // 상태 백업 객체 스토리지 저장 연동
      }),
    }
  )
);