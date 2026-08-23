import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class MeuFaturamentoPage extends StatefulWidget {
  const MeuFaturamentoPage({super.key});

  @override
  State<MeuFaturamentoPage> createState() => _MeuFaturamentoPageState();
}

class _MeuFaturamentoPageState extends State<MeuFaturamentoPage> {
  late DateTime _inicio;
  DateTime _fim = DateTime.now();
  ExtratoEntregador? _extrato;
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    final hoje = DateTime.now();
    _inicio = DateTime(hoje.year, hoje.month, 1);
    _carregar();
  }

  Future<void> _selecionar(bool inicio) async {
    final atual = inicio ? _inicio : _fim;
    final data = await showDatePicker(
      context: context,
      initialDate: atual,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (data != null) setState(() => inicio ? _inicio = data : _fim = data);
  }

  Future<void> _carregar() async {
    setState(() => _carregando = true);
    try {
      final extrato =
          await context.read<RazaoFinanceiraService>().extrato(_inicio, _fim);
      if (mounted) setState(() => _extrato = extrato);
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Widget _dataButton(String label, DateTime value, VoidCallback onTap) =>
      Expanded(
          child: OutlinedButton.icon(
        onPressed: onTap,
        icon: const Icon(Icons.calendar_today_outlined, size: 17),
        label: Text('$label\n${dataCurta(value)}', textAlign: TextAlign.left),
      ));

  @override
  Widget build(BuildContext context) {
    final extrato = _extrato;
    return Scaffold(
      appBar: AppBar(title: const Text('Meu faturamento')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            PanelCard(
                child: Column(children: [
              Row(children: [
                _dataButton('Início', _inicio, () => _selecionar(true)),
                const SizedBox(width: 10),
                _dataButton('Fim', _fim, () => _selecionar(false)),
              ]),
              const SizedBox(height: 10),
              SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _carregar,
                    icon: const Icon(Icons.search),
                    label: const Text('Consultar período'),
                  )),
            ])),
            const SizedBox(height: 16),
            if (_carregando)
              const Center(
                  child: Padding(
                      padding: EdgeInsets.all(32),
                      child: CircularProgressIndicator(color: AppColors.amber)))
            else if (extrato != null) ...[
              Row(children: [
                Expanded(
                    child: KpiCard(
                        rotulo: 'Entregas concluídas',
                        valor: '${extrato.entregasConcluidas}',
                        icone: Icons.local_shipping_outlined,
                        cor: AppColors.teal,
                        corFundo: AppColors.tealBg)),
                const SizedBox(width: 10),
                Expanded(
                    child: KpiCard(
                        rotulo: 'Valor faturado',
                        valor: money(extrato.valorFaturado),
                        icone: Icons.account_balance_wallet_outlined,
                        cor: AppColors.green,
                        corFundo: AppColors.greenBg)),
              ]),
              const SizedBox(height: 20),
              const SectionTitle('Entregas do extrato'),
              const SizedBox(height: 10),
              if (extrato.itens.isEmpty)
                const EmptyState('Nenhuma entrega concluída neste período.')
              else
                ...extrato.itens.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: PanelCard(
                          child: Row(children: [
                        Expanded(
                            child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.codigo,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700)),
                            Text(item.clienteNome),
                            Text(
                                '${dataCurta(item.concluidaEm)} às ${horaCurta(item.concluidaEm)}',
                                style: const TextStyle(color: AppColors.faint)),
                          ],
                        )),
                        Text(money(item.valorFaturado),
                            style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.green)),
                      ])),
                    )),
            ],
          ],
        ),
      ),
    );
  }
}
