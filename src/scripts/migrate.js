"use strict";

require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log("Starting database migrations...");

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Read all SQL files in src/migrations
    const migrationsDir = path.join(__dirname, "../migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort alphabetically

    for (const file of files) {
      const { rowCount } = await client.query(
        "SELECT 1 FROM migrations WHERE filename = $1",
        [file]
      );

      if (rowCount === 0) {
        console.log(`Executing migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query("INSERT INTO migrations (filename) VALUES ($1)", [file]);
          await client.query("COMMIT");
          console.log(`Migration ${file} executed successfully.`);
        } catch (error) {
          await client.query("ROLLBACK");
          console.error(`Error executing migration ${file}:`, error);
          throw error;
        }
      } else {
        console.log(`Migration ${file} already executed. Skipping.`);
      }
    }

    console.log("All migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
