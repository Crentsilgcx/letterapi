package com.office.letterreceipt.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.utility.DockerImageName;

public final class MySqlTestContainer {
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
        .withDatabaseName("letter_receipt")
        .withUsername("letter_app")
        .withPassword("test-password-123");

    private static volatile boolean started;

    private MySqlTestContainer() {}

    public static synchronized void register(DynamicPropertyRegistry registry) {
        if (!started) {
            MYSQL.start();
            started = true;
        }
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }
}
