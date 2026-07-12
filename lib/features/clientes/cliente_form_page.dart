import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class ClienteFormPage extends StatefulWidget {
  final Cliente? cliente;

  const ClienteFormPage({super.key, this.cliente});

  @override
  State<ClienteFormPage> createState() => _ClienteFormPageState();
}

class _ClienteFormPageState extends State<ClienteFormPage> {
  final _formKey = GlobalKey<FormState>();
  bool _salvando = false;

  late final _nome = TextEditingController(text: widget.cliente?.nome ?? '');
  late final _telefone = TextEditingController(text: widget.cliente?.telefone ?? '');
  late final _whatsapp = TextEditingController(text: widget.cliente?.whatsapp ?? '');
  late final _email = TextEditingController(text: widget.cliente?.email ?? '');
  late final _documento = TextEditingController(text: widget.cliente?.documento ?? '');
  late final _endereco = TextEditingController(text: widget.cliente?.endereco ?? '');
  late final _bairro = TextEditingController(text: widget.cliente?.bairro ?? '');
  late final _cidade = TextEditingController(text: widget.cliente?.cidade ?? '');
  late final _observacoes = TextEditingController(text: widget.cliente?.observacoes ?? '');

  @override
  void dispose() {
    for (final controller in [_nome, _telefone, _whatsapp, _email, _documento, _endereco, _bairro, _cidade, _observacoes]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _salvando = true);

    try {
      await context.read<ClienteService>().salvar(
        id: widget.cliente?.id,
        dados: {
          'nome': _nome.text.trim(),
          'telefone': _telefone.text.trim(),
          'whatsapp': _whatsapp.text.trim(),
          'email': _email.text.trim(),
          'documento': _documento.text.trim(),
          'endereco': _endereco.text.trim(),
          'bairro': _bairro.text.trim(),
          'cidade': _cidade.text.trim(),
          'observacoes': _observacoes.text.trim(),
        },
      );

      if (!mounted) return;
      mostrarMensagem(context, widget.cliente != null ? 'Cliente atualizado.' : 'Cliente cadastrado.');
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
      appBar: AppBar(title: Text(widget.cliente != null ? 'Editar cliente' : 'Novo cliente')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextFormField(controller: _nome, decoration: const InputDecoration(labelText: 'Nome'), validator: _obrigatorio),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: TextFormField(controller: _telefone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Telefone'), validator: _obrigatorio)),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _whatsapp, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'WhatsApp'))),
              ]),
              const SizedBox(height: 14),
              TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'E-mail')),
              const SizedBox(height: 14),
              TextFormField(controller: _documento, decoration: const InputDecoration(labelText: 'CPF/CNPJ')),
              const SizedBox(height: 14),
              TextFormField(controller: _endereco, decoration: const InputDecoration(labelText: 'Endereco'), validator: _obrigatorio),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: TextFormField(controller: _bairro, decoration: const InputDecoration(labelText: 'Bairro'), validator: _obrigatorio)),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _cidade, decoration: const InputDecoration(labelText: 'Cidade'), validator: _obrigatorio)),
              ]),
              const SizedBox(height: 14),
              TextFormField(controller: _observacoes, maxLines: 3, decoration: const InputDecoration(labelText: 'Observacoes')),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _salvando ? null : _salvar,
                child: _salvando
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.amberInk))
                    : Text(widget.cliente != null ? 'Salvar' : 'Cadastrar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
