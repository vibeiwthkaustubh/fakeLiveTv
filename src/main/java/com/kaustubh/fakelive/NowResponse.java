package com.kaustubh.fakelive;

public class NowResponse {

  private PlaylistItem item ;// The video slice or the ad playing right now
  private double offSetSeconds; // the exact second of the video file the react should jump to right now
   private double remainingSeconds ;
   private PlaylistItem next ; // the next item to jump to

    private long serverTimeMillis; // The servr's current clock time in milliseconds


    public NowResponse(PlaylistItem item, double offSetSeconds, double remainingSeconds, PlaylistItem next, long serverTimeMillis) {
        this.item = item;
        this.offSetSeconds = offSetSeconds;
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

    public double getOffSetSeconds() {
        return offSetSeconds;
    }

    public void setOffSetSeconds(double offSetSeconds) {
        this.offSetSeconds = offSetSeconds;
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
