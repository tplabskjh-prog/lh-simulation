import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { ScoreResult } from '../types/simulation';

interface Props {
  gsScore: ScoreResult;
  dlScore: ScoreResult;
}

const BLUE = '#60a5fa';
const ORANGE = '#fb923c';

// Radar 데이터: 각 항목을 0~100 스케일로 정규화
function buildRadarData(gs: ScoreResult, dl: ScoreResult) {
  const normalize = (val: number, max: number) => Math.max(0, Math.min(100, (val / max) * 100));

  return [
    {
      subject: '재무상태',
      GS: normalize(gs.quantitative.financialState, 70),
      DL: normalize(dl.quantitative.financialState, 70),
      fullMark: 100,
    },
    {
      subject: '신용도',
      GS: normalize(gs.quantitative.creditRating, 65),
      DL: normalize(dl.quantitative.creditRating, 65),
      fullMark: 100,
    },
    {
      subject: '사업실적',
      GS: normalize(gs.quantitative.businessPerformance, 50),
      DL: normalize(dl.quantitative.businessPerformance, 50),
      fullMark: 100,
    },
    {
      subject: '안전관리',
      GS: normalize(20 + gs.adjustment.accidentDeath + gs.adjustment.safetyActivity, 20),
      DL: normalize(20 + dl.adjustment.accidentDeath + dl.adjustment.safetyActivity, 20),
      fullMark: 100,
    },
    {
      subject: '국가평가',
      GS: normalize(gs.adjustment.csIndex + gs.adjustment.mutualGrowth, 8),
      DL: normalize(dl.adjustment.csIndex + dl.adjustment.mutualGrowth, 8),
      fullMark: 100,
    },
    {
      subject: '품질관리',
      GS: normalize(6 + gs.adjustment.qualityDefect + gs.adjustment.qualityExcellent, 12),
      DL: normalize(6 + dl.adjustment.qualityDefect + dl.adjustment.qualityExcellent, 12),
      fullMark: 100,
    },
    {
      subject: '가감점 합계',
      GS: normalize(30 + gs.adjustment.total, 60),
      DL: normalize(30 + dl.adjustment.total, 60),
      fullMark: 100,
    },
  ];
}

// Bar 데이터: 항목별 GS vs DL 절대점수 비교
function buildBarData(gs: ScoreResult, dl: ScoreResult) {
  return [
    { name: '재무상태', GS: +gs.quantitative.financialState.toFixed(2), DL: +dl.quantitative.financialState.toFixed(2) },
    { name: '신용도', GS: +gs.quantitative.creditRating.toFixed(2), DL: +dl.quantitative.creditRating.toFixed(2) },
    { name: '사업실적', GS: +gs.quantitative.businessPerformance.toFixed(2), DL: +dl.quantitative.businessPerformance.toFixed(2) },
    { name: '중소기업', GS: +gs.quantitative.smeProduct.toFixed(2), DL: +dl.quantitative.smeProduct.toFixed(2) },
    { name: '사고사망\n만인율', GS: +gs.adjustment.accidentDeath.toFixed(3), DL: +dl.adjustment.accidentDeath.toFixed(3) },
    { name: '재해예방\n활동', GS: +gs.adjustment.safetyActivity.toFixed(3), DL: +dl.adjustment.safetyActivity.toFixed(3) },
    { name: '국가만족\n지수', GS: +gs.adjustment.csIndex.toFixed(2), DL: +dl.adjustment.csIndex.toFixed(2) },
    { name: '동반성장\n지수', GS: +gs.adjustment.mutualGrowth.toFixed(2), DL: +dl.adjustment.mutualGrowth.toFixed(2) },
    { name: '신규업체\n가점', GS: +gs.adjustment.newCompany.toFixed(2), DL: +dl.adjustment.newCompany.toFixed(2) },
    { name: '품질통지서\n합산', GS: +(gs.adjustment.qualityDefect + gs.adjustment.qualityExcellent).toFixed(3), DL: +(dl.adjustment.qualityDefect + dl.adjustment.qualityExcellent).toFixed(3) },
  ];
}

// Gap 차트: 항목별 GS - DL 차이
function buildGapData(gs: ScoreResult, dl: ScoreResult) {
  const gap = (a: number, b: number) => +(a - b).toFixed(3);
  return [
    { name: '재무상태', gap: gap(gs.quantitative.financialState, dl.quantitative.financialState) },
    { name: '신용도', gap: gap(gs.quantitative.creditRating, dl.quantitative.creditRating) },
    { name: '사고사망만인율', gap: gap(gs.adjustment.accidentDeath, dl.adjustment.accidentDeath) },
    { name: '재해예방활동', gap: gap(gs.adjustment.safetyActivity, dl.adjustment.safetyActivity) },
    { name: '국가만족지수', gap: gap(gs.adjustment.csIndex, dl.adjustment.csIndex) },
    { name: '동반성장지수', gap: gap(gs.adjustment.mutualGrowth, dl.adjustment.mutualGrowth) },
    { name: '신규업체가점', gap: gap(gs.adjustment.newCompany, dl.adjustment.newCompany) },
    { name: '품질통지서', gap: gap(gs.adjustment.qualityDefect + gs.adjustment.qualityExcellent, dl.adjustment.qualityDefect + dl.adjustment.qualityExcellent) },
    { name: '벌점', gap: gap(gs.adjustment.penalty, dl.adjustment.penalty) },
    { name: '회사채/CP', gap: gap(gs.adjustment.bondRating, dl.adjustment.bondRating) },
  ].sort((a, b) => b.gap - a.gap);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl" style={{ fontSize: '0.75rem' }}>
        <p className="text-slate-300 mb-1" style={{ fontWeight: 700 }}>{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ComparisonCharts({ gsScore, dlScore }: Props) {
  const radarData = buildRadarData(gsScore, dlScore);
  const barData = buildBarData(gsScore, dlScore);
  const gapData = buildGapData(gsScore, dlScore);

  return (
    <div className="space-y-4">
      {/* 레이더 차트 + Gap 차트 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 레이더 차트 */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h4 className="text-slate-200 mb-3" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            평가항목 방사형 비교 (정규화 0~100)
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />
              <Radar name="GS컨소" dataKey="GS" stroke={BLUE} fill={BLUE} fillOpacity={0.15} strokeWidth={2} />
              <Radar name="DL컨소" dataKey="DL" stroke={ORANGE} fill={ORANGE} fillOpacity={0.15} strokeWidth={2} />
              <Legend
                wrapperStyle={{ fontSize: '0.72rem', color: '#9ca3af' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap 차트 */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h4 className="text-slate-200 mb-3" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            항목별 GS - DL 점수 격차
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={gapData}
              layout="vertical"
              margin={{ left: 16, right: 30, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
              <Bar
                dataKey="gap"
                name="GS - DL"
                radius={[0, 3, 3, 0]}
              >
                {gapData.map((entry, index) => (
                  <Cell key={`cell-gap-${index}`} fill={entry.gap >= 0 ? BLUE : ORANGE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 항목별 절대점수 막대 차트 */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h4 className="text-slate-200 mb-3" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
          평가항목별 절대점수 비교
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: '#9ca3af' }} />
            <Bar dataKey="GS" name="GS컨소" fill={BLUE} radius={[3, 3, 0, 0]} />
            <Bar dataKey="DL" name="DL컨소" fill={ORANGE} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}