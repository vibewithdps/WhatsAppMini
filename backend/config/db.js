import mongoose from 'mongoose';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }

    // Fallback to in-memory MongoDB for instant zero-configuration development
    console.log('[Database] MONGODB_URI not found or empty. Initializing MongoMemoryServer...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();
    
    const conn = await mongoose.connect(uri);
    console.log(`[Database] In-Memory MongoDB Server Connected successfully at: ${uri}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Direct MongoDB connection failed (${error.message}). Attempting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[Database] In-Memory MongoDB Server Connected successfully at: ${uri}`);
      return conn;
    } catch (fallbackError) {
      console.error(`[Database] Fatal Error connecting to MongoDB: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

export const closeDB = async () => {
  await mongoose.connection.close();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
