package com.ravtec.delivery.config;

import java.net.URI;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "supabase-s3")
public class SupabaseStorageS3Config {
    @Bean(destroyMethod = "close")
    S3Client supabaseStorageS3Client(
        @Value("${SUPABASE_STORAGE_S3_ENDPOINT:}") String endpoint,
        @Value("${SUPABASE_STORAGE_S3_REGION:}") String region,
        @Value("${SUPABASE_STORAGE_S3_ACCESS_KEY_ID:}") String accessKeyId,
        @Value("${SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY:}") String secretAccessKey
    ) {
        var uri = endpoint(endpoint);
        return S3Client.builder()
            .endpointOverride(uri)
            .region(Region.of(obrigatorio("SUPABASE_STORAGE_S3_REGION", region)))
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                obrigatorio("SUPABASE_STORAGE_S3_ACCESS_KEY_ID", accessKeyId),
                obrigatorio("SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY", secretAccessKey)
            )))
            .forcePathStyle(true)
            .httpClientBuilder(UrlConnectionHttpClient.builder()
                .connectionTimeout(Duration.ofSeconds(5))
                .socketTimeout(Duration.ofSeconds(30)))
            .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
            .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
            .build();
    }

    private static URI endpoint(String value) {
        var raw = obrigatorio("SUPABASE_STORAGE_S3_ENDPOINT", value);
        URI uri;
        try {
            uri = URI.create(raw);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("SUPABASE_STORAGE_S3_ENDPOINT invalido", exception);
        }
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
            || !"/storage/v1/s3".equals(uri.getPath()) || uri.getUserInfo() != null
            || uri.getQuery() != null || uri.getFragment() != null) {
            throw new IllegalArgumentException("SUPABASE_STORAGE_S3_ENDPOINT deve ser HTTPS e terminar em /storage/v1/s3");
        }
        return uri;
    }

    private static String obrigatorio(String nome, String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(nome + " deve ser configurado");
        }
        return valor.trim();
    }
}
