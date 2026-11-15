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
            new PlaylistItem(1, "VIDEO", "Movie 1", "/media/videos/video1.mp4", 5936, 0),
            new PlaylistItem(2, "VIDEO", "Movie 2", "/media/videos/video2.mp4", 5400, 0),
            new PlaylistItem(3, "VIDEO", "Movie 3", "/media/videos/video3.mp4", 4800, 0),
            new PlaylistItem(4, "VIDEO", "Movie 4", "/media/videos/video4.mp4", 6200, 0),
            new PlaylistItem(5, "VIDEO", "Movie 5", "/media/videos/video5.mp4", 5100, 0),
            new PlaylistItem(6, "VIDEO", "Movie 6", "/media/videos/video6.mp4", 5500, 0),
            new PlaylistItem(7, "VIDEO", "Movie 7", "/media/videos/video7.mp4", 4900, 0),
            new PlaylistItem(8, "VIDEO", "Movie 8", "/media/videos/video8.mp4", 6300, 0),
            new PlaylistItem(9, "VIDEO", "Movie 9", "/media/videos/video9.mp4", 5200, 0),
            new PlaylistItem(10, "VIDEO", "Movie 10", "/media/videos/video10.mp4", 5800, 0)
    );

    private final List<PlaylistItem> ads = List.of(
            new PlaylistItem(101, "AD", "Ad 1", "/media/ads/ad1.mp4", 30, 0),
            new PlaylistItem(102, "AD", "Ad 2", "/media/ads/ad2.mp4", 30, 0),
            new PlaylistItem(103, "AD", "Ad 3", "/media/ads/ad3.mp4", 30, 0),
            new PlaylistItem(104, "AD", "Ad 4", "/media/ads/ad4.mp4", 30, 0),
            new PlaylistItem(105, "AD", "Ad 5", "/media/ads/ad5.mp4", 30, 0),
            new PlaylistItem(106, "AD", "Ad 6", "/media/ads/ad6.mp4", 30, 0),
            new PlaylistItem(107, "AD", "Ad 7", "/media/ads/ad7.mp4", 30, 0)
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