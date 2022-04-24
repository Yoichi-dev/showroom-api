const axios = require('axios');
const queryString = require('query-string');
const constants = require('./constants');

const Line = function () { };

// LINE Notifyのトークンセット
Line.prototype.setToken = function (token) {
  this.token = token;
};

// LINE Notify実行
Line.prototype.notify = function (text) {
  if (this.token == undefined || this.token == null) {
    console.error('undefined token.');
    return;
  }
  console.log(`notify message : ${text}`);
  axios(
    {
      method: 'post',
      url: constants.line.api,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: queryString.stringify({
        message: text
      }, {
        skipEmptyString: true
      })
    }
  )
    .then(function (res) {
      console.log(res.data);
    })
    .catch(function (err) {
      console.error(err);
    });
};

module.exports = Line;