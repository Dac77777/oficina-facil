import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [resumoClientes, setResumoClientes] = useState({ total: 0 });
  const [resumoVeiculos, setResumoVeiculos] = useState({ total: 0 });
  const [resumoOS, setResumoOS] = useState({ abertas: 0, finalizadas: 0, pagas: 0 });
  const [resumoFinanceiro, setResumoFinanceiro] = useState({
    totalOSAberto: 0,
    totalOSFinalizada: 0,
    faturamentoMesAtual: 0,
    faturamentoMesAnterior: 0
  });
  const [osPendentes, setOSPendentes] = useState([]);
  const [osRecentes, setOSRecentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    isSignedIn,
    isOffline,
    pendingOperations,
    isSyncing,
    sincronizarDados,
    obterClientes,
    obterOrdensServico,
    obterResumoFinanceiro
  } = useGoogleSheets();

  useEffect(() => {
    if (!isSignedIn) {
      window.location.href = '/setup';
      return;
    }

    const carregarDados = async () => {
      setIsLoading(true);
      try {
        // Carrega clientes
        const clientes = await obterClientes();
        setResumoClientes({ total: clientes.length });

        // Carrega ordens de serviço
        const todasOS = await obterOrdensServico();
        const osAbertas = todasOS.filter(os => os.status === 'Aberta');
        const osFinalizadas = todasOS.filter(os => os.status === 'Finalizada');
        const osPagas = todasOS.filter(os => os.status === 'Paga');
        
        setResumoOS({
          abertas: osAbertas.length,
          finalizadas: osFinalizadas.length,
          pagas: osPagas.length
        });

        // Calcula total de veículos (aproximado, baseado nas OS)
        const veiculosUnicos = new Set();
        todasOS.forEach(os => veiculosUnicos.add(os.veiculo));
        setResumoVeiculos({ total: veiculosUnicos.size });

        // Carrega resumo financeiro
        const financeiro = await obterResumoFinanceiro();
        setResumoFinanceiro(financeiro.resumo);
        setOSPendentes(financeiro.osPendentes);

        // Ordena OS por data (mais recentes primeiro)
        const recentes = [...todasOS].sort((a, b) => {
          return new Date(b.dataEntrada) - new Date(a.dataEntrada);
        }).slice(0, 5); // Pega as 5 mais recentes
        
        setOSRecentes(recentes);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [isSignedIn, obterClientes, obterOrdensServico, obterResumoFinanceiro]);

  const handleSincronizar = async () => {
    await sincronizarDados();
    // Recarrega a página para atualizar os dados
    window.location.reload();
  };

  if (!isSignedIn) {
    return null; // Redirecionando para setup
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao OficinaFácil Gratuito (Google Sheets)</p>
        
        {isOffline && (
          <div className="mt-2 p-3 bg-yellow-100 text-yellow-800 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Modo offline ativo. Os dados serão sincronizados quando a conexão for restabelecida.</span>
          </div>
        )}
        
        {pendingOperations > 0 && (
          <div className="mt-2 p-3 bg-blue-100 text-blue-800 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{pendingOperations} operações pendentes de sincronização.</span>
            </div>
            <button
              onClick={handleSincronizar}
              disabled={isOffline || isSyncing}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Clientes</h2>
              <p className="text-3xl font-bold text-blue-600">{resumoClientes.total}</p>
              <div className="mt-4">
                <Link to="/clientes" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver todos →
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Veículos</h2>
              <p className="text-3xl font-bold text-green-600">{resumoVeiculos.total}</p>
              <div className="mt-4">
                <Link to="/veiculos" className="text-green-600 hover:text-green-800 text-sm font-medium">
                  Ver todos →
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Ordens de Serviço</h2>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Abertas</p>
                  <p className="text-xl font-bold text-yellow-500">{resumoOS.abertas}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Finalizadas</p>
                  <p className="text-xl font-bold text-orange-500">{resumoOS.finalizadas}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pagas</p>
                  <p className="text-xl font-bold text-green-500">{resumoOS.pagas}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/ordens" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver todas →
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Financeiro</h2>
              <p className="text-sm text-gray-500">Faturamento (mês atual)</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {resumoFinanceiro.faturamentoMesAtual.toFixed(2)}
              </p>
              <div className="mt-4">
                <Link to="/financeiro" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver detalhes →
                </Link>
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/clientes/novo" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Novo Cliente</span>
              </Link>
              
              <Link to="/veiculos/novo" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Novo Veículo</span>
              </Link>
              
              <Link to="/ordens/nova" className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Nova OS</span>
              </Link>
              
              <Link to="/financeiro" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Financeiro</span>
              </Link>
            </div>
          </div>

          {/* Conteúdo principal em duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* OS Recentes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Ordens de Serviço Recentes</h2>
              
              {osRecentes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma ordem de serviço registrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {osRecentes.map((os) => (
                        <tr key={os.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{os.cliente}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{os.veiculo}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{os.dataEntrada}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${os.status === 'Aberta' ? 'bg-yellow-100 text-yellow-800' : 
                                os.status === 'Finalizada' ? 'bg-orange-100 text-orange-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {os.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <Link to="/ordens" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver todas →
                </Link>
              </div>
            </div>

            {/* OS Pendentes de Pagamento */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Pendentes de Pagamento</h2>
              
              {osPendentes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma ordem de serviço pendente de pagamento.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {osPendentes.map((os) => (
                        <tr key={os.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{os.cliente}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{os.data}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            R$ {os.valor.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <Link to="/financeiro" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver detalhes →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
