import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format/formatters.dart';
import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../widgets/ui.dart';

class AuditoriaPage extends StatefulWidget {
  const AuditoriaPage({super.key});

  @override
  State<AuditoriaPage> createState() => _AuditoriaPageState();
}

class _AuditoriaPageState extends State<AuditoriaPage> {
  List<Auditoria> _itens = [];
  String _entidade = '';
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() => _carregando = true);
    try {
      final itens =
          await context.read<AuditoriaService>().listar(entidade: _entidade);
      if (mounted) setState(() => _itens = itens);
    } on ApiException catch (error) {
      if (mounted) mostrarMensagem(context, error.message, erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  String _legenda(String value) => value
      .toLowerCase()
      .split('_')
      .map((parte) => parte.isEmpty
          ? parte
          : '${parte[0].toUpperCase()}${parte.substring(1)}')
      .join(' ');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Auditoria')),
      body: RefreshIndicator(
        color: AppColors.amber,
        onRefresh: _carregar,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const PanelCard(
              child: Row(children: [
                Icon(Icons.shield_outlined, color: AppColors.amberText),
                SizedBox(width: 12),
                Expanded(
                    child: Text(
                        'Consulte quem realizou cada alteração e quando ela aconteceu.')),
              ]),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _entidade,
              decoration: const InputDecoration(labelText: 'Filtrar por área'),
              items: const [
                DropdownMenuItem(value: '', child: Text('Todas as áreas')),
                DropdownMenuItem(value: 'ENTREGA', child: Text('Entregas')),
                DropdownMenuItem(value: 'CLIENTE', child: Text('Clientes')),
                DropdownMenuItem(
                    value: 'ENTREGADOR', child: Text('Entregadores')),
                DropdownMenuItem(value: 'PAGAMENTO', child: Text('Pagamentos')),
                DropdownMenuItem(value: 'USUARIO', child: Text('Usuários')),
                DropdownMenuItem(
                    value: 'CONFIGURACAO_PRECO', child: Text('Preços')),
              ],
              onChanged: (value) {
                _entidade = value ?? '';
                _carregar();
              },
            ),
            const SizedBox(height: 16),
            if (_carregando)
              const Center(
                  child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(color: AppColors.amber),
              ))
            else if (_itens.isEmpty)
              const EmptyState('Nenhum evento registrado.')
            else
              ..._itens.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: PanelCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Expanded(
                                child: Text(_legenda(item.acao),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700))),
                            StatusBadge(
                              texto: _legenda(item.entidade),
                              cor: AppColors.ocre,
                              corFundo: AppColors.ocreBg,
                            ),
                          ]),
                          const SizedBox(height: 8),
                          Text('${item.usuarioNome} · ${item.perfil.label}'),
                          const SizedBox(height: 4),
                          Text(
                              '${dataCurta(item.ocorridoEm)} às ${horaCurta(item.ocorridoEm)}',
                              style: const TextStyle(color: AppColors.faint)),
                          if (item.motivo?.isNotEmpty == true) ...[
                            const SizedBox(height: 6),
                            Text('Motivo: ${item.motivo}'),
                          ],
                        ],
                      ),
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}
