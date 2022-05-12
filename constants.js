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
}

module.exports = Object.freeze(constants);