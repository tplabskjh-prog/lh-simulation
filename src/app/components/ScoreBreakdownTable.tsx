// src/app/components/ScoreBreakdownTable.tsx
import type { ScoreResult } from '../types/simulation';
import { fmt, fmtDiff } from '../utils/calculations';

interface Props {
  gsScore: ScoreResult;
  dlScore: ScoreResult;
}

function DiffBadge({ val }: { val: number }) {
  if (Math.abs(val) < 0.005) return <span className="text-slate-500">—</span>;
  return (
    <span className={val > 0 ? 'text-blue-400' : 'text-orange-400'} style={{ fontWeight: 700 }}>
      {fmtDiff(val)}
    </span>
  );
}

function ScoreRow({
  label,
  maxScore,
  gs,
  dl,
  isHeader,
  isSubtotal,
  indent,
  highlight,
}: {
  label: string;
  maxScore?: string;
  gs: number;
  dl: number;
  isHeader?: boolean;
  isSubtotal?: boolean;
  indent?: boolean;
  highlight?: 'blue' | 'orange' | 'green';
}) {
  const diff = gs - dl;

  const rowClass = isHeader
    ? 'bg-slate-700 text-slate-200'
    : isSubtotal
    ? highlight === 'blue'
      ? 'bg-blue-950 text-blue-200'
      : highlight === 'orange'
      ? 'bg-orange-950 text-orange-200'
      : highlight === 'green'
      ? 'bg-emerald-950 text-emerald-200'
      : 'bg-slate-750 text-slate-200 border-t border-slate-600'
    : 'text-slate-300 hover:bg-slate-750';

  return (
    <tr className={rowClass} style={{ fontSize: isHeader ? '0.7rem' : '0.72rem' }}>
      <td className={`px-3 py-1.5 ${indent ? 'pl-7' : ''}`}>
        {isHeader ? (
          <span style={{ fontWeight: 700, letterSpacing: '0.03em' }}>{label}</span>
        ) : isSubtotal ? (
          <span style={{ fontWeight: 700 }}>{label}</span>
        ) : (
          label
        )}
      </td>
      <td className="px-3 py-1.5 text-center text-slate-500">
        {maxScore ?? ''}
      </td>
      <td className="px-3 py-1.5 text-right font-mono">
        <span className={isSubtotal ? (highlight === 'blue' ? 'text-blue-300' : 'text-white') : ''}>
          {fmt(gs)}
        </span>
      </td>
      <td className="px-3 py-1.5 text-right font-mono">
        <span className={isSubtotal ? (highlight === 'orange' ? 'text-orange-300' : 'text-white') : ''}>
          {fmt(dl)}
        </span>
      </td>
      <td className="px-3 py-1.5 text-right font-mono">
        <DiffBadge val={diff} />
      </td>
    </tr>
  );
}

