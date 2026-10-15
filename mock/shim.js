/* Behind 콘텐츠 스튜디오 — 포트폴리오용 목업 층
 * · 실제 서버·Firebase 와 전혀 연결되지 않는다. /api 요청은 이 파일이 브라우저 안에서 답한다.
 * · 읽기 = 함께 실린 스냅숏(mock/data) · 쓰기 = 이 탭 안에서만 기억(sessionStorage) — 새로고침하면 처음 상태로 돌아갈 수 있다.
 * · 외부로 나가는 fetch 는 막는다(글꼴 제외). */
(function () {
  'use strict';
  var ME = 'demo@behind.studio';
  var 스크립트 = document.currentScript && document.currentScript.src ? document.currentScript.src : location.href;
  var MOCK = new URL('./', 스크립트).href;            // …/behind-studio/mock/
  var ROOT = new URL('../', MOCK).href;               // …/behind-studio/
  var DATA = MOCK + 'data/';
  var 진짜fetch = window.fetch.bind(window);
  var 절대 = function (p) { return new URL(p, ROOT).href; };
  /* 스냅숏 안의 상대 경로(media/… · ../mc-three-days/… · mock/…)를 절대 주소로 — 재생기(iframe)에 넘겨도 깨지지 않게 */
  function 경로풀기(글) {
    return 글.replace(/"((?:media|mock)\/[^"\\]+|play\/akneo\/[^"\\]+)"/g, function (m, p) { return JSON.stringify(절대(p)); });
  }
  var 받은 = {};
  function 싣기(이름) {
    if (!받은[이름]) 받은[이름] = 진짜fetch(DATA + 이름 + '.json').then(function (r) { if (!r.ok) throw new Error(이름 + ' ' + r.status); return r.text(); }).then(function (t) { return JSON.parse(경로풀기(t)); });
    return 받은[이름];
  }
  var 쉬 = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var 복사 = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };

  /* ── 가짜 Firebase 로그인 ── */
  var 사용자 = { email: ME, uid: 'demo', displayName: '데모', getIdToken: function () { return Promise.resolve('mock-token'); } };
  var 인증 = {
    currentUser: 사용자,
    onAuthStateChanged: function (cb) { setTimeout(function () { cb(사용자); }, 0); return function () {}; },
    signOut: function () { try { window.toast && window.toast('목업에서는 로그아웃하지 않아요'); } catch (e) {} return Promise.resolve(); },
    signInWithPopup: function () { return Promise.resolve({ user: 사용자 }); },
  };
  var 인증함수 = function () { return 인증; }; 인증함수.GoogleAuthProvider = function () {};
  window.firebase = { initializeApp: function () { return {}; }, auth: 인증함수 };

  /* 처음 여는 사람에게는 «결과»를 모두의 작품으로(데모 계정이 마친 작품이 없어 «내 작품»이 비어 보인다) */
  try { if (localStorage.getItem('ct.resScope') == null) localStorage.setItem('ct.resScope', JSON.stringify('all')); } catch (e) {}

  /* ── 이 탭의 기억(쓰기) ── */
  var 열쇠 = 'behind-mock-v1';
  var 기억 = { 새일감: [], 고침: {}, 평가: [], 요청: [], 요청결정: {}, 초안: {}, 초안지움: {}, 올림: [], 숨긴올림: {}, 그래프: {}, 프롬프트: {}, 슬롯: [], 줄거리: [], n: 0 };
  try { var 옛 = sessionStorage.getItem(열쇠); if (옛) 기억 = Object.assign(기억, JSON.parse(옛)); } catch (e) {}
  function 남기기() { try { sessionStorage.setItem(열쇠, JSON.stringify(기억)); } catch (e) { /* 저장소가 막혀도 목업은 돈다 */ } }
  var 새id = function (머리) { 기억.n++; return (머리 || 'mock') + '-' + Date.now().toString(36) + '-' + 기억.n; };

  /* ── 일감 모음 ── */
  var 색인P = null; var 프로젝트표 = {};
  function 색인() { return 색인P || (색인P = 싣기('index')); }
  function 작품일감(p) { var f = (p || '_none').replace(/[^A-Za-z0-9_-]/g, '_'); if (!프로젝트표[f]) 프로젝트표[f] = 싣기('p/' + f).catch(function () { return []; }); return 프로젝트표[f]; }
  function 새일감틱(j) {
    if (!j.__m) return j;
    var 지남 = Date.now() - j.createdAt; var 판 = j.__m;
    if (j.status === 'canceled' || j.status === 'error') return j;
    if (지남 < 판.시작) { j.status = 'queued'; return j; }
    if (지남 < 판.끝) { j.status = 'running'; j.startedAt = j.createdAt + 판.시작; var 진행 = Math.round((지남 - 판.시작) / (판.끝 - 판.시작) * 100); j.log = [시각(j.startedAt) + ' 만드는 중 — 목업이라 실제로 그리지는 않아요 (' + 진행 + '%)']; return j; }
    if (j.status !== 'done') { j.status = 'done'; j.doneAt = j.createdAt + 판.끝; j.results = j.__결과 || []; j.log = [시각(j.doneAt) + ' 다 됐어요 — 목업: 예전에 만든 결과를 보여 줘요']; }
    return j;
  }
  function 시각(t) { var d = new Date(t); var z = function (n) { return String(n).padStart(2, '0'); }; return z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()); }
  function 고침입히기(j) {
    var o = 기억.고침[j.id]; if (!o) return j; var x = Object.assign({}, j);
    for (var k in o) { if (k === '__flags' || k === '__story' || k === '__userProfiles' || k === '__vn') continue; x[k] = o[k]; }
    if (o.__story != null) x.results = (x.results || []).map(function (r) { return r && r.type === 'text' && r.stage === 'claude' ? Object.assign({}, r, { text: o.__story }) : r; });
    if (o.__userProfiles) { try { var d = JSON.parse(o.__userProfiles); x.results = (x.results || []).map(function (r) { return r && r.type === 'json' && r.group === 'userProfiles' ? Object.assign({}, r, { data: Object.assign({}, r.data, { 프로필: d.프로필 }) }) : r; }); } catch (e) {} }
    if (o.__vn) x.results = (x.results || []).map(function (r) { if (!(r && r.type === 'json' && r.data && r.data.연출 === 'branch')) return r; var d = Object.assign({}, r.data); var v = o.__vn; for (var kk in v) { if (kk === '자산') d.자산 = Object.assign({}, d.자산 || {}, v.자산); else d[kk] = v[kk]; } return Object.assign({}, r, { data: d }); });
    if (o.__flags && o.__flags.length) x.results = (x.results || []).map(function (r, i) {
      var y = r; o.__flags.forEach(function (f) { if (f.i !== i) return; y = Object.assign({}, y);
        if (f.지움 === true) y.지움 = true; else if (f.지움 === false) delete y.지움;
        if (typeof f.숨김 === 'boolean') { if (f.숨김) y.숨김 = true; else delete y.숨김; }
        ['인트로자리', '슬롯', '칸', '평상칸'].forEach(function (k) { if (f[k] != null && f[k] !== '') y[k] = f[k]; });
        if (typeof f.사람승인 === 'boolean') { if (f.사람승인) y.사람승인 = true; else delete y.사람승인; } });
      return y; });
    return x;
  }
  async function 모든일감() { var ix = await 색인(); return ix.jobs; }
  async function 일감찾기(id) {
    var m = 기억.새일감.find(function (j) { return j.id === id; }); if (m) return 고침입히기(새일감틱(m));
    var ix = await 색인(); var 가 = ix.jobs.find(function (j) { return j.id === id; }); if (!가) return null;
    var L = await 작품일감(가.project); var j = L.find(function (x) { return x.id === id; }) || 가;
    return 고침입히기(j);
  }
  async function 작품일감들(p, 가볍게0) {
    var L = (await 작품일감(p)).slice();
    var 새 = 기억.새일감.filter(function (j) { return j.project === p && !j.hidden; }).map(새일감틱);
    L = 새.concat(L).filter(function (j) { return !(기억.고침[j.id] && 기억.고침[j.id].hidden); }).map(고침입히기);
    L.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    return 가볍게0 ? L.map(가볍게) : L;
  }
  /* 서버(functions/index.js)의 가볍게 와 같은 꼴 */
  function 가볍게(j) {
    var s = j.spec || {}; var sp = { baseFrom: s.baseFrom, only: s.only, workKeys: s.workKeys, brain: s.brain, mode: s.mode };
    if (s.인트로자리 != null) sp.인트로자리 = s.인트로자리; if (s.다시프로필) { sp.다시프로필 = s.다시프로필; sp.원일감 = s.원일감; }
    if (s.감정판) { sp.감정판 = true; sp.refs = (s.refs || []).slice(0, 2).map(function (r) { return { who: r.who }; }); if (Array.isArray(s.표정칸)) sp.표정칸 = s.표정칸.slice(0, 40); }
    if (s.줄거리자리 != null) sp.줄거리자리 = s.줄거리자리; if (s.상황판) { sp.상황판 = true; sp.굽기 = s.굽기 === true; sp.칸들 = (s.칸들 || []).slice(0, 200); if (s.표정계획 === true) sp.표정계획 = true; }
    if (s.슬롯) sp.슬롯 = s.슬롯; if (j.kind === 'introdoc' && s.블록 != null) sp.블록 = s.블록; if (s.엔딩자리 != null) { sp.엔딩자리 = s.엔딩자리; sp.엔딩이름 = s.엔딩이름; } if (s.사슬) sp.사슬 = { 다음: s.사슬.다음 || [], 화수: s.사슬.vn && s.사슬.vn.화수 };
    var o = { id: j.id, kind: j.kind, status: j.status, title: j.title, by: j.by, project: j.project, createdAt: j.createdAt, startedAt: j.startedAt, doneAt: j.doneAt, error: j.error, cancel: j.cancel || false,
      castPick: j.castPick, webtoonPick: j.webtoonPick, thumbPick: j.thumbPick, endPick: j.endPick, finished: j.finished === true, qaId: j.qaId, qaUrl: j.qaUrl, log: (j.log || []).slice(-1), lite: true, spec: sp };
    if (j.작품소개 && Array.isArray(j.작품소개.블록) && j.작품소개.블록.length) o.작품소개 = { 블록: j.작품소개.블록 };
    o.results = (j.results || []).map(function (r) {
      if (!r) return r;
      var x = { type: r.type, group: r.group, url: r.url, thumb: r.thumb, 인물: r.인물, 표정: r.표정, stage: r.stage, lang: r.lang, caption: String(r.caption || '').slice(0, 120) };
      if (r.슬롯) x.슬롯 = r.슬롯; if (r.숨김 === true) x.숨김 = true; if (r.지움 === true) x.지움 = true; if (r.group === 'introdoc' && Number.isInteger(r.블록)) x.블록 = r.블록;
      if (r.type === 'text' && j.kind === 'story') x.text = r.text;
      if (r.type === 'json' && r.data) { var d = r.data; x.data = { 제목: d.제목, 한줄: d.한줄 }; if (d.연출 === 'branch') { var 자 = d.자산 || {}; var CG = 자.CG || {}; var 첫 = ((d.노드 || {})[d.시작 || '1-0'] || {}).줄 || []; x.data.표지 = CG[(첫[0] || {}).CG] || Object.values(CG)[0] || ''; } }
      if (r.type === 'json' && r.group === 'introdoc' && r.data) x.data = { 블록: (Array.isArray(r.data.블록) ? r.data.블록 : []).map(function (b) { return b && b.t === 'text' ? { t: 'text', ko: String(b.ko || '').slice(0, 60) } : { t: 'image', url: b && b.url }; }) };
      if (r.type === 'json' && r.group === 'findplot' && r.data) x.data = r.data;
      if (r.type === 'error') x.text = String(r.text || '').slice(0, 200);
      return x; });
    return o;
  }
  async function 최근일감(n, 앞, 가볍게0) {
    var 가 = (await 모든일감()).filter(function (j) { return !(기억.고침[j.id] && 기억.고침[j.id].hidden); });
    var 새 = 기억.새일감.filter(function (j) { return !j.hidden; }).map(새일감틱);
    var L = 새.concat(가).map(고침입히기).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    if (앞) L = L.filter(function (j) { return (j.createdAt || 0) < Number(앞); });
    L = L.slice(0, n);
    /* 색인은 가벼운 판이다 — 가볍게를 원하면 그대로, 아니면 작품 파일에서 통째로 */
    if (가볍게0) return L.map(function (j) { return j.lite ? j : 가볍게(j); });
    return Promise.all(L.map(function (j) { return j.lite ? 일감찾기(j.id) : j; }));
  }

  /* ── 새 일감 흉내 — 같은 종류의 예전 결과를 빌려 «다 된 것처럼» ── */
  var 특징들 = ['인트로자리', '상황판', '엔딩자리', '막그림', '평상', '감정판', '표정계획', '다시프로필', 'reelMode', 'langs', '블록', '올린그림'];
  function 특징(spec) { spec = spec || {}; return 특징들.filter(function (k) { return spec[k] != null && spec[k] !== false; }); }
  async function 빌린결과(q) {
    var kind = q.kind; var 내 = 특징(q.spec); var L;
    try { L = q.project ? await 작품일감(q.project) : []; } catch (e) { L = []; }
    var 그림일 = ['scene', 'cast', 'thumb', 'expr', 'userprof', 'cover', 'castintro', 'intro', 'webtoon', 'reel', 'pose', 'logo', 'vndraw', 'post', 'localize'].indexOf(kind) >= 0;
    var 쓸만 = function (r) { return r && !r.지움 && !r.숨김 && !(r.url && /blank\.webp/.test(r.url)); };
    var 맞는 = function (j) { return j && j.kind === kind && j.status === 'done' && (j.results || []).some(function (r) { return 쓸만(r) && (r.type === 'image' || r.type === 'video' ? !!r.url : !그림일 && (r.data || r.text)); }); };
    var 점 = function (j) { var 그 = 특징(j.spec); return 내.filter(function (k) { return 그.indexOf(k) >= 0; }).length * 2 - 그.filter(function (k) { return 내.indexOf(k) < 0; }).length; };
    var 후보 = L.filter(맞는);
    if (!후보.length) { var ix = await 색인(); var 가 = ix.jobs.filter(function (j) { return j.kind === kind && j.status === 'done'; }).slice(0, 40); for (var i = 0; i < 가.length; i++) { var full = await 일감찾기(가[i].id); if (맞는(full)) 후보.push(full); } }
    if (!후보.length) return [];
    후보.sort(function (a, b) { return 점(b) - 점(a); });
    var 같은 = 후보[0]; var s = q.spec || {};
    var rs = 복사(같은.results || []).filter(쓸만);
    var 장수 = Number(s.count || 0); var 그림 = rs.filter(function (r) { return r.type === 'image'; });
    if (장수 && 그림.length > 장수) { var 남길 = new Set(그림.slice(0, 장수)); rs = rs.filter(function (r) { return r.type !== 'image' || 남길.has(r); }); }
    var 칸들 = Array.isArray(s.칸들) ? s.칸들 : []; var n = 0;
    return rs.map(function (r) { delete r.사람승인; delete r.고친이;
      if (r.type === 'image') { if (s.인트로자리 != null) r.인트로자리 = Number(s.인트로자리); if (s.슬롯) r.슬롯 = s.슬롯; else if (칸들.length && r.슬롯) { var c = 칸들[n++ % 칸들.length]; r.슬롯 = (c && (c.id || c.슬롯)) || r.슬롯; } }
      return r; });
  }
  async function 추천답(q) {
    var s = q.spec || {}; var 표 = await 싣기('suggest'); var w = s.what; var d;
    if (w === 'scenes') {
      var 인트로형 = s.인트로자리 != null || Array.isArray(s.문단들) && !s.장수;
      var 키 = 인트로형 ? 'scenes:인트로' : 'scenes:상황';
      d = 복사((s.baseFrom && 표.표[s.baseFrom + '|' + 키]) || 표.본보기[키] || { 상황: [], 인트로: [] });
      if (인트로형) { var 문단 = s.인트로자리 != null ? [Number(s.인트로자리)] : (s.문단들 || []).slice(0, 3).map(function (x) { return typeof x === 'object' ? Number(x.문단 != null ? x.문단 : x.i) : Number(x); }); var 원 = (d.인트로 || [])[0] || { 장면: '인물이 유저를 돌아보는 장면', 구도: '허리 위', 장소: '', 인물: [], 감정: '' }; d = { 상황: [], 인트로: 문단.map(function (m, i) { return Object.assign({}, (d.인트로 || [])[i] || 원, { 문단: m }); }) }; }
      else if (s.장수) { var 상 = d.상황 || []; var out = []; for (var i = 0; i < s.장수; i++) out.push(복사(상[i % Math.max(1, 상.length)] || { 이름: '장면 ' + (i + 1), 장면: '인물이 유저를 바라본다' })); d = { 상황: out, 인트로: [] }; }
    } else d = 복사((s.baseFrom && 표.표[s.baseFrom + '|' + w]) || 표.본보기[w] || {});
    var 후보 = (s.후보 || []).map(function (x) { return x && (x.id || x.key || x); }).filter(function (x) { return typeof x === 'string' || typeof x === 'number'; });
    var 인물 = (s.인물들 || []).map(function (x) { return typeof x === 'string' ? x : x && x.이름; }).filter(Boolean);
    var n = 0, m = 0;
    (function 고치기(v) {
      if (Array.isArray(v)) return v.forEach(고치기);
      if (!v || typeof v !== 'object') return;
      Object.keys(v).forEach(function (k) {
        if (k === '참고' && (typeof v[k] === 'string' || typeof v[k] === 'number') && 후보.length) v[k] = String(후보[n++ % 후보.length]);
        else if (k === '인물' && Array.isArray(v[k]) && 인물.length) v[k] = v[k].map(function () { return 인물[m++ % 인물.length]; }).slice(0, Math.max(1, Math.min(v[k].length, 인물.length)));
        else if (k === '인물' && typeof v[k] === 'string' && 인물.length) v[k] = 인물[m++ % 인물.length];
        else 고치기(v[k]);
      });
    })(d);
    /* 다른 작품의 본보기를 빌렸으면 글은 이 작품 인물로 지은 무난한 문장으로 */
    var 남의것 = !(s.baseFrom && (표.표[s.baseFrom + '|' + w] || 표.표[s.baseFrom + '|scenes:인트로'] || 표.표[s.baseFrom + '|scenes:상황']));
    if (남의것 && w === 'scenes') { var 틀 = ['이(가) 문가에 기대 서서 유저를 가만히 바라본다', '이(가) 한 걸음 다가와 낮은 목소리로 말을 건다', '이(가) 고개를 돌려 유저와 눈을 맞춘다', '이(가) 창가에 서서 생각에 잠겨 있다'];
      var 누 = function (i) { return 인물[i % Math.max(1, 인물.length)] || '인물'; };
      (d.인트로 || []).forEach(function (x, i) { x.장면 = 누(i) + 틀[i % 틀.length]; x.장소 = ''; x.인물 = [누(i)]; });
      (d.상황 || []).forEach(function (x, i) { x.이름 = '장면 ' + (i + 1); x.장면 = 누(i) + 틀[i % 틀.length]; x.인물 = [누(i)]; }); }
    return d;
  }
  async function 일감만들기(q) {
    var id = 새id(q.kind || 'job');
    var 바로 = ['suggest', 'translate', 'shotwhen', 'findplot', 'promptko'].indexOf(q.kind) >= 0;
    var 판 = 바로 ? { 시작: 300, 끝: 1500 } : { 시작: 200, 끝: 1000 };
    var j = { id: id, kind: q.kind, project: q.project || null, title: String(q.title || '').slice(0, 120), by: ME, uid: 'demo', status: 'queued', createdAt: Date.now(), spec: q.spec || {}, results: [], log: [], __m: 판 };
    try {
      if (q.kind === 'suggest') j.__결과 = [{ type: 'json', data: await 추천답(q) }];
      else if (q.kind === 'findplot') { var fp = await 싣기('findplot'); var 말 = String((q.spec || {}).찾는말 || ''); var d = 복사(fp[0] || { 찾음: false, 까닭: '목업에서는 미리 넣어 둔 결과만 보여 줘요' }); j.__결과 = [{ type: 'json', group: 'findplot', data: d }]; j.title = '작품 찾기 — ' + 말.slice(0, 80); }
      else if (q.kind === 'claude') j.__결과 = [{ type: 'text', group: 'claude-answer', text: '**목업 안내**\n실제 서비스에서는 Claude가 이 요청(«' + String((q.spec || {}).지시 || '').slice(0, 60) + '»)을 읽고 작품 글·대본을 고친 뒤, 바뀐 칸을 여기에 정리해 보여 줘요.\n이 화면은 포트폴리오용 목업이라 실제로 고치지는 않았어요.' }];
      else j.__결과 = await 빌린결과(q);
    } catch (e) { j.__결과 = []; }
    기억.새일감.unshift(j); 남기기();
    return { ok: true, id: id };
  }
  /* 새 작품(새로 만들기 → 만들기) 은 작품 설정 일감을 하나 더 내 «제작 중»에 보이게 */

  /* ── 창구 ── */
  var 창구 = {
    me: function () { return { email: ME, role: 'super_admin' }; },
    data: function () { return 싣기('meta'); },
    worker: async function () { var w = await 싣기('worker'); return Object.assign({}, w, { at: Date.now() }); },
    'worker.pairStart': function () { return { code: 'DEMO2345' }; },
    'worker.mine': function () { return { workers: [{ wid: 'demo-mac', host: 'mac-데모', lastSeen: Date.now(), online: true, 로컬: false }] }; },
    'worker.remove': function () { return { ok: true }; },
    'jobs.list': async function (b) {
      var n = Math.min(200, Math.max(1, Number(b.limit || 40)));
      if (b.project) { var L = await 작품일감들(String(b.project), !!b.lite); if (b.status) L = L.filter(function (j) { return j.status === b.status; }); return { jobs: L }; }
      if (b.kind) { var ix = await 모든일감(); var ids = ix.filter(function (j) { return j.kind === b.kind && (!b.status || j.status === b.status); }).slice(0, n).map(function (j) { return j.id; }); var 새 = 기억.새일감.filter(function (j) { return j.kind === b.kind; }).map(새일감틱); var full = await Promise.all(ids.map(일감찾기)); return { jobs: 새.concat(full.filter(Boolean)).map(function (j) { return b.lite ? 가볍게(j) : j; }) }; }
      if (b.mine) { var M = await 최근일감(1000, 0, true); return { jobs: M.filter(function (j) { return j.by === ME; }).slice(0, n) }; }
      return { jobs: await 최근일감(n, b.before, !!b.lite) };
    },
    'jobs.get': async function (b) { var j = await 일감찾기(String(b.id || '')); return j ? { job: j } : { error: 'not_found' }; },
    'jobs.making': async function (b) {
      var 다 = b && b.all === true; var ix = await 색인();
      var L = 기억.새일감.filter(function (j) { return j.kind === 'story'; }).map(새일감틱).concat(ix.jobs.filter(function (j) { return j.kind === 'story'; })).map(고침입히기);
      return { items: L.filter(function (x) { return !x.hidden && x.project && (다 || x.finished !== true); }).map(function (x) { var o = { id: x.id, project: x.project, by: x.by || '', title: String(x.title || '').slice(0, 120), status: x.status, cancel: x.cancel === true, createdAt: x.createdAt || 0 }; if (x.thumbPick) o.thumbPick = String(x.thumbPick); if (다) o.finished = x.finished === true; return o; }) };
    },
    'jobs.create': function (b) { return 일감만들기(b); },
    'jobs.update': async function (b) {
      var id = String(b.id || ''); var o = 기억.고침[id] || (기억.고침[id] = {}); var 원 = await 일감찾기(id);
      Object.keys(b).forEach(function (k) {
        if (k === 'id' || k === 'action' || k === 'idToken') return;
        var v = 업주소풀기(b[k]);
        if (k === 'resultFlags') { o.__flags = (o.__flags || []).concat(v || []); return; }
        if (k === 'storyText') { o.__story = v; return; }
        if (k === 'userProfiles') { o.__userProfiles = v; return; }
        if (k === 'finished') { o.finished = v; o.finishedAt = v ? Date.now() : null; return; }
        if (/^vn(Nodes|Restore|Edits|UserStates|Outfits|CgRestore)$/.test(k)) { try { var p = JSON.parse(v); var 판 = o.__vn || (o.__vn = {}); if (k === 'vnNodes') 판.노드 = p; else if (k === 'vnRestore') Object.assign(판, p); else if (k === 'vnEdits') 판.자산 = Object.assign({}, 판.자산 || {}, { 편집: p }); else if (k === 'vnUserStates' && p.표) 판.유저상태표 = p.표; else if (k === 'vnOutfits' && p.표) 판.의상표 = p.표; } catch (e) {} return; }
        if (k === 'vnLayout') { try { o.노드자리 = JSON.parse(v); } catch (e) {} return; }
        if (k === 'vnFace' && v) { var 판2 = o.__vn || (o.__vn = {}); 판2.자산 = Object.assign({}, 판2.자산 || {}); 판2.자산.얼굴 = Object.assign({}, 판2.자산.얼굴 || {}); 판2.자산.얼굴[v.이름] = v.url; return; }
        if (k === 'localImage' && v) { var 표 = 복사(o.현지그림 || (원 && 원.현지그림) || {}); 표[v.나라] = 표[v.나라] || {}; if (v.url) 표[v.나라][v.자리] = { url: v.url, type: v.type === 'video' ? 'video' : 'image', 원본: v.원본 || '', by: ME, at: Date.now() }; else delete 표[v.나라][v.자리]; o.현지그림 = 표; return; }
        if (k === 'localPerson' && v) { var 표2 = 복사(o.현지인물 || (원 && 원.현지인물) || {}); 표2[v.나라] = 표2[v.나라] || {}; if (v.url) 표2[v.나라][v.이름] = { url: v.url, 외형: v.외형 || '', by: ME, at: Date.now() }; else delete 표2[v.나라][v.이름]; o.현지인물 = 표2; return; }
        if (k === 'shotWhen' && v) { var 표3 = 복사(o.상황때 || (원 && 원.상황때) || {}); if (String(v.언제 || '').trim()) 표3[v.자리] = { 언제: v.언제, 그림: v.그림 || '', 인물들: v.인물들 || [], 변환: '됨', by: ME, at: Date.now() }; else delete 표3[v.자리]; o.상황때 = 표3; return; }
        if (k === '평상고름' && v && 원) { o.평상고름 = Object.assign({}, o.평상고름 || {}, v); 평상고름적용(원, o); return; }
        if (k === 'liveText') { o.고친글 = (function () { try { return JSON.parse(v); } catch (e) { return {}; } })(); return; }
        if (k === 'enCurate' && v) { o.영어판 = Object.assign({}, o.영어판 || (원 && 원.영어판) || {}, v); return; }
        o[k] = v;
      });
      남기기(); return { ok: true };
    },
    'jobs.cancel': async function (b) { var id = String(b.id || ''); var m = 기억.새일감.find(function (j) { return j.id === id; }); if (m) { m.status = 'canceled'; m.cancel = true; m.doneAt = Date.now(); 남기기(); return { ok: true, 됨: 'canceled' }; } var j = await 일감찾기(id); if (j && (j.status === 'queued' || j.status === 'running')) { (기억.고침[id] = 기억.고침[id] || {}).status = 'canceled'; 남기기(); return { ok: true, 됨: 'canceled' }; } return { error: 'not_running' }; },
    'jobs.delete': function (b) { var id = String(b.id || ''); var m = 기억.새일감.find(function (j) { return j.id === id; }); if (m) m.hidden = true; else (기억.고침[id] = 기억.고침[id] || {}).hidden = true; 남기기(); return { ok: true }; },
    rate: async function (b) { var 키 = b.jobId + '_' + b.idx; 기억.평가 = 기억.평가.filter(function (r) { return r.id !== 키 + '_demo'; }); if (b.v === 'good' || b.v === 'bad') { var j = await 일감찾기(b.jobId); var r0 = j && (j.results || [])[b.idx] || {}; 기억.평가.unshift({ id: 키 + '_demo', jobId: b.jobId, idx: Number(b.idx), v: b.v, note: String(b.note || '').slice(0, 1000), by: ME, uid: 'demo', kind: j && j.kind, promptKey: r0.promptKey || null, promptVer: r0.promptVer == null ? null : r0.promptVer, at: Date.now() }); } 남기기(); return { ok: true }; },
    'ratings.list': async function (b) { var L = await 싣기('ratings'); var 내 = new Set(기억.평가.map(function (r) { return r.id; })); var 다 = 기억.평가.concat(L.filter(function (r) { return !내.has(r.id) && !기억.평가.some(function (x) { return x.jobId === r.jobId && x.idx === r.idx && r.by === ME; }); })); if (b.jobId) 다 = 다.filter(function (r) { return r.jobId === b.jobId; }); return { ratings: 다.sort(function (a, c) { return (c.at || 0) - (a.at || 0); }).slice(0, Math.min(500, Number(b.limit || 200))) }; },
    'prompts.list': async function () { var L = 복사(await 싣기('prompts')); L.forEach(function (p) { var x = 기억.프롬프트[p.key]; if (x) { p.versions = (p.versions || []).concat(x.versions || []); if (x.active) p.active = x.active; } }); return { prompts: L }; },
    'prompts.save': async function (b) { var L = await 싣기('prompts'); var p = L.find(function (x) { return x.key === b.key; }) || { versions: [] }; var x = 기억.프롬프트[b.key] || (기억.프롬프트[b.key] = { versions: [] }); var n = (p.versions || []).concat(x.versions).reduce(function (m, v) { return Math.max(m, v.n || 0); }, 0) + 1; x.versions.push({ n: n, text: String(b.text || ''), by: ME, at: Date.now(), why: String(b.why || '손으로 고침') }); x.active = n; 남기기(); return { ok: true, n: n }; },
    'prompts.activate': function (b) { var x = 기억.프롬프트[b.key] || (기억.프롬프트[b.key] = { versions: [] }); x.active = Number(b.n); 남기기(); return { ok: true }; },
    'slots.list': function () { return { slots: 기억.슬롯 }; },
    'slots.save': function (b) { var id = b.id || 새id('slot'); 기억.슬롯 = 기억.슬롯.filter(function (s) { return s.id !== id; }); 기억.슬롯.unshift({ id: id, name: b.name, refs: b.refs || [], character: b.character || '', work: b.work || '', by: ME, at: Date.now() }); 남기기(); return { id: id }; },
    'slots.delete': function (b) { 기억.슬롯 = 기억.슬롯.filter(function (s) { return s.id !== b.id; }); 남기기(); return { ok: true }; },
    'graph.get': async function (b) { if (기억.그래프[b.project]) return { g: 기억.그래프[b.project] }; var L = await 싣기('graphs'); var g = L.find(function (x) { return x.id === b.project; }); return { g: g ? g.g : null }; },
    'graph.put': function (b) { 기억.그래프[b.project] = String(b.g || ''); 남기기(); return { ok: true }; },
    'drafts.list': async function () { var L = await 싣기('drafts'); var 다 = L.map(function (d) { return { id: d.id, at: d.at, w: d.w }; }).filter(function (d) { return !기억.초안지움[d.id] && !기억.초안[d.id]; }); Object.keys(기억.초안).forEach(function (k) { if (!기억.초안지움[k]) 다.push(기억.초안[k]); }); return { drafts: 다.sort(function (a, c) { return (c.at || 0) - (a.at || 0); }) }; },
    'drafts.put': function (b) { if (기억.초안지움[b.id]) return { ok: false, deleted: true }; 기억.초안[b.id] = { id: b.id, at: Date.now(), w: String(b.w || '') }; 남기기(); return { ok: true }; },
    'drafts.delete': function (b) { 기억.초안지움[b.id] = true; delete 기억.초안[b.id]; 남기기(); return { ok: true }; },
    'vn.versions': function () { return { versions: [] }; },
    'vn.version': function () { return { error: 'not_found' }; },
    'uploads.put': function (b) { var url = String(b.data || ''); var it = { id: 새id('up'), url: url, by: ME, at: Date.now(), 역할: b.역할 || '' }; if (b.모음밖 !== true) { 기억.올림.unshift(it); 남기기(); } return { url: url }; },
    'uploads.start': function (b) { var n = 새id('put'); return { putUrl: MOCK + '__put/' + n, url: MOCK + '__up/' + n }; },
    'uploads.list': async function () { var L = await 싣기('uploads'); return { items: 기억.올림.concat(L).filter(function (x) { return !기억.숨긴올림[x.id]; }) }; },
    'uploads.hide': function (b) { 기억.숨긴올림[b.id] = true; 남기기(); return { ok: true }; },
    'ask.create': function (b) { var it = { id: 새id('ask'), 종류: b.종류 === '버그' ? '버그' : '기능', 글: String(b.글 || '').slice(0, 4000), 그림: (b.그림 || []).slice(0, 10), by: ME, at: Date.now(), 상태: '접수' }; 기억.요청.unshift(it); 남기기(); return { ok: true, id: it.id }; },
    'ask.list': async function (b) { var 종류 = b.종류 === '버그' ? '버그' : '기능'; var L = 기억.요청.concat(await 싣기('asks')).filter(function (x) { return x.종류 === 종류; }).map(function (x) { var d = 기억.요청결정[x.id]; return d ? Object.assign({}, x, d) : x; }); if (b.상태) L = L.filter(function (x) { return x.상태 === b.상태; }); return { items: L.sort(function (a, c) { return c.at - a.at; }) }; },
    'ask.decide': function (b) { var 새 = b.결정 === '수정' ? '진행중' : '반려'; 기억.요청결정[b.id] = { 상태: 새, 결정: b.결정, 결정한이: ME }; 남기기(); return { ok: true, 상태: 새 }; },
    'ask.update': function (b) { var d = 기억.요청결정[b.id] || (기억.요청결정[b.id] = {}); if (b.상태) d.상태 = b.상태; if (typeof b.답 === 'string') { d.답 = b.답; d.답때 = Date.now(); } 남기기(); return { ok: true }; },
    'plots.extra': function () { return { items: 기억.줄거리 }; },
    'plots.add': async function (b) { var j = await 일감찾기(b.일감); var r = j && (j.results || []).find(function (x) { return x && x.group === 'findplot'; }); var d = r && r.data; if (!d || !d.작품) return { error: 'no_plot' }; var 줄 = Object.assign({}, d.작품, { 열쇠: d.작품.매체 + '|' + d.작품.제목, by: ME, at: Date.now(), 사건수: (d.작품.사건 || []).length }); if (!기억.줄거리.some(function (x) { return x.열쇠 === 줄.열쇠; })) 기억.줄거리.unshift(줄); 남기기(); return { ok: true, 열쇠: 줄.열쇠 }; },
    'live.list': function () { return 싣기('live'); },
    'live.get': async function (b) { var L = await 싣기('live-get'); var it = L[b.id]; return it ? { item: it } : { error: 'not_found' }; },
    'live.enlist': function () { return 싣기('live-enlist'); },
    'live.byCountry': function () { return 싣기('live-country'); },
    'live.import': async function (b) { var ix = await 색인(); var p = 'live-' + b.id; var 있 = ix.jobs.some(function (j) { return j.project === p; }); return 있 ? { project: p, 수: 17, 새로: 0 } : { error: '목업에는 이 작품의 그림을 싣지 않았어요' }; },
    'ours.list': function () { return 싣기('ours'); },
  };
  /* 평상 사진 고르기 — 서버가 저장 때 하는 일(작품 설정 일감의 평상 사진 줄을 고른 그림으로) */
  function 평상고름적용(st, o) { /* 화면이 «저장» 전에 같은 일을 이미 입혀 보인다(평상고름입히기) — 목업은 고른 값만 기억한다 */ }
  /* 영상 올리기(PUT) 로 받은 파일 → 이 탭 안의 주소 */
  var 올린파일 = {};
  function 업주소풀기(v) {
    if (typeof v === 'string') { var m = v.match(/__up\/([^/?#]+)$/); return m && 올린파일[m[1]] ? 올린파일[m[1]] : v; }
    if (Array.isArray(v)) return v.map(업주소풀기);
    if (v && typeof v === 'object') { var o = {}; for (var k in v) o[k] = 업주소풀기(v[k]); return o; }
    return v;
  }
  async function 창구받기(몸) {
    var q = {}; try { q = typeof 몸 === 'string' ? JSON.parse(몸) : 몸 || {}; } catch (e) { q = {}; }
    var a = String(q.action || ''); var f = 창구[a];
    await 쉬(a === 'jobs.list' || a === 'jobs.get' ? 60 : 120);
    var 답;
    try { 답 = f ? await f(q) : { ok: true }; } catch (e) { 답 = { error: String((e && e.message) || e) }; }
    return 답;
  }
  function 답꼴(obj, 상태) { return new Response(JSON.stringify(obj == null ? {} : obj), { status: 상태 || 200, headers: { 'Content-Type': 'application/json' } }); }

  /* ── fetch 가로채기 ── */
  var 허용밖 = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
  window.fetch = async function (입력, 설정) {
    var 주소 = typeof 입력 === 'string' ? 입력 : 입력 && 입력.url ? 입력.url : String(입력);
    var u; try { u = new URL(주소, location.href); } catch (e) { return 진짜fetch(입력, 설정); }
    if (u.protocol === 'blob:' || u.protocol === 'data:') return 진짜fetch(입력, 설정);
    var 같은곳 = u.origin === location.origin;
    if (같은곳 && /\/api\/?$/.test(u.pathname)) { var 몸 = 설정 && 설정.body; if (!몸 && 입력 && typeof 입력.text === 'function') 몸 = await 입력.text(); return 답꼴(await 창구받기(몸)); }
    if (같은곳 && u.href.indexOf(MOCK + '__put/') === 0) { var n = u.href.slice((MOCK + '__put/').length); var b = 설정 && 설정.body; try { 올린파일[n] = URL.createObjectURL(b instanceof Blob ? b : new Blob([b])); } catch (e) {} return new Response('', { status: 200 }); }
    if (!같은곳 && !허용밖.test(u.href)) { console.info('[목업] 외부 요청을 막았어요:', u.origin); return Promise.reject(new TypeError('목업: 외부 요청은 막혀 있어요')); }
    return 진짜fetch(입력, 설정);
  };
  /* 바깥으로 나가는 링크·창 — 스토어 링크만 열고, 내부 서비스(QA 앱 등)는 알림으로 */
  var 열어도 = /^https:\/\/(apps\.apple\.com|play\.google\.com)\//;
  function 알림(m) { try { if (typeof window.toast === 'function') window.toast(m); } catch (e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('#mock-qa') === 0) { e.preventDefault(); 알림('목업에서는 QA 앱을 열 수 없어요'); return; }
    var u; try { u = new URL(h, location.href); } catch (er) { return; }
    if (u.origin !== location.origin && !열어도.test(u.href)) { e.preventDefault(); 알림('목업에서는 바깥 서비스로 나가지 않아요'); }
  }, true);
  var 진짜open = window.open;
  window.open = function (주소) { try { var u = new URL(String(주소 || ''), location.href); if (u.origin === location.origin || 열어도.test(u.href)) return 진짜open.apply(window, arguments); } catch (e) {} 알림('목업에서는 바깥 서비스로 나가지 않아요'); return null; };
  window.__behindMock = { 창구: 창구, 기억: function () { return 기억; }, 비우기: function () { try { sessionStorage.removeItem(열쇠); } catch (e) {} location.reload(); } };

  /* ── «목업» 표시 ── */
  function 딱지() {
    if (document.getElementById('mock-badge')) return;
    var d = document.createElement('div'); d.id = 'mock-badge'; d.textContent = '목업 · 실제 서버와 연결되지 않음';
    d.setAttribute('style', 'position:fixed;left:50%;transform:translateX(-50%);bottom:4px;z-index:2147483000;font:500 11px/1.4 "Pretendard Variable",Pretendard,system-ui,sans-serif;color:rgba(244,244,245,.72);background:rgba(12,12,15,.55);border:1px solid rgba(255,255,255,.08);padding:2px 8px;border-radius:999px;pointer-events:none;letter-spacing:0;white-space:nowrap');
    document.body.appendChild(d);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 딱지); else 딱지();
})();
