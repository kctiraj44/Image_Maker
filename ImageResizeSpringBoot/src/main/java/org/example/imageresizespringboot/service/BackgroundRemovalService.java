package org.example.imageresizespringboot.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Service
public class BackgroundRemovalService {

    private static final Path SCRIPT_PATH = Path.of("background_removal.py");

    public byte[] replaceBackgroundWithWhite(byte[] imageBytes) throws IOException {
        Process process = new ProcessBuilder("python3", SCRIPT_PATH.toString())
                .redirectError(ProcessBuilder.Redirect.INHERIT)
                .start();

        try {
            process.getOutputStream().write(imageBytes);
            process.getOutputStream().close();

            byte[] processedImage = process.getInputStream().readAllBytes();
            if (!process.waitFor(90, TimeUnit.SECONDS) || process.exitValue() != 0) {
                throw new IOException("Background removal failed. Verify the Python background-removal setup.");
            }
            if (processedImage.length == 0) {
                throw new IOException("Background removal returned an empty image.");
            }
            return processedImage;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IOException("Background removal was interrupted.", exception);
        } finally {
            process.destroyForcibly();
        }
    }
}
