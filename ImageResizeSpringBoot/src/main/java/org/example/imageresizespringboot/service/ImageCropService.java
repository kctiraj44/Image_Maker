package org.example.imageresizespringboot.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ImageCropService {

    public byte[] cropImage(byte[] imageBytes, int x, int y, int width, int height, String formatName) throws IOException {
        BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (originalImage == null) {
            throw new IOException("Unable to read image bytes");
        }

        if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > originalImage.getWidth() || y + height > originalImage.getHeight()) {
            throw new IllegalArgumentException("Invalid crop coordinates for the provided image");
        }

        BufferedImage croppedImage = originalImage.getSubimage(x, y, width, height);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(croppedImage, formatName, outputStream);
        return outputStream.toByteArray();
    }
}
