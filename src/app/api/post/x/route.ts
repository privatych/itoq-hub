import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, text } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "X (Twitter) не подключён. Авторизуйтесь в Настройках." },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json({ error: "Текст твита пуст" }, { status: 400 });
    }

    // Post tweet via X API v2
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.detail || data.title || JSON.stringify(data.errors?.[0]) || res.statusText;
      // If 401, token expired
      if (res.status === 401) {
        return NextResponse.json(
          { error: "X: токен истёк. Переавторизуйтесь в Настройках.", expired: true },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: `X: ${errMsg}` }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      tweetId: data.data?.id,
      tweetUrl: `https://x.com/i/status/${data.data?.id}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Ошибка: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 500 }
    );
  }
}
