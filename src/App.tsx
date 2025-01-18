import React from 'react';
import { Header } from './components/layout/Header';
import MainDashboard from './components/dashboard/MainDashboard'; // Import MainDashboard
import './styles/globals.css';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <MainDashboard /> {/* Add MainDashboard here */}
      </main>
    </div>
  );
};

export default App;
