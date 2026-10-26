// 文はぜんぶ ひらがな＋わかちがき。たとえ話・皮肉は つかわない（docs/spec.md「守ること」）。

export const DOGS = [
  { id: 'molly', name: 'モリー', kind: 'シュナウザー' },
  { id: 'shiba', name: 'こむぎ', kind: 'しばいぬ' },
  { id: 'poodle', name: 'ミルク', kind: 'トイプードル' },
  { id: 'dachs', name: 'ココア', kind: 'ダックスフンド' },
];

// see = からだの どこを みれば わかるか / tip = その きもちの ときに できること
export const EMOTIONS = [
  { id: 'happy', word: 'うれしい', color: '#f4b942',
    see: 'しっぽを ふって いるよ。くちが にこっと あいて いるよ。',
    tip: 'うれしい ときは 「うれしい！」と いって いいよ。' },
  { id: 'scared', word: 'こわい', color: '#8a9bd6',
    see: 'みみが うしろに ぺたんと して いるよ。しっぽを あしの あいだに いれて、からだを ちいさく して いるよ。',
    tip: 'こわい ときは、おとなに 「こわい」と いって いいよ。てを つないで もらおう。' },
  { id: 'iya', word: 'いや', color: '#e07a5f',
    see: 'かおを よこに むけて いるよ。まえあしを まえに だして いるよ。',
    tip: 'いやな ときは 「いやです」「やめて ください」と いって いいよ。' },
  { id: 'sad', word: 'かなしい', color: '#6fa8c9',
    see: 'あたまと みみが したに さがって いるよ。めも したを みて いるよ。',
    tip: 'かなしい ときは、すきな ものを ぎゅっと したり、おとなに はなしたり しよう。' },
  { id: 'surprised', word: 'びっくり', color: '#b57edc',
    see: 'めが まんまる だよ。みみが ぴんと たって いるよ。',
    tip: 'びっくり した ときは、ゆっくり いきを すって、はいて みよう。' },
  { id: 'calm', word: 'おちついて いる', color: '#7cb87c',
    see: 'ねころんで、めを ほそく して いるよ。からだの ちからが ぬけて いるよ。',
    tip: 'おちついて いる ときは、からだの ちからが ぬけて いるよ。いまの きもちを おぼえて おこう。' },
];

