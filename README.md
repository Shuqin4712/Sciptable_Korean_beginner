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
| `Hanuri.js` | 主入口：WidgetView 组件渲染 + SpeechService + InteractView（UITable 交互）+ `main()` 分发 |
| `setup.js` | 一次性安装脚本：内嵌词库，运行后自动创建 `hanuri/` 目录并写入 `vocab.json`（由 `vocab.json` 生成，内容一致） |
| `test-scheduler.js` | Scheduler 断言测试（真机内运行，看 Alert 全绿即通过） |

## 安装（在 iPhone 上）

Scriptable 里「脚本」和「数据文件」处理方式不同：

**脚本（`.js`）—— 在 App 内粘贴，无需文件夹。** `importModule` 按脚本名查找，不按路径。

1. Scriptable 点右上角 ➕ 新建脚本，命名 **`hanuri-lib`**，粘贴 `hanuri-lib.js` 全部内容。
2. 同样新建 **`setup`**、**`test-scheduler`**（以及后续的 `Hanuri`），各自粘贴对应文件内容。

**词库（`vocab.json`）—— 需放到 `Documents/hanuri/`。** Scriptable App 没有「新建文件夹」按钮，二选一：

- **推荐**：运行一次 **`setup`** 脚本 —— 它会自动建目录并写入词库，无需碰「文件」App。
- 或手动：iOS「文件」App → iCloud Drive → Scriptable → 新建文件夹 `hanuri` → 把 `vocab.json` 放进去。

**验证**：运行 `test-scheduler`，看到 Alert「全部通过」即数据层正常。

**看组件**：

1. 再新建脚本命名 **`Hanuri`**，粘贴 `Hanuri.js` 内容。在 App 内点 ▶️ 运行 → 打开今日单词的交互列表（🔊 正常朗读 / 🐢 逐音节慢读 / 点击 ⚡ 行看音变解释 / 点击例句朗读 / 底部「全部朗读」「回顾昨天」）。
2. 添加到主屏幕：长按主屏空白 → ➕ → 找到 **Scriptable** → 选 small 或 medium 尺寸 → 添加后长按该组件 → **编辑小组件** → Script 选 `Hanuri`，When Interacting 选 Run Script（点击组件即跳回脚本、打开上面的交互列表）。

## 核心设计原则

- **确定性选词**：当日词由「日期 + `state.json` 的 `cursor` 顺序轮换」决定，`getTodayWords` 幂等，同一天多次刷新不变词，跨天才推进 cursor。绝不 `Math.random()`。
- **v1 完全离线**：词库打包本地 JSON。例句生成 / 真人 TTS / SRS 均在 backlog。
- **慢速朗读 🐢**：Scriptable 的 `Speech` 无语速参数（Stage 0 已验证），采用逐音节分段排队朗读的降级方案。

## 开发进度

- [x] Stage 0 — 环境验证（Speech 无 rate 参数 → 慢速走逐音节方案；FileManager 走 iCloud）
- [x] Stage 1 — 数据层（50 词 `vocab.json` + Store + Scheduler + 断言测试，确定性/幂等/跨天已验证）
- [x] Stage 2 — 组件渲染（`Hanuri.js` WidgetView，small/medium，深色渐变 + Color.dynamic，音变 ⚡）
- [x] Stage 3 — 交互与发音（UITable + SpeechService 🔊/🐢 + 全部朗读 + 回顾昨天 + 音变解释 Alert）
- [ ] Stage 4 — 打磨（异常处理补全、边界情况、代码整理与注释）
