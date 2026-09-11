import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../models/models.dart';

/// Servicos de dominio: cada um encapsula os endpoints de um recurso.
/// Todos convertem falhas em [ApiException] com mensagem pronta para a UI.

class AuthService {
  final ApiClient client;
  AuthService(this.client);

  Future<({String token, String refreshToken, Usuario usuario})> login(
      String email, String senha) async {
    try {
      final response = await client.dio
          .post('/auth/login', data: {'email': email, 'senha': senha});
      final data = response.data as Map<String, dynamic>;
      return (
        token: data['token'] as String,
        refreshToken: data['refreshToken'] as String,
        usuario: Usuario.fromJson(data['usuario'] as Map<String, dynamic>),
      );
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> logout(String refreshToken) async {
    await client.dio.post('/auth/logout', data: {'refreshToken': refreshToken});
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

  Future<Cliente> meuCadastro() async {
    try {
      final response = await client.dio.get('/cliente/me');
      return Cliente.fromJson(response.data as Map<String, dynamic>);
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

  Future<void> cadastrarPeloEntregador(Map<String, dynamic> dados) async {
    try {
      await client.dio.post('/operacao-entregador/clientes', data: dados);
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

  Future<ConfiguracaoEmpresa> contato() async {
    try {
      final response = await client.dio.get('/cliente/contato');
      return ConfiguracaoEmpresa.fromJson(
          response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> criarAcesso(String id, String email, String senha) async {
    try {
      await client.dio
          .post('/clientes/$id/acesso', data: {'email': email, 'senha': senha});
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
      await client.dio
          .patch('/entregadores/$id/status', data: {'ativo': ativo});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> criarAcesso(String id, String email, String senha) async {
    try {
      await client.dio.post('/entregadores/$id/acesso',
          data: {'email': email, 'senha': senha});
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

  Future<List<Entrega>> entregasDoCliente() async {
    try {
      final response = await client.dio.get('/cliente/entregas');
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
      await client.dio
          .patch('/entregas/$id/status', data: {'status': status.api});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatusMinhaEntrega(
      String id, StatusEntrega status) async {
    try {
      await client.dio.patch('/entregas/minhas-entregas/$id/status',
          data: {'status': status.api});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> designarEntregador(String id, String entregadorId) async {
    try {
      await client.dio.patch('/entregas/$id/entregador',
          data: {'entregadorId': entregadorId});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> solicitarComoCliente(Map<String, dynamic> dados) async {
    try {
      await client.dio.post('/cliente/entregas', data: dados);
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<Map<String, List<Map<String, dynamic>>>> detalhesCliente(
      String entregaId) async {
    try {
      final respostas = await Future.wait([
        client.dio.get('/cliente/entregas/$entregaId/paradas'),
        client.dio.get('/cliente/entregas/$entregaId/comprovantes'),
      ]);
      return {
        'paradas':
            (respostas[0].data as List<dynamic>).cast<Map<String, dynamic>>(),
        'comprovantes':
            (respostas[1].data as List<dynamic>).cast<Map<String, dynamic>>(),
      };
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

  Future<List<Pagamento>> pagamentosDoCliente() async {
    try {
      final response = await client.dio.get('/cliente/pagamentos');
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
      return RelatorioFinanceiro.fromJson(
          response.data as Map<String, dynamic>);
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

  Future<void> estornar(String id, double valor, String motivo) async {
    try {
      await client.dio.post('/pagamentos/$id/estornos',
          data: {'valor': valor, 'motivo': motivo},
          options: Options(headers: {
            'Idempotency-Key':
                'mobile-estorno-${DateTime.now().microsecondsSinceEpoch}'
          }));
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

  Future<void> atualizar(
      {required double taxaInicial,
      required double valorPorKm,
      required double valorMinimo}) async {
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

  Future<TabelaPreco> consultarTabela() async {
    try {
      final response = await client.dio.get('/configuracoes/preco/tabela');
      return TabelaPreco.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<TabelaPreco> atualizarTabela(TabelaPreco tabela) async {
    try {
      final response = await client.dio.put('/configuracoes/preco/tabela',
          data: {
            'taxaRetorno': tabela.taxaRetorno,
            'taxaEsperaTrintaMinutos': tabela.taxaEsperaTrintaMinutos,
            'taxaInicialFallback': tabela.taxaInicialFallback,
            'valorPorKmFallback': tabela.valorPorKmFallback,
            'valorMinimoFallback': tabela.valorMinimoFallback,
            'areas': tabela.areas
                .map((area) => {
                      'id': area.id,
                      'valorMoto': area.valorNegociado ? null : area.valorMoto,
                      'valorCarro':
                          area.valorNegociado ? null : area.valorCarro,
                      'versao': area.versao,
                    })
                .toList(),
          },
          options: Options(headers: {'If-Match': tabela.versao.toString()}));
      return TabelaPreco.fromJson(response.data as Map<String, dynamic>);
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

  Future<void> criar(
      {required String nome,
      required String email,
      required String senha}) async {
    try {
      await client.dio.post('/funcionarios',
          data: {'nome': nome, 'email': email, 'senha': senha});
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatus(String id, bool ativo) async {
    try {
      await client.dio
          .patch('/funcionarios/$id/status', data: {'ativo': ativo});
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class AuditoriaService {
  final ApiClient client;
  AuditoriaService(this.client);

  Future<List<Auditoria>> listar({String? entidade}) async {
    try {
      final response = await client.dio.get('/auditorias', queryParameters: {
        if (entidade != null && entidade.isNotEmpty) 'entidade': entidade,
      });
      return (response.data as List<dynamic>)
          .map((item) => Auditoria.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class UsuarioService {
  final ApiClient client;
  UsuarioService(this.client);

  Future<List<UsuarioSistema>> listar() async {
    try {
      final response = await client.dio.get('/usuarios');
      return (response.data as List<dynamic>)
          .map((item) => UsuarioSistema.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> alterarStatus(String id, bool ativo) async {
    try {
      await client.dio.patch('/usuarios/$id/status', data: {'ativo': ativo});
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class ConfiguracaoEmpresaService {
  final ApiClient client;
  ConfiguracaoEmpresaService(this.client);

  Future<ConfiguracaoEmpresa> consultar() async {
    try {
      final response = await client.dio.get('/configuracoes/empresa');
      return ConfiguracaoEmpresa.fromJson(
          response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<ConfiguracaoEmpresa> atualizar(
      ConfiguracaoEmpresa atual, Map<String, dynamic> dados) async {
    try {
      final response = await client.dio.put('/configuracoes/empresa',
          data: dados,
          options: Options(headers: {'If-Match': atual.versao.toString()}));
      return ConfiguracaoEmpresa.fromJson(
          response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class PrivacidadeService {
  final ApiClient client;
  PrivacidadeService(this.client);

  Future<Map<String, dynamic>> exportar(String clienteId) async {
    try {
      final response =
          await client.dio.get('/lgpd/clientes/$clienteId/exportacao');
      return response.data as Map<String, dynamic>;
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> anonimizar(String clienteId, String justificativa) async {
    try {
      await client.dio.post('/lgpd/clientes/$clienteId/anonimizacao',
          queryParameters: {'justificativa': justificativa});
    } catch (error) {
      throw client.translate(error);
    }
  }
}

class RazaoFinanceiraService {
  final ApiClient client;
  RazaoFinanceiraService(this.client);

  Future<RelatorioRazao> relatorio(DateTime inicio, DateTime fim) async {
    try {
      final response = await client.dio.get('/financeiro/relatorio',
          queryParameters: {'inicio': _apiDate(inicio), 'fim': _apiDate(fim)});
      return RelatorioRazao.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<void> registrar(
      {required String tipo,
      required String descricao,
      required double valor,
      required DateTime competencia}) async {
    try {
      await client.dio.post('/financeiro/lancamentos',
          data: {
            'tipo': tipo,
            'descricao': descricao,
            'valor': valor,
            'competencia': _apiDate(competencia)
          },
          options: Options(headers: {
            'Idempotency-Key':
                'mobile-razao-${DateTime.now().microsecondsSinceEpoch}'
          }));
    } catch (error) {
      throw client.translate(error);
    }
  }

  Future<ExtratoEntregador> extrato(DateTime inicio, DateTime fim) async {
    try {
      final response = await client.dio.get(
          '/operacao-entregador/financeiro/extrato',
          queryParameters: {'inicio': _apiDate(inicio), 'fim': _apiDate(fim)});
      return ExtratoEntregador.fromJson(response.data as Map<String, dynamic>);
    } catch (error) {
      throw client.translate(error);
    }
  }
}

String _apiDate(DateTime value) =>
    '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
