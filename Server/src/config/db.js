const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6 no longer requires useCreateIndex and useFindAndModify
      // useCreateIndex: true, 
      // useFindAndModify: false,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Optional: Listen for connection events
    mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);
        // Consider more robust error handling / process exit if critical
        // process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected!');
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB; 