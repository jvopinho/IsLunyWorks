'use client';

import React from 'react';
import styled from 'styled-components';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, LoadingPlaceholder } from './styles';
import { formatDateTime } from '@/utils/date';

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  max-height: 280px;
  overflow-y: auto;
  
  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 4px;
    width: 2px;
    height: calc(100% - 16px);
    background-color: ${(props) => props.theme.colors.border};
  }
`;

const TimelineItem = styled.div`
  position: relative;
  padding-bottom: 1.25rem;
  
  &:last-child {
    padding-bottom: 0;
  }
  
  .dot {
    position: absolute;
    left: -22px;
    top: 4px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: white;
    border: 3px solid ${(props) => props.theme.colors.primary};
    z-index: 1;
  }
  
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    
    span.action {
      font-size: ${(props) => props.theme.fontSizes.sm};
      font-weight: 600;
      color: ${(props) => props.theme.colors.text};
    }
    
    span.user {
      font-size: 0.75rem;
      color: ${(props) => props.theme.colors.textMuted};
    }
    
    span.time {
      font-size: 0.7rem;
      color: ${(props) => props.theme.colors.textMuted};
      font-weight: 500;
    }
  }
`;

interface Activity {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  createdAt: string;
}

interface ActivityTimelineProps {
  data?: Activity[];
  isLoading: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ data, isLoading }) => {
  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>📜 Atividade Recente</WidgetTitle>
        <WidgetSubtitle>Linha do tempo em tempo real das ações na plataforma (AuditLog)</WidgetSubtitle>
      </div>

      {isLoading || !data ? (
        <LoadingPlaceholder>Carregando linha do tempo...</LoadingPlaceholder>
      ) : (
        <Timeline>
          {data.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
              Nenhuma atividade registrada na plataforma.
            </div>
          ) : (
            data.map((item) => (
              <TimelineItem key={item.id}>
                <div className="dot" />
                <div className="content">
                  <span className="action">{item.action}</span>
                  <span className="user">por {item.userName} ({item.userEmail || 'sistema'})</span>
                  <span className="time">{formatDateTime(item.createdAt)}</span>
                </div>
              </TimelineItem>
            ))
          )}
        </Timeline>
      )}
    </WidgetContainer>
  );
};
