import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

/// Abre o wizard de 4 etapas (Origem, Destino, Carga, Valor) em tela cheia.
/// Passe [entrega] para editar. Devolve `true` quando salvou.
Future<bool?> abrirEntregaWizard(BuildContext context, {Entrega? entrega}) {
  return Navigator.of(context).push<bool>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _EntregaWizardPage(entrega: entrega),
    ),
  );
}

class _EntregaWizardPage extends StatefulWidget {
  final Entrega? entrega;

  const _EntregaWizardPage({this.entrega});

  @override
  State<_EntregaWizardPage> createState() => _EntregaWizardPageState();
}

class _EntregaWizardPageState extends State<_EntregaWizardPage> {
  static const _titulos = ['Origem da coleta', 'Destino da entrega', 'Carga', 'Valor da entrega'];
  static const _rotulos = ['ORIGEM', 'DESTINO', 'CARGA', 'VALOR'];

  final _formKeys = List.generate(4, (_) => GlobalKey<FormState>());
  int _etapa = 0;
  bool _salvando = false;

  List<Cliente> _clientes = [];
  List<Entregador> _entregadores = [];
  ConfiguracaoPreco? _config;

  String? _clienteId;
  String? _entregadorId;
  late final _enderecoOrigem = TextEditingController(text: widget.entrega?.enderecoOrigem ?? '');
  late final _bairroOrigem = TextEditingController(text: widget.entrega?.bairroOrigem ?? '');
  late final _enderecoDestino = TextEditingController(text: widget.entrega?.enderecoDestino ?? '');
  late final _bairroDestino = TextEditingController(text: widget.entrega?.bairroDestino ?? '');
  late final _destinatarioNome = TextEditingController(text: widget.entrega?.destinatarioNome ?? '');
  late final _destinatarioTelefone = TextEditingController(text: widget.entrega?.destinatarioTelefone ?? '');
  late final _mercadoria = TextEditingController(text: widget.entrega?.descricaoMercadoria ?? '');
  late final _observacoes = TextEditingController(text: widget.entrega?.observacoes ?? '');
  late final _distanciaKm = TextEditingController(text: widget.entrega?.distanciaKm.toString() ?? '0');
  late final _valorFinal = TextEditingController(
      text: widget.entrega != null ? widget.entrega!.valorFinal.toStringAsFixed(2) : '');
  late final _motivoValorManual = TextEditingController(text: widget.entrega?.observacaoValorManual ?? '');

  @override
  void initState() {
    super.initState();
    _clienteId = widget.entrega?.clienteId;
    _entregadorId = widget.entrega?.entregadorId;
    _carregarBase();
  }

