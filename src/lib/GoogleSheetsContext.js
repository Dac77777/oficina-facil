import React, { useState, useEffect, createContext, useContext } from 'react';
import * as GoogleSheets from './googleSheets';

// Contexto para gerenciar o estado da autenticação e dados do Google Sheets
const GoogleSheetsContext = createContext(null);

export const GoogleSheetsProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Inicializa a API do Google Sheets
  useEffect(() => {
    const initialize = async () => {
      try {
        await GoogleSheets.initGoogleSheetsAPI();
        setIsInitialized(true);
        
        // Verifica se o usuário já está autenticado
        const signedIn = GoogleSheets.isSignedIn();
        setIsSignedIn(signedIn);
        
        if (signedIn) {
          const auth = window.gapi.auth2.getAuthInstance();
          const googleUser = auth.currentUser.get();
          const profile = googleUser.getBasicProfile();
          
          setUser({
            id: profile.getId(),
            name: profile.getName(),
            email: profile.getEmail(),
            imageUrl: profile.getImageUrl()
          });
          
          // Recupera o ID da planilha salvo
          const savedId = GoogleSheets.getSpreadsheetId();
          if (savedId) {
            setSpreadsheetId(savedId);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar API do Google Sheets:', error);
        setError('Falha ao inicializar a API do Google. Verifique sua conexão com a internet.');
      }
    };
    
    initialize();
    
    // Monitora o estado da conexão
    const handleOnline = () => {
      setIsOffline(false);
      // Tenta sincronizar dados offline quando voltar online
      if (GoogleSheets.contarOperacoesPendentes() > 0) {
        sincronizarDados();
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verifica operações pendentes periodicamente
    const checkPendingOps = () => {
      setPendingOperations(GoogleSheets.contarOperacoesPendentes());
    };
    
    const intervalId = setInterval(checkPendingOps, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  // Função para fazer login
  const signIn = async () => {
    try {
      setError(null);
      const result = await GoogleSheets.signIn();
      
      if (result) {
        setIsSignedIn(true);
        
        const profile = result.getBasicProfile();
        setUser({
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          imageUrl: profile.getImageUrl()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Falha ao fazer login. Tente novamente.');
      return false;
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    try {
      await GoogleSheets.signOut();
      setIsSignedIn(false);
      setUser(null);
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setError('Falha ao fazer logout. Tente novamente.');
      return false;
    }
  };

  // Função para criar uma nova planilha
  const criarNovaPlanilha = async (nome) => {
    try {
      setError(null);
      const id = await GoogleSheets.criarNovaPlanilha(nome);
      setSpreadsheetId(id);
      return id;
    } catch (error) {
      console.error('Erro ao criar planilha:', error);
      setError('Falha ao criar planilha. Verifique suas permissões e tente novamente.');
      return null;
    }
  };

  // Função para definir o ID da planilha
  const definirPlanilha = (id) => {
    try {
      GoogleSheets.setSpreadsheetId(id);
      setSpreadsheetId(id);
      return true;
    } catch (error) {
      console.error('Erro ao definir planilha:', error);
      setError('Falha ao definir planilha. Verifique o ID e tente novamente.');
      return false;
    }
  };

  // Função para verificar permissões
  const verificarPermissao = async () => {
    try {
      const temPermissao = await GoogleSheets.verificarPermissao();
      if (!temPermissao) {
        setError('Você não tem permissão para editar esta planilha.');
      }
      return temPermissao;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      setError('Falha ao verificar permissões. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  // Função para sincronizar dados offline
  const sincronizarDados = async () => {
    if (isSyncing || isOffline || !isSignedIn) return;
    
    try {
      setIsSyncing(true);
      const resultado = await GoogleSheets.sincronizarDadosOffline();
      setPendingOperations(GoogleSheets.contarOperacoesPendentes());
      
      if (!resultado.success) {
        setError(`Falha na sincronização: ${resultado.message}`);
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      setError('Falha ao sincronizar dados. Tente novamente mais tarde.');
      return { success: false, message: error.message };
    } finally {
      setIsSyncing(false);
    }
  };

  // Função para adicionar cliente
  const adicionarCliente = async (cliente) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Modo offline: adiciona à fila de operações pendentes
        GoogleSheets.adicionarOperacaoPendente('addCliente', cliente);
        setPendingOperations(GoogleSheets.contarOperacoesPendentes());
        
        // Salva no cache local
        const clientes = GoogleSheets.recuperarCache('clientes')?.data || [];
        const novoCliente = {
          ...cliente,
          id: `CL${Date.now()}`,
          sheetTitle: `Cliente: ${cliente.nome}`,
          pendente: true
        };
        GoogleSheets.salvarCache('clientes', [...clientes, novoCliente]);
        
        return novoCliente;
      } else {
        // Modo online: adiciona diretamente na planilha
        const resultado = await GoogleSheets.addCliente(cliente);
        
        // Atualiza o cache
        const clientes = GoogleSheets.recuperarCache('clientes')?.data || [];
        GoogleSheets.salvarCache('clientes', [...clientes, resultado]);
        
        return resultado;
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      setError('Falha ao adicionar cliente. Tente novamente.');
      return null;
    }
  };

  // Função para obter clientes
  const obterClientes = async () => {
    try {
      setError(null);
      
      // Verifica se há cache válido
      if (GoogleSheets.cacheAtualizado('clientes')) {
        return GoogleSheets.recuperarCache('clientes').data;
      }
      
      if (isOffline) {
        // Modo offline: retorna dados do cache
        const cache = GoogleSheets.recuperarCache('clientes');
        return cache?.data || [];
      } else {
        // Modo online: obtém dados da planilha
        const clientes = await GoogleSheets.getClientes();
        
        // Atualiza o cache
        GoogleSheets.salvarCache('clientes', clientes);
        
        return clientes;
      }
    } catch (error) {
      console.error('Erro ao obter clientes:', error);
      setError('Falha ao obter clientes. Usando dados em cache, se disponíveis.');
      
      // Em caso de erro, tenta usar o cache
      const cache = GoogleSheets.recuperarCache('clientes');
      return cache?.data || [];
    }
  };

  // Função para adicionar veículo
  const adicionarVeiculo = async (veiculo, clienteSheetTitle) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Modo offline: adiciona à fila de operações pendentes
        GoogleSheets.adicionarOperacaoPendente('addVeiculo', { dados: veiculo, clienteSheetTitle });
        setPendingOperations(GoogleSheets.contarOperacoesPendentes());
        
        // Salva no cache local
        const veiculos = GoogleSheets.recuperarCache('veiculos')?.data || [];
        const novoVeiculo = {
          ...veiculo,
          id: `VE${Date.now()}`,
          pendente: true
        };
        GoogleSheets.salvarCache('veiculos', [...veiculos, novoVeiculo]);
        
        return novoVeiculo;
      } else {
        // Modo online: adiciona diretamente na planilha
        const resultado = await GoogleSheets.addVeiculo(veiculo, clienteSheetTitle);
        
        // Atualiza o cache
        const veiculos = GoogleSheets.recuperarCache('veiculos')?.data || [];
        GoogleSheets.salvarCache('veiculos', [...veiculos, resultado]);
        
        return resultado;
      }
    } catch (error) {
      console.error('Erro ao adicionar veículo:', error);
      setError('Falha ao adicionar veículo. Tente novamente.');
      return null;
    }
  };

  // Função para obter veículos de um cliente
  const obterVeiculosCliente = async (clienteSheetTitle) => {
    try {
      setError(null);
      
      // Verifica se há cache válido
      const cacheKey = `veiculos_${clienteSheetTitle}`;
      if (GoogleSheets.cacheAtualizado(cacheKey)) {
        return GoogleSheets.recuperarCache(cacheKey).data;
      }
      
      if (isOffline) {
        // Modo offline: retorna dados do cache
        const cache = GoogleSheets.recuperarCache(cacheKey);
        return cache?.data || [];
      } else {
        // Modo online: obtém dados da planilha
        const veiculos = await GoogleSheets.getVeiculosCliente(clienteSheetTitle);
        
        // Atualiza o cache
        GoogleSheets.salvarCache(cacheKey, veiculos);
        
        return veiculos;
      }
    } catch (error) {
      console.error('Erro ao obter veículos:', error);
      setError('Falha ao obter veículos. Usando dados em cache, se disponíveis.');
      
      // Em caso de erro, tenta usar o cache
      const cacheKey = `veiculos_${clienteSheetTitle}`;
      const cache = GoogleSheets.recuperarCache(cacheKey);
      return cache?.data || [];
    }
  };

  // Função para adicionar ordem de serviço
  const adicionarOrdemServico = async (os) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Modo offline: adiciona à fila de operações pendentes
        GoogleSheets.adicionarOperacaoPendente('addOrdemServico', os);
        setPendingOperations(GoogleSheets.contarOperacoesPendentes());
        
        // Salva no cache local
        const ordensServico = GoogleSheets.recuperarCache('ordensServico')?.data || [];
        const novaOS = {
          ...os,
          id: `OS${Date.now()}`,
          pendente: true
        };
        GoogleSheets.salvarCache('ordensServico', [...ordensServico, novaOS]);
        
        return novaOS;
      } else {
        // Modo online: adiciona diretamente na planilha
        const resultado = await GoogleSheets.addOrdemServico(os);
        
        // Atualiza o cache
        const ordensServico = GoogleSheets.recuperarCache('ordensServico')?.data || [];
        GoogleSheets.salvarCache('ordensServico', [...ordensServico, resultado]);
        
        return resultado;
      }
    } catch (error) {
      console.error('Erro ao adicionar ordem de serviço:', error);
      setError('Falha ao adicionar ordem de serviço. Tente novamente.');
      return null;
    }
  };

  // Função para atualizar status de uma OS
  const atualizarStatusOS = async (osId, novoStatus) => {
    try {
      setError(null);
      
      if (isOffline) {
        // Modo offline: adiciona à fila de operações pendentes
        GoogleSheets.adicionarOperacaoPendente('atualizarStatusOS', { osId, novoStatus });
        setPendingOperations(GoogleSheets.contarOperacoesPendentes());
        
        // Atualiza no cache local
        const ordensServico = GoogleSheets.recuperarCache('ordensServico')?.data || [];
        const osIndex = ordensServico.findIndex(os => os.id === osId);
        
        if (osIndex !== -1) {
          const novasOrdens = [...ordensServico];
          novasOrdens[osIndex] = {
            ...novasOrdens[osIndex],
            status: novoStatus,
            ultimaAtualizacao: new Date().toISOString().split('T')[0],
            pendente: true
          };
          GoogleSheets.salvarCache('ordensServico', novasOrdens);
          
          return novasOrdens[osIndex];
        }
        
        return null;
      } else {
        // Modo online: atualiza diretamente na planilha
        const resultado = await GoogleSheets.atualizarStatusOS(osId, novoStatus);
        
        // Atualiza o cache
        const ordensServico = GoogleSheets.recuperarCache('ordensServico')?.data || [];
        const osIndex = ordensServico.findIndex(os => os.id === osId);
        
        if (osIndex !== -1) {
          const novasOrdens = [...ordensServico];
          novasOrdens[osIndex] = resultado;
          GoogleSheets.salvarCache('ordensServico', novasOrdens);
        }
        
        return resultado;
      }
    } catch (error) {
      console.error('Erro ao atualizar status da OS:', error);
      setError('Falha ao atualizar status da ordem de serviço. Tente novamente.');
      return null;
    }
  };

  // Função para obter ordens de serviço
  const obterOrdensServico = async (filtroStatus = null) => {
    try {
      setError(null);
      
      // Verifica se há cache válido
      if (GoogleSheets.cacheAtualizado('ordensServico')) {
        const ordens = GoogleSheets.recuperarCache('ordensServico').data;
        return filtroStatus ? ordens.filter(os => os.status === filtroStatus) : ordens;
      }
      
      if (isOffline) {
        // Modo offline: retorna dados do cache
        const cache = GoogleSheets.recuperarCache('ordensServico');
        const ordens = cache?.data || [];
        return filtroStatus ? ordens.filter(os => os.status === filtroStatus) : ordens;
      } else {
        // Modo online: obtém dados da planilha
        const ordens = await GoogleSheets.getOrdensServico(filtroStatus);
        
        // Atualiza o cache
        GoogleSheets.salvarCache('ordensServico', ordens);
        
        return ordens;
      }
    } catch (error) {
      console.error('Erro ao obter ordens de serviço:', error);
      setError('Falha ao obter ordens de serviço. Usando dados em cache, se disponíveis.');
      
      // Em caso de erro, tenta usar o cache
      const cache = GoogleSheets.recuperarCache('ordensServico');
      const ordens = cache?.data || [];
      return filtroStatus ? ordens.filter(os => os.status === filtroStatus) : ordens;
    }
  };

  // Função para obter resumo financeiro
  const obterResumoFinanceiro = async () => {
    try {
      setError(null);
      
      // Verifica se há cache válido
      if (GoogleSheets.cacheAtualizado('resumoFinanceiro')) {
        return GoogleSheets.recuperarCache('resumoFinanceiro').data;
      }
      
      if (isOffline) {
        // Modo offline: retorna dados do cache
        const cache = GoogleSheets.recuperarCache('resumoFinanceiro');
        return cache?.data || { resumo: {}, osPendentes: [] };
      } else {
        // Modo online: obtém dados da planilha
        const resumo = await GoogleSheets.getResumoFinanceiro();
        
        // Atualiza o cache
        GoogleSheets.salvarCache('resumoFinanceiro', resumo);
        
        return resumo;
      }
    } catch (error) {
      console.error('Erro ao obter resumo financeiro:', error);
      setError('Falha ao obter resumo financeiro. Usando dados em cache, se disponíveis.');
      
      // Em caso de erro, tenta usar o cache
      const cache = GoogleSheets.recuperarCache('resumoFinanceiro');
      return cache?.data || { resumo: {}, osPendentes: [] };
    }
  };

  // Valor do contexto
  const value = {
    isInitialized,
    isSignedIn,
    user,
    spreadsheetId,
    isOffline,
    pendingOperations,
    isSyncing,
    error,
    signIn,
    signOut,
    criarNovaPlanilha,
    definirPlanilha,
    verificarPermissao,
    sincronizarDados,
    adicionarCliente,
    obterClientes,
    adicionarVeiculo,
    obterVeiculosCliente,
    adicionarOrdemServico,
    atualizarStatusOS,
    obterOrdensServico,
    obterResumoFinanceiro,
    limparErro: () => setError(null)
  };

  return (
    <GoogleSheetsContext.Provider value={value}>
      {children}
    </GoogleSheetsContext.Provider>
  );
};

// Hook para usar o contexto
export const useGoogleSheets = () => {
  const context = useContext(GoogleSheetsContext);
  if (!context) {
    throw new Error('useGoogleSheets deve ser usado dentro de um GoogleSheetsProvider');
  }
  return context;
};
