-- 2026년 상반기 안전관리 서류 소급수집용 테이블
-- 기존 work_contracts 테이블과 완전히 분리된 별도 테이블

create table if not exists h1_2026_contracts (
  id uuid primary key default gen_random_uuid(),
  no integer,
  team text,                  -- 담당팀
  business_name text,         -- 사업명
  vendor_name text,           -- 업체명
  contract_date date,
  memo text,                  -- 대표 적요
  amount numeric,
  approval_type text,         -- 품의유형 (공사/용역)
  work_type text,             -- 작업유형 (조경/소방점검/고소작업 등)
  finance_support text,       -- 재무회계팀 지원여부 (추후분류)

  -- 토큰 3종 (로그인 없이 접근)
  vendor_token text unique not null,
  team_token text unique not null,
  finance_token text unique not null,

  -- 필요서류 여부 (작업유형에 따라 다름, 수동 또는 자동 결정)
  needs_safety_plan boolean default true,        -- 안전보건관리계획서 (재무회계팀)
  needs_permit boolean default true,             -- 안전작업허가서 (발주담당자)
  needs_risk_assessment boolean default true,    -- 위험성평가 실시서류 (업체)
  needs_vendor_eval boolean default true,        -- 적격수급업체 평가표 (발주담당자)
  needs_pledge boolean default true,             -- 안전작업 준수서약서 (업체)

  -- 제출 데이터 (업체)
  risk_assessment_data jsonb,
  risk_assessment_file text,
  risk_assessment_submitted_at timestamptz,

  pledge_signature text,        -- 서명 base64 이미지
  pledge_company_name text,
  pledge_responsible_person text,
  pledge_submitted_at timestamptz,

  -- 제출 데이터 (팀=발주담당자)
  permit_data jsonb,
  permit_file text,
  permit_submitted_at timestamptz,

  vendor_eval_data jsonb,
  vendor_eval_submitted_at timestamptz,

  -- 제출 데이터 (재무회계팀)
  safety_plan_file text,
  safety_plan_submitted_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists idx_h1_2026_team on h1_2026_contracts(team);
create index if not exists idx_h1_2026_vendor on h1_2026_contracts(vendor_name);
