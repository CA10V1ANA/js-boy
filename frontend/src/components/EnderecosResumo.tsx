import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Endereco } from "../pages/EnderecosPage";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export function EnderecosResumo() {
  const [items, setItems] = useState<Endereco[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void api
      .get<Endereco[]>("/cliente/enderecos")
      .then(({ data }) => {
        if (active) setItems(data);
      })
      .catch((r) => {
        if (active)
          setError(apiErrorMessage(r, "Não foi possível carregar endereços."));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="panelCard">
      <div className="panelCardHeader">
        <h2>Endereços frequentes</h2>
        <Link to="/portal/enderecos">Gerenciar</Link>
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : !items ? (
        <p role="status">Carregando endereços...</p>
      ) : items.length ? (
        items.slice(0, 3).map((e) => (
          <Link
            className="deliveryOverviewRow"
            key={e.id}
            to="/portal/enderecos"
          >
            <strong>{e.apelido}</strong>
            <span>{e.endereco}</span>
            <small>
              {e.bairro} · {e.cidade}/{e.estado}
            </small>
          </Link>
        ))
      ) : (
        <p className="emptyNote">Cadastre os locais que usa com frequência.</p>
      )}
    </section>
  );
}
