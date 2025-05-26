import React, { useState, useEffect } from 'react';
import { useGoogleSheets } from '../lib/GoogleSheetsContext';
import { useNavigate, useParams } from 'react-router-dom';

const VeiculoForm = () => {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [cliente, setCliente] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const { clienteId } = useParams();
  const { isSignedIn, obterClientes, adicionarVeiculo } = useGoogleSheets();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/setup');
      return;
    }

    const carregarDados = async () => {
      setIsLoading(true);
      try {
        // Carrega a lista de clientes
        const listaClientes = await obterClientes();
        setClientes(listaClientes);
        
        // Se tiver um clienteId na URL, seleciona esse cliente
        if (clienteId) {
          const clienteSelecionado = listaClientes.find(c => c.id === clienteId);
          if (clienteSelecionado) {
            setCliente(clienteSelecionado);
          } else {
            setErro('Cliente não encontrado.');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setErro('Falha ao carregar dados. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [isSignedIn, clienteId, obterClientes, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cliente) {
      setErro('Selecione um cliente.');
      return;
    }

    // Validação básica
    if (!marca.trim() || !modelo.trim() || !ano.trim() || !placa.trim()) {
      setErro('Todos os campos são obrigatórios.');
      return;
    }

    setIsSaving(true);
    setErro('');
    setSucesso(false);

    try {
      const novoVeiculo = {
        marca,
        modelo,
        ano,
        placa: placa.toUpperCase(),
        cliente_id: cliente.id
      };

      const resultado = await adicionarVeiculo(novoVeiculo, cliente.sheetTitle);
      
      if (resultado) {
        setSucesso(true);
        // Limpa o formulário
        setMarca('');
        setModelo('');
        setAno('');
        setPlaca('');
        
        // Redireciona após 2 segundos
        setTimeout(() => {
          navigate(`/clientes/${cliente.id}`);
        }, 2000);
      } else {
        setErro('Falha ao cadastrar veículo. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      setErro(`Erro ao cadastrar veículo: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClienteChange = (e) => {
    const clienteSelecionado = clientes.find(c => c.id === e.target.value);
    setCliente(clienteSelecionado);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Novo Veículo</h1>
        
        {erro && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {erro}
          </div>
        )}
        
        {sucesso && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Veículo cadastrado com sucesso! Redirecionando...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {!clienteId && (
            <div className="mb-4">
              <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                id="cliente"
                value={cliente?.id || ''}
                onChange={handleClienteChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isSaving || sucesso || clienteId}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}
          
          {clienteId && cliente && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-gray-700">
                Cliente: <span className="font-medium">{cliente.nome}</span>
              </p>
              <p className="text-sm text-gray-700">
                Telefone: <span className="font-medium">{cliente.telefone}</span>
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              type="text"
              id="marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Toyota"
              disabled={isSaving || sucesso}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              type="text"
              id="modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Corolla"
              disabled={isSaving || sucesso}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="ano" className="block text-sm font-medium text-gray-700 mb-1">
              Ano
            </label>
            <input
              type="text"
              id="ano"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 2020"
              disabled={isSaving || sucesso}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="placa" className="block text-sm font-medium text-gray-700 mb-1">
              Placa
            </label>
            <input
              type="text"
              id="placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: ABC1234"
              disabled={isSaving || sucesso}
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate(clienteId ? `/clientes/${clienteId}` : '/veiculos')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              disabled={isSaving || sucesso}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={isSaving || sucesso || !cliente}
            >
              {isSaving ? 'Cadastrando...' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VeiculoForm;
