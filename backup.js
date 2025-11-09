const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

let db;

const BACKUP_DIR = path.join(__dirname, 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('Created backups directory');
  }
}

function getDatabase() {
  if (!db) {
    const dbPath = path.join(__dirname, 'pos.db');
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

async function backupToLocal() {
  ensureBackupDir();
  const database = getDatabase();
  
  try {
    const items = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM items', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const invoices = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM invoices', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const quotations = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM quotations', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      items,
      invoices,
      quotations,
      version: '1.0'
    };

    const filename = `backup_${timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    fs.writeFileSync(
      path.join(BACKUP_DIR, 'latest-backup.json'),
      JSON.stringify(backupData, null, 2)
    );

    cleanOldBackups();

    console.log(`Backup completed successfully at ${timestamp}`);
    return { success: true, timestamp, filename };
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

async function restoreFromLocal(filename = null) {
  const database = getDatabase();

  try {
    let filepath;
    
    if (filename) {
      filepath = path.join(BACKUP_DIR, filename);
    } else {
      filepath = path.join(BACKUP_DIR, 'latest-backup.json');
    }

    if (!fs.existsSync(filepath)) {
      throw new Error('No backup found');
    }

    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    await new Promise((resolve, reject) => {
      database.run('DELETE FROM items', [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      database.run('DELETE FROM invoices', [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      database.run('DELETE FROM quotations', [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const itemStmt = database.prepare('INSERT INTO items (id, name, price, gst) VALUES (?, ?, ?, ?)');
    for (const item of backupData.items) {
      await new Promise((resolve, reject) => {
        itemStmt.run([item.id, item.name, item.price, item.gst], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    itemStmt.finalize();

    const invoiceStmt = database.prepare('INSERT INTO invoices (id, customer_name, customer_mobile, customer_gst, items, subtotal, cgst, sgst, discount, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const invoice of backupData.invoices) {
      await new Promise((resolve, reject) => {
        invoiceStmt.run([
          invoice.id,
          invoice.customer_name,
          invoice.customer_mobile,
          invoice.customer_gst,
          invoice.items,
          invoice.subtotal,
          invoice.cgst,
          invoice.sgst,
          invoice.discount,
          invoice.total,
          invoice.created_at
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    invoiceStmt.finalize();

    const quotationStmt = database.prepare('INSERT INTO quotations (id, customer_name, customer_mobile, customer_gst, items, subtotal, cgst, sgst, discount, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const quotation of backupData.quotations) {
      await new Promise((resolve, reject) => {
        quotationStmt.run([
          quotation.id,
          quotation.customer_name,
          quotation.customer_mobile,
          quotation.customer_gst,
          quotation.items,
          quotation.subtotal,
          quotation.cgst,
          quotation.sgst,
          quotation.discount,
          quotation.total,
          quotation.created_at
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    quotationStmt.finalize();

    console.log(`Restore completed successfully from backup: ${backupData.timestamp}`);
    return { success: true, timestamp: backupData.timestamp };
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
}

function listBackups() {
  ensureBackupDir();
  
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        return {
          filename: file,
          timestamp: data.timestamp,
          size: stats.size,
          created: stats.mtime,
          version: data.version
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return files;
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      const filesToDelete = files.slice(30);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
}

function getLatestBackupInfo() {
  ensureBackupDir();
  
  try {
    const latestPath = path.join(BACKUP_DIR, 'latest-backup.json');
    if (fs.existsSync(latestPath)) {
      const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      return {
        timestamp: data.timestamp,
        itemsCount: data.items.length,
        invoicesCount: data.invoices.length,
        quotationsCount: data.quotations.length
      };
    }
  } catch (error) {
    console.error('Error reading latest backup info:', error);
  }
  
  return null;
}

module.exports = {
  backupToFirebase: backupToLocal,
  restoreFromFirebase: restoreFromLocal,
  listBackups,
  getLatestBackupInfo,
  isFirebaseConfigured: () => true
};
