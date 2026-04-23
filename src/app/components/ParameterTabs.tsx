// src/app/components/ParameterTabs.tsx
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSimStore } from '../store/simulationStore';
import type { ConsortiumConfig, ConsortiumMember, CreditGrade } from '../types/simulation';
import { RotateCcw, Users, Calculator, TrendingDown, Info, ChevronLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

const CREDIT_GRADES: CreditGrade[] = [
  'AAA', 'AA+', 'AA0', 'AA-', 'A+', 'A0', 'A-', 'A20',
  'BBB+', 'BBB0', 'BBB-', 'BB+', 'BB0', 'BB-',
  'B+', 'B0', 'B-', 'CCC',
];

const MUTUAL_GROWTH_OPTIONS = ['최우수', '우수', '양호', '개선', '해당없음'];

// ── 공통 입력 컴포넌트들 ─────────────────────────────────────────────────────

function NumberInput({
  label, value, min, max, step = 0.1, onChange, unit = '',
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange(isNaN(val) ? 0 : val);
          }}
          className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-200 font-mono text-right w-20"
          style={{ fontSize: '0.72rem' }}
        />
        {unit && <span className="text-slate-500 whitespace-nowrap" style={{ fontSize: '0.68rem' }}>{unit}</span>}
      </div>
    </div>
  );
}

