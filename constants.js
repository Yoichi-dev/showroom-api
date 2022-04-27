const constants = {
  url: {
    main: "https://www.showroom-live.com",
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
    eventList: "SELECT * FROM events ORDER BY started_at DESC",
    holdEventList: "SELECT * FROM events WHERE started_at < ? AND ended_at > ? ORDER BY started_at DESC",
    endEventList: "SELECT * FROM events WHERE ended_at <= ? ORDER BY started_at DESC",
    eventDataList: "SELECT * FROM events WHERE event_id = ?",
    eventUserList: "select a.event_id as event_id, a.room_id as room_id, b.room_name as room_name, b.room_url_key as room_url_key, a.`rank` as juni FROM (select event_id, room_id, get_at, follower_num, gap, next_rank, point, `rank` FROM event_history WHERE event_id = ? and get_at = (select max(get_at) FROM event_history WHERE event_id = ?)) a left join users b on a.room_id = b.room_id order by a.`rank`",
    historyList: "SELECT * FROM event_history WHERE event_id = ? ORDER BY room_id, get_at",
    userHistoryList: "SELECT * FROM event_history WHERE event_id = ? and room_id = ? ORDER BY get_at",
    aggregateList: "select * FROM event_history WHERE event_id = ? and get_at = (select max(get_at) FROM event_history WHERE event_id = ?)",
  }
}

module.exports = Object.freeze(constants);