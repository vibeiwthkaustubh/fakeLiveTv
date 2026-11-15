package com.kaustubh.fakelive;

public class NowResponse {

    private PlaylistItem item; // The video slice or the ad playing right now
    private double offsetSeconds; // Exact second of the video file React should jump to
    private double remainingSeconds; // Seconds left in this current slice/ad
    private PlaylistItem next; // The next item to play
    private long serverTimeMillis; // Server's current clock time in milliseconds

    public NowResponse(PlaylistItem item, double offsetSeconds, double remainingSeconds, PlaylistItem next, long serverTimeMillis) {
        this.item = item;
        this.offsetSeconds = offsetSeconds;
        this.remainingSeconds = remainingSeconds;
        this.next = next;
        this.serverTimeMillis = serverTimeMillis;
    }

    public PlaylistItem getItem() {
        return item;
    }

    public void setItem(PlaylistItem item) {
        this.item = item;
    }

    public double getOffsetSeconds() {
        return offsetSeconds;
    }

    public void setOffsetSeconds(double offsetSeconds) {
        this.offsetSeconds = offsetSeconds;
    }

    public double getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(double remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public PlaylistItem getNext() {
        return next;
    }

    public void setNext(PlaylistItem next) {
        this.next = next;
    }

    public long getServerTimeMillis() {
        return serverTimeMillis;
    }

    public void setServerTimeMillis(long serverTimeMillis) {
        this.serverTimeMillis = serverTimeMillis;
    }


}