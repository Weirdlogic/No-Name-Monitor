// src/components/layout/Header.tsx
import React from 'react';
import { Shield } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="ml-2 text-3xl font-bold text-gray-900">
            DDoSia Monitor
          </h1>
        </div>
      </div>
    </header>
  );
};