// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: language;

// =============================================================================
// Hanuri.js — HanuriWidget 主入口（组件渲染 + App 内交互双模式）
// =============================================================================
// 纯 Scriptable 环境：无 npm、无 Node。数据层来自 hanuri-lib（importModule）。
//
// 入口分发：
//   config.runsInWidget 为真 → 渲染桌面组件并 Script.setWidget（原生 ListWidget）。
//   否则（App 内点击运行）→ 打开 WebView 交互界面听读。
//
// 发音说明：iOS 26 上 Scriptable 原生 Speech.speak 实测无声，改用 WebView 内的
//   Web Speech API（speechSynthesis）发声，自带 rate，🐢 为真·变速慢读。桌面组件
//   仍为原生渲染。CLAUDE.md「脚本禁 DOM」指 Scriptable 脚本上下文；WebView 内部的
//   HTML/JS 运行在 WebKit 里，是官方支持用法，属原生 TTS 不可用时的合理降级。
// =============================================================================

const H = importModule("hanuri-lib");
const { CONFIG, formatDate, nextMidnight, Scheduler, Store } = H;

// -----------------------------------------------------------------------------
// 主题（Color.dynamic 深浅色适配）
// -----------------------------------------------------------------------------
// 背景恒为「深色渐变」，浅色外观下稍亮、深色外观下更深；文字在两种外观下都用浅色。
const THEME = {
  gradientTop: Color.dynamic(new Color("#5B4BA0"), new Color("#241E44")),
  gradientBottom: Color.dynamic(new Color("#8A73D6"), new Color("#463C7A")),
  hangul: Color.white(),
  romanization: Color.dynamic(new Color("#EDE9FF"), new Color("#C9C2E8")),
  meaning: Color.dynamic(new Color("#F3F1FF"), new Color("#E4E0F5")),
  footer: Color.dynamic(new Color("#DAD3F5"), new Color("#9C93C4")),
  spark: new Color("#FFD34E"), // ⚡ 音变标记的暖色调（这里仅用于文字，emoji 自带色）
};

function bgGradient() {
  const g = new LinearGradient();
  g.colors = [THEME.gradientTop, THEME.gradientBottom];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 1);
  return g;
}

// 音变词在韩文后加 ⚡ 标记
function hangulWithMark(word) {
  return word.hangul + (word.soundChange ? " ⚡" : "");
}

// -----------------------------------------------------------------------------
// WidgetView —— 组件渲染（原生 ListWidget）
// -----------------------------------------------------------------------------
const WidgetView = {
  build(words, family) {
    const fam = family || "medium";
    if (fam === "small") return this._buildSmall(words);
    return this._buildMedium(words); // medium / large 都用 medium 布局
  },

  // medium：三词竖排，每行「韩文  罗马音 …… 释义」，顶部小标题，底部日期 + 点击提示
  _buildMedium(words) {
    const w = new ListWidget();
    w.backgroundGradient = bgGradient();
    w.setPadding(14, 16, 12, 16);

    // 顶部小标题
    const title = w.addText("오늘의 단어 · 韩语每日词");
    title.font = Font.mediumSystemFont(11);
    title.textColor = THEME.footer;
    w.addSpacer(8);

    // 三个词
    const list = words.slice(0, 3);
    list.forEach((word, i) => {
      const row = w.addStack();
      row.centerAlignContent();

      const hg = row.addText(hangulWithMark(word));
      hg.font = Font.boldSystemFont(17);
      hg.textColor = THEME.hangul;

      row.addSpacer(8);

      const rom = row.addText(word.romanization);
      rom.font = Font.systemFont(11);
      rom.textColor = THEME.romanization;

      row.addSpacer(); // 弹性，把释义顶到右侧

      const mean = row.addText(word.meaning);
      mean.font = Font.systemFont(13);
      mean.textColor = THEME.meaning;
      mean.lineLimit = 1;

      if (i < list.length - 1) w.addSpacer(7);
    });

    w.addSpacer(); // 弹性把底部行压到最下

    // 底部：日期 + 点击提示
    const footer = w.addStack();
    footer.centerAlignContent();
    const date = footer.addText(formatDate(new Date()));
    date.font = Font.systemFont(10);
    date.textColor = THEME.footer;
    footer.addSpacer();
    const hint = footer.addText("탭하여 듣기 · 点击收听");
    hint.font = Font.systemFont(10);
    hint.textColor = THEME.footer;

    return w;
  },

  // small：单个主打词居中大字
  _buildSmall(words) {
    const w = new ListWidget();
    w.backgroundGradient = bgGradient();
    w.setPadding(12, 12, 12, 12);
    const word = words[0];

    w.addSpacer();

    const hg = w.addText(hangulWithMark(word));
    hg.font = Font.boldSystemFont(30);
    hg.textColor = THEME.hangul;
    hg.centerAlignText();
    hg.minimumScaleFactor = 0.6;
    hg.lineLimit = 1;

    w.addSpacer(4);

    const rom = w.addText(word.romanization);
    rom.font = Font.systemFont(12);
    rom.textColor = THEME.romanization;
    rom.centerAlignText();

    // 有音变时展示实际读音
    if (word.pronounced) {
      const pr = w.addText(word.pronounced);
      pr.font = Font.systemFont(12);
      pr.textColor = THEME.romanization;
      pr.centerAlignText();
    }

    w.addSpacer(4);

    const mean = w.addText(word.meaning);
    mean.font = Font.mediumSystemFont(15);
    mean.textColor = THEME.meaning;
    mean.centerAlignText();
    mean.lineLimit = 2;
    mean.minimumScaleFactor = 0.7;

    w.addSpacer();

    const date = w.addText(formatDate(new Date()));
    date.font = Font.systemFont(9);
    date.textColor = THEME.footer;
    date.centerAlignText();

    return w;
  },

  // 词库缺失等异常时的兜底组件，避免主屏出现空白/报错
  buildError(message) {
    const w = new ListWidget();
    w.backgroundGradient = bgGradient();
    w.setPadding(16, 16, 16, 16);
    const t = w.addText("⚠️ 无法加载");
    t.font = Font.boldSystemFont(15);
    t.textColor = THEME.hangul;
    w.addSpacer(6);
    const m = w.addText(message);
    m.font = Font.systemFont(11);
    m.textColor = THEME.romanization;
    m.lineLimit = 4;
    return w;
  },
};

