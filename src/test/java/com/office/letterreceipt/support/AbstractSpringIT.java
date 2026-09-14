package com.office.letterreceipt.support;

import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@EnabledIf("com.office.letterreceipt.support.DockerAvailability#available")
public abstract class AbstractSpringIT {
    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        MySqlTestContainer.register(registry);
    }
}
