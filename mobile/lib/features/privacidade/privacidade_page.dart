import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class PrivacidadePage extends StatefulWidget {
  const PrivacidadePage({super.key});

  @override
  State<PrivacidadePage> createState() => _PrivacidadePageState();
}

class _PrivacidadePageState extends State<PrivacidadePage> {
  final _justificativa = TextEditingController();
  List<Cliente> _clientes = [];
  String? _clienteId;
  bool _carregando = true;
  bool _ocupado = false;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    _justificativa.dispose();
    super.dispose();
  }

  Future<void> _carregar() async {
    try {
      final clientes = await context.read<ClienteService>().listar();
      if (mounted) setState(() => _clientes = clientes);
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Future<void> _exportar() async {
    if (_clienteId == null) return;
    setState(() => _ocupado = true);
    try {
      final dados =
          await context.read<PrivacidadeService>().exportar(_clienteId!);
      final json = const JsonEncoder.withIndent('  ').convert(dados);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Dados do cliente'),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: SelectableText(json,
                  style:
                      const TextStyle(fontFamily: 'monospace', fontSize: 12)),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: json));
                if (dialogContext.mounted) Navigator.pop(dialogContext);
                if (mounted) {
                  mostrarMensagem(context, 'Dados copiados com segurança.');
                }
              },
              child: const Text('Copiar JSON'),
            ),
            FilledButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Fechar')),
          ],
        ),
      );
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _anonimizar() async {
    if (_clienteId == null || _justificativa.text.trim().isEmpty) return;
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Anonimizar cliente?'),
        content: const Text(
            'A ação remove dados pessoais e desativa o acesso. Registros financeiros permanecem.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Anonimizar')),
        ],
      ),
    );
    if (confirmar != true || !mounted) return;
    setState(() => _ocupado = true);
    try {
      await context
          .read<PrivacidadeService>()
          .anonimizar(_clienteId!, _justificativa.text.trim());
      if (!mounted) return;
      mostrarMensagem(context, 'Cliente anonimizado.');
      setState(() {
        _clienteId = null;
        _justificativa.clear();
      });
      await _carregar();
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacidade')),
      body: _carregando
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.amber))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const PanelCard(
                    child: Row(children: [
                  Icon(Icons.privacy_tip_outlined, color: AppColors.amberText),
                  SizedBox(width: 12),
                  Expanded(
                      child: Text(
                          'Confirme a identidade do titular antes de executar qualquer ação LGPD.')),
                ])),
                const SizedBox(height: 18),
                DropdownButtonFormField<String>(
                  initialValue: _clienteId,
                  decoration: const InputDecoration(labelText: 'Cliente'),
                  items: _clientes
                      .map((cliente) => DropdownMenuItem(
                            value: cliente.id,
                            child: Text(cliente.nome,
                                overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() => _clienteId = value),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _justificativa,
                  decoration: const InputDecoration(
                      labelText: 'Justificativa da solicitação'),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 20),
                OutlinedButton.icon(
                  onPressed: _ocupado || _clienteId == null ? null : _exportar,
                  icon: const Icon(Icons.download_outlined),
                  label: const Text('Exportar e copiar dados'),
                ),
                const SizedBox(height: 10),
                FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.red),
                  onPressed: _ocupado ||
                          _clienteId == null ||
                          _justificativa.text.trim().isEmpty
                      ? null
                      : _anonimizar,
                  icon: const Icon(Icons.person_off_outlined),
                  label: const Text('Anonimizar cliente'),
                ),
                if (_clientes.isEmpty)
                  const EmptyState('Nenhum cliente cadastrado.'),
              ],
            ),
    );
  }
}
