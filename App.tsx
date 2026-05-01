import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type Player = 'X' | 'O' | null;
type GameMode = 'PvP' | 'PvAI' | null;

const checkWinner = (squares: Player[]): Player => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

const minimax = (squares: Player[], isMaximizing: boolean, depth: number = 0): number => {
  const winner = checkWinner(squares);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (squares.every((square) => square !== null)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        const score = minimax(squares, false, depth + 1);
        squares[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'X';
        const score = minimax(squares, true, depth + 1);
        squares[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
};

const getBestMove = (squares: Player[]): number => {
  let bestScore = -Infinity;
  let move = -1;
  const testSquares = [...squares];
  
  for (let i = 0; i < 9; i++) {
    if (!testSquares[i]) {
      testSquares[i] = 'O';
      const score = minimax(testSquares, false);
      testSquares[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
};

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <GameContent />
    </SafeAreaProvider>
  );
}

function GameContent() {
  const insets = useSafeAreaInsets();
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);

  useEffect(() => {
    if (gameMode === 'PvAI' && !isXNext) {
      const winner = checkWinner(board);
      const isDraw = !winner && board.every((square) => square !== null);
      
      if (!winner && !isDraw) {
        const timer = setTimeout(() => {
          const move = getBestMove(board);
          if (move !== -1) {
            const newBoard = [...board];
            newBoard[move] = 'O';
            setBoard(newBoard);
            setIsXNext(true);
          }
        }, 500); // 500ms delay to feel more natural
        return () => clearTimeout(timer);
      }
    }
  }, [isXNext, gameMode, board]);

  const handlePress = (index: number) => {
    // Block touch during AI turn
    if (gameMode === 'PvAI' && !isXNext) return;

    if (board[index] || checkWinner(board)) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const quitToMenu = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameMode(null);
  };

  if (gameMode === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>Tic Tac Toe</Text>
        <Text style={styles.subtitle}>Select Game Mode</Text>
        
        <TouchableOpacity style={styles.modeButton} onPress={() => setGameMode('PvP')} activeOpacity={0.8}>
          <Text style={styles.modeButtonText}>Human vs Human</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.modeButton, styles.aiButton]} onPress={() => setGameMode('PvAI')} activeOpacity={0.8}>
          <Text style={styles.modeButtonText}>Play with AI</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const winner = checkWinner(board);
  const isDraw = !winner && board.every((square) => square !== null);

  let statusText = `Next Player: ${isXNext ? 'X' : 'O'}`;
  let statusColor = '#555';
  if (winner) {
    statusText = `Winner: ${winner} 🎉`;
    statusColor = '#2E8B57';
  } else if (isDraw) {
    statusText = 'Draw!';
    statusColor = '#FF8C00';
  } else if (gameMode === 'PvAI' && !isXNext) {
    statusText = 'AI is thinking...';
    statusColor = '#4682B4';
  }

  const renderSquare = (index: number) => {
    const val = board[index];
    return (
      <TouchableOpacity
        key={index}
        style={[styles.square, val === 'X' ? styles.xSquare : val === 'O' ? styles.oSquare : null]}
        onPress={() => handlePress(index)}
        activeOpacity={0.7}
      >
        <Text style={[styles.squareText, val === 'X' ? styles.xText : styles.oText]}>
          {val}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>Tic Tac Toe</Text>
      <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
      
      <View style={styles.board}>
        {board.map((_, index) => renderSquare(index))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={resetGame} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>Restart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.quitButton]} onPress={quitToMenu} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>Change Mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 40,
    fontWeight: '500',
  },
  modeButton: {
    width: '80%',
    backgroundColor: '#4682B4',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  aiButton: {
    backgroundColor: '#FF6347',
  },
  modeButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
  },
  board: {
    width: 320,
    height: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    padding: 5,
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  square: {
    width: '32%',
    height: '32%',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2%',
    borderRadius: 8,
  },
  xSquare: {
    backgroundColor: '#FFF0F0',
  },
  oSquare: {
    backgroundColor: '#F0F8FF',
  },
  squareText: {
    fontSize: 60,
    fontWeight: 'bold',
  },
  xText: {
    color: '#FF6347',
  },
  oText: {
    color: '#4682B4',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 40,
    width: 320,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2E8B57',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  quitButton: {
    backgroundColor: '#555',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
