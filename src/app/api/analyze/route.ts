import { NextRequest, NextResponse } from "next/server";

const ANALYSIS_PROMPT = `You are a YouTube thumbnail analyst and prompt engineer. Analyze this thumbnail image in detail.

Respond STRICTLY in JSON (no markdown, no \`\`\`):
{
  "analysis": {
    "composition": "Describe the layout, positioning of elements, rule of thirds usage",
    "colors": "Main color palette, dominant colors, accent colors, color temperature",
    "lighting": "Lighting type, direction, dramatic effects, contrast level",
    "mood": "Overall emotional feel, energy level, target emotion",
    "elements": "List all visual elements: people, objects, icons, shapes, effects",
    "style": "Photography/illustration/3D/mixed, quality level, aesthetic genre",
    "whatWorks": "Why this thumbnail is effective for getting clicks, psychological triggers"
  },
  "generatedPrompt": "A detailed image generation prompt that would recreate a very similar thumbnail. Include: exact style description, composition, lighting, colors, mood, all visual elements. Format it as a DALL-E / Imagen prompt. The prompt should be in English, professional quality, ready to use. Add 'NO TEXT on image' at the end."
}`;

function getProviderConfig(provider: string, apiKey: string, model: string): { url: string; headers: Record<string, string>; model: string } {
  if (provider === "openrouter") {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://itoq-hub.local",
        "X-Title": "ITOQ Content Hub",
      },
      model: model || "openai/gpt-4o",
    };
  }
  const openaiModel = model?.startsWith("openai/") ? model.replace("openai/", "") : (model || "gpt-4o");
  return {
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    model: openaiModel,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageDataUrl, apiKey, provider, model } = body;

    if (!imageDataUrl) {
      return NextResponse.json({ error: "Изображение обязательно" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "API ключ не настроен." }, { status: 400 });
    }

    // Need a vision-capable model
    const visionModel = model || (provider === "openrouter" ? "openai/gpt-4o" : "gpt-4o");
    const config = getProviderConfig(provider || "openai", apiKey, visionModel);

    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this YouTube thumbnail and generate a prompt to recreate it:" },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: `Vision API ошибка: ${err.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Пустой ответ от AI" }, { status: 500 });
    }

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI вернул некорректный JSON. Попробуйте ещё раз.", raw: content },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: `Серверная ошибка: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 500 }
    );
  }
}
