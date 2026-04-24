// src/app/utils/sheetApi.ts
import Papa from 'papaparse';

const LOCAL_CSV_PATH = '/data.csv';

export interface CompanyData {
  id: string;
  name: string;
  isSME: boolean;
  creditType: 'CP' | 'Corporate' | 'Bond';
  creditGrade: string;
  performanceUnits: number;
  accidentDeathRate3yr: number;
  safetyActivityScore: number | null;
  safetyMgmtViolations: number;
  accidentReportViolations: number;
  safetyLawViolations: number;
  envViolations: number;
  csIndex: number | null;
  bondTypeForBonus: string;
  bondRatingForBonus: string;
  mutualGrowthRating: string;
  illegalActivityReports: number;
  qualityDefectNoticeScore: number;
  qualityExcellentNoticeScore: number;
  penaltyScore: number;
  businessPlanViolations: number;
  defectHandlingPenalty: number;
}

function parseNum(val: any, defaultVal: number = 0): number {
  if (val === null || val === undefined) return defaultVal;
  const str = String(val).replace(/,/g, '').trim();
  if (str === '해당없음' || str === '#N/A' || str === '') return defaultVal;
  
  const matched = str.match(/-?\d+(\.\d+)?/);
  return matched ? parseFloat(matched[0]) : defaultVal;
}

function parseNullableNum(val: any): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).replace(/,/g, '').trim();
  if (str === '해당없음' || str === '#N/A' || str === '') return null;
  
  const matched = str.match(/-?\d+(\.\d+)?/);
  return matched ? parseFloat(matched[0]) : null;
}

export async function fetchCompanyDB(): Promise<CompanyData[]> {
  try {
    const response = await fetch(LOCAL_CSV_PATH);
    if (!response.ok) throw new Error('data.csv 파일을 찾을 수 없습니다.');
    
    const csvData = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: (results: any) => {
          const companies = results.data.map((row: any) => {
            const getVal = (...keys: string[]) => {
              for (const k of keys) if (row[k] !== undefined) return row[k];
              const fallback = Object.keys(row).find(k => keys.some(key => k.replace(/\s+/g, '').includes(key.replace(/\s+/g, ''))));
              return fallback ? row[fallback] : undefined;
            };

            const rawName = getVal('업체명', '회사명', 'name');
            if (!rawName) return null;

            const rawCreditType = String(getVal('신용평가 대상', '신용평가대상') || '');
            let creditType: 'CP' | 'Corporate' | 'Bond' = 'Corporate';
            if (rawCreditType.includes('어음')) creditType = 'CP';
            if (rawCreditType.includes('회사채')) creditType = 'Bond';

            let bondType = String(getVal('회사채 또는 기업어음 등급 평가', '등급 평가') || '').trim();
            if (bondType.includes('어음')) bondType = '기업어음';
            else if (bondType.includes('회사채')) bondType = '회사채';
            else bondType = '없음';

            return {
              id: String(rawName),
              name: String(rawName),
              isSME: false,
              creditType,
              creditGrade: String(getVal('신용등급', 'creditGrade') || 'B0').trim(),
              performanceUnits: parseNum(getVal('사업수행실적', '수행실적')),
              accidentDeathRate3yr: parseNum(getVal('사고사망만인율', '만인율')),
              safetyActivityScore: parseNullableNum(getVal('산업재해예방활동 실적', '예방활동')),
              safetyMgmtViolations: parseNum(getVal('산업 안전보건관리비 사용의무 위반', '안전보건관리비')),
              accidentReportViolations: parseNum(getVal('산업재해발생 보고의무 위반', '보고의무')),
              safetyLawViolations: parseNum(getVal('산업안전보건법령 위반', '보건법령')),
              envViolations: parseNum(getVal('환경관련볍 위반', '환경관련법 위반', '환경법령')),
              csIndex: parseNullableNum(getVal('국가고객 만족지수', '고객만족')),
              bondTypeForBonus: bondType,
              bondRatingForBonus: String(getVal('회사채 또는 기업어음 등급', '어음 등급') || '').trim(),
              mutualGrowthRating: String(getVal('동반성장 지수', '동반성장') || '해당없음').trim(),
              illegalActivityReports: parseNum(getVal('건설현장 불법행위 신고', '불법행위')),
              businessPlanViolations: parseNum(getVal('사업계획 이행 노력도', '사업계획')),
              defectHandlingPenalty: parseNum(getVal('하자처리 이행 노력도', '하자처리')),
              qualityDefectNoticeScore: parseNum(getVal('품질미흡 통지서', '품질미흡')),
              qualityExcellentNoticeScore: parseNum(getVal('품질우수 통지서', '품질우수')),
              penaltyScore: parseNum(getVal('벌점')),
            };
          }).filter(Boolean);
          
          resolve(companies as CompanyData[]);
        },
        error: (error: any) => reject(error),
      });
    });
  } catch (error) {
    console.error('CSV Load Error:', error);
    return [];
  }
}

// 👇 새로 추가된 재무상태 평가배점 파싱 함수
export async function parseFinancialCSV(file: File): Promise<{ gs: any; dl: any }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        const gs = { profitability: 0, stability: 0, activity: 0, growth: 0 };
        const dl = { profitability: 0, stability: 0, activity: 0, growth: 0 };

        results.data.forEach((row: any) => {
          if (!Array.isArray(row) || row.length === 0) return;
          const title = String(row[0]).replace(/\s/g, ''); // 공백 제거하여 헤더 매칭
          
          if (['수익성비율', '안정성비율', '활동성비율', '성장성비율'].includes(title)) {
            // 한 행에서 숫자들만 순서대로 추출
            const nums = row.map(v => {
              const str = String(v).trim();
              if (!str || str === '-' || str.includes('비율')) return NaN;
              const matched = str.match(/-?\d+(\.\d+)?/);
              return matched ? parseFloat(matched[0]) : NaN;
            }).filter(v => !isNaN(v));

            // 데이터 포맷 기준 첫 4개의 숫자가 [당컨소 평가배점, 상대컨소 평가배점, 당컨소 LH환산배점, 상대컨소 LH환산배점] 순서로 배치됨
            if (nums.length >= 4) {
              const gsScore = nums[2];
              const dlScore = nums[3];
              
              if (title === '수익성비율') { gs.profitability = gsScore; dl.profitability = dlScore; }
              if (title === '안정성비율') { gs.stability = gsScore; dl.stability = dlScore; }
              if (title === '활동성비율') { gs.activity = gsScore; dl.activity = dlScore; }
              if (title === '성장성비율') { gs.growth = gsScore; dl.growth = dlScore; }
            }
          }
        });

        resolve({ gs, dl });
      },
      error: (err: any) => reject(err),
    });
  });
}