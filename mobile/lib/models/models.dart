import 'enums.dart';

export 'enums.dart';

double _toDouble(dynamic value) => (value as num?)?.toDouble() ?? 0;

class Usuario {
  final String id;
  final String nome;
  final String email;
  final PerfilAcesso perfil;

  Usuario({required this.id, required this.nome, required this.email, required this.perfil});

  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
        id: json['id'] as String,
        nome: json['nome'] as String,
        email: json['email'] as String,
        perfil: PerfilAcesso.fromApi(json['perfil'] as String),
      );
}

class Cliente {
  final String id;
  final String nome;
  final String telefone;
  final String? whatsapp;
  final String? email;
  final String? documento;
  final String endereco;
  final String bairro;
  final String cidade;
  final String? observacoes;
  final bool ativo;

  Cliente({
    required this.id,
    required this.nome,
    required this.telefone,
    this.whatsapp,
    this.email,
    this.documento,
    required this.endereco,
    required this.bairro,
    required this.cidade,
    this.observacoes,
    required this.ativo,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) => Cliente(
        id: json['id'] as String,
        nome: json['nome'] as String,
        telefone: json['telefone'] as String,
        whatsapp: json['whatsapp'] as String?,
        email: json['email'] as String?,
        documento: json['documento'] as String?,
        endereco: json['endereco'] as String,
        bairro: json['bairro'] as String,
        cidade: json['cidade'] as String,
        observacoes: json['observacoes'] as String?,
        ativo: json['ativo'] as bool,
      );
}

class Entregador {
  final String id;
  final String nome;
  final String cpf;
  final String telefone;
  final String? email;
  final TipoVeiculo tipoVeiculo;
  final String? placaVeiculo;
  final bool ativo;
  final bool disponivel;
  final bool possuiAcesso;

  Entregador({
    required this.id,
    required this.nome,
    required this.cpf,
    required this.telefone,
    this.email,
    required this.tipoVeiculo,
    this.placaVeiculo,
    required this.ativo,
    required this.disponivel,
    required this.possuiAcesso,
  });

  factory Entregador.fromJson(Map<String, dynamic> json) => Entregador(
        id: json['id'] as String,
        nome: json['nome'] as String,
        cpf: json['cpf'] as String,
        telefone: json['telefone'] as String,
        email: json['email'] as String?,
        tipoVeiculo: TipoVeiculo.fromApi(json['tipoVeiculo'] as String),
        placaVeiculo: json['placaVeiculo'] as String?,
        ativo: json['ativo'] as bool,
        disponivel: json['disponivel'] as bool,
        possuiAcesso: json['possuiAcesso'] as bool,
      );
}

class HistoricoEntrega {
  final StatusEntrega? statusAnterior;
  final StatusEntrega novoStatus;
  final String usuarioResponsavelNome;
  final DateTime alteradoEm;

  HistoricoEntrega({
    this.statusAnterior,
    required this.novoStatus,
    required this.usuarioResponsavelNome,
    required this.alteradoEm,
  });

  factory HistoricoEntrega.fromJson(Map<String, dynamic> json) => HistoricoEntrega(
        statusAnterior: json['statusAnterior'] != null
            ? StatusEntrega.fromApi(json['statusAnterior'] as String)
            : null,
        novoStatus: StatusEntrega.fromApi(json['novoStatus'] as String),
        usuarioResponsavelNome: json['usuarioResponsavelNome'] as String,
        alteradoEm: DateTime.parse(json['alteradoEm'] as String),
      );
}

class Entrega {
  final String id;
  final String codigo;
  final String clienteId;
  final String clienteNome;
  final String? entregadorId;
  final String? entregadorNome;
  final String enderecoOrigem;
  final String bairroOrigem;
  final String enderecoDestino;
  final String bairroDestino;
  final String destinatarioNome;
  final String destinatarioTelefone;
  final String descricaoMercadoria;
  final String? observacoes;
  final double distanciaKm;
  final double valorFinal;
  final String? observacaoValorManual;
  final StatusEntrega status;
  final DateTime criadoEm;
  final List<HistoricoEntrega> historico;

  Entrega({
    required this.id,
    required this.codigo,
    required this.clienteId,
    required this.clienteNome,
    this.entregadorId,
    this.entregadorNome,
    required this.enderecoOrigem,
    required this.bairroOrigem,
    required this.enderecoDestino,
    required this.bairroDestino,
    required this.destinatarioNome,
    required this.destinatarioTelefone,
    required this.descricaoMercadoria,
    this.observacoes,
    required this.distanciaKm,
    required this.valorFinal,
    this.observacaoValorManual,
    required this.status,
    required this.criadoEm,
    required this.historico,
  });

