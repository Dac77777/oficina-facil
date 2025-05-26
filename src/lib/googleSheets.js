/**
 * Configuração e funções para integração com Google Sheets
 * OficinaFácil Gratuito - Versão 2.0
 */

// Configurações da API Google
const API_KEY = 'SUA_API_KEY'; // Será substituída pela chave real durante a configuração
const CLIENT_ID = 'SEU_CLIENT_ID'; // Será substituído pelo ID real durante a configuração
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// ID da planilha principal (será configurado pelo usuário)
let SPREADSHEET_ID = 'ID_DA_PLANILHA';

/**
 * Inicializa a API do Google Sheets
 * @returns {Promise} Promessa que resolve quando a API está carregada
 */
export const initGoogleSheetsAPI = () => {
  return new Promise((resolve, reject) => {
    // Carrega a biblioteca de cliente do Google
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', () => {
        window.gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(() => {
          resolve();
        }).catch(error => {
          reject(error);
        });
      });
    };
    script.onerror = () => {
      reject(new Error('Falha ao carregar a API do Google'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} Status de autenticação
 */
export const isSignedIn = () => {
  if (!window.gapi || !window.gapi.auth2) {
    return false;
  }
  return window.gapi.auth2.getAuthInstance().isSignedIn.get();
};

/**
 * Realiza login com Google
 * @returns {Promise} Promessa que resolve quando o login é concluído
 */
export const signIn = () => {
  return window.gapi.auth2.getAuthInstance().signIn();
};

/**
 * Realiza logout
 * @returns {Promise} Promessa que resolve quando o logout é concluído
 */
export const signOut = () => {
  return window.gapi.auth2.getAuthInstance().signOut();
};

/**
 * Configura o ID da planilha a ser usada
 * @param {string} id ID da planilha
 */
export const setSpreadsheetId = (id) => {
  SPREADSHEET_ID = id;
  // Salva no localStorage para persistência
  localStorage.setItem('oficinafacil_spreadsheet_id', id);
};

/**
 * Recupera o ID da planilha salvo
 * @returns {string} ID da planilha
 */
export const getSpreadsheetId = () => {
  const savedId = localStorage.getItem('oficinafacil_spreadsheet_id');
  return savedId || SPREADSHEET_ID;
};

/**
 * Obtém informações sobre a planilha
 * @returns {Promise} Promessa que resolve com os metadados da planilha
 */
export const getSpreadsheetInfo = async () => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: getSpreadsheetId()
    });
    return response.result;
  } catch (error) {
    console.error('Erro ao obter informações da planilha:', error);
    throw error;
  }
};

/**
 * Lista todas as abas da planilha
 * @returns {Promise<Array>} Promessa que resolve com a lista de abas
 */
export const listSheets = async () => {
  try {
    const info = await getSpreadsheetInfo();
    return info.sheets.map(sheet => ({
      id: sheet.properties.sheetId,
      title: sheet.properties.title,
      index: sheet.properties.index
    }));
  } catch (error) {
    console.error('Erro ao listar abas:', error);
    throw error;
  }
};

/**
 * Cria uma nova aba para um cliente
 * @param {string} clienteName Nome do cliente
 * @returns {Promise} Promessa que resolve com a resposta da API
 */
