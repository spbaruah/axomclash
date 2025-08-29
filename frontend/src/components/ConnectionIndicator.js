import React, { useState } from 'react';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';

const IndicatorContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.isConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  opacity: ${props => props.isConnected ? 0.8 : 1};
  cursor: pointer;
  
  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.isConnected ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
    animation: ${props => props.isConnected ? 'pulse 2s infinite' : 'none'};
  }
  
  .status-text {
    white-space: nowrap;
  }
  
  .info-icon {
    width: 12px;
    height: 12px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    opacity: 0.7;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    padding: 6px 10px;
    font-size: 11px;
    
    .status-text {
      display: none;
    }
  }
`;

const Tooltip = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 1001;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  transform: translateY(${props => props.show ? '0' : '-10px'});
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 12px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid rgba(0, 0, 0, 0.9);
  }
`;

const ConnectionIndicator = () => {
  const { isConnected, socket } = useSocket();
  const [showTooltip, setShowTooltip] = useState(false);

  if (isConnected === null) {
    return null; // Don't show anything while initializing
  }

  const handleClick = () => {
    setShowTooltip(!showTooltip);
  };

  const getConnectionInfo = () => {
    if (!socket) return 'No socket instance';
    if (isConnected) {
      return `Connected (ID: ${socket.id?.substring(0, 8)}...)`;
    }
    return 'Disconnected';
  };

  return (
    <IndicatorContainer 
      isConnected={isConnected} 
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="status-dot" />
      <span className="status-text">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      <div className="info-icon">i</div>
      
      <Tooltip show={showTooltip}>
        {getConnectionInfo()}
      </Tooltip>
    </IndicatorContainer>
  );
};

export default ConnectionIndicator;