// -----------------------------------------------------------------------------
// InteractView —— WebView 交互界面（HTML 页内用 speechSynthesis 发声）
// -----------------------------------------------------------------------------
// 每个词卡片含 🔊 正常 / 🐢 慢速(rate 0.5) 按钮；例句可点读；音变词点 ⚡ 弹解释。
// 底部「全部朗读 / 停止 / 回顾昨天」。数据由原生侧注入页面，交互与发声都在页内完成，
// 不回调原生。
const InteractView = {
  async present(words, vocab, state) {
    const yesterday = Scheduler.getYesterdayWords(vocab, state); // {date, words} | null
    const html = this._buildHTML(words, yesterday);
    const wv = new WebView();
    await wv.loadHTML(html);
    await wv.present(true);
  },

  _buildHTML(today, yesterday) {
    const data = {
      date: formatDate(new Date()),
      today: today,
      yesterday: yesterday, // 可能为 null
      info: CONFIG.soundChangeInfo,
    };
    // 注入 JSON 时转义 < 与行分隔符，避免破坏 <script> 或 JS 解析
    const dataJson = JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

    return (
      '<!DOCTYPE html>\n' +
      '<html><head><meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">\n' +
      "<style>\n" +
      "  :root { color-scheme: dark; }\n" +
      "  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }\n" +
      "  body { font-family: -apple-system, sans-serif; margin: 0; padding: 16px 16px 120px;\n" +
      "         background: linear-gradient(160deg,#2a2350,#1c1230); color: #f3f1ff; }\n" +
      "  h1 { font-size: 17px; margin: 4px 2px 2px; }\n" +
      "  .sub { color: #b3a9df; font-size: 12px; margin: 0 2px 14px; }\n" +
      "  .card { background: rgba(255,255,255,0.06); border-radius: 16px; padding: 14px 16px; margin: 10px 0; }\n" +
      "  .top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n" +
      "  .hg { font-size: 30px; font-weight: 700; line-height: 1.2; }\n" +
      "  .spark { display: inline-block; font-size: 16px; padding: 2px 8px; margin-left: 4px;\n" +
      "           background: rgba(255,211,78,0.18); border-radius: 999px; vertical-align: middle; }\n" +
      "  .btns { display: flex; gap: 8px; flex: none; }\n" +
      "  .pb { border: none; border-radius: 12px; background: #7b6fd6; color: #fff;\n" +
      "        font-size: 20px; padding: 10px 14px; }\n" +
      "  .pb:active { background: #5b4ba0; }\n" +
      "  .rom { color: #cfc7f0; font-size: 14px; margin-top: 8px; }\n" +
      "  .pron { color: #ffd34e; margin-left: 6px; }\n" +
      "  .mean { font-size: 17px; margin-top: 4px; }\n" +
      "  .ex { margin-top: 10px; font-size: 14px; color: #ded8f5; background: rgba(0,0,0,0.18);\n" +
      "        border-radius: 10px; padding: 10px 12px; }\n" +
      "  .ex .cn { color: #a99fe0; }\n" +
      "  .sechead { font-size: 14px; color: #b3a9df; margin: 22px 2px 2px; }\n" +
      "  .note { color: #b3a9df; font-size: 14px; padding: 12px 2px; }\n" +
      "  .bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 8px;\n" +
      "         padding: 12px 16px calc(12px + env(safe-area-inset-bottom));\n" +
      "         background: rgba(20,14,38,0.92); backdrop-filter: blur(8px); }\n" +
      "  .bar button { flex: 1; border: none; border-radius: 12px; color: #fff; font-size: 15px; padding: 14px 8px; }\n" +
      "  .bar .all { background: #7b6fd6; } .bar .stop { background: #463c7a; } .bar .yest { background: #463c7a; }\n" +
      "  #overlay { position: fixed; inset: 0; display: none; align-items: center; justify-content: center;\n" +
      "             background: rgba(0,0,0,0.55); padding: 24px; }\n" +
      "  .sheet { background: #2a2350; border-radius: 18px; padding: 20px; max-width: 460px; width: 100%; }\n" +
      "  .sheet h3 { margin: 0 0 8px; font-size: 18px; }\n" +
      "  .sheet .chg { color: #ffd34e; font-size: 20px; font-weight: 700; margin-bottom: 10px; }\n" +
      "  .sheet p { margin: 0 0 16px; line-height: 1.6; color: #e4e0f5; font-size: 15px; }\n" +
      "  .sheet button { width: 100%; border: none; border-radius: 12px; background: #7b6fd6;\n" +
      "                  color: #fff; font-size: 16px; padding: 14px; }\n" +
      "</style></head><body>\n" +
      '<h1>오늘의 단어</h1>\n' +
      '<div class="sub" id="sub"></div>\n' +
      '<div id="today"></div>\n' +
      '<div id="yesterdayWrap" style="display:none">\n' +
      '  <div class="sechead" id="yLabel"></div>\n' +
      '  <div id="yList"></div>\n' +
      "</div>\n" +
      '<div class="bar">\n' +
      '  <button class="all" data-act="all">▶️ 全部朗读</button>\n' +
      '  <button class="stop" data-act="stop">⏹ 停止</button>\n' +
      '  <button class="yest" data-act="yest">📅 回顾昨天</button>\n' +
      "</div>\n" +
      '<div id="overlay"><div class="sheet">\n' +
      '  <h3 id="sheetTitle"></h3>\n' +
      '  <div class="chg" id="sheetChg"></div>\n' +
      '  <p id="sheetDesc"></p>\n' +
      '  <button data-act="close">知道了</button>\n' +
      "</div></div>\n" +
      "<script>\n" +
      "var DATA = " + dataJson + ";\n" +
      "var RATE = { normal: 1, slow: 0.5, example: 0.8 };\n" +
      "function q(s){ return document.querySelector(s); }\n" +
      "function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;'); }\n" +
      "function getList(g){ return g==='today' ? DATA.today : (DATA.yesterday ? DATA.yesterday.words : []); }\n" +
      "function speak(text, rate){\n" +
      "  if(!('speechSynthesis' in window) || !text) return;\n" +
      "  var u = new SpeechSynthesisUtterance(text); u.lang='ko-KR'; u.rate = rate;\n" +
      "  speechSynthesis.cancel(); speechSynthesis.speak(u);\n" +
      "}\n" +
      "function sayWord(g,i,slow){ var w=getList(g)[i]; if(w) speak(w.hangul, slow?RATE.slow:RATE.normal); }\n" +
      "function sayExample(g,i){ var w=getList(g)[i]; if(w) speak(w.example, RATE.example); }\n" +
      "function speakAll(){\n" +
      "  if(!('speechSynthesis' in window)) return;\n" +
      "  speechSynthesis.cancel();\n" +
      "  DATA.today.forEach(function(w){ var u=new SpeechSynthesisUtterance(w.hangul); u.lang='ko-KR'; u.rate=1; speechSynthesis.speak(u); });\n" +
      "}\n" +
      "function stopSpeak(){ if('speechSynthesis' in window) speechSynthesis.cancel(); }\n" +
      "function showInfo(g,i){\n" +
      "  var w=getList(g)[i]; if(!w||!w.soundChange) return; var info=DATA.info[w.soundChange]; if(!info) return;\n" +
      "  q('#sheetTitle').textContent=info.label;\n" +
      "  q('#sheetChg').textContent=w.hangul+'  →  '+(w.pronounced||'');\n" +
      "  q('#sheetDesc').textContent=info.desc;\n" +
      "  q('#overlay').style.display='flex';\n" +
      "}\n" +
      "function closeSheet(){ q('#overlay').style.display='none'; }\n" +
      "function toggleYesterday(){\n" +
      "  var wrap=q('#yesterdayWrap');\n" +
      "  wrap.style.display = (wrap.style.display==='none') ? 'block' : 'none';\n" +
      "  if(wrap.style.display==='block') wrap.scrollIntoView({behavior:'smooth'});\n" +
      "}\n" +
      "function cardHTML(g,i,w){\n" +
      "  var mark = w.soundChange ? ' <span class=\"spark\" data-act=\"info\" data-g=\"'+g+'\" data-i=\"'+i+'\">⚡</span>' : '';\n" +
      "  var pron = w.pronounced ? ' <span class=\"pron\">'+esc(w.pronounced)+'</span>' : '';\n" +
      "  return '<div class=\"card\">'\n" +
      "    + '<div class=\"top\"><div class=\"hg\">'+esc(w.hangul)+mark+'</div>'\n" +
      "    + '<div class=\"btns\">'\n" +
      "    +   '<button class=\"pb\" data-act=\"play\" data-g=\"'+g+'\" data-i=\"'+i+'\">🔊</button>'\n" +
      "    +   '<button class=\"pb\" data-act=\"slow\" data-g=\"'+g+'\" data-i=\"'+i+'\">🐢</button>'\n" +
      "    + '</div></div>'\n" +
      "    + '<div class=\"rom\">'+esc(w.romanization)+pron+'</div>'\n" +
      "    + '<div class=\"mean\">'+esc(w.meaning)+'</div>'\n" +
      "    + '<div class=\"ex\" data-act=\"ex\" data-g=\"'+g+'\" data-i=\"'+i+'\">📖 '+esc(w.example)+' <span class=\"cn\">'+esc(w.exampleMeaning)+'</span></div>'\n" +
      "    + '</div>';\n" +
      "}\n" +
      "function renderList(g, el){\n" +
      "  var list=getList(g), out='';\n" +
      "  for(var i=0;i<list.length;i++) out+=cardHTML(g,i,list[i]);\n" +
      "  el.innerHTML = out || '<div class=\"note\">暂无内容</div>';\n" +
      "}\n" +
      "// 事件委托：所有点击集中处理，避免内联 onclick 的引号转义问题\n" +
      "document.addEventListener('click', function(e){\n" +
      "  var t = e.target.closest('[data-act]'); if(!t) return;\n" +
      "  var act=t.getAttribute('data-act'), g=t.getAttribute('data-g'), i=+t.getAttribute('data-i');\n" +
      "  if(act==='play') sayWord(g,i,false);\n" +
      "  else if(act==='slow') sayWord(g,i,true);\n" +
      "  else if(act==='ex') sayExample(g,i);\n" +
      "  else if(act==='info') showInfo(g,i);\n" +
      "  else if(act==='all') speakAll();\n" +
      "  else if(act==='stop') stopSpeak();\n" +
      "  else if(act==='yest') toggleYesterday();\n" +
      "  else if(act==='close') closeSheet();\n" +
      "});\n" +
      "q('#sub').textContent = DATA.date + '   ·   🔊 正常  🐢 慢速  ⚡ 音变';\n" +
      "renderList('today', q('#today'));\n" +
      "if(DATA.yesterday){ q('#yLabel').textContent='昨天 · '+DATA.yesterday.date; renderList('yesterday', q('#yList')); }\n" +
      "else { q('#yLabel').textContent='回顾昨天'; q('#yList').innerHTML='<div class=\"note\">还没有昨天的记录，明天再来看吧。</div>'; }\n" +
      "</script></body></html>"
    );
  },
};

