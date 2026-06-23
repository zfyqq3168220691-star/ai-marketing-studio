/** 商品分析提示词（生成商品知识卡 ProductKnowledge） */
export function buildAnalyzePrompt(productName: string, customSellingPoints?: string) {
  const system = `你是资深电商营销分析师。根据商品名称分析其营销要点，输出严格的 JSON 对象，不要包含任何额外说明文字。

JSON 字段要求：
{
  "name": "规范化后的商品名称（字符串）",
  "category": "商品类别（字符串，例如：数码配件、运动户外、家居生活、个护美妆等）",
  "sellingPoints": ["核心卖点，3-5条（字符串数组）"],
  "targetUsers": ["目标用户群体，3-5条（字符串数组）"],
  "scenes": ["典型使用场景，3-5条（字符串数组）"],
  "advantages": ["产品优势，3-5条（字符串数组）"]
}

要求：内容贴合中国电商市场，语言精炼，可直接用于营销素材生成。必须返回有效 JSON，不得为空。`;

  let user = `商品名称：${productName}`;
  if (customSellingPoints?.trim()) {
    user += `\n\n用户特别强调的卖点方向（必须融入分析结果中）：${customSellingPoints.trim()}`;
  }

  return { system, user };
}

/** 视频方案提示词（基于商品知识卡生成完整视频策划方案） */
export function buildVideoPrompt(knowledge: {
  name: string;
  category: string;
  sellingPoints: string[];
  targetUsers: string[];
  scenes: string[];
  advantages: string[];
}) {
  const info = JSON.stringify(knowledge, null, 2);

  const system = `你是资深短视频策划导演。基于商品知识卡，输出一套完整的抖音短视频方案，输出严格的 JSON 对象。

JSON 字段要求：
{
  "title": "视频标题（15字以内，吸引点击）",
  "script": "完整视频脚本（150-300字，含口播文案和画面描述）",
  "storyboard": [
    {
      "shot": 1,
      "scene": "镜头画面描述（30字以内）",
      "subtitle": "该镜头字幕文本",
      "durationSec": 3,
      "imagePrompt": "给 AI 生图模型的英文提示词，描述该镜头的画面构图、人物动作、光线、风格，30-50词，用于生成该镜头的配图",
      "camera": "镜头类型（close-up / medium shot / wide shot / product close-up 之一）"
    }
  ],
  "voiceover": "配音稿全文（与脚本口播部分一致，口语化）",
  "subtitle": "全文字幕内容（按镜头顺序，每个镜头一行）"
}

要求：
- 分镜 4-6 个镜头，贴合抖音竖屏短视频风格，节奏快、有吸引力
- 每个 imagePrompt 须为英文，描述清晰的视觉构图（主体、动作、光线、背景、风格）
- camera 字段描述镜头距离和角度
- 纯产品展示类镜头用 product close-up，叙事类用 close-up / medium shot / wide shot
- imagePrompt 中涉及人体动作时，必须明确写出哪只手做什么、另一只手的位置，例如"right hand holding bottle, left hand resting at side"，避免模糊的"hand"一词——这是防止 AI 多画肢体的关键
- imagePrompt 中涉及瓶子、罐子、容器类产品时，必须根据产品类型判断使用方式：食品/饮料类需要打开盖子（open bottle, cap removed），花露水/香水/喷雾类直接按压喷头即可使用（pressing the spray nozzle），不得一概而论
- imagePrompt 须考虑场景氛围感：光线方向、时间感（清晨/午后/黄昏）、环境细节，让画面有叙事感而非纯摆拍
- 必须返回有效 JSON。`;

  const user = `商品知识卡：\n${info}`;

  return { system, user };
}

