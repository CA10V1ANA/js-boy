# Implantação — homologação e produção

Este procedimento prepara a implantação; não executa deploy. Toda promoção para produção exige aprovação manual no ambiente protegido do GitHub.

## Ambientes

| Ambiente | Perfil | Banco | Exposição |
|---|---|---|---|
| local | `local` | H2 ou PostgreSQL local | loopback |
| teste | `test` | PostgreSQL efêmero/Testcontainers | CI |
| homologação | `staging` | PostgreSQL isolado | HTTPS, acesso restrito |
| produção | `prod` | PostgreSQL dedicado | HTTPS via proxy/WAF |

Nunca reutilizar banco, bucket, chaves JWT, credenciais ou domínios entre ambientes.

## Segredos e variáveis

Segredos obrigatórios: senha PostgreSQL, `JWT_SECRET` aleatório (mínimo 32 bytes), credenciais do storage privado, notificações e recuperação de senha, chave de criptografia de backup e assinatura mobile. Devem vir do secret manager/config tree, nunca de Git, imagem ou log.

Configuração não secreta:

```text
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/jsboy
SPRING_DATASOURCE_USERNAME=jsboy
CORS_ALLOWED_ORIGINS=https://app.exemplo.com
PUBLIC_API_URL=https://api.exemplo.com
MANAGEMENT_PORT=9090
JWT_EXPIRATION_MINUTES=15
REFRESH_TOKEN_DAYS=30
LOGIN_MAX_FAILURES=5
LOGIN_LOCK_MINUTES=15
APP_STORAGE_PROVIDER=<provider-privado>
APP_STORAGE_MAX_FILE_BYTES=5242880
APP_NOTIFICATIONS_PROVIDER=<provider-configurado>
APP_PASSWORD_RESET_PROVIDER=<provider-configurado>
BUSINESS_TIME_ZONE=America/Fortaleza
```

## Ordem segura

1. Confirmar backup válido e restauração ensaiada.
2. Revisar migrations: somente aditivas/compatíveis; `flyway clean` permanece desabilitado.
3. Executar CI, security gates e homologação sem bloqueadores/críticos.
4. Gerar artefatos imutáveis e registrar SHA-256.
5. Aplicar migrations com uma única instância, antes de aumentar réplicas.
6. Subir backend e aguardar `/actuator/health/readiness` na rede de gestão.
7. Subir frontend/proxy, executar smoke tests e observar métricas/logs.
8. Liberar tráfego gradualmente.

Banco e Actuator não devem possuir porta pública. TLS termina no proxy; tráfego interno deve ficar em rede privada. O proxy deve remover headers `X-Forwarded-*` fornecidos pelo cliente e inserir os valores confiáveis.

## Rollback

Rollback de aplicação usa a imagem anterior somente quando a migration é retrocompatível. Não executar downgrade destrutivo do banco. Se uma migration impedir rollback, corrigir com nova migration. Restauração de banco é último recurso e exige decisão de incidente, janela, confirmação explícita e avaliação de perda dentro do RPO.

## Checklist antes do deploy

- [ ] Domínios, certificados, CORS e CSP revisados.
- [ ] Secrets diferentes por ambiente e rotação registrada.
- [ ] Storage privado configurado; provider `local` não usado em produção.
- [ ] E-mail/WhatsApp/SMS e password reset testados sem conteúdo sensível em logs.
- [ ] Backup recente, checksum válido e restore rehearsal aprovado.
- [ ] Alertas e responsáveis de plantão configurados.
- [ ] Sem H2, Swagger ou portas de desenvolvimento expostas.
- [ ] Artefatos, SBOM/auditorias e hashes arquivados.
- [ ] Homologação aprovada; zero bloqueadores e críticos.

Custos externos possíveis: hospedagem/containers, PostgreSQL gerenciado, object storage, CDN/WAF, monitoramento, e-mail/SMS/WhatsApp, domínio/certificado, backup separado e contas Apple/Google. Nenhum foi contratado.
