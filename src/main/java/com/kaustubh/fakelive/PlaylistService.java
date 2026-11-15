package com.kaustubh.fakelive;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service // spring created and manages a shared copy of it for the whole app.
public class PlaylistService {
 /*This class is the manager that will handle form where should the data be sent when a get request arrives*/

    private final List<PlaylistItem> videos =  List.of
            ( new PlaylistItem(1,"VIDEO" , "Movie 1" , "/stream/1" , 5936 ,0)
                  , new PlaylistItem(2,"VIDEO" , "Movie 2" , "/stream/2" , 5936 ,0)   );

    private final List<PlaylistItem> ads = List.of(
            new PlaylistItem(101, "AD", "Ad 1", "/ads/1", 30, 0)
    );


    private static final int AD_INTERVAL_SECONDS = 600; // ad interval in seconds


    // method behind running the show
    public List<PlaylistItem>getPlaylist(boolean withAds){
        if(!withAds){
            return videos;
        }
        List<PlaylistItem> cycle = new ArrayList<>();
        int adIndex = 0;

        for (PlaylistItem video : videos) {
            int totalDuration = video.getDurationSeconds();
            int currentStart = 0;

            // Inner loop: slice the movie into 10-minute (600s) pieces
            while (currentStart < totalDuration) {
                // Take 600s, or whatever seconds are left at the end of the movie
                int chunkDuration = Math.min(AD_INTERVAL_SECONDS, totalDuration - currentStart);

                // 1. Add this slice of the movie
                cycle.add(new PlaylistItem(
                        video.getId(),
                        video.getType(),
                        video.getTitle(),
                        video.getUrl(),
                        chunkDuration,
                        currentStart
                ));

                PlaylistItem currentAd = ads.get(adIndex % ads.size());
                cycle.add(currentAd);
                adIndex++;

                // 3. Move the start pointer forward by the chunk we just added
                currentStart += chunkDuration;
            }
        }

        return cycle;

    }
}
