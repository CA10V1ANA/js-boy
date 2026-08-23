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
  ConfiguracaoEmpresa? _contato;
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
        context.read<ClienteService>().contato(),
      ]);

      if (!mounted) return;
      setState(() {
        _cliente = resultados[0] as Cliente;
        _entregas = resultados[1] as List<Entrega>;
        _pagamentos = resultados[2] as List<Pagamento>;
        _contato = resultados[3] as ConfiguracaoEmpresa;
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

  Future<void> _solicitar() async {
    final campos = <String, TextEditingController>{
      for (final key in [
        'enderecoOrigem',
        'bairroOrigem',
        'enderecoDestino',
        'bairroDestino',
        'destinatarioNome',
        'destinatarioTelefone',
        'descricaoMercadoria',
        'observacoes',
        'distanciaKm'
      ])
        key: TextEditingController(),
    };
    campos['distanciaKm']!.text = '0';
    final formKey = GlobalKey<FormState>();
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Solicitar entrega'),
        content: SizedBox(
          width: double.maxFinite,
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(children: [
                _campoSolicitacao(
                    campos['enderecoOrigem']!, 'Endereço de origem'),
                _campoSolicitacao(campos['bairroOrigem']!, 'Bairro de origem'),
                _campoSolicitacao(
                    campos['enderecoDestino']!, 'Endereço de destino'),
                _campoSolicitacao(
                    campos['bairroDestino']!, 'Bairro de destino'),
                _campoSolicitacao(campos['destinatarioNome']!, 'Destinatário'),
                _campoSolicitacao(
                    campos['destinatarioTelefone']!, 'Telefone do destinatário',
                    teclado: TextInputType.phone),
                _campoSolicitacao(campos['descricaoMercadoria']!, 'Mercadoria'),
                _campoSolicitacao(
                    campos['distanciaKm']!, 'Distância estimada (km)',
                    teclado:
                        const TextInputType.numberWithOptions(decimal: true)),
                TextFormField(
                    controller: campos['observacoes'],
                    decoration: const InputDecoration(labelText: 'Observações'),
                    maxLines: 2),
              ]),
            ),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancelar')),
          FilledButton(
            onPressed: () {
              if (formKey.currentState!.validate()) {
                Navigator.pop(dialogContext, true);
              }
            },
            child: const Text('Enviar solicitação'),
          ),
        ],
      ),
    );
    if (confirmar == true && mounted) {
      try {
        await context.read<EntregaService>().solicitarComoCliente({
          for (final item in campos.entries)
            item.key: item.key == 'distanciaKm'
                ? double.parse(item.value.text.replaceAll(',', '.'))
                : item.value.text.trim(),
        });
        if (mounted) {
          mostrarMensagem(
              context, 'Solicitação recebida. A JS Boy fará a análise.');
          await _carregar();
        }
      } on ApiException catch (error) {
        if (mounted) mostrarMensagem(context, error.message, erro: true);
      }
    }
    for (final controller in campos.values) {
      controller.dispose();
    }
  }

  Widget _campoSolicitacao(TextEditingController controller, String label,
      {TextInputType? teclado}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: controller,
        keyboardType: teclado,
        decoration: InputDecoration(labelText: label),
        validator: (value) {
          if (value == null || value.trim().isEmpty) return 'Campo obrigatório';
          if (label.startsWith('Distância')) {
            final numero = double.tryParse(value.replaceAll(',', '.'));
            if (numero == null || numero < 0) return 'Distância inválida';
          }
          return null;
        },
      ),
    );
  }

  Future<void> _abrirDetalhes(Entrega entrega) async {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
          child: CircularProgressIndicator(color: AppColors.amber)),
    );
    try {
      final detalhes =
          await context.read<EntregaService>().detalhesCliente(entrega.id);
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop();
      final paradas = detalhes['paradas']!;
      final comprovantes = detalhes['comprovantes']!;
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (context) => SafeArea(
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.all(20),
            children: [
              Text('Entrega ${entrega.codigo}',
                  style: AppTheme.display(size: 20)),
              const SizedBox(height: 16),
              const SectionTitle('Paradas'),
              const SizedBox(height: 8),
              if (paradas.isEmpty)
                const Text('Nenhuma parada registrada.')
              else
                ...paradas.map((parada) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.place_outlined),
                      title: Text(parada['endereco'] as String? ?? ''),
                      subtitle: Text(
                          '${parada['tipo'] ?? ''} · ${parada['status'] ?? ''}'),
                    )),
              const SizedBox(height: 12),
              const SectionTitle('Comprovantes'),
              const SizedBox(height: 8),
              if (comprovantes.isEmpty)
                const Text('Nenhum comprovante registrado.')
              else
                ...comprovantes.map((comprovante) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.verified_outlined),
                      title:
                          Text(comprovante['tipo'] as String? ?? 'Comprovante'),
                      subtitle: Text(comprovante['recebedorNome'] as String? ??
                          'Registro operacional protegido'),
                    )),
            ],
          ),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop();
      mostrarMensagem(context, error.message, erro: true);
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _solicitar,
        icon: const Icon(Icons.add),
        label: const Text('Solicitar entrega'),
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
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                        onPressed: () => _abrirDetalhes(entrega),
                        icon: const Icon(Icons.visibility_outlined),
                        label: const Text('Ver detalhes')),
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
        if (_contato != null) ...[
          const SizedBox(height: 24),
          const SectionTitle('Fale com a JS Boy'),
          const SizedBox(height: 12),
          PanelCard(
              child: Column(children: [
            _linha('Empresa', _contato!.nomeFantasia),
            if (_contato!.telefone.isNotEmpty)
              _linha('Telefone', _contato!.telefone),
            if (_contato!.whatsapp.isNotEmpty)
              _linha('WhatsApp', _contato!.whatsapp),
            if (_contato!.email.isNotEmpty) _linha('E-mail', _contato!.email),
            if (_contato!.horarioAtendimento.isNotEmpty)
              _linha('Horário', _contato!.horarioAtendimento),
          ])),
        ],
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
