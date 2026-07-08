package com.ravtec.delivery.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    ResponseEntity<ApiErrorResponse> handleNotFound(RecursoNaoEncontradoException exception, HttpServletRequest request) {
        log.warn("Recurso nao encontrado: {} [{}]", exception.getMessage(), request.getRequestURI());
        return build(HttpStatus.NOT_FOUND, "Recurso nao encontrado", exception.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        var mensagem = exception.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining("; "));

        log.warn("Dados invalidos em {}: {}", request.getRequestURI(), mensagem);
        return build(HttpStatus.BAD_REQUEST, "Dados invalidos", mensagem, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException exception, HttpServletRequest request) {
        log.warn("Requisicao invalida em {}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.BAD_REQUEST, "Requisicao invalida", exception.getMessage(), request);
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException exception, HttpServletRequest request) {
        log.error("Estado invalido em {}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.CONFLICT, "Estado invalido", exception.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException exception, HttpServletRequest request) {
        log.warn("Falha de autenticacao em {}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.UNAUTHORIZED, "Credenciais invalidas", "E-mail ou senha invalidos", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        log.warn("Acesso negado em {}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.FORBIDDEN, "Acesso negado", "Voce nao tem permissao para acessar este recurso", request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> handleGeneric(Exception exception, HttpServletRequest request) {
        log.error("Erro inesperado em {}", request.getRequestURI(), exception);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno", "Ocorreu um erro inesperado. Tente novamente mais tarde.", request);
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String error, String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
            .body(new ApiErrorResponse(OffsetDateTime.now(), status.value(), error, message, request.getRequestURI()));
    }
}
