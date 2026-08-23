import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class UsuariosPage extends StatefulWidget {
  const UsuariosPage({super.key});

  @override
  State<UsuariosPage> createState() => _UsuariosPageState();
}

class _UsuariosPageState extends State<UsuariosPage> {
  List<UsuarioSistema> _itens = [];
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    try {
      final itens = await context.read<UsuarioService>().listar();
      if (mounted) setState(() => _itens = itens);
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Future<void> _alterar(UsuarioSistema usuario) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${usuario.ativo ? 'Desativar' : 'Ativar'} usuário?'),
        content: const Text('A mudança afeta o próximo acesso desta conta.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(usuario.ativo ? 'Desativar' : 'Ativar')),
        ],
      ),
    );
    if (confirmar != true || !mounted) return;
    try {
      await context
          .read<UsuarioService>()
          .alterarStatus(usuario.id, !usuario.ativo);
      if (mounted) {
        mostrarMensagem(context,
            usuario.ativo ? 'Usuário desativado.' : 'Usuário ativado.');
        await _carregar();
      }
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Usuários')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _carregando
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.amber))
            : _itens.isEmpty
                ? ListView(
                    children: const [EmptyState('Nenhum usuário cadastrado.')])
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _itens.length + 1,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return const PanelCard(
                            child: Row(children: [
                          Icon(Icons.key_outlined, color: AppColors.amberText),
                          SizedBox(width: 12),
                          Expanded(
                              child: Text(
                                  'As senhas permanecem protegidas e nunca são exibidas.')),
                        ]));
                      }
                      final usuario = _itens[index - 1];
                      return PanelCard(
                        padding: EdgeInsets.zero,
                        child: ListTile(
                          leading: AvatarTile(usuario.nome),
                          title: Text(usuario.nome,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(
                              '${usuario.email}\n${usuario.perfil.label} · ${usuario.vinculo ?? 'PROPRIETARIO'}'),
                          isThreeLine: true,
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              StatusBadge.ativo(usuario.ativo),
                              const SizedBox(height: 2),
                              SizedBox(
                                height: 30,
                                child: IconButton(
                                  padding: EdgeInsets.zero,
                                  onPressed: () => _alterar(usuario),
                                  tooltip:
                                      usuario.ativo ? 'Desativar' : 'Ativar',
                                  icon: Icon(
                                      usuario.ativo
                                          ? Icons.toggle_on
                                          : Icons.toggle_off,
                                      color: usuario.ativo
                                          ? AppColors.green
                                          : AppColors.faint),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
