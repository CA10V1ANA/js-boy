import '../core/api/api_client.dart';
import '../models/models.dart';

/// Servicos de dominio: cada um encapsula os endpoints de um recurso.
/// Todos convertem falhas em [ApiException] com mensagem pronta para a UI.

class AuthService {
  final ApiClient client;
  AuthService(this.client);

  Future<({String token, Usuario usuario})> login(String email, String senha) async {
    try {
      final response = await client.dio.post('/auth/login', data: {'email': email, 'senha': senha});
      final data = response.data as Map<String, dynamic>;
      return (
        token: data['token'] as String,
        usuario: Usuario.fromJson(data['usuario'] as Map<String, dynamic>),
      );
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<Usuario> me() async {
    try {
      final response = await client.dio.get('/auth/me');
      return Usuario.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class ClienteService {
  final ApiClient client;
  ClienteService(this.client);

  Future<List<Cliente>> listar({String? busca}) async {
    try {
      final response = await client.dio.get('/clientes', queryParameters: {
        if (busca != null && busca.isNotEmpty) 'busca': busca,
      });
      return (response.data as List<dynamic>)
          .map((item) => Cliente.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> salvar({String? id, required Map<String, dynamic> dados}) async {
    try {
      if (id != null) {
        await client.dio.put('/clientes/$id', data: dados);
      } else {
        await client.dio.post('/clientes', data: dados);
      }
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatus(String id, bool ativo) async {
    try {
      await client.dio.patch('/clientes/$id/status', data: {'ativo': ativo});
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class EntregadorService {
  final ApiClient client;
  EntregadorService(this.client);

  Future<List<Entregador>> listar({String? busca}) async {
    try {
      final response = await client.dio.get('/entregadores', queryParameters: {
        if (busca != null && busca.isNotEmpty) 'busca': busca,
      });
      return (response.data as List<dynamic>)
          .map((item) => Entregador.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> salvar({String? id, required Map<String, dynamic> dados}) async {
    try {
      if (id != null) {
        await client.dio.put('/entregadores/$id', data: dados);
      } else {
        await client.dio.post('/entregadores', data: dados);
      }
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatus(String id, bool ativo) async {
    try {
      await client.dio.patch('/entregadores/$id/status', data: {'ativo': ativo});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> criarAcesso(String id, String email, String senha) async {
    try {
      await client.dio.post('/entregadores/$id/acesso', data: {'email': email, 'senha': senha});
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class EntregaService {
  final ApiClient client;
  EntregaService(this.client);

  Future<List<Entrega>> listar({String? busca}) async {
    try {
      final response = await client.dio.get('/entregas', queryParameters: {
        if (busca != null && busca.isNotEmpty) 'busca': busca,
      });
      return (response.data as List<dynamic>)
          .map((item) => Entrega.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<List<Entrega>> minhasEntregas() async {
    try {
      final response = await client.dio.get('/entregas/minhas-entregas');
      return (response.data as List<dynamic>)
          .map((item) => Entrega.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> salvar({String? id, required Map<String, dynamic> dados}) async {
    try {
      if (id != null) {
        await client.dio.put('/entregas/$id', data: dados);
      } else {
        await client.dio.post('/entregas', data: dados);
      }
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatus(String id, StatusEntrega status) async {
    try {
      await client.dio.patch('/entregas/$id/status', data: {'status': status.api});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatusMinhaEntrega(String id, StatusEntrega status) async {
    try {
      await client.dio.patch('/entregas/minhas-entregas/$id/status', data: {'status': status.api});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> designarEntregador(String id, String entregadorId) async {
    try {
      await client.dio.patch('/entregas/$id/entregador', data: {'entregadorId': entregadorId});
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class PagamentoService {
  final ApiClient client;
  PagamentoService(this.client);

  Future<List<Pagamento>> listar() async {
    try {
      final response = await client.dio.get('/pagamentos');
      return (response.data as List<dynamic>)
          .map((item) => Pagamento.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<RelatorioFinanceiro> relatorio() async {
    try {
      final response = await client.dio.get('/pagamentos/relatorio');
      return RelatorioFinanceiro.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> registrar(Map<String, dynamic> dados) async {
    try {
      await client.dio.post('/pagamentos', data: dados);
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class DashboardService {
  final ApiClient client;
  DashboardService(this.client);

  Future<DashboardResumo> resumo() async {
    try {
      final response = await client.dio.get('/dashboard/resumo');
      return DashboardResumo.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class ConfiguracaoPrecoService {
  final ApiClient client;
  ConfiguracaoPrecoService(this.client);

  Future<ConfiguracaoPreco> consultar() async {
    try {
      final response = await client.dio.get('/configuracoes/preco');
      return ConfiguracaoPreco.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> atualizar({required double taxaInicial, required double valorPorKm, required double valorMinimo}) async {
    try {
      await client.dio.put('/configuracoes/preco', data: {
        'taxaInicial': taxaInicial,
        'valorPorKm': valorPorKm,
        'valorMinimo': valorMinimo,
      });
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class FuncionarioService {
  final ApiClient client;
  FuncionarioService(this.client);

  Future<List<Funcionario>> listar() async {
    try {
      final response = await client.dio.get('/funcionarios');
      return (response.data as List<dynamic>)
          .map((item) => Funcionario.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> criar({required String nome, required String email, required String senha}) async {
    try {
      await client.dio.post('/funcionarios', data: {'nome': nome, 'email': email, 'senha': senha});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatus(String id, bool ativo) async {
    try {
      await client.dio.patch('/funcionarios/$id/status', data: {'ativo': ativo});
    } catch (error) {
      throw client.translate(error);
    }
  }
}
