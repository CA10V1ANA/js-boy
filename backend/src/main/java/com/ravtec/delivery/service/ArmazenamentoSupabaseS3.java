package com.ravtec.delivery.service;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Component
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "supabase-s3")
public class ArmazenamentoSupabaseS3 implements ArmazenamentoArquivo {
    private final S3Client client;
    private final String bucket;

    public ArmazenamentoSupabaseS3(
        S3Client client,
        @Value("${SUPABASE_STORAGE_BUCKET:}") String bucket
    ) {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalArgumentException("SUPABASE_STORAGE_BUCKET deve ser configurado");
        }
        this.client = client;
        this.bucket = bucket.trim();
    }

    @Override
    public void salvar(String chave, byte[] conteudo) {
        validarChave(chave);
        try {
            client.putObject(PutObjectRequest.builder()
                .bucket(bucket).key(chave).contentType(tipo(chave)).cacheControl("no-store")
                .build(), RequestBody.fromBytes(conteudo));
        } catch (SdkException exception) {
            throw new IllegalStateException("Nao foi possivel armazenar o comprovante", exception);
        }
    }

    @Override
    public InputStream abrir(String chave) {
        validarChave(chave);
        try {
            return client.getObject(GetObjectRequest.builder().bucket(bucket).key(chave).build());
        } catch (SdkException exception) {
            throw new IllegalStateException("Comprovante indisponivel", exception);
        }
    }

    @Override
    public void excluir(String chave) {
        validarChave(chave);
        try {
            client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(chave).build());
        } catch (S3Exception exception) {
            if (exception.statusCode() != 404) {
                throw new IllegalStateException("Nao foi possivel excluir o comprovante", exception);
            }
        } catch (SdkException exception) {
            throw new IllegalStateException("Nao foi possivel excluir o comprovante", exception);
        }
    }

    @Override
    public Set<String> listarChaves() {
        var chaves = new HashSet<String>();
        String token = null;
        try {
            while (true) {
                var resposta = client.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(bucket).continuationToken(token).build());
                resposta.contents().forEach(objeto -> chaves.add(objeto.key()));
                if (!Boolean.TRUE.equals(resposta.isTruncated())) {
                    return Set.copyOf(chaves);
                }
                token = resposta.nextContinuationToken();
                if (token == null || token.isBlank()) {
                    throw new IllegalStateException("Paginacao de comprovantes incompleta");
                }
            }
        } catch (SdkException exception) {
            throw new IllegalStateException("Nao foi possivel listar os comprovantes", exception);
        }
    }

    @Override
    public boolean existe(String chave) {
        validarChave(chave);
        try {
            client.headObject(HeadObjectRequest.builder().bucket(bucket).key(chave).build());
            return true;
        } catch (S3Exception exception) {
            if (exception.statusCode() == 404) return false;
            throw new IllegalStateException("Nao foi possivel verificar o comprovante", exception);
        } catch (SdkException exception) {
            throw new IllegalStateException("Nao foi possivel verificar o comprovante", exception);
        }
    }

    private static void validarChave(String chave) {
        if (chave == null || chave.length() > 255 || !chave.matches("[A-Za-z0-9][A-Za-z0-9._-]*")) {
            throw new SecurityException("Chave de armazenamento invalida");
        }
    }

    private static String tipo(String chave) {
        if (chave.endsWith(".pdf")) return "application/pdf";
        if (chave.endsWith(".png")) return "image/png";
        if (chave.endsWith(".jpg") || chave.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }
}
