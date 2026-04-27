import { NextRequest, NextResponse } from "next/server";

// Refresh X access token
export async function POST(request: NextRequest) {
  try {
    const { refreshToken, clientId, clientSecret } = await request.json();

    if (!refreshToken || !clientId) {
      return NextResponse.json({ error: "Отсутствует refresh token" }, { status: 400 });
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (clientSecret) {
      headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    } else {
      params.append("client_id", clientId);
    }

    const res = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers,
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: `Refresh ошибка: ${data.error_description || data.error || res.statusText}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Ошибка: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 500 }
    );
  }
}
