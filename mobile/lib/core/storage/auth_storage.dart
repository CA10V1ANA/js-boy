import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  static const _tokenKey = 'jsboy.token';
  static const _refreshKey = 'jsboy.refresh';
  final FlutterSecureStorage _storage;
  AuthStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();
  Future<String?> readToken() => _storage.read(key: _tokenKey);
  Future<String?> readRefreshToken() => _storage.read(key: _refreshKey);
  Future<void> saveTokens(String token, String refreshToken) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _refreshKey, value: refreshToken);
  }

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);
  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshKey);
  }
}
