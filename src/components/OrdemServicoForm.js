import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { useNavigate } from 'react-router-dom';

const OrdemServicoForm = () => {
  const [cliente, setCliente] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [descricaoProblema, setDescricaoProblema] = useState('');
  const [servicosRealizados, setServicosRealizados] = useState('');
  const [pecasUtilizadas, setPecasUtilizadas] = useState([{ nome: '', valor: '' }]);
  const [valorMaoObra, setValorMaoObra] = useState('');
  const [valorTotal, setValorTotal] = useState('0.00');
  
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const { isSignedIn, obterClientes, obterVeiculosCliente, adicionarOrdemServico } = useGoogleSheets();
  const navigate = useNavigate();

  // Inicializa a data de entrada com a data atual
  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataEntrada(hoje);
  }, []);

  // Carrega os clientes quando o componente é montado
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

  // Carrega os veículos quando um cliente é selecionado
  useEffect(() => {
    if (!cliente) {
      setVeiculos([]);
      setVeiculo('');
      return;
    }

    const carregarVeiculos = async () => {
      try {
        const clienteSelecionado = clientes.find(c => c.id === cliente);
        if (clienteSelecionado) {
          const listaVeiculos = await obterVeiculosCliente(clienteSelecionado.sheetTitle);
          setVeiculos(listaVeiculos);
          
          // Se houver apenas um veículo, seleciona automaticamente
          if (listaVeiculos.length === 1) {
            setVeiculo(listaVeiculos[0].id);
          } else {
            setVeiculo('');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar veículos:', error);
        setErro('Falha ao carregar veículos. Tente novamente.');
      }
    };

    carregarVeiculos();
  }, [cliente, clientes, obterVeiculosCliente]);

  // Calcula o valor total sempre que as peças ou mão de obra mudam
  useEffect(() => {
    const valorPecas = pecasUtilizadas.reduce((total, peca) => {
      const valor = parseFloat(peca.valor) || 0;
      return total + valor;
    }, 0);
    
    const valorMaoObraNum = parseFloat(valorMaoObra) || 0;
    const total = valorPecas + valorMaoObraNum;
    
    setValorTotal(total.toFixed(2));
  }, [pecasUtilizadas, valorMaoObra]);

  const handleAddPeca = () => {
    setPecasUtilizadas([...pecasUtilizadas, { nome: '', valor: '' }]);
  };

  const handleRemovePeca = (index) => {
    const novasPecas = [...pecasUtilizadas];
    novasPecas.splice(index, 1);
    setPecasUtilizadas(novasPecas);
  };

  const handlePecaChange = (index, campo, valor) => {
    const novasPecas = [...pecasUtilizadas];
    novasPecas[index][campo] = valor;
    setPecasUtilizadas(novasPecas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!cliente || !veiculo || !dataEntrada || !descricaoProblema) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    setErro('');
    setSucesso(false);

    try {
      // Filtra peças vazias
      const pecasFiltradas = pecasUtilizadas.filter(peca => peca.nome.trim() !== '' && peca.valor.trim() !== '');
      
      // Prepara os dados da OS
      const clienteSelecionado = clientes.find(c => c.id === cliente);
      const veiculoSelecionado = veiculos.find(v => v.id === veiculo);
      
      const novaOS = {
        cliente: clienteSelecionado.nome,
        veiculo: `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo} (${veiculoSelecionado.placa})`,
        dataEntrada,
        descricaoProblema,
        servicosRealizados,
        pecasUtilizadas: pecasFiltradas,
        valorMaoObra: parseFloat(valorMaoObra) || 0,
        valorTotal: parseFloat(valorTotal),
        status: 'Aberta'
      };

      const resultado = await adicionarOrdemServico(novaOS);
      
      if (resultado) {
        setSucesso(true);
        // Limpa o formulário
        setDescricaoProblema('');
        setServicosRealizados('');
        setPecasUtilizadas([{ nome: '', valor: '' }]);
        setValorMaoObra('');
        
        // Redireciona após 2 segundos
        setTimeout(() => {
          navigate('/ordens');
        }, 2000);
      } else {
        setErro('Falha ao cadastrar ordem de serviço. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar ordem de serviço:', error);
      setErro(`Erro ao cadastrar ordem de serviço: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nova Ordem de Serviço</h1>
        
        {erro && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Ordem de serviço cadastrada com sucesso! Redirecionando...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isSaving || sucesso}
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="veiculo" className="block text-sm font-medium text-gray-700 mb-1">
                Veículo *
              </label>
              <select
                id="veiculo"
                value={veiculo}
                onChange={(e) => setVeiculo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={!cliente || isSaving || sucesso}
                required
              >
                <option value="">Selecione um veículo</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} - {v.placa}
                  </option>
                ))}
              </select>
              {cliente && veiculos.length === 0 && (
                <p className="mt-1 text-sm text-red-500">
                  Este cliente não possui veículos cadastrados.{' '}
                  <button
                    type="button"
                    onClick={() => navigate(`/veiculos/novo/${cliente}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Cadastrar veículo
                  </button>
                </p>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="dataEntrada" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Entrada *
            </label>
            <input
              type="date"
              id="dataEntrada"
              value={dataEntrada}
              onChange={(e) => setDataEntrada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isSaving || sucesso}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="descricaoProblema" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Problema *
            </label>
            <textarea
              id="descricaoProblema"
              value={descricaoProblema}
              onChange={(e) => setDescricaoProblema(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva o problema relatado pelo cliente"
              disabled={isSaving || sucesso}
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label htmlFor="servicosRealizados" className="block text-sm font-medium text-gray-700 mb-1">
              Serviços Realizados
            </label>
            <textarea
              id="servicosRealizados"
              value={servicosRealizados}
              onChange={(e) => setServicosRealizados(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva os serviços realizados (pode ser preenchido depois)"
              disabled={isSaving || sucesso}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Peças Utilizadas
              </label>
              <button
                type="button"
                onClick={handleAddPeca}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={isSaving || sucesso}
              >
                + Adicionar peça
              </button>
            </div>
            
            {pecasUtilizadas.map((peca, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={peca.nome}
                  onChange={(e) => handlePecaChange(index, 'nome', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome da peça"
                  disabled={isSaving || sucesso}
                />
                <div className="relative w-32">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    value={peca.valor}
                    onChange={(e) => handlePecaChange(index, 'valor', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    disabled={isSaving || sucesso}
                  />
                </div>
                {pecasUtilizadas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePeca(index)}
                    className="px-2 py-2 text-red-600 hover:text-red-800"
                    disabled={isSaving || sucesso}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="valorMaoObra" className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Mão de Obra (R$)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  id="valorMaoObra"
                  value={valorMaoObra}
                  onChange={(e) => setValorMaoObra(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  disabled={isSaving || sucesso}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="valorTotal" className="block text-sm font-medium text-gray-700 mb-1">
                Valor Total (R$)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="text"
                  id="valorTotal"
                  value={valorTotal}
                  className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Calculado automaticamente (peças + mão de obra)
              </p>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/ordens')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              disabled={isSaving || sucesso}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={isSaving || sucesso || !cliente || !veiculo}
            >
              {isSaving ? 'Cadastrando...' : 'Cadastrar OS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrdemServicoForm;
