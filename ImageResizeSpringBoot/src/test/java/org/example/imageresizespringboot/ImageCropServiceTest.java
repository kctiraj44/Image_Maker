package org.example.imageresizespringboot;

import org.example.imageresizespringboot.service.ImageCropService;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ImageCropServiceTest {

    private final ImageCropService imageCropService = new ImageCropService();

    @Test
    void cropImageReturnsExpectedDimensionsAndContent() throws IOException {
        BufferedImage original = new BufferedImage(8, 6, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < original.getHeight(); y++) {
            for (int x = 0; x < original.getWidth(); x++) {
                original.setRGB(x, y, (x * 10) + y);
            }
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(original, "png", out);
        byte[] inputBytes = out.toByteArray();

        byte[] croppedBytes = imageCropService.cropImage(inputBytes, 2, 1, 4, 3, "png");

        BufferedImage cropped = ImageIO.read(new ByteArrayInputStream(croppedBytes));

        assertNotNull(cropped);
        assertEquals(4, cropped.getWidth());
        assertEquals(3, cropped.getHeight());
        assertEquals(0xFF000015, cropped.getRGB(0, 0));
        assertEquals(0xFF000035, cropped.getRGB(3, 2));
    }
}
