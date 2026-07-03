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
// SpeechService —— 封装 Speech（🔊 整词 / 🐢 逐音节慢读）
// -----------------------------------------------------------------------------
// Stage 0 已验证：Scriptable 的 Speech 无语速参数，只有 Speech.speak(text)。
// 慢读降级方案：把词拆成韩文音节逐个 speak，靠 utterance 之间的天然停顿制造「慢而清晰」。
// 对有音变的词，慢读用 pronounced 的音变后形式（如 학꾜 → 학·꾜），逐音节也能听到紧音。
const SpeechService = {
  // 整词/整句正常朗读；跨音节的音变由系统 TTS 自然处理
  speak(text) {
    if (text) Speech.speak(text);
  },

  // 单词朗读：slow=false 整词一次读；slow=true 逐音节读
  speakWord(word, slow) {
    if (!slow) {
      Speech.speak(word.hangul);
      return;
    }
    const src = word.pronounced ? word.pronounced.replace(/[\[\]]/g, "") : word.hangul;
    this._speakSyllables(src);
  },

  // 顺序朗读一组词（「全部朗读」）
  speakAll(words) {
    for (const w of words) Speech.speak(w.hangul);
  },

  // 把文本里的完成型韩文音节（U+AC00–U+D7A3）逐个排队朗读，非韩文字符跳过
  _speakSyllables(text) {
    const parts = [];
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (c >= 0xac00 && c <= 0xd7a3) parts.push(ch);
    }
    if (!parts.length) {
      Speech.speak(text);
      return;
    }
    for (const p of parts) Speech.speak(p);
  },
};

// -----------------------------------------------------------------------------
// InteractView —— UITable 交互界面（点击听读 / 音变解释 / 全部朗读 / 回顾昨天）
// -----------------------------------------------------------------------------
const InteractView = {
  async present(words, vocab, state) {
    const table = this._buildTable(words, vocab, state);
    await table.present(true);
  },

  _buildTable(words, vocab, state) {
    const table = new UITable();
    table.showSeparators = true;

    const header = new UITableRow();
    header.isHeader = true;
    header.addCell(
      UITableCell.text(
        "오늘의 단어 · " + formatDate(new Date()),
        "🔊 正常语速   🐢 逐音节慢读   ⚡ 点击查看音变"
      )
    );
    table.addRow(header);

    for (const w of words) this._addWordRows(table, w);

    // 底部操作行
    const allRow = new UITableRow();
    allRow.dismissOnSelect = false;
    const allCell = UITableCell.text("▶️ 全部朗读");
    allCell.titleFont = Font.mediumSystemFont(17);
    allRow.addCell(allCell);
    allRow.onSelect = () => SpeechService.speakAll(words);
    table.addRow(allRow);

    const revRow = new UITableRow();
    revRow.dismissOnSelect = false;
    const revCell = UITableCell.text("📅 回顾昨天");
    revCell.titleFont = Font.mediumSystemFont(17);
    revRow.addCell(revCell);
    revRow.onSelect = async () => {
      await this._presentYesterday(vocab, state);
    };
    table.addRow(revRow);

    return table;
  },

  // 一个词占 4 行：韩文+按钮 / 罗马音·实际读音 / 释义 / 例句，末尾加一条空行分隔
  _addWordRows(table, word) {
    // 行 1：韩文（大）+ ⚡ ｜ 🔊 ｜ 🐢
    const rowA = new UITableRow();
    rowA.height = 54;
    rowA.dismissOnSelect = false;
    const hCell = UITableCell.text(hangulWithMark(word), word.pos);
    hCell.titleFont = Font.boldSystemFont(24);
    hCell.subtitleColor = Color.gray();
    hCell.widthWeight = 62;
    rowA.addCell(hCell);

    const playCell = UITableCell.button("🔊");
    playCell.widthWeight = 19;
    playCell.centerAligned();
    playCell.onTap = () => SpeechService.speakWord(word, false);
    rowA.addCell(playCell);

    const slowCell = UITableCell.button("🐢");
    slowCell.widthWeight = 19;
    slowCell.centerAligned();
    slowCell.onTap = () => SpeechService.speakWord(word, true);
    rowA.addCell(slowCell);
    table.addRow(rowA);

    // 行 2：罗马音 + 实际读音（有音变时点击本行看解释）
    const rowB = new UITableRow();
    rowB.dismissOnSelect = false;
    const romaText = word.romanization + (word.pronounced ? "    " + word.pronounced : "");
    const subText = word.soundChange
      ? "⚡ " + CONFIG.soundChangeInfo[word.soundChange].label + "（点击查看）"
      : "";
    const bCell = UITableCell.text(romaText, subText);
    bCell.titleFont = Font.systemFont(15);
    bCell.titleColor = Color.gray();
    bCell.subtitleColor = new Color("#C79A00");
    rowB.addCell(bCell);
    if (word.soundChange) {
      rowB.onSelect = async () => {
        const info = CONFIG.soundChangeInfo[word.soundChange];
        const a = new Alert();
        a.title = info.label;
        a.message = word.hangul + " → " + word.pronounced + "\n\n" + info.desc;
        a.addAction("好");
        await a.present();
      };
    }
    table.addRow(rowB);

    // 行 3：释义
    const rowC = new UITableRow();
    rowC.dismissOnSelect = false;
    const cCell = UITableCell.text(word.meaning);
    cCell.titleFont = Font.systemFont(16);
    rowC.addCell(cCell);
    table.addRow(rowC);

    // 行 4：例句（点击朗读整句）
    const rowD = new UITableRow();
    rowD.dismissOnSelect = false;
    const dCell = UITableCell.text("📖 " + word.example, word.exampleMeaning);
    dCell.titleFont = Font.systemFont(15);
    dCell.subtitleColor = Color.gray();
    rowD.addCell(dCell);
    rowD.onSelect = () => SpeechService.speak(word.example);
    table.addRow(rowD);

    // 分隔空行
    const gap = new UITableRow();
    gap.height = 12;
    gap.addCell(UITableCell.text(""));
    table.addRow(gap);
  },

  async _presentYesterday(vocab, state) {
    const y = Scheduler.getYesterdayWords(vocab, state);
    if (!y) {
      const a = new Alert();
      a.title = "回顾昨天";
      a.message = "还没有昨天的记录，明天再来看吧。";
      a.addAction("好");
      await a.present();
      return;
    }
    const table = new UITable();
    table.showSeparators = true;
    const header = new UITableRow();
    header.isHeader = true;
    header.addCell(UITableCell.text("昨天 · " + y.date, "复习一下昨天的词"));
    table.addRow(header);
    for (const w of y.words) this._addWordRows(table, w);
    await table.present(true);
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
    // App 内运行（点击组件跳转而来）：打开 UITable 交互界面
    await InteractView.present(words, vocab, finalState);
  }
  Script.complete();
}

await main();
