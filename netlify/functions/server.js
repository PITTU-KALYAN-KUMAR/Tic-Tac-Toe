import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import serverless from 'serverless-http'; // Add this dependency

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors({
  origin: 'https://kkstic-tac-toe.vercel.app/' // Update with your frontend URL
}));
app.use(express.json());

// Helper function to run Python script
const runPython = (script, board, position = null) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [join(__dirname, '../tic_tac_toe.py'), script, JSON.stringify(board), position]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
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
  res.send('Backend is running!');
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
    if (typeof position !== 'number') {
      throw new Error('Invalid position value');
    }
    const result = await runPython('make_move', board, position.toString());
    res.json(result);
  } catch (error) {
    console.error('Error in /api/make-move:', error.message);
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

// Export the app as a serverless function
export const handler = serverless(app);