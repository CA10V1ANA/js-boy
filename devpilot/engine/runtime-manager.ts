import { execSync } from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';

// ============================================================================
// INTERFACES (Tipagem Forte)
// ============================================================================
export interface ProjectIdentity {
  id: string;
  name: string;
  rootPath: string;
  isGit: boolean;
}

export interface RegistryEntry {
  name: string;
  path: string;
  isGit: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export interface Registry {
  projects: Record<string, RegistryEntry>;
}

export interface BootstrapResult {
  runtimeDir: string;
  files: Record<string, 'created' | 'existed'>;
}

// ============================================================================
// MICROETAPA 1: IDENTIFICAÇÃO DO PROJETO
// ============================================================================
export function identifyProject(currentDir: string = process.cwd()): ProjectIdentity {
  let rootPath = currentDir;
  let isGit = false;

  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', { cwd: currentDir, stdio: 'pipe' }).toString().trim();
    rootPath = gitRoot;
    isGit = true;
  } catch (error) {
    isGit = false;
  }

  rootPath = path.resolve(rootPath);
  const name = path.basename(rootPath);
  const hash = crypto.createHash('sha256').update(rootPath).digest('hex').substring(0, 8);

  return { id: hash, name, rootPath, isGit };
}

// ============================================================================
// MICROETAPA 2: REGISTRY
// ============================================================================
export function getRegistryDir(): string {
  const dir = path.join(os.homedir(), '.dev-agent');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function loadRegistry(): Registry {
  const registryPath = path.join(getRegistryDir(), 'registry.json');
  if (!fs.existsSync(registryPath)) return { projects: {} };
  try {
    const content = fs.readFileSync(registryPath, 'utf8');
    return JSON.parse(content) as Registry;
  } catch (error) {
    throw new Error(`\n[ERRO CRÍTICO] O arquivo registry.json está corrompido em: ${registryPath}\n`);
  }
}

function saveRegistry(registry: Registry): void {
  const registryPath = path.join(getRegistryDir(), 'registry.json');
  const tempPath = `${registryPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(registry, null, 2), 'utf8');
  fs.renameSync(tempPath, registryPath);
}

export function registerProject(identity: ProjectIdentity): { entry: RegistryEntry, isNew: boolean } {
  const registry = loadRegistry();
  const now = new Date().toISOString();
  let entry = registry.projects[identity.id];
  let isNew = false;

  if (entry) {
    entry.lastUsedAt = now;
    entry.isGit = identity.isGit;
  } else {
    isNew = true;
    entry = { name: identity.name, path: identity.rootPath, isGit: identity.isGit, createdAt: now, lastUsedAt: now };
    registry.projects[identity.id] = entry;
  }
  saveRegistry(registry);
  return { entry, isNew };
}

// ============================================================================
// MICROETAPA 3: BOOTSTRAP DO RUNTIME
// ============================================================================
function sanitizeName(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function getProjectRuntimeDir(identity: ProjectIdentity): string {
  const projectsDir = path.join(getRegistryDir(), 'projects');
  if (!fs.existsSync(projectsDir)) fs.mkdirSync(projectsDir, { recursive: true });
  
  const runtimeDir = path.join(projectsDir, `${sanitizeName(identity.name)}-${identity.id}`);
  if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });
  
  return runtimeDir;
}

export function bootstrapRuntime(identity: ProjectIdentity): BootstrapResult {
  const runtimeDir = getProjectRuntimeDir(identity);
  const result: BootstrapResult = { runtimeDir, files: {} };

  const templates = {
    'context.md': `# CONTEXTO DO PROJETO: ${identity.name}\n\n## 1. Informações Básicas\n- **Caminho:** ${identity.rootPath}\n- **Stack:** [PREENCHER_STACK]\n\n## 2. Comandos Úteis\n- **Build:** \`npm run build\`\n`,
    'state.md': `# ESTADO ATUAL\n\n<!-- AUTO:START -->\n- **Branch Atual:** indeterminada\n<!-- AUTO:END -->\n\n- **Tarefa Atual:** [DESCREVER]\n- **Status:** Em Andamento\n`,
    'decisions.md': `# DECISÕES ARQUITETURAIS\n\nRegistre aqui apenas decisões permanentes.\n`
  };

  for (const [filename, content] of Object.entries(templates)) {
    const filePath = path.join(runtimeDir, filename);
    if (fs.existsSync(filePath)) {
      result.files[filename] = 'existed';
    } else {
      fs.writeFileSync(filePath, content, 'utf8');
      result.files[filename] = 'created';
    }
  }
  return result;
}

// ============================================================================
// MICROETAPA 4: REFRESH SEGURO DE METADADOS
// ============================================================================
export function safeRefreshMetadata(identity: ProjectIdentity): void {
  const runtimeDir = getProjectRuntimeDir(identity);
  const statePath = path.join(runtimeDir, 'state.md');
  
  if (!fs.existsSync(statePath)) return;

  // 1. Pega os dados automáticos (ex: branch do Git)
  let currentBranch = 'indeterminada';
  if (identity.isGit) {
    try {
      currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: identity.rootPath, stdio: 'pipe' }).toString().trim();
    } catch (e) {
      currentBranch = 'indeterminada (erro git)';
    }
  }

  // 2. Lê o arquivo
  let stateContent = fs.readFileSync(statePath, 'utf8');

  // 3. Substitui APENAS o bloco AUTO com Regex, preservando anotações do usuário
  const autoBlockRegex = /<!-- AUTO:START -->[\s\S]*?<!-- AUTO:END -->/m;
  const newAutoBlock = `<!-- AUTO:START -->\n- **Branch Atual:** ${currentBranch}\n<!-- AUTO:END -->`;

  if (autoBlockRegex.test(stateContent)) {
    stateContent = stateContent.replace(autoBlockRegex, newAutoBlock);
  } else {
    // Fallback: se o usuário deletou os blocos sem querer, recriamos no topo
    stateContent = `${newAutoBlock}\n\n${stateContent}`;
  }

  // 4. Salva o arquivo de volta
  fs.writeFileSync(statePath, stateContent, 'utf8');
}

// ============================================================================
// COMANDO START: O ENTRYPOINT
// ============================================================================
export function start() {
  console.log("🚀 Iniciando /start...");
  const project = identifyProject();
  const regResult = registerProject(project);
  const bootResult = bootstrapRuntime(project);
  
  // O pulo do gato: atualiza metadados sem esmagar o contexto
  safeRefreshMetadata(project);

  console.log(`\n✅ Ambiente pronto para [${project.name}]`);
  console.log(`📁 Contexto isolado em: ${bootResult.runtimeDir}`);
  console.log(`\nAgora o Agente pode carregar silenciosamente o state.md e continuar a tarefa!`);
}

if (require.main === module) {
  start();
}
