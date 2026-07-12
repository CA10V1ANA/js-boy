import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';
import 'pagamento_form_page.dart';

class PagamentosPage extends StatefulWidget {
  const PagamentosPage({super.key});

  @override
  State<PagamentosPage> createState() => _PagamentosPageState();
}

class _PagamentosPageState extends State<PagamentosPage> {
  RelatorioFinanceiro _relatorio = RelatorioFinanceiro.vazio();
  List<Pagamento> _pagamentos = [];
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
      ]);
      if (!mounted) return;
      setState(() {
        _relatorio = resultados[0] as RelatorioFinanceiro;
        _pagamentos = resultados[1] as List<Pagamento>;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _carregando = false);
      mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _abrirForm({String? entregaId, double? valor}) async {
    final salvou = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PagamentoFormPage(entregaIdInicial: entregaId, valorInicial: valor),
      ),
    );
    if (salvou == true) {
      _carregar();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pagamentos'),
        actions: [
          IconButton(
            onPressed: () => _abrirForm(),
            icon: const Icon(Icons.add_circle, color: AppColors.amber, size: 28),
            tooltip: 'Novo pagamento',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _carregando
            ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: PanelCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Recebido',
                                  style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.muted)),
                              const SizedBox(height: 4),
                              Text(money(_relatorio.valorRecebido), style: AppTheme.display(size: 17)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: PanelCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Pendente',
                                  style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.muted)),
                              const SizedBox(height: 4),
                              Text(
                                money(_relatorio.valorPendente),
                                style: AppTheme.display(
                                  size: 17,
                                  color: _relatorio.valorPendente > 0 ? const Color(0xFFC67A15) : AppColors.ink,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_relatorio.pendencias.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    const SectionTitle('Pendencias'),
                    const SizedBox(height: 10),
                    PanelCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          for (var i = 0; i < _relatorio.pendencias.length; i++) ...[
                            if (i > 0) const Divider(height: 1),
                            ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                              title: Text(_relatorio.pendencias[i].clienteNome,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.hankenGrotesk(
                                      fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
                              subtitle: Text(_relatorio.pendencias[i].entregaCodigo,
                                  style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint)),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(money(_relatorio.pendencias[i].valorPendente),
                                      style: AppTheme.display(size: 14, color: const Color(0xFFC67A15))),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, color: AppColors.amberText),
                                    tooltip: 'Receber',
                                    onPressed: () => _abrirForm(
                                      entregaId: _relatorio.pendencias[i].entregaId,
                                      valor: _relatorio.pendencias[i].valorPendente,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const SectionTitle('Historico'),
                  const SizedBox(height: 10),
                  if (_pagamentos.isEmpty)
                    const PanelCard(child: EmptyState('Nenhum pagamento registrado.'))
                  else
                    PanelCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          for (var i = 0; i < _pagamentos.length; i++) ...[
                            if (i > 0) const Divider(height: 1),
                            ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                              title: Text(_pagamentos[i].clienteNome,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.hankenGrotesk(
                                      fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
                              subtitle: Text(
                                '${_pagamentos[i].entregaCodigo} · ${_pagamentos[i].formaPagamento.label} · ${dataCurta(_pagamentos[i].pagoEm)}',
                                style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint),
                              ),
                              trailing: Text(money(_pagamentos[i].valor), style: AppTheme.display(size: 14)),
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
}
