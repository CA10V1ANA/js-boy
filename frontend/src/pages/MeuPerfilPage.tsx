import { useEffect, useState } from "react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { Entregador } from "../types";
import { SegurancaConta } from "../components/SegurancaConta";

export function MeuPerfilPage() {
  const [perfil, setPerfil] = useState<Entregador | null>(null);
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api
      .get<Entregador>("/operacao-entregador/perfil")
      .then((r) => {
        setPerfil(r.data);
        setTelefone(r.data.telefone);
      })
      .catch((r) => setError(apiErrorMessage(r, "Perfil indisponível.")));
  }, []);
  return (
    <main className="page">
      <section className="panelCard notificationPanel">
        <h1>Meu perfil</h1>
        {error ? <p role="alert">{error}</p> : null}
        {perfil ? (
          <>
            <h2>{perfil.nome}</h2>
            <p>{perfil.email}</p>
            <p>
              Veículo: {perfil.tipoVeiculo} ·{" "}
              {perfil.placaVeiculo || "Placa não informada"}
            </p>
            <form
              className="settingsForm"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setBusy(true);
                try {
                  setPerfil(
                    (
                      await api.patch<Entregador>(
                        "/operacao-entregador/perfil",
                        { telefone },
                      )
                    ).data,
                  );
                  setError("");
                } catch (r) {
                  setError(
                    apiErrorMessage(r, "Não foi possível atualizar contato."),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Telefone
                <input
                  required
                  maxLength={30}
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </label>
              <button className="primaryButton" disabled={busy}>
                Atualizar contato
              </button>
            </form>
            <h2>Pix</h2>
            <p>
              {perfil.titularPix} ·{" "}
              {perfil.chavePix || "Chave ainda não cadastrada"}
            </p>
            <small>
              Alterações de identidade, veículo e Pix são feitas pelo
              proprietário.
            </small>
          </>
        ) : (
          <p role="status">Carregando perfil...</p>
        )}
        <SegurancaConta />
      </section>
    </main>
  );
}
