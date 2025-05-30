import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./shared/schema.js";

console.log("Starting Shiprocket schema update...");

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Setup postgres client
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Run the schema push
async function main() {
  try {
    console.log("Updating shiprocket_settings table...");

    // Using direct SQL to check if the column exists
    const columnCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shiprocket_settings' 
      AND column_name = 'default_courier'
    `;

    if (columnCheck.length === 0) {
      console.log(
        "Adding default_courier column to shiprocket_settings table..."
      );

      // Add the column if it doesn't exist
      await client`
        ALTER TABLE shiprocket_settings 
        ADD COLUMN default_courier TEXT
      `;

      console.log(
        "Successfully added default_courier column to shiprocket_settings table"
      );
    } else {
      console.log(
        "default_courier column already exists in shiprocket_settings table"
      );
    }

    console.log("Shiprocket schema update completed successfully");
  } catch (error) {
    console.error("Error updating schema:", error);
  } finally {
    await client.end();
  }
}

main();
