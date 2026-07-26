import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/external_actions_service.dart';
import '../../services/offline_operation_service.dart';
import '../../services/proof_queue_service.dart';
import '../../widgets/ui.dart';

class MinhasEntregasPage extends StatefulWidget {
  const MinhasEntregasPage({super.key});
  @override
  State<MinhasEntregasPage> createState() => _MinhasEntregasPageState();
}

class _MinhasEntregasPageState extends State<MinhasEntregasPage> {
  List<Entrega> _entregas = [];
  bool _carregando = true;
  bool _offline = false;
  int _pendentes = 0;
  String? _erro;
  String? _atualizandoId;

  @override
  void initState() { super.initState(); _carregar(); }

  Future<void> _carregar() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      try { await context.read<ProofQueueService>().sincronizar(); } catch (_) {}
      final result = await context.read<OfflineOperationService>().carregar();
      final proofs = await context.read<ProofQueueService>().quantidadePendente();
      if (!mounted) return;
      setState(() {
        _entregas = result.entregas; _offline = result.offline;
        _pendentes = result.acoesPendentes + proofs; _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() { _erro = error.message; _carregando = false; });
    }
  }

  StatusEntrega? _proximoStatus(StatusEntrega atual) => switch (atual) {
    StatusEntrega.entregadorDesignado => StatusEntrega.coletada,
    StatusEntrega.coletada => StatusEntrega.emRota,
    StatusEntrega.emRota => StatusEntrega.entregue,
    StatusEntrega.tentativaFalhou => StatusEntrega.emRota,
    StatusEntrega.emDevolucao => StatusEntrega.devolvida,
    _ => null,
  };
  String _acao(StatusEntrega status) => switch (status) {
    StatusEntrega.coletada => 'Confirmar coleta',
    StatusEntrega.emRota => 'Iniciar rota',
    StatusEntrega.entregue => 'Confirmar entrega',
    StatusEntrega.devolvida => 'Confirmar devolução',
    _ => 'Atualizar',
  };

  Future<void> _confirmarAvanco(Entrega entrega) async {
    final proximo = _proximoStatus(entrega.status);
    if (proximo == null || _atualizandoId != null) return;
    final confirmado = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('${_acao(proximo)}?'),
        content: Text(proximo == StatusEntrega.entregue
            ? 'A conclusão exige um comprovante já sincronizado.'
            : 'Confirme somente depois de concluir esta etapa.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Voltar')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: Text(_acao(proximo))),
        ],
      ),
    );
    if (confirmado == true) await _avancar(entrega, proximo);
  }

  Future<void> _avancar(Entrega entrega, StatusEntrega proximo) async {
    setState(() => _atualizandoId = entrega.id);
    try {
      final synced = await context.read<OfflineOperationService>().alterarStatus(entrega.id, proximo);
      if (!mounted) return;
      mostrarMensagem(context, synced
          ? 'Entrega ${entrega.codigo}: ${proximo.label}.'
          : 'Ação salva. Será sincronizada quando a conexão voltar.');
      await _carregar();
    } on DioException catch (error) {
      if (!mounted) return;
      setState(() => _erro = context.read<ApiClient>().translate(error).message);
    } finally {
      if (mounted) setState(() => _atualizandoId = null);
    }
  }

  Future<void> _comprovar(Entrega entrega) async {
    final controller = TextEditingController();
    final nome = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Comprovante de entrega'),
        content: TextField(
          controller: controller, autofocus: true,
          decoration: const InputDecoration(labelText: 'Nome de quem recebeu'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, controller.text.trim()), child: const Text('Abrir câmera')),
        ],
      ),
    );
    controller.dispose();
    if (nome == null || nome.isEmpty || !mounted) return;
    final saved = await context.read<ProofQueueService>().capturarEntrega(entrega.id, nome);
    if (!mounted || !saved) return;
    mostrarMensagem(context, 'Comprovante preservado e enviado ou aguardando sincronização.');
    await _carregar();
  }

  Future<void> _external(Future<bool> Function() action) async {
    final opened = await action();
    if (!opened && mounted) mostrarMensagem(context, 'Nenhum aplicativo compatível foi encontrado.');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Minhas entregas'),
      bottom: _offline || _pendentes > 0 ? PreferredSize(
        preferredSize: const Size.fromHeight(34),
        child: Semantics(
          liveRegion: true,
          child: Container(
            width: double.infinity, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
            color: _offline ? AppColors.redBg : AppColors.ocreBg,
            child: Text(_offline
                ? 'Modo offline · $_pendentes ação(ões) pendente(s)'
                : '$_pendentes ação(ões) aguardando sincronização'),
          ),
        ),
      ) : null,
    ),
    body: RefreshIndicator(color: AppColors.amber, onRefresh: _carregar, child: _conteudo()),
  );

  Widget _conteudo() {
    if (_carregando) return ListView(children: const [
      SizedBox(height: 180), Center(child: CircularProgressIndicator(color: AppColors.amber)),
    ]);
    if (_erro != null) return ListView(padding: const EdgeInsets.all(16), children: [
      PanelCard(child: Column(children: [
        const Icon(Icons.error_outline, color: AppColors.red), const SizedBox(height: 10),
        Text(_erro!, textAlign: TextAlign.center), const SizedBox(height: 12),
        OutlinedButton.icon(onPressed: _carregar, icon: const Icon(Icons.refresh), label: const Text('Tentar novamente')),
      ])),
    ]);
    if (_entregas.isEmpty) return ListView(children: const [EmptyState('Nenhuma entrega designada para você.')]);
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      itemCount: _entregas.length, separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final entrega = _entregas[index];
        final proximo = _proximoStatus(entrega.status);
        final actions = context.read<ExternalActionsService>();
        final origem = '${entrega.enderecoOrigem}, ${entrega.bairroOrigem}';
        final destino = '${entrega.enderecoDestino}, ${entrega.bairroDestino}';
        return Semantics(
          container: true, label: 'Entrega ${entrega.codigo}, status ${entrega.status.label}',
          child: PanelCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Wrap(alignment: WrapAlignment.spaceBetween, spacing: 10, runSpacing: 8, children: [
              Text(entrega.codigo, style: GoogleFonts.hankenGrotesk(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.muted)),
              StatusBadge.entrega(entrega.status),
            ]),
            const SizedBox(height: 8),
            Text(entrega.destinatarioNome, style: AppTheme.display(size: 16)),
            Text(destino), Text('Retirada: $origem', style: const TextStyle(color: AppColors.faint)),
            Text('Mercadoria: ${entrega.descricaoMercadoria}'),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: [
              OutlinedButton.icon(onPressed: () => _external(() => actions.abrirMapa(origem)), icon: const Icon(Icons.trip_origin), label: const Text('Mapa origem')),
              OutlinedButton.icon(onPressed: () => _external(() => actions.abrirMapa(destino)), icon: const Icon(Icons.place), label: const Text('Mapa destino')),
              OutlinedButton.icon(onPressed: () async { await actions.copiarEndereco(destino); if (mounted) mostrarMensagem(context, 'Endereço copiado.'); }, icon: const Icon(Icons.copy), label: const Text('Copiar')),
              if (entrega.destinatarioTelefone.isNotEmpty) ...[
                OutlinedButton.icon(onPressed: () => _external(() => actions.ligar(entrega.destinatarioTelefone)), icon: const Icon(Icons.phone), label: const Text('Ligar')),
                OutlinedButton.icon(onPressed: () => _external(() => actions.whatsapp(entrega.destinatarioTelefone)), icon: const Icon(Icons.chat), label: const Text('WhatsApp')),
              ],
            ]),
            if (entrega.status == StatusEntrega.emRota) ...[
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: OutlinedButton.icon(
                onPressed: () => _comprovar(entrega), icon: const Icon(Icons.photo_camera),
                label: const Text('Capturar comprovante'),
              )),
            ],
            if (proximo != null) ...[
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: FilledButton(
                onPressed: _atualizandoId == null ? () => _confirmarAvanco(entrega) : null,
                child: Text(_atualizandoId == entrega.id ? 'Atualizando...' : _acao(proximo)),
              )),
            ],
          ])),
        );
      },
    );
  }
}
