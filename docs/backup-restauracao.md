# Backup e restauração

Meta inicial para revisão operacional: RPO de 24 horas e RTO de 4 horas. Para maior volume, adotar backup diário + WAL/PITR, reduzindo RPO para até 15 minutos.

- Backup lógico diário após menor movimento.
- Retenção sugerida: 7 diários, 5 semanais e 12 mensais, conforme política jurídica/financeira.
- Criptografia com `age`; chave privada fica fora do host e do repositório.
- Cópia em conta/região separada, com versionamento e proteção contra exclusão.
- Checksum SHA-256 e `pg_restore --list` em todo backup.
- Ensaio mensal automatizado em banco isolado; ensaio trimestral acompanhado pelo responsável.
- Responsável primário: operador designado pela JS Boy; substituto deve estar registrado.

`ops/backup-postgres.sh` cria arquivo custom format, valida, cifra e gera checksum. A linha de retenção apenas lista candidatos; exclusão deve ser feita por lifecycle controlado do storage. `ops/restore-rehearsal.sh` recusa `production` e exige nome de banco de teste.

## Simulação

1. Criar PostgreSQL isolado, vazio e identificado como `restore_rehearsal`.
2. Definir `RESTORE_TARGET_ENV=test`, credenciais, arquivo e identidade `age`.
3. Executar `sh ops/restore-rehearsal.sh`.
4. Conferir migrations, contagens essenciais, login de teste e integridade de entregas/pagamentos.
5. Registrar duração, tamanho, checksum, data e responsável.
6. Descartar o ambiente de ensaio de forma controlada.

O workflow `Backup restore rehearsal` executa essa simulação mensalmente. Nunca restaurar sobre produção sem confirmação explícita, aprovação do incidente e backup prévio do estado atual.
