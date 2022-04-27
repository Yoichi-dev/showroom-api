require('dotenv').config();
const ENV = process.env;
const request = require('then-request');

exports.dbConnect = connection => {
  return new Promise((resolve, reject) => {
    connection.connect((err) => err ? reject() : resolve());
  });
}

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

exports.exeSql = (connection, sql) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, rows, fields) => {
      if (err) reject();
      resolve(rows);
    });
  });
}

exports.exeSqlPlace = (connection, sql, conditions) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, conditions, (err, rows, fields) => {
      if (err) reject();
      resolve(rows);
    });
  });
}

exports.mysqlSetting = () => {
  return {
    host: ENV.DB_HOST,
    user: ENV.DB_USER,
    password: ENV.DB_PASSWORD,
    database: ENV.DB_DATABASE,
    charset: ENV.DB_CHARSET
  };
}