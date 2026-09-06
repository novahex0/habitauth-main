import db from '../backend/src/config/db.js';

const testApps = db.prepare("SELECT id, app_name FROM applications WHERE app_name LIKE 'TEST_%' OR app_name LIKE 'DIMUX%' OR app_name LIKE 'AuditApp%' OR app_name LIKE 'test%'").all();
for (const a of testApps) {
 db.prepare('DELETE FROM applications WHERE id = ?').run(a.id);
}
console.log('Cleaned ' + testApps.length + ' test apps.');

// Also clean orphan users/licenses
db.prepare('DELETE FROM application_users WHERE app_id NOT IN (SELECT id FROM applications)').run();
db.prepare('DELETE FROM licenses WHERE app_id NOT IN (SELECT id FROM applications)').run();
db.prepare('DELETE FROM devices WHERE app_id NOT IN (SELECT id FROM applications)').run();
db.prepare('DELETE FROM audit_logs WHERE app_id IS NOT NULL AND app_id NOT IN (SELECT id FROM applications)').run();

db.exec('VACUUM;');
db.exec('PRAGMA optimize;');
console.log('Database vacuumed and clean!');
