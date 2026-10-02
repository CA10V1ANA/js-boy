package com.ravtec.delivery.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    ResponseEntity<ApiErrorResponse> handleNotFound(RecursoNaoEncontradoException e, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Recurso não encontrado", e.getMessage(), request);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException e, HttpServletRequest request) {
        var mensagem = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage()).collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, "Dados inválidos", mensagem, request);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Requisição inválida", e.getMessage(), request);
    }
    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException e, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "Estado inválido", e.getMessage(), request);
    }
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ApiErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException e, HttpServletRequest request) {
        return buildWithCode(HttpStatus.CONFLICT, "Conflito",
            "Os dados foram alterados por outra pessoa. Recarregue e tente novamente",
            request, "OPTIMISTIC_LOCK");
    }
    @ExceptionHandler(ConflitoException.class)
    ResponseEntity<ApiErrorResponse> handleConflict(ConflitoException e, HttpServletRequest request) {
        return buildWithCode(HttpStatus.CONFLICT, "Conflito", e.getMessage(), request, e.getCodigo());
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiErrorResponse> handleDataConflict(DataIntegrityViolationException e, HttpServletRequest request) {
        return buildWithCode(HttpStatus.CONFLICT, "Conflito",
            "A operação conflita com dados existentes ou foi processada simultaneamente",
            request, "INTEGRITY_VIOLATION");
    }
    @ExceptionHandler(LimiteRequisicoesException.class)
    ResponseEntity<ApiErrorResponse> handleRateLimit(LimiteRequisicoesException e, HttpServletRequest request) {
        var body = new ApiErrorResponse(OffsetDateTime.now(), 429, "Limite de requisições",
            e.getMessage(), request.getRequestURI());
        return ResponseEntity.status(429).header(HttpHeaders.RETRY_AFTER, "600").body(body);
    }
    @ExceptionHandler(LockedException.class)
    ResponseEntity<ApiErrorResponse> handleLocked(LockedException e, HttpServletRequest request) {
        var body = new ApiErrorResponse(OffsetDateTime.now(), 429, "Acesso temporariamente bloqueado",
            "Aguarde antes de tentar novamente", request.getRequestURI());
        return ResponseEntity.status(429).header(HttpHeaders.RETRY_AFTER, "900").body(body);
    }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException e, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Credenciais inválidas", "E-mail ou senha inválidos", request);
    }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Acesso negado",
            "Você não tem permissão para acessar este recurso", request);
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> handleGeneric(Exception e, HttpServletRequest request) {
        log.error("Erro inesperado em {}", request.getRequestURI(), e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno",
            "Ocorreu um erro inesperado. Tente novamente mais tarde.", request);
    }
    private ResponseEntity<ApiErrorResponse> build(
        HttpStatus status, String error, String message, HttpServletRequest request
    ) {
        return ResponseEntity.status(status)
            .body(new ApiErrorResponse(OffsetDateTime.now(), status.value(), error, message, request.getRequestURI()));
    }
    private ResponseEntity<ApiErrorResponse> buildWithCode(
        HttpStatus status, String error, String message, HttpServletRequest request, String code
    ) {
        return ResponseEntity.status(status)
            .body(new ApiErrorResponse(OffsetDateTime.now(), status.value(), error, message, request.getRequestURI(), code));
    }
}
