import { NextRequest, NextResponse } from "next/server";

const EXPAND_PROMPT = `Ты — контент-стратег для бренда ITOQ (@itoq_ru).
Ниша: AI, IT, автоматизация, маркетинг, lifestyle.
Аудитория: IT-специалисты 20-35 лет.

Пользователь дал краткую идею для контента. Разверни её в полноценный план.

Ответь СТРОГО в JSON (без markdown, без \`\`\`):
{
  "expandedTitle": "Цепляющий заголовок для видео",
  "hook": "Хук для первых 2 секунд — фраза которая заставит остановить скролл",
  "keyPoints": ["Ключевой тезис 1", "Ключевой тезис 2", "Ключевой тезис 3", "Ключевой тезис 4"],
  "targetAudience": "Для кого это видео и почему им будет интересно",
  "viralPotential": "Оценка виральности: высокий/средний/низкий + почему",
  "suggestedFormats": ["short", "longform"],
  "similarTrends": "Какие тренды/видео похожи и набрали просмотры",
  "uniqueAngle": "Чем наше видео будет отличаться от конкурентов"
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
      model: model || "openai/gpt-4o-mini",
    };
  }
  const openaiModel = model?.startsWith("openai/") ? model.replace("openai/", "") : (model || "gpt-4o-mini");
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
    const { ideaText, tags, apiKey, provider, model } = body;

    if (!ideaText) {
      return NextResponse.json({ error: "Текст идеи обязателен" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "API ключ не настроен." }, { status: 400 });
    }

    const config = getProviderConfig(provider || "openai", apiKey, model);

    const userMsg = `Разверни эту идею в контент-план:\n\nИдея: "${ideaText}"${tags?.length ? `\nТеги: ${tags.join(", ")}` : ""}`;

    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: EXPAND_PROMPT },
          { role: "user", content: userMsg },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: `AI ошибка: ${err.error?.message || response.statusText}` },
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
