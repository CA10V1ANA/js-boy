import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../state/auth_controller.dart';
import '../../widgets/ui.dart';
import 'entrega_wizard.dart';

/// Abre o painel de detalhes da entrega. Devolve `true` quando alguma
/// acao alterou dados (para o chamador recarregar a lista).
Future<bool?> abrirEntregaDetalhe(BuildContext context, Entrega entrega) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
    ),
    builder: (_) => _EntregaDetalheSheet(entrega: entrega),
  );
}

class _EntregaDetalheSheet extends StatefulWidget {
  final Entrega entrega;

  const _EntregaDetalheSheet({required this.entrega});

  @override
  State<_EntregaDetalheSheet> createState() => _EntregaDetalheSheetState();
}

class _EntregaDetalheSheetState extends State<_EntregaDetalheSheet> {

  bool get _ehProprietario =>
      context.read<AuthController>().usuario?.perfil == PerfilAcesso.proprietario;

  Future<void> _alterarStatus() async {
    final status = await showModalBottomSheet<StatusEntrega>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (sheetContext) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: [
            for (final opcao in StatusEntrega.values)
              ListTile(
                leading: Icon(Icons.circle, size: 10, color: opcao.cor),
                title: Text(opcao.label, style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.w600)),
                trailing: opcao == widget.entrega.status ? const Icon(Icons.check, size: 18) : null,
                onTap: () => Navigator.pop(sheetContext, opcao),
              ),
          ],
        ),
      ),
    );

    if (status == null || !mounted) return;

    try {
      await context.read<EntregaService>().alterarStatus(widget.entrega.id, status);
      if (mounted) {
        mostrarMensagem(context, 'Status atualizado.');
        Navigator.pop(context, true);
      }
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _designarEntregador() async {
    final List<Entregador> entregadores;
    try {
      entregadores = (await context.read<EntregadorService>().listar())
          .where((entregador) => entregador.ativo)
          .toList();
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
      return;
    }

    if (!mounted) return;

    final escolhido = await showModalBottomSheet<Entregador>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (sheetContext) => SafeArea(
        child: entregadores.isEmpty
            ? const EmptyState('Nenhum entregador ativo.')
            : ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: 12),
                children: [
                  for (final entregador in entregadores)
                    ListTile(
                      leading: AvatarTile(entregador.nome, size: 34),
                      title: Text(entregador.nome,
                          style: GoogleFonts.hankenGrotesk(fontWeight: FontWeight.w600)),
                      subtitle: Text(entregador.tipoVeiculo.label,
                          style: GoogleFonts.hankenGrotesk(fontSize: 12, color: AppColors.muted)),
                      onTap: () => Navigator.pop(sheetContext, entregador),
                    ),
                ],
              ),
      ),
    );

    if (escolhido == null || !mounted) return;

    try {
      await context.read<EntregaService>().designarEntregador(widget.entrega.id, escolhido.id);
      if (mounted) {
        mostrarMensagem(context, 'Entregador designado.');
        Navigator.pop(context, true);
      }
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  Future<void> _cancelar() async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancelar entrega'),
        content: Text('Cancelar a entrega ${widget.entrega.codigo}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Voltar')),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Cancelar entrega', style: TextStyle(color: AppColors.red)),
          ),
        ],
      ),
    );

    if (confirmar != true || !mounted) return;

    try {
      await context.read<EntregaService>().alterarStatus(widget.entrega.id, StatusEntrega.cancelada);
      if (mounted) {
        mostrarMensagem(context, 'Entrega cancelada.');
        Navigator.pop(context, true);
      }
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final entrega = widget.entrega;

    return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.72,
        maxChildSize: 0.95,
        builder: (context, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.fieldBorder,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entrega.codigo,
                          style: GoogleFonts.hankenGrotesk(
                              fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.muted)),
                      const SizedBox(height: 2),
                      Text(entrega.destinatarioNome, style: AppTheme.display(size: 19)),
                    ],
                  ),
                ),
                StatusBadge.entrega(entrega.status),
              ],
            ),
            const SizedBox(height: 16),
            PanelCard(
              child: Column(
                children: [
                  _linha('Cliente', entrega.clienteNome),
                  _linha('Origem', '${entrega.enderecoOrigem} · ${entrega.bairroOrigem}'),
                  _linha('Destino', '${entrega.enderecoDestino} · ${entrega.bairroDestino}'),
                  _linha('Telefone', entrega.destinatarioTelefone),
                  _linha('Mercadoria', entrega.descricaoMercadoria),
                  if ((entrega.observacoes ?? '').isNotEmpty) _linha('Observacoes', entrega.observacoes!),
                  _linha('Entregador', entrega.entregadorNome ?? 'Sem entregador'),
                  _linha('Distancia', '${entrega.distanciaKm} km'),
                  _linha('Valor', money(entrega.valorFinal), destaque: true),
                ],
              ),
            ),
            if (_ehProprietario) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _alterarStatus,
                      icon: const Icon(Icons.sync, size: 18),
                      label: const Text('Status'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _designarEntregador,
                      icon: const Icon(Icons.person_add_alt, size: 18),
                      label: const Text('Designar'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final alterado = await abrirEntregaWizard(context, entrega: entrega);
                        if (alterado == true && context.mounted) {
                          Navigator.pop(context, true);
                        }
                      },
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text('Editar'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _cancelar,
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.red),
                      icon: const Icon(Icons.cancel_outlined, size: 18),
                      label: const Text('Cancelar'),
                    ),
                  ),
                ],
              ),
            ],
            if (entrega.historico.isNotEmpty) ...[
              const SizedBox(height: 20),
              const SectionTitle('Historico'),
              const SizedBox(height: 10),
              for (final item in entrega.historico)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Icon(Icons.circle, size: 9, color: item.novoStatus.cor),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.novoStatus.label,
                                style: GoogleFonts.hankenGrotesk(
                                    fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
                            Text(
                              '${item.usuarioResponsavelNome} · ${dataCurta(item.alteradoEm)} ${horaCurta(item.alteradoEm)}',
                              style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ],
        ),
    );
  }

  Widget _linha(String rotulo, String valor, {bool destaque = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: Text(rotulo,
                style: GoogleFonts.hankenGrotesk(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.muted)),
          ),
          Expanded(
            child: destaque
                ? Text(valor, style: AppTheme.display(size: 15, color: AppColors.amberText))
                : Text(valor,
                    style: GoogleFonts.hankenGrotesk(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.ink2)),
          ),
        ],
      ),
    );
  }
}
