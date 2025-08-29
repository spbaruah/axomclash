import React, { useState } from 'react';
import './TicTacToe.css';

const TicTacToe = ({ gameType, onBack }) => {
	const [board, setBoard] = useState(Array(9).fill(null));
	const [xIsNext, setXIsNext] = useState(true);
	const [winner, setWinner] = useState(null);

	const calculateWinner = (squares) => {
		const lines = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6]
		];
		for (let i = 0; i < lines.length; i++) {
			const [a, b, c] = lines[i];
			if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
				return squares[a];
			}
		}
		return null;
	};

	const handleClick = (index) => {
		if (board[index] || winner) return;
		const next = board.slice();
		next[index] = xIsNext ? 'X' : 'O';
		const maybeWinner = calculateWinner(next);
		setBoard(next);
		setXIsNext(!xIsNext);
		if (maybeWinner) setWinner(maybeWinner);
	};

	const resetGame = () => {
		setBoard(Array(9).fill(null));
		setXIsNext(true);
		setWinner(null);
	};

	return (
		<div className="game-board ttt-board">
			<div className="game-header">
				<button className="back-btn" onClick={onBack}>← Back to Games</button>
				<h2>{gameType?.name || 'Tic Tac Toe'}</h2>
				<div className="game-info">
					<span>{winner ? `Winner: ${winner}` : `Turn: ${xIsNext ? 'X' : 'O'}`}</span>
				</div>
			</div>

			<div className="ttt-container">
				<div className="ttt-grid">
					{board.map((cell, idx) => (
						<button key={idx} className={`ttt-cell ${cell ? 'filled' : ''}`} onClick={() => handleClick(idx)}>
							{cell}
						</button>
					))}
				</div>
				<div className="ttt-actions">
					<button className="reset-btn" onClick={resetGame}>Reset</button>
				</div>
			</div>
		</div>
	);
};

export default TicTacToe;


