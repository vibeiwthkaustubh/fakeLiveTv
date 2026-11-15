package com.kaustubh.fakelive;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
@CrossOrigin(origins = "*")
@RestController
public class ScheduleController {


    private final PlaylistService playlistService ;

    public ScheduleController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping("/playlist")
    public List<PlaylistItem> getPlaylist(@RequestParam boolean ads) {
        return playlistService.getPlaylist(ads);
    }
    @GetMapping("/now")
    public NowResponse getNow(@RequestParam boolean ads) {
        return playlistService.getNow(ads);
    }

}
