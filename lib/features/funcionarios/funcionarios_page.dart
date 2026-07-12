import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class FuncionariosPage extends StatefulWidget {
  const FuncionariosPage({super.key});

  @override
  State<FuncionariosPage> createState() => _FuncionariosPageState();
}

class _FuncionariosPageState extends State<FuncionariosPage> {
  List<Funcionario> _funcionarios = [];
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    try {
      final funcionarios = await context.read<FuncionarioService>().listar();
      if (!mounted) return;
      setState(() {
        _funcionarios = funcionarios;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _carregando = false);
      mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _criar() async {
    final nomeController = TextEditingController();
    final emailController = TextEditingController();
    final senhaController = TextEditingController();

    final confirmar = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Novo funcionario'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nomeController, decoration: const InputDecoration(labelText: 'Nome')),
            const SizedBox(height: 12),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'E-mail'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: senhaController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Senha inicial (min. 6)'),
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
      nomeController.dispose();
      emailController.dispose();
      senhaController.dispose();
      return;
    }

    try {
      await context.read<FuncionarioService>().criar(
            nome: nomeController.text.trim(),
            email: emailController.text.trim(),
            senha: senhaController.text,
          );
      if (mounted) {
        mostrarMensagem(context, 'Acesso de funcionario criado.');
        _carregar();
      }
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      nomeController.dispose();
      emailController.dispose();
      senhaController.dispose();
    }
  }

  Future<void> _alterarStatus(Funcionario funcionario) async {
    try {
      await context.read<FuncionarioService>().alterarStatus(funcionario.id, !funcionario.ativo);
      if (!mounted) return;
      mostrarMensagem(context, funcionario.ativo ? 'Funcionario desativado.' : 'Funcionario ativado.');
      _carregar();
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Funcionarios'),
        actions: [
          IconButton(
            onPressed: _criar,
            icon: const Icon(Icons.add_circle, color: AppColors.amber, size: 28),
            tooltip: 'Novo funcionario',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _carregando
            ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
            : _funcionarios.isEmpty
                ? ListView(children: const [EmptyState('Nenhum funcionario cadastrado.')])
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _funcionarios.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final funcionario = _funcionarios[index];
                      return PanelCard(
                        padding: EdgeInsets.zero,
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          leading: AvatarTile(funcionario.nome),
                          title: Text(funcionario.nome,
                              style: GoogleFonts.hankenGrotesk(
                                  fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                          subtitle: Text(funcionario.email,
                              style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint)),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              StatusBadge.ativo(funcionario.ativo),
                              PopupMenuButton<String>(
                                icon: const Icon(Icons.more_horiz, color: AppColors.faint),
                                onSelected: (_) => _alterarStatus(funcionario),
                                itemBuilder: (_) => [
                                  PopupMenuItem(
                                    value: 'status',
                                    child: Text(funcionario.ativo ? 'Desativar' : 'Ativar'),
                                  ),
                                ],
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
