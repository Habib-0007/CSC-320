// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// // import { connectDB } from "./config/db.js";
// import { errorHandler } from "./middleware/errorMiddleware.js";
// import authRoutes from "./routes/authRoutes.js";
// import documentRoutes from "./routes/documentRoutes.js";
// import questionRoutes from "./routes/questionRoutes.js";
// import ragRoutes from "./routes/ragRoutes.js";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cors());

// app.get("/", (req, res) => {
//   res.json({
//     status: "success",
//     statusCode: 200,
//     message: "API is working properly",
//     author: "Habib Adebayo",
//     date: new Date().getTime(),
//   });
// });

// app.get("/health", async (req, res) => {
//   try {
//     // Check the database connection state
//     const dbState = mongoose.connection.readyState;
//     const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
//     const dbStatus = states[dbState] || "Unknown";

//     if (dbState === 1) {
//       res.status(200).json({
//         status: "success",
//         message: "Database is connected",
//         dbStatus,
//       });
//     } else {
//       res.status(500).json({
//         status: "error",
//         message: "Database is not connected",
//         dbStatus,
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: "Failed to check database health",
//       error: error.message,
//     });
//   }
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/documents", documentRoutes);
// app.use("/api/questions", questionRoutes);
// app.use("/api/rag", ragRoutes);

// app.use(errorHandler);

// // app.listen(PORT, async () => {
// //   try {
// //     await connectDB();
// //     console.log(`Server running on port ${PORT}`);
// //   } catch (error) {
// //     console.error("Failed to connect to the database:", error);
// //     process.exit(1); // Exit the process with failure
// //   }
// // });

// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log("Connected to MongoDB");
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("MongoDB connection error:", err);
//     process.exit(1);
//   });

// export default app;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";

dotenv.config();

// Database connection caching for serverless environment
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log("Using cached database connection");
    return cachedDb;
  }

  console.log("Creating new database connection");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // These options help with serverless environments
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    cachedDb = mongoose.connection;

    // Handle connection events
    cachedDb.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      cachedDb = null;
    });

    cachedDb.on("disconnected", () => {
      console.log("MongoDB disconnected");
      cachedDb = null;
    });

    console.log("Connected to MongoDB");
    return cachedDb;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Root route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    statusCode: 200,
    message: "API is working properly",
    author: "Habib Adebayo",
    date: new Date().getTime(),
  });
});

// Health check route with DB connection status
app.get("/health", async (req, res) => {
  try {
    // Ensure database is connected
    await connectToDatabase();

    // Check the database connection state
    const dbState = mongoose.connection.readyState;
    const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
    const dbStatus = states[dbState] || "Unknown";

    if (dbState === 1) {
      res.status(200).json({
        status: "success",
        message: "Database is connected",
        dbStatus,
        cached: cachedDb !== null,
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Database is not connected",
        dbStatus,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to check database health",
      error: error.message,
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/rag", ragRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize the server depending on environment
const initializeServer = async () => {
  try {
    await connectToDatabase();

    // Only start listening if not in a serverless environment
    if (process.env.NODE_ENV !== "serverless") {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
};

// Start the server if not being imported (e.g. for tests)
if (process.env.NODE_ENV !== "test") {
  initializeServer();
}