export const createClientSheet = async (clienteName) => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: `Cliente: ${clienteName}`,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 20
                }
              }
            }
          }
        ]
      }
    });
    
    // Inicializa a estrutura da aba do cliente
    const sheetId = response.result.replies[0].addSheet.properties.sheetId;
    const sheetTitle = response.result.replies[0].addSheet.properties.title;
    
    await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `'${sheetTitle}'!A1:E1`,
            values: [
              ['ID Cliente', 'Nome', 'Telefone', 'Placa Principal', 'Data Cadastro']
            ]
          },
          {
            range: `'${sheetTitle}'!A3:E3`,
            values: [
              ['Informações do Cliente']
            ]
          },
          {
            range: `'${sheetTitle}'!A7:F7`,
            values: [
              ['Veículos', 'Marca', 'Modelo', 'Ano', 'Placa', 'Data Cadastro']
            ]
          },
          {
            range: `'${sheetTitle}'!A15:F15`,
            values: [
              ['Histórico de OS', 'Data', 'Descrição', 'Status', 'Valor', 'Data Atualização']
            ]
          }
        ]
      }
    });
    
    // Atualiza a aba de índice
    await updateIndexSheet(clienteName, sheetTitle);
    
    return {
      sheetId,
      sheetTitle
    };
  } catch (error) {
    console.error('Erro ao criar aba para cliente:', error);
    throw error;
  }
};

/**
 * Atualiza a aba de índice com o novo cliente
 * @param {string} clienteName Nome do cliente
 * @param {string} sheetTitle Título da aba do cliente
 * @returns {Promise} Promessa que resolve quando a atualização é concluída
 */
