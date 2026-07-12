import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../clientes/clientes_page.dart';
import '../dashboard/dashboard_page.dart';
import '../entregas/entrega_wizard.dart';
import '../entregas/entregas_page.dart';
import '../mais/mais_page.dart';
import '../minhas_entregas/minhas_entregas_page.dart';

/// Navegacao principal: Tab Bar inferior (3-4 destinos por perfil) + FAB
/// ambar para a acao principal "Nova entrega". Itens secundarios ficam
/// na aba "Mais".
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  // Forca o recarregamento das listas depois de criar uma entrega pelo FAB.
  int _refreshTick = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final perfil = auth.usuario?.perfil ?? PerfilAcesso.funcionario;

    final (paginas, destinos) = switch (perfil) {
      PerfilAcesso.proprietario => (
          <Widget>[
            DashboardPage(key: ValueKey('dash-$_refreshTick')),
            EntregasPage(key: ValueKey('entregas-$_refreshTick')),
            const ClientesPage(),
            const MaisPage(),
          ],
          const <NavigationDestination>[
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Inicio'),
            NavigationDestination(icon: Icon(Icons.local_shipping_outlined), selectedIcon: Icon(Icons.local_shipping), label: 'Entregas'),
            NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Clientes'),
            NavigationDestination(icon: Icon(Icons.menu), label: 'Mais'),
          ],
        ),
      PerfilAcesso.funcionario => (
          <Widget>[
            DashboardPage(key: ValueKey('dash-$_refreshTick')),
            const ClientesPage(),
            const MaisPage(),
          ],
          const <NavigationDestination>[
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Inicio'),
            NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Clientes'),
            NavigationDestination(icon: Icon(Icons.menu), label: 'Mais'),
          ],
        ),
      PerfilAcesso.entregador => (
          <Widget>[
            MinhasEntregasPage(key: ValueKey('minhas-$_refreshTick')),
            const MaisPage(),
          ],
          const <NavigationDestination>[
            NavigationDestination(icon: Icon(Icons.local_shipping_outlined), selectedIcon: Icon(Icons.local_shipping), label: 'Minhas entregas'),
            NavigationDestination(icon: Icon(Icons.menu), label: 'Mais'),
          ],
        ),
    };

    final indexSeguro = _index < paginas.length ? _index : 0;
    final mostrarFab = perfil == PerfilAcesso.proprietario && indexSeguro <= 1;

    return Scaffold(
      body: IndexedStack(index: indexSeguro, children: paginas),
      floatingActionButton: mostrarFab
          ? FloatingActionButton.extended(
              onPressed: () async {
                final criado = await abrirEntregaWizard(context);
                if (criado == true) {
                  setState(() => _refreshTick++);
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Nova entrega'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: indexSeguro,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: destinos,
      ),
    );
  }
}
