package com.ravtec.delivery;

import static org.assertj.core.api.Assertions.assertThat;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.NONE,
    properties = {
        "spring.datasource.url=jdbc:h2:mem:p1-migrations;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "app.security.jwt-secret=test-only-secret-with-at-least-32-bytes",
        "app.seed.owner-email=owner-test@jsboy.local",
        "app.seed.owner-password=test-only-owner-password"
    }
)
@ActiveProfiles("local")
class MigrationLocalTest {
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
