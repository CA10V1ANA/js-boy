import { message, useLocale } from '../i18n';
import { useEffect, useRef, useState } from "react";

type GoogleApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (r: { credential: string }) => void;
      }) => void;
      renderButton: (
        el: HTMLElement,
        config: { theme: string; size: string; text: string; locale: string },
      ) => void;
    };
  };
};
declare global {
  interface Window {
    google?: GoogleApi;
  }
}
export function GoogleLoginButton({
  onCredential,
}: {
  onCredential: (credencial: string) => void;
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [error, setError] = useState("");
  callback.current = onCredential;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  useEffect(() => {
    if (!clientId) return;
    let active = true;
    function render() {
      if (!active || !container.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: (r) => {
          if (active) callback.current(r.credential);
        },
      });
      window.google.accounts.id.renderButton(container.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale: locale === 'pt-BR' ? 'pt_BR' : locale,
      });
    }
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-google-login]",
    );
    if (window.google) render();
    else if (existing) existing.addEventListener("load", render);
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.dataset.googleLogin = "true";
      script.addEventListener("load", render);
      script.addEventListener("error", () => {
        if (active) setError(message("autenticacao.google.login.google.indisponivel.use.e.mail.e.senha"));
      });
      document.head.appendChild(script);
    }
    return () => {
      active = false;
      existing?.removeEventListener("load", render);
    };
  }, [clientId, locale]);
  if (!clientId)
    return <p className="formHelp">{message("autenticacao.google.login.google.ainda.nao.configurado")}</p>;
  return (
    <>
      <div ref={container} aria-label={message("autenticacao.google.continuar.com.google")} />
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
