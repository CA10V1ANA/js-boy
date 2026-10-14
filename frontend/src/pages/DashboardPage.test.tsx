import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../services/api";
import { DashboardPage } from "./DashboardPage";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ usuario: { nome: "Proprietário", perfil: "PROPRIETARIO" } }),
}));
vi.mock("../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("../services/api", () => ({ api: { get: vi.fn() } }));

describe("Prioridade diária do proprietário", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === "/dashboard/resumo")
        return {
          data: {
            totalEntregas: 4,
            solicitadas: 2,
            emAndamento: 1,
            entregues: 1,
            canceladas: 0,
            valorTotal: 100,
            clientes: 2,
            entregadoresAtivos: 2,
          },
        };
      if (url === "/pagamentos/relatorio")
        return {
          data: {
            valorEntregas: 100,
            valorRecebido: 59,
            valorPendente: 41,
            pagamentosRegistrados: 1,
            pendencias: [],
          },
        };
      return { data: [] };
    });
  });

  it("mostra uma única ação principal sem exigir validação manual do entregador", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "2 solicitações precisam de atenção",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Revise o pedido, confirme os dados e designe o entregador quando estiver pronto.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revisar entregas" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/validar entregador/i)).not.toBeInTheDocument();
  });
});