// 1ばめん 6だん。art/scenes/<id>_<1-6>.png。
// 「いたくない」など ほんとうで ない ことは かかない。
export const SCENES = [
  { id: 'hospital', title: 'びょういん', sub: 'しんさつを うける', steps: [
    { text: 'うけつけで、おうちの ひとが しんさつけん などを わたすよ。', tip: 'となりに いて いいよ。' },
    { text: 'まちあいしつで、なまえを よばれるまで まつよ。', tip: 'すきな ものを もって いくと、まつのが らくに なるよ。' },
    { text: 'なまえを よばれたら、へんじを して たつよ。', tip: 'こえが でない ときは、てを あげても いいよ。' },
    { text: 'しんさつしつに はいるよ。せんせいが いるよ。', tip: 'あいさつは、「こんにちは」でも、おじぎ だけ でも いいよ。' },
    { text: 'せんせいが、ちょうしんきで むねの おとを きくよ。', tip: 'ちょうしんきは すこし つめたく かんじる ことが あるよ。せんせいが 「おわり」と いうまで じっと して いよう。' },
    { text: 'おわったら、「ありがとう ございました」と いって かえるよ。', tip: 'がんばったね。' },
  ]},
  { id: 'shot', title: 'ちゅうしゃ・さいけつ', sub: 'ちゅうしゃや さいけつを する', steps: [
    { text: 'いすに すわって、うでを まえに だすよ。', tip: 'みたく ない ときは、ほかの ほうを みて いいよ。' },
    { text: 'さいけつの ときは、うでに ゴムを まくよ。うでが しめつけられるよ。', tip: 'ちゅうしゃの ときは、ゴムを まかない ことも あるよ。' },
    { text: 'しょうどくの わたで、うでを ふくよ。', tip: 'つめたく かんじる ことが あるよ。' },
    { text: 'はりを さすよ。ちくっと するよ。', tip: 'ゆっくり かずを かぞえて まとう。ほかの ほうを みて いても いいよ。' },
    { text: 'はりを ぬいて、ばんそうこうを はるよ。', tip: 'ばんそうこうを いつ はがすかは、おとなに きこう。' },
    { text: 'おわり！ よく がんばったね。', tip: 'どんな きもちか、おしえてね。' },
  ]},
  { id: 'dentist', title: 'はいしゃ', sub: 'はを みて もらう', steps: [
    { text: 'まちあいしつで まつよ。', tip: 'すきな ものを もって いこう。' },
    { text: 'おおきな いすに すわるよ。いすが うしろに たおれるよ。', tip: '「うごく まえに おしえて ください」と たのんで いいよ。' },
    { text: 'うえの ライトが つくよ。まぶしい ときは めを とじて いいよ。', tip: 'サングラスを かして くれる はいしゃも あるよ。' },
    { text: 'くちを 「あー」と あけるよ。せんせいが かがみで はを みるよ。', tip: 'いたい ときの あいずを、さきに せんせいと きめて おこう。てを あげる ことが おおいよ。' },
    { text: 'みずの おとや、「きゅいーん」と いう おとが するよ。', tip: 'おとが にがてな ときは、さきに いって おこう。' },
    { text: 'くちを ゆすぐ ことが あるよ。せんせいが 「おわり」と おしえて くれるよ。', tip: 'がんばったね。' },
  ]},
  { id: 'haircut', title: 'さんぱつ', sub: 'かみを きる', steps: [
    { text: 'いすに すわるよ。かがみが まえに あるよ。', tip: 'いすが すこし たかく なるよ。' },
    { text: 'くびに ケープを つけるよ。', tip: 'くびの まわりが すこし きつく かんじるかも しれないよ。' },
    { text: 'きりふきで、かみを ぬらすよ。', tip: 'みずが つめたく かんじる ことが あるよ。めを とじて いいよ。' },
    { text: 'はさみで かみを きるよ。「チョキチョキ」と おとが するよ。', tip: 'あたまを うごかさないで いようね。' },
    { text: 'バリカンを つかう ことも あるよ。「ブーン」と おとが するよ。くすぐったく かんじる ことが あるよ。', tip: 'にがてな ときは 「バリカンは いやです」と いって いいよ。' },
    { text: 'かがみで みて、おわりだよ。', tip: 'かみを きり おわったよ。がんばったね。' },
  ]},
  { id: 'newplace', title: 'はじめての ばしょ', sub: 'がっこうの ぎょうじ など', steps: [
    { text: 'いく まえに、しゃしんや ちずで ばしょを みて おくよ。', tip: 'なにを するか、さきに きいて おこう。' },
    { text: 'いりぐちに ついたよ。', tip: 'だれと いっしょに はいるか、さきに たしかめて おこう。' },
    { text: 'ひとが たくさん いるよ。こえや おとが たくさん するよ。', tip: 'うるさい ときは、みみを ふさいだり、イヤーマフを つけて いいよ。' },
    { text: 'じぶんの せきや、ならぶ ばしょを さがすよ。', tip: 'わからない ときは 「どこですか？」と きこう。' },
    { text: 'つかれたら、やすむ ばしょに いって いいよ。', tip: 'やすむ ばしょを さきに おしえて もらおう。' },
    { text: 'おわったら、おうちに かえるよ。', tip: 'がんばったね。' },
  ]},
  { id: 'visit', title: 'ほうもん かんごの ひ', sub: 'かんごしさんが おうちに くる', steps: [
    { text: '「ピンポーン」と なって、かんごしさんが くるよ。', tip: 'くる じかんは、カレンダーで みて おこう。' },
    { text: '「こんにちは」と あいさつ するよ。', tip: 'てを ふるだけ でも いいよ。' },
    { text: 'たいおんや けつあつを はかるよ。', tip: 'けつあつを はかる ときは、うでが しめつけられるよ。すこし したら ゆるむよ。' },
    { text: 'おはなしを したり、からだの ようすを みたり するよ。', tip: 'いっしょに あそぶ ひも あるよ。やりたい ことを いって みよう。' },
    { text: '「また ね」と いって、かんごしさんが かえるよ。', tip: 'つぎに くる ひを カレンダーで みよう。' },
  ]},
];

