import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware to parse JSON payloads
app.use(express.json());

// Update CORS to allow requests from the local React-Vite frontend
const allowedOrigins = (process.env.FRONTEND_ORIGINS)
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, '')) // Remove trailing slashes
  .filter(Boolean); // Remove empty strings

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow server-to-server
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,
}));

/*
app.use(cors({
  origin: 'http://localhost:5173', // Update with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
  credentials: true,
}));

app.options('*', cors());
*/
// Helper function to run Python script
const runPython = (script, board, position = null) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [join(__dirname, 'python/tic_tac_toe.py'), script, JSON.stringify(board), position]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
      console.error('Python script error:', error); // Log Python script errors
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(result.trim()));
        } catch (e) {
          console.error('Invalid JSON response:', result.trim());
          reject(new Error('Invalid JSON response from Python'));
        }
      } else {
        reject(new Error(error || 'Python script failed'));
      }
    });
  });
};

// API Routes
app.get('/', (req, res) => {
  res.send('Backend is running locally!');
});

app.post('/api/new-game', async (req, res) => {
  try {
    const result = await runPython('new_game', []);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/new-game:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/make-move', async (req, res) => {
  try {
    const { board, position } = req.body;
    console.log('Received board:', board); // Log the incoming board
    console.log('Received position:', position); // Log the incoming position

    if (!Array.isArray(board)) {
      throw new Error('Invalid board format. Expected an array.');
    }

    if (typeof position !== 'number') {
      throw new Error('Invalid position value. Expected a number.');
    }

    const result = await runPython('make_move', board, position.toString());
    console.log('Result from Python script:', result); // Log the result from the Python script
    res.json(result);
  } catch (error) {
    console.error('Error in /api/make-move:', error.message);
    console.error('Stack trace:', error.stack); // Log the stack trace for debugging
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/computer-move', async (req, res) => {
  try {
    const { board } = req.body;
    const result = await runPython('computer_move', board);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/computer-move:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/check-game', async (req, res) => {
  try {
    const { board } = req.body;
    const result = await runPython('check_game', board);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/check-game:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server locally

const PORT = process.env.PORT || 3000; // Replace with your desired port number
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});