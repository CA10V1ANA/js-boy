import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';

import '../core/api/api_client.dart';

class ProofQueueService {
  static const _queueKey = 'jsboy.offline.proofs.v1';
  final ApiClient client;
  final FlutterSecureStorage storage;
  final ImagePicker picker;

  ProofQueueService(this.client, [FlutterSecureStorage? storage, ImagePicker? picker])
      : storage = storage ?? const FlutterSecureStorage(),
        picker = picker ?? ImagePicker();

  Future<bool> capturarEntrega(String entregaId, String recebedorNome) async {
    final image = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 82,
      maxWidth: 1920,
      maxHeight: 1920,
    );
    if (image == null) return false;
    final directory = await getApplicationSupportDirectory();
    final proofDirectory = Directory('${directory.path}${Platform.pathSeparator}proof-queue');
    await proofDirectory.create(recursive: true);
    final id = '${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}';
    final saved = await File(image.path).copy('${proofDirectory.path}${Platform.pathSeparator}$id.jpg');
    final queue = await _queue();
    queue.add({'id': id, 'entregaId': entregaId, 'path': saved.path, 'recebedorNome': recebedorNome});
    await _save(queue);
    try {
      await sincronizar();
      return true;
    } on DioException {
      return true;
    }
  }

  Future<void> sincronizar() async {
    final queue = await _queue();
    final remaining = <Map<String, dynamic>>[];
    for (final proof in queue) {
      final file = File(proof['path'] as String);
      if (!await file.exists()) {
        remaining.add(proof);
        continue;
      }
      try {
        final form = FormData.fromMap({
          'tipo': 'ENTREGA',
          'recebedorNome': proof['recebedorNome'],
          'arquivo': await MultipartFile.fromFile(file.path, filename: 'comprovante.jpg'),
        });
        await client.dio.post(
          '/operacao-entregador/entregas/${proof['entregaId']}/comprovantes',
          data: form,
          options: Options(headers: {'Idempotency-Key': proof['id']}),
        );
        await file.delete();
      } on DioException {
        remaining.add(proof);
        remaining.addAll(queue.skip(queue.indexOf(proof) + 1));
        break;
      }
    }
    await _save(remaining);
  }

  Future<int> quantidadePendente() async => (await _queue()).length;
  Future<List<Map<String, dynamic>>> _queue() async {
    final raw = await storage.read(key: _queueKey);
    if (raw == null) return [];
    return (jsonDecode(raw) as List<dynamic>).map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }
  Future<void> _save(List<Map<String, dynamic>> queue) =>
      storage.write(key: _queueKey, value: jsonEncode(queue));
}
