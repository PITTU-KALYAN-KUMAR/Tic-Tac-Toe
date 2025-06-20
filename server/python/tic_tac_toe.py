#!/usr/bin/env python3

import sys
import json
import random

class TicTacToe:
    def __init__(self):
        self.board = ['' for _ in range(9)]
        self.current_player = 'X'
        self.AI_MODE = 'equal_competition'  # Options: 'equal_competition', 'always_win'

    def new_game(self):
        self.board = ['' for _ in range(9)]
        self.current_player = 'X'
        return {
            'board': self.board,
            'current_player': self.current_player,
            'game_over': False,
            'winner': None,
            'message': 'New game started! You are X, make your move.'
        }

    def make_move(self, position):
        if self.board[position] == '':
            self.board[position] = self.current_player
            return {
                'board': self.board,
                'success': True,
                'message': f'Move made at position {position}'
            }
        return {
            'board': self.board,
            'success': False,
            'message': 'Position already taken'
        }

    def check_winner(self):
        winning_combinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Columns
            [0, 4, 8], [2, 4, 6]              # Diagonals
        ]
        for combo in winning_combinations:
            if self.board[combo[0]] == self.board[combo[1]] == self.board[combo[2]] != '':
                return self.board[combo[0]]
        return None

    def is_board_full(self):
        return '' not in self.board

    def get_empty_positions(self):
        return [i for i, cell in enumerate(self.board) if cell == '']

    def minimax(self, board, depth, is_maximizing, alpha=-float('inf'), beta=float('inf')):
        winner = self.check_winner()

        if winner == 'O':  # AI wins
            return 10 - depth
        elif winner == 'X':  # Human wins
            return depth - 10
        elif self.is_board_full():  # Tie
            return 0

        if is_maximizing:
            max_eval = -float('inf')
            for pos in self.get_empty_positions():
                self.board[pos] = 'O'
                eval_score = self.minimax(board, depth + 1, False, alpha, beta)
                self.board[pos] = ''
                max_eval = max(max_eval, eval_score)
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for pos in self.get_empty_positions():
                self.board[pos] = 'X'
                eval_score = self.minimax(board, depth + 1, True, alpha, beta)
                self.board[pos] = ''
                min_eval = min(min_eval, eval_score)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
            return min_eval

    def get_best_move(self):
        best_score = -float('inf')
        best_move = None

        for pos in self.get_empty_positions():
            self.board[pos] = 'O'  # AI's move
            score = self.minimax(self.board, 0, False)  # Minimax for human's turn
            self.board[pos] = ''  # Undo move

            if score > best_score:
                best_score = score
                best_move = pos

        return best_move

    def computer_move(self):
        empty_positions = self.get_empty_positions()
        if not empty_positions:
            return {
                'board': self.board,
                'success': False,
                'message': 'No moves available'
            }

        if self.AI_MODE == 'always_win':
            # Use minimax algorithm for intelligent AI
            best_move = self.get_best_move()
            if best_move is not None:
                self.board[best_move] = 'O'
                return {
                    'board': self.board,
                    'success': True,
                    'position': best_move,
                    'message': f'Computer moved to position {best_move}'
                }

        elif self.AI_MODE == 'equal_competition':
            # Use minimax selectively (70% chance) for equal competition
            if random.random() > 0.3:
                best_move = self.get_best_move()
                if best_move is not None:
                    self.board[best_move] = 'O'
                    return {
                        'board': self.board,
                        'success': True,
                        'position': best_move,
                        'message': f'Computer moved to position {best_move}'
                    }

        # Fallback to random move
        position = random.choice(empty_positions)
        self.board[position] = 'O'
        return {
            'board': self.board,
            'success': True,
            'position': position,
            'message': f'Computer moved to position {position}'
        }

    def check_game_status(self):
        winner = self.check_winner()
        game_over = winner is not None or self.is_board_full()
        message = (
            f"Game Over! {'You win!' if winner == 'X' else 'Computer wins!'}"
            if winner else
            "Game Over! It's a tie!" if self.is_board_full() else
            "Game in progress"
        )
        return {
            'board': self.board,
            'game_over': game_over,
            'winner': winner,
            'message': message
        }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Invalid arguments'}))
        return

    command = sys.argv[1]
    board_data = json.loads(sys.argv[2])

    game = TicTacToe()
    game.board = board_data

    if command == 'new_game':
        result = game.new_game()
    elif command == 'make_move':
        if len(sys.argv) < 4:
            print(json.dumps({'error': 'Position required for make_move'}))
            return
        position = int(sys.argv[3])
        result = game.make_move(position)
    elif command == 'computer_move':
        result = game.computer_move()
    elif command == 'check_game':
        result = game.check_game_status()
    else:
        result = {'error': 'Unknown command'}

    print(json.dumps(result))

if __name__ == '__main__':
    main()