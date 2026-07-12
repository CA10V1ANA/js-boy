import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class EntregadorFormPage extends StatefulWidget {
  final Entregador? entregador;

  const EntregadorFormPage({super.key, this.entregador});

  @override
  State<EntregadorFormPage> createState() => _EntregadorFormPageState();
}

class _EntregadorFormPageState extends State<EntregadorFormPage> {
  final _formKey = GlobalKey<FormState>();
  bool _salvando = false;

  late final _nome = TextEditingController(text: widget.entregador?.nome ?? '');
  late final _cpf = TextEditingController(text: widget.entregador?.cpf ?? '');
  late final _telefone = TextEditingController(text: widget.entregador?.telefone ?? '');
  late final _email = TextEditingController(text: widget.entregador?.email ?? '');
  late final _placa = TextEditingController(text: widget.entregador?.placaVeiculo ?? '');
  late TipoVeiculo _tipoVeiculo = widget.entregador?.tipoVeiculo ?? TipoVeiculo.moto;
  late bool _disponivel = widget.entregador?.disponivel ?? true;

  @override
  void dispose() {
    for (final controller in [_nome, _cpf, _telefone, _email, _placa]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _salvando = true);

    try {
      await context.read<EntregadorService>().salvar(
        id: widget.entregador?.id,
        dados: {
          'nome': _nome.text.trim(),
          'cpf': _cpf.text.trim(),
          'telefone': _telefone.text.trim(),
          'email': _email.text.trim(),
          'tipoVeiculo': _tipoVeiculo.api,
          'placaVeiculo': _placa.text.trim(),
          'disponivel': _disponivel,
        },
      );

      if (!mounted) return;
      mostrarMensagem(context, widget.entregador != null ? 'Entregador atualizado.' : 'Entregador cadastrado.');
      Navigator.pop(context, true);
    } on ApiException catch (error) {
      if (mounted) {
        setState(() => _salvando = false);
        mostrarMensagem(context, error.message, erro: true);
      }
    }
  }

  String? _obrigatorio(String? value) =>
      (value == null || value.trim().isEmpty) ? 'Campo obrigatorio' : null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.entregador != null ? 'Editar entregador' : 'Novo entregador')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextFormField(controller: _nome, decoration: const InputDecoration(labelText: 'Nome'), validator: _obrigatorio),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: TextFormField(controller: _cpf, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'CPF'), validator: _obrigatorio)),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _telefone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Telefone'), validator: _obrigatorio)),
              ]),
              const SizedBox(height: 14),
              TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'E-mail')),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(
                  child: DropdownButtonFormField<TipoVeiculo>(
                    value: _tipoVeiculo,
                    decoration: const InputDecoration(labelText: 'Tipo de veiculo'),
                    items: [
                      for (final tipo in TipoVeiculo.values)
                        DropdownMenuItem(value: tipo, child: Text(tipo.label)),
                    ],
                    onChanged: (value) => setState(() => _tipoVeiculo = value ?? TipoVeiculo.moto),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _placa, decoration: const InputDecoration(labelText: 'Placa'))),
              ]),
              const SizedBox(height: 8),
              SwitchListTile(
                value: _disponivel,
                onChanged: (value) => setState(() => _disponivel = value),
                title: const Text('Disponivel para entregas'),
                activeColor: AppColors.amber,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _salvando ? null : _salvar,
                child: _salvando
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.amberInk))
                    : Text(widget.entregador != null ? 'Salvar' : 'Cadastrar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
