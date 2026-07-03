// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: book;

// =============================================================================
// hanuri-lib.js — HanuriWidget 公共模块（通过 importModule 引入）
// =============================================================================
// 纯 Scriptable 环境：无 npm、无 DOM、无 Node。文件读写只用 FileManager。
// 本模块提供数据层：CONFIG / Store / Scheduler + 纯函数工具。
// Stage 2+ 的 WidgetView / InteractView / SpeechService 由 Hanuri.js 提供。
//
// 用法：const H = importModule("hanuri-lib")
// =============================================================================

// -----------------------------------------------------------------------------
// CONFIG —— 常量与文案（写死，不联网）
// -----------------------------------------------------------------------------
const CONFIG = {
  // 运行时数据目录（documentsDirectory()/hanuri/ 下）
  dirName: "hanuri",
  vocabFile: "vocab.json",
  stateFile: "state.json",

  // 每日词数：medium 组件展示 3 个；small 只取第 1 个
  dailyCount: 3,

  // history 最多保留天数
  historyLimit: 7,

  // 音变类型的中文解释（四种，UI 层点击 ⚡ 时弹出）
  soundChangeInfo: {
    liaison: {
      label: "连音（연음）",
      desc: "前一个字的收音（韵尾）移到后一个以元音开头的字上发音。例：음악 → [으막]。",
    },
    tensification: {
      label: "紧音化（경음화 / 된소리되기）",
      desc: "在特定收音之后，平音 ㄱㄷㅂㅅㅈ 变成紧音 ㄲㄸㅃㅆㅉ。例：학교 → [학꾜]。",
    },
    nasalization: {
      label: "鼻音化（비음화）",
      desc: "塞音收音 ㄱㄷㅂ 在鼻音 ㄴㅁ 前变成对应鼻音 ㅇㄴㅁ。例：국물 → [궁물]。",
    },
    aspiration: {
      label: "送气化（격음화 / 거센소리되기）",
      desc: "ㅎ 与平音 ㄱㄷㅂㅈ 相邻时合并成送气音 ㅋㅌㅍㅊ。例：축하 → [추카]。",
    },
  },
};

// -----------------------------------------------------------------------------
// 纯函数工具（不依赖任何 Scriptable API，便于断言测试）
// -----------------------------------------------------------------------------

// 本地时区的 YYYY-MM-DD。刻意不用 toISOString()（那是 UTC，会导致跨零点误判）。
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 下一个本地零点（widget.refreshAfterDate 用）。
function nextMidnight(now) {
  const base = now || new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 0, 0, 0, 0);
}

// 默认（首次运行）状态。
function defaultState() {
  return { lastDate: null, todayIds: [], history: [], cursor: 0 };
}

