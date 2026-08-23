import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class RazaoFinanceiraPage extends StatefulWidget {
  const RazaoFinanceiraPage({super.key});

  @override
  State<RazaoFinanceiraPage> createState() => _RazaoFinanceiraPageState();
}

class _RazaoFinanceiraPageState extends State<RazaoFinanceiraPage> {
  final _descricao = TextEditingController();
  final _valor = TextEditingController();
  late DateTime _inicio;
  DateTime _fim = DateTime.now();
  String _tipo = 'DESPESA';
  RelatorioRazao? _relatorio;
  bool _carregando = true;
  bool _salvando = false;

  static const _tipos = {
    'DESPESA': 'Despesa',
    'TAXA': 'Taxa',
    'REPASSE_ENTREGADOR': 'Repasse ao entregador',
    'AJUSTE_CREDITO': 'Ajuste de crédito',
    'AJUSTE_DEBITO': 'Ajuste de débito',
  };

  @override
  void initState() {
    super.initState();
    final hoje = DateTime.now();
    _inicio = DateTime(hoje.year, hoje.month, 1);
    _carregar();
  }

  @override
  void dispose() {
    _descricao.dispose();
    _valor.dispose();
    super.dispose();
  }

  Future<void> _selecionar(bool inicio) async {
    final data = await showDatePicker(
      context: context,
      initialDate: inicio ? _inicio : _fim,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (data != null) setState(() => inicio ? _inicio = data : _fim = data);
  }

  Future<void> _carregar() async {
    setState(() => _carregando = true);
    try {
      final relatorio =
          await context.read<RazaoFinanceiraService>().relatorio(_inicio, _fim);
      if (mounted) setState(() => _relatorio = relatorio);
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Future<void> _registrar() async {
    final valor = double.tryParse(_valor.text.replaceAll(',', '.'));
    if (_descricao.text.trim().isEmpty || valor == null || valor <= 0) {
      mostrarMensagem(context, 'Informe descrição e valor válido.', erro: true);
      return;
    }
    setState(() => _salvando = true);
    try {
      await context.read<RazaoFinanceiraService>().registrar(
          tipo: _tipo,
          descricao: _descricao.text.trim(),
          valor: valor,
          competencia: _fim);
      if (!mounted) return;
      _descricao.clear();
      _valor.clear();
      mostrarMensagem(context, 'Lançamento registrado com sucesso.');
      await _carregar();
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  Widget _resumo(String rotulo, double valor, {bool destaque = false}) =>
      PanelCard(
          child: Row(children: [
        Expanded(child: Text(rotulo)),
        Text(money(valor),
            style: TextStyle(
                fontWeight: FontWeight.w800,
                color: destaque ? AppColors.green : AppColors.ink)),
      ]));

  Widget _grupo(String titulo, List<ResumoFaturamentoAgrupado> itens) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SectionTitle(titulo),
        const SizedBox(height: 10),
        if (itens.isEmpty)
          const EmptyState('Nenhuma entrega concluída neste período.')
        else
          ...itens.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: PanelCard(
                    child: Row(children: [
                  Expanded(child: Text(item.nome)),
                  Text('${item.entregas} entregas'),
                  const SizedBox(width: 12),
                  Text(money(item.valorFaturado),
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ])),
              )),
      ]);

  @override
  Widget build(BuildContext context) {
    final relatorio = _relatorio;
    return Scaffold(
      appBar: AppBar(title: const Text('Razão financeira')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const PanelCard(
                child: Row(children: [
              Icon(Icons.account_balance_outlined, color: AppColors.amberText),
              SizedBox(width: 12),
              Expanded(
                  child: Text(
                      'Faturamento por competência, recebimentos e resultado operacional.')),
            ])),
            const SizedBox(height: 18),
            const SectionTitle('Novo lançamento'),
            const SizedBox(height: 10),
            PanelCard(
                child: Column(children: [
              DropdownButtonFormField<String>(
                initialValue: _tipo,
                decoration: const InputDecoration(labelText: 'Tipo'),
                items: _tipos.entries
                    .map((item) => DropdownMenuItem(
                        value: item.key, child: Text(item.value)))
                    .toList(),
                onChanged: (value) => setState(() => _tipo = value ?? _tipo),
              ),
              const SizedBox(height: 12),
              TextField(
                  controller: _descricao,
                  decoration: const InputDecoration(labelText: 'Descrição')),
              const SizedBox(height: 12),
              TextField(
                  controller: _valor,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Valor')),
              const SizedBox(height: 12),
              SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _salvando ? null : _registrar,
                    icon: const Icon(Icons.add),
                    label: Text(
                        _salvando ? 'Registrando...' : 'Registrar lançamento'),
                  )),
            ])),
            const SizedBox(height: 18),
            const SectionTitle('Período do relatório'),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(
                  child: OutlinedButton(
                      onPressed: () => _selecionar(true),
                      child: Text('Início\n${dataCurta(_inicio)}'))),
              const SizedBox(width: 10),
              Expanded(
                  child: OutlinedButton(
                      onPressed: () => _selecionar(false),
                      child: Text('Fim\n${dataCurta(_fim)}'))),
            ]),
            const SizedBox(height: 8),
            FilledButton.icon(
                onPressed: _carregar,
                icon: const Icon(Icons.search),
                label: const Text('Gerar relatório')),
            const SizedBox(height: 18),
            if (_carregando)
              const Center(
                  child: Padding(
                      padding: EdgeInsets.all(32),
                      child: CircularProgressIndicator(color: AppColors.amber)))
            else if (relatorio != null) ...[
              _resumo('Faturado na competência', relatorio.faturado),
              const SizedBox(height: 8),
              _resumo('Recebido no período',
                  relatorio.recebido - relatorio.estornado),
              const SizedBox(height: 8),
              _resumo('Pendente', relatorio.pendente),
              const SizedBox(height: 8),
              _resumo('Despesas e taxas', relatorio.despesas + relatorio.taxas),
              const SizedBox(height: 8),
              _resumo('Repasses', relatorio.repassesEntregadores),
              const SizedBox(height: 8),
              _resumo(
                  'Resultado por competência', relatorio.resultadoCompetencia,
                  destaque: true),
              const SizedBox(height: 22),
              _grupo(
                  'Faturamento por cliente', relatorio.faturamentoPorCliente),
              const SizedBox(height: 18),
              _grupo('Faturamento por entregador',
                  relatorio.faturamentoPorEntregador),
            ],
          ],
        ),
      ),
    );
  }
}
