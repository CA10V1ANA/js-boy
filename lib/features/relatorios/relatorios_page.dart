import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class RelatoriosPage extends StatefulWidget {
  const RelatoriosPage({super.key});

  @override
  State<RelatoriosPage> createState() => _RelatoriosPageState();
}

class _RelatoriosPageState extends State<RelatoriosPage> {
  RelatorioFinanceiro _relatorio = RelatorioFinanceiro.vazio();
  List<Pagamento> _pagamentos = [];
  List<Entrega> _entregas = [];
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    try {
      final resultados = await Future.wait([
        context.read<PagamentoService>().relatorio(),
        context.read<PagamentoService>().listar(),
        context.read<EntregaService>().listar(),
      ]);
      if (!mounted) return;
      setState(() {
        _relatorio = resultados[0] as RelatorioFinanceiro;
        _pagamentos = resultados[1] as List<Pagamento>;
        _entregas = resultados[2] as List<Entrega>;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _carregando = false);
      mostrarMensagem(context, error.message, erro: true);
    }
  }

  static const _coresForma = {
    FormaPagamento.pix: AppColors.green,
    FormaPagamento.dinheiro: AppColors.amber,
    FormaPagamento.cartao: AppColors.purple,
    FormaPagamento.boleto: Color(0xFF3E6EA8),
    FormaPagamento.transferencia: AppColors.teal,
    FormaPagamento.outro: AppColors.muted,
  };

  @override
  Widget build(BuildContext context) {
    final entregues = _entregas.where((entrega) => entrega.status == StatusEntrega.entregue).length;
    final canceladas = _entregas.where((entrega) => entrega.status == StatusEntrega.cancelada).length;
    final ticketMedio = _relatorio.pagamentosRegistrados > 0
        ? _relatorio.valorRecebido / _relatorio.pagamentosRegistrados
        : 0.0;
    final taxaConclusao = _entregas.isNotEmpty ? (entregues / _entregas.length * 100).round() : 0;

    final contagemFormas = <FormaPagamento, int>{};
    for (final pagamento in _pagamentos) {
      contagemFormas[pagamento.formaPagamento] = (contagemFormas[pagamento.formaPagamento] ?? 0) + 1;
    }
    final formas = contagemFormas.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final contagemClientes = <String, int>{};
    for (final entrega in _entregas) {
      contagemClientes[entrega.clienteNome] = (contagemClientes[entrega.clienteNome] ?? 0) + 1;
    }
    final topClientes = contagemClientes.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Scaffold(
      appBar: AppBar(title: const Text('Relatorios')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _carregando
            ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.7,
                    children: [
                      _metrica('Faturamento', money(_relatorio.valorRecebido)),
                      _metrica('Concluidas', '$entregues de ${_entregas.length}'),
                      _metrica('Ticket medio', money(ticketMedio)),
                      _metrica('Conclusao', '$taxaConclusao%',
                          nota: canceladas > 0 ? '$canceladas cancelada${canceladas == 1 ? '' : 's'}' : null),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const SectionTitle('Formas de pagamento'),
                  const SizedBox(height: 10),
                  PanelCard(
                    child: _pagamentos.isEmpty
                        ? const EmptyState('Nenhum pagamento registrado.')
                        : Column(
                            children: [
                              for (final item in formas)
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 7),
                                  child: Column(
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(item.key.label,
                                              style: GoogleFonts.hankenGrotesk(
                                                  fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink2)),
                                          Text('${(item.value / _pagamentos.length * 100).round()}%',
                                              style: GoogleFonts.hankenGrotesk(
                                                  fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.muted)),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(99),
                                        child: LinearProgressIndicator(
                                          value: item.value / _pagamentos.length,
                                          minHeight: 8,
                                          backgroundColor: AppColors.rowDivider,
                                          valueColor: AlwaysStoppedAnimation(
                                              _coresForma[item.key] ?? AppColors.muted),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                  ),
                  const SizedBox(height: 20),
                  const SectionTitle('Clientes que mais pedem'),
                  const SizedBox(height: 10),
                  PanelCard(
                    padding: EdgeInsets.zero,
                    child: topClientes.isEmpty
                        ? const EmptyState('Nenhuma entrega registrada.')
                        : Column(
                            children: [
                              for (var i = 0; i < topClientes.length && i < 5; i++) ...[
                                if (i > 0) const Divider(height: 1),
                                ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
                                  leading: Container(
                                    width: 26,
                                    height: 26,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: AppColors.iconTile,
                                      borderRadius: BorderRadius.circular(7),
                                    ),
                                    child: Text('${i + 1}',
                                        style: AppTheme.display(size: 11, color: const Color(0xFF8A6108))),
                                  ),
                                  title: Text(topClientes[i].key,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.hankenGrotesk(
                                          fontSize: 13.5, fontWeight: FontWeight.w600, color: AppColors.ink)),
                                  trailing: Text('${topClientes[i].value} entregas',
                                      style: GoogleFonts.hankenGrotesk(fontSize: 12, color: AppColors.faint)),
                                ),
                              ],
                            ],
                          ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _metrica(String rotulo, String valor, {String? nota}) {
    return PanelCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(rotulo, style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.muted)),
          const SizedBox(height: 4),
          Text(valor, style: AppTheme.display(size: 17)),
          if (nota != null) ...[
            const SizedBox(height: 2),
            Text(nota,
                style: GoogleFonts.hankenGrotesk(fontSize: 11, color: const Color(0xFFC67A15))),
          ],
        ],
      ),
    );
  }
}
