package com.ravtec.delivery;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.servlet.view.xslt.XsltView;
import org.springframework.web.servlet.view.xslt.XsltViewResolver;

/** Condições de não aplicabilidade dos CVEs registradas em docs/diagnostico-checks-pr-2.md. */
class SuperficieRestTest extends AbstractIntegrationTest {
    @Autowired
    private ApplicationContext context;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping mapping;

    @Test
    void endpointsDaAplicacaoDevemResponderComoRestSemViewsXslt() {
        var handlers = mapping.getHandlerMethods().values().stream()
            .filter(handler -> handler.getBeanType().getPackageName().startsWith("com.ravtec.delivery"))
            .toList();
        assertThat(handlers).isNotEmpty();
        for (var handler : handlers) {
            assertThat(AnnotatedElementUtils.hasAnnotation(handler.getBeanType(), RestController.class))
                .as("Endpoint deve permanecer REST: %s", handler).isTrue();
        }
        assertThat(context.getBeansOfType(XsltView.class)).isEmpty();
        assertThat(context.getBeansOfType(XsltViewResolver.class)).isEmpty();
    }

    @Test
    void fontesDeTodosOsPerfisNaoDevemIntroduzirXsltOuSseComViews() throws Exception {
        // Inclui configurações condicionais que não são instanciadas no perfil de teste.
        var recursos = Pattern.compile("\\b(?:XsltView\\w*|SseEmitter|ResponseBodyEmitter|"
            + "FragmentsRendering|ModelAndView|ServerSentEvent)\\b|text/event-stream|"
            + "org\\.springframework\\.web\\.servlet\\.view\\.xslt");
        try (var arquivos = Files.walk(Path.of("src/main"))) {
            var fontes = arquivos.filter(Files::isRegularFile)
                .filter(path -> path.toString().endsWith(".java") || path.toString().endsWith(".xml")
                    || path.toString().endsWith(".yml") || path.toString().endsWith(".yaml")
                    || path.toString().endsWith(".properties"))
                .toList();
            assertThat(fontes).isNotEmpty();
            for (var fonte : fontes) {
                assertThat(recursos.matcher(Files.readString(fonte)).find())
                    .as("Reavaliar os CVEs e remover as exceções antes de usar XSLT/SSE/views em %s", fonte)
                    .isFalse();
            }
        }
    }
}
