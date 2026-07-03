// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: microphone;

// =============================================================================
// Stage 0 — 环境探针 (Environment Probe)
// =============================================================================
// 目的：在写任何业务代码之前，验证 Scriptable 环境对本项目关键 API 的实际行为。
// 结论会直接决定「慢速朗读 🐢」的实现方式，以及存储/入口分发的写法。
//
// 用法：把本文件拷进 Scriptable，在 App 内点击运行（不要放进小组件运行）。
//      逐条阅读弹出的 Alert，并留意有没有报错。把观察结果记录到本文件末尾的
//      「探测结论」注释里，供后续 Stage 1+ 参考。
//
// 本脚本只读不写业务数据，除了在 hanuri/ 下写一个临时探针文件（用完即删）。
// =============================================================================

// ---------------------------------------------------------------------------
// 小工具：顺序弹出结论，方便在手机上逐条确认
// ---------------------------------------------------------------------------
async function note(title, message) {
  const a = new Alert();
  a.title = title;
  a.message = message;
  a.addAction("下一步");
  await a.present();
}

// 记录所有发现，最后一次性汇总
const findings = [];
function record(line) {
  findings.push(line);
  console.log(line);
}

// ---------------------------------------------------------------------------
// 探测 1：入口分发 config.runsInWidget / widgetFamily
// ---------------------------------------------------------------------------
function probeConfig() {
  record(`config.runsInWidget = ${config.runsInWidget}`);
  record(`config.widgetFamily = ${config.widgetFamily}`); // App 内运行时通常为 null
  record(`Device.isUsingDarkAppearance() = ${Device.isUsingDarkAppearance()}`);
}

// ---------------------------------------------------------------------------
// 探测 2：Speech API 对韩文的实际行为与可用参数
// ---------------------------------------------------------------------------
// 关键问题：
//   (a) Speech.speak(韩文) 能否直接朗读，还是需要系统装好韩语 Siri 语音？
//   (b) Speech 是否暴露 rate / language / voice 等参数？（Scriptable 文档很薄）
//   (c) 如果没有 rate 参数，慢速朗读该用什么降级方案？
async function probeSpeech() {
  // Scriptable 官方文档只列了静态方法 Speech.speak(text)。这里用运行时反射，
  // 把 Speech 上实际可用的属性/方法列出来，判断有没有隐藏的语速/语言能力。
  const keys = [];
  for (const k of Object.getOwnPropertyNames(Speech)) keys.push(k);
  record(`Speech 静态成员: ${keys.join(", ")}`);

  // (a) 直接朗读韩文，听是否发出韩语读音（而非按拉丁字母硬念）。
  Speech.speak("안녕하세요");

  // (b) 试探带参数的调用形式是否被接受（不同版本可能支持对象参数）。
  //     用 try/catch 包起来：如果抛错，说明只支持单参数字符串。
  let paramSupported = false;
  try {
    // 猜测式探测：部分环境允许第二参数或对象；若不支持会抛异常或被忽略。
    Speech.speak("천천히", 0.3); // 第二参数若是 rate，会明显变慢
    paramSupported = true;
  } catch (e) {
    record(`Speech.speak 第二参数抛错: ${e}`);
  }
  record(`Speech.speak 是否接受第二参数(未抛错): ${paramSupported}`);

  // (c) 慢速降级候选方案：逐字/逐音节分段朗读，靠停顿制造「慢」的感觉。
  //     这里只演示分段调用是否可用（能否连续排队多次 speak）。
  const syllables = ["학", "교"];
  for (const s of syllables) Speech.speak(s);
  record("已排队逐音节朗读 학·교（用于评估慢速降级方案是否可行）");
}

// ---------------------------------------------------------------------------
// 探测 3：FileManager 读写（iCloud 优先，回退 local）
// ---------------------------------------------------------------------------
async function probeStorage() {
  // 优先 iCloud，失败则回退本地，并记录实际选用的是哪个。
  let fm, backend;
  try {
    fm = FileManager.iCloud();
    backend = "iCloud";
  } catch (e) {
    fm = FileManager.local();
    backend = "local(iCloud 不可用)";
  }
  record(`FileManager 后端: ${backend}`);

  const dir = fm.joinPath(fm.documentsDirectory(), "hanuri");
  if (!fm.fileExists(dir)) fm.createDirectory(dir, true);

  const probePath = fm.joinPath(dir, "_stage0_probe.json");
  const payload = JSON.stringify({ ok: true, ts: new Date().toISOString() });

  // 写
  fm.writeString(probePath, payload);
  record(`写入成功: ${probePath}`);

  // 读（iCloud 上的文件读之前需要先下载，注意这是 async）
  try {
    if (fm.isFileStoredIniCloud && fm.isFileStoredIniCloud(probePath)) {
      await fm.downloadFileFromiCloud(probePath);
      record("已 downloadFileFromiCloud（iCloud 文件读前必做，async）");
    }
  } catch (e) {
    record(`downloadFileFromiCloud 提示: ${e}`);
  }
  const readBack = fm.readString(probePath);
  record(`读回内容: ${readBack}`);

  // 清理临时探针文件
  fm.remove(probePath);
  record("已删除临时探针文件");
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
async function main() {
  probeConfig();
  await probeSpeech();
  await probeStorage();

  await note(
    "Stage 0 探测完成",
    findings.join("\n\n") +
      "\n\n请把上面的观察（尤其是 Speech 是否支持语速参数）记录到脚本末尾的「探测结论」注释里。"
  );
  Script.complete();
}

await main();

// =============================================================================
// 探测结论（在真机运行后手动填写，供 Stage 1+ 参考）
// =============================================================================
// - Speech 是否直接朗读韩文（无需额外设置）：___
// - Speech.speak 是否支持 rate / 语速参数：___
// - 若不支持，慢速 🐢 方案定为：逐音节分段朗读 / 直接砍掉（二选一）：___
// - FileManager 后端实际选用：iCloud / local：___
// - downloadFileFromiCloud 在读 iCloud 文件时是否必要：___
// =============================================================================
