const { Client } = require("pg");
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


(async () => {
  try {

    let db = await client.connect();
    console.log(
    `Database connected ::: PostgresSQL (db_deeniyatplus)
---------------------------------------------------------------------`
    );
  } catch (error) {
    console.log(error.message);
  }
})();

module.exports = client;
