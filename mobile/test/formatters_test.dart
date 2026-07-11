import 'package:flutter_test/flutter_test.dart';
import 'package:js_boy_mobile/core/format/formatters.dart';

void main() {
  group('iniciais', () {
    test('usa as primeiras letras dos dois primeiros nomes', () {
      expect(iniciais('Caio Viana'), 'CV');
      expect(iniciais('Padaria Estrela Ltda'), 'PE');
    });

    test('funciona com um unico nome', () {
      expect(iniciais('Caio'), 'C');
    });

    test('nao quebra com texto vazio', () {
      expect(iniciais(''), '');
      expect(iniciais('   '), '');
    });
  });
}
