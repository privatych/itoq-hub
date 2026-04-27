import { NextRequest, NextResponse } from "next/server";

// Exchange authorization code for access token (OAuth 2.0 PKCE)
export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier, clientId, clientSecret, redirectUri } = await request.json();

    if (!code || !codeVerifier || !clientId || !redirectUri) {
      return NextResponse.json({ error: "Отсутствуют параметры OAuth" }, { status: 400 });
    }

    // Build form data for token exchange
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    // X API requires Basic auth with client_id:client_secret for confidential clients
    // or just client_id in body for public clients
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
        { error: `X OAuth ошибка: ${data.error_description || data.error || res.statusText}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Ошибка: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 500 }
    );
  }
}
