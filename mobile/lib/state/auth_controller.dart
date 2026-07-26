import 'package:flutter/foundation.dart';
import '../core/api/api_client.dart';
import '../core/storage/auth_storage.dart';
import '../models/models.dart';
import '../services/services.dart';

enum AuthStatus { carregando, deslogado, logado }

class AuthController extends ChangeNotifier {
  final AuthStorage storage;
  final AuthService authService;
  final ApiClient client;
  AuthStatus status = AuthStatus.carregando;
  Usuario? usuario;

  AuthController(
      {required this.storage,
      required this.authService,
      required this.client}) {
    client.onUnauthorized = logout;
    _bootstrap();
  }
  Future<void> _bootstrap() async {
    final token = await storage.readToken();
    if (token == null) {
      status = AuthStatus.deslogado;
      notifyListeners();
      return;
    }
    try {
      usuario = await authService.me();
      status = AuthStatus.logado;
    } catch (_) {
      await storage.clear();
      status = AuthStatus.deslogado;
    }
    notifyListeners();
  }

  Future<void> login(String email, String senha) async {
    final resultado = await authService.login(email, senha);
    await storage.saveTokens(resultado.token, resultado.refreshToken);
    usuario = resultado.usuario;
    status = AuthStatus.logado;
    notifyListeners();
  }

  Future<void> logout() async {
    final refresh = await storage.readRefreshToken();
    if (refresh != null) {
      try {
        await authService.logout(refresh);
      } catch (_) {}
    }
    await storage.clear();
    usuario = null;
    status = AuthStatus.deslogado;
    notifyListeners();
  }
}
