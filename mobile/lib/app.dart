import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/api/api_client.dart';
import 'core/storage/auth_storage.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/login_page.dart';
import 'features/shell/home_shell.dart';
import 'services/services.dart';
import 'services/offline_operation_service.dart';
import 'services/external_actions_service.dart';
import 'services/proof_queue_service.dart';
import 'state/auth_controller.dart';

class JsBoyApp extends StatelessWidget {
  const JsBoyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final storage = AuthStorage();
    final client = ApiClient(storage);

    return MultiProvider(
      providers: [
        Provider.value(value: client),
        Provider(create: (_) => AuthService(client)),
        Provider(create: (_) => ClienteService(client)),
        Provider(create: (_) => EntregadorService(client)),
        Provider(create: (_) => EntregaService(client)),
        Provider(create: (_) => OfflineOperationService(client)),
        Provider(create: (_) => ExternalActionsService()),
        Provider(create: (_) => ProofQueueService(client)),
        Provider(create: (_) => PagamentoService(client)),
        Provider(create: (_) => DashboardService(client)),
        Provider(create: (_) => ConfiguracaoPrecoService(client)),
        ChangeNotifierProvider(
          create: (context) => AuthController(
            storage: storage,
            authService: context.read<AuthService>(),
            client: client,
          ),
        ),
      ],
      child: MaterialApp(
        title: 'JS BOY',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const _Root(),
      ),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return switch (auth.status) {
      AuthStatus.carregando => const Scaffold(
          body:
              Center(child: CircularProgressIndicator(color: AppColors.amber)),
        ),
      AuthStatus.deslogado => const LoginPage(),
      AuthStatus.logado => const HomeShell(),
    };
  }
}
