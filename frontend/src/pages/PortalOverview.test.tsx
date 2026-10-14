import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "../layouts/AppLayout";
import { api } from "../services/api";
import { ClientePortalPage } from "./ClientePortalPage";
import { EntregadorOverviewPage } from "./EntregadorOverviewPage";

let perfil = "ENTREGADOR";
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    usuario: { nome: "Pessoa teste", perfil },
    logout: vi.fn(),
  }),
}));
vi.mock("../services/api", () => ({ api: { get: vi.fn() } }));
const now = new Date().toISOString();
const previousMonth = new Date();
previousMonth.setDate(1);
previousMonth.setMonth(previousMonth.getMonth() - 1);
const delivery = {
  id: "delivery-1",
  codigo: "TESTE-2048",
  clienteNome: "Cliente teste",
  status: "EM_ROTA",
  valorFinal: 41,
  criadoEm: now,
  historico: [],
  enderecoOrigem: "Rua A",
  bairroOrigem: "Centro",
  enderecoDestino: "Rua C",
  bairroDestino: "Cocó",
};
const stops = [
  { id: "c", ordem: 3, tipo: "ENTREGA", endereco: "Rua C", status: "PENDENTE" },
  { id: "a", ordem: 1, tipo: "COLETA", endereco: "Rua A", status: "CONCLUIDA" },
  { id: "b", ordem: 2, tipo: "ENTREGA", endereco: "Rua B", status: "PENDENTE" },
];

describe("Visões gerais por perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perfil = "ENTREGADOR";
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === "/entregas/minhas-entregas") return { data: [delivery] };
      if (url === "/operacao-entregador/resumo")
        return {
          data: {
            emRota: 1,
            concluidasHoje: 0,
            valorMovimentadoHoje: 41,
            valorRecebidoHoje: 0,
          },
        };
      if (String(url).endsWith("/paradas") || String(url).startsWith("/rotas/"))
        return { data: stops };
      if (String(url).endsWith("/nao-lidas")) return { data: { total: 0 } };
      return { data: [] };
    });
  });

  it("abre a próxima parada pendente e distingue dinheiro recebido do preço do serviço", async () => {
    render(
      <MemoryRouter initialEntries={["/operacional"]}>
        <EntregadorOverviewPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("link", { name: "Abrir endereço" }),
    ).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Rua%20B",
    );
    const metric = screen.getByText("Recebido hoje").closest("article")!;
    expect(within(metric).getByText(/R\$\s*0,00/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir entrega" })).toHaveAttribute(
      "href",
      "/minhas-entregas?entrega=delivery-1",
    );
    const priority = screen.getByRole("heading", { name: "Próxima ação" }).closest("section")!;
    const metrics = screen.getByLabelText("Resumo das entregas");
    expect(priority.compareDocumentPosition(metrics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Siga para Rua B e conclua esta parada.")).toBeInTheDocument();
  });

  it("conta conclusões somente no mês atual e abre a solicitação pelo cabeçalho", async () => {
    perfil = "CLIENTE";
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === "/cliente/me")
        return { data: { nome: "Cliente teste", ativo: true } };
      if (url === "/cliente/entregas")
        return {
          data: [
            delivery,
            {
              ...delivery,
              id: "done",
              status: "ENTREGUE",
              valorFinal: 47,
              concluidaEm: now,
            },
            {
              ...delivery,
              id: "old",
              status: "ENTREGUE",
              valorFinal: 59,
              concluidaEm: previousMonth.toISOString(),
            },
          ],
        };
      if (url === "/cliente/pagamentos")
        return {
          data: [
            { entregaId: "done", valor: 47, tipo: "RECEBIMENTO" },
            { entregaId: "old", valor: 59, tipo: "RECEBIMENTO" },
          ],
        };
      if (url === "/cliente/contato") return { data: {} };
      if (String(url).startsWith("/rotas/")) return { data: stops };
      if (String(url).endsWith("/nao-lidas")) return { data: { total: 0 } };
      return { data: [] };
    });
    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/portal" element={<ClientePortalPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const completed = (await screen.findByText("Concluídas no mês")).closest(
      "article",
    )!;
    expect(within(completed).getByText("1")).toBeInTheDocument();
    const pending = screen
      .getByText("Pagamentos pendentes")
      .closest("article")!;
    expect(within(pending).getByText(/R\$\s*41,00/)).toBeInTheDocument();
    const tracking = screen.getByRole("heading", { name: "Acompanhe sua entrega" }).closest("section")!;
    const clientMetrics = screen.getByLabelText("Resumo das suas entregas");
    expect(tracking.compareDocumentPosition(clientMetrics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent
      .setup()
      .click(screen.getByRole("link", { name: "Solicitar entrega" }));
    expect(
      await screen.findByRole("dialog", { name: "Rota da entrega" }),
    ).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/cliente/enderecos");
  });
});
