"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { StatsProvider } from "@/contexts/StatsContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load collapsed state from localStorage on mount
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', String(newCollapsed));
  };

  return (
    <StatsProvider>
      <div className="dashboard-root">
        {/* Mobile Nav */}
        <div className="mobile-nav d-lg-none d-flex align-items-center justify-content-between bg-dark p-4">
          <div>
            <Link href="/dashboard">
              <img src="/img/text-logo-new-3-lp.svg" className="brand-logo" alt="Copyfy" />
            </Link>
          </div>
          <div className="d-flex align-items-center">
            <button 
              className="btn p-0" 
              id="nav-btn"
              onClick={toggleSidebar}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21M3 6H21M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Shadow overlay */}
        {sidebarOpen && (
          <div 
            className="shadow-nav" 
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
            }}
          ></div>
        )}

        <div className={`bg-copyfy w-100 dashboard-bg ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
          <div className="d-flex dashboard-flex-container">
            {/* Section One - Sidebar */}
            <div 
              className={`section-one position-fixed pe-0 bg-copyfy ${sidebarOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
            >
              <Sidebar 
                onNavigate={() => setSidebarOpen(false)} 
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
              />
            </div>
            
            {/* Section Two - Main Content */}
            <div className="section-two">
              <div className="data-view bg-white border-1 rounded-15">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StatsProvider>
  );
}
