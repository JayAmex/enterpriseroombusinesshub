/**
 * Migration: Businesses as single source of truth for the Business Directory.
 * - Adds email, phone, website to businesses (nullable).
 * - Allows user_id NULL for admin-added businesses.
 * - Copies directory_businesses rows into businesses where not already present by name.
 * Run once: node migrate-businesses-single-table.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = require('./db-config.js');

async function run() {
    let connection;
    try {
        connection = await mysql.createConnection({
            ...dbConfig,
            multipleStatements: true,
            connectTimeout: 60000
        });
        console.log('Connected to database.');

        console.log('Adding optional contact columns to businesses...');
        for (const col of [
            ['email', 'VARCHAR(255) NULL AFTER business_address'],
            ['phone', 'VARCHAR(50) NULL AFTER email'],
            ['website', 'VARCHAR(500) NULL AFTER phone']
        ]) {
            try {
                await connection.query(`ALTER TABLE businesses ADD COLUMN ${col[0]} ${col[1]}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log('  ', col[0], 'already exists');
                else throw e;
            }
        }

        console.log('Allowing user_id NULL for admin-added businesses...');
        try {
            await connection.query('ALTER TABLE businesses MODIFY COLUMN user_id INT NULL');
        } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') throw e;
        }

        console.log('Copying directory_businesses into businesses (skip if name exists)...');
        const [rows] = await connection.query(`
            INSERT INTO businesses (
                user_id, business_name, business_address, email, phone, website,
                owner_name, owner_relationship, cac_registered, has_business_bank_account,
                status, registered_date
            )
            SELECT NULL, d.business_name, d.address, d.email, d.phone, d.website,
                   d.business_name, 'N/A', 'no', 'no', 'Approved', COALESCE(d.added_date, CURDATE())
            FROM directory_businesses d
            WHERE NOT EXISTS (
                SELECT 1 FROM businesses b
                WHERE LOWER(TRIM(b.business_name)) = LOWER(TRIM(d.business_name))
            )
        `);
        console.log('  Rows inserted from directory_businesses:', rows.affectedRows);

        console.log('Migration completed.');
    } catch (err) {
        console.error('Migration error:', err.message);
        if (err.code === 'ER_DUP_FIELDNAME') console.log('  (columns already exist)');
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

run();
