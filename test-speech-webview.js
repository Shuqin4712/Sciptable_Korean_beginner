// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: globe;

// =============================================================================
// test-speech-webview.js — 备用发音方案验证（WebView + Web Speech API）
// =============================================================================
// 原生 Speech.speak 在 iOS 26 上发不出声，这里验证备用路径：
// 用 Scriptable 的 WebView 加载一段网页，靠网页里的 speechSynthesis 发声。
// WebView 走 WebKit 自己的音频通道，且 speechSynthesis 自带 rate（真·变速慢读）。
//
// 说明：CLAUDE.md 约定「脚本里禁止 DOM/浏览器 API」——那是指 Scriptable 脚本上下文。
//      这里的 HTML/JS 运行在 WebView 内部（WebKit），是 Scriptable 官方支持的用法，
//      属于该约束的合理例外，仅作为原生 TTS 不可用时的降级通道。
//
// 用法：新建脚本 test-speech-webview，粘贴运行。会打开一个网页，
//      点「🔊 正常」和「🐢 慢速」按钮（点击本身就是所需的用户手势）。
//      页面上会显示 speechSynthesis 是否可用、韩语语音数量、以及每次朗读的事件日志。
// =============================================================================

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; padding: 24px;
         background: #1c1230; color: #f3f1ff; font-size: 18px; }
  h2 { margin: 0 0 16px; }
  .status { background: #2a2350; border-radius: 12px; padding: 14px; margin-bottom: 20px;
            font-size: 15px; line-height: 1.6; }
  button { display: block; width: 100%; font-size: 22px; padding: 18px; margin: 12px 0;
           border: none; border-radius: 14px; background: #7b6fd6; color: #fff; }
  button:active { background: #5b4ba0; }
  .word { text-align: center; font-size: 40px; font-weight: 700; margin: 8px 0 20px; }
  #log { margin-top: 20px; font-size: 13px; color: #c9c2e8; }
  #log div { padding: 2px 0; border-bottom: 1px solid #33285e; }
</style>
</head>
<body>
  <h2>WebView 发音测试</h2>
  <div class="status" id="status">检测中…</div>
  <div class="word">학교 · 감사합니다</div>
  <button onclick="say(1)">🔊 正常语速</button>
  <button onclick="say(0.4)">🐢 慢速 (rate 0.4)</button>
  <div id="log"></div>

<script>
  function q(id){ return document.getElementById(id); }
  function log(m){ var d = q('log'); d.innerHTML += '<div>' + m + '</div>'; }

  function koVoice(){
    var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    for (var i=0;i<vs.length;i++){
      if ((vs[i].lang||'').toLowerCase().indexOf('ko') === 0) return vs[i];
    }
    return null;
  }

  function refreshStatus(){
    var has = ('speechSynthesis' in window);
    var vs = has ? speechSynthesis.getVoices() : [];
    var ko = koVoice();
    q('status').innerHTML =
      'speechSynthesis 可用：<b>' + has + '</b><br>' +
      '语音总数：<b>' + vs.length + '</b><br>' +
      '韩语语音：<b>' + (ko ? ('有 · ' + ko.name) : '无') + '</b>';
  }

  function say(rate){
    if (!('speechSynthesis' in window)) { log('❌ 此 WebView 无 speechSynthesis'); return; }
    var u = new SpeechSynthesisUtterance('안녕하세요. 학교. 감사합니다.');
    u.lang = 'ko-KR';
    u.rate = rate;
    var ko = koVoice();
    if (ko) u.voice = ko;
    u.onstart = function(){ log('▶️ onstart (rate ' + rate + ')'); };
    u.onend   = function(){ log('✅ onend'); };
    u.onerror = function(e){ log('❌ onerror: ' + (e.error || 'unknown')); };
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    log('已调用 speak，rate=' + rate);
  }

  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = refreshStatus; // iOS 上语音可能异步加载
  }
  refreshStatus();
</script>
</body>
</html>`;

const wv = new WebView();
await wv.loadHTML(html);
await wv.present(true);
Script.complete();