export const updateIndexSheet = async (clienteName, sheetTitle) => {
  try {
    // Verifica se a aba de índice existe
    const sheets = await listSheets();
    const indexSheet = sheets.find(sheet => sheet.title === 'Índice');
    
    if (!indexSheet) {
      // Cria a aba de índice se não existir
      await createIndexSheet();
    }
    
    // Obtém a lista atual de clientes
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: 'Índice!A:B'
    });
    
    const rows = response.result.values || [];
    const nextRow = rows.length + 1;
    
    // Adiciona o novo cliente ao índice
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `Índice!A${nextRow}:B${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [clienteName, `=HYPERLINK("#gid=${indexSheet.id}","Abrir ficha")` ]
        ]
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar índice:', error);
    throw error;
  }
};

/**
 * Cria a aba de índice
 * @returns {Promise} Promessa que resolve quando a criação é concluída
 */
export const createIndexSheet = async () => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Índice',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10
                }
              }
            }
          }
        ]
      }
    });
    
    const sheetId = response.result.replies[0].addSheet.properties.sheetId;
    
    // Inicializa a estrutura da aba de índice
    await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'Índice!A1:B1',
            values: [
              ['OficinaFácil Gratuito - Versão 2.0']
            ]
          },
          {
            range: 'Índice!A3:B3',
            values: [
              ['Lista de Clientes', 'Ação']
            ]
          },
          {
            range: 'Índice!A6:B6',
            values: [
              ['Funções do Sistema', 'Ação']
            ]
          },
          {
            range: 'Índice!A7:B9',
            values: [
              ['Veículos', '=HYPERLINK("#gid=VeiculosID","Abrir")'],
              ['Ordens de Serviço', '=HYPERLINK("#gid=OsID","Abrir")'],
              ['Financeiro', '=HYPERLINK("#gid=FinanceiroID","Abrir")']
            ]
          }
        ]
      }
    });
    
    // Cria as abas funcionais
    await createFunctionalSheets();
    
    return sheetId;
  } catch (error) {
    console.error('Erro ao criar aba de índice:', error);
    throw error;
  }
};

/**
 * Cria as abas funcionais do sistema
 * @returns {Promise} Promessa que resolve quando a criação é concluída
 */
export const createFunctionalSheets = async () => {
  try {
    // Cria aba de Veículos
    const veiculosResponse = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Veículos',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10
                }
              }
            }
          }
        ]
      }
    });
    
    const veiculosId = veiculosResponse.result.replies[0].addSheet.properties.sheetId;
    
    // Inicializa a estrutura da aba de Veículos
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: 'Veículos!A1:G1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          ['ID', 'Cliente', 'Marca', 'Modelo', 'Ano', 'Placa', 'Data Cadastro']
        ]
      }
    });
    
    // Cria aba de Ordens de Serviço
    const osResponse = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Ordens de Serviço',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 15
                }
              }
            }
          }
        ]
      }
    });
    
    const osId = osResponse.result.replies[0].addSheet.properties.sheetId;
    
    // Inicializa a estrutura da aba de OS
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: 'Ordens de Serviço!A1:K1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          ['ID', 'Cliente', 'Veículo', 'Data Entrada', 'Descrição', 'Serviços', 'Peças', 'Mão de Obra', 'Valor Total', 'Status', 'Última Atualização']
        ]
      }
    });
    
    // Cria aba de Financeiro
    const financeiroResponse = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Financeiro',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10
                }
              }
            }
          }
        ]
      }
    });
    
    const financeiroId = financeiroResponse.result.replies[0].addSheet.properties.sheetId;
    
    // Inicializa a estrutura da aba Financeiro
    await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'Financeiro!A1:B1',
            values: [
              ['Resumo Financeiro']
            ]
          },
          {
            range: 'Financeiro!A3:B6',
            values: [
              ['Total OS em Aberto', '=SUMIF(\'Ordens de Serviço\'!J:J,"Aberta",\'Ordens de Serviço\'!I:I)'],
              ['Total OS Finalizadas', '=SUMIF(\'Ordens de Serviço\'!J:J,"Finalizada",\'Ordens de Serviço\'!I:I)'],
              ['Faturamento Mês Atual', '=SUMIFS(\'Ordens de Serviço\'!I:I,\'Ordens de Serviço\'!J:J,"Paga",\'Ordens de Serviço\'!D:D,">="&TEXT(DATE(YEAR(TODAY()),MONTH(TODAY()),1),"yyyy-mm-dd"))'],
              ['Faturamento Mês Anterior', '=SUMIFS(\'Ordens de Serviço\'!I:I,\'Ordens de Serviço\'!J:J,"Paga",\'Ordens de Serviço\'!D:D,">="&TEXT(DATE(YEAR(TODAY()),MONTH(TODAY())-1,1),"yyyy-mm-dd"),\'Ordens de Serviço\'!D:D,"<"&TEXT(DATE(YEAR(TODAY()),MONTH(TODAY()),1),"yyyy-mm-dd"))']
            ]
          },
          {
            range: 'Financeiro!A8:B8',
            values: [
              ['OS Pendentes de Pagamento']
            ]
          },
          {
            range: 'Financeiro!A9:E9',
            values: [
              ['ID', 'Cliente', 'Data', 'Valor', 'Ação']
            ]
          }
        ]
      }
    });
    
    // Atualiza os links na aba de índice
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: 'Índice!B7:B9',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [`=HYPERLINK("#gid=${veiculosId}","Abrir")`],
          [`=HYPERLINK("#gid=${osId}","Abrir")`],
          [`=HYPERLINK("#gid=${financeiroId}","Abrir")`]
        ]
      }
    });
    
    return {
      veiculosId,
      osId,
      financeiroId
    };
  } catch (error) {
    console.error('Erro ao criar abas funcionais:', error);
    throw error;
  }
};

/**
 * Adiciona um cliente à planilha
 * @param {Object} cliente Dados do cliente
 * @returns {Promise} Promessa que resolve com os dados do cliente adicionado
 */
export const addCliente = async (cliente) => {
  try {
    // Cria uma nova aba para o cliente
    const { sheetTitle } = await createClientSheet(cliente.nome);
    
    // Gera um ID único para o cliente
    const clienteId = `CL${Date.now()}`;
    
    // Adiciona os dados do cliente na aba dele
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `'${sheetTitle}'!A4:E4`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            clienteId,
            cliente.nome,
            cliente.telefone,
            cliente.placaPrincipal,
            new Date().toISOString().split('T')[0]
          ]
        ]
      }
    });
    
    return {
      ...cliente,
      id: clienteId,
      sheetTitle
    };
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error);
    throw error;
  }
};

/**
 * Obtém a lista de clientes
 * @returns {Promise<Array>} Promessa que resolve com a lista de clientes
 */
export const getClientes = async () => {
  try {
    // Obtém a lista de abas
    const sheets = await listSheets();
    const clienteSheets = sheets.filter(sheet => sheet.title.startsWith('Cliente: '));
    
    const clientes = [];
    
    // Para cada aba de cliente, obtém os dados
    for (const sheet of clienteSheets) {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: `'${sheet.title}'!A4:E4`
      });
      
      if (response.result.values && response.result.values.length > 0) {
        const [id, nome, telefone, placaPrincipal, dataCadastro] = response.result.values[0];
        clientes.push({
          id,
          nome,
          telefone,
          placaPrincipal,
          dataCadastro,
          sheetTitle: sheet.title
        });
      }
    }
    
    return clientes;
  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    throw error;
  }
};

/**
 * Adiciona um veículo à planilha
 * @param {Object} veiculo Dados do veículo
 * @param {string} clienteSheetTitle Título da aba do cliente
 * @returns {Promise} Promessa que resolve com os dados do veículo adicionado
 */
export const addVeiculo = async (veiculo, clienteSheetTitle) => {
  try {
    // Gera um ID único para o veículo
    const veiculoId = `VE${Date.now()}`;
    
    // Obtém a próxima linha disponível na aba do cliente
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `'${clienteSheetTitle}'!A8:A`
    });
    
    const rows = response.result.values || [];
    const nextRow = 8 + rows.length;
    
    // Adiciona o veículo na aba do cliente
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `'${clienteSheetTitle}'!A${nextRow}:F${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            veiculoId,
            veiculo.marca,
            veiculo.modelo,
            veiculo.ano,
            veiculo.placa,
            new Date().toISOString().split('T')[0]
          ]
        ]
      }
    });
    
    // Adiciona o veículo na aba de Veículos
    const clienteResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `'${clienteSheetTitle}'!A4:B4`
    });
    
    const [clienteId, clienteNome] = clienteResponse.result.values[0];
    
    const veiculosResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: 'Veículos!A:A'
    });
    
    const veiculosRows = veiculosResponse.result.values || [];
    const nextVeiculoRow = veiculosRows.length + 1;
    
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `Veículos!A${nextVeiculoRow}:G${nextVeiculoRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            veiculoId,
            clienteNome,
            veiculo.marca,
            veiculo.modelo,
            veiculo.ano,
            veiculo.placa,
            new Date().toISOString().split('T')[0]
          ]
        ]
      }
    });
    
    return {
      ...veiculo,
      id: veiculoId,
      cliente_id: clienteId
    };
  } catch (error) {
    console.error('Erro ao adicionar veículo:', error);
    throw error;
  }
};

/**
 * Obtém os veículos de um cliente
 * @param {string} clienteSheetTitle Título da aba do cliente
 * @returns {Promise<Array>} Promessa que resolve com a lista de veículos
 */
export const getVeiculosCliente = async (clienteSheetTitle) => {
  try {
    // Obtém o ID do cliente
    const clienteResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `'${clienteSheetTitle}'!A4:A4`
    });
    
    const clienteId = clienteResponse.result.values[0][0];
    
    // Obtém os veículos da aba do cliente
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `'${clienteSheetTitle}'!A8:F`
    });
    
    const rows = response.result.values || [];
    
    // Pula o cabeçalho
    const veiculos = rows.slice(1).map(row => {
      const [id, marca, modelo, ano, placa, dataCadastro] = row;
      return {
        id,
        cliente_id: clienteId,
        marca,
        modelo,
        ano,
        placa,
        dataCadastro
      };
    });
    
    return veiculos;
  } catch (error) {
    console.error('Erro ao obter veículos do cliente:', error);
    throw error;
  }
};

/**
 * Adiciona uma ordem de serviço
 * @param {Object} os Dados da ordem de serviço
 * @returns {Promise} Promessa que resolve com os dados da OS adicionada
 */
export const addOrdemServico = async (os) => {
  try {
    // Gera um ID único para a OS
    const osId = `OS${Date.now()}`;
    
    // Obtém informações do cliente
    const clienteSheets = await listSheets();
    const clienteSheet = clienteSheets.find(sheet => sheet.title.startsWith('Cliente: ') && sheet.title.includes(os.cliente));
    
    if (!clienteSheet) {
      throw new Error('Cliente não encontrado');
    }
    
    // Formata as peças como string JSON
    const pecasStr = JSON.stringify(os.pecasUtilizadas);
    
    // Adiciona a OS na aba de Ordens de Serviço
    const osResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: 'Ordens de Serviço!A:A'
    });
    
    const osRows = osResponse.result.values || [];
    const nextOsRow = osRows.length + 1;
    
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `Ordens de Serviço!A${nextOsRow}:K${nextOsRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            osId,
            os.cliente,
            os.veiculo,
            os.dataEntrada,
            os.descricaoProblema,
            os.servicosRealizados,
            pecasStr,
            os.valorMaoObra,
            os.valorTotal,
            os.status,
            new Date().toISOString().split('T')[0]
          ]
        ]
      }
    });
    
    // Adiciona a OS no histórico do cliente
    const clienteResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `'${clienteSheet.title}'!A16:A`
    });
    
    const clienteOsRows = clienteResponse.result.values || [];
    const nextClienteOsRow = 16 + clienteOsRows.length;
    
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `'${clienteSheet.title}'!A${nextClienteOsRow}:F${nextClienteOsRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            osId,
            os.dataEntrada,
            os.descricaoProblema,
            os.status,
            os.valorTotal,
            new Date().toISOString().split('T')[0]
          ]
        ]
      }
    });
    
    // Se a OS estiver finalizada, adiciona à lista de pendentes no Financeiro
    if (os.status === 'Finalizada') {
      const financeiroResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: 'Financeiro!A10:A'
      });
      
      const financeiroRows = financeiroResponse.result.values || [];
      const nextFinanceiroRow = 10 + financeiroRows.length;
      
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: getSpreadsheetId(),
        range: `Financeiro!A${nextFinanceiroRow}:E${nextFinanceiroRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [
            [
              osId,
              os.cliente,
              os.dataEntrada,
              os.valorTotal,
              'Marcar como Paga'
            ]
          ]
        }
      });
    }
    
    return {
      ...os,
      id: osId
    };
  } catch (error) {
    console.error('Erro ao adicionar ordem de serviço:', error);
    throw error;
  }
};

