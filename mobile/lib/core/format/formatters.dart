import 'package:intl/intl.dart';

final _money = NumberFormat.currency(locale: 'pt_BR', symbol: r'R$');
final _date = DateFormat('dd/MM/yyyy');
final _time = DateFormat('HH:mm');

String money(num value) => _money.format(value);

String dataCurta(DateTime value) => _date.format(value.toLocal());

String horaCurta(DateTime value) => _time.format(value.toLocal());

/// Primeira letra dos dois primeiros nomes, em maiusculas ("Caio Viana" -> "CV").
String iniciais(String nome) {
  final partes = nome.trim().split(RegExp(r'\s+'));
  final primeira = partes.isNotEmpty && partes[0].isNotEmpty ? partes[0][0] : '';
  final segunda = partes.length > 1 && partes[1].isNotEmpty ? partes[1][0] : '';
  return (primeira + segunda).toUpperCase();
}
