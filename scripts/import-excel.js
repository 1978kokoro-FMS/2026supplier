// 상반기_공사용역_계약정리.xlsx (공사/용역 시트, 제외 제외) → h1_2026_contracts 테이블로 가져오기
// 사용법: node scripts/import-excel.js "C:\Users\user\Downloads\상반기_공사용역_계약정리.xlsx"
require('dotenv').config();
const path = require('path');
const xlsx = require('xlsx');
const { nanoid } = require('nanoid');
const { supabase } = require('../server/supabase');

// 작업유형별 필요서류 매트릭스 (사용자 제공 표 기준)
// [안전보건관리계획서(재무), 안전작업허가서(팀), 위험성평가(업체), 적격평가표(팀), 준수서약서(업체)]
const MATRIX = {
  '조경업체(예초작업)': [false, true, true, true, true],
  '소방 점검': [true, true, true, true, true],
  '소방 보수': [true, true, true, true, true],
  '승강기 점검': [true, true, true, true, true],
  '승강기 보수': [true, true, true, true, true],
  '전기 점검': [true, true, true, true, true],
  '전기보수': [true, true, true, true, true],
  '저수조청소': [true, true, true, true, true],
  '여과제 교체': [true, true, true, true, true],
  '보일러 세관': [true, true, true, true, true],
  '시설물안전법 점검용역': [true, true, true, true, true],
  '고소 작업': [false, true, true, true, true],
  '일반 작업(보수공사)': [false, false, true, true, true],
};
const DEFAULT_FLAGS = [false, false, true, true, true]; // 미매칭 작업유형 기본값 (일반 작업과 동일)

function flagsFor(workType) {
  return MATRIX[workType] || DEFAULT_FLAGS;
}

function excelDateToISO(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = xlsx.SSF.parse_date_code(val);
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  return String(val);
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('사용법: node scripts/import-excel.js <엑셀파일경로>');
    process.exit(1);
  }

  const wb = xlsx.readFile(path.resolve(filePath));
  const rowsToInsert = [];

  for (const sheetName of ['공사', '용역']) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) { console.warn(`시트 없음: ${sheetName}`); continue; }
    const json = xlsx.utils.sheet_to_json(sheet, { defval: null });

    for (const r of json) {
      const workType = r['작업유형(직접입력)'] || '일반 작업(보수공사)';
      const [needsPlan, needsPermit, needsRisk, needsEval, needsPledge] = flagsFor(workType);

      rowsToInsert.push({
        no: r['No'],
        team: r['담당팀'],
        business_name: r['사업명'],
        vendor_name: r['업체명'],
        contract_date: excelDateToISO(r['계약일자']),
        memo: r['대표 적요'],
        amount: r['집행액합계'],
        approval_type: r['품의유형'] || sheetName,
        work_type: workType,
        finance_support: r['재무회계팀 지원여부(추후분류)'] || null,
        vendor_token: nanoid(12),
        team_token: nanoid(12),
        finance_token: nanoid(12),
        needs_safety_plan: needsPlan,
        needs_permit: needsPermit,
        needs_risk_assessment: needsRisk,
        needs_vendor_eval: needsEval,
        needs_pledge: needsPledge,
      });
    }
  }

  console.log(`가져올 행: ${rowsToInsert.length}건`);

  const chunkSize = 200;
  for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
    const chunk = rowsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('h1_2026_contracts').insert(chunk);
    if (error) {
      console.error('삽입 오류:', error.message);
      process.exit(1);
    }
    console.log(`  ${i + chunk.length}/${rowsToInsert.length} 완료`);
  }

  console.log('가져오기 완료.');
}

main();
