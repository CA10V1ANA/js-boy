import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class ConfiguracoesPage extends StatefulWidget {
  const ConfiguracoesPage({super.key});

  @override
  State<ConfiguracoesPage> createState() => _ConfiguracoesPageState();
}

class _ConfiguracoesPageState extends State<ConfiguracoesPage> {
  final _formKey = GlobalKey<FormState>();
  final _taxaInicial = TextEditingController();
  final _valorPorKm = TextEditingController();
  final _valorMinimo = TextEditingController();
  final _taxaRetorno = TextEditingController();
  final _taxaEspera = TextEditingController();
  final _distanciaSimulacao = TextEditingController(text: '8');
  final _areas = <String, (TextEditingController, TextEditingController)>{};
  TabelaPreco? _tabela;
  bool _carregando = true;
  bool _salvando = false;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    for (final controller in [
      _taxaInicial,
      _valorPorKm,
      _valorMinimo,
      _taxaRetorno,
      _taxaEspera,
      _distanciaSimulacao,
    ]) {
      controller.dispose();
    }
    for (final controllers in _areas.values) {
      controllers.$1.dispose();
      controllers.$2.dispose();
    }
    super.dispose();
  }

  Future<void> _carregar() async {
    try {
      final tabela =
          await context.read<ConfiguracaoPrecoService>().consultarTabela();
      if (!mounted) return;
      for (final controllers in _areas.values) {
        controllers.$1.dispose();
        controllers.$2.dispose();
      }
      _areas.clear();
      for (final area in tabela.areas) {
        _areas[area.id] = (
          TextEditingController(text: area.valorMoto?.toStringAsFixed(2) ?? ''),
          TextEditingController(
              text: area.valorCarro?.toStringAsFixed(2) ?? ''),
        );
      }
      setState(() {
        _tabela = tabela;
        _taxaInicial.text = tabela.taxaInicialFallback.toStringAsFixed(2);
        _valorPorKm.text = tabela.valorPorKmFallback.toStringAsFixed(2);
        _valorMinimo.text = tabela.valorMinimoFallback.toStringAsFixed(2);
        _taxaRetorno.text = tabela.taxaRetorno.toStringAsFixed(2);
        _taxaEspera.text = tabela.taxaEsperaTrintaMinutos.toStringAsFixed(2);
      });
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  double? _parse(TextEditingController controller) =>
      double.tryParse(controller.text.replaceAll(',', '.'));

  String? _numero(String? value) {
    final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
    if (parsed == null || parsed < 0) return 'Valor inválido';
    return null;
  }

  double? get _preview {
    final taxa = _parse(_taxaInicial);
    final km = _parse(_valorPorKm);
    final minimo = _parse(_valorMinimo);
    final distancia = _parse(_distanciaSimulacao);
    if (taxa == null || km == null || minimo == null || distancia == null) {
      return null;
    }
    final bruto = taxa + km * distancia;
    return bruto < minimo ? minimo : bruto;
  }

  Future<void> _salvar() async {
    final tabela = _tabela;
    if (tabela == null || !_formKey.currentState!.validate()) return;
    setState(() => _salvando = true);
    tabela.taxaInicialFallback = _parse(_taxaInicial)!;
    tabela.valorPorKmFallback = _parse(_valorPorKm)!;
    tabela.valorMinimoFallback = _parse(_valorMinimo)!;
    tabela.taxaRetorno = _parse(_taxaRetorno)!;
    tabela.taxaEsperaTrintaMinutos = _parse(_taxaEspera)!;
    for (final area in tabela.areas.where((area) => !area.valorNegociado)) {
      area.valorMoto = _parse(_areas[area.id]!.$1);
      area.valorCarro = _parse(_areas[area.id]!.$2);
    }
    try {
      final atualizada = await context
          .read<ConfiguracaoPrecoService>()
          .atualizarTabela(tabela);
      if (!mounted) return;
      setState(() => _tabela = atualizada);
      mostrarMensagem(context, 'Tabela de preços atualizada.');
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  Widget _valor(TextEditingController controller, String label) =>
      TextFormField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(labelText: label, prefixText: r'R$ '),
        validator: _numero,
        onChanged: (_) => setState(() {}),
      );

  @override
  Widget build(BuildContext context) {
    final tabela = _tabela;
    return Scaffold(
      appBar: AppBar(title: const Text('Preços')),
      body: _carregando
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.amber))
          : tabela == null
              ? const Center(child: Text('Não foi possível carregar a tabela.'))
              : Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      PanelCard(
                          child: Row(children: [
                        const Icon(Icons.map_outlined,
                            color: AppColors.amberText),
                        const SizedBox(width: 12),
                        Expanded(
                            child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(tabela.nome,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700)),
                            const Text(
                                'O bairro de destino define o valor-base.'),
                          ],
                        )),
                      ])),
                      const SizedBox(height: 22),
                      const SectionTitle('Taxas adicionais'),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(child: _valor(_taxaRetorno, 'Retorno')),
                        const SizedBox(width: 12),
                        Expanded(child: _valor(_taxaEspera, 'Espera / 30 min')),
                      ]),
                      const SizedBox(height: 24),
                      const SectionTitle('Áreas e bairros'),
                      const SizedBox(height: 12),
                      ...tabela.areas.map((area) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: PanelCard(
                                child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(children: [
                                  Expanded(
                                      child: Text(area.nome,
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w700))),
                                  if (area.valorNegociado)
                                    const StatusBadge(
                                        texto: 'A combinar',
                                        cor: AppColors.ocre,
                                        corFundo: AppColors.ocreBg),
                                ]),
                                const SizedBox(height: 8),
                                Text(area.bairros.join(' · '),
                                    style: GoogleFonts.hankenGrotesk(
                                        fontSize: 12, color: AppColors.faint)),
                                if (!area.valorNegociado) ...[
                                  const SizedBox(height: 12),
                                  Row(children: [
                                    Expanded(
                                        child: _valor(
                                            _areas[area.id]!.$1, 'Moto')),
                                    const SizedBox(width: 12),
                                    Expanded(
                                        child: _valor(
                                            _areas[area.id]!.$2, 'Carro')),
                                  ]),
                                ],
                              ],
                            )),
                          )),
                      const SizedBox(height: 10),
                      const SectionTitle('Cálculo alternativo'),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(child: _valor(_taxaInicial, 'Valor inicial')),
                        const SizedBox(width: 12),
                        Expanded(child: _valor(_valorPorKm, 'Preço por km')),
                      ]),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(child: _valor(_valorMinimo, 'Valor mínimo')),
                        const SizedBox(width: 12),
                        Expanded(
                            child: TextFormField(
                          controller: _distanciaSimulacao,
                          keyboardType: const TextInputType.numberWithOptions(
                              decimal: true),
                          decoration:
                              const InputDecoration(labelText: 'Simular km'),
                          validator: _numero,
                          onChanged: (_) => setState(() {}),
                        )),
                      ]),
                      if (_preview != null) ...[
                        const SizedBox(height: 12),
                        PanelCard(
                            child: Row(children: [
                          Expanded(
                              child: Text(
                                  'Entrega de ${_distanciaSimulacao.text} km fora da tabela')),
                          Text(money(_preview!),
                              style: AppTheme.display(
                                  size: 16, color: AppColors.amberText)),
                        ])),
                      ],
                      const SizedBox(height: 18),
                      FilledButton.icon(
                        onPressed: _salvando ? null : _salvar,
                        icon: const Icon(Icons.save_outlined),
                        label:
                            Text(_salvando ? 'Salvando...' : 'Salvar tabela'),
                      ),
                    ],
                  ),
                ),
    );
  }
}
