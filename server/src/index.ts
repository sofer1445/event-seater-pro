import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import tablesRouter from './routes/tables';
import employeesRouter from './routes/employees';
import seatsRouter from './routes/seats';
import allocationsRouter from './routes/allocations';
import enhancedAllocationsRouter from './routes/enhancedAllocations';
import genericQueryRouter from './routes/generic-query';
import { testDatabaseQueries } from './database'; // Import the test function
import addConstraintViolationsTable from './db/migrations/add-constraint-violations-table';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// API Routes
app.use('/api/tables', tablesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/seats', seatsRouter);
app.use('/api/allocations', allocationsRouter);
app.use('/api/enhanced-allocations', enhancedAllocationsRouter);
app.use('/api/generic-query', genericQueryRouter);

// Start server
const port = process.env.PORT || 4001;
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Run migrations
  try {
    await addConstraintViolationsTable();
  } catch (error) {
    console.error('Error running migrations:', error);
  }
  
  // Test database queries after server starts
  setTimeout(() => {
    testDatabaseQueries();
  }, 2000);
});
