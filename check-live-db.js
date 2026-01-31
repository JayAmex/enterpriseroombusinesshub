#!/usr/bin/env node
/**
 * Check that the live site's API can reach the database.
 * Run before deploy: node check-live-db.js [baseUrl]
 * Example: node check-live-db.js https://www.enterpriserm.com
 * Or set SITE_URL: SITE_URL=https://www.enterpriserm.com node check-live-db.js
 */
const baseUrl = process.argv[2] || process.env.SITE_URL || 'https://www.enterpriserm.com';
const healthUrl = baseUrl.replace(/\/$/, '') + '/api/health';

function parseJson(text) {
    try {
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
}

function check() {
    const url = new URL(healthUrl);
    const transport = url.protocol === 'https:' ? require('https') : require('http');

    const req = transport.request(
        url,
        { method: 'GET', timeout: 15000 },
        (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                const data = parseJson(body) || {};
                if (res.statusCode === 200 && data.database === 'connected') {
                    console.log('Live API database check: OK');
                    console.log('  ' + healthUrl + ' -> database: connected');
                    process.exit(0);
                } else {
                    console.error('Live API database check: FAILED');
                    console.error('  ' + healthUrl + ' ->', data.database || data.status || data.error || res.statusCode);
                    process.exit(1);
                }
            });
        }
    );

    req.on('timeout', () => {
        req.destroy(new Error('Request timeout'));
    });
    req.on('error', (err) => {
        console.error('Live API database check: ERROR');
        console.error('  ' + healthUrl + ' ->', err.message);
        process.exit(1);
    });
    req.end();
}

check();
