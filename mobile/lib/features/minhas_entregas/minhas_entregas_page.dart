import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

/// Fluxo do entregador: apenas as entregas designadas a ele, com avanco
/// rapido de status (Coletada -> Em rota -> Entregue).
class MinhasEntregasPage extends StatefulWidget {
  const MinhasEntregasPage({super.key});

  @override
  State<MinhasEntregasPage> createState() => _MinhasEntregasPageState();
}

class _MinhasEntregasPageState extends State<MinhasEntregasPage> {
  List<Entrega> _entregas = [];
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    try {
      final entregas = await context.read<EntregaService>().minhasEntregas();
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

  StatusEntrega? _proximoStatus(StatusEntrega atual) => switch (atual) {
        StatusEntrega.entregadorDesignado => StatusEntrega.coletada,
        StatusEntrega.coletada => StatusEntrega.emRota,
        StatusEntrega.emRota => StatusEntrega.entregue,
        _ => null,
      };

  Future<void> _avancar(Entrega entrega) async {
    final proximo = _proximoStatus(entrega.status);
    if (proximo == null) return;

    try {
      await context.read<EntregaService>().alterarStatusMinhaEntrega(entrega.id, proximo);
      if (!mounted) return;
      mostrarMensagem(context, 'Entrega ${entrega.codigo}: ${proximo.label}.');
      _carregar();
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Minhas entregas')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _carregando
            ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
            : _entregas.isEmpty
                ? ListView(children: const [EmptyState('Nenhuma entrega designada para voce.')])
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _entregas.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final entrega = _entregas[index];
                      final proximo = _proximoStatus(entrega.status);

                      return PanelCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(entrega.codigo,
                                      style: GoogleFonts.hankenGrotesk(
                                          fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.muted)),
                                ),
                                StatusBadge.entrega(entrega.status),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(entrega.destinatarioNome, style: AppTheme.display(size: 16)),
                            const SizedBox(height: 4),
                            Text('${entrega.enderecoDestino} · ${entrega.bairroDestino}',
                                style: GoogleFonts.hankenGrotesk(fontSize: 12.5, color: AppColors.body)),
                            Text('Retirada: ${entrega.enderecoOrigem} · ${entrega.bairroOrigem}',
                                style: GoogleFonts.hankenGrotesk(fontSize: 12, color: AppColors.faint)),
                            const SizedBox(height: 6),
                            Text('Mercadoria: ${entrega.descricaoMercadoria}',
                                style: GoogleFonts.hankenGrotesk(fontSize: 12.5, color: AppColors.body)),
                            if ((entrega.observacoes ?? '').isNotEmpty)
                              Text('Obs.: ${entrega.observacoes}',
                                  style: GoogleFonts.hankenGrotesk(fontSize: 12, color: AppColors.faint)),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Text(money(entrega.valorFinal),
                                    style: AppTheme.display(size: 16, color: AppColors.amberText)),
                                const Spacer(),
                                if (proximo != null)
                                  FilledButton(
                                    style: FilledButton.styleFrom(
                                      minimumSize: const Size(0, 40),
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                    ),
                                    onPressed: () => _avancar(entrega),
                                    child: Text('Marcar ${proximo.label.toLowerCase()}'),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
