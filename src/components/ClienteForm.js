import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { useNavigate } from 'react-router-dom';

const ClienteForm = () => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [placaPrincipal, setPlacaPrincipal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const { isSignedIn, adicionarCliente } = useGoogleSheets();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/setup');
    }
  }, [isSignedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErro('');
    setSucesso(false);

    // Validação básica
    if (!nome.trim() || !telefone.trim() || !placaPrincipal.trim()) {
      setErro('Todos os campos são obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      const novoCliente = {
        nome,
        telefone,
        placaPrincipal
      };

      const resultado = await adicionarCliente(novoCliente);
      
      if (resultado) {
        setSucesso(true);
        // Limpa o formulário
        setNome('');
        setTelefone('');
        setPlacaPrincipal('');
        
        // Redireciona após 2 segundos
        setTimeout(() => {
          navigate('/clientes');
        }, 2000);
      } else {
        setErro('Falha ao cadastrar cliente. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      setErro(`Erro ao cadastrar cliente: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Novo Cliente</h1>
        
        {erro && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Cliente cadastrado com sucesso! Redirecionando...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: João da Silva"
              disabled={isLoading || sucesso}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: (11) 98765-4321"
              disabled={isLoading || sucesso}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="placaPrincipal" className="block text-sm font-medium text-gray-700 mb-1">
              Placa do Veículo Principal
            </label>
            <input
              type="text"
              id="placaPrincipal"
              value={placaPrincipal}
              onChange={(e) => setPlacaPrincipal(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: ABC1234"
              disabled={isLoading || sucesso}
            />
            <p className="mt-1 text-sm text-gray-500">
              Você poderá cadastrar mais veículos depois.
            </p>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              disabled={isLoading || sucesso}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={isLoading || sucesso}
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteForm;
