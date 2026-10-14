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

---

# Design QA — autenticação pública

- Source visual truth: `C:\Users\viana\AppData\Local\Temp\codex-clipboard-34e01752-f387-46db-992c-f07393bf875e.png`
- Previous implementation reference: `C:\Users\viana\AppData\Local\Temp\codex-clipboard-4aef9e73-264f-4b04-8106-bf317a5cb4f7.png`
- Implementation: `http://localhost:5173/login` and `http://localhost:5173/cadastro`
- Implementation screenshots: Codex in-app browser captures displayed in the task evidence; the browser API did not expose a filesystem path.
- Viewports: desktop `1045 x 700` CSS px and mobile `375 x 700` CSS px, device scale factor 1.
- Source pixels: target `1045 x 737`; previous implementation `1528 x 818`.
- State: logged out, login tab active; create-account tab active after navigation.

## Full-view comparison evidence

The login card now follows the reference composition: two equal tabs, one selected state, form controls below, a single primary yellow action, and secondary authentication separated from the form. The JS Boy header, copy, colors, logo, footer, password visibility control, and existing routes were intentionally preserved from the product.

The create-account route now uses the same public header, footer, card, and tabs. Its longer production form uses a responsive two-column desktop layout and one-column mobile layout instead of forcing the short reference-card height.

## Focused region comparison evidence

- Tabs: equal tracks, visible active elevation, keyboard focus, and real navigation between `/login` and `/cadastro`.
- Password support: recovery link is aligned with the password label and resolves to `/esqueci-senha`.
- Alternative login: divider and Google state are centered and contained instead of appearing as loose text.
- Mobile: login and registration cards stay within the viewport at `375px`; registration fields collapse to one column.

## Required fidelity surfaces

- Fonts and typography: existing JS Boy families, weights, hierarchy, and labels preserved; no wrapping or truncation issue remains in the tested viewports.
- Spacing and layout rhythm: card padding, tab spacing, form gaps, divider, radii, and shadow follow the reference hierarchy.
- Colors and visual tokens: existing white, neutral gray, black, and JS Boy yellow tokens preserved.
- Image quality and asset fidelity: existing official JS Boy logo asset preserved; no placeholder or generated substitute introduced.
- Copy and content: production copy and client-only registration contract preserved. Google remains explicitly unavailable because `VITE_GOOGLE_CLIENT_ID` is not configured locally.

## Comparison history

1. P1 found: only the login tab was visible and the secondary actions appeared as unrelated loose text. Fixed with two real navigation tabs, a password recovery position next to the field, and a separated Google section.
2. P1 found after interaction test: the create-account tab opened the legacy unframed registration page. Fixed by applying the same public authentication shell and active-tab state to registration.
3. Post-fix evidence: desktop and mobile captures show both active states without horizontal overflow; tab navigation works; browser console returned no warnings or errors.

## Findings

No actionable P0, P1, or P2 visual differences remain for the requested authentication-card scope.

## Follow-up polish

- P3 environment constraint: configure `VITE_GOOGLE_CLIENT_ID` to replace the intentional unavailable state with the real Google Identity button.

## Primary interactions tested

- Login tab to create-account tab navigation.
- Create-account tab back to login navigation.
- Password recovery link target.
- Desktop and mobile responsive states.
- Browser console warnings and errors.

final result: passed
