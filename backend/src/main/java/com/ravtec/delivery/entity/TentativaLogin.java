package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Entity @Table(name = "tentativas_login")
public class TentativaLogin extends BaseEntity {
    @Column(nullable = false, unique = true, length = 64)
    private String emailHash;
    @Column(nullable = false)
    private int falhas;
    private OffsetDateTime bloqueadoAte;
    private OffsetDateTime ultimaTentativaEm;
}
