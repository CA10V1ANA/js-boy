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
import '../entregas/entrega_detalhe.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  DashboardResumo _resumo = DashboardResumo.vazio();
  RelatorioFinanceiro _relatorio = RelatorioFinanceiro.vazio();
  List<Entrega> _emAndamento = [];
  bool _carregando = true;

  bool get _ehProprietario =>
      context.read<AuthController>().usuario?.perfil == PerfilAcesso.proprietario;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    try {
      final resumo = await context.read<DashboardService>().resumo();

      var relatorio = _relatorio;
      var emAndamento = _emAndamento;

      // Financeiro e lista de entregas sao restritos ao proprietario no backend.
      if (_ehProprietario) {
        if (!mounted) return;
        final resultados = await Future.wait([
          context.read<PagamentoService>().relatorio(),
          context.read<EntregaService>().listar(),
        ]);
        relatorio = resultados[0] as RelatorioFinanceiro;
        emAndamento = (resultados[1] as List<Entrega>)
            .where((entrega) => entrega.status.emAndamento)
            .take(5)
            .toList();
      }

      if (!mounted) return;
      setState(() {
        _resumo = resumo;
        _relatorio = relatorio;
        _emAndamento = emAndamento;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _carregando = false);
      mostrarMensagem(context, error.message, erro: true);
    }
  }

  String _saudacao() {
    final hora = DateTime.now().hour;
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  @override
  Widget build(BuildContext context) {
    final usuario = context.watch<AuthController>().usuario;
    final primeiroNome = (usuario?.nome ?? '').split(' ').first;

    return Scaffold(
      appBar: AppBar(
        title: Text('${_saudacao()}, $primeiroNome.'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: AvatarTile(usuario?.nome ?? '?', size: 34),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _carregando
            ? const Center(child: CircularProgressIndicator(color: AppColors.amber))
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                children: [
                  _faixaStatus(),
                  const SizedBox(height: 20),
                  const SectionTitle('Resumo da operacao'),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.55,
                    children: [
                      KpiCard(
                        rotulo: 'Entregas',
                        valor: '${_resumo.totalEntregas}'.padLeft(2, '0'),
                        icone: Icons.inventory_2_outlined,
                        cor: const Color(0xFFC8880C),
                        corFundo: const Color(0xFFFBEFD3),
                      ),
                      KpiCard(
                        rotulo: 'Em rota',
                        valor: '${_resumo.emAndamento}'.padLeft(2, '0'),
                        icone: Icons.local_shipping_outlined,
                        cor: AppColors.green,
                        corFundo: AppColors.greenBg,
                      ),
                      KpiCard(
                        rotulo: 'Aguardando',
                        valor: '${_resumo.solicitadas}'.padLeft(2, '0'),
                        icone: Icons.schedule,
                        cor: AppColors.ocre,
                        corFundo: AppColors.ocreBg,
                      ),
                      KpiCard(
                        rotulo: 'Recebido hoje',
                        valor: money(_relatorio.valorRecebido),
                        icone: Icons.attach_money,
                        cor: AppColors.purple,
                        corFundo: AppColors.purpleBg,
                      ),
                    ],
                  ),
                  if (_ehProprietario) ...[
                    const SizedBox(height: 24),
                    const SectionTitle('Entregas em andamento'),
                    const SizedBox(height: 12),
                    if (_emAndamento.isEmpty)
                      const PanelCard(child: EmptyState('Nenhuma entrega em andamento.'))
                    else
                      PanelCard(
                        padding: EdgeInsets.zero,
                        child: Column(
                          children: [
                            for (var i = 0; i < _emAndamento.length; i++) ...[
                              if (i > 0) const Divider(height: 1),
                              _linhaEntrega(_emAndamento[i]),
                            ],
                          ],
                        ),
                      ),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _faixaStatus() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkRibbon,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 9,
                height: 9,
                decoration: const BoxDecoration(
                  color: Color(0xFF4FB477),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Color(0x404FB477), spreadRadius: 3),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Text('OPERACAO ATIVA',
                  style: GoogleFonts.hankenGrotesk(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                    color: const Color(0xFFEDE8DC),
                  )),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _itemFaixa('ENTREGAS', '${_resumo.totalEntregas}'.padLeft(2, '0'), const Color(0xFFEDE8DC)),
              _itemFaixa('EM ROTA', '${_resumo.emAndamento}'.padLeft(2, '0'), const Color(0xFF4FB477)),
              if (_ehProprietario)
                _itemFaixa('RECEBIDO', money(_relatorio.valorRecebido), const Color(0xFFE9B84A)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _itemFaixa(String rotulo, String valor, Color corValor) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(rotulo,
              style: GoogleFonts.hankenGrotesk(
                fontSize: 9.5,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.1,
                color: const Color(0xFF7C776A),
              )),
          const SizedBox(height: 3),
          Text(valor, style: AppTheme.display(size: 15, color: corValor)),
        ],
      ),
    );
  }

  Widget _linhaEntrega(Entrega entrega) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: AvatarTile(entrega.destinatarioNome),
      title: Text(entrega.destinatarioNome,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.hankenGrotesk(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
      subtitle: Text('${entrega.codigo} · ${entrega.bairroDestino}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.faint)),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          StatusBadge.entrega(entrega.status),
          const SizedBox(height: 4),
          Text(money(entrega.valorFinal),
              style: AppTheme.display(size: 13)),
        ],
      ),
      onTap: () => abrirEntregaDetalhe(context, entrega),
    );
  }
}
