// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: vial;

// =============================================================================
// test-scheduler.js — Scheduler 断言测试（在 Scriptable App 内运行）
// =============================================================================
// 验证确定性选词的三条不变量：
//   ① 同一天多次调用结果相同（幂等，cursor 不推进）
//   ② 跨天正确推进 cursor，昨天的词进入 history
//   ③ cursor 到词库末尾时环形回绕
// 另外覆盖：首次运行默认状态、history 裁剪到 7 天、回顾昨天。
//
// 用法：与 hanuri-lib.js 放在同一 Scriptable 脚本目录，点击运行本脚本，
//      看弹出的 Alert 汇总（全绿即通过）。本测试用合成词库，不依赖真实 vocab.json。
// =============================================================================

const H = importModule("hanuri-lib");
const { Scheduler, defaultState, CONFIG } = H;

// 合成词库：5 个词，便于观察 dailyCount=3 时的回绕。
const vocab = {
  meta: { name: "test", version: 1, count: 5 },
  words: [
    { id: "t0", hangul: "가" },
    { id: "t1", hangul: "나" },
    { id: "t2", hangul: "다" },
    { id: "t3", hangul: "라" },
    { id: "t4", hangul: "마" },
  ],
};

// --- 极简断言框架 ---
const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? "✅" : "❌"} ${name}`);
}
function idsOf(words) {
  return words.map((w) => w.id).join(",");
}

// 前置断言：本测试假设 dailyCount 为 3。
check("前提 dailyCount === 3", CONFIG.dailyCount === 3);

// ① 首次运行 + 幂等 -------------------------------------------------------------
let state = defaultState();
const day1 = "2026-07-04";

const r1 = Scheduler.getTodayWords(vocab, state, day1);
check("首次运行 changed === true", r1.changed === true);
check("首次取前 3 个词 t0,t1,t2", idsOf(r1.words) === "t0,t1,t2");
check("cursor 推进到 3", r1.state.cursor === 3);
check("首次运行 history 为空", r1.state.history.length === 0);

// 用返回的 state 再次调用同一天 → 必须幂等
const r1b = Scheduler.getTodayWords(vocab, r1.state, day1);
check("同一天再次调用 changed === false（幂等）", r1b.changed === false);
check("同一天再次调用选词不变", idsOf(r1b.words) === "t0,t1,t2");
check("同一天再次调用 cursor 不推进", r1b.state.cursor === 3);

// ② 跨天推进 + 环形回绕 --------------------------------------------------------
const day2 = "2026-07-05";
const r2 = Scheduler.getTodayWords(vocab, r1.state, day2);
check("跨天 changed === true", r2.changed === true);
// cursor 从 3 取 3 个：t3, t4, 回绕到 t0
check("跨天从 cursor=3 回绕取 t3,t4,t0", idsOf(r2.words) === "t3,t4,t0");
check("跨天 cursor 推进到 (3+3)%5=1", r2.state.cursor === 1);
check("昨天的词进入 history", r2.state.history.length === 1 && r2.state.history[0].date === day1);
check("history 记录的是昨天的 ids", r2.state.history[0].ids.join(",") === "t0,t1,t2");

// ③ 回顾昨天 -------------------------------------------------------------------
const y = Scheduler.getYesterdayWords(vocab, r2.state);
check("回顾昨天返回 day1", y && y.date === day1);
check("回顾昨天词为 t0,t1,t2", y && idsOf(y.words) === "t0,t1,t2");

// ④ history 裁剪到 historyLimit 天 ---------------------------------------------
let s = defaultState();
let d = new Date(2026, 0, 1); // 2026-01-01
for (let i = 0; i < 10; i++) {
  const today = H.formatDate(d);
  s = Scheduler.getTodayWords(vocab, s, today).state;
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}
check(`连续 10 天后 history 裁剪到 ${CONFIG.historyLimit}`, s.history.length === CONFIG.historyLimit);
check("history 最新一条在最前", s.history[0].date === "2026-01-09");

// ⑤ 防御：cursor 越界/负数归一化 ----------------------------------------------
const weird = Object.assign(defaultState(), { cursor: 7, lastDate: null });
const rw = Scheduler.getTodayWords(vocab, weird, "2026-07-04");
// cursor 7 % 5 = 2 → t2,t3,t4
check("cursor 越界(7)归一化到 2，取 t2,t3,t4", idsOf(rw.words) === "t2,t3,t4");

// --- 汇总 ---
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
const summary =
  `通过 ${passed}/${results.length}` +
  (failed.length ? "\n\n失败项：\n" + failed.map((f) => "❌ " + f.name).join("\n") : "\n\n🎉 全部通过");

const a = new Alert();
a.title = "Scheduler 测试";
a.message = summary;
a.addAction("完成");
await a.present();
Script.complete();
