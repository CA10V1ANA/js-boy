# Design QA — máscaras e dicas de preenchimento

- Referência visual: `C:\Users\viana\AppData\Local\Temp\codex-clipboard-735af9df-8c6e-4a07-b1bf-2362b4cf5a06.png`
- Estado validado: build de produção, testes automatizados, containers saudáveis e HTTP 200
- Rotas afetadas: entregadores, clientes, entregas, empresa, login, contato público e portal do cliente

## Implementação

- CPF: `000.000.000-00`
- CPF/CNPJ: alternância automática entre os dois formatos
- Telefone e WhatsApp: `(00) 00000-0000`
- E-mail: exemplo visual, remoção de espaços e normalização para minúsculas
- CEP: `00000-000`
- Placa: `ABC-1D23`
- UF: duas letras maiúsculas
- Moeda e distância: exemplos `0,00` e `0,0`
- Veículos disponíveis no formulário: `Moto` e `Carro`

## Evidência

- Compilação de produção: aprovada
- Testes: 17 aprovados
- Docker: frontend, backend e PostgreSQL saudáveis
- Aplicação: `http://localhost:5173` respondeu HTTP 200
- Captura visual automatizada: indisponível por bloqueio de ACL do navegador interno no Windows

final result: blocked
