import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../services/api";
import { MeuPerfilPage } from "./MeuPerfilPage";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ atualizarPerfil: vi.fn() }) }));

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

  it("permite editar dados pessoais, placa e Pix na própria conta", async () => {
    render(<MemoryRouter><MeuPerfilPage /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Caio De Oliveira Viana" })).toBeInTheDocument();
    expect(screen.getByText("Disponível para entregas")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toBeEnabled();
    expect(screen.getByLabelText("E-mail de acesso")).toBeEnabled();
    expect(screen.getByLabelText("Placa do veículo")).toHaveValue("ABC-1234");
    expect(screen.getByLabelText("Tipo de chave Pix")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });

  it("formata e valida o telefone antes de salvar os dados", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { ...perfil, telefone: "85999998888" } } as never);
    const user = userEvent.setup();
    render(<MemoryRouter><MeuPerfilPage /></MemoryRouter>);

    const telefone = await screen.findByLabelText("Telefone");
    await user.clear(telefone);
    await user.type(telefone, "85999");
    expect(screen.getByText("Informe o DDD e um telefone válido.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();

    await user.clear(telefone);
    await user.type(telefone, "85999998888");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/operacao-entregador/perfil", expect.objectContaining({ telefone: "85999998888" }), { headers: { "If-Match": 1 } }));
    expect(await screen.findByText("Dados atualizados com sucesso.")).toBeInTheDocument();
  });

  it("salva nome, e-mail, placa e Pix sem solicitação de autorização", async () => {
    const atualizado = { ...perfil, nome: "Entregador Teste", email: "novo@example.invalid", placaVeiculo: "XYZ1A23", tipoChavePix: "EMAIL", chavePix: "pix@example.invalid", titularPix: "Entregador Teste" };
    vi.mocked(api.patch).mockResolvedValue({ data: atualizado } as never);
    const user = userEvent.setup();
    render(<MemoryRouter><MeuPerfilPage /></MemoryRouter>);
    const nome = await screen.findByLabelText("Nome completo");
    await user.clear(nome); await user.type(nome, atualizado.nome);
    const email = screen.getByLabelText("E-mail de acesso");
    await user.clear(email); await user.type(email, atualizado.email);
    const placa = screen.getByLabelText("Placa do veículo");
    await user.clear(placa); await user.type(placa, atualizado.placaVeiculo);
    await user.selectOptions(screen.getByLabelText("Tipo de chave Pix"), "EMAIL");
    await user.type(screen.getByLabelText("Chave Pix"), atualizado.chavePix);
    await user.type(screen.getByLabelText("Nome do titular da chave"), atualizado.titularPix);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/operacao-entregador/perfil", expect.objectContaining({ nome: atualizado.nome, email: atualizado.email, placaVeiculo: atualizado.placaVeiculo, tipoChavePix: "EMAIL", chavePix: atualizado.chavePix, titularPix: atualizado.titularPix }), { headers: { "If-Match": 1 } }));
    expect(await screen.findByText("Dados atualizados com sucesso.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
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
