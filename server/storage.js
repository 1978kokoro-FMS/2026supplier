const { supabase } = require('./supabase');

const BUCKET = 'h1-2026-docs';

async function uploadBuffer(buffer, originalname, mimetype) {
  const ext = (originalname.match(/\.[^.]+$/) || [''])[0];
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimetype || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { uploadBuffer };
