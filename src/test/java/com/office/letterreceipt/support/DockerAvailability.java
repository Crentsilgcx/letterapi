package com.office.letterreceipt.support;

public final class DockerAvailability {
    private DockerAvailability() {}

    public static boolean available() {
        try {
            Process process = new ProcessBuilder("docker", "info")
                .redirectErrorStream(true)
                .start();
            boolean finished = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        } catch (Throwable ignored) {
            return false;
        }
    }
}
