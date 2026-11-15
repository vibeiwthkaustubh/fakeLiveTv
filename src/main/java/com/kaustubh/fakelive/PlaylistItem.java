package com.kaustubh.fakelive;

public class PlaylistItem {  //

   private int id ;
   private String type;
   private String title;
   private String url;
   private int durationSeconds;
   private int startOffsetSeconds;

    public PlaylistItem(int id, String type, String title, String url, int durationSeconds, int startOffSeconds) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.url = url;
        this.durationSeconds = durationSeconds;
        this.startOffsetSeconds = startOffSeconds;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(int durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public int getStartOffsetSeconds() {
        return startOffsetSeconds;
    }

    public void setStartOffsetSeconds(int startOffSeconds) {
        this.startOffsetSeconds = startOffSeconds;
    }
}
