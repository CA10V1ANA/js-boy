package com.ravtec.delivery;

import static org.assertj.core.api.Assertions.assertThat;
import java.sql.DriverManager;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.init.ScriptUtils;

class MigrationRepairTest {
    @Test
    void migrationsPossuemVersoesUnicas() throws Exception {
        var resources = new PathMatchingResourcePatternResolver().getResources("classpath:db/migration/V*.sql");
        var versions = Arrays.stream(resources).map(r -> r.getFilename().split("__")[0]).toList();
        assertThat(versions).isNotEmpty().doesNotHaveDuplicates();
    }

    @Test
    void reparaSomenteRotasAusentesSemDuplicarOuInventarConclusao() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:repair;MODE=PostgreSQL");
             var statement = connection.createStatement()) {
            statement.execute("""
                create table entregas (id uuid primary key, status varchar(30),
                    endereco_origem varchar(180), endereco_destino varchar(180),
                    bairro_origem varchar(80), bairro_destino varchar(80),
                    destinatario_nome varchar(140), destinatario_telefone varchar(20))
                """);
            statement.execute("""
                create table paradas_entrega (id uuid primary key, criado_em timestamp with time zone,
                    atualizado_em timestamp with time zone, entrega_id uuid references entregas(id),
                    ordem integer, tipo varchar(30), logradouro varchar(180), sem_numero boolean,
                    bairro varchar(80), contato_nome varchar(140), contato_telefone varchar(20),
                    status varchar(30), version bigint, unique(entrega_id, ordem))
                """);
            statement.execute("""
                insert into entregas values
                ('00000000-0000-0000-0000-000000000001','EM_ROTA','Origem','Destino','Centro','Centro','Teste',null),
                ('00000000-0000-0000-0000-000000000002','EM_ROTA','Origem','Destino','Centro','Centro','Teste',null),
                ('00000000-0000-0000-0000-000000000003','ENTREGUE','Origem','Destino','Centro','Centro','Teste',null),
                ('00000000-0000-0000-0000-000000000004','CANCELADA','Origem','Destino','Centro','Centro','Teste',null)
                """);
            statement.execute("""
                insert into paradas_entrega (id, entrega_id, ordem, tipo, logradouro, status)
                values (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 1, 'COLETA', 'Personalizada', 'PENDENTE')
                """);
            var script = new ClassPathResource("db/migration/V16__repair_deliveries_without_stops.sql");
            ScriptUtils.executeSqlScript(connection, script);
            ScriptUtils.executeSqlScript(connection, script);
            try (var result = statement.executeQuery("select count(*) from paradas_entrega")) {
                result.next(); assertThat(result.getInt(1)).isEqualTo(3);
            }
            try (var result = statement.executeQuery("select count(*) from paradas_entrega where status <> 'PENDENTE'")) {
                result.next(); assertThat(result.getInt(1)).isZero();
            }
            try (var result = statement.executeQuery("select logradouro from paradas_entrega where entrega_id = '00000000-0000-0000-0000-000000000002'")) {
                result.next(); assertThat(result.getString(1)).isEqualTo("Personalizada");
            }
        }
    }
}
