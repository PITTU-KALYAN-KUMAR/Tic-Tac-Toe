import React, { useState } from 'react';
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
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);

  const checkWinner = (squares: Player[]) => {
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

  const handlePress = (index: number) => {
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

      <TouchableOpacity style={styles.resetButton} onPress={resetGame} activeOpacity={0.8}>
        <Text style={styles.resetButtonText}>Reset Game</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    letterSpacing: 1,
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
  resetButton: {
    marginTop: 40,
    backgroundColor: '#2E8B57',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
