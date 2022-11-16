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
      summaryRanking: "https://www.showroom-live.com/api/live/summary_ranking?room_id="
    },
    room: {
      profile: "https://www.showroom-live.com/api/room/profile?room_id=",
      eventAndSupport: "https://www.showroom-live.com/api/room/event_and_support?room_id=",
      status: "https://www.showroom-live.com/api/room/status?room_url_key=",
      telop: "https://www.showroom-live.com/api/live/telop?room_id="
    },
    event: {
      contributionRanking: "https://www.showroom-live.com/api/event/contribution_ranking?room_id="
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
      twitter: "SELECT event_id, event_url, event_name FROM events where started_at = ?",
      registeredUsers: "SELECT room_id FROM event_history WHERE event_id = ? GROUP BY room_id",
      lastPointData: "SELECT * FROM event_history WHERE room_id = ? AND event_id = ? AND get_at = (SELECT MAX(get_at) FROM event_history WHERE room_id = ? AND event_id = ?)",
      scheduledEvents: "SELECT event_url FROM scheduled_event WHERE started_at = ?",
      historyAtList: "SELECT DISTINCT(get_at) AS 'get_at' FROM event_history WHERE event_id = ? GROUP BY get_at ORDER BY get_at",
      endUpdateEventList: "SELECT event_id, event_url FROM events WHERE ended_at = ?",
      eventList: "SELECT * FROM events ORDER BY started_at DESC",
      holdEventList: "SELECT * FROM events WHERE started_at < ? AND ended_at > ? ORDER BY started_at DESC",
      endEventList: "SELECT * FROM events WHERE ended_at <= ? ORDER BY started_at DESC",
      eventDataList: "SELECT * FROM events WHERE event_id = ?",
      eventUserList: "SELECT a.event_id as event_id, a.room_id AS room_id, b.room_name AS room_name, b.room_url_key AS room_url_key, a.now_rank AS juni FROM (SELECT event_id, room_id, get_at, follower_num, gap, next_rank, point, now_rank FROM event_history WHERE event_id = ? AND get_at = (SELECT MAX(get_at) FROM event_history WHERE event_id = ?)) a LEFT JOIN users b ON a.room_id = b.room_id ORDER BY a.now_rank",
      historyList: "SELECT * FROM event_history WHERE event_id = ? ORDER BY room_id, get_at",
      userHistoryList: "SELECT * FROM event_history WHERE event_id = ? AND room_id = ? ORDER BY get_at",
      aggregateList: "SELECT * FROM event_history WHERE event_id = ? AND get_at = (select max(get_at) FROM event_history WHERE event_id = ?)",
      logList: "SELECT log_id FROM watchlog WHERE uuid = ? ORDER BY log_id DESC",
      log: "SELECT * FROM watchlog WHERE uuid = ? AND log_id = ?",
      logCheck: "SELECT count(*) AS count FROM watchlog WHERE uuid = ? AND log_id = ?",
      corruptionCheck: "SELECT count(*) AS count FROM watchlogcorruption WHERE uuid = ?",
      check: "SELECT count(*) AS count FROM event_history WHERE event_id = ? AND room_id = ?"
    },
    update: {
      roomName: "INSERT INTO users (room_id, room_name, room_url_key) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE room_name = ?, room_url_key = ?;",
      resultPoint: "UPDATE event_history SET point = ?, now_rank = ? WHERE event_id = ? AND room_id = ? AND get_at = ?",
    },
    insert: {
      lastHistoryData: "INSERT INTO event_history SET (SELECT event_id, room_id, ?, follower_num, gap, next_rank, point, now_rank FROM event_history WHERE event_id = ? AND room_id = ? ORDER BY get_at DESC LIMIT 1)",
      history: "INSERT INTO event_history VALUES ?",
      eventInfo: "INSERT INTO events SET ?",
      log: "INSERT INTO watchlog (uuid, log_id, log_json) VALUES (?, ?, ?)",
      corruption: "INSERT INTO watchlogcorruption (uuid, log_data) VALUES (?, ?)"
    },
    delete: {
      history: "DELETE FROM event_history WHERE event_id = ? AND room_id = ?",
      scheduledEvents: "DELETE FROM scheduled_event WHERE started_at = ?",
      log: "DELETE FROM watchlog WHERE uuid = ? AND log_id = ?",
    }
  }
}

module.exports = Object.freeze(constants);