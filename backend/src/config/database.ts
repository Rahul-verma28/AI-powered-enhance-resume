import mongoose from "mongoose";

let isConnected: boolean = false;

const connectDB = async (): Promise<void> => {
  mongoose.set("strictQuery", true);

  if (isConnected) {
    console.log("MongoDB is already connected");
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "resumeAI",
      family: 4, // Force IPv4 to fix querySrv ECONNREFUSED on Windows
    });

    isConnected = true;
    console.log("✅ MongoDB connected");

    // Drop the old strict unique email index if it exists
    // (We changed to sparse unique, but the old index may still be cached)
    try {
      const db = mongoose.connection.db;
      if (db) {
        const usersCollection = db.collection('users');
        const indexes = await usersCollection.indexes();
        const emailIndex = indexes.find(
          (idx: any) => idx.key?.email === 1 && idx.unique && !idx.sparse
        );
        if (emailIndex) {
          console.log('⚠️  Dropping old non-sparse email index...');
          await usersCollection.dropIndex(emailIndex.name!);
          console.log('✅ Old email index dropped');
        }
      }
    } catch (indexErr: any) {
      // Ignore — index may not exist or collection may not exist yet
      if (indexErr.codeName !== 'IndexNotFound' && indexErr.codeName !== 'NamespaceNotFound') {
        console.warn('Index migration warning:', indexErr.message);
      }
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

export default connectDB;
