import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, user, isOffline, pendingOperations, signOut } = useGoogleSheets();

  // Não mostra a navbar na página de setup
  if (location.pathname === '/setup') {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/setup');
  };

  return (
    <nav className="bg-blue-600 text-white fixed w-full z-10 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-bold">OficinaFácil</span>
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">Google Sheets</span>
            </Link>
            
            {isSignedIn && (
              <div className="hidden md:flex ml-10 space-x-4">
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/dashboard' 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/clientes" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/clientes') 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  Clientes
                </Link>
                <Link 
                  to="/ordens" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/ordens') 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  Ordens de Serviço
                </Link>
                <Link 
                  to="/financeiro" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/financeiro' 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  Financeiro
                </Link>
                <Link 
                  to="/teste" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/teste' 
                      ? 'bg-blue-700 text-white' 
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  Testes
                </Link>
              </div>
            )}
          </div>
          
          {isSignedIn && (
            <div className="flex items-center">
              {isOffline && (
                <span className="mr-4 text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                  Offline
                </span>
              )}
              
              {pendingOperations > 0 && (
                <span className="mr-4 text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                  {pendingOperations} pendentes
                </span>
              )}
              
              {user && (
                <div className="flex items-center">
                  {user.imageUrl && (
                    <img 
                      src={user.imageUrl} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full mr-2"
                    />
                  )}
                  <span className="text-sm mr-4 hidden md:block">{user.name}</span>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1 text-sm bg-blue-700 hover:bg-blue-800 rounded"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
