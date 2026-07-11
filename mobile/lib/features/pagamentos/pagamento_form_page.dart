import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class PagamentoFormPage extends StatefulWidget {
  final String? entregaIdInicial;
  final double? valorInicial;

  const PagamentoFormPage({super.key, this.entregaIdInicial, this.valorInicial});

  @override
  State<PagamentoFormPage> createState() => _PagamentoFormPageState();
}

class _PagamentoFormPageState extends State<PagamentoFormPage> {
  final _formKey = GlobalKey<FormState>();
  bool _salvando = false;

  List<Entrega> _entregas = [];
  String? _entregaId;
  FormaPagamento _forma = FormaPagamento.pix;
  late final _valor = TextEditingController(
      text: widget.valorInicial != null ? widget.valorInicial!.toStringAsFixed(2) : '');
  final _comprovante = TextEditingController();
  final _observacoes = TextEditingController();

  @override
  void initState() {
    super.initState();
    _entregaId = widget.entregaIdInicial;
    _carregarEntregas();
  }

  @override
  void dispose() {
    _valor.dispose();
    _comprovante.dispose();
    _observacoes.dispose();
    super.dispose();
  }

  Future<void> _carregarEntregas() async {
    try {
      final entregas = await context.read<EntregaService>().listar();
      if (!mounted) return;
      setState(() => _entregas = entregas);
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _salvando = true);

    try {
      await context.read<PagamentoService>().registrar({
        'entregaId': _entregaId,
        'valor': double.tryParse(_valor.text.replaceAll(',', '.')) ?? 0,
        'formaPagamento': _forma.api,
        'comprovante': _comprovante.text.trim().isEmpty ? null : _comprovante.text.trim(),
        'observacoes': _observacoes.text.trim().isEmpty ? null : _observacoes.text.trim(),
      });

      if (!mounted) return;
      mostrarMensagem(context, 'Pagamento registrado.');
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
      appBar: AppBar(title: const Text('Registrar pagamento')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              DropdownButtonFormField<String>(
                value: _entregaId,
                decoration: const InputDecoration(labelText: 'Entrega'),
                items: [
                  for (final entrega in _entregas)
                    DropdownMenuItem(
                      value: entrega.id,
                      child: Text('${entrega.codigo} · ${entrega.clienteNome}', overflow: TextOverflow.ellipsis),
                    ),
                ],
                onChanged: (value) => setState(() => _entregaId = value),
                validator: (value) => value == null ? 'Selecione a entrega' : null,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _valor,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Valor', hintText: '0,00'),
                      validator: (value) {
                        final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
                        if (parsed == null || parsed <= 0) return 'Informe um valor valido';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<FormaPagamento>(
                      value: _forma,
                      decoration: const InputDecoration(labelText: 'Forma'),
                      items: [
                        for (final forma in FormaPagamento.values)
                          DropdownMenuItem(value: forma, child: Text(forma.label)),
                      ],
                      onChanged: (value) => setState(() => _forma = value ?? FormaPagamento.pix),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _comprovante,
                decoration: const InputDecoration(labelText: 'Comprovante', hintText: 'Codigo, link ou observacao'),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _observacoes,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Observacoes (opcional)'),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _salvando ? null : _salvar,
                child: _salvando
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.amberInk))
                    : const Text('Registrar pagamento'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