// 按 id 取词，保序，找不到的丢弃。
function resolveIds(vocab, ids) {
  const byId = new Map(vocab.words.map((w) => [w.id, w]));
  const out = [];
  for (const id of ids) {
    const w = byId.get(id);
    if (w) out.push(w);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Scheduler —— 确定性、幂等的选词逻辑
// -----------------------------------------------------------------------------
// getTodayWords(vocab, state, today):
//   - 若 state.lastDate === today 且已存的 todayIds 全部能在词库中解析 → 原样返回，
//     不推进 cursor（幂等：同一天多次调用结果一致）。
//   - 否则（新的一天 / 首次运行 / 词库变动导致解析失败）→ 从 cursor 顺序取 dailyCount 个词
//     （环形回绕），把昨天的词压入 history（保留最近 historyLimit 天），推进 cursor。
//
// 该函数不写文件：返回 { words, state, changed }，由调用方在 changed 时 saveState。
const Scheduler = {
  getTodayWords(vocab, state, today) {
    const total = vocab.words.length;
    const n = Math.min(CONFIG.dailyCount, total);

    // —— 幂等分支：同一天且历史选词仍有效 ——
    if (state.lastDate === today && Array.isArray(state.todayIds) && state.todayIds.length) {
      const cached = resolveIds(vocab, state.todayIds);
      if (cached.length === state.todayIds.length) {
        return { words: cached, state, changed: false };
      }
      // 解析不全（词库变动），落到重新生成分支
    }

    // —— 生成新一天的词 ——
    const cursor = ((state.cursor % total) + total) % total; // 归一化，防御负数/越界
    const picked = [];
    const pickedIds = [];
    for (let i = 0; i < n; i++) {
      const w = vocab.words[(cursor + i) % total];
      picked.push(w);
      pickedIds.push(w.id);
    }

    // 把上一天的词并入 history（去重，最新在前，裁剪到 historyLimit）
    let history = Array.isArray(state.history) ? state.history.slice() : [];
    if (state.lastDate && Array.isArray(state.todayIds) && state.todayIds.length) {
      history = history.filter((h) => h.date !== state.lastDate);
      history.unshift({ date: state.lastDate, ids: state.todayIds.slice() });
      history = history.slice(0, CONFIG.historyLimit);
    }

    const newState = {
      lastDate: today,
      todayIds: pickedIds,
      history,
      cursor: (cursor + n) % total,
    };
    return { words: picked, state: newState, changed: true };
  },

  // 取「昨天」的词用于回顾：优先 history 里紧邻的一条，找不到返回 null。
  getYesterdayWords(vocab, state) {
    if (!state.history || !state.history.length) return null;
    const prev = state.history[0];
    const words = resolveIds(vocab, prev.ids);
    return words.length ? { date: prev.date, words } : null;
  },
};

// -----------------------------------------------------------------------------
// Store —— 文件读写（iCloud 优先，回退 local；读 iCloud 文件前先下载）
// -----------------------------------------------------------------------------
const Store = {
  _fm: null,

  fm() {
    if (this._fm) return this._fm;
    try {
      this._fm = FileManager.iCloud();
    } catch (e) {
      this._fm = FileManager.local();
    }
    return this._fm;
  },

  dir() {
    const fm = this.fm();
    const d = fm.joinPath(fm.documentsDirectory(), CONFIG.dirName);
    if (!fm.fileExists(d)) fm.createDirectory(d, true);
    return d;
  },

  path(file) {
    return this.fm().joinPath(this.dir(), file);
  },

  // iCloud 上的文件读取前需要先下载（async）。本地文件此调用是 no-op。
  async _ensureLocal(p) {
    const fm = this.fm();
    try {
      if (typeof fm.isFileStoredIniCloud === "function" && fm.isFileStoredIniCloud(p)) {
        await fm.downloadFileFromiCloud(p);
      }
    } catch (e) {
      // 下载失败时继续尝试读取，交由上层处理异常
    }
  },

  async loadVocab() {
    const fm = this.fm();
    const p = this.path(CONFIG.vocabFile);
    if (!fm.fileExists(p)) {
      throw new Error(
        `找不到词库文件：${p}\n请把仓库里的 vocab.json 拷到 Scriptable 的 Documents/${CONFIG.dirName}/ 目录下。`
      );
    }
    await this._ensureLocal(p);
    const raw = fm.readString(p);
    const vocab = JSON.parse(raw);
    if (!vocab || !Array.isArray(vocab.words) || !vocab.words.length) {
      throw new Error("词库文件格式不正确：缺少非空的 words 数组。");
    }
    return vocab;
  },

  // 无 state 文件时返回默认状态（首次运行不崩溃）。
  async loadState() {
    const fm = this.fm();
    const p = this.path(CONFIG.stateFile);
    if (!fm.fileExists(p)) return defaultState();
    await this._ensureLocal(p);
    try {
      const s = JSON.parse(fm.readString(p));
      // 补齐可能缺失的字段，保持向后兼容
      return Object.assign(defaultState(), s);
    } catch (e) {
      return defaultState();
    }
  },

  saveState(state) {
    const fm = this.fm();
    fm.writeString(this.path(CONFIG.stateFile), JSON.stringify(state, null, 2));
  },
};

// -----------------------------------------------------------------------------
// 导出
// -----------------------------------------------------------------------------
module.exports = {
  CONFIG,
  formatDate,
  nextMidnight,
  defaultState,
  resolveIds,
  Scheduler,
  Store,
};
