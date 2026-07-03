// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: language;

// =============================================================================
// Hanuri.js — HanuriWidget 主入口（组件渲染 + App 内交互双模式）
// =============================================================================
// 纯 Scriptable 环境：无 npm、无 DOM、无 Node。数据层来自 hanuri-lib（importModule）。
//
// 当前实现范围：Stage 2 —— 桌面组件渲染（small / medium，深浅色适配）。
//   config.runsInWidget 为真 → 渲染并 Script.setWidget。
//   否则（在 App 内点击运行）→ presentMedium() 预览调试。
//   Stage 3 会把 App 模式替换为 UITable 交互界面（🔊/🐢/回顾昨天）。
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
// WidgetView —— 组件渲染
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
// main —— 入口分发
// -----------------------------------------------------------------------------
async function main() {
  let words;
  try {
    const vocab = await Store.loadVocab();
    const state = await Store.loadState();
    const today = formatDate(new Date());
    const res = Scheduler.getTodayWords(vocab, state, today);
    words = res.words;
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
    // Stage 2 调试：App 内预览 medium。Stage 3 将替换为 UITable 交互界面。
    const widget = WidgetView.build(words, "medium");
    await widget.presentMedium();
  }
  Script.complete();
}

await main();
