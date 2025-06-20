import { useState } from 'react';
import { Cpu, User, RotateCcw, Trophy, Zap } from 'lucide-react';

interface GameState {
  board: string[];
  current_player: string;
  game_over: boolean;
  winner: string | null;
  message: string;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(''),
    current_player: 'X',
    game_over: false,
    winner: null,
    message: 'Click "New Game" to start playing!'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    ties: 0
  });
  const [animatingCell, setAnimatingCell] = useState<number | null>(null);

  const API_BASE = 'http://localhost:3000/api';  const newGame = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/new-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      setGameState(result);
    } catch (error) {
      console.error('Error starting new game:', error);
      setGameState(prev => ({ ...prev, message: 'Error connecting to server. Please try again.' }));
    }
    setIsLoading(false);
  };

  const makeMove = async (position: number) => {
    if (gameState.board[position] !== '' || gameState.game_over || isLoading) return;
  
    setIsLoading(true);
    setAnimatingCell(position);
  
    try {
      const moveResponse = await fetch(`${API_BASE}/make-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: gameState.board, position })
      });
  
      if (!moveResponse.ok) {
        const errorData = await moveResponse.json();
        throw new Error(errorData.error || 'Failed to make move.');
      }
  
      const moveResult = await moveResponse.json();
  
      if (!moveResult.success) {
        setGameState(prev => ({ ...prev, message: moveResult.message }));
        setIsLoading(false);
        setAnimatingCell(null);
        return;
      }
  
      const statusResponse = await fetch(`${API_BASE}/check-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: moveResult.board })
      });
  
      const statusResult = await statusResponse.json();
  
      if (statusResult.game_over) {
        setGameState(statusResult);
        updateStats(statusResult.winner);
        setIsLoading(false);
        setAnimatingCell(null);
        return;
      }
  
      setTimeout(async () => {
        try {
          const computerResponse = await fetch(`${API_BASE}/computer-move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board: moveResult.board })
          });
  
          if (!computerResponse.ok) {
            const errorData = await computerResponse.json();
            throw new Error(errorData.error || 'Failed to make computer move.');
          }
  
          const computerResult = await computerResponse.json();
  
          if (computerResult.success) {
            setAnimatingCell(computerResult.position);
  
            const finalStatusResponse = await fetch(`${API_BASE}/check-game`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ board: computerResult.board })
            });
  
            const finalStatusResult = await finalStatusResponse.json();
  
            setGameState(finalStatusResult);
            if (finalStatusResult.game_over) {
              updateStats(finalStatusResult.winner);
            }
          }
        } catch (error) {
          console.error('Error with computer move:', error);
          setGameState(prev => ({ ...prev, message: 'Error with computer move. Please try again.' }));
        }
  
        setTimeout(() => {
          setAnimatingCell(null);
          setIsLoading(false);
        }, 300);
      }, 500);
    } catch (error) {
      console.error('Error making move:', error);
      setGameState(prev => ({ 
        ...prev, 
        message: error instanceof Error ? error.message : 'Error making move. Please try again.' 
      }));
      setIsLoading(false);
      setAnimatingCell(null);
    }
  };

  const updateStats = (winner: string | null) => {
    setStats(prev => ({
      ...prev,
      wins: winner === 'X' ? prev.wins + 1 : prev.wins,
      losses: winner === 'O' ? prev.losses + 1 : prev.losses,
      ties: winner === null ? prev.ties + 1 : prev.ties
    }));
  };

  const getCellContent = (index: number) => {
    const value = gameState.board[index];
    if (value === 'X') return <User className="w-8 h-8 text-cyan-400" />;
    if (value === 'O') return <Cpu className="w-8 h-8 text-pink-400" />;
    return null;
  };

  const getWinnerIcon = () => {
    if (gameState.winner === 'X') return <User className="w-6 h-6 text-cyan-400" />;
    if (gameState.winner === 'O') return <Cpu className="w-6 h-6 text-pink-400" />;
    return <Trophy className="w-6 h-6 text-yellow-400" />;
  };

  return (
    <div className="min-h-screen max-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-auto">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Tic Tac Toe
          </h1>
          <p className="text-slate-400 text-base sm:text-sm">Human vs AI • Python Powered</p>
        </div>

        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Stats Panel */}
          <div className="lg:order-1 space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-3 border border-slate-700">
              <h3 className="text-lg sm:text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Wins</span>
                  <span className="text-cyan-400 font-bold text-base">{stats.wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Losses</span>
                  <span className="text-pink-400 font-bold text-base">{stats.losses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Ties</span>
                  <span className="text-yellow-400 font-bold text-base">{stats.ties}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-3 border border-slate-700">
              <h3 className="text-lg sm:text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Players
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold text-sm">You (X)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-pink-400" />
                  <span className="text-pink-400 font-semibold text-sm">AI (O)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Board */}
          <div className="lg:order-2 flex flex-col items-center">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl p-6 sm:p-4 border border-slate-700 shadow-2xl">
              <div className="grid grid-cols-3 gap-3 sm:gap-2 w-72 sm:w-64 h-72 sm:h-64">
                {gameState.board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => makeMove(index)}
                    disabled={cell !== '' || gameState.game_over || isLoading}
                    className={`aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 
                      hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-300
                      flex items-center justify-center relative overflow-hidden
                      ${cell !== '' ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
                      ${animatingCell === index ? 'animate-pulse bg-gradient-to-br from-cyan-500/20 to-pink-500/20' : ''}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {getCellContent(index)}
                    {cell === '' && !gameState.game_over && (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={newGame}
              disabled={isLoading}
              className="mt-6 px-6 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 
                         text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                         flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              {isLoading ? 'Loading...' : 'New Game'}
            </button>
          </div>

          {/* Game Status */}
          <div className="lg:order-3 space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-3 border border-slate-700">
              <h3 className="text-lg sm:text-base font-semibold text-white mb-4">Game Status</h3>
              <div className="space-y-4">
                {gameState.game_over && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-600/50">
                    {getWinnerIcon()}
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {gameState.winner === 'X' ? 'You Win!' : 
                         gameState.winner === 'O' ? 'AI Wins!' : 'It\'s a Tie!'}
                      </p>
                      <p className="text-slate-400 text-xs">Game Over</p>
                    </div>
                  </div>
                )}
                
                <div className="text-slate-300 text-sm">
                  <p className="leading-relaxed">{gameState.message}</p>
                </div>

                {!gameState.game_over && !isLoading && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400">Your turn</span>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-400">AI turn</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;