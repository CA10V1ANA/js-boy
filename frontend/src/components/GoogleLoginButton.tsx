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
        config: { theme: string; size: string; text: string },
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
        if (active) setError("Login Google indisponível. Use e-mail e senha.");
      });
      document.head.appendChild(script);
    }
    return () => {
      active = false;
      existing?.removeEventListener("load", render);
    };
  }, [clientId]);
  if (!clientId)
    return <p className="formHelp">Login Google ainda não configurado.</p>;
  return (
    <>
      <div ref={container} aria-label="Continuar com Google" />
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
