import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { useNavigate, useParams } from 'react-router-dom';

const OrdemServicoList = () => {
  const [ordensServico, setOrdensServico] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  const { isSignedIn, isOffline, pendingOperations, obterOrdensServico, atualizarStatusOS } = useGoogleSheets();
  const navigate = useNavigate();
  const { status } = useParams();

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/setup');
      return;
    }

    // Define o filtro baseado na URL, se disponível
    if (status) {
      const statusMap = {
        'abertas': 'Aberta',
        'finalizadas': 'Finalizada',
        'pagas': 'Paga'
      };
      if (statusMap[status]) {
        setFiltroStatus(statusMap[status]);
      }
    }

    const carregarOrdens = async () => {
      setIsLoading(true);
      try {
        const listaOrdens = await obterOrdensServico();
        setOrdensServico(listaOrdens);
      } catch (error) {
        console.error('Erro ao carregar ordens de serviço:', error);
        setErro('Falha ao carregar ordens de serviço. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarOrdens();
  }, [isSignedIn, status, obterOrdensServico, navigate]);

  const handleAtualizarStatus = async (osId, novoStatus) => {
    try {
      setIsLoading(true);
      await atualizarStatusOS(osId, novoStatus);
      
      // Atualiza a lista local
      setOrdensServico(prevOrdens => 
        prevOrdens.map(os => 
          os.id === osId ? { ...os, status: novoStatus } : os
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setErro(`Falha ao atualizar status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const ordensFiltradas = filtroStatus 
    ? ordensServico.filter(os => os.status === filtroStatus)
    : ordensServico;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ordens de Serviço</h1>
        <button
          onClick={() => navigate('/ordens/nova')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Nova OS
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
          <div className="flex space-x-2">
            <button
              onClick={() => setFiltroStatus('')}
              className={`px-3 py-1 rounded-md ${
                filtroStatus === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroStatus('Aberta')}
              className={`px-3 py-1 rounded-md ${
                filtroStatus === 'Aberta' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Abertas
            </button>
            <button
              onClick={() => setFiltroStatus('Finalizada')}
              className={`px-3 py-1 rounded-md ${
                filtroStatus === 'Finalizada' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Finalizadas
            </button>
            <button
              onClick={() => setFiltroStatus('Paga')}
              className={`px-3 py-1 rounded-md ${
                filtroStatus === 'Paga' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pagas
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : ordensFiltradas.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filtroStatus 
              ? `Nenhuma ordem de serviço com status "${filtroStatus}".` 
              : 'Nenhuma ordem de serviço cadastrada.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veículo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Entrada
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordensFiltradas.map((os) => (
                  <tr key={os.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {os.cliente}
                      </div>
                      {os.pendente && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendente de sincronização
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {os.veiculo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {os.dataEntrada}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ {os.valorTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${os.status === 'Aberta' ? 'bg-yellow-100 text-yellow-800' : 
                          os.status === 'Finalizada' ? 'bg-orange-100 text-orange-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {os.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/ordens/${os.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Detalhes
                      </button>
                      
                      {os.status === 'Aberta' && (
                        <button
                          onClick={() => handleAtualizarStatus(os.id, 'Finalizada')}
                          className="text-orange-600 hover:text-orange-900 mr-3"
                          disabled={isLoading}
                        >
                          Finalizar
                        </button>
                      )}
                      
                      {os.status === 'Finalizada' && (
                        <button
                          onClick={() => handleAtualizarStatus(os.id, 'Paga')}
                          className="text-green-600 hover:text-green-900"
                          disabled={isLoading}
                        >
                          Marcar como Paga
                        </button>
                      )}
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

export default OrdemServicoList;
