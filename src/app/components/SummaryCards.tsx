import type { ScoreResult } from '../types/simulation';
import type { ProjectConfig } from '../types/simulation';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  gsScore: ScoreResult;
  dlScore: ScoreResult;
  project: ProjectConfig;
}

function ScoreGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function ConsortiumCard({
  name,
  score,
  color,
  bgColor,
  borderColor,
  isWinner,
}: {
  name: string;
  score: ScoreResult;
  color: string;
  bgColor: string;
  borderColor: string;
  isWinner: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex-1 relative overflow-hidden transition-all duration-300 ${isWinner ? 'shadow-lg' : ''}`}
      style={{ background: bgColor, borderColor }}
    >
      {isWinner && (
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full"
          style={{ background: color, fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}
        >
          우위
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <span className="text-white" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{name}</span>
      </div>

      {/* 계량+가감점 */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>계량+가감점</span>
          <span className="text-white font-mono" style={{ fontWeight: 700, fontSize: '1.4rem', lineHeight: 1 }}>
            {score.combinedTotal.toFixed(2)}
          </span>
        </div>
        <ScoreGauge value={score.combinedTotal} max={260} color={color} />
      </div>

      {/* Sub breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="text-slate-400" style={{ fontSize: '0.6rem' }}>계량 (200pt)</div>
          <div className="font-mono" style={{ color, fontWeight: 700, fontSize: '1rem' }}>
            {score.quantitativeTotal.toFixed(2)}
          </div>
          <ScoreGauge value={score.quantitativeTotal} max={200} color={color} />
        </div>
        <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="text-slate-400" style={{ fontSize: '0.6rem' }}>가감점</div>
          <div
            className="font-mono"
            style={{ color: score.adjustmentTotal >= 0 ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '1rem' }}
          >
            {score.adjustmentTotal >= 0 ? '+' : ''}{score.adjustmentTotal.toFixed(2)}
          </div>
          <ScoreGauge value={30 + score.adjustmentTotal} max={60} color={score.adjustmentTotal >= 0 ? '#4ade80' : '#f87171'} />
        </div>
      </div>

      {/* 세부 가감점 항목 */}
      <div className="space-y-1">
        {[
          { label: '재무상태', val: score.quantitative.financialState, max: 70 },
          { label: '신용도', val: score.quantitative.creditRating, max: 65 },
          { label: '사업실적', val: score.quantitative.businessPerformance, max: 50 },
          { label: '중소기업', val: score.quantitative.smeProduct, max: 15 },
          { label: '안전·환경', val: score.adjustment.accidentDeath + score.adjustment.safetyActivity, max: 0 },
          { label: 'CSI·동반성장', val: score.adjustment.csIndex + score.adjustment.mutualGrowth, max: 8 },
          { label: '신규업체·기술', val: score.adjustment.newCompany + score.adjustment.lhSpecialTech, max: 9 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-slate-500 w-20" style={{ fontSize: '0.6rem' }}>{item.label}</span>
            <div className="flex-1">
              <ScoreGauge value={item.max > 0 ? item.val : item.val + 20} max={item.max > 0 ? item.max : 40} color={color} />
            </div>
            <span className="font-mono text-slate-300 w-10 text-right" style={{ fontSize: '0.6rem' }}>
              {item.val.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* 총점 */}
      <div className="mt-3 pt-3 border-t" style={{ borderColor }}>
        <div className="flex justify-between items-center">
          <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>최종 총점 (1000점)</span>
          <span className="font-mono" style={{ color, fontWeight: 700, fontSize: '1.1rem' }}>
            {score.grandTotal.toFixed(1)}
          </span>
        </div>
        <ScoreGauge value={score.grandTotal} max={1000} color={color} />
      </div>
    </div>
  );
}

export function SummaryCards({ gsScore, dlScore, project }: Props) {
  const diff = gsScore.combinedTotal - dlScore.combinedTotal;
  const gsWins = diff > 0.01;
  const dlWins = diff < -0.01;

  return (
    <div className="space-y-3">
      {/* Project Info Banner */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              현재 시뮬레이션 대상
            </div>
            <div className="text-white" style={{ fontWeight: 700, fontSize: '1rem' }}>{project.name}</div>
            <div className="text-slate-400" style={{ fontSize: '0.7rem' }}>
              {project.type} · {project.units.toLocaleString()}세대 · {project.budget} · {project.completionDate} 착공
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400" style={{ fontSize: '0.65rem' }}>신용도/사故사망/중소기업 배점</div>
            <div className="text-slate-300" style={{ fontSize: '0.75rem' }}>
              {project.creditMaxScore}점 / {project.accidentDeathMaxPenalty}점 / {project.smeProductMaxScore}점
            </div>
          </div>
        </div>
      </div>

      {/* Consortium Cards */}
      <div className="flex gap-3">
        <ConsortiumCard
          name="GS건설 컨소시엄"
          score={gsScore}
          color="#60a5fa"
          bgColor="rgba(30,58,138,0.2)"
          borderColor="#1d4ed8"
          isWinner={gsWins}
        />
        <ConsortiumCard
          name="DL건설 컨소시엄"
          score={dlScore}
          color="#fb923c"
          bgColor="rgba(124,45,18,0.2)"
          borderColor="#c2410c"
          isWinner={dlWins}
        />
      </div>

      {/* Gap Banner */}
      <div
        className={`rounded-xl border p-3 flex items-center justify-between ${
          Math.abs(diff) < 0.5
            ? 'border-slate-600 bg-slate-800'
            : gsWins
            ? 'border-blue-700 bg-blue-950/40'
            : 'border-orange-700 bg-orange-950/40'
        }`}
      >
        <div>
          <div className="text-slate-400" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            계량+가감점 격차 (GS - DL)
          </div>
          <div
            className="font-mono"
            style={{
              fontWeight: 700,
              fontSize: '1.6rem',
              color: diff > 0 ? '#60a5fa' : diff < 0 ? '#fb923c' : '#9ca3af',
            }}
          >
            {diff > 0 ? '+' : ''}{diff.toFixed(2)}점
          </div>
        </div>
        <div className="text-right">
          {gsWins ? (
            <div className="flex items-center gap-1">
              <TrendingUp className="text-blue-400" size={20} />
              <span className="text-blue-400" style={{ fontSize: '0.75rem', fontWeight: 700 }}>GS 우위</span>
            </div>
          ) : dlWins ? (
            <div className="flex items-center gap-1">
              <TrendingDown className="text-orange-400" size={20} />
              <span className="text-orange-400" style={{ fontSize: '0.75rem', fontWeight: 700 }}>DL 우위</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Minus className="text-slate-400" size={20} />
              <span className="text-slate-400" style={{ fontSize: '0.75rem', fontWeight: 700 }}>접전</span>
            </div>
          )}
          <div className="text-slate-400 mt-1" style={{ fontSize: '0.65rem' }}>
            총점 격차: {(gsScore.grandTotal - dlScore.grandTotal) > 0 ? '+' : ''}{(gsScore.grandTotal - dlScore.grandTotal).toFixed(1)}점
          </div>
        </div>
      </div>
    </div>
  );
}
