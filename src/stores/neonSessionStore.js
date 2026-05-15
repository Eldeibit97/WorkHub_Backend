const session = require('express-session');
const { sql } = require('../config/db');

function expireFromExpressSession(sess) {
  const maxAgeMs = sess?.cookie?.maxAge;
  const ttlMs =
    typeof maxAgeMs === 'number' && maxAgeMs > 0 ? maxAgeMs : 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ttlMs);
}

/**
 * Store compatible con express-session usando el mismo @neondatabase/serverless
 * que el resto del backend (evita node-pg / ECONNRESET con Neon en Windows).
 *
 * Tabla y columnas alineadas con connect-pg-simple para migraciones sencillas.
 */
class NeonSessionStore extends session.Store {
  constructor() {
    super();
    /** @type {Promise<void>} */
    this._ready = this._ensureTable();
  }

  _ensureTable() {
    return (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL PRIMARY KEY,
          "sess" jsonb NOT NULL,
          "expire" timestamptz NOT NULL
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS "IDX_session_expire"
        ON "session" ("expire")
      `;
    })();
  }

  get(sid, callback) {
    this._ready
      .then(() =>
        sql`
        SELECT "sess" FROM "session"
         WHERE "sid" = ${sid}
           AND "expire" > NOW()
         LIMIT 1
      `
      )
      .then((rows) => {
        if (!rows || rows.length === 0) {
          callback(null, null);
          return;
        }
        const raw = rows[0].sess;
        const data =
          raw != null && typeof raw === 'object' ? raw : JSON.parse(String(raw));
        callback(null, data);
      })
      .catch(callback);
  }

  set(sid, sess, callback) {
    const expire = expireFromExpressSession(sess);
    const payload = JSON.stringify(sess);
    this._ready
      .then(() =>
        sql`
        INSERT INTO "session" ("sid", "sess", "expire")
        VALUES (${sid}, ${payload}::jsonb, ${expire.toISOString()}::timestamptz)
        ON CONFLICT ("sid") DO UPDATE SET
          "sess" = EXCLUDED."sess",
          "expire" = EXCLUDED."expire"
      `
      )
      .then(() => callback(null))
      .catch((err) => callback(err));
  }

  destroy(sid, callback) {
    this._ready
      .then(() => sql`DELETE FROM "session" WHERE "sid" = ${sid}`)
      .then(() => callback(null))
      .catch((err) => callback(err));
  }

  touch(sid, sess, callback) {
    const expire = expireFromExpressSession(sess);
    this._ready
      .then(() =>
        sql`
        UPDATE "session"
           SET "expire" = ${expire.toISOString()}::timestamptz
         WHERE "sid" = ${sid}
      `
      )
      .then(() => callback(null))
      .catch((err) => callback(err));
  }
}

module.exports = { NeonSessionStore };
