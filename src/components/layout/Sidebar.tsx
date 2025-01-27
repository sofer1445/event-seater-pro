import React from 'react';
import { Link } from 'react-router-dom';

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white shadow-lg">
      <div className="flex h-full flex-col justify-between">
        <div className="flex-1 px-3 py-4">
          <div className="mb-8 px-4">
            <h2 className="text-lg font-semibold">ניהול מקומות ישיבה</h2>
          </div>
          
          <nav className="space-y-1">
            <Link to="/dashboard" className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
              <span className="ml-3">דשבורד</span>
            </Link>
            
            <Link to="/employees" className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
              <span className="ml-3">ניהול עובדים</span>
            </Link>
            
            <Link to="/workspaces" className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
              <span className="ml-3">מפת משרד</span>
            </Link>
            
            <Link to="/allocations" className="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
              <span className="ml-3">הקצאות מקומות</span>
            </Link>
          </nav>
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">שם המנהל</p>
              <p className="text-xs text-gray-500">מנהל מערכת</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
