import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Guarda o token JWT no armazenamento seguro do sistema
/// (Keystore no Android, Keychain no iOS) - nunca em texto plano.
class AuthStorage {
  static const _tokenKey = 'jsboy.token';

  final FlutterSecureStorage _storage;

  AuthStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<void> clear() => _storage.delete(key: _tokenKey);
}