/** 海报方案提示词（基于商品知识卡生成海报文案） */
export function buildPosterPrompt(
  knowledge: {
    name: string;
    category: string;
    sellingPoints: string[];
    targetUsers: string[];
    scenes: string[];
    advantages: string[];
  },
  feedback?: string
) {
  const info = JSON.stringify(knowledge, null, 2);

  const system = `你是资深电商创意总监。基于商品知识卡，输出海报的文案、色彩方向与氛围创意，输出严格的 JSON 对象。

JSON 字段要求：
{
  "headline": "海报主标题（6-10字，有冲击力、朗朗上口）",
  "colorTone": "色彩基调（从商品类别和名称推断。冷色调用 cool_xxx，暖色调用 warm_xxx，中性用 neutral_xxx）",
  "colorDescription": "色彩视觉描述（一句话描述海报的整体色域）",
  "atmosphere": "氛围元素（一句话描述适合该商品的装饰元素，必须与产品直接相关）",
  "features": [
    {"title": "卖点小标题（2-4字）", "detail": "卖点详细介绍（4-8字）"},
    {"title": "第二个卖点小标题", "detail": "第二个卖点详细介绍"},
    {"title": "第三个卖点小标题", "detail": "第三个卖点详细介绍"}
  ]
}

要求：
- headline 要有品牌感、高级感，不低俗、不夸张
- colorTone / colorDescription / atmosphere 必须贴合商品特性
- features 数组长度为 3
- 必须返回有效 JSON。`;

  let user = `商品知识卡：\n${info}`;
  if (feedback?.trim()) {
    user += `\n\n用户对上版海报的反馈（请根据反馈调整本次设计）：${feedback.trim()}`;
  }

  return { system, user };
}

/** 通义万相图生视频提示词（基于商品知识卡生成产品展示视频的 prompt） */
export function buildVideoGenerationPrompt(knowledge: {
  name: string;
  category: string;
  sellingPoints: string[];
  advantages: string[];
}) {
  const productName = knowledge.name;
  const category = knowledge.category;
  const topPoints = knowledge.sellingPoints.slice(0, 2).join("、");

  return `Product showcase video for ${productName}, premium e-commerce commercial style.

PRODUCT: ${productName} (${category})
KEY FEATURES: ${topPoints}

=== CRITICAL STABILITY REQUIREMENTS ===
- The product MUST remain EXACTLY as shown in the reference image — no shape changes, no color shifts, no texture distortion, no edge flickering
- The product should feel solid and physically present, like a real object on a table
- NO morphing, NO breathing effect, NO warping of the product shape — this is the single most important requirement
- The product edges must remain sharp and stable throughout the entire 10-second video

=== CAMERA MOTION ===
- Very slow, subtle camera movement — a gentle orbit around the product (less than 30 degrees total over 10 seconds)
- Smooth and steady like a motorized turntable shot in a professional studio
- NO fast movements, NO sudden zooms, NO dramatic angle changes

=== LIGHTING ===
- Professional three-point studio lighting:
  1. Main key light: soft diffused light from upper-left (warm, 45 degrees)
  2. Fill light: subtle cool fill from lower-right to soften shadows
  3. Rim light: a thin bright edge light along the product contour — essential for premium look
- The product should look dimensional and tactile, not flat
- Gentle highlights on glossy surfaces to show material quality

=== BACKGROUND ===
- Clean minimalist studio backdrop, seamless paper style, smooth gradient from center-bright to edge-dim
- Background should NOT flicker, shimmer, or have any visible artifacts
- NO text, NO logos, NO patterns on the background

=== VISUAL QUALITY ===
- Photorealistic — should look like it was shot with a DSLR on a tripod
- Product must remain in sharp focus for the entire duration — NO focus hunting
- Soft subtle background blur (shallow depth of field)
- 24fps cinematic look with natural motion blur
- Colors must match the reference image — NO color shifting

=== TIMING (10 SECONDS) ===
- First 3 seconds: establish the product, slow reveal
- Middle 4 seconds: gentle orbit rotation, product in full view
- Final 3 seconds: settle into a final composition, like a held closing shot
- One continuous elegant take — NO cuts, NO transitions

The final video should feel like a premium product commercial, stable, polished, professional. The viewer should forget it is AI-generated and think it is a real studio product shoot.`;
}

/** 营销文案提示词（基于商品知识卡生成多平台文案） */
export function buildContentPrompt(knowledge: {
  name: string;
  category: string;
  sellingPoints: string[];
  targetUsers: string[];
  scenes: string[];
  advantages: string[];
}) {
  const info = JSON.stringify(knowledge, null, 2);

  const system = `你是资深电商文案策划。基于商品知识卡，输出适合多平台的营销文案，输出严格的 JSON 对象。

JSON 字段要求：
{
  "douyinCopy": "抖音文案（50-100字，短平快、有标题、带表情、有号召性用语）",
  "xiaohongshuCopy": "小红书文案（100-200字，种草风格、带 emoji、分段清晰、有话题标签）",
  "productDescription": "商品详情文案（100-200字，含卖点列表、适合电商详情页）"
}

要求：内容贴合中国电商市场，语言有感染力，必须返回有效 JSON。`;

  const user = `商品知识卡：\n${info}`;

  return { system, user };
}
