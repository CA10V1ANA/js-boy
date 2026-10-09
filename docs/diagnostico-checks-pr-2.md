# Diagnóstico das verificações do PR #2

## Falhas de execução corrigidas

- Gitleaks exigia `GITHUB_TOKEN` para analisar pull requests. O workflow agora usa o token automático do GitHub, com leitura de PRs e comentários automáticos desativados. A nova execução aprovou `secrets`.
- Trivy recebia HTTP 429 ao consultar dependências Maven. Java 21, cache Maven e resolução prévia das dependências permitiram concluir a análise, que revelou 20 ocorrências HIGH/CRITICAL em dependências Java.

## Atualizações e validação local

Foram atualizados Jackson para 2.21.7, Netty para 4.1.137.Final, HttpCore5 para 5.4.3, Tomcat para 10.1.60, PostgreSQL JDBC para 42.7.12 e Commons BeanUtils para 1.11.0. As versões corrigidas indicadas pelo Trivy cobrem 18 das 20 ocorrências. A confirmação pelo scanner remoto do novo candidato permanece necessária.

`mvn verify`, em Java 21: 138 testes unitários e 31 testes de integração aprovados, sem falhas ou testes ignorados. Spring Boot permanece em 3.5.16, com Spring Framework 6.2.19; não foi introduzida uma migração incompatível para Spring Framework 7.

## Dois alertas do Spring ainda requerem resolução

- **CVE-2026-47884:** o registro do fabricante exige `XsltView`, mapeamento `/**` com renderização de view e nome de view implícito. Os controladores da aplicação são REST; não foi encontrado uso de `XsltView` ou configuração de renderização XSLT.
- **CVE-2026-47890:** o registro do fabricante exige SSE com fragmentos de views. Não foi encontrado uso de SSE, `SseEmitter` ou `FragmentsRendering` no código da API.

A versão do pacote continua incluída nos intervalos afetados. A ausência desses recursos é evidência de não aplicabilidade à implementação revisada, não uma correção da biblioteca ou garantia sobre configurações futuras. A versão corrigida pública indicada pelo scanner é 7.0.9; trocar somente o Spring sob Boot 3 não é uma atualização segura. Uma migração para Boot 4 requer revisão de compatibilidade própria.

### Tratamento após a integração na main

As duas ocorrências foram classificadas como não aplicáveis à superfície atual. `.trivyignore.yaml` limita as exceções aos dois IDs e ao PURL exato `spring-webmvc@6.2.19`, com vencimento em **08/11/2026**. Nenhum outro CVE, pacote ou versão é excepcionado. Remover as exceções ao atualizar a biblioteca corrigida; antecipar a revisão se a API passar a usar views, XSLT ou SSE.

`SuperficieRestTest` exige controladores REST, ausência de beans XSLT e ausência de referências a XSLT/SSE/fragmentos nas fontes e configurações de todos os perfis. A análise Trivy depende desse gate; se ele falhar, as exceções não são usadas nessa execução. O teste é conservador e pode exigir revisão mesmo para usos de SSE/views fora das condições exatas dos CVEs. Código gerado, bibliotecas externas configuradas dinamicamente e reflexão requerem revisão adicional: o teste não substitui análise de alterações arquiteturais.

As exceções são uma decisão de aplicabilidade fundamentada nos registros do fabricante, não uma correção das classes afetadas. O gate continua falhando diante de qualquer outro alerta HIGH/CRITICAL com correção disponível ou após o prazo das exceções.

Fontes consultadas: registros publicados pela VMware/Spring no CVE Project:

- https://github.com/CVEProject/cvelistV5/blob/main/cves/2026/47xxx/CVE-2026-47884.json
- https://github.com/CVEProject/cvelistV5/blob/main/cves/2026/47xxx/CVE-2026-47890.json

## Auditoria Java e Cloudflare

A auditoria OWASP estava em execução, sem resultado final disponível. Não foi possível atribuir uma causa definitiva à demora. O workflow passa a concentrar a auditoria Java no Trivy, que efetivamente resolveu e identificou dependências diretas e transitivas neste projeto, enquanto o job `dependencies` mantém `npm audit`. Esta alteração remove a segunda auditoria Java e sua inicialização da base NVD; não equivale a um resultado aprovado do OWASP. Java continua bloqueando a entrega por alertas HIGH/CRITICAL no Trivy. Os jobs agora têm limites de tempo e execuções antigas na mesma branch são canceladas; não há fallback que aprove uma análise indisponível.

O check `Workers Builds: js-boy` pertence à integração externa Cloudflare. O GitHub fornece um link para o painel, mas não expõe o log que permitiria identificar a causa. Não há configuração Wrangler neste projeto. A topologia escolhida é Vercel + Railway + Supabase; se esse Worker não tem função na entrega, desconectar o build deste repositório no painel Cloudflare evita um check alheio à publicação planejada. Nenhuma integração externa foi alterada.

Não foi feito merge nem deploy. CI local aprovado não substitui aprovação dos gates e homologação nos provedores finais.
