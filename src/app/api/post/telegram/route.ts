import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { botToken, channelId, text, parseMode } = await request.json();

    if (!botToken || !channelId) {
      return NextResponse.json(
        { error: "Telegram Bot Token и Channel ID обязательны. Настройте в Настройках." },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json({ error: "Текст сообщения пуст" }, { status: 400 });
    }

    // Send message via Telegram Bot API
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: parseMode || "HTML",
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      const errMsg = data.description || "Неизвестная ошибка Telegram";
      return NextResponse.json({ error: `Telegram: ${errMsg}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      messageId: data.result?.message_id,
      chatId: data.result?.chat?.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Ошибка: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 500 }
    );
  }
}