  factory Entrega.fromJson(Map<String, dynamic> json) => Entrega(
        id: json['id'] as String,
        codigo: json['codigo'] as String,
        clienteId: json['clienteId'] as String,
        clienteNome: json['clienteNome'] as String,
        entregadorId: json['entregadorId'] as String?,
        entregadorNome: json['entregadorNome'] as String?,
        enderecoOrigem: json['enderecoOrigem'] as String,
        bairroOrigem: json['bairroOrigem'] as String,
        enderecoDestino: json['enderecoDestino'] as String,
        bairroDestino: json['bairroDestino'] as String,
        destinatarioNome: json['destinatarioNome'] as String,
        destinatarioTelefone: json['destinatarioTelefone'] as String,
        descricaoMercadoria: json['descricaoMercadoria'] as String,
        observacoes: json['observacoes'] as String?,
        distanciaKm: _toDouble(json['distanciaKm']),
        valorFinal: _toDouble(json['valorFinal']),
        observacaoValorManual: json['observacaoValorManual'] as String?,
        status: StatusEntrega.fromApi(json['status'] as String),
        criadoEm: DateTime.parse(json['criadoEm'] as String),
        historico: (json['historico'] as List<dynamic>? ?? [])
            .map((item) => HistoricoEntrega.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
}

class Pagamento {
  final String id;
  final String entregaId;
  final String entregaCodigo;
  final String clienteNome;
  final double valor;
  final FormaPagamento formaPagamento;
  final DateTime pagoEm;
  final String? comprovante;
  final String? observacoes;

  Pagamento({
    required this.id,
    required this.entregaId,
    required this.entregaCodigo,
    required this.clienteNome,
    required this.valor,
    required this.formaPagamento,
    required this.pagoEm,
    this.comprovante,
    this.observacoes,
  });

  factory Pagamento.fromJson(Map<String, dynamic> json) => Pagamento(
        id: json['id'] as String,
        entregaId: json['entregaId'] as String,
        entregaCodigo: json['entregaCodigo'] as String,
        clienteNome: json['clienteNome'] as String,
        valor: _toDouble(json['valor']),
        formaPagamento: FormaPagamento.fromApi(json['formaPagamento'] as String),
        pagoEm: DateTime.parse(json['pagoEm'] as String),
        comprovante: json['comprovante'] as String?,
        observacoes: json['observacoes'] as String?,
      );
}

class PendenciaFinanceira {
  final String entregaId;
  final String entregaCodigo;
  final String clienteNome;
  final double valorEntrega;
  final double valorPago;
  final double valorPendente;

  PendenciaFinanceira({
    required this.entregaId,
    required this.entregaCodigo,
    required this.clienteNome,
    required this.valorEntrega,
    required this.valorPago,
    required this.valorPendente,
  });

  factory PendenciaFinanceira.fromJson(Map<String, dynamic> json) => PendenciaFinanceira(
        entregaId: json['entregaId'] as String,
        entregaCodigo: json['entregaCodigo'] as String,
        clienteNome: json['clienteNome'] as String,
        valorEntrega: _toDouble(json['valorEntrega']),
        valorPago: _toDouble(json['valorPago']),
        valorPendente: _toDouble(json['valorPendente']),
      );
}

class RelatorioFinanceiro {
  final double valorEntregas;
  final double valorRecebido;
  final double valorPendente;
  final int pagamentosRegistrados;
  final List<PendenciaFinanceira> pendencias;

  RelatorioFinanceiro({
    required this.valorEntregas,
    required this.valorRecebido,
    required this.valorPendente,
    required this.pagamentosRegistrados,
    required this.pendencias,
  });

  factory RelatorioFinanceiro.fromJson(Map<String, dynamic> json) => RelatorioFinanceiro(
        valorEntregas: _toDouble(json['valorEntregas']),
        valorRecebido: _toDouble(json['valorRecebido']),
        valorPendente: _toDouble(json['valorPendente']),
        pagamentosRegistrados: (json['pagamentosRegistrados'] as num).toInt(),
        pendencias: (json['pendencias'] as List<dynamic>? ?? [])
            .map((item) => PendenciaFinanceira.fromJson(item as Map<String, dynamic>))
            .toList(),
      );

  factory RelatorioFinanceiro.vazio() => RelatorioFinanceiro(
        valorEntregas: 0,
        valorRecebido: 0,
        valorPendente: 0,
        pagamentosRegistrados: 0,
        pendencias: [],
      );
}

class DashboardResumo {
  final int totalEntregas;
  final int solicitadas;
  final int emAndamento;
  final int entregues;
  final int canceladas;
  final double valorTotal;
  final int clientes;
  final int entregadoresAtivos;

  DashboardResumo({
    required this.totalEntregas,
    required this.solicitadas,
    required this.emAndamento,
    required this.entregues,
    required this.canceladas,
    required this.valorTotal,
    required this.clientes,
    required this.entregadoresAtivos,
  });

  factory DashboardResumo.fromJson(Map<String, dynamic> json) => DashboardResumo(
        totalEntregas: (json['totalEntregas'] as num).toInt(),
        solicitadas: (json['solicitadas'] as num).toInt(),
        emAndamento: (json['emAndamento'] as num).toInt(),
        entregues: (json['entregues'] as num).toInt(),
        canceladas: (json['canceladas'] as num).toInt(),
        valorTotal: _toDouble(json['valorTotal']),
        clientes: (json['clientes'] as num).toInt(),
        entregadoresAtivos: (json['entregadoresAtivos'] as num).toInt(),
      );

  factory DashboardResumo.vazio() => DashboardResumo(
        totalEntregas: 0,
        solicitadas: 0,
        emAndamento: 0,
        entregues: 0,
        canceladas: 0,
        valorTotal: 0,
        clientes: 0,
        entregadoresAtivos: 0,
      );
}

class ConfiguracaoPreco {
  final String id;
  final double taxaInicial;
  final double valorPorKm;
  final double valorMinimo;

  ConfiguracaoPreco({
    required this.id,
    required this.taxaInicial,
    required this.valorPorKm,
    required this.valorMinimo,
  });

  factory ConfiguracaoPreco.fromJson(Map<String, dynamic> json) => ConfiguracaoPreco(
        id: json['id'] as String,
        taxaInicial: _toDouble(json['taxaInicial']),
        valorPorKm: _toDouble(json['valorPorKm']),
        valorMinimo: _toDouble(json['valorMinimo']),
      );
}

class Funcionario {
  final String id;
  final String nome;
  final String email;
  final bool ativo;

  Funcionario({required this.id, required this.nome, required this.email, required this.ativo});

  factory Funcionario.fromJson(Map<String, dynamic> json) => Funcionario(
        id: json['id'] as String,
        nome: json['nome'] as String,
        email: json['email'] as String,
        ativo: json['ativo'] as bool,
      );
}
