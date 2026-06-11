package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.DashboardResumoResponse;
import com.ravtec.delivery.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumo")
    public DashboardResumoResponse resumo() {
        return dashboardService.resumo();
    }
}
