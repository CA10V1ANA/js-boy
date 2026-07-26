import 'dart:math';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/auth_storage.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

class ApiClient {
  final Dio dio;
  final AuthStorage storage;
  void Function()? onUnauthorized;
  Future<String?>? _refreshing;

  ApiClient(this.storage)
      : dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 20),
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.readToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        options.headers['X-Correlation-ID'] =
            '${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}';
        handler.next(options);
      },
      onError: (error, handler) async {
        final status = error.response?.statusCode;
        final path = error.requestOptions.path;
        final authRequest = path.contains('/auth/');
        final retried = error.requestOptions.extra['refreshed'] == true;
        if (status == 401 && !authRequest && !retried) {
          try {
            _refreshing ??= _refresh().whenComplete(() => _refreshing = null);
            final token = await _refreshing;
            if (token != null) {
              final request = error.requestOptions;
              request.extra['refreshed'] = true;
              request.headers['Authorization'] = 'Bearer $token';
              return handler.resolve(await dio.fetch(request));
            }
          } catch (_) {
            await storage.clear();
            onUnauthorized?.call();
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<String?> _refresh() async {
    final refresh = await storage.readRefreshToken();
    if (refresh == null) throw StateError('Sessão sem renovação');
    final raw = Dio(BaseOptions(baseUrl: AppConfig.apiUrl));
    final response =
        await raw.post('/auth/refresh', data: {'refreshToken': refresh});
    final data = response.data as Map<String, dynamic>;
    final token = data['token'] as String;
    await storage.saveTokens(token, data['refreshToken'] as String);
    return token;
  }

  ApiException translate(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      final backendMessage =
          data is Map<String, dynamic> ? data['message'] as String? : null;
      if (backendMessage != null && backendMessage.isNotEmpty) {
        return ApiException(backendMessage,
            statusCode: error.response?.statusCode);
      }
      return switch (error.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.receiveTimeout ||
        DioExceptionType.connectionError =>
          ApiException('Sem conexão com o servidor. Verifique sua internet.'),
        _ => ApiException('Erro inesperado. Tente novamente.',
            statusCode: error.response?.statusCode),
      };
    }
    return ApiException('Erro inesperado. Tente novamente.');
  }
}
