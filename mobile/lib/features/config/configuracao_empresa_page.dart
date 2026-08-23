import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class ConfiguracaoEmpresaPage extends StatefulWidget {
  const ConfiguracaoEmpresaPage({super.key});

  @override
  State<ConfiguracaoEmpresaPage> createState() =>
      _ConfiguracaoEmpresaPageState();
}

class _ConfiguracaoEmpresaPageState extends State<ConfiguracaoEmpresaPage> {
  final _formKey = GlobalKey<FormState>();
  final _campos = <String, TextEditingController>{};
  ConfiguracaoEmpresa? _config;
  bool _carregando = true;
  bool _salvando = false;

  TextEditingController _controller(String key) =>
      _campos.putIfAbsent(key, TextEditingController.new);

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    for (final controller in _campos.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _carregar() async {
    try {
      final config =
          await context.read<ConfiguracaoEmpresaService>().consultar();
      if (!mounted) return;
      _config = config;
      final valores = {
        'nomeFantasia': config.nomeFantasia,
        'email': config.email,
        'telefone': config.telefone,
        'whatsapp': config.whatsapp,
        'cep': config.cep,
        'logradouro': config.logradouro,
        'numero': config.numero,
        'complemento': config.complemento,
        'bairro': config.bairro,
        'cidade': config.cidade,
        'estado': config.estado,
        'horarioAtendimento': config.horarioAtendimento,
      };
      for (final item in valores.entries) {
        _controller(item.key).text = item.value;
      }
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Future<void> _salvar() async {
    if (_config == null || !_formKey.currentState!.validate()) return;
    setState(() => _salvando = true);
    final dados = <String, dynamic>{
      for (final key in _campos.keys) key: _campos[key]!.text.trim(),
    };
    try {
      final atualizada = await context
          .read<ConfiguracaoEmpresaService>()
          .atualizar(_config!, dados);
      if (!mounted) return;
      setState(() => _config = atualizada);
      mostrarMensagem(context, 'Configuração da empresa salva.');
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  Widget _campo(String key, String label,
      {bool obrigatorio = false, TextInputType? teclado, int? maxLength}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: _controller(key),
        keyboardType: teclado,
        maxLength: maxLength,
        textCapitalization: key == 'email'
            ? TextCapitalization.none
            : TextCapitalization.sentences,
        validator: obrigatorio
            ? (value) => value == null || value.trim().isEmpty
                ? 'Campo obrigatório'
                : null
            : null,
        decoration: InputDecoration(labelText: label, counterText: ''),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Empresa')),
      body: _carregando
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.amber))
          : _config == null
              ? const Center(
                  child: Text('Não foi possível carregar a configuração.'))
              : Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      const PanelCard(
                          child: Row(children: [
                        Icon(Icons.business_outlined,
                            color: AppColors.amberText),
                        SizedBox(width: 12),
                        Expanded(
                            child: Text(
                                'Dados exibidos aos clientes nos canais da JS Boy.')),
                      ])),
                      const SizedBox(height: 20),
                      const SectionTitle('Identidade e contato'),
                      const SizedBox(height: 12),
                      _campo('nomeFantasia', 'Nome fantasia',
                          obrigatorio: true),
                      _campo('email', 'E-mail',
                          teclado: TextInputType.emailAddress),
                      _campo('telefone', 'Telefone',
                          teclado: TextInputType.phone),
                      _campo('whatsapp', 'WhatsApp',
                          teclado: TextInputType.phone),
                      const SizedBox(height: 8),
                      const SectionTitle('Endereço'),
                      const SizedBox(height: 12),
                      _campo('cep', 'CEP', teclado: TextInputType.number),
                      _campo('logradouro', 'Logradouro'),
                      Row(children: [
                        Expanded(child: _campo('numero', 'Número')),
                        const SizedBox(width: 12),
                        Expanded(child: _campo('complemento', 'Complemento')),
                      ]),
                      _campo('bairro', 'Bairro'),
                      _campo('cidade', 'Cidade'),
                      _campo('estado', 'Estado', maxLength: 2),
                      const SizedBox(height: 8),
                      const SectionTitle('Atendimento'),
                      const SizedBox(height: 12),
                      _campo('horarioAtendimento', 'Horário de atendimento'),
                      FilledButton.icon(
                        onPressed: _salvando ? null : _salvar,
                        icon: _salvando
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.save_outlined),
                        label: Text(
                            _salvando ? 'Salvando...' : 'Salvar configurações'),
                      ),
                    ],
                  ),
                ),
    );
  }
}
