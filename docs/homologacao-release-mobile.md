# Homologação e release mobile

Classificação: Bloqueador (sem operação/risco imediato), Crítico (segurança, privacidade ou financeiro), Alto (fluxo principal degradado), Médio (alternativa existente), Baixo (cosmético). Produção só pode ser recomendada sem bloqueadores ou críticos.

## Proprietário

- [ ] Criar/editar/inativar cliente e entregador; criar acessos.
- [ ] Criar, confirmar, agendar, designar e acompanhar entrega.
- [ ] Registrar pagamento idempotente e estorno compensatório.
- [ ] Registrar despesa/taxa/repasse; fechar e reabrir com auditoria.
- [ ] Gerar/revogar rastreamento; consultar exceções, relatório e auditoria.
- [ ] Exportar cliente, registrar solicitação LGPD e anonimizar em cenário autorizado.

## Entregador

- [ ] Login, refresh e logout/revogação.
- [ ] Somente entregas próprias.
- [ ] Origem/destino em mapas; ligação, WhatsApp e copiar endereço.
- [ ] Coleta, rota, foto/comprovante, entrega, falha e devolução.
- [ ] Sem rede: cache, fila, indicador, reinício do app, sincronização sem duplicar.
- [ ] Conflito mantém ação pendente e não sobrescreve silenciosamente.

## Cliente

- [ ] Login; somente dados próprios.
- [ ] Solicitar entrega simples/agendada.
- [ ] Acompanhar status, histórico, valores, pagamentos e comprovante.
- [ ] Rastreamento válido/expirado/revogado sem PII.
- [ ] Preferências, contato e privacidade.

## Release mobile

- Identificador preparado: `br.com.jsboy.entregas` (confirmar titularidade antes das lojas).
- Nome: JS Boy Entregas; versão vem de `pubspec.yaml`.
- Release Android nunca usa chave debug; `key.properties` e keystore ficam fora do Git.
- iOS exige certificado/provisioning no ambiente seguro.
- Somente INTERNET e CAMERA são solicitadas; localização e storage amplo não são declarados.
- Build release exige `--dart-define=API_URL=https://...` e pode usar `MAPS_PROVIDER=google|apple|osm`.
- Validar ícone/splash da marca em aparelhos reais, política publicada, descrição e screenshots sem dados reais.
- Executar TalkBack/VoiceOver, fonte 200%, contraste, alvos de toque e câmera/permissão negada.
- Testar Android/iOS reais, rede lenta/offline, atualização sobre versão anterior e filas preservadas.

Nenhum certificado, chave, upload para loja ou publicação foi criado/executado.
