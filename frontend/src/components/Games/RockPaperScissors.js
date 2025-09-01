import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHandRock, FaHandPaper, FaHandScissors, FaPlay, FaUsers, FaUserFriends, FaRobot, FaArrowLeft, FaTrophy, FaStar, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';
import './RockPaperScissors.css';

const RockPaperScissors = ({ gameType, onBack }) => {
  const [gameMode, setGameMode] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [playerChoice, setPlayerChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [rounds, setRounds] = useState(0);
  const [maxRounds] = useState(5);
  const [gameHistory, setGameHistory] = useState([]);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentInfo, setOpponentInfo] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [isCountdown, setIsCountdown] = useState(false);
  
  const { userProfile } = useAuth();
  const { socket } = useSocket();
  const countdownRef = useRef(null);

  const choices = [
    { id: 'rock', icon: FaHandRock, name: 'Rock', beats: 'scissors' },
    { id: 'paper', icon: FaHandPaper, name: 'Paper', beats: 'rock' },
    { id: 'scissors', icon: FaHandScissors, name: 'Scissors', beats: 'paper' }
  ];

  useEffect(() => {
    if (socket) {
      socket.on('rpsGameStart', handleGameStart);
      socket.on('rpsOpponentChoice', handleOpponentChoice);
      socket.on('rpsGameResult', handleGameResult);
      socket.on('rpsOpponentJoined', handleOpponentJoined);
      socket.on('rpsGameEnd', handleGameEnd);
    }

    return () => {
      if (socket) {
        socket.off('rpsGameStart');
        socket.off('rpsOpponentChoice');
        socket.off('rpsGameResult');
        socket.off('rpsOpponentJoined');
        socket.off('rpsGameEnd');
      }
    };
  }, [socket]);

  const handleGameStart = (data) => {
    const playersInRoom = data?.room?.players || [];
    if (playersInRoom.length >= 2 && userProfile?.id) {
      const opponent = playersInRoom.find(p => p.userId !== userProfile.id);
      if (opponent) {
        setOpponentInfo({ name: opponent.username || 'Opponent', avatar: opponent.avatar || null, userId: opponent.userId });
      }
    }
    setGameState('playing');
    setWaitingForOpponent(false);
    startCountdown();
  };

  const handleOpponentChoice = (data) => {
    setOpponentChoice(data.choice);
    setWaitingForOpponent(false);
  };

  const handleGameResult = (data) => {
    try {
      const myUserId = userProfile?.id;
      // Determine opponent user id from opponentInfo or data.choices
      let oppUserId = opponentInfo?.userId || null;
      if (!oppUserId && Array.isArray(data.choices)) {
        const ids = data.choices.map(c => c.userId);
        oppUserId = ids.find(id => id !== myUserId) || null;
      }

      // Map server score keyed by userId to local player/opponent
      if (data.score && myUserId && oppUserId) {
        const myScore = data.score[myUserId] || 0;
        const oppScore = data.score[oppUserId] || 0;
        setScore({ player: myScore, opponent: oppScore });
      }

      // Extract choices and set display
      if (Array.isArray(data.choices)) {
        const myChoiceId = data.choices.find(c => c.userId === myUserId)?.choice || null;
        const oppChoiceId = data.choices.find(c => c.userId === oppUserId)?.choice || null;
        const myChoiceObj = myChoiceId ? choices.find(c => c.id === myChoiceId) : null;
        const oppChoiceObj = oppChoiceId ? choices.find(c => c.id === oppChoiceId) : null;
        if (myChoiceObj) setPlayerChoice(myChoiceObj);
        if (oppChoiceObj) setOpponentChoice(oppChoiceObj);

        // Append to local round history in UI-friendly format
        if (myChoiceId && oppChoiceId) {
          const myOutcome = data.outcomeByUser && myUserId ? data.outcomeByUser[myUserId] : null;
          const outcome = myOutcome || 'tie';
          setGameHistory(prev => [...prev, {
            round: data.rounds,
            result: outcome,
            playerChoice: myChoiceId,
            opponentChoice: oppChoiceId
          }]);
          setGameResult(outcome);
        }
      }

      setRounds(data.rounds);
      setWaitingForOpponent(false);

      setTimeout(() => {
        setPlayerChoice(null);
        setOpponentChoice(null);
        setGameResult(null);
        if (data.isGameFinished || data.rounds >= maxRounds) {
          setGameState('finished');
        } else {
          setGameState('waiting');
          startCountdown();
        }
      }, 3000);
    } catch (e) {
      console.error('Error handling RPS game result:', e);
    }
  };

  const handleOpponentJoined = (data) => {
    const playersInRoom = data?.room?.players || [];
    if (playersInRoom.length >= 2 && userProfile?.id) {
      const opponent = playersInRoom.find(p => p.userId !== userProfile.id);
      if (opponent) {
        setOpponentInfo({ name: opponent.username || 'Opponent', avatar: opponent.avatar || null, userId: opponent.userId });
      }
      setWaitingForOpponent(false);
      setGameState('waiting');
      startCountdown();
    } else {
      setWaitingForOpponent(true);
    }
  };

  const handleGameEnd = (data) => {
    try {
      const myUserId = userProfile?.id;
      const oppUserId = opponentInfo?.userId || null;
      if (data.finalScore && myUserId && oppUserId) {
        setScore({
          player: data.finalScore[myUserId] || 0,
          opponent: data.finalScore[oppUserId] || 0
        });
      }
      // Keep the locally built UI-friendly history
      setGameState('finished');
    } catch (e) {
      console.error('Error handling RPS game end:', e);
      setGameState('finished');
    }
  };

  const startCountdown = () => {
    console.log('Starting countdown, current gameState:', gameState);
    setIsCountdown(true);
    setCountdown(3);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          console.log('Countdown ended, setting gameState to playing');
          setIsCountdown(false);
          clearInterval(countdownRef.current);
          // Always set game state to playing when countdown ends
          setGameState('playing');
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const selectGameMode = (mode) => {
    setGameMode(mode);
    if (mode === 'ai') {
      setGameState('waiting'); // Start with waiting state, then countdown will transition to playing
      setOpponentInfo({ name: 'AI Opponent', avatar: null });
      startCountdown();
    } else if (mode === 'friend') {
      // Join matchmaking (auto pair with another player)
      if (socket) {
        socket.emit('rpsJoinMatchmaking', { userId: userProfile.id, collegeId: userProfile.college_id });
        setWaitingForOpponent(true);
      }
    }
  };

  const makeChoice = (choice) => {
    console.log('makeChoice called with:', choice.id, 'gameState:', gameState, 'isCountdown:', isCountdown);
    if ((gameState !== 'playing' && gameState !== 'waiting') || isCountdown) {
      console.log('Choice blocked - gameState:', gameState, 'isCountdown:', isCountdown);
      return;
    }
    
    setPlayerChoice(choice);
    setWaitingForOpponent(true);

    if (gameMode === 'ai') {
      // AI opponent makes random choice
      setTimeout(() => {
        const aiChoice = choices[Math.floor(Math.random() * choices.length)];
        setOpponentChoice(aiChoice);
        setWaitingForOpponent(false);
        
        // Calculate result
        const result = calculateResult(choice, aiChoice);
        setGameHistory(prev => [...prev, { round: rounds + 1, result, playerChoice: choice.id, opponentChoice: aiChoice.id }]);
        updateScore(result);
        setGameResult(result);
        
        setTimeout(() => {
          setPlayerChoice(null);
          setOpponentChoice(null);
          setGameResult(null);
          if (rounds < maxRounds - 1) {
            const nextRound = rounds + 1;
            console.log('Moving to next round:', nextRound);
            setRounds(nextRound);
            setGameState('waiting');
            setWaitingForOpponent(false); // Ensure waiting state is reset for next round
            // Start countdown immediately for next round
            startCountdown();
          } else {
            console.log('Game finished, all rounds completed');
            setGameState('finished');
          }
        }, 3000);
      }, 1000);
    } else {
      // Multiplayer - emit choice to opponent
      if (socket) {
        socket.emit('rpsMakeChoice', { choice, userId: userProfile.id });
      }
    }
  };

  const calculateResult = (playerChoice, opponentChoice) => {
    if (playerChoice.id === opponentChoice.id) {
      return 'tie';
    } else if (playerChoice.beats === opponentChoice.id) {
      return 'win';
    } else {
      return 'lose';
    }
  };

  const updateScore = (result) => {
    setScore(prev => {
      if (result === 'win') {
        return { ...prev, player: prev.player + 1 };
      } else if (result === 'lose') {
        return { ...prev, opponent: prev.opponent + 1 };
      }
      return prev;
    });
  };

  const resetGame = () => {
    setGameState('waiting');
    setPlayerChoice(null);
    setOpponentChoice(null);
    setGameResult(null);
    setScore({ player: 0, opponent: 0 });
    setRounds(0);
    setGameHistory([]);
    setWaitingForOpponent(false);
    setOpponentInfo(null);
    setIsCountdown(false);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  };

  const startNewMatchmaking = () => {
    // Reset all game state
    resetGame();
    // Start new matchmaking
    if (socket && userProfile) {
      socket.emit('rpsJoinMatchmaking', { userId: userProfile.id, collegeId: userProfile.college_id });
      setWaitingForOpponent(true);
      setGameState('waiting');
    }
  };

  const getResultMessage = (result) => {
    switch (result) {
      case 'win': return 'You Win! 🎉';
      case 'lose': return 'You Lose! 😔';
      case 'tie': return 'It\'s a Tie! 🤝';
      default: return '';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'win': return '#4CAF50';
      case 'lose': return '#F44336';
      case 'tie': return '#FF9800';
      default: return '#666';
    }
  };

  if (!gameMode) {
    return (
      <div className="rps-container">
        <div className="rps-header">
          <button className="back-btn" onClick={onBack}>
            <FaArrowLeft /> Back to Games
          </button>
          <h1>🎯 Rock Paper Scissors</h1>
          <p>Choose your game mode and start playing!</p>
        </div>

        <div className="game-modes">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mode-card ai-mode"
            onClick={() => selectGameMode('ai')}
          >
            <div className="mode-icon">
              <FaRobot size={40} />
            </div>
            <h3>Play vs AI</h3>
            <p>Challenge our AI opponent in a quick 5-round battle</p>
            <div className="mode-features">
              <span><FaStar /> Instant Play</span>
              <span><FaTrophy /> Practice Mode</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mode-card friend-mode"
            onClick={() => selectGameMode('friend')}
          >
            <div className="mode-icon">
              <FaUserFriends size={40} />
            </div>
            <h3>Play with Friend</h3>
            <p>Auto-match with another player from the lobby</p>
            <div className="mode-features">
              <span><FaUsers /> 2 Players</span>
              <span><FaTrophy /> Quick Match</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const winner = score.player > score.opponent ? 'You' : 
                   score.player < score.opponent ? 'Opponent' : 'Tie';
    
    return (
      <div className="rps-container">
        <div className="rps-header">
          <button className="back-btn" onClick={onBack}>
            <FaArrowLeft /> Back to Games
          </button>
          <h1>🏆 Game Over!</h1>
        </div>

        <div className="game-result-final">
          <div className="final-score">
            <h2>Final Score</h2>
            <div className="score-display">
              <div className="player-score">
                <span className="player-name">You</span>
                <span className="score-value">{score.player}</span>
              </div>
              <div className="vs-separator">VS</div>
              <div className="opponent-score">
                <span className="opponent-name">{opponentInfo?.name || 'Opponent'}</span>
                <span className="score-value">{score.opponent}</span>
              </div>
            </div>
            <div className="winner-announcement">
              {winner === 'Tie' ? 'It\'s a Tie! 🤝' : `${winner} Won! 🎉`}
            </div>
          </div>

          <div className="game-history">
            <h3>Round History</h3>
            <div className="history-list">
              {gameHistory.map((round, index) => (
                <div key={index} className="history-item">
                  <span className="round-number">Round {index + 1}</span>
                  <span className={`round-result ${round.result}`}>
                    {round.result === 'win' ? 'W' : round.result === 'lose' ? 'L' : 'T'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="game-actions">
            {gameMode === 'friend' ? (
              <>
                <button className="play-again-btn" onClick={startNewMatchmaking}>
                  <FaPlay /> Play Again
                </button>
                <button className="back-to-games-btn" onClick={onBack}>
                  <FaArrowLeft /> Back to Games
                </button>
              </>
            ) : (
              <>
                <button className="play-again-btn" onClick={resetGame}>
                  <FaPlay /> Play Again
                </button>
                <button className="new-game-btn" onClick={() => setGameMode(null)}>
                  New Game
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rps-container">
      <div className="rps-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft /> Back to Games
        </button>
        <h1>🎯 Rock Paper Scissors</h1>
        <div className="game-info">
          <span className="mode-badge">{gameMode === 'ai' ? 'AI Mode' : 'Multiplayer'}</span>
          <span className="round-counter">Round {rounds + 1}/{maxRounds}</span>
        </div>
      </div>

      {waitingForOpponent && gameMode !== 'ai' && (
        <div className="waiting-opponent">
          <FaSpinner className="spinning" />
          <p>Waiting for opponent to join...</p>
        </div>
      )}

      {isCountdown && (
        <div className="countdown-overlay">
          <div className="countdown-number">{countdown}</div>
          <p>Get Ready!</p>
        </div>
      )}

      <div className="game-board">
        <div className="score-board">
          <div className="player-info">
            <div className="avatar">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="You" />
              ) : (
                <div className="default-avatar">You</div>
              )}
            </div>
            <span className="player-name">You</span>
            <span className="player-score">{score.player}</span>
          </div>

          <div className="vs-separator">VS</div>

          <div className="opponent-info">
            <div className="avatar">
              {opponentInfo?.avatar ? (
                <img src={opponentInfo.avatar} alt="Opponent" />
              ) : (
                <div className="default-avatar">
                  {opponentInfo?.name?.charAt(0) || 'O'}
                </div>
              )}
            </div>
            <span className="opponent-name">{opponentInfo?.name || 'Opponent'}</span>
            <span className="opponent-score">{score.opponent}</span>
          </div>
        </div>

        <div className="game-area">
          {gameState === 'waiting' && !isCountdown && (
            <div className="waiting-message">
              <p>Choose your move when the countdown starts!</p>
            </div>
          )}

          {(gameState === 'playing' || (gameState === 'waiting' && isCountdown)) && !playerChoice && (
            <div className="choices-container">
              <h3>Choose Your Move</h3>
              <div className="choices-grid">
                {choices.map((choice) => (
                  <motion.button
                    key={choice.id}
                    className={`choice-btn ${playerChoice?.id === choice.id ? 'selected' : ''}`}
                    onClick={() => makeChoice(choice)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={playerChoice !== null}
                  >
                    <choice.icon size={40} />
                    <span>{choice.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {waitingForOpponent && gameMode === 'ai' && (
            <div className="waiting-message">
              <p>AI is thinking...</p>
            </div>
          )}

          {playerChoice && opponentChoice && (
            <div className="battle-result">
              <div className="choices-display">
                <div className="player-choice">
                  <div className="choice-icon">
                    {choices.find(c => c.id === playerChoice.id)?.icon && 
                      React.createElement(choices.find(c => c.id === playerChoice.id).icon, { size: 60 })
                    }
                  </div>
                  <span>Your Choice</span>
                </div>

                <div className="result-display">
                  <div className="result-message" style={{ color: getResultColor(gameResult) }}>
                    {getResultMessage(gameResult)}
                  </div>
                </div>

                <div className="opponent-choice">
                  <div className="choice-icon">
                    {choices.find(c => c.id === opponentChoice.id)?.icon && 
                      React.createElement(choices.find(c => c.id === opponentChoice.id).icon, { size: 60 })
                    }
                  </div>
                  <span>Opponent's Choice</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RockPaperScissors;
