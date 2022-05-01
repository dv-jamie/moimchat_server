const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "moimchat",
  connectionLimit: 10,
  dateStrings: 'date'
});

exports.getConnection = async () => {
  return await pool.getConnection();
};