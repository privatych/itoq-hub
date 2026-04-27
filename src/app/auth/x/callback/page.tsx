"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function XCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function exchangeCode() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const errorParam = params.get("error");

      if (errorParam) {
        setStatus("error");
        setError(`Авторизация отклонена: ${errorParam}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setError("Код авторизации не получен");
        return;
      }

      // Verify state
      const savedState = sessionStorage.getItem("x_oauth_state");
      if (state !== savedState) {
        setStatus("error");
        setError("Некорректный state параметр (CSRF protection)");
        return;
      }

      const codeVerifier = sessionStorage.getItem("x_oauth_code_verifier");
      const clientId = sessionStorage.getItem("x_oauth_client_id");
      const clientSecret = sessionStorage.getItem("x_oauth_client_secret") || "";

      if (!codeVerifier || !clientId) {
        setStatus("error");
        setError("Данные OAuth сессии не найдены. Попробуйте заново.");
        return;
      }

      try {
        const res = await fetch("/api/auth/x", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            codeVerifier,
            clientId,
            clientSecret,
            redirectUri: `${window.location.origin}/auth/x/callback`,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setError(data.error || "Ошибка обмена токена");
          return;
        }

        // Store tokens — parent window will pick them up
        localStorage.setItem("itoq_x_tokens", JSON.stringify({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          connectedAt: new Date().toISOString(),
        }));

        // Clean up
        sessionStorage.removeItem("x_oauth_state");
        sessionStorage.removeItem("x_oauth_code_verifier");
        sessionStorage.removeItem("x_oauth_client_id");
        sessionStorage.removeItem("x_oauth_client_secret");

        setStatus("success");

        // Close this tab/window after 2s
        setTimeout(() => { window.close(); }, 2000);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Ошибка сети");
      }
    }

    exchangeCode();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Подключение X (Twitter)</h1>
            <p className="text-gray-400 text-sm">Обмен токена авторизации...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">X подключён!</h1>
            <p className="text-gray-400 text-sm">Окно закроется автоматически. Вернитесь в ITOQ Hub.</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Ошибка</h1>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-6 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600"
            >
              Закрыть
            </button>
          </>
        )}
      </div>
    </div>
  );
}
