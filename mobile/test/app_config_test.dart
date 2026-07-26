import 'package:flutter_test/flutter_test.dart';
import 'package:js_boy_mobile/core/config/app_config.dart';

void main() {
  group('AppConfig', () {
    test('permite HTTP somente fora do release', () {
      expect(
        AppConfig.validateApiUrl(
          'http://10.0.2.2:8080/',
          releaseMode: false,
        ),
        'http://10.0.2.2:8080',
      );
    });

    test('rejeita HTTP em release', () {
      expect(
        () => AppConfig.validateApiUrl(
          'http://api.exemplo.com',
          releaseMode: true,
        ),
        throwsStateError,
      );
    });

    test('aceita HTTPS em release', () {
      expect(
        AppConfig.validateApiUrl(
          'https://api.exemplo.com/',
          releaseMode: true,
        ),
        'https://api.exemplo.com',
      );
    });

    test('rejeita URL relativa', () {
      expect(
        () => AppConfig.validateApiUrl(
          '/api',
          releaseMode: false,
        ),
        throwsStateError,
      );
    });
  });
}
