const request = require('then-request');
require('dotenv').config();

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

exports.dbConnect = (connection) => {
  return new Promise((resolve, reject) => {
    connection.connect((err) => err ? reject(err) : resolve());
  });
};

exports.selectDb = (connection, sql, parameter) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, parameter, (err, rows, fields) => {
      if (err) reject();
      resolve(rows);
    });
  });
};

exports.transactionDb = (connection, sql, parameter) => {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) reject()
      connection.query(sql, parameter, err => {
        if (err) connection.rollback(() => reject())
      });
      connection.commit(err => {
        if (err) connection.rollback(() => reject())
        resolve();
      });
    });
  });
};

exports.mysqlSetting = () => {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: process.env.DB_CHARSET,
    ssl: {
      rejectUnauthorized: process.env.DB_SSL
    }
  };
}