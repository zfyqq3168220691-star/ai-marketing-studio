import { NextResponse } from "next/server";

import { deepseekChat } from "@/lib/deepseek";
import { qwenImage } from "@/lib/qwen";
import { buildPosterPrompt } from "@/lib/prompts";
import type { ApiResponse, PosterPlan, FeatureItem } from "@/types";

export const runtime = "nodejs";

function json(body: ApiResponse<PosterPlan>, status = 200) {
  return NextResponse.json(body, { status });
}

/** DeepSeek 输出的完整海报概念 */
interface PosterConcept {
  headline: string;
  colorTone: string;
  colorDescription: string;
  atmosphere: string;
  features: FeatureItem[];
}

/**
 * 海报视觉提示词（v3）。
 *
 * 核心理念：
 * - 色调由商品决定，DeepSeek 根据商品名称/类别输出色彩方向
 * - 装饰氛围根据商品类别定制（如茶叶配水花/茉莉，耳机配声波）
 * - 文字比例用空间竞争控制：产品占画面 50%+，自然挤压文字空间
 * - 商业摄影棚拍质感：景深、边缘逆光、渐变背景
 */
function buildPosterImagePrompt(
  concept: PosterConcept,
  knowledge: {
    name: string;
    category: string;
    sellingPoints: string[];
  }
) {
  const { headline, colorDescription, atmosphere, features } = concept;
  const productName = knowledge.name;

  return `Design a premium commercial e-commerce poster for "${productName}".

=== ZONE STRUCTURE (MUST FOLLOW EXACTLY) ===
The poster has THREE distinct vertical zones:

ZONE 1 — TOP ZONE (upper ~20% of poster):
- Contains ONLY the main headline text: "${headline}"
- Text is placed in the upper area with generous breathing space above it
- The product does NOT enter this zone

ZONE 2 — MIDDLE ZONE (middle ~50-55% of poster):
- Contains ONLY the product — this is the hero visual area
- The product is centered in this zone, filling it naturally
- ABSOLUTELY NO TEXT in this zone

ZONE 3 — BOTTOM ZONE (lower ~20-25% of poster):
- Contains THREE feature columns separated by thin vertical dividers
- Feature titles (bold) and details (light) per column:
  Col 1: "${features[0]?.title ?? ''}" / "${features[0]?.detail ?? ''}"
  Col 2: "${features[1]?.title ?? ''}" / "${features[1]?.detail ?? ''}"
  Col 3: "${features[2]?.title ?? ''}" / "${features[2]?.detail ?? ''}"
- Vertical dividers between columns are 1px thin, light tone, same height as text
- This zone is compact — the features are supplementary info, not the main focus

=== PRODUCT TREATMENT ===
- The reference product must appear EXACTLY as-is — no shape, color, or texture changes
- Professional studio lighting: soft overhead diffused light (like a large softbox) + subtle fill from below
- A fine rim light (edge light) on one side of the product to separate it from the background — this is the single most important detail for a "premium commercial" look
- Very subtle depth of field: the product is tack sharp, the background has the slightest softening
- Soft, natural contact shadow beneath the product — it sits on the surface, not hovers
- The product should feel substantial and tactile — like you could reach out and touch it

=== COLOR SYSTEM ===
The poster's color palette is derived from the product itself. Follow this color direction precisely:

Color direction: ${colorDescription}

- The background, lighting, and accent tones all follow this color story
- ALL text layers use the same hue family as the background at different depth levels:
  - Headline "${headline}": deepest tone of the palette, 60-65% darker than the background
  - Feature titles (bold lines): medium tone, 30-35% darker
  - Feature details (light lines): light tone, 15-20% darker
- Vertical dividers: very light tone, barely visible
- NO pure black (#000), NO pure white (#FFF) — all colors live within the chosen palette
- The product's own colors should be the most saturated element in the poster — everything else is more subdued

=== DECORATIVE ATMOSPHERE (USE WITH RESTRAINT) ===
${atmosphere}

- Any decorative elements must be visually lighter, softer, and more transparent than the product
- Place decorations in the background layer — they should feel like they exist BEHIND or AROUND the product, not competing with it
- Decorations should have a soft focus / slight blur compared to the sharp product
- Decorations use the same color palette as the background — lower saturation, higher transparency
- If the atmosphere description suggests elements that would overlap the product, scale them back

=== TYPOGRAPHY SPECIFICATIONS ===
- The headline is the ONLY text in the upper zone; features are ONLY in the lower zone — no cross-zone text
- The headline should be substantial but NOT dominant — the product must remain the clear visual focus
- The three feature columns sit as a clean centered row at the bottom, compact and orderly
- Feature titles: medium weight, clear
- Feature details: light weight, smaller
- Thin vertical dividers between columns: 1px, same height as the two text lines
- Font: modern clean sans-serif (思源黑体 / Noto Sans CJK)

=== LIGHTING & SURFACE ===
- Background has a natural falloff gradient (center brighter, edges slightly darker) — like a professional seamless paper backdrop
- The surface the product sits on is barely visible — just enough to anchor the contact shadow
- Overall lighting feels like a top-tier e-com product shoot (think Apple/Tmall Super Brand Day)

=== ABSOLUTELY FORBIDDEN ===
- No glitter, sparkles, stars, or lens flares
- No ribbons, bows, price tags, discount badges, or sale labels
- No QR codes, website URLs, or call-to-action buttons
- No faux-gold borders or ornate frames
- No neon, oversaturated, or clashing colors
- No pure black (#000) for any text
- No duplicate text — headline appears exactly once in the upper zone
- No text in the middle zone — that belongs to the product only
- No decorative elements that are unrelated to the product (no generic clipart, no confetti, no random shapes)

The final poster feels like a frame from a premium commercial shoot — controlled, intentional, and harmonious. The product is the undisputed hero. Everything else — headline, features, atmosphere, texture — exists to support the product, not compete with it. The color palette feels like it was born from the product itself.`;
}

