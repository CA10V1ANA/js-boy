import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../widgets/ui.dart';
import '../auditoria/auditoria_page.dart';
import '../config/configuracao_empresa_page.dart';
import '../faturamento/meu_faturamento_page.dart';
import '../faturamento/razao_financeira_page.dart';
import '../funcionarios/funcionarios_page.dart';
import '../privacidade/privacidade_page.dart';
import '../usuarios/usuarios_page.dart';
import '../config/configuracoes_page.dart';
import '../entregadores/entregadores_page.dart';
import '../pagamentos/pagamentos_page.dart';
import '../relatorios/relatorios_page.dart';

/// Aba "Mais": itens secundarios da navegacao + dados do usuario + sair.
class MaisPage extends StatelessWidget {
  const MaisPage({super.key});

  void _abrir(BuildContext context, Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final usuario = auth.usuario;
    final ehProprietario = usuario?.perfil == PerfilAcesso.proprietario;

    return Scaffold(
      appBar: AppBar(title: const Text('Mais')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PanelCard(
            child: Row(
              children: [
                AvatarTile(usuario?.nome ?? '?', size: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(usuario?.nome ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.hankenGrotesk(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink)),
                      Text(usuario?.perfil.label ?? '',
                          style: GoogleFonts.hankenGrotesk(
                              fontSize: 12, color: AppColors.muted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (ehProprietario)
            PanelCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _item(context, Icons.person_outline, 'Entregadores',
                      const EntregadoresPage()),
                  const Divider(height: 1),
                  _item(context, Icons.credit_card_outlined, 'Pagamentos',
                      const PagamentosPage()),
                  const Divider(height: 1),
                  _item(context, Icons.bar_chart_outlined, 'Relatórios',
                      const RelatoriosPage()),
                  const Divider(height: 1),
                  _item(context, Icons.settings_outlined, 'Preços',
                      const ConfiguracoesPage()),
                  const Divider(height: 1),
                  _item(context, Icons.people_alt_outlined, 'Funcionários',
                      const FuncionariosPage()),
                  const Divider(height: 1),
                  _item(context, Icons.manage_accounts_outlined, 'Usuários',
                      const UsuariosPage()),
                  const Divider(height: 1),
                  _item(context, Icons.history_outlined, 'Auditoria',
                      const AuditoriaPage()),
                  const Divider(height: 1),
                  _item(context, Icons.business_outlined, 'Empresa',
                      const ConfiguracaoEmpresaPage()),
                  const Divider(height: 1),
                  _item(context, Icons.account_balance_outlined,
                      'Razão financeira', const RazaoFinanceiraPage()),
                  const Divider(height: 1),
                  _item(context, Icons.privacy_tip_outlined, 'Privacidade',
                      const PrivacidadePage()),
                ],
              ),
            ),
          if (usuario?.perfil.ehEntregador == true)
            PanelCard(
              padding: EdgeInsets.zero,
              child: _item(context, Icons.account_balance_wallet_outlined,
                  'Meu faturamento', const MeuFaturamentoPage()),
            ),
          const SizedBox(height: 16),
          PanelCard(
            padding: EdgeInsets.zero,
            child: ListTile(
              leading: const Icon(Icons.logout, color: AppColors.red, size: 20),
              title: Text('Sair',
                  style: GoogleFonts.hankenGrotesk(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.red)),
              onTap: () => context.read<AuthController>().logout(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _item(
      BuildContext context, IconData icone, String titulo, Widget page) {
    return ListTile(
      leading: Icon(icone, size: 20, color: AppColors.body),
      title: Text(titulo,
          style: GoogleFonts.hankenGrotesk(
              fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
      trailing:
          const Icon(Icons.chevron_right, size: 20, color: AppColors.faint),
      onTap: () => _abrir(context, page),
    );
  }
}
