// SolaNavi Service Worker - 기본 오프라인 캐시 + PWA 설치 프롬프트 활성화
const CACHE_NAME = 'solanavi-v1.3.0';
const CORE_FILES = [
  '/',
  '/index.html',
  '/SolaNavi.html',
  '/SolaNavi_소개서.html',
  '/SolaNavi_사용가이드북.html',
  '/SolaNavi_결제안내.html',
  '/SolaNavi_이용약관.html',
  '/SolaNavi_개인정보처리방침.html',
  '/SolaNavi_기관협의.html',
  '/manifest.json',
  '/icon.svg'
];

// 설치: 핵심 파일 미리 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 오래된 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 요청 처리: 네트워크 우선, 실패 시 캐시 폴백
self.addEventListener('fetch', event => {
  const req = event.request;
  // API 호출 (워커)은 캐시 안 함
  if (req.url.includes('solanavi-api.hnsane.workers.dev') ||
      req.url.includes('api.anthropic.com') ||
      req.url.includes('api.openai.com')) {
    return; // 기본 fetch
  }
  // HTML/리소스는 네트워크 우선 → 실패 시 캐시
  if (req.method === 'GET') {
    event.respondWith(
      fetch(req)
        .then(res => {
          // 성공 응답은 캐시 업데이트
          if (res.ok && (req.url.endsWith('.html') || req.url.endsWith('/') || req.url.endsWith('.json') || req.url.endsWith('.svg'))) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
