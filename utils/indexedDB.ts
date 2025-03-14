// Variable to hold the database promise
let dbPromise: Promise<IDBDatabase> | null = null;

// Centralized function to open the database
function getDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      // Open the database with version 2 to match or exceed the existing version
      const request = indexedDB.open("LinterHistory", 2);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Check if the "history" object store exists; create it if not
        if (!db.objectStoreNames.contains("history")) {
          db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
          console.log("Object store 'history' created in version:", db.version);
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log("Database opened:", db.name, "Version:", db.version, "Stores:", Array.from(db.objectStoreNames));
        resolve(db); // Resolve with the opened database
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error("Failed to open database:", error);
        reject("Database error: " + error);
      };
    });
  }
  return dbPromise;
}

export async function saveLintingHistory(code: string, errors: string[]) {
  try {
    const db = await getDatabase();
    const transaction = db.transaction("history", "readwrite");
    const store = transaction.objectStore("history");
    const addRequest = store.add({ code, errors, timestamp: Date.now() });

    return new Promise((resolve, reject) => {
      addRequest.onsuccess = () => {
        console.log("Linting history saved with ID:", addRequest.result);
        resolve("Saved!");
      };
      addRequest.onerror = () => {
        console.error("Error saving history:", addRequest.error);
        reject("Error saving history: " + addRequest.error);
      };
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
    throw error;
  }
}

export async function loadLintingHistory() {
  try {
    const db = await getDatabase();
    const transaction = db.transaction("history", "readonly");
    const store = transaction.objectStore("history");
    const allRecords = store.getAll();

    return new Promise((resolve, reject) => {
      allRecords.onsuccess = () => {
        console.log("Loaded linting history:", allRecords.result);
        resolve(allRecords.result);
      };
      allRecords.onerror = () => {
        console.error("Error loading history:", allRecords.error);
        reject("Error loading history: " + allRecords.error);
      };
    });
  } catch (error) {
    console.error("Failed to load from IndexedDB:", error);
    throw error;
  }
}

export async function deleteLintingHistory(id: number) {
  try {
    const db = await getDatabase();
    const transaction = db.transaction("history", "readwrite");
    const store = transaction.objectStore("history");
    const deleteRequest = store.delete(id);

    return new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        console.log("Linting history entry deleted, ID:", id);
        resolve("Deleted!");
      };
      deleteRequest.onerror = () => {
        console.error("Error deleting history:", deleteRequest.error);
        reject("Error deleting history: " + deleteRequest.error);
      };
    });
  } catch (error) {
    console.error("Failed to delete from IndexedDB:", error);
    throw error;
  }
}