  @override
  void dispose() {
    for (final controller in [
      _enderecoOrigem, _bairroOrigem, _enderecoDestino, _bairroDestino,
      _destinatarioNome, _destinatarioTelefone, _mercadoria, _observacoes,
      _distanciaKm, _valorFinal, _motivoValorManual,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _carregarBase() async {
    try {
      final resultados = await Future.wait([
        context.read<ClienteService>().listar(),
        context.read<EntregadorService>().listar(),
      ]);

      ConfiguracaoPreco? config;
      try {
        if (mounted) {
          config = await context.read<ConfiguracaoPrecoService>().consultar();
        }
      } on ApiException {
        config = null; // preview de preco e opcional
      }

      if (!mounted) return;
      setState(() {
        _clientes = (resultados[0] as List<Cliente>).where((cliente) => cliente.ativo).toList();
        _entregadores = (resultados[1] as List<Entregador>).where((entregador) => entregador.ativo).toList();
        _config = config;
      });
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  double? get _previewValor {
    final config = _config;
    if (config == null) return null;
    final km = double.tryParse(_distanciaKm.text.replaceAll(',', '.')) ?? 0;
    final bruto = config.taxaInicial + km * config.valorPorKm;
    return bruto < config.valorMinimo ? config.valorMinimo : bruto;
  }

  void _proximo() {
    if (!_formKeys[_etapa].currentState!.validate()) return;

    if (_etapa < 3) {
      setState(() => _etapa++);
    } else {
      _salvar();
    }
  }

  Future<void> _salvar() async {
    setState(() => _salvando = true);

    final valorDigitado = double.tryParse(_valorFinal.text.replaceAll(',', '.'));

    try {
      await context.read<EntregaService>().salvar(
        id: widget.entrega?.id,
        dados: {
          'clienteId': _clienteId,
          'entregadorId': _entregadorId,
          'enderecoOrigem': _enderecoOrigem.text.trim(),
          'bairroOrigem': _bairroOrigem.text.trim(),
          'enderecoDestino': _enderecoDestino.text.trim(),
          'bairroDestino': _bairroDestino.text.trim(),
          'destinatarioNome': _destinatarioNome.text.trim(),
          'destinatarioTelefone': _destinatarioTelefone.text.trim(),
          'descricaoMercadoria': _mercadoria.text.trim(),
          'observacoes': _observacoes.text.trim(),
          'distanciaKm': double.tryParse(_distanciaKm.text.replaceAll(',', '.')) ?? 0,
          'valorFinal': valorDigitado,
          'observacaoValorManual': _motivoValorManual.text.trim(),
        },
      );

      if (!mounted) return;
      mostrarMensagem(context, widget.entrega != null ? 'Entrega atualizada.' : 'Entrega criada.');
      Navigator.pop(context, true);
    } on ApiException catch (error) {
      if (mounted) {
        setState(() => _salvando = false);
        mostrarMensagem(context, error.message, erro: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${widget.entrega != null ? 'EDITAR' : 'NOVA'} ENTREGA · ETAPA ${_etapa + 1}/4',
              style: GoogleFonts.hankenGrotesk(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: AppColors.amberText,
              ),
            ),
            Text(_titulos[_etapa],
                style: GoogleFonts.archivo(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink)),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Row(
                children: [
                  for (var i = 0; i < 4; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        height: 5,
                        decoration: BoxDecoration(
                          color: i <= _etapa ? AppColors.amber : const Color(0xFFEEEAE0),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (var i = 0; i < 4; i++)
                    Text(_rotulos[i],
                        style: GoogleFonts.hankenGrotesk(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                          color: i <= _etapa ? AppColors.amberText : const Color(0xFFC6C1B4),
                        )),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(key: _formKeys[_etapa], child: _corpoEtapa()),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.rowDivider)),
              ),
              child: Row(
                children: [
                  if (_etapa > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _salvando ? null : () => setState(() => _etapa--),
                        child: const Text('Voltar'),
                      ),
                    ),
                  if (_etapa > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: _salvando ? null : _proximo,
                      child: _salvando
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.amberInk),
                            )
                          : Text(_etapa < 3
                              ? 'Proximo'
                              : (widget.entrega != null ? 'Salvar entrega' : 'Cadastrar entrega')),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _corpoEtapa() {
    return switch (_etapa) {
      0 => Column(
          children: [
            DropdownButtonFormField<String>(
              value: _clienteId,
              decoration: const InputDecoration(labelText: 'Cliente'),
              items: [
                for (final cliente in _clientes)
                  DropdownMenuItem(value: cliente.id, child: Text(cliente.nome, overflow: TextOverflow.ellipsis)),
              ],
              onChanged: (value) => setState(() => _clienteId = value),
              validator: (value) => value == null ? 'Selecione o cliente' : null,
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String?>(
              value: _entregadorId,
              decoration: const InputDecoration(labelText: 'Entregador (opcional)'),
              items: [
                const DropdownMenuItem<String?>(value: null, child: Text('Sem entregador')),
                for (final entregador in _entregadores)
                  DropdownMenuItem<String?>(
                      value: entregador.id, child: Text(entregador.nome, overflow: TextOverflow.ellipsis)),
              ],
              onChanged: (value) => setState(() => _entregadorId = value),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _enderecoOrigem,
              decoration: const InputDecoration(labelText: 'Endereco de origem', hintText: 'Rua, numero'),
              validator: _obrigatorio,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _bairroOrigem,
              decoration: const InputDecoration(labelText: 'Bairro'),
              validator: _obrigatorio,
            ),
          ],
        ),
      1 => Column(
          children: [
            TextFormField(
              controller: _enderecoDestino,
              decoration: const InputDecoration(labelText: 'Endereco de destino', hintText: 'Rua, numero'),
              validator: _obrigatorio,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _bairroDestino,
              decoration: const InputDecoration(labelText: 'Bairro'),
              validator: _obrigatorio,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _destinatarioNome,
              decoration: const InputDecoration(labelText: 'Destinatario', hintText: 'Nome de quem recebe'),
              validator: _obrigatorio,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _destinatarioTelefone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Telefone', hintText: '(00) 00000-0000'),
              validator: _obrigatorio,
            ),
          ],
        ),
      2 => Column(
          children: [
            TextFormField(
              controller: _mercadoria,
              decoration: const InputDecoration(labelText: 'Mercadoria', hintText: 'O que sera transportado'),
              validator: _obrigatorio,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _observacoes,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Observacoes',
                hintText: 'Instrucoes para o entregador (opcional)',
              ),
            ),
          ],
        ),
      _ => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _distanciaKm,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Distancia (km)'),
                    validator: _obrigatorio,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _valorFinal,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Valor final',
                      hintText: _previewValor != null ? money(_previewValor!) : 'R\$ 0,00',
                    ),
                  ),
                ),
              ],
            ),
            if (_previewValor != null) ...[
              const SizedBox(height: 16),
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
                    Text('Tarifa + ${_distanciaKm.text} km',
                        style: GoogleFonts.hankenGrotesk(fontSize: 13, color: AppColors.body)),
                    Text(money(_previewValor!), style: AppTheme.display(size: 17, color: AppColors.amberText)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 14),
            TextFormField(
              controller: _motivoValorManual,
              decoration: const InputDecoration(labelText: 'Motivo do valor manual (opcional)'),
            ),
          ],
        ),
    };
  }

  String? _obrigatorio(String? value) =>
      (value == null || value.trim().isEmpty) ? 'Campo obrigatorio' : null;
}
