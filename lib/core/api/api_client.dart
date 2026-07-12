import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/auth_storage.dart';

/// Erro de API ja traduzido para exibicao: as telas mostram [message]
/// direto num SnackBar sem precisar conhecer Dio.
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// Cliente HTTP central: injeta o Bearer token em toda requisicao e,
/// ao receber 401 fora do login, dispara [onUnauthorized] para o
/// AuthController encerrar a sessao (mesmo comportamento do web).
class ApiClient {
  final Dio dio;
  final AuthStorage storage;

  void Function()? onUnauthorized;

  ApiClient(this.storage)
      : dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 20),
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.readToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        final status = error.response?.statusCode;
        final isLogin = error.requestOptions.path.contains('/auth/login');

        if (status == 401 && !isLogin) {
          onUnauthorized?.call();
        }

        handler.next(error);
      },
    ));
  }

  /// Converte falhas do Dio em [ApiException] com mensagem amigavel,
  /// aproveitando o campo `message` do GlobalExceptionHandler do backend.
  ApiException translate(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      final backendMessage = data is Map<String, dynamic> ? data['message'] as String? : null;

      if (backendMessage != null && backendMessage.isNotEmpty) {
        return ApiException(backendMessage, statusCode: error.response?.statusCode);
      }

      return switch (error.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.receiveTimeout ||
        DioExceptionType.connectionError =>
          ApiException('Sem conexao com o servidor. Verifique sua internet.'),
        _ => ApiException('Erro inesperado. Tente novamente.', statusCode: error.response?.statusCode),
      };
    }

    return ApiException('Erro inesperado. Tente novamente.');
  }
}
