package com.kaustubh.fakelive;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service // Spring creates and manages one shared copy of this class for the whole app
public class PlaylistService {

    // Fixed start time: 2026-01-01T00:00:00Z in milliseconds
    private static final long EPOCH_MILLIS = 1767225600000L;

    // 600 seconds = 10 minutes between ads inside a movie
    private static final int AD_INTERVAL_SECONDS = 600;

    private final List<PlaylistItem> videos = List.of(
            new PlaylistItem(1, "VIDEO", "Movie 1", "/stream/1", 5936, 0),
            new PlaylistItem(2, "VIDEO", "Movie 2", "/stream/2", 5936, 0),

    );

    private final List<PlaylistItem> ads = List.of(
            new PlaylistItem(101, "AD", "Ad 1", "/ads/1", 30, 0)
    );

    public List<PlaylistItem> getPlaylist(boolean withAds) {
        if (!withAds) {
            return videos;
        }

        List<PlaylistItem> cycle = new ArrayList<>();
        int adIndex = 0;

        for (PlaylistItem video : videos) {
            int totalDuration = video.getDurationSeconds();
            int currentStart = 0;

            // Slice the movie into 10-minute (600s) pieces
            while (currentStart < totalDuration) {
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

                // 2. Add an ad right after this slice
                PlaylistItem currentAd = ads.get(adIndex % ads.size());
                cycle.add(currentAd);
                adIndex++;

                // 3. Move the start pointer forward
                currentStart += chunkDuration;
            }
        }

        return cycle;
    }

    public NowResponse getNow(boolean withAds) {
        // 1. Get the right playlist cycle (with or without ads)
        List<PlaylistItem> playlist = getPlaylist(withAds);

        // 2. Sum all item durations to get the full loop length
        int cycleLength = 0;
        for (PlaylistItem item : playlist) {
            cycleLength += item.getDurationSeconds();
        }

        // 3. Find where we are inside the current loop right now
        long nowMillis = System.currentTimeMillis();
        double elapsedSeconds = (nowMillis - EPOCH_MILLIS) / 1000.0;
        double position = elapsedSeconds % cycleLength;

        // 4. Walk through the playlist to find the active item
        for (int i = 0; i < playlist.size(); i++) {
            PlaylistItem current = playlist.get(i);
            int duration = current.getDurationSeconds();

            if (position < duration) {
                // Add startOffsetSeconds so mid-movie chunks jump to the right spot in the file
                double offsetSeconds = current.getStartOffsetSeconds() + position;
                double remainingSeconds = duration - position;
                // Wrap around to index 0 if we are on the very last item
                PlaylistItem next = playlist.get((i + 1) % playlist.size());

                return new NowResponse(current, offsetSeconds, remainingSeconds, next, nowMillis);
            }

            // Not in this item; subtract its duration and check the next one
            position -= duration;
        }

        return null;
    }
}