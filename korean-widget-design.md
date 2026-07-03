# 韩语学习小组件（Scriptable）— 项目设计文档

> 本文档面向 Claude Code，作为项目的完整设计规范。请严格遵守「平台约束」一节，Scriptable 不是标准 Node/浏览器环境。

---

## 1. 项目概述

**项目名**：HanuriWidget（暂定，可改）

**一句话描述**：一个运行在 iOS Scriptable 上的韩语每日单词小组件。桌面组件展示当日单词（韩文 + 音标 + 释义），点击组件后进入可交互列表，逐词播放 TTS 发音（含慢速朗读），核心理念是「听懂和会说优先于看懂」。

**目标用户**：韩语初学者（TOPIK I 水平），也就是开发者本人。纯兴趣项目，不追求商业化，但代码结构要清晰可维护。

**技术形态**：纯本地 JavaScript 脚本（单文件或少量文件），运行于 Scriptable App，无后端、无构建工具、无 npm 依赖。

---

## 2. 使用场景（User Scenarios)

### 场景 A：桌面被动曝光（每天高频发生）
用户解锁手机看到主屏幕，小组件展示今天的 3~5 个单词。用户扫一眼韩文和释义，不需要任何操作。组件每天 0 点后自动换词，一天内保持稳定（不随系统刷新随机变词）。

### 场景 B：主动听读复习（每天 1~3 次）
用户点击小组件 → Scriptable 打开并运行脚本 → 弹出 UITable 交互界面，列出今日单词。每行显示：韩文、罗马音、实际读音（音变后）、中文释义、例句。每行有两个按钮：
- 🔊 正常语速朗读（`Speech.speak`，`ko-KR`）
- 🐢 慢速朗读（rate 调低）

用户逐个点击听发音，可跟读。界面底部提供「全部朗读」按钮，按顺序播放今日所有词。

### 场景 C：查看音变提示
当单词存在音变（连音、紧音化、鼻音化等，如 학교 → [학꾜]），该词条显示一个标记（如 ⚡），点击行内的详情可看到音变类型说明。这是本项目与普通背单词组件的差异点。

### 场景 D：换一批 / 回顾
交互界面提供「明天的词提前看」不做；但提供「回顾昨天」按钮，展示前一天的词（从历史记录读取），方便复习遗忘的内容。

---

## 3. 平台约束（必须遵守）

这是最重要的一节。Scriptable 环境的特殊性：

### 3.1 小组件（Widget）约束
- 小组件是**静态快照**，渲染一次后不可交互、不可滚动、不能播放声音。
- 系统控制刷新时机，**不保证准点刷新**（通常间隔 ≥15 分钟，实际可能更久）。用 `widget.refreshAfterDate` 只是建议值。
- 因此「当日单词」的选择逻辑必须是**确定性的**：以日期字符串（如 `2026-07-04`）为 seed 决定当天词组，无论组件当天刷新多少次，结果一致。禁止用 `Math.random()` 裸随机选词。
- 组件尺寸需支持 small / medium 两档（用 `config.widgetFamily` 判断）：small 只显示 1 个主打词，medium 显示 3 个词。
- 点击组件的行为通过 `widget.url = URLScheme.forRunningScript()` 设置，跳转回 Scriptable 运行本脚本。

### 3.2 脚本运行环境约束
- 环境是 JavaScriptCore + Scriptable 私有 API，**没有** DOM、没有 `window`、没有 `require`/`import`（除 Scriptable 的 `importModule`）、不能用 npm 包。
- 所有 API 以 Scriptable 内置类为准：`ListWidget`、`UITable`、`Speech`、`FileManager`、`Request`、`Alert`、`config`、`args` 等。
- 用 `config.runsInWidget` 区分「组件渲染模式」和「App 内交互模式」，同一脚本两种入口。
- TTS 用 `Speech.speak(text)`。注意：Scriptable 的 Speech API 较简单，如果无法直接指定语言/语速参数，退化方案是确保系统已下载韩语 Siri 语音，Speech 会根据文本自动识别韩文。**实现时先写一个最小 demo 验证 Speech 对韩文的实际行为，再决定慢速朗读的实现方式**（如果 rate 参数不可用，慢速功能降级为逐字分段朗读或直接砍掉）。
- 无持久后台进程，所有状态靠文件持久化。

### 3.3 存储约束
- 使用 `FileManager.iCloud()`（优先，可跨设备）或 `FileManager.local()`。
- 数据目录：`FileManager.documentsDirectory()/hanuri/` 下，词库和状态分文件存放。
- 组件模式下读 iCloud 文件要先 `downloadFileFromiCloud()`，注意这是 async。

### 3.4 网络约束
- 第一版**完全离线**：词库打包成本地 JSON，不调任何 API。
- 例句、TTS 音频下载等联网功能全部属于后续版本，不要在 v1 实现。

---

## 4. 数据结构设计

### 4.1 词条 Schema（`vocab.json`）

```json
{
  "meta": {
    "name": "TOPIK I 核心词库",
    "version": 1,
    "count": 300
  },
  "words": [
    {
      "id": "w0012",
      "hangul": "학교",
      "romanization": "hakgyo",
      "pronounced": "[학꾜]",
      "soundChange": "tensification",
      "pos": "名词",
      "meaning": "学校",
      "example": "학교에 가요.",
      "exampleMeaning": "去学校。",
      "level": "TOPIK1"
    }
  ]
}
```

字段说明：
- `pronounced`：**实际读音**（音变后的谚文标注）。无音变时与 `hangul` 相同，此时可省略该字段。
- `soundChange`：音变类型枚举：`liaison`（连音）/ `tensification`(紧音化) / `nasalization`（鼻音化）/ `aspiration`（送气化）/ `null`。UI 层据此显示 ⚡ 标记和中文解释。
- 初始词库先做 **50~100 个词**即可跑通全流程，后续再扩到 TOPIK I 全量。词库内容生成时注意音变标注的准确性，宁缺毋滥：不确定的词就标 `soundChange: null`。

