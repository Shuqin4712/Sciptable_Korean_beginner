# CLAUDE.md — HanuriWidget 项目约定

> **架构以 `korean-widget-design.md` 为准。禁止使用 npm 依赖和 DOM API。**

本项目是一个运行在 **iOS Scriptable App** 上的韩语每日单词小组件。完整设计规范见项目根目录的
[`korean-widget-design.md`](./korean-widget-design.md)，任何实现决策与该文档冲突时，以该文档为准。

---

## ⚠️ 平台约束（最容易踩的坑）

运行环境是 **JavaScriptCore + Scriptable 私有 API**，不是 Node，也不是浏览器。写代码前务必牢记：

- **禁止 npm / 第三方包**：没有 `require()`、没有 `import`（唯一例外是 Scriptable 的 `importModule()`）、没有 `package.json`、不跑构建工具。
- **禁止 DOM / 浏览器 API**：没有 `window`、`document`、`localStorage`、`fetch`、`XMLHttpRequest`、`console.log` 之外的浏览器全局。
- **禁止 Node API**：没有 `fs`、`path`、`process`、`Buffer`、`__dirname`。文件读写一律用 `FileManager`。
- **只用 Scriptable 内置类**：`ListWidget`、`UITable`、`Speech`、`FileManager`、`Request`、`Alert`、`Color`、`Font`、`LinearGradient`、`DateFormatter`、`config`、`args`、`Script`、`URLScheme` 等。
- **网络**：联网只能用 Scriptable 的 `Request` 类；但 **v1 完全离线**，不写任何网络代码。

> 模型很容易习惯性写出 Node/浏览器风格的代码（`require`、`fs.readFileSync`、`fetch`、`document.*`）。
> 在这个仓库里，这类代码一律是错的 —— 一旦发现请立即改成对应的 Scriptable API。

---

## 核心设计原则（不要偏离）

1. **确定性选词，绝不随机**：当日单词由「日期字符串 + `state.json` 里的 `cursor` 顺序轮换」决定，
   而不是 `Math.random()`。小组件一天会被系统刷新很多次，随机会导致「早上看到的词下午变了」。
   同一天多次调用 `getTodayWords` 必须返回相同结果（幂等），跨天才推进 cursor。
2. **v1 完全离线**：词库打包成本地 `vocab.json`，不调任何 API。例句生成、真人 TTS 音频、SRS
   都在 backlog，v1 不实现。
3. **词库先 50 词**：先跑通「桌面看 → 点击听」的完整链路，再谈扩词。
4. **状态靠文件持久化**：无后台进程。写 `state.json` 前先读最新文件，按 `lastDate` 判断是否需要
   生成新一天的词，避免重复推进 cursor。

---

## 开发顺序

按 `korean-widget-design.md` 第 7 节分阶段推进。**Stage 0（环境探针）最先做** ——
先用最小脚本验证 `Speech` 对韩文的实际行为和可用参数，这个结论直接决定「慢速朗读 🐢」怎么实现，
不要跳过直接写业务代码。

- `stage0-probe.js` — 环境探针（Speech / FileManager / config 分支）
- `Hanuri.js` — 主入口（组件 + 交互双模式），v1 单文件，超 ~600 行再拆 `hanuri-lib.js`

---

## 数据 / 文件位置

- 代码：仓库根目录的 `.js` 文件，直接拷进 Scriptable 脚本目录运行。
- 运行时数据：`FileManager.documentsDirectory()/hanuri/` 下的 `vocab.json` 和 `state.json`
  （由脚本首次运行时初始化，不提交到仓库的运行时状态）。
