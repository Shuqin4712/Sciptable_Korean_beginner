# HanuriWidget — 韩语每日单词小组件（Scriptable）

运行在 iOS **Scriptable** App 上的韩语初学者（TOPIK I）每日单词小组件：桌面看词、点击听读（含慢速朗读）、标注音变。完全离线。

> 架构与设计规范以 [`korean-widget-design.md`](./korean-widget-design.md) 为准。
> 开发约定见 [`CLAUDE.md`](./CLAUDE.md)：**禁止 npm 依赖和 DOM/Node API**。

## 文件

| 文件 | 说明 |
|------|------|
| `korean-widget-design.md` | 完整设计文档（架构唯一权威） |
| `CLAUDE.md` | 平台约束与核心原则 |
| `stage0-probe.js` | Stage 0 环境探针（Speech / FileManager / config 分支验证，含真机探测结论） |
| `vocab.json` | 词库（50 词，含音变标注） |
| `hanuri-lib.js` | 数据层公共模块：CONFIG / Store / Scheduler（`importModule` 引入） |
| `test-scheduler.js` | Scheduler 断言测试（真机内运行，看 Alert 全绿即通过） |

## 安装（在 iPhone 上）

1. 把 `hanuri-lib.js`、`test-scheduler.js`（以及后续的 `Hanuri.js`）拷进 Scriptable 脚本目录。
2. 把 `vocab.json` 放到 Scriptable 的 **`Documents/hanuri/`** 目录下（首次运行脚本会自动创建该目录；也可手动新建后放入）。
3. 运行 `test-scheduler.js` 确认数据层正常，再添加主屏幕小组件（指向 `Hanuri.js`，Stage 2+ 提供）。

## 核心设计原则

- **确定性选词**：当日词由「日期 + `state.json` 的 `cursor` 顺序轮换」决定，`getTodayWords` 幂等，同一天多次刷新不变词，跨天才推进 cursor。绝不 `Math.random()`。
- **v1 完全离线**：词库打包本地 JSON。例句生成 / 真人 TTS / SRS 均在 backlog。
- **慢速朗读 🐢**：Scriptable 的 `Speech` 无语速参数（Stage 0 已验证），采用逐音节分段排队朗读的降级方案。

## 开发进度

- [x] Stage 0 — 环境验证（Speech 无 rate 参数 → 慢速走逐音节方案；FileManager 走 iCloud）
- [x] Stage 1 — 数据层（50 词 `vocab.json` + Store + Scheduler + 断言测试，确定性/幂等/跨天已验证）
- [ ] Stage 2 — 组件渲染（WidgetView，small/medium，深浅色）
- [ ] Stage 3 — 交互与发音（UITable + SpeechService + 全部朗读 + 回顾昨天）
- [ ] Stage 4 — 打磨（音变解释 Alert、异常处理、注释）
