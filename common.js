const request = require('then-request');

exports.asyncWrapper = fn => {
  return (req, res, next) => {
    return fn(req, res, next).catch(next);
  }
};

exports.exeApi = url => {
  return new Promise((resolve, reject) => {
    request('GET', url).done((res) => {
      if (res.statusCode == 404) {
        reject(null);
      } else {
        resolve(JSON.parse(res.getBody('utf8')));
      }
    });
  });
};
