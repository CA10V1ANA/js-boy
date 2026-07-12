/// Configuracao de ambiente do app.
///
/// A URL da API e injetada em tempo de build:
///   flutter run --dart-define=API_URL=http://192.168.0.10:8080
///
/// Padroes por plataforma:
/// - Emulador Android: 10.0.2.2 aponta para o localhost da sua maquina.
/// - Simulador iOS / desktop: localhost funciona direto.
/// - Celular fisico: use o IP da sua maquina na rede local (ex.: 192.168.x.x).
class AppConfig {
  static const apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );
}
