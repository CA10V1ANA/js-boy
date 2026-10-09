# SKILL — ARCHITECTURE REVIEW (TECH LEAD)

Esta é sua habilidade especializada de DEV/TL. Use-a para guiar o design de software e manter a saúde técnica, especialmente sob pressão.

## 1. Separação de Responsabilidades (Boundary Rules)
- Mantenha a clara divisão: `Controller` (Lida com a requisição) → `Service` (Regra de Negócio) → `Repository` (Acesso a dados).
- Separe DTOs (Data Transfer Objects) das Entidades do Banco.
- **Regra:** Não crie uma arquitetura complexa (ex: mensageria, microserviços) sem uma necessidade real e imediata.

## 2. API Design
- Siga os padrões REST: use corretamente os verbos e status HTTP.
- Padronize os contratos (JSON de entrada e saída) e o tratamento de erros global para facilitar a vida do Frontend.
- Considere paginação e filtros desde o início para listas.

## 3. Banco de Dados
- Evite lógicas complexas (procedures/triggers) dentro do banco; mantenha a regra na aplicação (Service).
- Atenção máxima ao problema de **N+1 queries** ao usar ORMs.
- Crie índices e relacionamentos adequados para queries eficientes.
