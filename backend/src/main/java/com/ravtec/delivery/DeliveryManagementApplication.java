package com.ravtec.delivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class DeliveryManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(DeliveryManagementApplication.class, args);
    }
}
