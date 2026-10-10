import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { api } from "../services/api";
import { ConversasPage } from "./ConversasPage";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ usuario: { id: "u1", perfil: "CLIENTE" } }),
}));
const detalhe = {
  id: "c1",
  entregaId: "e1",
  codigo: "JSB-TESTE",
  status: "EM_ROTA",
  ultimaSequencia: 0,
  podeEnviar: true,
  participantes: ["Cliente teste", "Entregador teste", "Proprietário teste"],
};
function abrir() {
  return render(
    <MemoryRouter initialEntries={["/conversas?conversa=c1"]}>
      <ConversasPage />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: String(url).endsWith("/c1") ? detalhe : [],
  }));
  vi.mocked(api.patch).mockResolvedValue({ data: {} });
});
it("repete o mesmo identificador após resposta perdida e preserva o texto", async () => {
  const user = userEvent.setup();
  vi.mocked(api.post)
    .mockRejectedValueOnce(new Error("Resposta perdida"))
    .mockImplementationOnce(async (_url, payload) => ({
      data: {
        ...(payload as object),
        id: "m1",
        sequencia: 1,
        autorId: "u1",
        autorNome: "Cliente teste",
        contexto: "CLIENTE",
        tipo: "TEXTO",
        criadaEm: "2026-10-09T12:00:00Z",
      },
    }));
  abrir();
  await screen.findByText("JSB-TESTE");
  await user.type(
    screen.getByLabelText("Mensagem"),
    "Pode entrar pela lateral",
  );
  await user.click(screen.getByRole("button", { name: "Enviar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Mensagem ainda não confirmada",
  );
  expect(screen.getByLabelText("Mensagem")).toHaveValue(
    "Pode entrar pela lateral",
  );
  const primeira = vi.mocked(api.post).mock.calls[0];
  await user.click(screen.getByRole("button", { name: "Enviar" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
  expect(vi.mocked(api.post).mock.calls[1]).toEqual(primeira);
  expect(
    await screen.findByText("Pode entrar pela lateral"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Mensagem")).toHaveValue("");
  expect(api.patch).not.toHaveBeenCalledWith(
    expect.stringMatching(/status|recebimento/),
    expect.anything(),
  );
});
it("renderiza texto simples e respeita conversa somente leitura", async () => {
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: String(url).endsWith("/c1")
      ? { ...detalhe, podeEnviar: false }
      : String(url).endsWith("/mensagens")
        ? [
            {
              id: "m1",
              sequencia: 1,
              autorId: "u2",
              autorNome: "Outro participante",
              contexto: "ENTREGADOR",
              tipo: "TEXTO",
              conteudo: "<img src=x onerror=alert(1)>",
              criadaEm: "2026-10-09T12:00:00Z",
            },
          ]
        : [],
  }));
  abrir();
  expect(
    await screen.findByText("<img src=x onerror=alert(1)>"),
  ).toBeInTheDocument();
  expect(document.querySelector(".chatMessage img")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Enviar" }),
  ).not.toBeInTheDocument();
});
it("limpa o histórico quando o servidor revoga a autorização", async () => {
  vi.mocked(api.get).mockImplementation(async (url) => {
    if (String(url).endsWith("/c1"))
      throw {
        response: { status: 404, data: { message: "Conversa indisponível" } },
        isAxiosError: true,
      };
    return { data: [] };
  });
  abrir();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Conversa indisponível",
  );
  expect(screen.queryByLabelText("Mensagem")).not.toBeInTheDocument();
});
