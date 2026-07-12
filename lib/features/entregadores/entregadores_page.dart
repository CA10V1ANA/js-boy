import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';
import 'entregador_form_page.dart';

class EntregadoresPage extends StatefulWidget {
  const EntregadoresPage({super.key});

  @override
  State<EntregadoresPage> createState() => _EntregadoresPageState();
}

class _EntregadoresPageState extends State<EntregadoresPage> {
  List<Entregador> _entregadores = [];
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    try {
      final entregadores = await context.read<EntregadorService>().listar();
      if (!mounted) return;
      setState(() {
        _entregadores = entregadores;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _carregando = false);
      mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _abrirForm({Entregador? entregador}) async {
    final salvou = await Navigator.of(context).push<bool>(
      MaterialPageRoute(fullscreenDialog: true, builder: (_) => EntregadorFormPage(entregador: entregador)),
    );
    if (salvou == true) {
      _carregar();
    }
  }

  Future<void> _alterarStatus(Entregador entregador) async {
    try {
      await context.read<EntregadorService>().alterarStatus(entregador.id, !entregador.ativo);
      if (!mounted) return;
      mostrarMensagem(context, entregador.ativo ? 'Entregador desativado.' : 'Entregador ativado.');
      _carregar();
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _criarAcesso(Entregador entregador) async {
    final emailController = TextEditingController(text: entregador.email ?? '');
    final senhaController = TextEditingController(text: '123456');

    final confirmar = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Acesso de ${entregador.nome}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'E-mail de login'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: senhaController,
              decoration: const InputDecoration(labelText: 'Senha inicial'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(0, 40)),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Criar acesso'),
          ),
        ],
      ),
    );

    if (confirmar != true || !mounted) {
      emailController.dispose();
      senhaController.dispose();
      return;
    }

    try {
      await context
          .read<EntregadorService>()
          .criarAcesso(entregador.id, emailController.text.trim(), senhaController.text);
      if (mounted) {
        mostrarMensagem(context, 'Acesso do entregador criado.');
        _carregar();
      }
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      emailController.dispose();
      senhaController.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Entregadores'),
        actions: [
          IconButton(
            onPressed: () => _abrirForm(),
            icon: const Icon(Icons.add_circle, color: AppColors.amber, size: 28),
            tooltip: 'Novo entregador',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _carregando
            ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
            : _entregadores.isEmpty
                ? ListView(children: const [EmptyState('Nenhum entregador cadastrado.')])
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _entregadores.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final entregador = _entregadores[index];
                      return PanelCard(
                        padding: EdgeInsets.zero,
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          leading: AvatarTile(entregador.nome),
                          title: Text(entregador.nome,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.hankenGrotesk(
                                  fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                          subtitle: Text(
                            '${entregador.telefone} · ${entregador.tipoVeiculo.label}'
                            '${entregador.placaVeiculo != null ? ' ${entregador.placaVeiculo}' : ''}\n'
                            '${entregador.possuiAcesso ? 'Acesso criado' : 'Sem acesso'}',
                            maxLines: 2,
                            style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint),
                          ),
                          isThreeLine: true,
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              StatusBadge(
                                texto: entregador.disponivel ? 'Disponivel' : 'Ocupado',
                                cor: entregador.disponivel ? AppColors.green : AppColors.muted,
                                corFundo: entregador.disponivel ? AppColors.greenBg : const Color(0xFFF0EEE7),
                              ),
                              const SizedBox(height: 4),
                              StatusBadge.ativo(entregador.ativo),
                            ],
                          ),
                          onTap: () => _mostrarAcoes(entregador),
                        ),
                      );
                    },
                  ),
      ),
    );
  }

  void _mostrarAcoes(Entregador entregador) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit_outlined, size: 20),
              title: const Text('Editar'),
              onTap: () {
                Navigator.pop(sheetContext);
                _abrirForm(entregador: entregador);
              },
            ),
            if (!entregador.possuiAcesso)
              ListTile(
                leading: const Icon(Icons.key_outlined, size: 20),
                title: const Text('Criar acesso'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  _criarAcesso(entregador);
                },
              ),
            ListTile(
              leading: Icon(
                entregador.ativo ? Icons.block : Icons.check_circle_outline,
                size: 20,
                color: entregador.ativo ? AppColors.red : AppColors.green,
              ),
              title: Text(entregador.ativo ? 'Desativar' : 'Ativar'),
              onTap: () {
                Navigator.pop(sheetContext);
                _alterarStatus(entregador);
              },
            ),
          ],
        ),
      ),
    );
  }
}
