import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

enum PerfilAcesso {
  proprietario('PROPRIETARIO'),
  entregador('ENTREGADOR'),
  funcionario('FUNCIONARIO');

  final String api;
  const PerfilAcesso(this.api);

  static PerfilAcesso fromApi(String value) =>
      PerfilAcesso.values.firstWhere((item) => item.api == value);

  String get label => switch (this) {
        PerfilAcesso.proprietario => 'Administrador',
        PerfilAcesso.entregador => 'Entregador',
        PerfilAcesso.funcionario => 'Funcionario',
      };
}

enum StatusEntrega {
  solicitada('SOLICITADA'),
  confirmada('CONFIRMADA'),
  aguardandoEntregador('AGUARDANDO_ENTREGADOR'),
  entregadorDesignado('ENTREGADOR_DESIGNADO'),
  coletada('COLETADA'),
  emRota('EM_ROTA'),
  entregue('ENTREGUE'),
  cancelada('CANCELADA');

  final String api;
  const StatusEntrega(this.api);

  static StatusEntrega fromApi(String value) =>
      StatusEntrega.values.firstWhere((item) => item.api == value);

  String get label => switch (this) {
        StatusEntrega.solicitada => 'Solicitada',
        StatusEntrega.confirmada => 'Confirmada',
        StatusEntrega.aguardandoEntregador => 'Aguardando',
        StatusEntrega.entregadorDesignado => 'Designada',
        StatusEntrega.coletada => 'Coletada',
        StatusEntrega.emRota => 'Em rota',
        StatusEntrega.entregue => 'Entregue',
        StatusEntrega.cancelada => 'Cancelada',
      };

  bool get emAndamento => switch (this) {
        StatusEntrega.entregue || StatusEntrega.cancelada => false,
        _ => true,
      };

  Color get cor => switch (this) {
        StatusEntrega.entregue => AppColors.green,
        StatusEntrega.cancelada => AppColors.red,
        StatusEntrega.emRota ||
        StatusEntrega.coletada ||
        StatusEntrega.entregadorDesignado =>
          AppColors.teal,
        _ => AppColors.ocre,
      };

  Color get corFundo => switch (this) {
        StatusEntrega.entregue => AppColors.greenBg,
        StatusEntrega.cancelada => AppColors.redBg,
        StatusEntrega.emRota ||
        StatusEntrega.coletada ||
        StatusEntrega.entregadorDesignado =>
          AppColors.tealBg,
        _ => AppColors.ocreBg,
      };
}

enum FormaPagamento {
  pix('PIX'),
  dinheiro('DINHEIRO'),
  cartao('CARTAO'),
  boleto('BOLETO'),
  transferencia('TRANSFERENCIA'),
  outro('OUTRO');

  final String api;
  const FormaPagamento(this.api);

  static FormaPagamento fromApi(String value) =>
      FormaPagamento.values.firstWhere((item) => item.api == value);

  String get label => switch (this) {
        FormaPagamento.pix => 'Pix',
        FormaPagamento.dinheiro => 'Dinheiro',
        FormaPagamento.cartao => 'Cartao',
        FormaPagamento.boleto => 'Boleto',
        FormaPagamento.transferencia => 'Transferencia',
        FormaPagamento.outro => 'Outro',
      };
}

enum TipoVeiculo {
  moto('MOTO'),
  carro('CARRO'),
  bicicleta('BICICLETA'),
  outro('OUTRO');

  final String api;
  const TipoVeiculo(this.api);

  static TipoVeiculo fromApi(String value) =>
      TipoVeiculo.values.firstWhere((item) => item.api == value);

  String get label => switch (this) {
        TipoVeiculo.moto => 'Moto',
        TipoVeiculo.carro => 'Carro',
        TipoVeiculo.bicicleta => 'Bicicleta',
        TipoVeiculo.outro => 'Outro',
      };
}
