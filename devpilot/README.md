# 🤖 Agente Pessoal — Tech Lead (Agent v1)

Este repositório contém a configuração e o motor de execução de um **Agente de Inteligência Artificial** focado em desenvolvimento de software rápido e pragmático, ideal para cenários de **Hackathons**.

O Agente atua como um par de engenharia (Copiloto Tech Lead), guiando decisões arquiteturais, barrando complexidade acidental (*overengineering*) e focando na entrega de valor com segurança.

## 🌟 Principais Características

- **Persona Restrita (Tech Lead):** Programado para questionar abstrações desnecessárias (ex: Kafka, Microserviços e Redis em cenários simples) e focar na entrega mínima viável (KISS).
- **Zero Alucinação (Debugging):** Proibido de adivinhar códigos. Exige evidências técnicas claras e a leitura dos arquivos fontes antes de sugerir patches de correção.
- **Contexto Progressivo (Token Economy):** Ao contrário de assistentes que leem todo o repositório e consomem tokens excessivos, este agente utiliza um *Runtime Manager* para isolar a memória de curto e longo prazo.

## 📂 Estrutura do Agente

```text
personal-agent/
├── core/                  # Regras inquebráveis, Persona e Workflow
├── engine/                # Motor TypeScript (Runtime Manager)
│   └── runtime-manager.ts # Script de bootstrap de contexto
├── evals/                 # Testes comportamentais de sanidade do agente
├── role/                  # Definição do papel especialista (Tech Lead)
└── skills/                # Habilidades específicas (Arquitetura, Debugging, Code Review)
```

## 🚀 Como Utilizar no seu Projeto

Este agente é universal e agnóstico de framework. Para usá-lo em qualquer projeto (ex: Angular, React, Node, Python):

**1. Inicialize a Memória do Projeto**
Abra o terminal no projeto onde você deseja atuar e execute o script do motor (é necessário ter o Node.js instalado):
```bash
npx tsx /caminho/absoluto/para/personal-agent/engine/runtime-manager.ts
```
*(Isso criará uma pasta segura `~/.dev-agent/` no seu computador para armazenar o estado do projeto sem sujar seu repositório local).*

**2. Ative a Inteligência Artificial**
No chat da IA do seu editor de código (Cursor, Antigravity, Windsurf, Copilot), envie o prompt de injeção:
> "A partir de agora, assuma a identidade e aja estritamente de acordo com o meu Agente Pessoal (Persona, Regras, Skills e Comandos) definidos na pasta `/caminho/para/personal-agent/`. O comando `/start` já foi executado. Encontre a memória atual em `~/.dev-agent/projects/`."

## 🛠 Comandos Suportados pela IA

Após ativado, você pode conversar naturalmente com o agente ou usar comandos rápidos:
- `/status`: Mostra a tarefa atual.
- `/plan`: Planeja a próxima implementação, barrando overengineering.
- `/debug`: Auxilia na resolução de bugs (exige leitura do código-fonte real).
- `/review`: Revisa o código baseado em boas práticas de segurança e performance.

---
*Construído com metodologia de isolamento cognitivo para LLMs.*
