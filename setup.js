// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: box-open;

// =============================================================================
// setup.js — 一次性安装脚本（把词库写进 Scriptable）
// =============================================================================
// 为什么需要它：vocab.json 是数据文件，要放在 Scriptable 的 Documents/hanuri/ 目录下，
// 但 Scriptable App 里没有「新建文件夹」的按钮。运行本脚本会自动：
//   ① 创建 hanuri/ 目录；② 写入 vocab.json。
//
// 用法：在 Scriptable 里新建一个脚本命名 setup，把本文件内容整段粘贴进去，运行一次即可。
//      运行成功后本脚本就没用了，可以删掉。词库内容内嵌在下方 VOCAB 常量里，
//      与仓库根目录的 vocab.json 完全一致（由 vocab.json 自动生成）。
// =============================================================================

const VOCAB = {
  "meta": {
    "name": "TOPIK I 高频核心词库",
    "version": 1,
    "count": 50
  },
  "words": [
    { "id": "w0001", "hangul": "학교", "romanization": "hakgyo", "pronounced": "[학꾜]", "soundChange": "tensification", "pos": "名词", "meaning": "学校", "example": "학교에 가요.", "exampleMeaning": "去学校。", "level": "TOPIK1" },
    { "id": "w0002", "hangul": "학생", "romanization": "haksaeng", "pronounced": "[학쌩]", "soundChange": "tensification", "pos": "名词", "meaning": "学生", "example": "저는 학생이에요.", "exampleMeaning": "我是学生。", "level": "TOPIK1" },
    { "id": "w0003", "hangul": "선생님", "romanization": "seonsaengnim", "soundChange": null, "pos": "名词", "meaning": "老师", "example": "선생님, 안녕하세요.", "exampleMeaning": "老师，您好。", "level": "TOPIK1" },
    { "id": "w0004", "hangul": "친구", "romanization": "chingu", "soundChange": null, "pos": "名词", "meaning": "朋友", "example": "친구를 만나요.", "exampleMeaning": "见朋友。", "level": "TOPIK1" },
    { "id": "w0005", "hangul": "사람", "romanization": "saram", "soundChange": null, "pos": "名词", "meaning": "人", "example": "좋은 사람이에요.", "exampleMeaning": "是好人。", "level": "TOPIK1" },
    { "id": "w0006", "hangul": "가족", "romanization": "gajok", "soundChange": null, "pos": "名词", "meaning": "家人，家庭", "example": "가족이 많아요.", "exampleMeaning": "家里人多。", "level": "TOPIK1" },
    { "id": "w0007", "hangul": "집", "romanization": "jip", "soundChange": null, "pos": "名词", "meaning": "家，房子", "example": "집에 가요.", "exampleMeaning": "回家。", "level": "TOPIK1" },
    { "id": "w0008", "hangul": "학년", "romanization": "hangnyeon", "pronounced": "[항년]", "soundChange": "nasalization", "pos": "名词", "meaning": "年级", "example": "몇 학년이에요?", "exampleMeaning": "几年级？", "level": "TOPIK1" },
    { "id": "w0009", "hangul": "국물", "romanization": "gungmul", "pronounced": "[궁물]", "soundChange": "nasalization", "pos": "名词", "meaning": "汤，汤汁", "example": "국물이 뜨거워요.", "exampleMeaning": "汤很烫。", "level": "TOPIK1" },
    { "id": "w0010", "hangul": "식당", "romanization": "sikdang", "pronounced": "[식땅]", "soundChange": "tensification", "pos": "名词", "meaning": "餐厅，食堂", "example": "식당에서 먹어요.", "exampleMeaning": "在餐厅吃。", "level": "TOPIK1" },
    { "id": "w0011", "hangul": "책상", "romanization": "chaeksang", "pronounced": "[책쌍]", "soundChange": "tensification", "pos": "名词", "meaning": "书桌", "example": "책상 위에 있어요.", "exampleMeaning": "在书桌上。", "level": "TOPIK1" },
    { "id": "w0012", "hangul": "음악", "romanization": "eumak", "pronounced": "[으막]", "soundChange": "liaison", "pos": "名词", "meaning": "音乐", "example": "음악을 들어요.", "exampleMeaning": "听音乐。", "level": "TOPIK1" },
    { "id": "w0013", "hangul": "한국어", "romanization": "hangugeo", "pronounced": "[한구거]", "soundChange": "liaison", "pos": "名词", "meaning": "韩语", "example": "한국어를 배워요.", "exampleMeaning": "学韩语。", "level": "TOPIK1" },
    { "id": "w0014", "hangul": "직업", "romanization": "jigeop", "pronounced": "[지겁]", "soundChange": "liaison", "pos": "名词", "meaning": "职业", "example": "직업이 뭐예요?", "exampleMeaning": "职业是什么？", "level": "TOPIK1" },
    { "id": "w0015", "hangul": "백화점", "romanization": "baekhwajeom", "pronounced": "[배콰점]", "soundChange": "aspiration", "pos": "名词", "meaning": "百货商店", "example": "백화점에서 사요.", "exampleMeaning": "在百货商店买。", "level": "TOPIK1" },
    { "id": "w0016", "hangul": "축구", "romanization": "chukgu", "pronounced": "[축꾸]", "soundChange": "tensification", "pos": "名词", "meaning": "足球", "example": "축구를 좋아해요.", "exampleMeaning": "喜欢足球。", "level": "TOPIK1" },
    { "id": "w0017", "hangul": "작년", "romanization": "jangnyeon", "pronounced": "[장년]", "soundChange": "nasalization", "pos": "名词", "meaning": "去年", "example": "작년에 왔어요.", "exampleMeaning": "去年来的。", "level": "TOPIK1" },
    { "id": "w0018", "hangul": "물", "romanization": "mul", "soundChange": null, "pos": "名词", "meaning": "水", "example": "물을 마셔요.", "exampleMeaning": "喝水。", "level": "TOPIK1" },
    { "id": "w0019", "hangul": "밥", "romanization": "bap", "soundChange": null, "pos": "名词", "meaning": "饭", "example": "밥을 먹어요.", "exampleMeaning": "吃饭。", "level": "TOPIK1" },
    { "id": "w0020", "hangul": "커피", "romanization": "keopi", "soundChange": null, "pos": "名词", "meaning": "咖啡", "example": "커피를 마셔요.", "exampleMeaning": "喝咖啡。", "level": "TOPIK1" },
    { "id": "w0021", "hangul": "시간", "romanization": "sigan", "soundChange": null, "pos": "名词", "meaning": "时间", "example": "시간이 없어요.", "exampleMeaning": "没有时间。", "level": "TOPIK1" },
    { "id": "w0022", "hangul": "돈", "romanization": "don", "soundChange": null, "pos": "名词", "meaning": "钱", "example": "돈이 없어요.", "exampleMeaning": "没有钱。", "level": "TOPIK1" },
    { "id": "w0023", "hangul": "나라", "romanization": "nara", "soundChange": null, "pos": "名词", "meaning": "国家", "example": "어느 나라 사람이에요?", "exampleMeaning": "是哪国人？", "level": "TOPIK1" },
    { "id": "w0024", "hangul": "이름", "romanization": "ireum", "soundChange": null, "pos": "名词", "meaning": "名字", "example": "이름이 뭐예요?", "exampleMeaning": "叫什么名字？", "level": "TOPIK1" },
    { "id": "w0025", "hangul": "시장", "romanization": "sijang", "soundChange": null, "pos": "名词", "meaning": "市场", "example": "시장에 가요.", "exampleMeaning": "去市场。", "level": "TOPIK1" },
    { "id": "w0026", "hangul": "병원", "romanization": "byeongwon", "soundChange": null, "pos": "名词", "meaning": "医院", "example": "병원에 가요.", "exampleMeaning": "去医院。", "level": "TOPIK1" },
    { "id": "w0027", "hangul": "회사", "romanization": "hoesa", "soundChange": null, "pos": "名词", "meaning": "公司", "example": "회사에 다녀요.", "exampleMeaning": "在公司上班。", "level": "TOPIK1" },
    { "id": "w0028", "hangul": "영화", "romanization": "yeonghwa", "soundChange": null, "pos": "名词", "meaning": "电影", "example": "영화를 봐요.", "exampleMeaning": "看电影。", "level": "TOPIK1" },
    { "id": "w0029", "hangul": "날씨", "romanization": "nalssi", "soundChange": null, "pos": "名词", "meaning": "天气", "example": "날씨가 좋아요.", "exampleMeaning": "天气好。", "level": "TOPIK1" },
    { "id": "w0030", "hangul": "꽃", "romanization": "kkot", "soundChange": null, "pos": "名词", "meaning": "花", "example": "꽃이 예뻐요.", "exampleMeaning": "花很漂亮。", "level": "TOPIK1" },
    { "id": "w0031", "hangul": "오늘", "romanization": "oneul", "soundChange": null, "pos": "名词", "meaning": "今天", "example": "오늘 뭐 해요?", "exampleMeaning": "今天做什么？", "level": "TOPIK1" },
    { "id": "w0032", "hangul": "내일", "romanization": "naeil", "soundChange": null, "pos": "名词", "meaning": "明天", "example": "내일 만나요.", "exampleMeaning": "明天见。", "level": "TOPIK1" },
    { "id": "w0033", "hangul": "지금", "romanization": "jigeum", "soundChange": null, "pos": "副词", "meaning": "现在", "example": "지금 가요.", "exampleMeaning": "现在去。", "level": "TOPIK1" },
    { "id": "w0034", "hangul": "여기", "romanization": "yeogi", "soundChange": null, "pos": "代词", "meaning": "这里", "example": "여기 있어요.", "exampleMeaning": "在这里。", "level": "TOPIK1" },
    { "id": "w0035", "hangul": "가다", "romanization": "gada", "soundChange": null, "pos": "动词", "meaning": "去", "example": "학교에 가다.", "exampleMeaning": "去学校。", "level": "TOPIK1" },
    { "id": "w0036", "hangul": "오다", "romanization": "oda", "soundChange": null, "pos": "动词", "meaning": "来", "example": "집에 오다.", "exampleMeaning": "回家。", "level": "TOPIK1" },
    { "id": "w0037", "hangul": "보다", "romanization": "boda", "soundChange": null, "pos": "动词", "meaning": "看", "example": "영화를 보다.", "exampleMeaning": "看电影。", "level": "TOPIK1" },
    { "id": "w0038", "hangul": "사다", "romanization": "sada", "soundChange": null, "pos": "动词", "meaning": "买", "example": "옷을 사다.", "exampleMeaning": "买衣服。", "level": "TOPIK1" },
    { "id": "w0039", "hangul": "마시다", "romanization": "masida", "soundChange": null, "pos": "动词", "meaning": "喝", "example": "물을 마시다.", "exampleMeaning": "喝水。", "level": "TOPIK1" },
    { "id": "w0040", "hangul": "자다", "romanization": "jada", "soundChange": null, "pos": "动词", "meaning": "睡觉", "example": "집에서 자다.", "exampleMeaning": "在家睡觉。", "level": "TOPIK1" },
    { "id": "w0041", "hangul": "먹다", "romanization": "meokda", "pronounced": "[먹따]", "soundChange": "tensification", "pos": "动词", "meaning": "吃", "example": "밥을 먹다.", "exampleMeaning": "吃饭。", "level": "TOPIK1" },
    { "id": "w0042", "hangul": "읽다", "romanization": "ikda", "pronounced": "[익따]", "soundChange": "tensification", "pos": "动词", "meaning": "读，念", "example": "책을 읽다.", "exampleMeaning": "读书。", "level": "TOPIK1" },
    { "id": "w0043", "hangul": "좋다", "romanization": "jota", "pronounced": "[조타]", "soundChange": "aspiration", "pos": "形容词", "meaning": "好", "example": "기분이 좋다.", "exampleMeaning": "心情好。", "level": "TOPIK1" },
    { "id": "w0044", "hangul": "많다", "romanization": "manta", "pronounced": "[만타]", "soundChange": "aspiration", "pos": "形容词", "meaning": "多", "example": "사람이 많다.", "exampleMeaning": "人很多。", "level": "TOPIK1" },
    { "id": "w0045", "hangul": "작다", "romanization": "jakda", "pronounced": "[작따]", "soundChange": "tensification", "pos": "形容词", "meaning": "小", "example": "방이 작다.", "exampleMeaning": "房间小。", "level": "TOPIK1" },
    { "id": "w0046", "hangul": "예쁘다", "romanization": "yeppeuda", "soundChange": null, "pos": "形容词", "meaning": "漂亮", "example": "꽃이 예쁘다.", "exampleMeaning": "花很漂亮。", "level": "TOPIK1" },
    { "id": "w0047", "hangul": "크다", "romanization": "keuda", "soundChange": null, "pos": "形容词", "meaning": "大", "example": "집이 크다.", "exampleMeaning": "房子大。", "level": "TOPIK1" },
    { "id": "w0048", "hangul": "축하", "romanization": "chukha", "pronounced": "[추카]", "soundChange": "aspiration", "pos": "名词", "meaning": "祝贺", "example": "축하해요.", "exampleMeaning": "恭喜。", "level": "TOPIK1" },
    { "id": "w0049", "hangul": "입학", "romanization": "iphak", "pronounced": "[이팍]", "soundChange": "aspiration", "pos": "名词", "meaning": "入学", "example": "입학을 축하해요.", "exampleMeaning": "祝贺入学。", "level": "TOPIK1" },
    { "id": "w0050", "hangul": "감사합니다", "romanization": "gamsahamnida", "pronounced": "[감사함니다]", "soundChange": "nasalization", "pos": "惯用语", "meaning": "谢谢", "example": "감사합니다.", "exampleMeaning": "谢谢。", "level": "TOPIK1" }
  ]
};

const fm = (() => {
  try { return FileManager.iCloud(); } catch (e) { return FileManager.local(); }
})();

const dir = fm.joinPath(fm.documentsDirectory(), "hanuri");
if (!fm.fileExists(dir)) fm.createDirectory(dir, true);

const path = fm.joinPath(dir, "vocab.json");
fm.writeString(path, JSON.stringify(VOCAB, null, 2));

const a = new Alert();
a.title = "安装完成 ✅";
a.message = `已写入 ${VOCAB.words.length} 个词到：\n${path}\n\n现在可以运行 test-scheduler 验证，或添加小组件。`;
a.addAction("完成");
await a.present();
Script.complete();
