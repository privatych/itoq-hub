import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, apiKey, size, imageProvider, imageModel, openrouterApiKey, falApiKey } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Промпт обязателен" }, { status: 400 });
    }

    // Route to appropriate provider
    if (imageProvider === "fal" && falApiKey) {
      return await generateViaFal(prompt, falApiKey, imageModel || "fal-ai/flux-2-flex", size);
    }

    if (imageProvider === "openrouter-image" && openrouterApiKey) {
      return await generateViaOpenRouter(prompt, openrouterApiKey, imageModel || "google/imagen-4", size);
    }

    // Default: DALL-E 3 via OpenAI
    if (!apiKey) {
      return NextResponse.json(
        { error: "API ключ не настроен. Перейдите в Настройки." },
        { status: 400 }
      );
    }
    return await generateViaDalle(prompt, apiKey, size);
  } catch (error) {
    return NextResponse.json(
      { error: `Серверная ошибка: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 500 }
    );
  }
}

async function generateViaFal(prompt: string, apiKey: string, model: string, size: string) {
  const imageSize = size === "9:16" ? "portrait_9_16" : size === "1:1" ? "square" : "landscape_16_9";

  // fal.ai REST API — queue-based
  const submitRes = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: imageSize,
      num_images: 1,
      enable_safety_checker: false,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    const msg = (err as Record<string, unknown>)?.detail || (err as Record<string, unknown>)?.message || submitRes.statusText;
    return NextResponse.json(
      { error: `fal.ai ошибка: ${msg}` },
      { status: submitRes.status }
    );
  }

  const result = await submitRes.json();

  // fal.ai returns images array directly for synchronous calls
  // or a request_id for async — handle both
  let imageUrl: string | undefined;

  if (result.images && result.images.length > 0) {
    imageUrl = result.images[0].url;
  } else if (result.request_id) {
    // Poll for result
    const requestId = result.request_id;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await fetch(`https://queue.fal.run/${model}/requests/${requestId}/status`, {
        headers: { Authorization: `Key ${apiKey}` },
      });
      const status = await statusRes.json();
      if (status.status === "COMPLETED") {
        const resultRes = await fetch(`https://queue.fal.run/${model}/requests/${requestId}`, {
          headers: { Authorization: `Key ${apiKey}` },
        });
        const finalResult = await resultRes.json();
        if (finalResult.images && finalResult.images.length > 0) {
          imageUrl = finalResult.images[0].url;
        }
        break;
      } else if (status.status === "FAILED") {
        return NextResponse.json({ error: `fal.ai: генерация провалилась` }, { status: 500 });
      }
    }
  }

  if (!imageUrl) {
    return NextResponse.json({ error: `fal.ai (${model}): не вернул изображение` }, { status: 500 });
  }

  return NextResponse.json({ imageUrl, revisedPrompt: prompt, model });
}

async function generateViaDalle(prompt: string, apiKey: string, size: string) {
  const imageSize = size === "9:16" ? "1024x1792" : size === "1:1" ? "1024x1024" : "1792x1024";

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: imageSize,
      quality: "hd",
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return NextResponse.json(
      { error: `DALL-E 3 ошибка: ${err.error?.message || response.statusText}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;
  const revisedPrompt = data.data?.[0]?.revised_prompt;

  if (!imageUrl) {
    return NextResponse.json({ error: "DALL-E не вернул изображение" }, { status: 500 });
  }

  return NextResponse.json({ imageUrl, revisedPrompt, model: "dall-e-3" });
}

async function generateViaOpenRouter(prompt: string, apiKey: string, model: string, size: string) {
  // OpenRouter image generation — uses chat completions with image_url response
  // For models like google/imagen-4, openai/dall-e-3 via OpenRouter
  const imageSize = size === "9:16" ? "1024x1792" : size === "1:1" ? "1024x1024" : "1792x1024";

  const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://itoq-hub.local",
      "X-Title": "ITOQ Content Hub",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: imageSize,
      quality: "hd",
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return NextResponse.json(
      { error: `OpenRouter Image ошибка: ${err.error?.message || response.statusText}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

  if (!imageUrl) {
    return NextResponse.json({ error: `${model} не вернул изображение` }, { status: 500 });
  }

  // If b64_json, convert to data URL
  const finalUrl = data.data?.[0]?.b64_json
    ? `data:image/png;base64,${data.data[0].b64_json}`
    : imageUrl;

  return NextResponse.json({ imageUrl: finalUrl, revisedPrompt: data.data?.[0]?.revised_prompt, model });
}
