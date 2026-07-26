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
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    ResponseEntity<ApiErrorResponse> handleNotFound(RecursoNaoEncontradoException e, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Recurso nao encontrado", e.getMessage(), request);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException e, HttpServletRequest request) {
        var mensagem = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage()).collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, "Dados invalidos", mensagem, request);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Requisicao invalida", e.getMessage(), request);
    }
    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException e, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "Estado invalido", e.getMessage(), request);
    }
    @ExceptionHandler({ConflitoException.class, ObjectOptimisticLockingFailureException.class})
    ResponseEntity<ApiErrorResponse> handleConflict(Exception e, HttpServletRequest request) {
        var mensagem = e instanceof ObjectOptimisticLockingFailureException
            ? "Os dados foram alterados por outra pessoa. Recarregue e tente novamente" : e.getMessage();
        return build(HttpStatus.CONFLICT, "Conflito", mensagem, request);
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiErrorResponse> handleDataConflict(DataIntegrityViolationException e, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "Conflito",
            "A operacao conflita com dados existentes ou foi processada simultaneamente", request);
    }
    @ExceptionHandler(LimiteRequisicoesException.class)
    ResponseEntity<ApiErrorResponse> handleRateLimit(LimiteRequisicoesException e, HttpServletRequest request) {
        var body = new ApiErrorResponse(OffsetDateTime.now(), 429, "Limite de requisicoes",
            e.getMessage(), request.getRequestURI());
        return ResponseEntity.status(429).header(HttpHeaders.RETRY_AFTER, "600").body(body);
    }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException e, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Credenciais invalidas", "E-mail ou senha invalidos", request);
    }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Acesso negado",
            "Voce nao tem permissao para acessar este recurso", request);
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
}
