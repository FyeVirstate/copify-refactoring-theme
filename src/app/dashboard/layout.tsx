"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('Sidebar open state:', sidebarOpen);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    console.log('Toggle sidebar clicked');
    setSidebarOpen(!sidebarOpen);
  };

  return (
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
            zIndex: 10, // Lower than sidebar (11) and dropdown (999999)
          }}
        ></div>
      )}

      <div className="bg-copyfy w-100 dashboard-bg">
        <div className="d-flex dashboard-flex-container">
          {/* Section One - Sidebar */}
          <div 
            className={`section-one position-fixed pe-0 bg-copyfy ${sidebarOpen ? 'mobile-open' : ''}`}
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
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
  );
}