### 4.2 状态文件（`state.json`）

```json
{
  "lastDate": "2026-07-04",
  "todayIds": ["w0012", "w0087", "w0203"],
  "history": [
    { "date": "2026-07-03", "ids": ["w0005", "w0141", "w0198"] }
  ],
  "cursor": 36
}
```

- 选词策略 v1 用**顺序轮换**（cursor 递增取下一组），不是随机：保证词库均匀覆盖，逻辑简单可预测。`history` 只保留最近 7 天。
- 组件模式和 App 模式都可能写 state，写入前先读最新文件，按 `lastDate` 判断是否需要生成新一天的词，避免重复推进 cursor。

---

## 5. 代码架构

### 5.1 文件结构（Scriptable 脚本目录）

```
Scriptable/
├── Hanuri.js              # 主入口脚本（组件 + 交互双模式）
├── hanuri-lib.js          # 可选：公共模块（importModule 引入）
└── (Documents)/hanuri/
    ├── vocab.json          # 词库
    └── state.json          # 每日状态
```

v1 允许全部写在 `Hanuri.js` 单文件内（Scriptable 用户习惯单文件分发），但内部必须按模块组织。如果单文件超过 ~600 行，拆出 `hanuri-lib.js`。

### 5.2 模块划分（单文件内的逻辑分区）

```
Hanuri.js
├── CONFIG          常量：路径、每日词数、颜色主题、字体大小
├── Store           文件读写：loadVocab / loadState / saveState（含 iCloud 下载处理）
├── Scheduler       选词逻辑：getTodayWords(date) —— 确定性、幂等
├── WidgetView      组件渲染：buildWidget(words, family) → ListWidget
├── InteractView    交互界面：buildTable(words) → UITable（含发音按钮回调）
├── SpeechService   封装 Speech：speak(text, slow=false)，处理韩语朗读
└── main()          入口分发：config.runsInWidget ? 渲染组件 : 打开交互界面
```

### 5.3 主流程伪代码

```javascript
async function main() {
  const vocab = await Store.loadVocab()
  const state = await Store.loadState()
  const today = formatDate(new Date())        // "2026-07-04"
  const words = Scheduler.getTodayWords(vocab, state, today)  // 必要时推进 cursor 并 saveState

  if (config.runsInWidget) {
    const widget = WidgetView.build(words, config.widgetFamily)
    widget.url = URLScheme.forRunningScript()
    widget.refreshAfterDate = nextMidnight()
    Script.setWidget(widget)
  } else {
    await InteractView.present(words, state)   // UITable，含 🔊/🐢/回顾昨天
  }
  Script.complete()
}
```

---

## 6. UI 规格

### 6.1 组件（medium 为主）
- 背景：深色渐变（`LinearGradient`），韩文用大号粗体白色，罗马音用小号灰色，释义用中号。
- 布局：medium 三词竖排，每词一行「韩文 — 罗马音 — 释义」；small 单词居中大字。
- 有音变的词在韩文后加 ⚡。
- 底部一行小字显示日期 + 「탭하여 듣기 / 点击收听」提示。
- 颜色支持深浅色模式（`Color.dynamic`）。

### 6.2 交互界面（UITable）
- 每个单词占一个 section：
  - 行 1：韩文（大）+ ⚡（如有）｜右侧两个按钮 cell：🔊、🐢
  - 行 2：罗马音 + 实际读音 [학꾜]
  - 行 3：释义
  - 行 4：例句（点击例句行 → 朗读整句例句）
- 表格底部：「▶️ 全部朗读」「📅 回顾昨天」两个操作行。
- 有音变的词，点击 ⚡ 所在行弹 Alert 显示音变类型的中文解释（解释文案写死在 CONFIG 里，四种类型各一段）。

---

## 7. 开发阶段（建议按此顺序分 session）

**Stage 0 — 环境验证（最先做）**
写一个 20 行的探针脚本：验证 ① `Speech.speak` 朗读韩文的实际效果与可用参数；② iCloud FileManager 读写；③ `config.runsInWidget` 分支。这一步的结论会影响「慢速朗读」的实现方案。

**Stage 1 — 数据层**
生成 50 词的 `vocab.json`（含音变标注），实现 Store + Scheduler，写简单断言测试确定性选词（同一天多次调用结果相同、跨天 cursor 正确推进）。

**Stage 2 — 组件渲染**
实现 WidgetView，small/medium 两档，深浅色适配。用 `widget.presentMedium()` 在 App 内预览调试。

**Stage 3 — 交互与发音**
实现 UITable 界面 + SpeechService + 全部朗读 + 回顾昨天。

**Stage 4 — 打磨**
音变解释 Alert、异常处理（词库文件缺失时的引导提示）、代码整理与注释。

### 后续版本 backlog（v1 不做）
- DeepSeek API 每日生成新例句（缓存本地）
- 简化版 SRS：标记「没记住」的词提高复现频率
- 真人 TTS 音频（下载 mp3 缓存播放）
- 锁屏小组件（accessoryRectangular）

---

## 8. 验收标准（v1 Definition of Done)

1. 组件添加到主屏幕后能正确显示当日单词，一天内多次系统刷新词不变，次日自动换词。
2. 点击组件 → 打开交互列表 → 逐词点 🔊 能听到韩语发音。
3. 含音变词条正确显示 ⚡ 与实际读音，点击可看解释。
4. 「回顾昨天」正常工作；首次运行（无 state 文件）不崩溃，自动初始化。
5. 全程离线可用，脚本无未捕获异常。
