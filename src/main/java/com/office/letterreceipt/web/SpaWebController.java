package com.office.letterreceipt.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaWebController {

    private static final String INDEX_HTML = "forward:/index.html";

    @GetMapping("/")
    public String root() {
        return INDEX_HTML;
    }

    @GetMapping("/reception/login")
    public String receptionLogin() {
        return INDEX_HTML;
    }

    @GetMapping("/reception/dashboard")
    public String receptionDashboard() {
        return INDEX_HTML;
    }

    @GetMapping("/reception/record")
    public String receptionRecord() {
        return INDEX_HTML;
    }
}