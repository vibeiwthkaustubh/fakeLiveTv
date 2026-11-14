# Live Playlist App: Design (v2)

## 1. Goal

A web app that works like a TV channel.

- The server keeps a playlist of 5 videos (movies) and plays it **on loop, forever**.
- When a user opens the site, they see **what is playing right now**, not the start of the playlist.
- Two users who open the site at the same time see the same video at (almost) the same second.
- The user picks one of two modes with buttons:
    - **Without Ads**: videos play back to back.
    - **With Ads**: an ad plays between videos.

Videos and the ad clip are stored as files on the server.

## 2. Main idea: the schedule clock ("fake live")

We do not run a real live broadcast. We use **one shared clock** instead.

- The server has one fixed start time, called the `EPOCH` (for example, `2026-01-01T00:00:00Z`).
- The server knows the length (in seconds) of every item.
- The full playlist is one **cycle**. After the last item, it starts again from the first.
- At any moment, the server can calculate what is playing:

```
cycleLength = sum of all item durations
elapsed     = (now - EPOCH) in seconds
position    = elapsed % cycleLength      // where we are inside the cycle
```

Then walk through the items one by one:
- If `position` is less than the item's duration, this is the current item, and `offset = position`.
- Otherwise, subtract the item's duration from `position` and check the next item.

Example: durations are V1=100s, V2=200s, V3=150s. `position` = 250.
- V1: 250 is not less than 100, so position becomes 150.
- V2: 150 is less than 200, so the current item is V2 and offset = 150 seconds.

No timer or background job is needed on the server. It is just maths on the current time. This also means a server restart does not break the "live" feel.

## 3. Playlist item shape

Same for every item:

| Field | Meaning |
|---|---|
| `id` | Unique number |
| `type` | `VIDEO` or `AD` |
| `title` | Name to show |
| `url` | Where to stream the file |

The server also keeps `durationSeconds` for every item (used for the clock, and sent in `/now`).

Items:
- Videos: ids 1 to 5, urls `/stream/1` to `/stream/5`
- Ad: id 101, type `AD`, url `/ads/1` (one clip repeated for now)

## 4. The two schedules (cycles)

Both modes use the **same EPOCH**, but each mode has its own cycle.

**Without Ads cycle:**
`V1, V2, V3, V4, V5` then back to `V1`

**With Ads cycle:**
`V1, A, V2, A, V3, A, V4, A, V5, A` then back to `V1`

Note: because the cycle loops, the last ad plays between `V5` and the next `V1`. So the With Ads cycle has **5 ads per cycle** (an ad between every pair of videos, including V5 to V1). This is a default I chose. See "Open decisions" below.

## 5. API

### GET /now?ads=true|false
Tells the player what to play right now. This is the main API.

Example response:
```json
{
  "item": { "id": 2, "type": "VIDEO", "title": "Movie 2", "url": "/stream/2", "durationSeconds": 200 },
  "offsetSeconds": 150.4,
  "remainingSeconds": 49.6,
  "next": { "id": 101, "type": "AD", "title": "Ad", "url": "/ads/1", "durationSeconds": 30 },
  "serverTimeMillis": 1767225600000
}
```

- `offsetSeconds`: where to jump inside the current file.
- `remainingSeconds`: time left in this item.
- `next`: what plays after this item (so the player can get ready).
- `serverTimeMillis`: server time, used to fix small delays and drift.

### GET /playlist?ads=true|false
Returns the full cycle as a list (with durations). Not needed by the player in live mode. Useful for testing and debugging.

### GET /stream/{id}
Streams a video file. Must support **HTTP Range requests**, because the player jumps into the middle of a file.

### GET /ads/{id}
Streams an ad file. Same Range support.

## 6. Player (React) behavior

1. User clicks a mode button ("Without Ads" or "With Ads").
2. Player calls `GET /now?ads=...`.
3. Player sets the video source to `item.url`.
4. When the video metadata is loaded, set `currentTime = offsetSeconds` and play.
5. When the item ends, start `next` from second 0.
6. **Resync**: after every item, and also every 30 to 60 seconds, call `/now` again. If the player is more than about 2 seconds away from the server position, jump to the correct position.
7. Switching mode: call `/now` for the new mode and start from there.
8. Seek bar is hidden. It is live, so the user cannot scrub.

**Browser autoplay rule:** browsers block autoplay with sound until the user clicks something. The mode buttons are that click, so this is fine. If we ever autoplay on page load, we must start muted.

## 7. Rules

- Ad length is 30 seconds.
- The Skip button appears after 25 seconds of an ad (frontend rule).
- When an item ends, the next one starts automatically.
- The backend only sends `/now`, the playlist, and the files. The player controls playing and showing the skip button.
- All viewers in the same mode see (almost) the same thing. A delay of a second or two is accepted.

## 8. Open decisions (please confirm)

1. **Ads count:** With Ads cycle has 5 ads (one also between V5 and V1). The older note had 4 ads. Which one do you want?
2. **Skip in live mode:** Skipping an ad takes one viewer ahead of everyone else. Since the skip button only appears at 25 of 30 seconds, the viewer is at most 5 seconds ahead. Default for now: skip jumps to the end of the ad, and the next resync fixes the position. We can change this later.
3. **Durations:** For now we type the duration of each file in a config. Later we can read it automatically with `ffprobe` (a tool that reads video details).

## 9. Tech

- Backend: Spring Boot (Maven, Spring Web)
- Frontend: React
- Media: files on the server disk, in a `media/` folder outside `src` (and listed in `.gitignore`)
- Format: `.mp4` with H.264 video and AAC audio

## 10. Roadmap (one step at a time)

1. Design the flow and data shape (this file)
2. Set up the Spring Boot project and serve one video from `/stream/1`
3. Stream with HTTP Range requests, so jumping and seeking work
4. Playlist items and durations (config) for both cycles
5. Schedule clock: calculate current item and offset
6. `GET /now` API (and `GET /playlist` for debugging)
7. React player: join at the right second, auto-next, resync
8. Ad behavior: 30-second ad, skip after 25 seconds
9. Polish and deploy

## 11. Future ideas (not now)

- Payment gateway and subscription for the "Without Ads" option
- Multiple different ad clips
- More than 5 videos
- Real live streaming with HLS and FFmpeg (better for many viewers)