/**
 * Atualiza o status de uma ordem de serviço
 * @param {string} osId ID da ordem de serviço
 * @param {string} novoStatus Novo status da OS
 * @returns {Promise} Promessa que resolve quando a atualização é concluída
 */
export const atualizarStatusOS = async (osId, novoStatus) => {
  try {
    // Busca a OS na planilha
    const osResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: 'Ordens de Serviço!A:K'
    });
    
    const osRows = osResponse.result.values || [];
    let osRowIndex = -1;
    let osData = null;
    
    for (let i = 1; i < osRows.length; i++) {
      if (osRows[i][0] === osId) {
        osRowIndex = i + 1; // +1 porque as linhas começam em 1, não 0
        osData = {
          id: osRows[i][0],
          cliente: osRows[i][1],
          veiculo: osRows[i][2],
          dataEntrada: osRows[i][3],
          descricaoProblema: osRows[i][4],
          servicosRealizados: osRows[i][5],
          pecasUtilizadas: osRows[i][6],
          valorMaoObra: osRows[i][7],
          valorTotal: osRows[i][8],
          status: osRows[i][9],
          ultimaAtualizacao: osRows[i][10]
        };
        break;
      }
    }
    
    if (osRowIndex === -1) {
      throw new Error('Ordem de serviço não encontrada');
    }
    
    // Atualiza o status na aba de Ordens de Serviço
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `Ordens de Serviço!J${osRowIndex}:K${osRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            novoStatus,
            new Date().toISOString().split('T')[0]
          ]
        ]
      }
    });
    
    // Busca a OS na aba do cliente
    const clienteSheets = await listSheets();
    const clienteSheet = clienteSheets.find(sheet => sheet.title.startsWith('Cliente: ') && sheet.title.includes(osData.cliente));
    
    if (clienteSheet) {
      const clienteOsResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: `'${clienteSheet.title}'!A16:F`
      });
      
      const clienteOsRows = clienteOsResponse.result.values || [];
      let clienteOsRowIndex = -1;
      
      for (let i = 1; i < clienteOsRows.length; i++) {
        if (clienteOsRows[i][0] === osId) {
          clienteOsRowIndex = i + 16; // +16 porque começamos da linha 16
          break;
        }
      }
      
      if (clienteOsRowIndex !== -1) {
        // Atualiza o status na aba do cliente
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: getSpreadsheetId(),
          range: `'${clienteSheet.title}'!D${clienteOsRowIndex}:F${clienteOsRowIndex}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [
              [
                novoStatus,
                osData.valorTotal,
                new Date().toISOString().split('T')[0]
              ]
            ]
          }
        });
      }
    }
    
    // Se o status mudou para "Finalizada", adiciona à lista de pendentes no Financeiro
    if (novoStatus === 'Finalizada' && osData.status !== 'Finalizada') {
      const financeiroResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: 'Financeiro!A10:A'
      });
      
      const financeiroRows = financeiroResponse.result.values || [];
      const nextFinanceiroRow = 10 + financeiroRows.length;
      
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: getSpreadsheetId(),
        range: `Financeiro!A${nextFinanceiroRow}:E${nextFinanceiroRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [
            [
              osId,
              osData.cliente,
              osData.dataEntrada,
              osData.valorTotal,
              'Marcar como Paga'
            ]
          ]
        }
      });
    }
    
    // Se o status mudou para "Paga", remove da lista de pendentes no Financeiro
    if (novoStatus === 'Paga') {
      const financeiroResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: 'Financeiro!A10:A'
      });
      
      const financeiroRows = financeiroResponse.result.values || [];
      let financeiroRowIndex = -1;
      
      for (let i = 0; i < financeiroRows.length; i++) {
        if (financeiroRows[i][0] === osId) {
          financeiroRowIndex = i + 10; // +10 porque começamos da linha 10
          break;
        }
      }
      
      if (financeiroRowIndex !== -1) {
        // Remove a OS da lista de pendentes
        await window.gapi.client.sheets.spreadsheets.values.clear({
          spreadsheetId: getSpreadsheetId(),
          range: `Financeiro!A${financeiroRowIndex}:E${financeiroRowIndex}`
        });
      }
    }
    
    return {
      ...osData,
      status: novoStatus,
      ultimaAtualizacao: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Erro ao atualizar status da OS:', error);
    throw error;
  }
};

/**
 * Obtém todas as ordens de serviço
 * @param {string} filtroStatus Filtro opcional por status
 * @returns {Promise<Array>} Promessa que resolve com a lista de ordens de serviço
 */
export const getOrdensServico = async (filtroStatus = null) => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: 'Ordens de Serviço!A:K'
    });
    
    const rows = response.result.values || [];
    
    // Pula o cabeçalho
    let ordens = rows.slice(1).map(row => {
      const [id, cliente, veiculo, dataEntrada, descricaoProblema, servicosRealizados, pecasUtilizadas, valorMaoObra, valorTotal, status, ultimaAtualizacao] = row;
      
      // Converte as peças de string JSON para objeto
      let pecas = [];
      try {
        pecas = JSON.parse(pecasUtilizadas);
      } catch (e) {
        console.warn('Erro ao parsear peças:', e);
      }
      
      return {
        id,
        cliente,
        veiculo,
        dataEntrada,
        descricaoProblema,
        servicosRealizados,
        pecasUtilizadas: pecas,
        valorMaoObra: parseFloat(valorMaoObra),
        valorTotal: parseFloat(valorTotal),
        status,
        ultimaAtualizacao
      };
    });
    
    // Aplica filtro por status, se fornecido
    if (filtroStatus) {
      ordens = ordens.filter(os => os.status === filtroStatus);
    }
    
    return ordens;
  } catch (error) {
    console.error('Erro ao obter ordens de serviço:', error);
    throw error;
  }
};

/**
 * Obtém o resumo financeiro
 * @returns {Promise<Object>} Promessa que resolve com o resumo financeiro
 */
export const getResumoFinanceiro = async () => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: 'Financeiro!A3:B6'
    });
    
    const rows = response.result.values || [];
    
    // Extrai os valores do resumo
    const resumo = {
      totalOSAberto: parseFloat(rows[0][1] || 0),
      totalOSFinalizada: parseFloat(rows[1][1] || 0),
      faturamentoMesAtual: parseFloat(rows[2][1] || 0),
      faturamentoMesAnterior: parseFloat(rows[3][1] || 0)
    };
    
    // Obtém as OS pendentes de pagamento
    const pendentesResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: 'Financeiro!A10:D'
    });
    
    const pendentesRows = pendentesResponse.result.values || [];
    
    const osPendentes = pendentesRows.map(row => {
      const [id, cliente, data, valor] = row;
      return {
        id,
        cliente,
        data,
        valor: parseFloat(valor)
      };
    }).filter(os => os.id); // Filtra linhas vazias
    
    return {
      resumo,
      osPendentes
    };
  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error);
    throw error;
  }
};

/**
 * Cria uma nova planilha para o sistema
 * @param {string} nome Nome da planilha
 * @returns {Promise<string>} Promessa que resolve com o ID da planilha criada
 */
export const criarNovaPlanilha = async (nome) => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.create({
      resource: {
        properties: {
          title: `OficinaFácil - ${nome}`
        }
      }
    });
    
    const spreadsheetId = response.result.spreadsheetId;
    
    // Salva o ID da planilha
    setSpreadsheetId(spreadsheetId);
    
    // Inicializa a estrutura básica
    await createIndexSheet();
    
    return spreadsheetId;
  } catch (error) {
    console.error('Erro ao criar nova planilha:', error);
    throw error;
  }
};

/**
 * Verifica se o usuário tem permissão para editar a planilha
 * @returns {Promise<boolean>} Promessa que resolve com o status de permissão
 */
export const verificarPermissao = async () => {
  try {
    // Tenta fazer uma pequena alteração na planilha
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['Teste de permissão']]
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erro de permissão:', error);
    return false;
  }
};

/**
 * Salva dados no cache local para funcionamento offline
 * @param {string} key Chave do cache
 * @param {any} data Dados a serem salvos
 */
export const salvarCache = (key, data) => {
  try {
    localStorage.setItem(`oficinafacil_cache_${key}`, JSON.stringify(data));
    localStorage.setItem(`oficinafacil_cache_${key}_timestamp`, Date.now().toString());
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
  }
};

/**
 * Recupera dados do cache local
 * @param {string} key Chave do cache
 * @returns {any} Dados recuperados do cache
 */
export const recuperarCache = (key) => {
  try {
    const data = localStorage.getItem(`oficinafacil_cache_${key}`);
    const timestamp = localStorage.getItem(`oficinafacil_cache_${key}_timestamp`);
    
    if (!data) return null;
    
    return {
      data: JSON.parse(data),
      timestamp: parseInt(timestamp || '0')
    };
  } catch (error) {
    console.error('Erro ao recuperar cache:', error);
    return null;
  }
};

/**
 * Verifica se o cache está atualizado
 * @param {string} key Chave do cache
 * @param {number} maxAge Idade máxima do cache em milissegundos
 * @returns {boolean} Status de atualização do cache
 */
export const cacheAtualizado = (key, maxAge = 3600000) => { // 1 hora por padrão
  try {
    const timestamp = localStorage.getItem(`oficinafacil_cache_${key}_timestamp`);
    if (!timestamp) return false;
    
    const age = Date.now() - parseInt(timestamp);
    return age < maxAge;
  } catch (error) {
    console.error('Erro ao verificar cache:', error);
    return false;
  }
};

/**
 * Sincroniza dados offline com a planilha
 * @returns {Promise} Promessa que resolve quando a sincronização é concluída
 */
export const sincronizarDadosOffline = async () => {
  try {
    // Verifica se há conexão com a API
    if (!window.navigator.onLine || !window.gapi || !window.gapi.client) {
      return { success: false, message: 'Sem conexão com a internet' };
    }
    
    // Recupera operações pendentes
    const operacoesPendentes = JSON.parse(localStorage.getItem('oficinafacil_operacoes_pendentes') || '[]');
    
    if (operacoesPendentes.length === 0) {
      return { success: true, message: 'Nenhuma operação pendente' };
    }
    
    // Processa cada operação pendente
    const resultados = [];
    
    for (const operacao of operacoesPendentes) {
      try {
        switch (operacao.tipo) {
          case 'addCliente':
            await addCliente(operacao.dados);
            resultados.push({ success: true, operacao: operacao.tipo });
            break;
          case 'addVeiculo':
            await addVeiculo(operacao.dados, operacao.clienteSheetTitle);
            resultados.push({ success: true, operacao: operacao.tipo });
            break;
          case 'addOrdemServico':
            await addOrdemServico(operacao.dados);
            resultados.push({ success: true, operacao: operacao.tipo });
            break;
          case 'atualizarStatusOS':
            await atualizarStatusOS(operacao.osId, operacao.novoStatus);
            resultados.push({ success: true, operacao: operacao.tipo });
            break;
          default:
            resultados.push({ success: false, operacao: operacao.tipo, message: 'Tipo de operação desconhecido' });
        }
      } catch (error) {
        resultados.push({ success: false, operacao: operacao.tipo, message: error.message });
      }
    }
    
    // Limpa operações processadas com sucesso
    const operacoesRestantes = operacoesPendentes.filter((_, index) => !resultados[index].success);
    localStorage.setItem('oficinafacil_operacoes_pendentes', JSON.stringify(operacoesRestantes));
    
    return {
      success: true,
      message: `${resultados.filter(r => r.success).length} operações sincronizadas, ${operacoesRestantes.length} pendentes`,
      resultados
    };
  } catch (error) {
    console.error('Erro ao sincronizar dados offline:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Adiciona uma operação à fila de pendências para sincronização posterior
 * @param {string} tipo Tipo da operação
 * @param {Object} dados Dados da operação
 */
export const adicionarOperacaoPendente = (tipo, dados) => {
  try {
    const operacoesPendentes = JSON.parse(localStorage.getItem('oficinafacil_operacoes_pendentes') || '[]');
    operacoesPendentes.push({ tipo, dados, timestamp: Date.now() });
    localStorage.setItem('oficinafacil_operacoes_pendentes', JSON.stringify(operacoesPendentes));
  } catch (error) {
    console.error('Erro ao adicionar operação pendente:', error);
  }
};

/**
 * Verifica se há operações pendentes
 * @returns {number} Número de operações pendentes
 */
export const contarOperacoesPendentes = () => {
  try {
    const operacoesPendentes = JSON.parse(localStorage.getItem('oficinafacil_operacoes_pendentes') || '[]');
    return operacoesPendentes.length;
  } catch (error) {
    console.error('Erro ao contar operações pendentes:', error);
    return 0;
  }
};
