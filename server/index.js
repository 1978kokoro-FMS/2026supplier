// 로컬 개발용 진입점. Vercel에서는 api/index.js가 server/app.js를 직접 사용합니다.
const app = require('./app');
const PORT = process.env.PORT || 3100;

app.listen(PORT, () => {
  console.log(`h1-2026-doc-collect 서버 실행 중: http://localhost:${PORT}`);
});
