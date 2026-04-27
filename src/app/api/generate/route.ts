import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Ты — контент-стратег для бренда ITOQ (@itoq_ru). 
Ниша: AI, IT, автоматизация, маркетинг, lifestyle.
Аудитория: IT-специалисты 20-35 лет, интересующиеся AI и автоматизацией.
Тон: Экспертный но дружелюбный, без воды, конкретика и факты.
Стиль хуков: провокационный, вызывающий любопытство, конкретные цифры.

Генерируй контент на русском языке если не указано иное.`;

function buildPrompt(topic: string, format: string): string {
  const formatGuide =
    format === "short"
      ? "Shorts/Reels (15-60 секунд). Скрипт должен быть ОЧЕНЬ коротким и ударным."
      : format === "longform"
      ? "Long-form видео (8-15 минут). Скрипт должен быть структурированным с таймкодами."
      : "Пост для социальных сетей. Краткий и цепляющий.";

  return `Создай контент на тему: "${topic}"

Формат: ${formatGuide}

Ответь СТРОГО в JSON формате (без markdown, без \`\`\`):
{
  "title": "Цепляющий заголовок для видео",
  "hook": "Первая фраза-крючок (максимум 2 предложения, должна зацепить за 2 секунды)",
  "script": "Полный сценарий с указаниями что показывать на экране [в квадратных скобках]",
  "description": "Описание для публикации (с эмодзи, 2-3 абзаца)",
  "hashtags": ["хэштег1", "хэштег2", "хэштег3", "хэштег4", "хэштег5"],
  "duration": ${format === "short" ? "30" : format === "longform" ? "600" : "0"}
}`;
}

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
  // Default: OpenAI
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
    const { topic, format, apiKey, model, provider, customPrompt } = body;

    if (!topic) {
      return NextResponse.json({ error: "Тема обязательна" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "API ключ не настроен. Перейдите в Настройки." },
        { status: 400 }
      );
    }

    const config = getProviderConfig(provider || "openai", apiKey, model);

    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: customPrompt || buildPrompt(topic, format || "short") },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      const providerName = provider === "openrouter" ? "OpenRouter" : "OpenAI";
      return NextResponse.json(
        { error: `${providerName} API ошибка: ${err.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Пустой ответ от AI" }, { status: 500 });
    }

    // Parse JSON from response (handle potential markdown wrapping)
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
