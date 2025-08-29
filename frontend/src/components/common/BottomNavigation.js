import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrophy, FaPlus, FaHome, FaGamepad, FaFire } from 'react-icons/fa';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home', isMain: false },
    { path: '/games', icon: FaGamepad, label: 'Games', isMain: false },
    { path: '/create-post', icon: FaPlus, label: 'Post', isMain: true },
    { path: '/leaderboard', icon: FaTrophy, label: 'Rankings', isMain: false },
    { path: '/challenges', icon: FaFire, label: 'Challenges', isMain: false }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path, e) => {
    e.preventDefault();
    
    // Special handling for create post button
    if (path === '/create-post') {
      // Navigate to create post route which will redirect to home and open modal
      navigate(path);
      return;
    }
    
    // Add page transition animation
    const currentPage = document.querySelector('.page-content');
    if (currentPage) {
      currentPage.style.animation = 'pageExit 0.3s ease-out forwards';
    }

    // Navigate after animation
    setTimeout(() => {
      navigate(path);
      // Reset animation for new page
      setTimeout(() => {
        if (currentPage) {
          currentPage.style.animation = 'pageEnter 0.3s ease-out forwards';
        }
      }, 100);
    }, 300);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.6
      }}
      className="bottom-navigation"
    >
      <div className="bottom-nav-container">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
            >
              <Link
                to={item.path}
                onClick={(e) => handleNavigation(item.path, e)}
                className={`bottom-nav-item ${active ? 'active' : ''} ${item.isMain ? 'main-action' : ''}`}
              >
                <motion.div
                  className={`nav-icon-wrapper ${item.isMain ? 'main-icon-wrapper' : ''}`}
                  whileHover={{ 
                    scale: item.isMain ? 1.08 : 1.15,
                    y: item.isMain ? -5 : -3,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  whileTap={{ 
                    scale: item.isMain ? 0.95 : 0.9,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  animate={active ? {
                    scale: 1.1,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  } : {}}
                >
                  <Icon className={`nav-icon ${item.isMain ? 'main-icon' : ''}`} />
                  {item.isMain && (
                    <motion.div 
                      className="main-button-glow"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.div>
                <motion.span 
                  className="nav-label"
                  animate={active ? {
                    y: -2,
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  } : {}}
                >
                  {item.label}
                </motion.span>
                
                {/* Active indicator */}
                {active && (
                  <motion.div
                    className="active-indicator"
                    layoutId="activeIndicator"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
