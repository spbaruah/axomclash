import React, { useState, useEffect } from 'react';
import './GameManagement.css';
import adminApi from '../../services/adminAxios';

const GameManagement = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await adminApi.get('/api/admin/games');
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
      // Mock data for demo
      setGames([
        {
          id: 1,
          name: 'Ludo Tournament',
          type: 'ludo',
          status: 'active',
          participants: 8,
          college1: 'Cotton University',
          college2: 'Gauhati University'
        },
        {
          id: 2,
          name: 'Quiz Battle',
          type: 'quiz',
          status: 'completed',
          participants: 24,
          college1: 'Tezpur University',
          college2: 'IIT Guwahati'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="game-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="game-management">
      <div className="management-header">
        <h2>Game Management</h2>
        <p>Monitor and manage ongoing games and tournaments</p>
      </div>

      <div className="games-list">
        {games.map((game) => (
          <div key={game.id} className="game-item">
            <div className="game-header">
              <h3>{game.name}</h3>
              <span className={`status ${game.status}`}>{game.status}</span>
            </div>
            <div className="game-info">
              <p><strong>Type:</strong> {game.type}</p>
              <p><strong>Participants:</strong> {game.participants}</p>
              <p><strong>Teams:</strong> {game.college1} vs {game.college2}</p>
            </div>
            <div className="game-actions">
              <button className="action-btn view">👁️ View</button>
              <button className="action-btn edit">✏️ Edit</button>
              <button className="action-btn delete">🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameManagement;
