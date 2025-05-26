import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';

const SetupPage = () => {
  const [step, setStep] = useState(1);
  const [planilhaId, setPlanilhaId] = useState('');
  const [nomePlanilha, setNomePlanilha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const {
    isInitialized,
    isSignedIn,
    user,
    spreadsheetId,
    signIn,
    signOut,
    criarNovaPlanilha,
    definirPlanilha,
    verificarPermissao
  } = useGoogleSheets();

  useEffect(() => {
    // Se já tiver um spreadsheetId salvo, pula para o passo final
    if (spreadsheetId && isSignedIn) {
      setStep(4);
      setPlanilhaId(spreadsheetId);
    }
  }, [spreadsheetId, isSignedIn]);

  const handleLogin = async () => {
    setIsLoading(true);
    setErro('');
    
    try {
      const success = await signIn();
      if (success) {
        setMensagem('Login realizado com sucesso!');
        setStep(2);
      } else {
        setErro('Falha ao fazer login. Tente novamente.');
      }
    } catch (error) {
      setErro(`Erro ao fazer login: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCriarPlanilha = async () => {
    if (!nomePlanilha.trim()) {
      setErro('Por favor, informe um nome para a planilha.');
      return;
    }

    setIsLoading(true);
    setErro('');
    
    try {
      const id = await criarNovaPlanilha(nomePlanilha);
      if (id) {
        setPlanilhaId(id);
        setMensagem(`Planilha "${nomePlanilha}" criada com sucesso!`);
        setStep(4);
      } else {
        setErro('Falha ao criar planilha. Tente novamente.');
      }
    } catch (error) {
      setErro(`Erro ao criar planilha: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsarPlanilha = async () => {
    if (!planilhaId.trim()) {
      setErro('Por favor, informe o ID da planilha.');
      return;
    }

    setIsLoading(true);
    setErro('');
    
    try {
      const success = definirPlanilha(planilhaId);
      if (success) {
        // Verifica se tem permissão para editar a planilha
        const temPermissao = await verificarPermissao();
        if (temPermissao) {
          setMensagem('Planilha configurada com sucesso!');
          setStep(4);
        } else {
          setErro('Você não tem permissão para editar esta planilha. Verifique as permissões de compartilhamento.');
        }
      } else {
        setErro('Falha ao configurar planilha. Verifique o ID e tente novamente.');
      }
    } catch (error) {
      setErro(`Erro ao configurar planilha: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setStep(1);
      setMensagem('');
    } catch (error) {
      setErro(`Erro ao fazer logout: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
            Inicializando...
          </h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">
            Carregando a API do Google Sheets. Por favor, aguarde...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Configuração do OficinaFácil
        </h1>

        {mensagem && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {erro}
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-4 text-gray-700">
              Para começar, faça login com sua conta Google para acessar o Google Sheets.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {isLoading ? 'Processando...' : 'Fazer Login com Google'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-4 text-gray-700">
              Olá, {user?.name}! Escolha uma opção:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setStep(3)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Usar planilha existente
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>
              <div>
                <label htmlFor="nomePlanilha" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da nova planilha:
                </label>
                <input
                  type="text"
                  id="nomePlanilha"
                  value={nomePlanilha}
                  onChange={(e) => setNomePlanilha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Oficina do João"
                />
                <button
                  onClick={handleCriarPlanilha}
                  disabled={isLoading || !nomePlanilha.trim()}
                  className="w-full mt-2 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  {isLoading ? 'Criando...' : 'Criar nova planilha'}
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Trocar conta
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-4 text-gray-700">
              Informe o ID da planilha do Google Sheets que deseja usar:
            </p>
            <div className="mb-4">
              <label htmlFor="planilhaId" className="block text-sm font-medium text-gray-700 mb-1">
                ID da planilha:
              </label>
              <input
                type="text"
                id="planilhaId"
                value={planilhaId}
                onChange={(e) => setPlanilhaId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
              <p className="mt-1 text-sm text-gray-500">
                O ID está na URL da planilha: https://docs.google.com/spreadsheets/d/<span className="font-bold">ID_DA_PLANILHA</span>/edit
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleUsarPlanilha}
                disabled={isLoading || !planilhaId.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              >
                {isLoading ? 'Configurando...' : 'Usar esta planilha'}
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={isLoading}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50"
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h2 className="text-lg font-semibold text-green-700 mb-2">Configuração concluída!</h2>
              <p className="text-green-600">
                Sua planilha está configurada e pronta para uso.
              </p>
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                ID: {planilhaId}
              </div>
            </div>
            
            <p className="mb-4 text-gray-700">
              Você pode acessar sua planilha diretamente no Google Sheets para visualizar os dados.
            </p>
            
            <div className="flex space-x-2">
              <a
                href={`https://docs.google.com/spreadsheets/d/${planilhaId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Abrir no Google Sheets
              </a>
              <button
                onClick={handleLogout}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Sair
              </button>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Ir para o Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupPage;
