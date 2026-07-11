import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
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
  final _distanciaSimulacao = TextEditingController(text: '8');
  bool _salvando = false;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    for (final controller in [_taxaInicial, _valorPorKm, _valorMinimo, _distanciaSimulacao]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _carregar() async {
    try {
      final config = await context.read<ConfiguracaoPrecoService>().consultar();
      if (!mounted) return;
      setState(() {
        _taxaInicial.text = config.taxaInicial.toStringAsFixed(2);
        _valorPorKm.text = config.valorPorKm.toStringAsFixed(2);
        _valorMinimo.text = config.valorMinimo.toStringAsFixed(2);
      });
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  double? _parse(TextEditingController controller) =>
      double.tryParse(controller.text.replaceAll(',', '.'));

  double? get _preview {
    final taxa = _parse(_taxaInicial);
    final km = _parse(_valorPorKm);
    final minimo = _parse(_valorMinimo);
    final distancia = _parse(_distanciaSimulacao);
    if (taxa == null || km == null || minimo == null || distancia == null) return null;
    final bruto = taxa + km * distancia;
    return bruto < minimo ? minimo : bruto;
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _salvando = true);

    try {
      await context.read<ConfiguracaoPrecoService>().atualizar(
            taxaInicial: _parse(_taxaInicial)!,
            valorPorKm: _parse(_valorPorKm)!,
            valorMinimo: _parse(_valorMinimo)!,
          );
      if (mounted) mostrarMensagem(context, 'Tarifa atualizada.');
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  String? _numero(String? value) {
    final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
    if (parsed == null || parsed < 0) return 'Valor invalido';
    return null;
  }

  static const _veiculos = [
    ('Moto', 'Padrao para entregas rapidas', '1.0x'),
    ('Carro', 'Cargas medias e volumosas', '1.4x'),
    ('Utilitario', 'Grandes volumes', '2.0x'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configuracoes')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const SectionTitle('Tarifa base'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _taxaInicial,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Valor inicial'),
                      validator: _numero,
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _valorPorKm,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Preco por km'),
                      validator: _numero,
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _valorMinimo,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Valor minimo'),
                      validator: _numero,
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _distanciaSimulacao,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Simular km'),
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                ],
              ),
              if (_preview != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFCF6E7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF0E4C4)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Ex.: entrega de ${_distanciaSimulacao.text} km',
                          style: GoogleFonts.hankenGrotesk(fontSize: 13, color: AppColors.body)),
                      Text(money(_preview!), style: AppTheme.display(size: 17, color: AppColors.amberText)),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _salvando ? null : _salvar,
                child: _salvando
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.amberInk))
                    : const Text('Salvar tarifa'),
              ),
              const SizedBox(height: 28),
              const SectionTitle('Multiplicador por veiculo'),
              const SizedBox(height: 12),
              PanelCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (var i = 0; i < _veiculos.length; i++) ...[
                      if (i > 0) const Divider(height: 1),
                      ListTile(
                        title: Text(_veiculos[i].$1,
                            style: GoogleFonts.hankenGrotesk(
                                fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
                        subtitle: Text(_veiculos[i].$2,
                            style: GoogleFonts.hankenGrotesk(fontSize: 12, color: AppColors.faint)),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.iconTile,
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: Text(_veiculos[i].$3, style: AppTheme.display(size: 14)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
