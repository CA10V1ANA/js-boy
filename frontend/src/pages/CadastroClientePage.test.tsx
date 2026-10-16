import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../contexts/AuthContext";
import { CadastroClientePage } from "./CadastroClientePage";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderCadastro() {
  render(
    <MemoryRouter>
      <CadastroClientePage />
    </MemoryRouter>,
  );
}

describe("CadastroClientePage", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      autenticado: false,
      carregando: false,
      login: vi.fn(),
      usuario: null,
      token: null,
      entrarGoogle: vi.fn(),
      atualizarPerfil: vi.fn(), logout: vi.fn(),
    });
  });

  it("limpa visualmente o número e restaura o valor ao desmarcar sem número", async () => {
    const user = userEvent.setup();
    renderCadastro();
    const numero = screen.getByRole("textbox", { name: /^Número/ });
    const semNumero = screen.getByRole("checkbox", { name: /Sem número/ });

    await user.type(numero, "361");
    await user.click(semNumero);

    expect(numero).toBeDisabled();
    expect(numero).toHaveValue("");
    expect(numero).toHaveAttribute("placeholder", "Não se aplica");
    expect(screen.getByText(/Desmarque “Sem número” para restaurar/)).toBeInTheDocument();

    await user.click(semNumero);

    expect(numero).toBeEnabled();
    expect(numero).toHaveValue("361");
  });

  it("atualiza cada requisito de senha enquanto a pessoa digita", async () => {
    const user = userEvent.setup();
    renderCadastro();
    const senha = screen.getByLabelText("Senha");
    const criarConta = screen.getByRole("button", { name: "Criar conta de cliente" });
    const requisito = (texto: string) => screen.getByText(texto).closest("li");

    expect(criarConta).toBeDisabled();
    expect(requisito("Uma letra minúscula")).not.toHaveClass("complete");

    await user.type(senha, "abc");
    expect(requisito("Uma letra minúscula")).toHaveClass("complete");
    expect(requisito("Uma letra maiúscula")).not.toHaveClass("complete");

    await user.type(senha, "D");
    expect(requisito("Uma letra maiúscula")).toHaveClass("complete");

    await user.type(senha, "1");
    expect(requisito("Um número")).toHaveClass("complete");
    expect(requisito("Pelo menos 12 caracteres")).not.toHaveClass("complete");

    await user.type(senha, "efghijk");
    expect(requisito("Pelo menos 12 caracteres")).toHaveClass("complete");
    expect(screen.getByText("4 de 4 requisitos")).toBeInTheDocument();
    expect(criarConta).toBeEnabled();
  });
});
