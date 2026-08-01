# Design QA — centralização de ícones e avatares

- source visual truth path: `C:\Users\viana\AppData\Local\Temp\codex-clipboard-77c46d9d-2370-4d50-90e0-61aef91bd73f.png`
- implementation screenshot path: indisponível; navegador interno e Chrome foram bloqueados pela ACL do Windows
- viewport da referência: aproximadamente 1287 × 828 px
- source pixel dimensions: 1287 × 828 px
- implementation pixel dimensions: indisponível
- CSS size and density normalization: indisponível sem captura renderizada
- state: dashboard do proprietário autenticado

## Full-view comparison evidence

A referência mostra quatro ícones de KPI deslocados para o canto superior esquerdo de seus círculos e as iniciais do avatar lateral igualmente deslocadas. A análise da cascata encontrou regras genéricas com especificidade superior às regras originais de centralização:

- `.metricCard span` substituía `display: grid` de `.metricIcon` por `display: block`;
- `.sideUser span` substituía `display: grid` de `.sideUserAvatar` e aplicava recorte de texto;
- `.appHeader span` podia afetar os círculos e avatares do cabeçalho.

Foram adicionados seletores específicos para restaurar `display: grid`, alinhamento nos dois eixos, `line-height: 1`, remoção de padding e margens indevidas, além da remoção do recorte no avatar lateral.

## Focused region comparison evidence

Regiões-alvo: os quatro círculos do resumo operacional, o avatar “PJ” do rodapé lateral, o ícone de saudação no cabeçalho, o avatar do cabeçalho e avatares das tabelas. A comparação visual pós-correção não pôde ser capturada porque os dois navegadores disponíveis encerraram com `windows sandbox failed: helper_unknown_error: apply deny-read ACLs`.

## Required fidelity surfaces

- Fonts and typography: preservadas; somente as propriedades de alinhamento e as propriedades originalmente pretendidas dos avatares foram reforçadas.
- Spacing and layout rhythm: cartões, círculos, tamanhos, gaps e margens externas foram preservados.
- Colors and visual tokens: tokens existentes foram preservados.
- Image quality and asset fidelity: os ícones Lucide existentes foram mantidos; não foram criados ativos substitutos.
- Copy and content: nenhum texto foi alterado.

## Findings

- [P1] Evidência visual pós-correção indisponível
  - Location: dashboard, cabeçalho e perfil lateral.
  - Evidence: build e CSS gerado confirmam as regras de centralização, mas não há captura renderizada para comparação.
  - Impact: a correção não pode receber aprovação visual final automatizada.
  - Fix: atualizar o dashboard no navegador do usuário e fornecer uma nova captura no mesmo estado.

## Comparison history

- Iteração 1: referência identificou ícones e iniciais deslocados.
- Causa: regras genéricas de `span` anulavam o layout grid dos círculos.
- Correção: seletores de maior especificidade em `p2.css` para métricas, ações rápidas, avatares, cabeçalho e perfil lateral.
- Validação técnica: build Vite aprovado, 18 testes funcionais aprovados e container frontend saudável.
- Evidência pós-correção: bloqueada pela ACL do navegador.

## Implementation checklist

- [x] Corrigir especificidade dos ícones de KPI
- [x] Corrigir avatar lateral
- [x] Reforçar alinhamento do cabeçalho e avatares de tabela
- [x] Build de produção
- [x] Testes automatizados
- [x] Container frontend saudável
- [ ] Captura visual pós-correção
- [ ] Comparação lado a lado

final result: blocked
