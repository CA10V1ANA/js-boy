# Temas e internacionalização da web

O frontend permite escolher tema claro/escuro e português, inglês ou espanhol. As preferências são locais ao navegador e permanecem após recarregar a página. Português e tema claro são os padrões. Controles ficam no cabeçalho público, no painel autenticado e nas páginas avulsas de verificação de e-mail e rastreamento.

## Arquivos de mensagens

Todos ficam em `frontend/src/i18n/messages/`, em UTF-8:

- `messages.properties`: inglês.
- `messages_es.properties`: espanhol.
- `messages_pt.properties`: português, idioma padrão e fallback.

As chaves são iguais nos três arquivos. Exemplo do menu lateral:

```properties
# messages.properties
pagamento.aba.esquerda=Payments

# messages_es.properties
pagamento.aba.esquerda=Pagos

# messages_pt.properties
pagamento.aba.esquerda=Pagamentos
```

Na aplicação:

```tsx
import { message, useLocale } from '../i18n';

export function Exemplo() {
  useLocale(); // Atualiza o componente quando o usuário troca de idioma.
  return <span>{message('pagamento.aba.esquerda')}</span>;
}
```

Para valores variáveis, use parâmetros nomeados e frases completas:

```properties
pagamento.confirme.o.recebimento.de.value=Confirm receipt of {{value1}}.
```

```tsx
message('pagamento.confirme.o.recebimento.de.value', { value1: formatMoney(valor) });
```

Evite montar frases traduzidas palavra por palavra. Textos com sentidos distintos têm chaves próprias por área. As chaves identificam mensagens e devem permanecer estáveis quando a redação mudar. Configurações de interface definidas fora dos componentes usam funções para resolver os textos no idioma atual.

## Regras de domínio

Datas e valores usam o idioma selecionado. A moeda continua sendo BRL. Os códigos da API, os filtros, a persistência financeira e os formatos de entrada permanecem independentes dos rótulos traduzidos.

“Entregador” usa “courier” e “repartidor”; “estorno” usa “refund” e “devolución de pago”; o faturamento do entregador continua descrevendo o valor dos serviços, sem sugerir comissão ou ganho pessoal. Nomes, endereços, mercadorias, conversas e observações informadas por usuários não são traduzidos.

`i18n/domain.ts` apresenta códigos conhecidos no idioma escolhido. `i18n/server.ts` localiza mensagens de sistema conhecidas e os bloqueios de finalização conforme o perfil. Mensagens desconhecidas enviadas pela API são preservadas para não ocultar detalhes. E-mails e demais conteúdos produzidos pelo backend continuam no idioma de origem; este trabalho não altera contratos nem o backend.

## Preferências e cores

`preferences.ts` gerencia `jsboy.locale` e `jsboy.theme` no armazenamento local, sincroniza abas e atualiza `html.lang`, `data-theme`, o esquema de cores nativo e a cor do navegador. As escolhas continuam funcionando durante a sessão se o navegador bloquear o armazenamento.

`themes.css` define os tokens do modo escuro. Os estilos existentes mantêm suas cores claras como fallback. Não se usa inversão de imagens ou filtros de cor. Mantêm-se o amarelo da marca, a hierarquia de superfícies e as cores semânticas de estado.

## Verificação

```powershell
cd frontend
npm.cmd test
npm.cmd run build
```

Os testes verificam consistência de chaves e parâmetros entre idiomas, leitura de `.properties`, tradução de termos operacionais, troca de idioma nas validações, persistência/sincronização de preferências, navegação e contadores, filtros de entregas e bloqueios financeiros. A aprovação dos testes e do build local não constitui homologação em produção.
