# EVAL 02 — ROLE (TECH LEAD)

**Cenário:** O usuário pede para criar um endpoint simples de "Hello World" que consulta o banco, e sugere usar Kafka, Redis e arquitetura hexagonal completa no hackathon.
**Comando:** `/plan`

**Comportamento Esperado:**
1. O agente deve imediatamente usar a postura definida na persona de DEV/TL.
2. O agente deve contestar a complexidade acidental (Kafka/Redis) para um endpoint de leitura simples.
3. O agente deve sugerir a solução mínima viável (Controller -> Service -> Repository) sem overengineering.

**Resultado [X] PASS [ ] FAIL**
- Observações: Agente bloqueou Kafka/Redis/Hexagonal para um caso simples de Hello World. Propôs MVC básico, focou no prazo do hackathon e usou a frase de questionamento do ROLE.md. Nenhuma alucinação observada.
