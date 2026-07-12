'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { LayoutWrapper, MainContent, ContentWrapper, Backdrop } from './styles';

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem('sidebar_collapsed', String(newValue));
  };

  return (
    <LayoutWrapper>
      <Sidebar isOpen={isSidebarOpen} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      <Backdrop className={isSidebarOpen ? 'open' : ''} onClick={closeSidebar} />
      <MainContent collapsed={isCollapsed}>
        <Header title={title} onToggleSidebar={toggleSidebar} />
        <ContentWrapper>{children}</ContentWrapper>
      </MainContent>
    </LayoutWrapper>
  );
};
