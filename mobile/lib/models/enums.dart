import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

enum PerfilAcesso {
  proprietario('PROPRIETARIO'), entregador('ENTREGADOR'), cliente('CLIENTE'), funcionario('FUNCIONARIO');
  final String api;
  const PerfilAcesso(this.api);
  static PerfilAcesso fromApi(String value) => PerfilAcesso.values.firstWhere((item) => item.api == value);
  String get label => switch (this) {
    PerfilAcesso.proprietario => 'Administrador',
    PerfilAcesso.cliente => 'Cliente',
    _ => 'Entregador',
  };
  bool get ehEntregador => this == PerfilAcesso.entregador || this == PerfilAcesso.funcionario;
}

enum StatusEntrega {
  solicitada('SOLICITADA'),
  confirmada('CONFIRMADA'),
  agendada('AGENDADA'),
  aguardandoEntregador('AGUARDANDO_ENTREGADOR'),
  entregadorDesignado('ENTREGADOR_DESIGNADO'),
  coletada('COLETADA'),
  emRota('EM_ROTA'),
  tentativaFalhou('TENTATIVA_FALHOU'),
  emDevolucao('EM_DEVOLUCAO'),
  entregue('ENTREGUE'),
  devolvida('DEVOLVIDA'),
  falhaOperacional('FALHA_OPERACIONAL'),
  cancelada('CANCELADA');

  final String api;
  const StatusEntrega(this.api);
  static StatusEntrega fromApi(String value) => StatusEntrega.values.firstWhere((item) => item.api == value);
  String get label => switch (this) {
    StatusEntrega.solicitada => 'Solicitada',
    StatusEntrega.confirmada => 'Confirmada',
    StatusEntrega.agendada => 'Agendada',
    StatusEntrega.aguardandoEntregador => 'Aguardando',
    StatusEntrega.entregadorDesignado => 'Designada',
    StatusEntrega.coletada => 'Coletada',
    StatusEntrega.emRota => 'Em rota',
    StatusEntrega.tentativaFalhou => 'Tentativa sem sucesso',
    StatusEntrega.emDevolucao => 'Em devolução',
    StatusEntrega.entregue => 'Entregue',
    StatusEntrega.devolvida => 'Devolvida',
    StatusEntrega.falhaOperacional => 'Falha operacional',
    StatusEntrega.cancelada => 'Cancelada',
  };
  bool get emAndamento => !{
    StatusEntrega.entregue, StatusEntrega.devolvida,
    StatusEntrega.falhaOperacional, StatusEntrega.cancelada,
  }.contains(this);
  Color get cor => switch (this) {
    StatusEntrega.entregue => AppColors.green,
    StatusEntrega.cancelada || StatusEntrega.devolvida || StatusEntrega.falhaOperacional => AppColors.red,
    StatusEntrega.emRota || StatusEntrega.coletada || StatusEntrega.entregadorDesignado => AppColors.teal,
    _ => AppColors.ocre,
  };
  Color get corFundo => switch (this) {
    StatusEntrega.entregue => AppColors.greenBg,
    StatusEntrega.cancelada || StatusEntrega.devolvida || StatusEntrega.falhaOperacional => AppColors.redBg,
    StatusEntrega.emRota || StatusEntrega.coletada || StatusEntrega.entregadorDesignado => AppColors.tealBg,
    _ => AppColors.ocreBg,
  };
}

enum FormaPagamento {
  pix('PIX'), dinheiro('DINHEIRO'), cartao('CARTAO'), boleto('BOLETO'), transferencia('TRANSFERENCIA'), outro('OUTRO');
  final String api;
  const FormaPagamento(this.api);
  static FormaPagamento fromApi(String value) => FormaPagamento.values.firstWhere((item) => item.api == value);
  String get label => switch (this) {
    FormaPagamento.pix => 'Pix', FormaPagamento.dinheiro => 'Dinheiro',
    FormaPagamento.cartao => 'Cartão', FormaPagamento.boleto => 'Boleto',
    FormaPagamento.transferencia => 'Transferência', FormaPagamento.outro => 'Outro',
  };
}

enum TipoVeiculo {
  moto('MOTO'), carro('CARRO'), bicicleta('BICICLETA'), outro('OUTRO');
  final String api;
  const TipoVeiculo(this.api);
  static TipoVeiculo fromApi(String value) => TipoVeiculo.values.firstWhere((item) => item.api == value);
  String get label => switch (this) {
    TipoVeiculo.moto => 'Moto', TipoVeiculo.carro => 'Carro',
    TipoVeiculo.bicicleta => 'Bicicleta', TipoVeiculo.outro => 'Outro',
  };
}
