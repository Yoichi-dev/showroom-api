const express = require('express');
const axios = require("axios").default;
const router = express.Router();
const fetch = require('node-fetch');
const common = require('../common');
const { check, validationResult } = require('express-validator');

router.get('/', [], function (req, res, next) {
  res.json({ title: 'YouTube API' });
});

router.get('/channel/:channel', [check('channel').not().isEmpty()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return
  }

  let resJson = {
    flg: false
  }

  try {
    const searchRes = await fetch(`https://www.youtube.com/channel/${req.params.channel}/live`, { redirect: 'follow' })
    const searchResHtml = await searchRes.text();

    const free = searchResHtml.match(new RegExp(process.env.FREE_CHAT + '(.*?)', 'g'));

    if (!free) {
      const key = searchResHtml.match(/innertubeApiKey":".*?"/)[0]
        .split(':')[1]
        .replace(/"/g, '');

      const continuations = searchResHtml.match(/"continuations":\[{"reloadContinuationData":{"continuation":".*?"/)[0];

      const continuation = continuations.match(/continuation":".*?"/)[0]
        .split(':')[1]
        .replace(/"/g, '');

      resJson.key = key
      resJson.continuation = continuation
      resJson.flg = true
    }

  } catch (error) {
    console.log(error);
  }

  res.json(resJson);
}));

/* コメント取得 */
router.post('/comment', common.asyncWrapper(async (req, res, next) => {
  if (req.body.key === undefined || req.body.continuation === undefined) {
    res.status(400).json({ status: "400 Bad Request" });
    return
  }

  try {
    const url = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${req.body.key}&prettyPrint=false`;

    const comRes = await axios.post(url, {
      context: {
        client: {
          hl: "ja",
          gl: "JP",
          clientVersion: "2.20210126.08.02",
          timeZone: "Etc/GMT-9",
          utcOffsetMinutes: 540,
          userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
          connectionType: "CONN_CELLULAR_4G",
          memoryTotalKbytes: "8000000",
          mainAppWebInfo: {
            graftUrl: `https://www.youtube.com/live_chat?continuation=${req.body.continuation}`,
            webDisplayMode: "WEB_DISPLAY_MODE_BROWSER",
            isWebNativeShareAvailable: true
          },
          clientName: "WEB",
        },
        user: {
          lockedSafetyMode: false
        },
        request: {
          useSsl: true,
          internalExperimentFlags: [],
          consistencyTokenJars: []
        }
      },
      continuation: req.body.continuation,
    }).catch(e => {
      console.log(e)
      throw new Error('getError')
    });

    // 次のパラメーター
    const nextContinuation = comRes.data.continuationContents.liveChatContinuation.continuations[0].invalidationContinuationData.continuation
    let commentObj = comRes.data.continuationContents.liveChatContinuation.actions

    const item = []

    if (commentObj !== undefined) {
      for (const comObj of commentObj) {
        if (comObj.hasOwnProperty("addChatItemAction")) {
          if (comObj.addChatItemAction.item.hasOwnProperty("liveChatTextMessageRenderer") && comObj.addChatItemAction.item.liveChatTextMessageRenderer !== undefined) {
            // チャット
            const itemObj = comObj.addChatItemAction.item.liveChatTextMessageRenderer
            let resMsg = []
            for (const cutCmnt of itemObj.message.runs) {
              if (cutCmnt.hasOwnProperty("text")) {
                resMsg.push({ text: cutCmnt.text })
              }
              if (cutCmnt.hasOwnProperty("emoji")) {
                if (cutCmnt.emoji.isCustomEmoji) {
                  resMsg.push({
                    emoji: cutCmnt.emoji.image.thumbnails[0].url,
                    isCustomEmoji: cutCmnt.emoji.isCustomEmoji
                  })
                } else {
                  resMsg.push({
                    emoji: cutCmnt.emoji.emojiId,
                    isCustomEmoji: cutCmnt.emoji.isCustomEmoji,
                    cutCmnt
                  })
                }
              }
            }
            item.push({
              name: itemObj.authorName.simpleText,
              img: itemObj.authorPhoto.thumbnails[0].url,
              comment: resMsg,
              timestamp: new Date(Number(itemObj.timestampUsec) / 1000)
            })
          }
          if (comObj.addChatItemAction.item.hasOwnProperty("liveChatPaidMessageRenderer") && comObj.addChatItemAction.item.liveChatTextMessageRenderer !== undefined) {
            // スパチャ
          }
        } else {
          console.log('その他')
        }
      }
    }

    res.json({
      item,
      nextContinuation
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({});
  }
}));

module.exports = router;
