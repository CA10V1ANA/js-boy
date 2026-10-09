ALTER TABLE entregadores ADD COLUMN tipo_chave_pix VARCHAR(20);
ALTER TABLE entregadores ADD COLUMN chave_pix VARCHAR(180);
ALTER TABLE entregadores ADD COLUMN titular_pix VARCHAR(140);
ALTER TABLE entregas ADD COLUMN forma_pagamento VARCHAR(30);
ALTER TABLE pagamentos ADD COLUMN recebedor_id UUID REFERENCES entregadores(id);
ALTER TABLE pagamentos ADD COLUMN recebedor_nome VARCHAR(140);
ALTER TABLE pagamentos ADD COLUMN chave_pix_recebedor VARCHAR(180);
ALTER TABLE paradas_entrega ADD COLUMN usuario_conclusao_id UUID REFERENCES usuarios(id);
CREATE INDEX idx_pagamentos_recebedor ON pagamentos(recebedor_id);

-- Entregas e recebimentos históricos permanecem sem dados de recebedor inventados.

ALTER TABLE entregas ADD COLUMN rota_alterada_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE pagamentos ADD COLUMN titular_pix_recebedor VARCHAR(140);
