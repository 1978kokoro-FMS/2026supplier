const { supabase } = require('./supabase');

const BUCKET = 'h1-2026-docs';

function randomPath(originalname) {
  const ext = (originalname.match(/\.[^.]+$/) || [''])[0];
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

async function uploadBuffer(buffer, originalname, mimetype) {
  const path = randomPath(originalname);
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimetype || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// 대용량 파일은 Vercel 서버리스 함수의 요청 본문 제한(4.5MB)에 걸리므로,
// 브라우저가 Supabase Storage로 직접 업로드할 수 있는 서명된 URL을 발급한다.
async function createUploadTicket(originalname) {
  const path = randomPath(originalname);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path: data.path, token: data.token, signedUrl: data.signedUrl };
}

function publicUrlFor(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { uploadBuffer, createUploadTicket, publicUrlFor };
