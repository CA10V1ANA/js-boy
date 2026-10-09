-- Conclusão de parada sem foto/OTP: registra quem recebeu e observação opcional.
ALTER TABLE paradas_entrega ADD COLUMN recebedor_nome VARCHAR(140);
ALTER TABLE paradas_entrega ADD COLUMN observacao_conclusao VARCHAR(500);
