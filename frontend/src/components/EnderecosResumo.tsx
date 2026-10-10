import { useEffect, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
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
    <section className="portalPanel overviewAddresses">
      <div className="portalPanelHeading">
        <h2>Endereços frequentes</h2>
        <Link className="portalTextLink" to="/portal/enderecos">
          Gerenciar endereços <ChevronRight size={17} />
        </Link>
      </div>
      {error ? (
        <p role="alert" className="portalEmpty">
          {error}
        </p>
      ) : !items ? (
        <p role="status" className="portalEmpty">
          Carregando endereços...
        </p>
      ) : items.length ? (
        <div className="portalAddressList">
          {items.slice(0, 2).map((e, index) => (
            <Link className="portalAddress" key={e.id} to="/portal/enderecos">
              <span
                className={"portalIcon " + (index === 0 ? "amber" : "green")}
              >
                <MapPin size={27} />
              </span>
              <div>
                <strong>{e.apelido}</strong>
                <p>
                  {e.endereco}, {e.cidade} - {e.estado}
                </p>
                <small>{e.bairro}</small>
              </div>
              <ChevronRight size={19} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="portalEmpty">
          Cadastre os locais que usa com frequência.
        </p>
      )}
    </section>
  );
}
