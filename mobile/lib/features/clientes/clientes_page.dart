import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';
import 'cliente_form_page.dart';

class ClientesPage extends StatefulWidget {
  const ClientesPage({super.key});

  @override
  State<ClientesPage> createState() => _ClientesPageState();
}

class _ClientesPageState extends State<ClientesPage> {
  final _buscaController = TextEditingController();
  List<Cliente> _clientes = [];
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    _buscaController.dispose();
    super.dispose();
  }

  Future<void> _carregar() async {
    try {
      final clientes = await context.read<ClienteService>().listar(busca: _buscaController.text.trim());
      if (!mounted) return;
      setState(() {
        _clientes = clientes;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _carregando = false);
      mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _abrirForm({Cliente? cliente}) async {
    final salvou = await Navigator.of(context).push<bool>(
      MaterialPageRoute(fullscreenDialog: true, builder: (_) => ClienteFormPage(cliente: cliente)),
    );
    if (salvou == true) {
      _carregar();
    }
  }

  Future<void> _alterarStatus(Cliente cliente) async {
    try {
      await context.read<ClienteService>().alterarStatus(cliente.id, !cliente.ativo);
      if (!mounted) return;
      mostrarMensagem(context, cliente.ativo ? 'Cliente desativado.' : 'Cliente ativado.');
      _carregar();
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes'),
        actions: [
          IconButton(
            onPressed: () => _abrirForm(),
            icon: const Icon(Icons.add_circle, color: AppColors.amber, size: 28),
            tooltip: 'Novo cliente',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
              child: TextField(
                controller: _buscaController,
                onSubmitted: (_) => _carregar(),
                textInputAction: TextInputAction.search,
                decoration: const InputDecoration(
                  hintText: 'Pesquisar por nome ou telefone',
                  prefixIcon: Icon(Icons.search, size: 20, color: AppColors.faint),
                ),
              ),
            ),
            Expanded(
              child: _carregando
                  ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
                  : _clientes.isEmpty
                      ? const EmptyState('Nenhum cliente encontrado.')
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                          itemCount: _clientes.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final cliente = _clientes[index];
                            return PanelCard(
                              padding: EdgeInsets.zero,
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                                leading: AvatarTile(cliente.nome),
                                title: Text(cliente.nome,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.hankenGrotesk(
                                        fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                                subtitle: Text('${cliente.telefone} · ${cliente.endereco}, ${cliente.bairro}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint)),
                                trailing: PopupMenuButton<String>(
                                  icon: const Icon(Icons.more_horiz, color: AppColors.faint),
                                  onSelected: (acao) {
                                    if (acao == 'editar') _abrirForm(cliente: cliente);
                                    if (acao == 'status') _alterarStatus(cliente);
                                  },
                                  itemBuilder: (_) => [
                                    const PopupMenuItem(value: 'editar', child: Text('Editar')),
                                    PopupMenuItem(
                                      value: 'status',
                                      child: Text(cliente.ativo ? 'Desativar' : 'Ativar'),
                                    ),
                                  ],
                                ),
                                onTap: () => _abrirForm(cliente: cliente),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
