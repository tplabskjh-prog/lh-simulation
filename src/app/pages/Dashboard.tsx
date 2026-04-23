// src/app/pages/Dashboard.tsx
import { useSimStore } from '../store/simulationStore';
import { calculateScores } from '../utils/calculations';
import { SummaryCards } from '../components/SummaryCards';
import { ParameterTabs } from '../components/ParameterTabs';
import { ScoreBreakdownTable } from '../components/ScoreBreakdownTable';
import { ComparisonCharts } from '../components/ComparisonCharts';
import { useState } from 'react';
import { 
  TableIcon, BarChart3, Building2, TrendingUp, TrendingDown, Minus, Menu 
} from 'lucide-react';

export function Dashboard() {
  const { projects, selectedProjectId, setSelectedProject, gsConsortium, dlConsortium, selectedProject } = useSimStore();
  const [rightView, setRightView] = useState<'table' | 'charts'>('table');
  
  // 파라미터 패널 열림/닫힘 상태 관리
  const [isParamOpen, setIsParamOpen] = useState(true);

  const project = selectedProject();
  const gsScore = calculateScores(gsConsortium, project);
  const dlScore = calculateScores(dlConsortium, project);
  const diff = gsScore.combinedTotal - dlScore.combinedTotal;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          
          {/* App Title & Toggle Button */}
          <div className="flex items-center gap-4">
            
            {/* 패널이 닫혀있을 때만 나타나는 열기 버튼 */}
            {!isParamOpen && (
              <button
                onClick={() => setIsParamOpen(true)}
                className="p-2 rounded-lg transition-all flex items-center justify-center border bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                title="파라미터 패널 열기"
              >
                <Menu size={20} />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="text-blue-400" size={22} />
                <span className="text-blue-400" style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  LH 민간참여 평가
                </span>
              </div>
              <h1 className="text-white" style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3 }}>
                점수 시뮬레이터
              </h1>
              <p className="text-slate-400" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                계량 · 가감점 실시간 시뮬레이션
              </p>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-12 w-px bg-slate-700 mx-2"></div>

          {/* Project Selection */}
          <div>
            <p className="text-slate-500 mb-2 px-1" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              사업장 선택
            </p>
            <div className="flex gap-2">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(proj.id)}
                  className={`text-left rounded-lg px-4 py-2 transition-all border ${
                    selectedProjectId === proj.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>{proj.name}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: 2 }}>
                    {proj.type} · {proj.units.toLocaleString()}호
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-12 w-px bg-slate-700 mx-2"></div>

          {/* 현재 시뮬레이션 결과 (가로 배치) */}
          <div>
            <p className="text-slate-500 mb-2 px-1" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              현재 시뮬레이션 결과
            </p>
            <div className="flex items-stretch gap-3">
              {/* GS */}
              <div className="bg-slate-800 rounded-lg p-2 px-3 border border-slate-700 flex flex-col justify-center min-w-[130px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-blue-300" style={{ fontSize: '0.7rem', fontWeight: 700 }}>GS건설 컨소시엄</span>
                </div>
                <div className="text-white font-mono leading-none mt-1" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                  {gsScore.combinedTotal.toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col justify-center text-slate-600 font-black text-sm italic">VS</div>

              {/* DL */}
              <div className="bg-slate-800 rounded-lg p-2 px-3 border border-slate-700 flex flex-col justify-center min-w-[130px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-orange-300" style={{ fontSize: '0.7rem', fontWeight: 700 }}>DL건설 컨소시엄</span>
                </div>
                <div className="text-white font-mono leading-none mt-1" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                  {dlScore.combinedTotal.toFixed(2)}
                </div>
              </div>

              {/* Gap */}
              <div className={`rounded-lg p-2 px-3 flex items-center justify-between min-w-[110px] gap-3 ${
                diff > 0 ? 'bg-blue-950/50 border border-blue-800/50' : diff < 0 ? 'bg-orange-950/50 border border-orange-800/50' : 'bg-slate-800 border border-slate-600'
              }`}>
                <div className="flex flex-col justify-center">
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    className={diff > 0 ? 'text-blue-400' : diff < 0 ? 'text-orange-400' : 'text-slate-400'}>
                    격차
                  </div>
                  <div className="text-white font-mono leading-none mt-1.5" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                  </div>
                </div>
                {diff > 0.5 ? (
                  <TrendingUp className="text-blue-400" size={20} />
                ) : diff < -0.5 ? (
                  <TrendingDown className="text-orange-400" size={20} />
                ) : (
                  <Minus className="text-slate-400" size={20} />
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Status */}
        <div className="flex items-center gap-2 self-start mt-2">
          <span className="text-slate-500" style={{ fontSize: '0.7rem' }}>기준일: 2026.04.22</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="실시간 계산 중" />
        </div>
      </header>

      {/* Body: 2-column layout */}
      <div className="flex-1 overflow-hidden flex">
        
        {/* Left Column: Parameter Controls */}
        <div 
          className={`shrink-0 border-slate-700 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
            isParamOpen ? 'w-[380px] border-r opacity-100' : 'w-0 border-r-0 opacity-0'
          }`}
          style={{ background: '#0f172a' }}
        >
          {/* 애니메이션 도중 UI가 찌그러지지 않도록 min-w-[380px] 고정 */}
          <div className="p-3 flex-1 overflow-hidden flex flex-col min-w-[380px]">
            <ParameterTabs onClose={() => setIsParamOpen(false)} />
          </div>
        </div>

        {/* Right Column: Detailed Summary + Table/Charts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <SummaryCards gsScore={gsScore} dlScore={dlScore} project={project} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRightView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                rightView === 'table'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              <TableIcon size={14} />
              세부 득점 테이블
            </button>
            <button
              onClick={() => setRightView('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                rightView === 'charts'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              <BarChart3 size={14} />
              시각화 차트
            </button>
          </div>

          {rightView === 'table' ? (
            <ScoreBreakdownTable gsScore={gsScore} dlScore={dlScore} />
          ) : (
            <ComparisonCharts gsScore={gsScore} dlScore={dlScore} />
          )}
        </div>
      </div>
    </div>
  );
}