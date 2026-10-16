import { message, useLocale } from '../i18n';
import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { Modal } from "../components/Modal";

export type Endereco = {
  id: string;
  apelido: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento: string;
  referencia: string;
  contatoNome: string;
  contatoTelefone: string;
  versao: number;
};
const empty = {
  apelido: "",
  endereco: "",
  bairro: "",
  cidade: "",
  estado: "CE",
  cep: "",
  complemento: "",
  referencia: "",
  contatoNome: "",
  contatoTelefone: "",
};
export function EnderecosPage() {
  useLocale();
  const [items, setItems] = useState<Endereco[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Endereco | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      setItems((await api.get<Endereco[]>("/cliente/enderecos")).data);
    } catch (r) {
      setError(apiErrorMessage(r, message("enderecos.nao.foi.possivel.carregar.enderecos")));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (editing)
        await api.put(`/cliente/enderecos/${editing.id}`, form, {
          headers: { "If-Match": String(editing.versao) },
        });
      else await api.post("/cliente/enderecos", form);
      setOpen(false);
      await load();
    } catch (r) {
      setError(apiErrorMessage(r, message("enderecos.nao.foi.possivel.salvar.o.endereco")));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page">
      <section className="panelCard notificationPanel">
        <div className="panelCardHeader">
          <h1>{message("enderecos.enderecos.e.contatos")}</h1>
          <button
            className="primaryButton"
            onClick={() => {
              setForm(empty);
              setEditing(null);
              setOpen(true);
            }}
          >
            {message("enderecos.incluir.endereco")} </button>
        </div>
        <p>
          {message("enderecos.locais.frequentes.para.novas.solicitacoes.alteracoes.aqui.preservam.")} </p>
        {error ? <p role="alert">{error}</p> : null}
        {!items.length ? <p>{message("enderecos.nenhum.endereco.salvo")}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="notificationRow">
            <div>
              <h2>{item.apelido}</h2>
              <p>
                {item.endereco} · {item.bairro} · {item.cidade}/{item.estado}
              </p>
              <p>
                {item.contatoNome} · {item.contatoTelefone}
              </p>
            </div>
            <div className="quickLinks">
              <button
                className="secondaryButton"
                onClick={() => {
                  setForm({ ...empty, ...item });
                  setEditing(item);
                  setOpen(true);
                }}
              >
                {message("enderecos.editar")} </button>
              <button
                className="smallButton"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm(message("enderecos.remover.o.endereco.value", { value1: item.apelido })))
                    return;
                  setBusy(true);
                  try {
                    await api.delete(`/cliente/enderecos/${item.id}`, {
                      headers: { "If-Match": String(item.versao) },
                    });
                    await load();
                  } catch (r) {
                    setError(apiErrorMessage(r, message("enderecos.nao.foi.possivel.remover")));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {message("enderecos.remover")} </button>
            </div>
          </article>
        ))}
      </section>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? message("enderecos.editar.endereco") : message("enderecos.incluir.endereco")}
      >
        <form className="settingsForm" onSubmit={salvar}>
          {Object.entries({
            apelido: message("enderecos.nome.do.local"),
            endereco: message("enderecos.endereco.completo"),
            bairro: message("enderecos.bairro"),
            cidade: message("enderecos.cidade"),
            estado: message("enderecos.uf"),
            cep: message("enderecos.cep"),
            complemento: message("enderecos.complemento"),
            referencia: message("enderecos.referencia.e.instrucoes.de.acesso"),
            contatoNome: message("enderecos.nome.do.contato"),
            contatoTelefone: message("enderecos.telefone.do.contato"),
          }).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required={[
                  "apelido",
                  "endereco",
                  "bairro",
                  "cidade",
                  "estado",
                ].includes(key)}
                maxLength={
                  key === "estado"
                    ? 2
                    : key === "cep"
                      ? 8
                      : key === "referencia"
                        ? 500
                        : key === "complemento"
                          ? 120
                          : key === "contatoTelefone"
                            ? 30
                            : key === "apelido" ||
                                key === "bairro" ||
                                key === "cidade"
                              ? 80
                              : key === "contatoNome"
                                ? 140
                                : 180
                }
                value={form[key as keyof typeof empty]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]:
                      key === "cep"
                        ? e.target.value.replace(/\D/g, "")
                        : e.target.value,
                  })
                }
              />
            </label>
          ))}
          {error ? <p role="alert">{error}</p> : null}
          <button className="primaryButton" disabled={busy}>
            {busy ? message("comum.salvando") : message("enderecos.salvar")}
          </button>
        </form>
      </Modal>
    </main>
  );
}