// じぶんの カード。art/items/<id>.png（なければ emoji）
export const CARD_HARD = [
  { id: 'h_noise', word: 'おおきな おと', emoji: '🔊' },
  { id: 'h_light', word: 'まぶしい ひかり', emoji: '💡' },
  { id: 'h_crowd', word: 'ひとが おおい ばしょ', emoji: '👥' },
  { id: 'h_touch', word: 'きゅうに さわられる', emoji: '✋' },
  { id: 'h_smell', word: 'つよい におい', emoji: '👃' },
  { id: 'h_change', word: 'よていが かわる', emoji: '🔄' },
  { id: 'h_wait', word: 'ながく まつ', emoji: '⏳' },
  { id: 'h_new', word: 'はじめての ばしょ', emoji: '🚪' },
];
export const CARD_CALM = [
  { id: 'c_quiet', word: 'しずかな ばしょ', emoji: '🤫' },
  { id: 'c_earmuff', word: 'イヤーマフ', emoji: '🎧' },
  { id: 'c_breath', word: 'しんこきゅう', emoji: '🌬️' },
  { id: 'c_hug', word: 'すきな ものを ぎゅっと', emoji: '🧸' },
  { id: 'c_tellfirst', word: 'さきに おしえて もらう', emoji: '📋' },
  { id: 'c_picture', word: 'えで せつめい して もらう', emoji: '🖼️' },
  { id: 'c_break', word: 'すこし やすむ', emoji: '🪑' },
  { id: 'c_count', word: 'かずを かぞえる', emoji: '🔢' },
];

// きょうの よてい。art/items/<id>.png（なければ emoji）
export const PLAN_ITEMS = [
  { id: 'p_wake', word: 'おきる', emoji: '🌅' },
  { id: 'p_dress', word: 'きがえ', emoji: '👕' },
  { id: 'p_meal', word: 'ごはん', emoji: '🍚' },
  { id: 'p_teeth', word: 'はみがき', emoji: '🪥' },
  { id: 'p_toilet', word: 'トイレ', emoji: '🚽' },
  { id: 'p_school', word: 'がっこう', emoji: '🏫' },
  { id: 'p_play', word: 'あそぶ', emoji: '🧩' },
  { id: 'p_snack', word: 'おやつ', emoji: '🍪' },
  { id: 'p_walk', word: 'さんぽ', emoji: '🚶' },
  { id: 'p_shop', word: 'おかいもの', emoji: '🛒' },
  { id: 'p_study', word: 'しゅくだい', emoji: '✏️' },
  { id: 'p_medicine', word: 'くすり', emoji: '💊' },
  { id: 'p_nurse', word: 'かんごしさん', emoji: '🩺' },
  { id: 'p_hospital', word: 'びょういん', emoji: '🏥' },
  { id: 'p_bath', word: 'おふろ', emoji: '🛁' },
  { id: 'p_sleep', word: 'ねる', emoji: '🌙' },
];

// じぶんノート。art/items/<id>.png（なければ emoji）
export const FOODS = [
  { id: 'f_curry', word: 'カレー', emoji: '🍛' }, { id: 'f_ramen', word: 'ラーメン', emoji: '🍜' },
  { id: 'f_sushi', word: 'おすし', emoji: '🍣' }, { id: 'f_onigiri', word: 'おにぎり', emoji: '🍙' },
  { id: 'f_karaage', word: 'からあげ', emoji: '🍗' }, { id: 'f_hamburg', word: 'ハンバーグ', emoji: '🍖' },
  { id: 'f_spaghetti', word: 'スパゲッティ', emoji: '🍝' }, { id: 'f_udon', word: 'うどん', emoji: '🥢' },
  { id: 'f_strawberry', word: 'いちご', emoji: '🍓' }, { id: 'f_banana', word: 'バナナ', emoji: '🍌' },
  { id: 'f_apple', word: 'りんご', emoji: '🍎' }, { id: 'f_icecream', word: 'アイス', emoji: '🍦' },
  { id: 'f_pudding', word: 'プリン', emoji: '🍮' }, { id: 'f_choco', word: 'チョコ', emoji: '🍫' },
  { id: 'f_pizza', word: 'ピザ', emoji: '🍕' }, { id: 'f_tamago', word: 'めだまやき', emoji: '🍳' },
];
export const PLAYS = [
  { id: 'g_blocks', word: 'つみき', emoji: '🧱' }, { id: 'g_book', word: 'えほん', emoji: '📖' },
  { id: 'g_draw', word: 'おえかき', emoji: '🖍️' }, { id: 'g_ball', word: 'ボール', emoji: '⚽' },
  { id: 'g_train', word: 'でんしゃ', emoji: '🚃' }, { id: 'g_game', word: 'ゲーム', emoji: '🎮' },
  { id: 'g_swing', word: 'ブランコ', emoji: '🎠' }, { id: 'g_slide', word: 'すべりだい', emoji: '🛝' },
  { id: 'g_car', word: 'くるま', emoji: '🚗' }, { id: 'g_puzzle', word: 'パズル', emoji: '🧩' },
  { id: 'g_music', word: 'おんがく', emoji: '🎹' }, { id: 'g_dance', word: 'ダンス', emoji: '💃' },
  { id: 'g_bike', word: 'じてんしゃ', emoji: '🚲' }, { id: 'g_plane', word: 'かみひこうき', emoji: '✈️' },
  { id: 'g_clay', word: 'ねんど', emoji: '🟫' }, { id: 'g_bug', word: 'むしさがし', emoji: '🐞' },
];
export const COLORS = [
  { word: 'あか', hex: '#e05a4f' }, { word: 'ピンク', hex: '#f08cb0' }, { word: 'オレンジ', hex: '#f39a3d' },
  { word: 'きいろ', hex: '#f2c94c' }, { word: 'きみどり', hex: '#9ccc65' }, { word: 'みどり', hex: '#4caf7a' },
  { word: 'みずいろ', hex: '#6ec6e8' }, { word: 'あお', hex: '#4a7fd1' }, { word: 'むらさき', hex: '#9b72cf' },
  { word: 'ちゃいろ', hex: '#a0714f' }, { word: 'しろ', hex: '#f4f4f4' }, { word: 'くろ', hex: '#333333' },
];
export const AVATAR_COUNT = 12; // art/avatars/a<0-11>.png

