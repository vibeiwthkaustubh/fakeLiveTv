package com.kaustubh.fakelive;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController // this class answers web requests and returns data
public class StreamController {

    // folder where videos are kept (counted from the project root)
    private static final String VIDEO_FOLDER = "media/videos/";

    @GetMapping("/stream/{id}") // runs for GET /stream/1, /stream/2, ...
    public ResponseEntity<Resource> streamVideo(@PathVariable int id) {

        // point to the file on disk (does not load it into memory)
        Resource video = new FileSystemResource(VIDEO_FOLDER + id + ".mp4");

        // file not found -> send 404 (used the .exist method to for decision-making)
        if (!video.exists()) {
            return ResponseEntity.notFound().build();
        }

        // file found -> send 200 with type video/mp4 and the file as body
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("video/mp4"))
                .body(video);
    }
}