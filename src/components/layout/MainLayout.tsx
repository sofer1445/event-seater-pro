import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { TableList } from '@/components/tables/TableList';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Allocations from '@/pages/Allocations';
import EmployeeConstraints from '@/pages/EmployeeConstraints';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            מערכת סידור ישיבה
          </h1>
          <nav className="mt-4">
            <ul className="flex space-x-8 rtl:space-x-reverse">
              <li>
                <Link to="/" className="text-blue-600 hover:text-blue-800">דשבורד</Link>
              </li>
              <li>
                <Link to="/employees" className="text-blue-600 hover:text-blue-800">ניהול עובדים</Link>
              </li>
              <li>
                <Link to="/tables" className="text-blue-600 hover:text-blue-800">ניהול שולחנות</Link>
              </li>
              <li>
                <Link to="/allocations" className="text-blue-600 hover:text-blue-800">סידור ישיבה</Link>
              </li>
              <li>
                <Link to="/employee-constraints" className="text-blue-600 hover:text-blue-800">אילוצים מותאמים אישית</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/tables" element={<TableList />} />
            <Route path="/allocations" element={<Allocations />} />
            <Route path="/employee-constraints" element={<EmployeeConstraints />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
