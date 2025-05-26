import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleSheetsProvider } from './lib/GoogleSheetsContext';

// Componentes
import Navbar from './components/Navbar';
import SetupPage from './components/SetupPage';
import Dashboard from './components/Dashboard';
import ClienteForm from './components/ClienteForm';
import ClientesList from './components/ClientesList';
import VeiculoForm from './components/VeiculoForm';
import OrdemServicoForm from './components/OrdemServicoForm';
import OrdemServicoList from './components/OrdemServicoList';
import FinanceiroResumo from './components/FinanceiroResumo';
import TestPage from './components/TestPage';

function App() {
  return (
    <GoogleSheetsProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Rotas de Clientes */}
              <Route path="/clientes" element={<ClientesList />} />
              <Route path="/clientes/novo" element={<ClienteForm />} />
              <Route path="/clientes/:clienteId" element={<ClientesList />} />
              
              {/* Rotas de Veículos */}
              <Route path="/veiculos/novo" element={<VeiculoForm />} />
              <Route path="/veiculos/novo/:clienteId" element={<VeiculoForm />} />
              
              {/* Rotas de Ordens de Serviço */}
              <Route path="/ordens" element={<OrdemServicoList />} />
              <Route path="/ordens/nova" element={<OrdemServicoForm />} />
              <Route path="/ordens/status/:status" element={<OrdemServicoList />} />
              <Route path="/ordens/:osId" element={<OrdemServicoList />} />
              
              {/* Rota Financeiro */}
              <Route path="/financeiro" element={<FinanceiroResumo />} />
              
              {/* Rota de Testes */}
              <Route path="/teste" element={<TestPage />} />
              
              {/* Redirecionamentos */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </GoogleSheetsProvider>
  );
}

export default App;
