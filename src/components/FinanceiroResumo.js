import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { useNavigate } from 'react-router-dom';

const FinanceiroResumo = () => {
  const [resumoFinanceiro, setResumoFinanceiro] = useState({
    totalOSAberto: 0,
    totalOSFinalizada: 0,
    faturamentoMesAtual: 0,
    faturamentoMesAnterior: 0
  });
  const [osPendentes, setOSPendentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  const { isSignedIn, isOffline, obterResumoFinanceiro, atualizarStatusOS } = useGoogleSheets();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/setup');
      return;
    }

    const carregarDados = async () => {
      setIsLoading(true);
      try {
        const financeiro = await obterResumoFinanceiro();
        setResumoFinanceiro(financeiro.resumo);
        setOSPendentes(financeiro.osPendentes);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        setErro('Falha ao carregar dados financeiros. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [isSignedIn, obterResumoFinanceiro, navigate]);

  const handleMarcarComoPaga = async (osId) => {
    try {
      setIsLoading(true);
      await atualizarStatusOS(osId, 'Paga');
      
      // Atualiza a lista local
      setOSPendentes(prevPendentes => prevPendentes.filter(os => os.id !== osId));
      
      // Atualiza o resumo financeiro
      const novoResumo = { ...resumoFinanceiro };
      const osPaga = osPendentes.find(os => os.id === osId);
      if (osPaga) {
        novoResumo.totalOSFinalizada -= osPaga.valor;
        novoResumo.faturamentoMesAtual += osPaga.valor;
      }
      setResumoFinanceiro(novoResumo);
    } catch (error) {
      console.error('Erro ao marcar OS como paga:', error);
      setErro(`Falha ao marcar OS como paga: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resumo Financeiro</h1>

      {isOffline && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          Você está no modo offline. Os dados financeiros podem não estar atualizados.
        </div>
      )}

      {erro && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {erro}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">OS em Aberto</h2>
              <p className="text-3xl font-bold text-yellow-600">
                R$ {resumoFinanceiro.totalOSAberto.toFixed(2)}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/ordens/status/abertas')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver detalhes →
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">OS Finalizadas (não pagas)</h2>
              <p className="text-3xl font-bold text-orange-600">
                R$ {resumoFinanceiro.totalOSFinalizada.toFixed(2)}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/ordens/status/finalizadas')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver detalhes →
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Faturamento (mês atual)</h2>
              <p className="text-3xl font-bold text-green-600">
                R$ {resumoFinanceiro.faturamentoMesAtual.toFixed(2)}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/ordens/status/pagas')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver detalhes →
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Faturamento (mês anterior)</h2>
              <p className="text-3xl font-bold text-blue-600">
                R$ {resumoFinanceiro.faturamentoMesAnterior.toFixed(2)}
              </p>
            </div>
          </div>

          {/* OS Pendentes de Pagamento */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Ordens de Serviço Pendentes de Pagamento</h2>
            
            {osPendentes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma ordem de serviço pendente de pagamento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {osPendentes.map((os) => (
                      <tr key={os.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {os.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {os.cliente}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {os.data}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          R$ {os.valor.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => navigate(`/ordens/${os.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => handleMarcarComoPaga(os.id)}
                            className="text-green-600 hover:text-green-900"
                            disabled={isLoading}
                          >
                            Marcar como Paga
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceiroResumo;
