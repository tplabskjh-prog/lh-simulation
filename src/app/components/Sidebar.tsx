// src/app/components/Sidebar.tsx
import { Building2, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSimStore } from '../store/simulationStore';
import { calculateScores, getConsortiumName, getShortName } from '../utils/calculations';

export function Sidebar() {
  const { projects, selectedProjectId, setSelectedProject, gsConsortium, dlConsortium, selectedProject } =
    useSimStore();
  const project = selectedProject();

  const gsScore = calculateScores(gsConsortium, project);
  const dlScore = calculateScores(dlConsortium, project);
  const diff = gsScore.combinedTotal - dlScore.combinedTotal;

  const gsName = getConsortiumName(gsConsortium);
  const dlName = getConsortiumName(dlConsortium);
  const gsShortName = getShortName(gsConsortium);
  const dlShortName = getShortName(dlConsortium);

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="text-blue-400" size={20} />
          <span className="text-blue-400" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            LH 민간참여 평가
          </span>
        </div>
        <h1 className="text-white" style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
          점수 시뮬레이터
        </h1>
        <p className="text-slate-400" style={{ fontSize: '0.7rem', marginTop: 4 }}>
          계량 · 가감점 실시간 시뮬레이션
        </p>
      </div>

      <div className="p-3 flex-1">
        <p className="text-slate-500 mb-2 px-1" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          사업장 선택
        </p>
        <nav className="space-y-1">
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => setSelectedProject(proj.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-all flex items-center justify-between group ${
                selectedProjectId === proj.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>{proj.name}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.75, marginTop: 1 }}>
                  {proj.type} · {proj.units.toLocaleString()}호
                </div>
              </div>
              <ChevronRight size={14} className={selectedProjectId === proj.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'} />
            </button>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-700">
        <p className="text-slate-500 mb-3 px-1" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          현재 시뮬레이션 결과
        </p>

        <div className="space-y-2">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-blue-300" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{gsName}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-white" style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>
                {gsScore.combinedTotal.toFixed(2)}
              </span>
              <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>계량+가감점</span>
            </div>
            <div className="flex gap-3 mt-1">
              <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>
                계량 <span className="text-slate-300">{gsScore.quantitativeTotal.toFixed(1)}</span>
              </span>
              <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>
                가감점 <span className={gsScore.adjustmentTotal >= 0 ? 'text-green-400' : 'text-red-400'}>{gsScore.adjustmentTotal.toFixed(2)}</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-orange-300" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{dlName}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-white" style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>
                {dlScore.combinedTotal.toFixed(2)}
              </span>
              <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>계량+가감점</span>
            </div>
            <div className="flex gap-3 mt-1">
              <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>
                계량 <span className="text-slate-300">{dlScore.quantitativeTotal.toFixed(1)}</span>
              </span>
              <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>
                가감점 <span className={dlScore.adjustmentTotal >= 0 ? 'text-green-400' : 'text-red-400'}>{dlScore.adjustmentTotal.toFixed(2)}</span>
              </span>
            </div>
          </div>

          <div className={`rounded-lg p-3 flex items-center justify-between ${
            diff > 0 ? 'bg-blue-950 border border-blue-700' : diff < 0 ? 'bg-orange-950 border border-orange-700' : 'bg-slate-800 border border-slate-600'
          }`}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                className={diff > 0 ? 'text-blue-400' : diff < 0 ? 'text-orange-400' : 'text-slate-400'}>
                {gsShortName} vs {dlShortName} 격차
              </div>
              <div className="text-white" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {diff > 0 ? '+' : ''}{diff.toFixed(2)}
              </div>
            </div>
            {diff > 0.5 ? (
              <TrendingUp className="text-blue-400" size={24} />
            ) : diff < -0.5 ? (
              <TrendingDown className="text-orange-400" size={24} />
            ) : (
              <Minus className="text-slate-400" size={24} />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}