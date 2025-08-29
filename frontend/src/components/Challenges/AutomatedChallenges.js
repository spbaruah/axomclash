import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AutomatedChallenges.css';

const AutomatedChallenges = () => {
  const [progress, setProgress] = useState({});
  const [dailyProgress, setDailyProgress] = useState({});
  const [weeklyProgress, setWeeklyProgress] = useState({});
  const [monthlyProgress, setMonthlyProgress] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    fetchProgress();
    fetchAchievements();
    fetchStreaks();
  }, []);

  const fetchProgress = async () => {
    try {
      const [progressRes, dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        axios.get('/api/automated-challenges/progress'),
        axios.get('/api/automated-challenges/progress/daily/' + new Date().toISOString().split('T')[0]),
        axios.get('/api/automated-challenges/progress/weekly'),
        axios.get('/api/automated-challenges/progress/monthly')
      ]);

      setProgress(progressRes.data.progress);
      setDailyProgress(dailyRes.data.dailyProgress);
      setWeeklyProgress(weeklyRes.data.weeklyProgress);
      setMonthlyProgress(monthlyRes.data.monthlyProgress);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await axios.get('/api/automated-challenges/achievements');
      setAchievements(response.data.achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchStreaks = async () => {
    try {
      const response = await axios.get('/api/automated-challenges/streaks');
      setStreaks(response.data.streaks);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  };

  const getChallengeIcon = (challengeType) => {
    const icons = {
      daily_login: '🌅',
      post_creation: '📝',
      post_like: '👍',
      post_comment: '💬',
      post_share: '📤',
      game_participation: '🎮',
      game_win: '🏆',
      profile_completion: '👤',
      college_join: '🏫',
      streak_bonus: '🔥',
      first_post: '⭐',
      weekly_activity: '📅',
      monthly_activity: '🗓️'
    };
    return icons[challengeType] || '🎯';
  };

  const getChallengeName = (challengeType) => {
    const names = {
      daily_login: 'Daily Login',
      post_creation: 'Post Creation',
      post_like: 'Post Like',
      post_comment: 'Post Comment',
      post_share: 'Post Share',
      game_participation: 'Game Participation',
      game_win: 'Game Win',
      profile_completion: 'Profile Completion',
      college_join: 'College Join',
      streak_bonus: 'Streak Bonus',
      first_post: 'First Post',
      weekly_activity: 'Weekly Activity',
      monthly_activity: 'Monthly Activity'
    };
    return names[challengeType] || challengeType;
  };

  const getProgressData = () => {
    switch (activeTab) {
      case 'daily':
        return dailyProgress;
      case 'weekly':
        return weeklyProgress;
      case 'monthly':
        return monthlyProgress;
      default:
        return dailyProgress;
    }
  };

  const formatPoints = (points) => {
    if (points >= 1000000) {
      return (points / 1000000).toFixed(1) + 'M';
    } else if (points >= 1000) {
      return (points / 1000).toFixed(1) + 'K';
    }
    return points.toString();
  };

  if (loading) {
    return (
      <div className="automated-challenges">
        <div className="loading">Loading challenges...</div>
      </div>
    );
  }

  const currentProgress = getProgressData();

  return (
    <div className="automated-challenges">
      <div className="challenges-header">
        <h2>🎯 Automated Challenges</h2>
        <p>Complete daily activities to earn points and climb the leaderboard!</p>
      </div>

      {/* Progress Tabs */}
      <div className="progress-tabs">
        <button 
          className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          📅 Daily
        </button>
        <button 
          className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          📊 Weekly
        </button>
        <button 
          className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          📈 Monthly
        </button>
      </div>

      {/* Progress Summary */}
      <div className="progress-summary">
        <div className="summary-card">
          <div className="summary-icon">🎯</div>
          <div className="summary-content">
            <h3>Total Points Today</h3>
            <p className="summary-value">{formatPoints(currentProgress.totalPoints || 0)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h3>Challenges Completed</h3>
            <p className="summary-value">
              {Object.keys(currentProgress.challenges || {}).length}
            </p>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="challenges-grid">
        {Object.entries(currentProgress.challenges || {}).map(([challengeType, data]) => (
          <div key={challengeType} className="challenge-card">
            <div className="challenge-icon">
              {getChallengeIcon(challengeType)}
            </div>
            <div className="challenge-content">
              <h4>{getChallengeName(challengeType)}</h4>
              <p className="challenge-stats">
                Completed: {data.completionCount} times
              </p>
              <p className="challenge-points">
                Points: {formatPoints(data.pointsEarned)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements Section */}
      <div className="achievements-section">
        <h3>🏆 Achievements</h3>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-icon">🏅</div>
              <div className="achievement-content">
                <h4>{achievement.achievement_name}</h4>
                <p>{achievement.description}</p>
                <p className="achievement-points">
                  +{formatPoints(achievement.points_rewarded)} points
                </p>
                <p className="achievement-date">
                  {new Date(achievement.achieved_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streaks Section */}
      <div className="streaks-section">
        <h3>🔥 Current Streaks</h3>
        <div className="streaks-grid">
          {streaks.map((streak) => (
            <div key={streak.challenge_type} className="streak-card">
              <div className="streak-icon">🔥</div>
              <div className="streak-content">
                <h4>{getChallengeName(streak.challenge_type)}</h4>
                <p className="streak-current">
                  Current: {streak.current_streak} days
                </p>
                <p className="streak-longest">
                  Longest: {streak.longest_streak} days
                </p>
                <p className="streak-last">
                  Last: {new Date(streak.last_completed_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Time Progress */}
      <div className="all-time-section">
        <h3>📊 All Time Progress</h3>
        <div className="all-time-grid">
          {Object.entries(progress).map(([challengeType, data]) => (
            <div key={challengeType} className="progress-card">
              <div className="progress-icon">
                {getChallengeIcon(challengeType)}
              </div>
              <div className="progress-content">
                <h4>{getChallengeName(challengeType)}</h4>
                <p className="progress-stats">
                  Total: {data.completionCount} times
                </p>
                <p className="progress-points">
                  Points: {formatPoints(data.totalPointsEarned)}
                </p>
                <p className="progress-last">
                  Last: {new Date(data.lastCompleted).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomatedChallenges;
