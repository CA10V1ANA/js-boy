import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../state/auth_controller.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _senhaController = TextEditingController();
  bool _enviando = false;
  bool _mostrarSenha = false;

  @override
  void dispose() {
    _emailController.dispose();
    _senhaController.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _enviando = true);

    try {
      await context.read<AuthController>().login(
            _emailController.text.trim(),
            _senhaController.text,
          );
    } on ApiException catch (error) {
      if (mounted) {
        final mensagem = error.statusCode == 401 ? 'E-mail ou senha invalidos.' : error.message;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(mensagem)));
      }
    } finally {
      if (mounted) {
        setState(() => _enviando = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.amber,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.inventory_2_outlined, color: AppColors.amberInk),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('JS BOY',
                              style: GoogleFonts.archivo(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFFF6F2E9),
                              )),
                          Text('DESPACHO',
                              style: GoogleFonts.hankenGrotesk(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 2.5,
                                color: AppColors.amber,
                              )),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('Entrar no painel',
                              style: GoogleFonts.archivo(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: AppColors.ink,
                              )),
                          const SizedBox(height: 4),
                          Text('Use o mesmo acesso do painel web.',
                              style: GoogleFonts.hankenGrotesk(fontSize: 13, color: AppColors.muted)),
                          const SizedBox(height: 20),
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.username],
                            decoration: const InputDecoration(labelText: 'E-mail'),
                            validator: (value) =>
                                (value == null || value.trim().isEmpty) ? 'Informe o e-mail' : null,
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _senhaController,
                            obscureText: !_mostrarSenha,
                            autofillHints: const [AutofillHints.password],
                            onFieldSubmitted: (_) => _entrar(),
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _mostrarSenha ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  color: AppColors.muted,
                                  size: 20,
                                ),
                                onPressed: () => setState(() => _mostrarSenha = !_mostrarSenha),
                              ),
                            ),
                            validator: (value) =>
                                (value == null || value.isEmpty) ? 'Informe a senha' : null,
                          ),
                          const SizedBox(height: 20),
                          FilledButton(
                            onPressed: _enviando ? null : _entrar,
                            child: _enviando
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.amberInk),
                                  )
                                : const Text('Entrar'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
