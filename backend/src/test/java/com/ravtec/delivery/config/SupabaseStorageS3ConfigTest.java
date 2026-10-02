package com.ravtec.delivery.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.ravtec.delivery.service.ArmazenamentoArquivo;
import com.ravtec.delivery.service.ArmazenamentoLocalArquivo;
import com.ravtec.delivery.service.ArmazenamentoSupabaseS3;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class SupabaseStorageS3ConfigTest {
    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
        .withUserConfiguration(
            SupabaseStorageS3Config.class,
            ArmazenamentoSupabaseS3.class,
            ArmazenamentoLocalArquivo.class
        );

    @Test
    void selecionaSomenteStorageS3QuandoConfigurado() {
        contextRunner.withPropertyValues(
            "app.storage.provider=supabase-s3",
            "SUPABASE_STORAGE_S3_ENDPOINT=https://projeto.storage.supabase.co/storage/v1/s3",
            "SUPABASE_STORAGE_S3_REGION=sa-east-1",
            "SUPABASE_STORAGE_S3_ACCESS_KEY_ID=chave-de-teste",
            "SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY=segredo-de-teste",
            "SUPABASE_STORAGE_BUCKET=comprovantes"
        ).run(context -> {
            assertThat(context.getBeansOfType(ArmazenamentoArquivo.class)).hasSize(1);
            assertThat(context.getBean(ArmazenamentoArquivo.class))
                .isInstanceOf(ArmazenamentoSupabaseS3.class);
        });
    }

    @Test
    void mantemStorageLocalComoPadrao() {
        contextRunner.run(context -> {
            assertThat(context.getBeansOfType(ArmazenamentoArquivo.class)).hasSize(1);
            assertThat(context.getBean(ArmazenamentoArquivo.class))
                .isInstanceOf(ArmazenamentoLocalArquivo.class);
        });
    }
}
