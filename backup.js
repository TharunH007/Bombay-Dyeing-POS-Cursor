const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let firebaseInitialized = false;
let db;

function initializeFirebase() {
  if (firebaseInitialized) return true;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.warn('Firebase credentials not found. Backup functionality disabled.');
      return false;
    }

    const credentials = JSON.parse(serviceAccount);
    
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      databaseURL: credentials.databaseURL || `https://${credentials.project_id}-default-rtdb.firebaseio.com`
    });

    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    return false;
  }
}

function getDatabase() {
  if (!db) {
    const dbPath = path.join(__dirname, 'pos.db');
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

async function backupToFirebase() {
  if (!initializeFirebase()) {
    throw new Error('Firebase not initialized. Please add FIREBASE_SERVICE_ACCOUNT to secrets.');
  }

  const database = getDatabase();
  const firebaseDb = admin.database();
  
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

    const backupRef = firebaseDb.ref('backups').push();
    await backupRef.set(backupData);

    const latestRef = firebaseDb.ref('latest-backup');
    await latestRef.set(backupData);

    console.log(`Backup completed successfully at ${timestamp}`);
    return { success: true, timestamp, backupId: backupRef.key };
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

async function restoreFromFirebase(backupId = null) {
  if (!initializeFirebase()) {
    throw new Error('Firebase not initialized. Please add FIREBASE_SERVICE_ACCOUNT to secrets.');
  }

  const database = getDatabase();
  const firebaseDb = admin.database();

  try {
    let backupData;
    
    if (backupId) {
      const snapshot = await firebaseDb.ref(`backups/${backupId}`).once('value');
      backupData = snapshot.val();
    } else {
      const snapshot = await firebaseDb.ref('latest-backup').once('value');
      backupData = snapshot.val();
    }

    if (!backupData) {
      throw new Error('No backup found');
    }

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

async function listBackups() {
  if (!initializeFirebase()) {
    throw new Error('Firebase not initialized. Please add FIREBASE_SERVICE_ACCOUNT to secrets.');
  }

  const firebaseDb = admin.database();
  
  try {
    const snapshot = await firebaseDb.ref('backups').orderByChild('timestamp').limitToLast(10).once('value');
    const backups = [];
    
    snapshot.forEach((childSnapshot) => {
      backups.push({
        id: childSnapshot.key,
        timestamp: childSnapshot.val().timestamp,
        version: childSnapshot.val().version
      });
    });

    return backups.reverse();
  } catch (error) {
    console.error('Failed to list backups:', error);
    throw error;
  }
}

module.exports = {
  backupToFirebase,
  restoreFromFirebase,
  listBackups,
  isFirebaseConfigured: () => firebaseInitialized || !!process.env.FIREBASE_SERVICE_ACCOUNT
};
