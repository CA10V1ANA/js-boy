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
      setError(apiErrorMessage(r, "Não foi possível carregar endereços."));
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
      setError(apiErrorMessage(r, "Não foi possível salvar o endereço."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page">
      <section className="panelCard notificationPanel">
        <div className="panelCardHeader">
          <h1>Endereços e contatos</h1>
          <button
            className="primaryButton"
            onClick={() => {
              setForm(empty);
              setEditing(null);
              setOpen(true);
            }}
          >
            Incluir endereço
          </button>
        </div>
        <p>
          Locais frequentes para novas solicitações. Alterações aqui preservam o
          histórico das entregas.
        </p>
        {error ? <p role="alert">{error}</p> : null}
        {!items.length ? <p>Nenhum endereço salvo.</p> : null}
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
                Editar
              </button>
              <button
                className="smallButton"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm(`Remover o endereço ${item.apelido}?`))
                    return;
                  setBusy(true);
                  try {
                    await api.delete(`/cliente/enderecos/${item.id}`, {
                      headers: { "If-Match": String(item.versao) },
                    });
                    await load();
                  } catch (r) {
                    setError(apiErrorMessage(r, "Não foi possível remover."));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remover
              </button>
            </div>
          </article>
        ))}
      </section>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? "Editar endereço" : "Incluir endereço"}
      >
        <form className="settingsForm" onSubmit={salvar}>
          {Object.entries({
            apelido: "Nome do local",
            endereco: "Endereço completo",
            bairro: "Bairro",
            cidade: "Cidade",
            estado: "UF",
            cep: "CEP",
            complemento: "Complemento",
            referencia: "Referência e instruções de acesso",
            contatoNome: "Nome do contato",
            contatoTelefone: "Telefone do contato",
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
            {busy ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </Modal>
    </main>
  );
}
