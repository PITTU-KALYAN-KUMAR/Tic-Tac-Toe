import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
// NOTE: If you're not using Skia, the confetti falls back to a pure-RN Animated approach below.
// This file uses the pure-RN approach so it works without extra native deps.

type Player = 'X' | 'O' | null;
type GameMode = 'PvP' | 'PvAI' | null;

// ─── Game logic (pure functions, no side effects) ────────────────────────────

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(squares: Player[]): Player {
  for (const [a, b, c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

function minimax(
  squares: Player[],
  isMaximizing: boolean,
  depth = 0,
  alpha = -Infinity,
  beta = Infinity,
): number {
  const winner = checkWinner(squares);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (squares.every(Boolean)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        best = Math.max(best, minimax(squares, false, depth + 1, alpha, beta));
        squares[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break; // α-β pruning – cuts unnecessary branches
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'X';
        best = Math.min(best, minimax(squares, true, depth + 1, alpha, beta));
        squares[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

function getBestMove(squares: Player[]): number {
  let bestScore = -Infinity;
  let move = -1;
  const board = [...squares]; // work on a copy; never mutate prop
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      const score = minimax(board, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

// ─── Lightweight confetti (pure RN Animated, no native lib needed) ────────────

const CONFETTI_COLORS = ['#FFD700', '#FF0055', '#00F0FF', '#39FF14', '#FF8C00', '#FFFFFF', '#9D00FF'];
const PARTICLE_COUNT = 55;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  shape: 'circle' | 'rect';
}

function useConfetti(originX: number, originY: number) {
  const particles = useRef<Particle[]>([]);
  const animsRef = useRef<Animated.CompositeAnimation | null>(null);
  const [visible, setVisible] = useState(false);

  // Build particles once
  if (particles.current.length === 0) {
    particles.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: new Animated.Value(originX),
      y: new Animated.Value(originY),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 7 + 5,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }));
  }

  const stop = useCallback(() => {
    animsRef.current?.stop();
    animsRef.current = null;
    particles.current.forEach(p => {
      p.x.setValue(originX);
      p.y.setValue(originY);
      p.opacity.setValue(0);
      p.rotate.setValue(0);
    });
    setVisible(false);
  }, [originX, originY]);

  const fire = useCallback(() => {
    stop();
    setVisible(true);

    const anims = particles.current.map((p, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
      const speed = 180 + Math.random() * 220;
      const targetX = originX + Math.cos(angle) * speed * (Math.random() * 1.5 + 0.5);
      const targetY = originY + Math.sin(angle) * speed * (Math.random() * 1.2 + 0.3) + 120;
      const duration = 900 + Math.random() * 700;

      p.x.setValue(originX);
      p.y.setValue(originY);
      p.opacity.setValue(1);
      p.rotate.setValue(0);

      return Animated.parallel([
        Animated.timing(p.x, { toValue: targetX, duration, useNativeDriver: true, easing: t => t }),
        Animated.timing(p.y, { toValue: targetY + 200, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: duration - 80, useNativeDriver: true }),
        ]),
        Animated.timing(p.rotate, { toValue: 6 + Math.random() * 10, duration, useNativeDriver: true }),
      ]);
    });

    animsRef.current = Animated.parallel(anims);
    animsRef.current.start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [originX, originY, stop]);

  return { particles: particles.current, visible, fire, stop };
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <GameContent />
    </SafeAreaProvider>
  );
}

// ─── Main game screen ─────────────────────────────────────────────────────────

function GameContent() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  // AI timer ref so we can cancel it immediately on reset
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confettiOriginX = width / 2;
  const confettiOriginY = height * 0.18;
  const { particles, visible: confettiVisible, fire: fireConfetti, stop: stopConfetti } = useConfetti(
    confettiOriginX,
    confettiOriginY,
  );

  // Derive these synchronously – no useState for them (avoids extra renders)
  const winner = checkWinner(board);
  const isDraw = !winner && board.every(Boolean);
  const gameOver = !!winner || isDraw;

  // ── AI move effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'PvAI' || isXNext || gameOver) return;

    aiTimerRef.current = setTimeout(() => {
      const move = getBestMove(board);
      if (move === -1) return;
      const newBoard = [...board];
      newBoard[move] = 'O';
      setBoard(newBoard);
      setIsXNext(true);
    }, 420); // just enough to feel intentional, not sluggish

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [isXNext, gameMode, board, gameOver]);

  // ── Confetti trigger ────────────────────────────────────────────────────────
  const prevWinnerRef = useRef<Player>(null);
  useEffect(() => {
    if (winner && winner !== prevWinnerRef.current) {
      prevWinnerRef.current = winner;
      // 120 ms lets the winning tile paint before the burst
      const t = setTimeout(fireConfetti, 120);
      return () => clearTimeout(t);
    }
    if (!winner) prevWinnerRef.current = null;
  }, [winner, fireConfetti]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePress = useCallback(
    (index: number) => {
      if (gameMode === 'PvAI' && !isXNext) return; // block during AI turn
      if (board[index] || gameOver) return;

      const newBoard = [...board];
      newBoard[index] = isXNext ? 'X' : 'O';
      setBoard(newBoard);
      setIsXNext(prev => !prev);
    },
    [board, gameMode, gameOver, isXNext],
  );

  const resetGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    stopConfetti(); // kill confetti immediately
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  }, [stopConfetti]);

  const quitToMenu = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    stopConfetti();
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameMode(null);
  }, [stopConfetti]);

  // ── Menu screen ──────────────────────────────────────────────────────────────
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

  // ── Status text ──────────────────────────────────────────────────────────────
  let statusText = `Next: ${isXNext ? 'X' : 'O'}`;
  let statusColor = isXNext ? '#FF0055' : '#00F0FF';
  if (winner) { statusText = `Winner: ${winner} 🎉`; statusColor = '#39FF14'; }
  else if (isDraw) { statusText = 'Draw!'; statusColor = '#FFEA00'; }
  else if (gameMode === 'PvAI' && !isXNext) { statusText = 'AI thinking…'; statusColor = '#9D00FF'; }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>Tic Tac Toe</Text>
      <Text style={[styles.status, { color: statusColor, textShadowColor: statusColor }]}>{statusText}</Text>

      <View style={styles.board}>
        {board.map((val, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.square, val === 'X' ? styles.xSquare : val === 'O' ? styles.oSquare : null]}
            onPress={() => handlePress(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.squareText, val === 'X' ? styles.xText : styles.oText]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={resetGame} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>Restart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.quitButton]} onPress={quitToMenu} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>Change Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Confetti overlay – absolutely positioned, pointer-events none */}
      {confettiVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((p, i) => {
            const rotateDeg = p.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            });
            const isCircle = p.shape === 'circle';
            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: isCircle ? p.size : p.size * 0.6,
                  borderRadius: isCircle ? p.size / 2 : 2,
                  backgroundColor: p.color,
                  opacity: p.opacity,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { rotate: rotateDeg },
                  ],
                  left: -p.size / 2, // center on origin
                  top: -p.size / 2,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Styles (unchanged from original) ────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 20,
    color: '#00F0FF',
    marginBottom: 40,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  modeButton: {
    width: '85%',
    backgroundColor: '#12121C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.6)',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  aiButton: {
    borderColor: 'rgba(255, 0, 85, 0.6)',
    shadowColor: '#FF0055',
  },
  modeButtonText: {
    color: '#F0F0F0',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  status: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  board: {
    width: 320,
    height: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#161625',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333344',
    elevation: 4,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  square: {
    width: '31%',
    height: '31%',
    backgroundColor: '#202030',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '3%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  xSquare: {
    backgroundColor: 'rgba(255, 0, 85, 0.1)',
    borderColor: '#FF0055',
  },
  oSquare: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: '#00F0FF',
  },
  squareText: {
    fontSize: 65,
    fontWeight: '900',
  },
  xText: {
    color: '#FF0055',
    textShadowColor: '#FF0055',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  oText: {
    color: '#00F0FF',
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 40,
    width: 320,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#12121C',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.6)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  quitButton: {
    borderColor: 'rgba(255, 234, 0, 0.6)',
    shadowColor: '#FFEA00',
  },
  actionButtonText: {
    color: '#F0F0F0',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});