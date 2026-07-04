// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: headphones;

// =============================================================================
// test-speech-voices.js — 韩语语音试听器（挑选最像真人的语音）
// =============================================================================
// 备用发音走 WebView + speechSynthesis。此脚本列出设备上所有韩语语音，
// 每个配「试听」按钮，帮你挑一个最自然的，之后设为默认。
//
// 先在 设置 → 辅助功能 → 朗读内容 → 声音 → 한국어 里下载增强/高级(Enhanced/Premium)语音，
// 再运行本脚本，它们才会出现在列表里。
//
// 观察点：
//   · 列表里有几个韩语语音？增强版有没有出现（名字后可能带 Enhanced/Premium 或音质更好）？
//   · 点不同语音的「试听」，声音有没有变化？（若全都一样，说明本 WebView 不支持切换）
//   · 底部「显示全部语言」可查看全部语音，确认 getVoices 到底暴露了多少。
// =============================================================================

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px;
         background: #1c1230; color: #f3f1ff; font-size: 17px; }
  h2 { margin: 0 0 6px; }
  .hint { color: #c9c2e8; font-size: 13px; margin-bottom: 16px; }
  .row { display: flex; align-items: center; justify-content: space-between;
         background: #2a2350; border-radius: 12px; padding: 12px 14px; margin: 8px 0; }
  .name { font-size: 15px; line-height: 1.4; }
  .tag { font-size: 11px; color: #a99fe0; }
  .play { border: none; border-radius: 10px; background: #7b6fd6; color: #fff;
          font-size: 18px; padding: 10px 16px; margin-left: 10px; white-space: nowrap; }
  .play:active { background: #5b4ba0; }
  .bar { display:flex; gap:10px; margin: 14px 0; }
  .bar button { flex:1; border:none; border-radius:10px; background:#463c7a; color:#fff;
                font-size:14px; padding:12px; }
  #log { margin-top: 16px; font-size: 12px; color: #c9c2e8; }
  #log div { padding: 2px 0; border-bottom: 1px solid #33285e; }
</style>
</head>
<body>
  <h2>韩语语音试听器</h2>
  <div class="hint">点各行「试听」，挑一个最自然的告诉开发者。<br>
       没看到增强版？先去 设置→辅助功能→朗读内容→声音→한국어 下载。</div>
  <div id="list">加载语音中…</div>
  <div class="bar">
    <button onclick="render(false)">🔄 刷新</button>
    <button onclick="render(true)" id="allbtn">🌐 显示全部语言</button>
  </div>
  <div id="log"></div>

<script>
  var SAMPLE = '안녕하세요. 오늘의 단어를 함께 공부해요.';
  var VOICES = [];

  function q(id){ return document.getElementById(id); }
  function log(m){ var d = q('log'); d.innerHTML += '<div>' + m + '</div>'; }
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  function say(i){
    var v = VOICES[i];
    var u = new SpeechSynthesisUtterance(SAMPLE);
    u.lang = v ? v.lang : 'ko-KR';
    if (v) u.voice = v;
    u.rate = 1;
    u.onstart = function(){ log('▶️ ' + (v ? v.name : '默认')); };
    u.onerror = function(e){ log('❌ onerror: ' + (e.error || '')); };
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function render(all){
    VOICES = ('speechSynthesis' in window) ? speechSynthesis.getVoices() : [];
    var items = [];
    for (var i = 0; i < VOICES.length; i++){
      var v = VOICES[i];
      var isKo = (v.lang || '').toLowerCase().indexOf('ko') === 0;
      if (!all && !isKo) continue;
      var tag = v.lang + (v.localService ? ' · 本地' : ' · 在线') + (v.default ? ' · 默认' : '');
      items.push(
        '<div class="row"><div class="name">' + esc(v.name) +
        '<div class="tag">' + esc(tag) + '</div></div>' +
        '<button class="play" onclick="say(' + i + ')">试听</button></div>'
      );
    }
    var koCount = 0;
    for (var j = 0; j < VOICES.length; j++){
      if ((VOICES[j].lang || '').toLowerCase().indexOf('ko') === 0) koCount++;
    }
    var head = '总语音数：' + VOICES.length + '　韩语：' + koCount + '<br>';
    q('list').innerHTML = head + (items.length ? items.join('') : '（未找到' + (all ? '' : '韩语') + '语音）');
  }

  if ('speechSynthesis' in window){
    speechSynthesis.onvoiceschanged = function(){ render(false); };
  }
  render(false);
</script>
</body>
</html>`;

const wv = new WebView();
await wv.loadHTML(html);
await wv.present(true);
Script.complete();
