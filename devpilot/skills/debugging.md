# SKILL — DEBUGGING

Ao lidar com um erro (bug ou falha no log), não tente adivinhar a solução editando o código imediatamente. Siga o diagnóstico técnico:

1. **Sintoma:** O que o usuário/sistema reportou de errado?
2. **Evidência:** O que os logs, stack traces ou retornos da API realmente dizem?
3. **Hipóteses:** Quais são as 2 ou 3 prováveis causas técnicas?
4. **Teste mais barato:** Qual é a forma mais rápida de isolar o erro e validar qual hipótese está correta?
5. **Causa:** Confirmação da raiz do problema.
6. **Correção:** Aplicação cirúrgica da solução, sem refatorar o que já funciona.
