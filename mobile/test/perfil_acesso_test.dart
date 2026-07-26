import 'package:flutter_test/flutter_test.dart';
import 'package:js_boy_mobile/models/enums.dart';

void main() {
  group('PerfilAcesso', () {
    test('reconhece cliente', () {
      expect(PerfilAcesso.fromApi('CLIENTE'), PerfilAcesso.cliente);
      expect(PerfilAcesso.cliente.label, 'Cliente');
    });

    test('trata funcionario legado como entregador', () {
      final perfil = PerfilAcesso.fromApi('FUNCIONARIO');

      expect(perfil.ehEntregador, isTrue);
      expect(perfil.label, 'Entregador');
    });
  });
}
