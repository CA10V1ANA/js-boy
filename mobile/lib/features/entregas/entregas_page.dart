import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';
import 'entrega_detalhe.dart';

enum _Filtro { todas, emRota, aguardando, entregue }

extension on _Filtro {
  String get label => switch (this) {
        _Filtro.todas => 'Todas',
        _Filtro.emRota => 'Em rota',
        _Filtro.aguardando => 'Aguardando',
        _Filtro.entregue => 'Entregue',
      };

  bool aceita(StatusEntrega status) => switch (this) {
        _Filtro.todas => true,
        _Filtro.entregue => status == StatusEntrega.entregue,
        _Filtro.emRota => status == StatusEntrega.emRota ||
            status == StatusEntrega.coletada ||
            status == StatusEntrega.entregadorDesignado,
        _Filtro.aguardando => status == StatusEntrega.solicitada ||
            status == StatusEntrega.confirmada ||
            status == StatusEntrega.aguardandoEntregador,
      };
}

class EntregasPage extends StatefulWidget {
  const EntregasPage({super.key});

  @override
  State<EntregasPage> createState() => _EntregasPageState();
}

class _EntregasPageState extends State<EntregasPage> {
  final _buscaController = TextEditingController();
  List<Entrega> _entregas = [];
  _Filtro _filtro = _Filtro.todas;
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
      final entregas = await context.read<EntregaService>().listar(busca: _buscaController.text.trim());
      if (!mounted) return;
      setState(() {
        _entregas = entregas;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _carregando = false);
      mostrarMensagem(context, error.message, erro: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtradas = _entregas.where((entrega) => _filtro.aceita(entrega.status)).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Entregas')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: TextField(
                controller: _buscaController,
                onSubmitted: (_) => _carregar(),
                textInputAction: TextInputAction.search,
                decoration: const InputDecoration(
                  hintText: 'Pesquisar por codigo ou cliente',
                  prefixIcon: Icon(Icons.search, size: 20, color: AppColors.faint),
                ),
              ),
            ),
            SizedBox(
              height: 52,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                children: [
                  for (final filtro in _Filtro.values)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(filtro.label),
                        selected: _filtro == filtro,
                        onSelected: (_) => setState(() => _filtro = filtro),
                        labelStyle: GoogleFonts.hankenGrotesk(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: _filtro == filtro ? AppColors.ink : AppColors.muted,
                        ),
                        selectedColor: Colors.white,
                        backgroundColor: const Color(0xFFEAE6DC),
                        side: BorderSide(
                          color: _filtro == filtro ? AppColors.cardBorder : Colors.transparent,
                        ),
                        showCheckmark: false,
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: _carregando
                  ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
                  : filtradas.isEmpty
                      ? const EmptyState('Nenhuma entrega encontrada.')
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                          itemCount: filtradas.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final entrega = filtradas[index];
                            return PanelCard(
                              padding: EdgeInsets.zero,
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                leading: AvatarTile(entrega.destinatarioNome),
                                title: Text(entrega.destinatarioNome,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.hankenGrotesk(
                                        fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                                subtitle: Text(
                                  '${entrega.codigo} · ${entrega.clienteNome}\n'
                                  '${entrega.entregadorNome ?? 'Sem entregador'}',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint),
                                ),
                                isThreeLine: true,
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    StatusBadge.entrega(entrega.status),
                                    const SizedBox(height: 4),
                                    Text(money(entrega.valorFinal), style: AppTheme.display(size: 13.5)),
                                  ],
                                ),
                                onTap: () async {
                                  final alterou = await abrirEntregaDetalhe(context, entrega);
                                  if (alterou == true) {
                                    _carregar();
                                  }
                                },
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
