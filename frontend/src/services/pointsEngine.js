// Points Engine Service
// Handles real-time point calculations and updates

class PointsEngine {
  constructor() {
    this.pointsConfig = {
      // Post actions
      post_created: { user: 10, college: 10 },
      post_liked: { user: 1, college: 1 },
      post_commented: { user: 2, college: 2 },
      post_shared: { user: 3, college: 3 },
      
      // Challenge actions
      challenge_participated: { user: 25, college: 25 },
      challenge_completed: { user: 100, college: 100 },
      
      // Game actions
      game_won: { user: 500, college: 500 },
      game_participated: { user: 50, college: 50 },
      
      // Daily actions
      daily_login: { user: 5, college: 5 },
      streak_bonus: { user: 10, college: 10 }, // per day in streak
      
      // Special actions
      first_post: { user: 50, college: 50 },
      profile_completed: { user: 25, college: 25 },
      college_joined: { user: 100, college: 100 }
    };
  }

  // Calculate points for a specific action
  calculatePoints(actionType, multiplier = 1) {
    const config = this.pointsConfig[actionType];
    if (!config) {
      console.warn(`Unknown action type: ${actionType}`);
      return { user: 0, college: 0 };
    }

    return {
      user: config.user * multiplier,
      college: config.college * multiplier
    };
  }

  // Calculate streak bonus
  calculateStreakBonus(streakDays) {
    if (streakDays < 7) return 0;
    if (streakDays < 30) return 10;
    if (streakDays < 90) return 25;
    return 50; // 90+ days
  }

  // Calculate level based on total points
  calculateLevel(totalPoints) {
    if (totalPoints < 100) return 1;
    if (totalPoints < 500) return 2;
    if (totalPoints < 1000) return 3;
    if (totalPoints < 2500) return 4;
    if (totalPoints < 5000) return 5;
    if (totalPoints < 10000) return 6;
    if (totalPoints < 25000) return 7;
    if (totalPoints < 50000) return 8;
    if (totalPoints < 100000) return 9;
    return 10; // Max level
  }

  // Calculate points needed for next level
  calculatePointsToNextLevel(currentLevel, currentPoints) {
    const levelThresholds = [0, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    const nextLevel = currentLevel + 1;
    
    if (nextLevel > 10) return 0;
    
    const nextThreshold = levelThresholds[nextLevel];
    return Math.max(0, nextThreshold - currentPoints);
  }

  // Calculate college rank based on total points
  calculateCollegeRank(colleges) {
    return colleges
      .map(college => ({
        ...college,
        rank: 0 // Will be calculated below
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((college, index) => ({
        ...college,
        rank: index + 1
      }));
  }

  // Calculate points needed to beat next college
  calculatePointsToNextCollege(currentRank, colleges) {
    if (currentRank <= 1) return 0;
    
    const currentCollege = colleges.find(c => c.rank === currentRank);
    const nextCollege = colleges.find(c => c.rank === currentRank - 1);
    
    if (!currentCollege || !nextCollege) return 0;
    
    return Math.max(0, nextCollege.total_points - currentCollege.total_points);
  }

  // Format points with appropriate suffixes
  formatPoints(points) {
    if (points >= 1000000) {
      return (points / 1000000).toFixed(1) + 'M';
    } else if (points >= 1000) {
      return (points / 1000).toFixed(1) + 'K';
    }
    return points.toString();
  }

  // Get achievement based on points
  getAchievement(totalPoints) {
    if (totalPoints >= 100000) return { name: 'Legend', icon: '👑', color: '#FFD700' };
    if (totalPoints >= 50000) return { name: 'Master', icon: '⭐', color: '#C0C0C0' };
    if (totalPoints >= 25000) return { name: 'Expert', icon: '💎', color: '#CD7F32' };
    if (totalPoints >= 10000) return { name: 'Veteran', icon: '🔥', color: '#FF6B6B' };
    if (totalPoints >= 5000) return { name: 'Advanced', icon: '🚀', color: '#4ECDC4' };
    if (totalPoints >= 1000) return { name: 'Intermediate', icon: '⚡', color: '#45B7D1' };
    if (totalPoints >= 100) return { name: 'Beginner', icon: '🌱', color: '#96CEB4' };
    return { name: 'Newcomer', icon: '🌟', color: '#FFEAA7' };
  }

  // Calculate daily goal progress
  calculateDailyGoalProgress(dailyPoints, dailyGoal = 100) {
    const progress = Math.min(100, (dailyPoints / dailyGoal) * 100);
    const remaining = Math.max(0, dailyGoal - dailyPoints);
    
    return {
      progress: Math.round(progress),
      remaining,
      completed: progress >= 100
    };
  }

  // Calculate weekly goal progress
  calculateWeeklyGoalProgress(weeklyPoints, weeklyGoal = 500) {
    const progress = Math.min(100, (weeklyPoints / weeklyGoal) * 100);
    const remaining = Math.max(0, weeklyGoal - weeklyPoints);
    
    return {
      progress: Math.round(progress),
      remaining,
      completed: progress >= 100
    };
  }

  // Get points history summary
  getPointsHistorySummary(history) {
    const today = new Date().toDateString();
    const thisWeek = this.getWeekStart();
    const thisMonth = this.getMonthStart();

    return {
      today: history
        .filter(h => new Date(h.created_at).toDateString() === today)
        .reduce((sum, h) => sum + h.points_earned, 0),
      thisWeek: history
        .filter(h => new Date(h.created_at) >= thisWeek)
        .reduce((sum, h) => sum + h.points_earned, 0),
      thisMonth: history
        .filter(h => new Date(h.created_at) >= thisMonth)
        .reduce((sum, h) => sum + h.points_earned, 0),
      total: history.reduce((sum, h) => sum + h.points_earned, 0)
    };
  }

  // Helper methods for date calculations
  getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff));
  }

  getMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Validate points transaction
  validateTransaction(actionType, points, userId, collegeId) {
    if (!actionType || !this.pointsConfig[actionType]) {
      return { valid: false, error: 'Invalid action type' };
    }

    if (points < 0) {
      return { valid: false, error: 'Points cannot be negative' };
    }

    if (!userId || !collegeId) {
      return { valid: false, error: 'Missing user or college ID' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export default new PointsEngine();
