import 'dart:convert';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/api/api_client.dart';
import '../models/models.dart';

class OfflineLoadResult {
  final List<Entrega> entregas;
  final bool offline;
  final int acoesPendentes;
  const OfflineLoadResult(this.entregas, {required this.offline, required this.acoesPendentes});
}

class OfflineOperationService {
  static const _cacheKey = 'jsboy.offline.entregas.v1';
  static const _queueKey = 'jsboy.offline.queue.v1';
  final ApiClient client;
  final FlutterSecureStorage storage;

  OfflineOperationService(this.client, [FlutterSecureStorage? storage])
      : storage = storage ?? const FlutterSecureStorage();

  Future<OfflineLoadResult> carregar() async {
    try {
      await sincronizar();
      final response = await client.dio.get('/entregas/minhas-entregas');
      final raw = response.data as List<dynamic>;
      await storage.write(key: _cacheKey, value: jsonEncode(raw));
      return OfflineLoadResult(
        raw.map((item) => Entrega.fromJson(item as Map<String, dynamic>)).toList(),
        offline: false,
        acoesPendentes: await quantidadePendente(),
      );
    } on DioException catch (error) {
      if (!_isNetwork(error)) rethrow;
      final cached = await storage.read(key: _cacheKey);
      if (cached == null) throw client.translate(error);
      final raw = jsonDecode(cached) as List<dynamic>;
      return OfflineLoadResult(
        raw.map((item) => Entrega.fromJson(item as Map<String, dynamic>)).toList(),
        offline: true,
        acoesPendentes: await quantidadePendente(),
      );
    }
  }

  Future<bool> alterarStatus(String entregaId, StatusEntrega status) async {
    final action = <String, dynamic>{
      'id': _key(),
      'entregaId': entregaId,
      'status': status.api,
      'criadaEm': DateTime.now().toUtc().toIso8601String(),
    };
    final queue = await _queue()..add(action);
    await _saveQueue(queue);
    try {
      await sincronizar();
      return true;
    } on DioException catch (error) {
      if (_isNetwork(error)) return false;
      rethrow;
    }
  }

  Future<void> sincronizar() async {
    final queue = await _queue();
    if (queue.isEmpty) return;
    final remaining = <Map<String, dynamic>>[];
    for (final action in queue) {
      try {
        await client.dio.post(
          '/operacao-entregador/offline/entregas/${action['entregaId']}/status',
          data: {'status': action['status']},
          options: Options(headers: {'Idempotency-Key': action['id']}),
        );
      } on DioException catch (error) {
        if (_isNetwork(error)) {
          remaining.add(action);
          remaining.addAll(queue.skip(queue.indexOf(action) + 1));
          break;
        }
        if (error.response?.statusCode == 409) {
          remaining.add(action);
          break;
        }
        rethrow;
      }
    }
    await _saveQueue(remaining);
  }

  Future<int> quantidadePendente() async => (await _queue()).length;

  Future<List<Map<String, dynamic>>> _queue() async {
    final value = await storage.read(key: _queueKey);
    if (value == null) return [];
    return (jsonDecode(value) as List<dynamic>)
        .map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }
  Future<void> _saveQueue(List<Map<String, dynamic>> queue) =>
      storage.write(key: _queueKey, value: jsonEncode(queue));
  bool _isNetwork(DioException error) => {
    DioExceptionType.connectionError,
    DioExceptionType.connectionTimeout,
    DioExceptionType.receiveTimeout,
    DioExceptionType.sendTimeout,
  }.contains(error.type);
  String _key() => '${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}';
}
