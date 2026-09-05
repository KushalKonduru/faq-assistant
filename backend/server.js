import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeEmbedder } from './utils/embedding.js';
import documentsRouter from './routes/documents.js';
import queryRouter from './routes/query.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/documents', documentsRouter);
app.use('/api/query', queryRouter);

// Centralized Error Handling Middleware (must be registered after routes)
app.use(errorHandler);

// Initialize embedding model on startup
try {
  console.log('🚀 Initializing server and loading embedding model...');
  await initializeEmbedder();
  console.log('✅ Embedding model ready.');
} catch (error) {
  console.warn(
    '⚠️ Warning: Embedding model initialization deferred or encountered issue:',
    error.message
  );
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
