import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { useNavigate } from 'react-router-dom';

const TestPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [testStatus, setTestStatus] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [erro, setErro] = useState('');

  const { 
    isInitialized, 
    isSignedIn, 
    spreadsheetId, 
    isOffline, 
    pendingOperations,
    sincronizarDados,
    verificarPermissao
  } = useGoogleSheets();
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/setup');
      return;
    }

    const executarTestes = async () => {
      setIsLoading(true);
      setTestResults([]);
      
      try {
        // Teste 1: Verificar inicialização da API
        adicionarResultado('Inicialização da API', isInitialized ? 'Sucesso' : 'Falha');
        
        // Teste 2: Verificar autenticação
        adicionarResultado('Autenticação com Google', isSignedIn ? 'Sucesso' : 'Falha');
        
        // Teste 3: Verificar configuração da planilha
        adicionarResultado('Configuração da planilha', spreadsheetId ? 'Sucesso' : 'Falha');
        
        // Teste 4: Verificar permissões
        try {
          const temPermissao = await verificarPermissao();
          adicionarResultado('Permissões de edição', temPermissao ? 'Sucesso' : 'Falha');
        } catch (error) {
          adicionarResultado('Permissões de edição', 'Falha', error.message);
        }
        
        // Teste 5: Verificar status de conexão
        adicionarResultado('Status de conexão', isOffline ? 'Offline' : 'Online');
        
        // Teste 6: Verificar operações pendentes
        adicionarResultado('Operações pendentes', pendingOperations > 0 ? `${pendingOperations} pendentes` : 'Nenhuma');
        
        // Atualiza o status geral
        const falhas = testResults.filter(test => test.status === 'Falha').length;
        setTestStatus({
          total: testResults.length,
          sucesso: testResults.filter(test => test.status === 'Sucesso').length,
          falha: falhas,
          resultado: falhas === 0 ? 'Sucesso' : 'Falha'
        });
      } catch (error) {
        console.error('Erro ao executar testes:', error);
        setErro(`Erro ao executar testes: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    executarTestes();
  }, [isInitialized, isSignedIn, spreadsheetId, isOffline, pendingOperations, verificarPermissao, navigate]);

  const adicionarResultado = (nome, status, mensagem = '') => {
    setTestResults(prev => [...prev, { nome, status, mensagem }]);
  };

  const handleSincronizar = async () => {
    try {
      setIsLoading(true);
      const resultado = await sincronizarDados();
      
      if (resultado.success) {
        adicionarResultado('Sincronização manual', 'Sucesso', resultado.message);
      } else {
        adicionarResultado('Sincronização manual', 'Falha', resultado.message);
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      adicionarResultado('Sincronização manual', 'Falha', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Página de Testes e Visualização</h1>

      {erro && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Status do Sistema */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Status do Sistema</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inicialização:</span>
                <span className={`font-medium ${isInitialized ? 'text-green-600' : 'text-red-600'}`}>
                  {isInitialized ? 'Concluída' : 'Pendente'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Autenticação:</span>
                <span className={`font-medium ${isSignedIn ? 'text-green-600' : 'text-red-600'}`}>
                  {isSignedIn ? 'Autenticado' : 'Não autenticado'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Planilha:</span>
                <span className={`font-medium ${spreadsheetId ? 'text-green-600' : 'text-red-600'}`}>
                  {spreadsheetId ? 'Configurada' : 'Não configurada'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conexão:</span>
                <span className={`font-medium ${isOffline ? 'text-yellow-600' : 'text-green-600'}`}>
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Operações pendentes:</span>
                <span className={`font-medium ${pendingOperations > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {pendingOperations}
                </span>
              </div>
              
              {pendingOperations > 0 && !isOffline && (
                <button
                  onClick={handleSincronizar}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sincronizando...' : 'Sincronizar Agora'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Informações da Planilha */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Informações da Planilha</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : spreadsheetId ? (
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">ID da Planilha:</span>
                <div className="mt-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                  {spreadsheetId}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Link para acesso:</span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Abrir no Google Sheets
                </a>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>A planilha contém as seguintes abas:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Índice - Lista de clientes e funções do sistema</li>
                  <li>Uma aba para cada cliente cadastrado</li>
                  <li>Veículos - Todos os veículos cadastrados</li>
                  <li>Ordens de Serviço - Todas as OS do sistema</li>
                  <li>Financeiro - Resumo financeiro e OS pendentes</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Planilha não configurada. Acesse a página de configuração para começar.
              <div className="mt-4">
                <button
                  onClick={() => navigate('/setup')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Ir para Configuração
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados dos Testes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Resultados dos Testes</h2>
        
        {isLoading && testResults.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : testResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum teste executado ainda.
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 rounded-md bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total de testes:</span>
                <span className="font-medium">{testStatus.total || testResults.length}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700">Testes com sucesso:</span>
                <span className="font-medium text-green-600">{testStatus.sucesso || 0}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700">Testes com falha:</span>
                <span className="font-medium text-red-600">{testStatus.falha || 0}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700">Resultado geral:</span>
                <span className={`font-medium ${testStatus.resultado === 'Sucesso' ? 'text-green-600' : 'text-red-600'}`}>
                  {testStatus.resultado || 'Pendente'}
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teste
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resultado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testResults.map((test, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {test.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${test.status === 'Sucesso' ? 'bg-green-100 text-green-800' : 
                            test.status === 'Falha' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.mensagem}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Navegação Rápida */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Navegação Rápida</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center"
          >
            <span className="block text-blue-600 text-lg mb-1">📊</span>
            <span className="text-sm font-medium text-gray-700">Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/clientes')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center"
          >
            <span className="block text-green-600 text-lg mb-1">👥</span>
            <span className="text-sm font-medium text-gray-700">Clientes</span>
          </button>
          
          <button
            onClick={() => navigate('/ordens')}
            className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center"
          >
            <span className="block text-yellow-600 text-lg mb-1">📝</span>
            <span className="text-sm font-medium text-gray-700">Ordens de Serviço</span>
          </button>
          
          <button
            onClick={() => navigate('/financeiro')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center"
          >
            <span className="block text-purple-600 text-lg mb-1">💰</span>
            <span className="text-sm font-medium text-gray-700">Financeiro</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
