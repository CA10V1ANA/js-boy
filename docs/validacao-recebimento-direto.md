# Validação da implementação

> **Registro histórico.** Para o estado atual, consulte [a revisão de 08/10](revisao-completa-2026-10-08.md) e [o procedimento Vercel/Railway/Supabase](publicacao-vercel-railway-supabase.md). Resultados e pendências abaixo se referem à execução anterior. Não são o checklist vigente de publicação.

Execução concluída em 09/10/2026 no checkout `/workspace/js-boy`, branch `work`, base `e0d05d1`. Mudanças locais revisáveis, sem commit, push ou deploy. O DevPilot foi importado de `CA10V1ANA/DevPilot`; ver `devpilot/INTEGRACAO.md`.

## Resultados

| Verificação | Resultado |
| --- | --- |
| Maven `verify`, Java 21, dependências em cache | 133 testes unitários e 27 de integração; zero falhas, erros ou testes ignorados |
| Frontend `npm test` | 14 arquivos, 40 testes aprovados |
| Frontend `npm run build` | TypeScript e Vite aprovados; aviso de tamanho de chunk superior a 500 kB |
| Docker Compose `config --quiet`, valores fictícios | Aprovado |
| `git diff --check` | Aprovado |
| Navegador Chromium, 390 × 844 | Fluxo completo aprovado, sem transbordamento horizontal |
| `npm audit` | Não executado: revisão automática de aprovação recusou o envio da árvore de dependências e metadados ao registro npm sem autorização específica |

## Cobertura relevante

- Pix e dinheiro com recebedor designado e confirmação pelo proprietário ou pelo próprio entregador; cliente e outro entregador não podem confirmar.
- Confirmação parcial, saldo, estorno, período fechado, retries idempotentes e concorrência; não há recebimento duplicado nem pagamento acima do saldo.
- Mudanças de chave/titular invalidam consulta antiga; recebedor, forma e preço não podem ser transferidos silenciosamente após recebimento líquido.
- Finalização protegida no serviço, inclusive sincronização offline: precisa de paradas concluídas e saldo quitado; valor zero não cria crédito fictício.
- Rota ordenada, preservação de IDs, versões, projeção dos endereços e conclusão manual com autor e horário. Parada futura não ignora a anterior.
- Preservação de históricos e migrations antigas; cobrança legada pendente bloqueia até conciliação, sem inferir pagamento ou cancelamento.
- Interface: clientes sem ação de confirmar, dinheiro sem chave, falha de rede sem falso sucesso e tentativa conservando payload e chave idempotente.
- Renovação de sessão em `/auth/me`, sem expor o token no armazenamento persistente; consultas simultâneas usam uma única renovação.

## Ensaio no navegador

Banco PostgreSQL temporário isolado, API local e frontend local, com usuários, contatos e dados bancários fictícios. Nenhum banco de produção ou configuração secreta do projeto foi consultado.

No perfil proprietário, a entrega tinha quatro locais (duas coletas e duas entregas), Pix e valor de R$ 100. Os quatro locais foram concluídos na interface. Uma falha de rede foi provocada ao confirmar R$ 30: a finalização ficou indisponível. Após atualizar e repetir, o razão mostrou R$ 30 recebidos e R$ 70 de saldo, ainda impedindo a finalização. O restante foi confirmado e a entrega finalizada. Depois de recarregar a página, o estado ENTREGUE e os dados continuaram presentes. A largura da página permaneceu dentro dos 390 pixels.

Esse ensaio identificou e corrigiu duas falhas: largura excessiva das ações na tabela mobile e exclusão indevida de `/auth/me` da renovação da sessão. A verificação de sessão ganhou testes de regressão.

## Pendências reais

- Auditoria de dependências depende de autorização para comunicação com o registro npm.
- Não houve conferência de crédito real, titular bancário ou inventário da conta Mercado Pago de produção. A emissão nova foi retirada; consulta e webhook legados permanecem somente para conciliar cobranças existentes até verificar esse inventário.
- V18 foi aplicada apenas nos bancos temporários de validação. Sua aplicação no ambiente publicado acompanha a revisão e publicação do código.
- Compilação e testes locais não equivalem à homologação bancária ou à publicação do sistema.
