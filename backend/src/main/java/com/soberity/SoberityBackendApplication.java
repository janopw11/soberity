package com.soberity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SoberityBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SoberityBackendApplication.class, args);
    }
}
