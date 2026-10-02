package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;

class ArmazenamentoSupabaseS3Test {
    private final S3Client client = mock(S3Client.class);
    private final ArmazenamentoSupabaseS3 storage = new ArmazenamentoSupabaseS3(client, "comprovantes");

    @Test
    void gravaNoBucketPrivadoConfiguradoComTipoCorreto() throws Exception {
        var bytes = "%PDF-1.4".getBytes(StandardCharsets.UTF_8);

        storage.salvar("proof.pdf", bytes);

        var request = ArgumentCaptor.forClass(PutObjectRequest.class);
        var body = ArgumentCaptor.forClass(RequestBody.class);
        verify(client).putObject(request.capture(), body.capture());
        assertThat(request.getValue().bucket()).isEqualTo("comprovantes");
        assertThat(request.getValue().key()).isEqualTo("proof.pdf");
        assertThat(request.getValue().contentType()).isEqualTo("application/pdf");
        assertThat(request.getValue().cacheControl()).isEqualTo("no-store");
        try (var stream = body.getValue().contentStreamProvider().newStream()) {
            assertThat(stream.readAllBytes()).isEqualTo(bytes);
        }
    }

    @Test
    void leArquivoPeloBackendSemCriarUrlPublica() throws Exception {
        var bytes = "evidencia".getBytes(StandardCharsets.UTF_8);
        when(client.getObject(any(GetObjectRequest.class))).thenReturn(new ResponseInputStream<>(
            GetObjectResponse.builder().build(), new ByteArrayInputStream(bytes)));

        try (var stream = storage.abrir("proof.jpg")) {
            assertThat(stream.readAllBytes()).isEqualTo(bytes);
        }
        var request = ArgumentCaptor.forClass(GetObjectRequest.class);
        verify(client).getObject(request.capture());
        assertThat(request.getValue().bucket()).isEqualTo("comprovantes");
        assertThat(request.getValue().key()).isEqualTo("proof.jpg");
    }

    @Test
    void listaTodasAsPaginasParaReconciliacao() {
        when(client.listObjectsV2(any(ListObjectsV2Request.class))).thenReturn(
            ListObjectsV2Response.builder().contents(S3Object.builder().key("a.pdf").build())
                .isTruncated(true).nextContinuationToken("proxima").build(),
            ListObjectsV2Response.builder().contents(S3Object.builder().key("b.png").build())
                .isTruncated(false).build()
        );

        assertThat(storage.listarChaves()).containsExactlyInAnyOrder("a.pdf", "b.png");

        var requests = ArgumentCaptor.forClass(ListObjectsV2Request.class);
        verify(client, org.mockito.Mockito.times(2)).listObjectsV2(requests.capture());
        assertThat(requests.getAllValues().get(1).continuationToken()).isEqualTo("proxima");
    }

    @Test
    void somente404SignificaArquivoAusente() {
        when(client.headObject(any(HeadObjectRequest.class))).thenThrow(
            S3Exception.builder().statusCode(404).build(),
            S3Exception.builder().statusCode(403).build()
        );

        assertThat(storage.existe("proof.pdf")).isFalse();
        assertThatThrownBy(() -> storage.existe("proof.pdf"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("verificar");
    }

    @Test
    void exclusaoDeArquivoJaAusenteEIdempotente() {
        doThrow(S3Exception.builder().statusCode(404).build())
            .when(client).deleteObject(any(DeleteObjectRequest.class));

        storage.excluir("proof.pdf");

        verify(client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void rejeitaChaveComSeparadorAntesDeContatarStorage() {
        assertThatThrownBy(() -> storage.salvar("../outro.pdf", new byte[] {1}))
            .isInstanceOf(SecurityException.class);
        verifyNoInteractions(client);
    }
}
