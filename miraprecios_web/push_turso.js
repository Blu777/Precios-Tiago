const fs = require('fs');
const { createClient } = require('@libsql/client');

async function pushSchema() {
    console.log("Connecting to Turso...");
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log("Reading schema...");
        const sql = fs.readFileSync('schema_utf8.sql', 'utf8');
        
        // Split by semicolons for multiple statements
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        console.log(`Executing ${statements.length} statements...`);
        
        // Execute sequentially
        for (const stmt of statements) {
            console.log(`Executing: ${stmt.substring(0, 50)}...`);
            await client.execute(stmt);
        }
        
        console.log("Schema successfully pushed to Turso!");
    } catch (e) {
        console.error("Error executing schema:", e);
    } finally {
        client.close();
    }
}

pushSchema();
