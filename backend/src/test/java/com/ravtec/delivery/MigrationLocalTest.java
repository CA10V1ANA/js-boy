package com.ravtec.delivery;

import static org.assertj.core.api.Assertions.assertThat;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class MigrationLocalTest extends AbstractIntegrationTest {
    @Autowired
    private DataSource dataSource;

    @Test
    void deveInicializarEsquemaCompletoComFlyway() throws Exception {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                 "select count(*) from \"flyway_schema_history\" where \"success\" = true"
             );
             var result = statement.executeQuery()) {
            assertThat(result.next()).isTrue();
            assertThat(result.getInt(1)).isGreaterThanOrEqualTo(10);
        }
    }
}
