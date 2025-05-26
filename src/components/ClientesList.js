import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { useNavigate } from 'react-router-dom';

const ClientesList = () => {
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  const { isSignedIn, isOffline, pendingOperations, obterClientes } = useGoogleSheets();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/setup');
      return;
    }

    const carregarClientes = async () => {
      setIsLoading(true);
      try {
        const listaClientes = await obterClientes();
        setClientes(listaClientes);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setErro('Falha ao carregar clientes. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarClientes();
  }, [isSignedIn, obterClientes, navigate]);

  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    cliente.telefone.includes(filtro) ||
    cliente.placaPrincipal.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => navigate('/clientes/novo')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Novo Cliente
        </button>
      </div>

      {isOffline && pendingOperations > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          Você está no modo offline com {pendingOperations} operações pendentes. 
          Os dados serão sincronizados quando a conexão for restabelecida.
        </div>
      )}

      {erro && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {erro}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou placa"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filtro ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa Principal
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cliente.nome}
                      </div>
                      {cliente.pendente && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendente de sincronização
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.telefone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.placaPrincipal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Detalhes
                      </button>
                      <button
                        onClick={() => navigate(`/veiculos/novo/${cliente.id}`)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Novo Veículo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientesList;