export async function POST(req: Request) {
  let knowledge: unknown;
  let images: unknown;
  let imageMimeTypes: unknown;
  let feedback: string | undefined;

  try {
    const body = await req.json();
    knowledge = body?.knowledge;
    images = body?.images;
    imageMimeTypes = body?.imageMimeTypes;
    feedback = String(body?.feedback ?? "").trim() || undefined;
  } catch {
    return json({ success: false, error: "请求格式错误" }, 400);
  }

  if (!knowledge || typeof knowledge !== "object") {
    return json({ success: false, error: "缺少商品知识卡数据" }, 400);
  }

  const typedKnowledge = knowledge as {
    name: string;
    category: string;
    sellingPoints: string[];
    targetUsers: string[];
    scenes: string[];
    advantages: string[];
  };

  try {
    // Step 1: DeepSeek 生成海报概念（文案 + 色调 + 氛围）
    const { system, user } = buildPosterPrompt(typedKnowledge, feedback);
    const raw = await deepseekChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.8 }
    );

    const concept = JSON.parse(raw) as PosterConcept;

    if (!concept.headline || !concept.features?.length) {
      return json({ success: false, error: "海报文案生成不完整" }, 500);
    }

    // Step 2: 构造海报视觉提示词（含动态色调和氛围）
    const imagePrompt = buildPosterImagePrompt(concept, typedKnowledge);

    // Step 3: Qwen-Image 多模态生图（传原图作参考）
    const imageUrl = await qwenImage(imagePrompt, {
      referenceImages: Array.isArray(images) ? images : [],
      referenceMimeTypes: Array.isArray(imageMimeTypes) ? imageMimeTypes : [],
    });

    return json({
      success: true,
      data: {
        headline: concept.headline,
        features: concept.features.slice(0, 3),
        imageUrl,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "海报生成超时，请稍后重试"
        : `海报生成失败: ${err instanceof Error ? err.message : "请重新尝试"}`;
    return json({ success: false, error: message }, 500);
  }
}
