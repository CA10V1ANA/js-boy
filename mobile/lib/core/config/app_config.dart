import 'package:flutter/foundation.dart';

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
  static const mapsProvider = String.fromEnvironment('MAPS_PROVIDER', defaultValue: 'google');
  static const _configuredApiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );

  static String get apiUrl => validateApiUrl(
        _configuredApiUrl,
        releaseMode: kReleaseMode,
      );

  @visibleForTesting
  static String validateApiUrl(
    String value, {
    required bool releaseMode,
  }) {
    final uri = Uri.tryParse(value.trim());
    final supportedScheme = uri?.scheme == 'http' || uri?.scheme == 'https';

    if (uri == null || !uri.hasAuthority || !supportedScheme) {
      throw StateError('API_URL deve ser uma URL HTTP(S) absoluta.');
    }
    if (releaseMode && uri.scheme != 'https') {
      throw StateError('API_URL deve usar HTTPS em builds de release.');
    }

    return uri.toString().replaceFirst(RegExp(r'/$'), '');
  }
}
