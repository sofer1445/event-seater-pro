import pool from '../database';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'init.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        await pool.query(sqlContent);
        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await pool.end();
    }
}

// Run the initialization
initializeDatabase();
