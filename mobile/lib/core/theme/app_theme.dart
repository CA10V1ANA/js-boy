import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Tokens do design v4 (mesmos do painel web): fundo creme, acento ambar,
/// superficie escura para navegacao, Archivo para numeros/titulos e
/// Hanken Grotesk para o restante.
class AppColors {
  static const amber = Color(0xFFE9A81C);
  static const amberHover = Color(0xFFD2960E);
  static const amberInk = Color(0xFF3A2A00);
  static const amberText = Color(0xFFB07D0A);

  static const bg = Color(0xFFF4F2EC);
  static const surface = Colors.white;
  static const surfaceInput = Color(0xFFFAF8F3);
  static const cardBorder = Color(0xFFECE8DF);
  static const fieldBorder = Color(0xFFE3DFD4);
  static const rowDivider = Color(0xFFF1EEE6);
  static const iconTile = Color(0xFFF1EDE3);

  static const ink = Color(0xFF221F19);
  static const ink2 = Color(0xFF302C24);
  static const body = Color(0xFF57534A);
  static const muted = Color(0xFF8A8578);
  static const faint = Color(0xFFA6A296);

  static const dark = Color(0xFF1A1712);
  static const darkRibbon = Color(0xFF1C1912);

  static const green = Color(0xFF2E8B57);
  static const greenBg = Color(0xFFE4F3E9);
  static const teal = Color(0xFF1B8079);
  static const tealBg = Color(0xFFE1F0EF);
  static const ocre = Color(0xFFB47A12);
  static const ocreBg = Color(0xFFFCF3D6);
  static const red = Color(0xFFC0503F);
  static const redBg = Color(0xFFF8E6E2);
  static const purple = Color(0xFF6E58C8);
  static const purpleBg = Color(0xFFECE8FA);
}

class AppTheme {
  static ThemeData light() {
    final textTheme = GoogleFonts.hankenGroteskTextTheme();

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.bg,
      colorScheme: const ColorScheme.light(
        primary: AppColors.amber,
        onPrimary: AppColors.amberInk,
        secondary: AppColors.ink,
        onSecondary: Colors.white,
        surface: AppColors.surface,
        onSurface: AppColors.ink,
        error: AppColors.red,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.bg,
        foregroundColor: AppColors.ink,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.archivo(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: AppColors.ink,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.dark,
        indicatorColor: const Color(0xFF262119),
        height: 68,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.hankenGrotesk(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: selected ? const Color(0xFFF5F1E8) : const Color(0xFF9C978B),
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            size: 22,
            color: selected ? AppColors.amber : const Color(0xFF9C978B),
          );
        }),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.amber,
        foregroundColor: AppColors.amberInk,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.amber,
          foregroundColor: AppColors.amberInk,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.hankenGrotesk(fontSize: 14.5, fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.body,
          side: const BorderSide(color: AppColors.fieldBorder),
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.hankenGrotesk(fontSize: 14, fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceInput,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: const BorderSide(color: AppColors.fieldBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: const BorderSide(color: AppColors.fieldBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(11),
          borderSide: const BorderSide(color: AppColors.amberHover, width: 1.4),
        ),
        labelStyle: GoogleFonts.hankenGrotesk(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.body,
        ),
        hintStyle: GoogleFonts.hankenGrotesk(fontSize: 14, color: AppColors.faint),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.rowDivider, thickness: 1),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.ink,
        contentTextStyle: GoogleFonts.hankenGrotesk(fontSize: 13.5, color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  /// Estilo Archivo para numeros grandes (KPIs, valores).
  static TextStyle display({double size = 24, Color color = AppColors.ink}) {
    return GoogleFonts.archivo(fontSize: size, fontWeight: FontWeight.w800, color: color, letterSpacing: -0.3);
  }
}
