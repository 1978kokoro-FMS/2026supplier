# h1-2026-doc-collect

2026년 상반기 안전관리 서류(중대재해처벌법 이행점검용) 소급수집 도구.
기존 `safety-work-permint-main` 시스템과 완전히 분리된 별도 프로젝트/DB 테이블입니다.

## 구성
- 업체용: `/vendor.html?t=토큰` — 위험성평가, 안전작업 준수서약서(서명)
- 발주담당자(팀)용: `/team.html?t=토큰` — 안전작업허가서, 적격수급업체 평가표
- 재무회계팀용: `/finance.html?t=토큰` — 안전보건관리계획서
- 관리자: `/admin.html` — 제출현황 대시보드 (비밀번호: `.env`의 `ADMIN_PASSWORD`)

## 설치 및 실행

1. 의존성 설치
   ```
   npm install
   ```
2. `.env.example`을 복사해 `.env`로 만들고, 기존 시스템과 동일한 Supabase 프로젝트의
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`를 채워넣기 (단, 테이블은 새 테이블 사용)
3. Supabase SQL 에디터에서 `sql/setup.sql` 실행 (h1_2026_contracts 테이블 생성)
4. 정리된 엑셀(`상반기_공사용역_계약정리.xlsx`)을 DB로 가져오기
   ```
   node scripts/import-excel.js "C:\Users\user\Downloads\상반기_공사용역_계약정리.xlsx"
   ```
5. 서버 실행
   ```
   npm start
   ```
6. 관리자 대시보드(`http://localhost:3100/admin.html`)에서 업체/팀/재무회계팀 링크를 복사해 전달

## 주의
- 업로드 파일은 `./uploads` 폴더(로컬 디스크)에 저장됩니다. 운영 서버에 올릴 경우 디스크 경로를 영속 볼륨으로 잡아야 합니다.
- 작업유형별 필요서류 매트릭스는 `scripts/import-excel.js`의 `MATRIX` 객체에서 정의합니다. 엑셀의 "작업유형(직접입력)" 값과 정확히 일치해야 매칭됩니다.
