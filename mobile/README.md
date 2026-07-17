# JS BOY Mobile

App operacional do JS BOY (entregas empresariais) em **Flutter**, consumindo a mesma API Spring Boot do painel web.

- **Navegação**: Tab Bar inferior + FAB âmbar "Nova entrega" (padrão iOS/Android)
- **Perfis**: PROPRIETARIO (operação completa), FUNCIONARIO (dashboard + clientes), ENTREGADOR (minhas entregas com avanço de status)
- **Design**: mesmos tokens do painel web v4 (creme `#F4F2EC`, âmbar `#E9A81C`, Archivo + Hanken Grotesk)
- **Sessão**: token JWT no armazenamento seguro (Keystore/Keychain), revalidado no arranque via `GET /auth/me`; 401 encerra a sessão automaticamente

## Requisitos

1. [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.19+ (`flutter doctor` sem erros)
2. Backend JS BOY rodando (`docker-compose up` na raiz do projeto web)

## Primeira execução

Este diretório contém `lib/` e `pubspec.yaml`. As pastas de plataforma (`android/`, `ios/`) são geradas na sua máquina:

```bash
cd mobile

# 1. Gera android/, ios/ etc. (rode UMA vez)
flutter create . --org com.ravtec --project-name js_boy_mobile

# 2. Baixa as dependências
flutter pub get

# 3. Roda o app
flutter run
```

### Apontando para a API

A URL da API entra por `--dart-define` (padrão: `http://10.0.2.2:8080`):

| Onde você roda | Comando |
|---|---|
| **Emulador Android** | `flutter run` (o padrão `10.0.2.2` já aponta pro localhost do seu PC) |
| **Celular físico** (mesma rede Wi-Fi) | `flutter run --dart-define=API_URL=http://SEU_IP_LOCAL:8080` |
| **Simulador iOS / desktop** | `flutter run --dart-define=API_URL=http://localhost:8080` |

> Descubra seu IP local com `ipconfig` (Windows) ou `ifconfig` (Mac/Linux). No celular físico, o backend precisa aceitar conexões da rede (o docker-compose já publica a porta 8080).

> **Android + HTTP**: em desenvolvimento, se a API for `http://` (sem TLS), adicione `android:usesCleartextTraffic="true"` na tag `<application>` de `android/app/src/main/AndroidManifest.xml` (a pasta existe após o passo 1).

Login de teste (seed do backend): `proprietario@jsboy.com` / `admin123`.

### Rodar direto no celular físico (Windows)

Com o celular conectado por USB e "Depuração USB" ativada, dê duplo clique em `run.bat` (ou rode no `cmd`). Ele:

1. Localiza o celular físico conectado via `adb` (ignorando emuladores)
2. Detecta automaticamente o IP local do notebook na rede Wi-Fi
3. Chama `flutter run` já apontando `API_URL` para esse IP (`http://SEU_IP:8080`)

Não mexe em Docker nem instala nada — só o backend (`docker-compose up`) precisa estar rodando. Celular e notebook precisam estar na **mesma rede Wi-Fi**. Se a detecção automática do IP falhar, o script pede para digitar manualmente.

## Estrutura

```
lib/
├── main.dart              # bootstrap
├── app.dart               # providers + roteamento por estado de auth
├── core/
│   ├── api/               # ApiClient (Dio): Bearer token + tratamento de 401
│   ├── config/            # API_URL via --dart-define
│   ├── format/            # dinheiro, datas, iniciais
│   ├── storage/           # token no armazenamento seguro
│   └── theme/             # tokens do design v4
├── models/                # espelho dos DTOs do backend (fromJson manual)
├── services/              # um service por recurso da API
├── state/                 # AuthController (ChangeNotifier)
├── widgets/               # StatusBadge, AvatarTile, PanelCard, KpiCard…
└── features/              # uma pasta por tela
    ├── auth/  shell/  dashboard/  entregas/  clientes/
    ├── entregadores/  pagamentos/  relatorios/
    ├── funcionarios/  config/  minhas_entregas/  mais/
```

Decisões para quem está começando:
- **provider + ChangeNotifier** (sem Riverpod/Bloc): o mínimo de conceitos novos.
- **fromJson manual** (sem build_runner): você vê exatamente como o JSON vira objeto.
- **Navigator simples** (sem go_router): telas secundárias são `push`, o shell é `IndexedStack`.

## Comandos úteis

```bash
flutter analyze          # lint/erros estáticos
flutter test             # testes
flutter build apk        # APK de release (Android)
```

## Publicando este app em um repositório próprio

Este diretório é autossuficiente. Para extrair para um repositório separado:

```bash
# fora da pasta js-boy
cp -r js-boy/mobile js-boy-mobile
cd js-boy-mobile
git init
git add .
git commit -m "JS BOY Mobile: app Flutter inicial"

# crie o repositório vazio no GitHub (ex.: ca10v1ana/js-boy-mobile) e:
git remote add origin https://github.com/SEU_USUARIO/js-boy-mobile.git
git branch -M main
git push -u origin main
```
