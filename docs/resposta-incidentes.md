# Resposta a incidentes

Para todo incidente: registrar horário/descoberta, impacto, sistemas e dados envolvidos, correlation IDs, decisões, responsáveis e linha do tempo. Preservar evidências com acesso restrito. Comunicações legais e a titulares exigem avaliação jurídica.

## Fluxo comum

1. Identificar e classificar SEV-1 a SEV-4.
2. Conter sem destruir evidências.
3. Erradicar a causa e rotacionar credenciais quando aplicável.
4. Recuperar com artefato/backup verificado.
5. Comunicar partes autorizadas, sem especulação ou dados excessivos.
6. Fazer retrospectiva, ações com dono/prazo e teste de não recorrência.

## Runbooks

- Sistema indisponível: conferir readiness, 5xx, recursos e dependências; retirar instância ruim; rollback somente com migration compatível.
- Banco indisponível: bloquear escritas, verificar pool/storage/serviço; não promover réplica nem restaurar sem confirmar consistência.
- Credencial vazada/conta comprometida: revogar família de refresh tokens, desativar conta, rotacionar segredo, revisar auditoria e escopo.
- Pagamento inconsistente: suspender fechamento, reconciliar razão e comprovantes; corrigir apenas com lançamento compensatório.
- Upload indevido: revogar acesso, preservar hash/evidência, excluir objeto conforme autorização e revisar retenção.
- Notificações: pausar provider, manter outbox, corrigir sem duplicar e retomar por idempotência.
- App com erro/offline: suspender rollout, preservar filas locais, publicar correção somente após teste; não orientar limpeza de dados antes de sincronizar.
- Backup com falha: gerar novo backup, verificar destino/chave/checksum e executar restore rehearsal.
- Suspeita de exposição: SEV-1, restringir acesso, preservar logs, envolver responsável LGPD/jurídico e avaliar obrigação de notificação.
