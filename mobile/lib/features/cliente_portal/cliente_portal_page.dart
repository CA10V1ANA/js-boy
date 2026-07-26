import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class ClientePortalPage extends StatefulWidget {
  const ClientePortalPage({super.key});

  @override
  State<ClientePortalPage> createState() => _ClientePortalPageState();
}

class _ClientePortalPageState extends State<ClientePortalPage> {
  Cliente? _cliente;
  List<Entrega> _entregas = [];
  List<Pagamento> _pagamentos = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });

    try {
      final resultados = await Future.wait([
        context.read<ClienteService>().meuCadastro(),
        context.read<EntregaService>().entregasDoCliente(),
        context.read<PagamentoService>().pagamentosDoCliente(),
      ]);

      if (!mounted) return;
      setState(() {
        _cliente = resultados[0] as Cliente;
        _entregas = resultados[1] as List<Entrega>;
        _pagamentos = resultados[2] as List<Pagamento>;
        _carregando = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _erro = error.message;
        _carregando = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Minha conta')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: _conteudo(),
      ),
    );
  }

  Widget _conteudo() {
    if (_carregando) {
      return Center(
        child: Semantics(
          label: 'Carregando sua conta',
          child: const CircularProgressIndicator(color: AppColors.amber),
        ),
      );
    }

    if (_erro != null || _cliente == null) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PanelCard(
            child: Column(
              children: [
                const Icon(Icons.error_outline, color: AppColors.red),
                const SizedBox(height: 10),
                Text(
                  _erro ?? 'Nao foi possivel carregar sua conta.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.hankenGrotesk(color: AppColors.body),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _carregar,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    final cliente = _cliente!;
    final endereco = [
      cliente.endereco,
      cliente.bairro,
      cliente.cidade,
    ].where((item) => item.trim().isNotEmpty).join(', ');

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
      children: [
        Semantics(
          header: true,
          child: const SectionTitle('Meu cadastro'),
        ),
        const SizedBox(height: 12),
        PanelCard(
          child: Column(
            children: [
              _linha('Nome', cliente.nome),
              _linha('Telefone', cliente.telefone),
              if ((cliente.email ?? '').isNotEmpty)
                _linha('E-mail', cliente.email!),
              if ((cliente.documento ?? '').isNotEmpty)
                _linha('Documento', cliente.documento!),
              if (endereco.isNotEmpty) _linha('Endereco', endereco),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Semantics(
          header: true,
          child: const SectionTitle('Minhas entregas'),
        ),
        const SizedBox(height: 12),
        if (_entregas.isEmpty)
          const PanelCard(
              child: EmptyState('Nenhuma entrega vinculada a sua conta.'))
        else
          for (final entrega in _entregas) ...[
            PanelCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          entrega.codigo,
                          style: GoogleFonts.hankenGrotesk(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.muted,
                          ),
                        ),
                      ),
                      StatusBadge.entrega(entrega.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(entrega.destinatarioNome,
                      style: AppTheme.display(size: 16)),
                  const SizedBox(height: 4),
                  Text(
                    '${entrega.enderecoDestino} · ${entrega.bairroDestino}',
                    style: GoogleFonts.hankenGrotesk(
                        fontSize: 12.5, color: AppColors.body),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Criada em ${dataCurta(entrega.criadoEm)}',
                    style: GoogleFonts.hankenGrotesk(
                        fontSize: 12, color: AppColors.faint),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
        const SizedBox(height: 12),
        Semantics(
          header: true,
          child: const SectionTitle('Meus pagamentos'),
        ),
        const SizedBox(height: 12),
        if (_pagamentos.isEmpty)
          const PanelCard(
              child: EmptyState('Nenhum pagamento vinculado a sua conta.'))
        else
          PanelCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var index = 0; index < _pagamentos.length; index++) ...[
                  if (index > 0) const Divider(height: 1),
                  ListTile(
                    title: Text(
                      _pagamentos[index].entregaCodigo,
                      style: GoogleFonts.hankenGrotesk(
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                    subtitle: Text(
                      '${dataCurta(_pagamentos[index].pagoEm)} · ${_pagamentos[index].formaPagamento.label}',
                      style: GoogleFonts.hankenGrotesk(
                          fontSize: 12, color: AppColors.faint),
                    ),
                    trailing: Text(
                      money(_pagamentos[index].valor),
                      style: AppTheme.display(
                          size: 14, color: AppColors.amberText),
                    ),
                  ),
                ],
              ],
            ),
          ),
      ],
    );
  }

  Widget _linha(String rotulo, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 88,
            child: Text(
              rotulo,
              style: GoogleFonts.hankenGrotesk(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.muted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              valor,
              style: GoogleFonts.hankenGrotesk(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.ink2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