export function ScoreBreakdownTable({ gsScore, dlScore }: Props) {
  const { quantitative: gsQ, adjustment: gsA } = gsScore;
  const { quantitative: dlQ, adjustment: dlA } = dlScore;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
        <h3 className="text-white" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
          세부 평가 항목별 득점 현황
        </h3>
        <span className="text-slate-400" style={{ fontSize: '0.7rem' }}>
          계량(200점) + 가감점 기준
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-0 no-scrollbar" style={{ minHeight: 0 }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 border-b border-slate-700" style={{ fontSize: '0.68rem' }}>
              <th className="px-3 py-2 text-left text-slate-400 font-semibold w-48">구분</th>
              <th className="px-3 py-2 text-center text-slate-400 font-semibold w-16">배점</th>
              <th className="px-3 py-2 text-right text-blue-400 font-semibold w-24">GS컨소</th>
              <th className="px-3 py-2 text-right text-orange-400 font-semibold w-24">DL컨소</th>
              <th className="px-3 py-2 text-right text-slate-400 font-semibold w-20">GS-DL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {/* 계량평가 헤더 */}
            <ScoreRow label="■ 계량 평가" isHeader gs={0} dl={0} />

            <ScoreRow label="재무상태" maxScore="70" gs={gsQ.financialState} dl={dlQ.financialState} indent />
            <ScoreRow label="신용도" maxScore="65*" gs={gsQ.creditRating} dl={dlQ.creditRating} indent />
            <ScoreRow label="사업수행실적" maxScore="50" gs={gsQ.businessPerformance} dl={dlQ.businessPerformance} indent />
            <ScoreRow label="주관사 실적(감점)" maxScore="-15" gs={gsQ.mainContractorPenalty} dl={dlQ.mainContractorPenalty} indent />
            <ScoreRow label="중소기업 경쟁제품" maxScore="15*" gs={gsQ.smeProduct} dl={dlQ.smeProduct} indent />

            <ScoreRow label="계량 소계" gs={gsScore.quantitativeTotal} dl={dlScore.quantitativeTotal} isSubtotal highlight="blue" />

            {/* 가감점 헤더 */}
            <ScoreRow label="■ 가감점" isHeader gs={0} dl={0} />

            {/* 순서 수정된 가감점 항목들 */}
            <ScoreRow label="사고사망만인율" maxScore="-12*" gs={gsA.accidentDeath} dl={dlA.accidentDeath} indent />
            <ScoreRow label="산업재해 예방활동 실적" maxScore="-2" gs={gsA.safetyActivity} dl={dlA.safetyActivity} indent />
            <ScoreRow label="산업안전보건관리비 사용의무 위반" maxScore="-1" gs={gsA.safetyMgmtViolation} dl={dlA.safetyMgmtViolation} indent />
            <ScoreRow label="산업재해 보고의무 위반건수" maxScore="-2" gs={gsA.accidentReport} dl={dlA.accidentReport} indent />
            <ScoreRow label="산업안전보건법령 위반" maxScore="-1" gs={gsA.safetyLawViolation} dl={dlA.safetyLawViolation} indent />
            <ScoreRow label="환경관련법령 위반" maxScore="-1" gs={gsA.envViolation} dl={dlA.envViolation} indent />
            
            <ScoreRow label="중소기업 참여비율" maxScore="+6" gs={gsA.smeParticipation} dl={dlA.smeParticipation} indent />
            <ScoreRow label="LH 인정 특화기술 적용 계획" maxScore="+3" gs={gsA.lhSpecialTech} dl={dlA.lhSpecialTech} indent />
            <ScoreRow label="국가고객만족지수" maxScore="+4" gs={gsA.csIndex} dl={dlA.csIndex} indent />
            <ScoreRow label="회사채/기업어음 등급 평가" maxScore="+4" gs={gsA.bondRating} dl={dlA.bondRating} indent />
            <ScoreRow label="동반성장지수" maxScore="+4" gs={gsA.mutualGrowth} dl={dlA.mutualGrowth} indent />
            <ScoreRow label="신규업체 참여가점" maxScore="+6" gs={gsA.newCompany} dl={dlA.newCompany} indent />
            <ScoreRow label="건설현장 불법행위 신고" maxScore="+5" gs={gsA.illegalActivity} dl={dlA.illegalActivity} indent />
            
            <ScoreRow label="사업계획 이행 노력도" maxScore="-5" gs={gsA.businessPlan} dl={dlA.businessPlan} indent />
            <ScoreRow label="하자처리 이행 노력도" maxScore="-2" gs={gsA.defectHandling} dl={dlA.defectHandling} indent />
            <ScoreRow label="브랜드 적용" maxScore="+5" gs={gsA.brand} dl={dlA.brand} indent />
            <ScoreRow label="OSC 공법 사용" maxScore="+3" gs={gsA.osc} dl={dlA.osc} indent />
            
            <ScoreRow label="품질미흡통지서" maxScore="-12" gs={gsA.qualityDefect} dl={dlA.qualityDefect} indent />
            <ScoreRow label="품질우수통지서" maxScore="+6" gs={gsA.qualityExcellent} dl={dlA.qualityExcellent} indent />
            <ScoreRow label="벌점" maxScore="-12" gs={gsA.penalty} dl={dlA.penalty} indent />

            <ScoreRow label="가감점 소계" gs={gsScore.adjustmentTotal} dl={dlScore.adjustmentTotal} isSubtotal highlight="orange" />

            {/* 최종 합계 */}
            <ScoreRow label="■ 계량+가감점 합계" gs={gsScore.combinedTotal} dl={dlScore.combinedTotal} isSubtotal highlight="green" />

            {/* 비계량 / 가격 */}
            <ScoreRow label="비계량 (더미입력)" maxScore="600" gs={gsScore.nonQuantitative} dl={dlScore.nonQuantitative} indent />
            <ScoreRow label="가격평가 (더미입력)" maxScore="200" gs={gsScore.priceEvaluation} dl={dlScore.priceEvaluation} indent />

            <ScoreRow label="★ 최종 총점 (1000점)" gs={gsScore.grandTotal} dl={dlScore.grandTotal} isSubtotal highlight="blue" />
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-slate-700 shrink-0">
        <p className="text-slate-500" style={{ fontSize: '0.65rem' }}>
          * 배점 조정: 신용도 70→65점, 사고사망만인율 -8→-12점, 중소기업 경쟁제품 10→15점
        </p>
      </div>
    </div>
  );
}