// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: volume-up;

// =============================================================================
// test-speech.js — 发音诊断脚本
// =============================================================================
// 用途：定位「听不到声音」的原因。区分两种情况：
//   ① 设备/系统层面根本发不出声（静音拨杆、音量、蓝牙）
//   ② 顶层能发声，但在 UITable 表格内点击时发不出声（Scriptable 的表格上下文问题）
//
// 用法：新建脚本命名 test-speech，粘贴本文件，运行，按提示操作。
// =============================================================================

// —— 测试 1：顶层直接朗读（不在任何表格里）——
Speech.speak("소리 테스트 하나 둘 셋");

const a1 = new Alert();
a1.title = "测试 1 / 顶层朗读";
a1.message =
  "弹出这个框的同时，应该正在朗读韩语「소리 테스트 하나 둘 셋」。\n\n" +
  "听到了吗？\n\n" +
  "（若没听到，请先确认：①侧边静音拨杆没露出橙色 ②边听边按音量+键调大 ③没连蓝牙耳机）";
a1.addAction("✅ 听到了");
a1.addAction("❌ 没听到");
const r1 = await a1.present();

if (r1 === 1) {
  // 顶层就没声 → 设备/系统层面问题，和脚本无关
  const a = new Alert();
  a.title = "结论：设备层面没声";
  a.message =
    "连最基础的顶层朗读都没声，说明不是脚本的问题，是系统 TTS 没发声。\n\n" +
    "请依次排查：\n" +
    "1. 侧边静音拨杆拨回（别露橙色）\n" +
    "2. 朗读时按音量 + 键把媒体音量调大\n" +
    "3. 断开蓝牙设备\n" +
    "4. 设置 → 辅助功能 → 朗读内容，确认已下载韩语语音\n\n" +
    "改好后重跑本脚本。";
  a.addAction("好");
  await a.present();
  Script.complete();
  return;
}

// —— 测试 2：在 UITable 表格内点击朗读 ——
const table = new UITable();
table.showSeparators = true;

const header = new UITableRow();
header.isHeader = true;
header.addCell(UITableCell.text("测试 2 / 表格内朗读", "点下面的按钮，看在表格里能否发声"));
table.addRow(header);

const row = new UITableRow();
row.dismissOnSelect = false;
row.height = 60;
const btn = UITableCell.button("🔊 点我朗读（안녕하세요）");
btn.onTap = () => Speech.speak("안녕하세요");
row.addCell(btn);
table.addRow(row);

const row2 = new UITableRow();
row2.dismissOnSelect = false;
row2.height = 60;
const btn2 = UITableCell.button("🐢 点我逐音节（학·꾜）");
btn2.onTap = () => {
  Speech.speak("학");
  Speech.speak("꾜");
};
row2.addCell(btn2);
table.addRow(row2);

await table.present(true);

// 关表后问结果
const a2 = new Alert();
a2.title = "测试 2 结果";
a2.message =
  "刚才在表格里点按钮，听到声音了吗？\n\n" +
  "· 顶层有声、表格里没声 → 是 Scriptable 表格上下文的问题，我来改发音方式\n" +
  "· 两处都有声 → 一切正常，可能刚才是音量/静音，问题已解决";
a2.addAction("表格里也有声 ✅");
a2.addAction("表格里没声 ❌");
const r2 = await a2.present();

console.log(r2 === 0 ? "OK: 表格内可发声" : "ISSUE: 表格内无声，需改发音实现");
Script.complete();
