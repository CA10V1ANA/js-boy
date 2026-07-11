import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../core/storage/auth_storage.dart';
import '../models/models.dart';
import '../services/services.dart';

enum AuthStatus { carregando, deslogado, logado }

/// Controla a sessao do usuario.
///
/// Fluxo de arranque (bootstrap): se ha token guardado, chama GET /auth/me
/// para validar e recuperar o usuario. Token invalido/expirado -> sessao
/// limpa e tela de login. E o mesmo contrato do painel web.
class AuthController extends ChangeNotifier {
  final AuthStorage storage;
  final AuthService authService;
  final ApiClient client;

  AuthStatus status = AuthStatus.carregando;
  Usuario? usuario;

  AuthController({required this.storage, required this.authService, required this.client}) {
    // 401 em qualquer chamada encerra a sessao (token expirado).
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
    await storage.saveToken(resultado.token);
    usuario = resultado.usuario;
    status = AuthStatus.logado;
    notifyListeners();
  }

  Future<void> logout() async {
    await storage.clear();
    usuario = null;
    status = AuthStatus.deslogado;
    notifyListeners();
  }
}
