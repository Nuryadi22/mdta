import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return mysql.createPool({
      uri: databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return mysql.createPool({
    host: process.env.DB_HOST || 'mdta-database-dtaalistikmal25-9748.k.aivencloud.com',
    port: Number(process.env.DB_PORT) || 23820,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    waitForConnections: true,
    connectionLimit: 10,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export const db = global._mysqlPool || createPool();

if (process.env.NODE_ENV !== 'production') {
  global._mysqlPool = db;
}
