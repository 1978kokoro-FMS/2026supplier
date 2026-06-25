require('dotenv').config();
const path = require('path');
const express = require('express');
const multer = require('multer');
const { supabase } = require('./supabase');
const { uploadBuffer } = require('./storage');

const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function publicRow(row) {
  if (!row) return row;
  const { vendor_token, team_token, finance_token, ...rest } = row;
  return rest;
}

// ── 업체용 포털: 위험성평가 + 준수서약서 ──────────────────────
app.get('/api/vendor/:token', async (req, res) => {
  const { data, error } = await supabase
    .from('h1_2026_contracts')
    .select('*')
    .eq('vendor_token', req.params.token)
    .single();
  if (error || !data) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });
  res.json(publicRow(data));
});

app.post('/api/vendor/:token/risk-assessment', upload.single('file'), async (req, res) => {
  const { data: row } = await supabase
    .from('h1_2026_contracts')
    .select('id')
    .eq('vendor_token', req.params.token)
    .single();
  if (!row) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });

  const update = {
    risk_assessment_data: req.body.data ? JSON.parse(req.body.data) : null,
    risk_assessment_submitted_at: new Date().toISOString(),
  };
  if (req.file) update.risk_assessment_file = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
  if (req.body.signature) update.risk_assessment_signature = req.body.signature;

  const { error } = await supabase.from('h1_2026_contracts').update(update).eq('id', row.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/api/vendor/:token/pledge', async (req, res) => {
  const { signature, company_name, responsible_person } = req.body;
  if (!signature) return res.status(400).json({ error: '서명이 필요합니다.' });

  const { data: row } = await supabase
    .from('h1_2026_contracts')
    .select('id')
    .eq('vendor_token', req.params.token)
    .single();
  if (!row) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });

  const { error } = await supabase
    .from('h1_2026_contracts')
    .update({
      pledge_signature: signature,
      pledge_company_name: company_name,
      pledge_responsible_person: responsible_person,
      pledge_submitted_at: new Date().toISOString(),
    })
    .eq('id', row.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── 팀(발주담당자)용 포털: 적격수급업체평가표 + 안전작업허가서 ──
app.get('/api/team/:token', async (req, res) => {
  const { data, error } = await supabase
    .from('h1_2026_contracts')
    .select('*')
    .eq('team_token', req.params.token)
    .single();
  if (error || !data) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });
  res.json(publicRow(data));
});

app.post('/api/team/:token/permit', upload.single('file'), async (req, res) => {
  const { data: row } = await supabase
    .from('h1_2026_contracts')
    .select('id')
    .eq('team_token', req.params.token)
    .single();
  if (!row) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });

  const update = {
    permit_data: req.body.data ? JSON.parse(req.body.data) : null,
    permit_submitted_at: new Date().toISOString(),
  };
  if (req.file) update.permit_file = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
  if (req.body.supervisor_signature) update.permit_supervisor_signature = req.body.supervisor_signature;
  if (req.body.facility_signature) update.permit_facility_signature = req.body.facility_signature;
  if (req.body.worker_signature) update.permit_worker_signature = req.body.worker_signature;

  const { error } = await supabase.from('h1_2026_contracts').update(update).eq('id', row.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/api/team/:token/vendor-eval', async (req, res) => {
  const { data: row } = await supabase
    .from('h1_2026_contracts')
    .select('id')
    .eq('team_token', req.params.token)
    .single();
  if (!row) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });

  const update = {
    vendor_eval_data: req.body.data || null,
    vendor_eval_submitted_at: new Date().toISOString(),
  };
  if (req.body.signature) update.vendor_eval_signature = req.body.signature;

  const { error } = await supabase
    .from('h1_2026_contracts')
    .update(update)
    .eq('id', row.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── 재무회계팀용 포털: 안전보건관리계획서 ──────────────────────
app.get('/api/finance/:token', async (req, res) => {
  const { data, error } = await supabase
    .from('h1_2026_contracts')
    .select('*')
    .eq('finance_token', req.params.token)
    .single();
  if (error || !data) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });
  res.json(publicRow(data));
});

app.post('/api/finance/:token/safety-plan', upload.single('file'), async (req, res) => {
  const { data: row } = await supabase
    .from('h1_2026_contracts')
    .select('id')
    .eq('finance_token', req.params.token)
    .single();
  if (!row) return res.status(404).json({ error: '유효하지 않은 링크입니다.' });
  if (!req.file) return res.status(400).json({ error: '파일을 첨부해주세요.' });

  const { error } = await supabase
    .from('h1_2026_contracts')
    .update({
      safety_plan_file: await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype),
      safety_plan_submitted_at: new Date().toISOString(),
    })
    .eq('id', row.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── 관리자: 제출현황 대시보드 ──────────────────────────────────
function requireAdmin(req, res, next) {
  const pw = req.headers['x-admin-password'] || req.query.pw;
  if (pw !== (process.env.ADMIN_PASSWORD || 'changeme')) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
  next();
}

app.get('/api/admin/contracts', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('h1_2026_contracts')
    .select('*')
    .order('no', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/admin/contracts/:id', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('h1_2026_contracts')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: '찾을 수 없습니다.' });
  res.json(data);
});

module.exports = app;