// ショップ。lv = かえる レベル。price = スター。
export const STICKERS = [
  ['s_star', 'ほし', '⭐', 3, 1], ['s_heart', 'ハート', '💗', 3, 1], ['s_rainbow', 'にじ', '🌈', 5, 2],
  ['s_clover', 'クローバー', '🍀', 5, 2], ['s_sun', 'おひさま', '🌞', 5, 3], ['s_moon', 'おつきさま', '🌙', 5, 3],
  ['s_cupcake', 'カップケーキ', '🧁', 6, 4], ['s_balloon', 'ふうせん', '🎈', 6, 4], ['s_crown', 'おうかん', '👑', 8, 5],
  ['s_paw', 'あしあと', '🐾', 4, 1], ['s_bone', 'ほね', '🦴', 4, 2], ['s_flower', 'おはな', '🌷', 4, 2],
  ['s_butterfly', 'ちょうちょ', '🦋', 7, 5], ['s_rocket', 'ロケット', '🚀', 8, 6], ['s_whale', 'くじら', '🐳', 9, 7],
  ['s_trophy', 'トロフィー', '🏆', 12, 8],
].map(([id, word, emoji, price, lv]) => ({ id, word, emoji, price, lv }));
// ノートの いろ。さいしょの 1つは ただ。
export const THEMES = [
  ['t_cream', 'クリーム', '#fffaf0', '#e9dcc0', 0, 1], ['t_sky', 'そら', '#eef7ff', '#bcd8f2', 4, 1],
  ['t_mint', 'ミント', '#effaf4', '#bfe3cd', 4, 2], ['t_peach', 'もも', '#fff2ef', '#f1c7bb', 4, 3],
  ['t_lemon', 'レモン', '#fffbe6', '#eadb8a', 6, 4], ['t_lavender', 'ラベンダー', '#f5f0ff', '#d4c4f2', 6, 5],
  ['t_star', 'よぞら', '#eef0fb', '#3d4a75', 10, 7], ['t_rainbow', 'にじいろ', '#fffaf0', 'rainbow', 12, 9],
].map(([id, word, bg, edge, price, lv]) => ({ id, word, bg, edge, price, lv }));
// アバターの わく。
export const FRAMES = [
  ['w_none', 'なし', 'none', 0, 1], ['w_round', 'まる', 'round', 5, 2],
  ['w_flower', 'はなまる', 'flower', 8, 4], ['w_gold', 'きんいろ', 'gold', 12, 6],
].map(([id, word, kind, price, lv]) => ({ id, word, kind, price, lv }));

// レベル n に なるのに いる スター（ためた ぜんぶ）。つかっても レベルは さがらない。
export const LEVEL_MAX = 20;
export const levelNeed = (n) => (n <= 1 ? 0 : 5 * (n - 1) * n / 2);
