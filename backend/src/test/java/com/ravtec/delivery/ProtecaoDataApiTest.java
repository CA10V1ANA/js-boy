package com.ravtec.delivery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.DriverManager;
import java.sql.SQLException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;

class ProtecaoDataApiTest {
    @Test void migrationsNegamAcessoDiretoDosPapeisPublicosEMantemJdbc() throws Exception {
        try (var postgres = new PostgreSQLContainer<>("postgres:16-alpine")) {
            postgres.start();
            try (var connection = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
                 var sql = connection.createStatement()) {
                sql.execute("create role anon; create role authenticated");
                sql.execute("alter default privileges in schema public grant all on tables to anon, authenticated");
                Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                    .locations("classpath:db/migration").load().migrate();
                try (var rows = sql.executeQuery("select count(*) from pg_tables where schemaname = 'public' and tablename <> 'flyway_schema_history' and not rowsecurity")) {
                    rows.next(); assertThat(rows.getInt(1)).isZero();
                }
                try (var rows = sql.executeQuery("select count(*) from pg_tables where schemaname = 'public' and tablename <> 'flyway_schema_history' and (has_table_privilege('anon', format('%I.%I', schemaname, tablename), 'select') or has_table_privilege('authenticated', format('%I.%I', schemaname, tablename), 'select'))")) {
                    rows.next(); assertThat(rows.getInt(1)).isZero();
                }
                sql.executeQuery("select count(*) from usuarios").close();
                sql.execute("set role anon");
                assertThatThrownBy(() -> sql.executeQuery("select * from usuarios")).isInstanceOf(SQLException.class);
                sql.execute("reset role");
                sql.execute("create table future_business_table (id integer)");
                try (var rows = sql.executeQuery("select has_table_privilege('anon', 'future_business_table', 'select') or has_table_privilege('authenticated', 'future_business_table', 'select')")) {
                    rows.next(); assertThat(rows.getBoolean(1)).isFalse();
                }
            }
        }
    }
}
