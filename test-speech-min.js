// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: volume-up;

// =============================================================================
// test-speech-min.js — 最小发音测试（排除一切 UI 干扰）
// =============================================================================
// 目的：朗读后不弹任何 Alert、不开任何 UITable，只用计时器把脚本存活 5 秒，
//      让 Speech 有充分时间发声。用来判断：
//        · 这样能听到  → 之前没声是被弹窗/表格打断，问题可修（改发音触发时机）
//        · 这样还没声  → Scriptable 在你的 iOS 26 上原生 TTS 就发不出声，需换方案
//
// 用法：新建脚本 test-speech-min，粘贴运行。运行时屏幕不会有任何提示，
//      安静听 5 秒即可（脚本会在 5 秒后自动结束）。
// =============================================================================

Speech.speak("안녕하세요. 소리 테스트입니다. 하나 둘 셋.");

// 保持脚本存活 5 秒，其间不弹任何 UI，避免打断音频会话
await new Promise((resolve) => Timer.schedule(5000, false, () => resolve()));

Script.complete();
