import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/config/app_config.dart';

class ExternalActionsService {
  Future<bool> abrirMapa(String endereco) {
    final query = Uri.encodeComponent(endereco);
    final url = switch (AppConfig.mapsProvider) {
      'osm' => 'https://www.openstreetmap.org/search?query=$query',
      'apple' => 'https://maps.apple.com/?q=$query',
      _ => 'https://www.google.com/maps/search/?api=1&query=$query',
    };
    return _launch(Uri.parse(url));
  }

  Future<bool> ligar(String telefone) =>
      _launch(Uri(scheme: 'tel', path: telefone));
  Future<bool> whatsapp(String telefone) => _launch(
      Uri.parse('https://wa.me/${telefone.replaceAll(RegExp(r'\D'), '')}'));
  Future<void> copiarEndereco(String endereco) =>
      Clipboard.setData(ClipboardData(text: endereco));
  Future<bool> _launch(Uri uri) =>
      launchUrl(uri, mode: LaunchMode.externalApplication);
}
