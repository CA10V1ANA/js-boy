import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../services/api";
import { MeuPerfilPage } from "./MeuPerfilPage";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

const perfil = {
  id: "entregador-1",
  nome: "caio de oliveira viana",
  cpf: "00000000000",
  telefone: "85981112664",
  email: "caio@example.invalid",
  tipoVeiculo: "MOTO" as const,
  placaVeiculo: "ABC1234",
  ativo: true,
  disponivel: true,
  possuiAcesso: true,
  criadoEm: "2026-10-14T10:00:00Z",
  versao: 1,
};

describe("MeuPerfilPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === "/operacao-entregador/perfil") return { data: perfil };
      if (url === "/conta") return { data: { senhaLocal: true } };
      return { data: {} };
    });
  });

  it("organiza identidade, contato e dados operacionais sem liberar edição protegida", async () => {
    render(<MemoryRouter><MeuPerfilPage /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Caio De Oliveira Viana" })).toBeInTheDocument();
    expect(screen.getByText("Disponível para entregas")).toBeInTheDocument();
    expect(screen.getByText("Pix ainda não configurado")).toBeInTheDocument();
    expect(screen.getByText(/Veículo e Pix são alterados pelo proprietário/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preciso de ajuda" })).toHaveAttribute("href", "/operacional/ajuda");
    expect(screen.getByRole("button", { name: "Telefone atualizado" })).toBeDisabled();
  });

  it("formata, valida e salva somente um telefone alterado", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { ...perfil, telefone: "85999998888" } } as never);
    const user = userEvent.setup();
    render(<MemoryRouter><MeuPerfilPage /></MemoryRouter>);

    const telefone = await screen.findByLabelText("Seu telefone");
    await user.clear(telefone);
    await user.type(telefone, "85999");
    expect(screen.getByText("Informe o DDD e um telefone válido.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar telefone" })).toBeDisabled();

    await user.clear(telefone);
    await user.type(telefone, "85999998888");
    await user.click(screen.getByRole("button", { name: "Salvar telefone" }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/operacao-entregador/perfil", { telefone: "85999998888" }));
    expect(await screen.findByText("Telefone atualizado com sucesso.")).toBeInTheDocument();
  });

  it("marca os requisitos de senha conforme o preenchimento", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><MeuPerfilPage /></MemoryRouter>);

    const novaSenha = await screen.findByLabelText("Nova senha");
    await user.type(novaSenha, "SenhaCompleta1");
    const requisitos = screen.getByText("Sua nova senha precisa ter:").parentElement!;
    expect(within(requisitos).getByText("12 caracteres").closest("li")).toHaveClass("valid");
    expect(within(requisitos).getByText("uma letra maiúscula").closest("li")).toHaveClass("valid");
    expect(within(requisitos).getByText("uma letra minúscula").closest("li")).toHaveClass("valid");
    expect(within(requisitos).getByText("um número").closest("li")).toHaveClass("valid");
  });
});