function SelectInput({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-200 text-right"
        style={{ fontSize: '0.72rem' }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ── 검색 가능한 업체 선택 콤보박스 ───────────────────────────────────────────
function CompanyCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="flex items-center justify-between bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white font-semibold shadow-sm focus:border-blue-500 outline-none w-full text-left"
          style={{ fontSize: '0.8rem' }}
        >
          <span className={value ? "truncate text-white" : "truncate text-slate-500"}>
            {value || "(공란)"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-slate-600 bg-slate-800" align="start">
        <Command className="bg-slate-800 text-white">
          <CommandInput placeholder="업체명 검색..." className="text-sm border-slate-700 focus:ring-0" />
          <CommandList className="max-h-[200px] overflow-y-auto no-scrollbar">
            <CommandEmpty className="py-3 text-center text-sm text-slate-400">
              검색 결과가 없습니다.
            </CommandEmpty>
            <CommandGroup>
              {/* 👇 공란 선택 옵션 추가 */}
              <CommandItem
                key="empty-select"
                value="공란"
                onSelect={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="text-sm text-slate-400 cursor-pointer italic"
              >
                (공란으로 비우기)
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="text-sm text-slate-200 cursor-pointer data-[selected=true]:bg-slate-700 data-[selected=true]:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`mr-2 h-4 w-4 text-blue-500 ${value === option ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── 지분율 패널 ──────────────────────────────────────────
function EquityPanel({
  consortium,
  consortiumType,
  updateEquity,
  applyCompanyData,
  updateMember,
  companyDB,
  color,
}: {
  consortium: ConsortiumConfig;
  consortiumType: 'gs' | 'dl';
  updateEquity: (id: string, v: number) => void;
  applyCompanyData: (type: 'gs'|'dl', memberId: string, companyName: string) => void;
  updateMember: (id: string, patch: Partial<ConsortiumMember>) => void;
  companyDB: any[];
  color: string;
}) {
  const total = consortium.members.reduce((s, m) => s + m.equityShare, 0);
  const isValid = Math.abs(total - 100) < 0.1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>{consortium.name}</h4>
        <span
          className={`px-2 py-0.5 rounded text-xs ${isValid ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}
          style={{ fontSize: '0.65rem', fontWeight: 700 }}
        >
          합계 {total.toFixed(1)}% {isValid ? '✓' : '⚠'}
        </span>
      </div>

      {consortium.members.map((m) => (
        <div key={m.id} className={`rounded-lg p-3 ${!m.name ? 'border border-slate-700/50 opacity-60' : 'bg-slate-750'}`} style={{ background: m.name ? 'rgba(51,65,85,0.5)' : 'transparent' }}>
          
          <div className="flex flex-col mb-3 gap-1">
            <span className="text-slate-400" style={{ fontSize: '0.65rem' }}>업체 선택 (검색 가능)</span>
            <CompanyCombobox
              value={m.name}
              options={
                companyDB.find(c => c.name === m.name) 
                  ? companyDB.map(c => c.name) 
                  : m.name ? [m.name, ...companyDB.map(c => c.name)] : companyDB.map(c => c.name)
              }
              onChange={(val) => {
                if (val === '') {
                  // 공란 선택 시 해당 칸 데이터 초기화
                  updateMember(m.id, {
                    name: '',
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
                    equityShare: 0, // 지분율도 0으로 초기화
                  });
                } else {
                  applyCompanyData(consortiumType, m.id, val);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 mb-2 min-h[1.5rem]">
            {m.isMainContractor && (
              <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: color + '20', color, fontSize: '0.6rem', fontWeight: 700 }}>주관사</span>
            )}
            {m.isSME && (
              <span className="px-1.5 py-0.5 rounded" style={{ background: '#059669' + '20', color: '#34d399', fontSize: '0.6rem', fontWeight: 700 }}>중소기업</span>
            )}
            {m.isNewCompany && (
              <span className="px-1.5 py-0.5 rounded" style={{ background: '#7c3aed' + '20', color: '#a78bfa', fontSize: '0.6rem', fontWeight: 700 }}>신규</span>
            )}
          </div>
          <div className="flex justify-between items-center mt-2 border-t border-slate-700 pt-2">
            <span className="text-slate-400" style={{ fontSize: '0.7rem' }}>지분율 입력</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0} max={100} step={0.1}
                value={m.equityShare}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateEquity(m.id, isNaN(val) ? 0 : val);
                }}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-200 font-mono text-right w-20 disabled:opacity-50"
                style={{ fontSize: '0.72rem' }}
                disabled={!m.name}
              />
              <span className="text-slate-500 font-mono" style={{ fontSize: '0.7rem' }}>%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 계량평가 패널 ───────────────────────────────────────────────
function QuantitativePanel({
  consortium,
  updateFinancials,
  updateMember,
  updateConsortium,
  color,
}: {
  consortium: ConsortiumConfig;
  updateFinancials: (key: keyof ConsortiumConfig['financials'], v: number) => void;
  updateMember: (id: string, patch: Partial<ConsortiumMember>) => void;
  updateConsortium: (patch: Partial<Omit<ConsortiumConfig, 'members' | 'financials'>>) => void;
  color: string;
}) {
  return (
    <div className="space-y-4">
      {/* 재무상태 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          재무상태 (배점 70점)
        </h5>
        <div className="space-y-2">
          <NumberInput label="수익성" value={consortium.financials.profitability} min={0} max={17.5} step={0.01} onChange={(v) => updateFinancials('profitability', v)} />
          <NumberInput label="안정성" value={consortium.financials.stability} min={0} max={17.5} step={0.01} onChange={(v) => updateFinancials('stability', v)} />
          <NumberInput label="활동성" value={consortium.financials.activity} min={0} max={17.5} step={0.01} onChange={(v) => updateFinancials('activity', v)} />
          <NumberInput label="성장성" value={consortium.financials.growth} min={0} max={17.5} step={0.01} onChange={(v) => updateFinancials('growth', v)} />
          <div className="border-t border-slate-600 pt-2 flex justify-between">
            <span className="text-slate-400" style={{ fontSize: '0.72rem' }}>재무상태 소계</span>
            <span className="font-mono text-white" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              {(consortium.financials.profitability + consortium.financials.stability + consortium.financials.activity + consortium.financials.growth).toFixed(2)}점
            </span>
          </div>
        </div>
      </div>

      {/* 신용도 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          신용도 (배점 65점*)
        </h5>
        <div className="space-y-2">
          {consortium.members.map((m) => (
            <div key={m.id} className={`flex items-center justify-between ${!m.name ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>{m.name || '(공란)'}</span>
                <span className="text-slate-500 whitespace-nowrap" style={{ fontSize: '0.65rem' }}>({m.equityShare}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={m.creditType}
                  onChange={(e) => updateMember(m.id, { creditType: e.target.value as any })}
                  className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-slate-400"
                  style={{ fontSize: '0.65rem' }}
                  disabled={!m.name}
                >
                  <option value="CP">기업어음</option>
                  <option value="Corporate">기업신용</option>
                  <option value="Bond">회사채</option>
                </select>
                <select
                  value={m.creditGrade}
                  onChange={(e) => updateMember(m.id, { creditGrade: e.target.value as CreditGrade })}
                  className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-slate-200"
                  style={{ fontSize: '0.72rem' }}
                  disabled={!m.name}
                >
                  {CREDIT_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 사업수행실적 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          사업수행실적 (배점 50점)
        </h5>
        <div className="space-y-2">
          {consortium.members.map((m) => m.name ? (
            <NumberInput
              key={m.id}
              label={`${m.name} (${m.equityShare}%)`}
              value={m.performanceUnits}
              min={0} max={100000} step={100}
              onChange={(v) => updateMember(m.id, { performanceUnits: v })}
              unit="세대"
            />
          ) : null)}
          <div className="border-t border-slate-600 pt-2 flex justify-between">
            <span className="text-slate-400" style={{ fontSize: '0.72rem' }}>컨소시엄 합계</span>
            <span className="font-mono text-white" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              {consortium.members.reduce((s, m) => s + m.performanceUnits, 0).toLocaleString()}세대
            </span>
          </div>
        </div>
      </div>

      {/* 비계량/가격 더미 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          비계량·가격 (더미 입력)
        </h5>
        <div className="space-y-2">
          <NumberInput
            label="비계량 (600점)"
            value={consortium.nonQuantitativeScore}
            min={0} max={600} step={1}
            onChange={(v) => updateConsortium({ nonQuantitativeScore: v })}
            unit="점"
          />
          <NumberInput
            label="가격평가 (200점)"
            value={consortium.priceScore}
            min={0} max={200} step={1}
            onChange={(v) => updateConsortium({ priceScore: v })}
            unit="점"
          />
        </div>
        <p className="text-slate-500 mt-2" style={{ fontSize: '0.65rem' }}>
          ※ 비계량·가격평가는 심사위원 평가 및 입찰가격으로 결정됨
        </p>
      </div>
    </div>
  );
}

// ── 가감점 패널 ─────────────────────────────────────────────────
function AdjustmentPanel({
  consortium,
  updateMember,
  updateConsortium,
  color,
}: {
  consortium: ConsortiumConfig;
  updateMember: (id: string, patch: Partial<ConsortiumMember>) => void;
  updateConsortium: (patch: Partial<Omit<ConsortiumConfig, 'members' | 'financials'>>) => void;
  color: string;
}) {
  return (
    <div className="space-y-4">
      {/* 1. 사고사망만인율 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <div className="flex items-start gap-2 mb-3">
          <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }}>
            사고사망만인율 (배점 -12점*)
          </h5>
          <span className="text-slate-500" title="3년 가중평균 만인율 / 업계평균(1.96) 비율로 감점 산정" style={{ cursor: 'help' }}>
            <Info size={12} />
          </span>
        </div>
        <p className="text-slate-500 mb-3" style={{ fontSize: '0.65rem' }}>
          3년 가중평균 만인율 직접 입력
        </p>
        <div className="space-y-2">
          {consortium.members.map((m) => m.name ? (
            <NumberInput
              key={m.id}
              label={`${m.name} (${m.equityShare}%)`}
              value={m.accidentDeathRate3yr}
              min={0} max={5} step={0.001}
              onChange={(v) => updateMember(m.id, { accidentDeathRate3yr: v })}
              unit="만인"
            />
          ) : null)}
        </div>
      </div>

      {/* 2. 산업재해예방활동 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          산업재해예방활동실적 (배점 -2점)
        </h5>
        <p className="text-slate-500 mb-3" style={{ fontSize: '0.65rem' }}>
          실적 점수 직접 입력 (해당없음 시 체크)
        </p>
        <div className="space-y-2">
          {consortium.members.map((m) => m.name ? (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <span className="text-slate-300 whitespace-nowrap" style={{ fontSize: '0.72rem', minWidth: 100 }}>
                {m.name} ({m.equityShare}%)
              </span>
              <div className="flex items-center gap-1 flex-1 justify-end">
                <input
                  type="number"
                  min={50} max={100} step={0.1}
                  value={m.safetyActivityScore ?? ''}
                  disabled={m.safetyActivityScore === null}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateMember(m.id, { safetyActivityScore: isNaN(val) ? 0 : val });
                  }}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-200 font-mono text-right w-16 disabled:opacity-30"
                  style={{ fontSize: '0.72rem' }}
                />
                <span className="font-mono text-slate-500 mr-2 whitespace-nowrap" style={{ fontSize: '0.7rem' }}>점</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m.safetyActivityScore === null}
                    onChange={(e) => updateMember(m.id, { safetyActivityScore: e.target.checked ? null : 85 })}
                    className="rounded"
                    style={{ accentColor: color }}
                  />
                  <span className="text-slate-500 whitespace-nowrap" style={{ fontSize: '0.65rem' }}>없음</span>
                </label>
              </div>
            </div>
          ) : null)}
        </div>
      </div>

      {/* 3~6. 위반 건수 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          위반 건수 (각 -1~-2점)
        </h5>
        <div className="space-y-2">
          {consortium.members.map((m) => m.name ? (
            <div key={m.id} className="rounded p-2" style={{ background: 'rgba(15,23,42,0.4)' }}>
              <p className="text-slate-300 mb-2" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                {m.name}
              </p>
              <div className="space-y-2">
                <NumberInput
                  label="안전관리비위반"
                  value={m.safetyMgmtViolations}
                  min={0} max={5} step={1}
                  onChange={(v) => updateMember(m.id, { safetyMgmtViolations: v })}
                  unit="건"
                />
                <NumberInput
                  label="산재보고위반"
                  value={m.accidentReportViolations}
                  min={0} max={10} step={1}
                  onChange={(v) => updateMember(m.id, { accidentReportViolations: v })}
                  unit="건"
                />
                <NumberInput
                  label="안전법령위반"
                  value={m.safetyLawViolations}
                  min={0} max={5} step={1}
                  onChange={(v) => updateMember(m.id, { safetyLawViolations: v })}
                  unit="건"
                />
                <NumberInput
                  label="환경법령위반"
                  value={m.envViolations}
                  min={0} max={5} step={1}
                  onChange={(v) => updateMember(m.id, { envViolations: v })}
                  unit="건"
                />
              </div>
            </div>
          ) : null)}
        </div>
      </div>

      {/* 7~11. 가점 항목 (공통 및 주관사) */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          가점 항목 (공통 및 주관사)
        </h5>
        <div className="space-y-2">
          {/* 7. 중소기업 참여비율 */}
          <NumberInput
            label="중소기업 참여비율"
            value={consortium.smeParticipationBudget}
            min={0} max={1000} step={10}
            onChange={(v) => updateConsortium({ smeParticipationBudget: v })}
            unit="억원"
          />
          {/* 8. LH 인정 특화기술 */}
          <NumberInput
            label="LH 인정 특화기술"
            value={consortium.lhSpecialTechCount}
            min={0} max={10} step={1}
            onChange={(v) => updateConsortium({ lhSpecialTechCount: v })}
            unit="건"
          />
          
          {/* 9~11. 주관사 전용 */}
          {consortium.members.filter((m) => m.isMainContractor && m.name).map((m) => (
            <div key={m.id} className="space-y-2 pt-2 mt-2 border-t border-slate-600">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>국가고객만족지수</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0} max={100} step={0.01}
                    value={m.csIndex ?? 0}
                    disabled={m.csIndex === null}
                    onChange={(e) => updateMember(m.id, { csIndex: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-200 font-mono text-right w-16"
                    style={{ fontSize: '0.72rem' }}
                  />
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.csIndex === null}
                      onChange={(e) => updateMember(m.id, { csIndex: e.target.checked ? null : 78 })}
                      style={{ accentColor: color }}
                    />
                    <span className="text-slate-500 whitespace-nowrap" style={{ fontSize: '0.65rem' }}>해당없음</span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>회사채/CP 등급</span>
                <div className="flex gap-1">
                  <select
                    value={m.bondTypeForBonus ?? '없음'}
                    onChange={(e) => updateMember(m.id, { 
                      bondTypeForBonus: e.target.value as any,
                      bondRatingForBonus: e.target.value === '회사채' ? 'A이상' : e.target.value === '기업어음' ? 'A2이상' : null
                    })}
                    className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-slate-200"
                    style={{ fontSize: '0.72rem' }}
                  >
                    <option value="없음">없음</option>
                    <option value="회사채">회사채</option>
                    <option value="기업어음">기업어음</option>
                  </select>

                  {m.bondTypeForBonus && m.bondTypeForBonus !== '없음' && (
                    <select
                      value={m.bondRatingForBonus ?? ''}
                      onChange={(e) => updateMember(m.id, { bondRatingForBonus: e.target.value })}
                      className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-slate-200"
                      style={{ fontSize: '0.72rem', minWidth: '4rem' }}
                    >
                      {m.bondTypeForBonus === '회사채' ? (
                        <>
                          <option value="A이상">A이상</option>
                          <option value="A-">A-</option>
                          <option value="BBB+">BBB+</option>
                          <option value="기타">기타</option>
                        </>
                      ) : (
                        <>
                          <option value="A2이상">A2이상</option>
                          <option value="A2-">A2-</option>
                          <option value="A3+">A3+</option>
                          <option value="기타">기타</option>
                        </>
                      )}
                    </select>
                  )}
                </div>
              </div>

              <SelectInput
                label="동반성장지수"
                value={m.mutualGrowthRating}
                options={MUTUAL_GROWTH_OPTIONS}
                onChange={(v) => updateMember(m.id, { mutualGrowthRating: v as any })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 12~15. 기타 지표 (신규/신고/노력도) */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          기타 지표 (신규/신고/노력도)
        </h5>
        
        <div className="space-y-4">
          {/* 12. 신규업체 */}
          <div>
            <p className="text-slate-400 mb-2" style={{ fontSize: '0.72rem' }}>신규업체 참여가점</p>
            <div className="flex flex-wrap gap-2">
              {consortium.members.map((m) => m.name ? (
                <label key={m.id} className="flex items-center gap-1 cursor-pointer bg-slate-800 px-2 py-1 rounded border border-slate-700">
                  <input
                    type="checkbox"
                    checked={m.isNewCompany}
                    onChange={(e) => updateMember(m.id, { isNewCompany: e.target.checked })}
                    style={{ accentColor: color }}
                  />
                  <span className="text-slate-300" style={{ fontSize: '0.65rem' }}>{m.name}</span>
                </label>
              ) : null)}
            </div>
          </div>

          {/* 13. 불법신고 */}
          <div className="border-t border-slate-600 pt-3">
            <NumberInput
              label="건설현장 불법행위 신고"
              value={consortium.illegalActivityReports || 0}
              min={0} max={10} step={1}
              onChange={(v) => updateConsortium({ illegalActivityReports: v })}
              unit="회"
            />
          </div>

          {/* 14, 15. 노력도 */}
          <div className="border-t border-slate-600 pt-3">
            <p className="text-slate-400 mb-2" style={{ fontSize: '0.72rem' }}>사업계획 및 하자처리 (업체별)</p>
            <div className="space-y-2">
              {consortium.members.map((m) => m.name ? (
                <div key={m.id} className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-slate-300 w-16" style={{ fontSize: '0.65rem', fontWeight: 600 }}>{m.name}</span>
                  <div className="flex-1 space-y-2">
                    <NumberInput
                      label="사업계획위반"
                      value={m.businessPlanViolations || 0}
                      min={0} max={10} step={1}
                      onChange={(v) => updateMember(m.id, { businessPlanViolations: v })}
                      unit="건"
                    />
                    <NumberInput
                      label="하자처리감점"
                      value={m.defectHandlingPenalty || 0}
                      min={0} max={10} step={0.1}
                      onChange={(v) => updateMember(m.id, { defectHandlingPenalty: v })}
                      unit="점"
                    />
                  </div>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      </div>

      {/* 16~17. 브랜드 및 OSC 공법 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          브랜드 및 OSC 공법
        </h5>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>브랜드 적용</span>
            <select
              value={consortium.brandApplication || 'none'}
              onChange={(e) => updateConsortium({ brandApplication: e.target.value as any })}
              className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-slate-200"
              style={{ fontSize: '0.72rem' }}
            >
              <option value="none">미적용 (0점)</option>
              <option value="main">주관사 메인 (5점)</option>
              <option value="rental">주관사 임대 (0점)</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-slate-400 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>OSC 공법 최대구간</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consortium.oscMaxScore}
                onChange={(e) => updateConsortium({ oscMaxScore: e.target.checked })}
                style={{ accentColor: color }}
              />
              <span className="text-slate-300 whitespace-nowrap" style={{ fontSize: '0.72rem' }}>
                {consortium.oscMaxScore ? '적용 (+3점)' : '미적용'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 18~19. 품질통지서 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          품질통지서 (미흡: -12점 / 우수: +6점)
        </h5>
        <div className="space-y-2">
          {consortium.members.map((m) => m.name ? (
            <div key={m.id} className="rounded p-2" style={{ background: 'rgba(15,23,42,0.4)' }}>
              <p className="text-slate-300 mb-2" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                {m.name}
              </p>
              <div className="space-y-2">
                <NumberInput
                  label="미흡통지서(점)"
                  value={m.qualityDefectNoticeScore}
                  min={0} max={20} step={4}
                  onChange={(v) => updateMember(m.id, { qualityDefectNoticeScore: v })}
                  unit=""
                />
                <NumberInput
                  label="우수통지서(점)"
                  value={m.qualityExcellentNoticeScore}
                  min={0} max={6} step={2}
                  onChange={(v) => updateMember(m.id, { qualityExcellentNoticeScore: v })}
                  unit=""
                />
              </div>
              <p className="text-slate-600 mt-2" style={{ fontSize: '0.6rem' }}>
                미흡: 1회=4점. 우수: 1회=2점, 2회=4점, 3회=6점(max)
              </p>
            </div>
          ) : null)}
        </div>
      </div>

      {/* 20. 벌점 */}
      <div className="bg-slate-750 rounded-lg p-3" style={{ background: 'rgba(51,65,85,0.5)' }}>
        <h5 style={{ color, fontSize: '0.8rem', fontWeight: 700 }} className="mb-3">
          벌점 (-12점)
        </h5>
        <div className="space-y-2">
          {consortium.members.map((m) => m.name ? (
            <NumberInput
              key={m.id}
              label={m.name}
              value={m.penaltyScore}
              min={0} max={10} step={0.1}
              onChange={(v) => updateMember(m.id, { penaltyScore: v })}
              unit="점"
            />
          ) : null)}
        </div>
      </div>
    </div>
  );
}

// ── 메인 파라미터 탭 컴포넌트 ────────────────────────────────────────────────
type TabId = 'equity' | 'quant' | 'adjust';

export function ParameterTabs({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('equity');
  const [activeConsortium, setActiveConsortium] = useState<'gs' | 'dl'>('gs');

  const {
    gsConsortium, dlConsortium,
    companyDB, loadCompanyDB, applyCompanyData, 
    updateGsFinancials, updateGsMember, updateGsConsortium, updateGsEquity,
    updateDlFinancials, updateDlMember, updateDlConsortium, updateDlEquity,
    resetToDefaults,
  } = useSimStore();

  useEffect(() => {
    if (companyDB.length === 0) {
      loadCompanyDB();
    }
  }, [companyDB.length, loadCompanyDB]);

  const tabs: { id: TabId; icon: ReactNode; label: string }[] = [
    { id: 'equity', icon: <Users size={14} />, label: '지분율 / 업체선택' },
    { id: 'quant', icon: <Calculator size={14} />, label: '계량평가' },
    { id: 'adjust', icon: <TrendingDown size={14} />, label: '가감점' },
  ];

  const consortium = activeConsortium === 'gs' ? gsConsortium : dlConsortium;
  const color = activeConsortium === 'gs' ? '#60a5fa' : '#fb923c';

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-white" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            파라미터 조작
          </h3>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            style={{ fontSize: '0.65rem' }}
          >
            <RotateCcw size={12} />
            초기값 복원
          </button>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="패널 숨기기"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Consortium Toggle */}
      <div className="px-4 pt-3 flex gap-2">
        <button
          onClick={() => setActiveConsortium('gs')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${activeConsortium === 'gs' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          style={{ fontSize: '0.75rem', fontWeight: 600 }}
        >
          GS건설 컨소시엄
        </button>
        <button
          onClick={() => setActiveConsortium('dl')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${activeConsortium === 'dl' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          style={{ fontSize: '0.75rem', fontWeight: 600 }}
        >
          DL건설 컨소시엄
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 pt-2 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
              activeTab === tab.id
                ? 'text-white border-b-2'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={{
              fontSize: '0.72rem',
              fontWeight: activeTab === tab.id ? 700 : 400,
              borderBottomColor: activeTab === tab.id ? color : 'transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content (no-scrollbar) */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar" style={{ minHeight: 0 }}>
        {activeTab === 'equity' && (
          <EquityPanel
            consortium={consortium}
            consortiumType={activeConsortium}
            updateEquity={activeConsortium === 'gs' ? updateGsEquity : updateDlEquity}
            applyCompanyData={applyCompanyData}
            updateMember={activeConsortium === 'gs' ? updateGsMember : updateDlMember} // 👇 추가
            companyDB={companyDB}
            color={color}
          />
        )}
        {activeTab === 'quant' && (
          <QuantitativePanel
            consortium={consortium}
            updateFinancials={activeConsortium === 'gs' ? updateGsFinancials : updateDlFinancials}
            updateMember={activeConsortium === 'gs' ? updateGsMember : updateDlMember}
            updateConsortium={activeConsortium === 'gs' ? updateGsConsortium : updateDlConsortium}
            color={color}
          />
        )}
        {activeTab === 'adjust' && (
          <AdjustmentPanel
            consortium={consortium}
            updateMember={activeConsortium === 'gs' ? updateGsMember : updateDlMember}
            updateConsortium={activeConsortium === 'gs' ? updateGsConsortium : updateDlConsortium}
            color={color}
          />
        )}
      </div>
    </div>
  );
}