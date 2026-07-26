# Verificação de acessibilidade — P1

## Cobertura automatizada e por inspeção

- foco visível em links, botões e campos do painel web;
- diálogos com `role="dialog"`, nome, descrição, foco inicial e fechamento por Escape;
- estados de carregamento e sucesso anunciados por região viva;
- erros anunciados como alerta e com ação de tentar novamente;
- áreas de toque com pelo menos 44 px;
- menu limitado ao perfil autenticado;
- cartões móveis sem depender apenas de cor para indicar status;
- `Semantics` no carregamento e nos cartões operacionais do Flutter;
- layouts com quebra de linha e rolagem interna de modal sob aumento de fonte.

## Verificação manual ainda necessária em aparelho

Antes da publicação, executar:

1. Android com TalkBack em 100%, 150% e 200% de fonte;
2. iOS com VoiceOver em 100%, 135% e 200% de texto;
3. navegação completa por teclado no Chrome, Firefox e Edge;
4. contraste com o modo de alto contraste do sistema;
5. rotação retrato/paisagem nos tamanhos de tela homologados.

Registre aparelho, versão do sistema, resultado e evidência no checklist de
homologação. Falhas de leitura, foco ou corte de conteúdo bloqueiam a versão.