// -----------------------------------------------------------------------------
// main —— 入口分发
// -----------------------------------------------------------------------------
async function main() {
  let words, vocab, finalState;
  try {
    vocab = await Store.loadVocab();
    const state = await Store.loadState();
    const today = formatDate(new Date());
    const res = Scheduler.getTodayWords(vocab, state, today);
    words = res.words;
    finalState = res.state;
    if (res.changed) Store.saveState(res.state); // 仅跨天/首次时写盘，保证幂等
  } catch (e) {
    // 词库缺失或损坏：组件显示兜底提示，App 内弹 Alert 引导运行 setup
    if (config.runsInWidget) {
      const ew = WidgetView.buildError("请先运行 setup 脚本安装词库，或检查 vocab.json。");
      Script.setWidget(ew);
    } else {
      const a = new Alert();
      a.title = "无法加载词库";
      a.message = String(e.message || e);
      a.addAction("好");
      await a.present();
    }
    Script.complete();
    return;
  }

  if (config.runsInWidget) {
    const family = config.widgetFamily || "medium";
    const widget = WidgetView.build(words, family);
    widget.url = URLScheme.forRunningScript(); // 点击组件跳回本脚本
    widget.refreshAfterDate = nextMidnight(); // 建议在次日零点后刷新（系统不保证准点）
    Script.setWidget(widget);
  } else {
    // App 内运行（点击组件跳转而来）：打开 WebView 听读界面
    await InteractView.present(words, vocab, finalState);
  }
  Script.complete();
}

await main();
