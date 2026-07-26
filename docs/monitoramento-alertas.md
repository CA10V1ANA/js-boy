# Monitoramento, logs e alertas

O endpoint público `/api/health` expõe apenas status e nome. Liveness, readiness e Prometheus ficam na porta de gestão `9090`, em rede privada.

Métricas iniciais:

- HTTP: taxa, latência p50/p95/p99 e respostas 4xx/5xx.
- JVM/processo: memória, GC, threads, CPU e disco.
- Hikari/PostgreSQL: conexões, espera, timeout e indisponibilidade.
- `jsboy.auth.login{result}`.
- `jsboy.notifications.pending` e `jsboy.notifications.failed`.
- erros de upload e sincronização mobile, a instrumentar por evento quando novos providers forem adicionados.
- idade do último backup bem-sucedido, publicada pelo executor de backup.

Alertas:

| Severidade | Condição inicial | Resposta |
|---|---|---|
| SEV-1 | indisponível > 5 min, possível vazamento, banco/backup irrecuperável | imediata |
| SEV-2 | 5xx > 5%/10 min, p95 > 2 s/15 min, outbox falha crescente | até 30 min |
| SEV-3 | disco > 80%, backup > 26 h, pool > 80%, falhas login anormais | horário comercial |
| SEV-4 | tendência/capacidade sem impacto | planejamento |

Logs são JSON com timestamp, ambiente, serviço, nível, `correlation_id` e `user_id` quando autenticado. Frontend e mobile enviam `X-Correlation-ID`. Não registrar senha, JWT/refresh token, reset token, documentos completos, fotos, localização, payload integral ou PII desnecessária.
