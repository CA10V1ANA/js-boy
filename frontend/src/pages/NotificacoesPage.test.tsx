import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificacoesPage } from "./NotificacoesPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));
vi.mock("../hooks/useAreaOperacional", () => ({ useAreaOperacional: () => false }));
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ usuario: { perfil: "PROPRIETARIO" } }) }));

const aviso = {
  id: "notice-1",
  entregaId: "delivery-1",
  codigo: "JSB-2048",
  evento: "ENTREGA_ATUALIZADA",
  criadaEm: "2026-10-14T12:00:00Z",
};

describe("NotificacoesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (String(url).endsWith("/nao-lidas")) return { data: { total: 1 } };
      return { data: [aviso] };
    });
    vi.mocked(api.patch).mockResolvedValue({ data: {} } as never);
  });

  it("mostra a central de avisos e marca todas como lidas", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><NotificacoesPage /></MemoryRouter>);

    expect(await screen.findByText("Entrega Atualizada")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("aviso não lido")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/notificacoes/leitura"));
    expect(await screen.findByText("Todas as notificações foram marcadas como lidas.")).toBeInTheDocument();
  });
});
