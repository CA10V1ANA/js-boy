import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/format/formatters.dart';
import '../core/theme/app_theme.dart';
import '../models/models.dart';

/// Badge de status com as cores exatas do design v4.
class StatusBadge extends StatelessWidget {
  final String texto;
  final Color cor;
  final Color corFundo;

  const StatusBadge({super.key, required this.texto, required this.cor, required this.corFundo});

  StatusBadge.entrega(StatusEntrega status, {super.key})
      : texto = status.label,
        cor = status.cor,
        corFundo = status.corFundo;

  const StatusBadge.ativo(bool ativo, {super.key})
      : texto = ativo ? 'ATIVO' : 'INATIVO',
        cor = ativo ? AppColors.green : AppColors.red,
        corFundo = ativo ? AppColors.greenBg : AppColors.redBg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: corFundo, borderRadius: BorderRadius.circular(7)),
      child: Text(
        texto.toUpperCase(),
        style: GoogleFonts.hankenGrotesk(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
          color: cor,
        ),
      ),
    );
  }
}

/// Circulo com as iniciais do nome (avatar neutro do design).
class AvatarTile extends StatelessWidget {
  final String nome;
  final double size;

  const AvatarTile(this.nome, {super.key, this.size = 38});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(color: AppColors.iconTile, shape: BoxShape.circle),
      child: Text(
        iniciais(nome),
        style: GoogleFonts.hankenGrotesk(
          fontSize: size * 0.32,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF8A6108),
        ),
      ),
    );
  }
}

/// Card branco padrao (radius 15, borda hairline) do design v4.
class PanelCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const PanelCard({super.key, required this.child, this.padding = const EdgeInsets.all(16)});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: child,
    );
  }
}

/// KPI compacto: icone em tile tingido, rotulo e numero em Archivo.
class KpiCard extends StatelessWidget {
  final String rotulo;
  final String valor;
  final IconData icone;
  final Color cor;
  final Color corFundo;

  const KpiCard({
    super.key,
    required this.rotulo,
    required this.valor,
    required this.icone,
    required this.cor,
    required this.corFundo,
  });

  @override
  Widget build(BuildContext context) {
    return PanelCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(color: corFundo, shape: BoxShape.circle),
            child: Icon(icone, size: 18, color: cor),
          ),
          const SizedBox(height: 12),
          Text(rotulo, style: GoogleFonts.hankenGrotesk(fontSize: 11.5, color: AppColors.muted)),
          const SizedBox(height: 2),
          Text(valor, style: AppTheme.display(size: 20)),
        ],
      ),
    );
  }
}

/// Titulo de secao com a barrinha ambar do design.
class SectionTitle extends StatelessWidget {
  final String texto;

  const SectionTitle(this.texto, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(texto,
            style: GoogleFonts.hankenGrotesk(fontSize: 15.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
        const SizedBox(height: 6),
        Container(
          width: 26,
          height: 3,
          decoration: BoxDecoration(color: AppColors.amber, borderRadius: BorderRadius.circular(2)),
        ),
      ],
    );
  }
}

class EmptyState extends StatelessWidget {
  final String mensagem;

  const EmptyState(this.mensagem, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Text(mensagem, style: GoogleFonts.hankenGrotesk(fontSize: 13.5, color: AppColors.faint)),
      ),
    );
  }
}

/// Mostra um SnackBar de erro/sucesso padronizado.
void mostrarMensagem(BuildContext context, String texto, {bool erro = false}) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(texto),
    backgroundColor: erro ? AppColors.red : AppColors.ink,
  ));
}
