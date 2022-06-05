const constants = {
  url: {
    main: "https://www.showroom-live.com",
    event: "https://www.showroom-live.com/event/",
    eventList: "https://www.showroom-live.com/event#soon",
    search: "https://www.showroom-live.com/room/search?genre_id=0&keyword=",
    live: {
      onlives: "https://www.showroom-live.com/api/live/onlives",
      giftList: "https://www.showroom-live.com/api/live/gift_list?room_id=",
      stageUserList: "https://www.showroom-live.com/api/live/stage_user_list?room_id=",
      liveInfo: "https://www.showroom-live.com/api/live/live_info?room_id=",
      commentLog: "https://www.showroom-live.com/api/live/comment_log?room_id=",
      giftLog: "https://www.showroom-live.com/api/live/gift_log?room_id=",
    },
    room: {
      profile: "https://www.showroom-live.com/api/room/profile?room_id=",
      eventAndSupport: "https://www.showroom-live.com/api/room/event_and_support?room_id=",
      status: "https://www.showroom-live.com/api/room/status?room_url_key=",
    },
    user: {
      profile: "https://www.showroom-live.com/api/user/profile?user_id=",
    }
  },
  minecraft: {
    url: "minecraft.showroom-app.com",
    port: 4466,
    api: "https://api.mojang.com/users/profiles/minecraft/"
  },
  line: {
    api: "https://notify-api.line.me/api/notify"
  },
  sql: {
    select: {
      updateEventList: "SELECT event_id, event_url FROM events where ended_at > ?",
      registeredUsers: "SELECT room_id FROM event_history WHERE event_id = ? GROUP BY room_id",
      lastPointData: "SELECT * FROM event_history WHERE room_id = ? AND event_id = ? AND get_at = (SELECT MAX(get_at) FROM event_history WHERE room_id = ? AND event_id = ?)",
      scheduledEvents: "SELECT event_url FROM scheduled_event WHERE started_at = ?",
      historyAtList: "SELECT DISTINCT(get_at) AS 'get_at' FROM event_history WHERE event_id = ? GROUP BY get_at ORDER BY get_at",
      endEventList: "SELECT event_id, event_url FROM events WHERE ended_at = ?",
    },
    update: {
      roomName: "INSERT INTO users (room_id, room_name, room_url_key) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE room_name = ?, room_url_key = ?;",
    },
    insert: {
      lastHistoryData: "INSERT INTO event_history SET (SELECT event_id, room_id, ?, follower_num, gap, next_rank, point, now_rank FROM event_history WHERE event_id = ? AND room_id = ? ORDER BY get_at DESC LIMIT 1)",
      history: "INSERT INTO event_history VALUES ?",
      eventInfo: "INSERT INTO events SET ?",
    },
    delete: {
      history: "DELETE FROM event_history WHERE event_id = ? AND room_id = ?",
      scheduledEvents: "DELETE FROM scheduled_event WHERE started_at = ?",
    }
  }
}

module.exports = Object.freeze(constants);