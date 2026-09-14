package com.office.letterreceipt.web;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice(basePackages = "com.office.letterreceipt.web")
public class WebExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public String handle(ResponseStatusException exception, HttpServletResponse response, Model model) {
        response.setStatus(exception.getStatusCode().value());
        model.addAttribute("status", exception.getStatusCode().value());
        model.addAttribute("message", exception.getReason());
        return "error";
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public String optimisticLock(HttpServletResponse response, Model model) {
        response.setStatus(HttpStatus.CONFLICT.value());
        model.addAttribute("status", HttpStatus.CONFLICT.value());
        model.addAttribute("message", "This letter was updated by another user. Refresh and try again.");
        return "error";
    }
}
