package org.example.imageresizespringboot.controller;

import org.example.imageresizespringboot.service.ImageCropService;
import org.example.imageresizespringboot.service.BackgroundRemovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/payment")
public class ImageResizerController {

    private final ImageCropService imageCropService;
    private final BackgroundRemovalService backgroundRemovalService;

    @Autowired
    public ImageResizerController(ImageCropService imageCropService, BackgroundRemovalService backgroundRemovalService) {
        this.imageCropService = imageCropService;
        this.backgroundRemovalService = backgroundRemovalService;
    }

    @CrossOrigin(origins = "${app.cors.allowed-origin}")
    @PostMapping(value = "/passport-photo/remove-background", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> removeBackground(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (!List.of(MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE).contains(file.getContentType())) {
            return ResponseEntity.badRequest().build();
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
        }

        byte[] processedImage = backgroundRemovalService.replaceBackgroundWithWhite(file.getBytes());
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(processedImage);
    }

    @CrossOrigin(origins = "${app.cors.allowed-origin}")
    @PostMapping(value = "/crop", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> cropImage(@RequestParam("file") MultipartFile file,
                                            @RequestParam("x") int x,
                                            @RequestParam("y") int y,
                                            @RequestParam("width") int width,
                                            @RequestParam("height") int height,
                                            @RequestParam(value = "format", required = false) String format) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String imageFormat = (format == null || format.isBlank()) ? "png" : format.toLowerCase();
        byte[] croppedBytes = imageCropService.cropImage(file.getBytes(), x, y, width, height, imageFormat);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("image/" + imageFormat));
        headers.setContentDisposition(ContentDisposition.inline().filename("cropped." + imageFormat).build());

        return new ResponseEntity<>(croppedBytes, headers, HttpStatus.OK);
    }

}
