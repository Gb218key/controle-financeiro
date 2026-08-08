import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Edit2,
  History,
  Phone,
  MessageCircle,
  MapPin,
  FileText,
  Trash2,
  X,
  Check,
  AlertCircle,
  Building,
  Image as ImageIcon,
  DollarSign,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Cliente, StatusCliente } from '../types';

interface ClientesViewProps {
  initialOpenNovo?: boolean;
}

export const ClientesView: React.FC<ClientesViewProps> = ({ initialOpenNovo }) => {
  const {
    clientes,
    addCliente,
    updateCliente,
    deleteCliente,
    emprestimos,
    deleteEmprestimo,
    pagamentos,
    selectedClienteForHistory,
    setSelectedClienteForHistory,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(initialOpenNovo || false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [fotoDocumento, setFotoDocumento] = useState('');
  const [observacao, setObservacao] = useState('');
  const [status, setStatus] = useState<StatusCliente>('Ativo');

  const openNovoModal = () => {
    setEditingCliente(null);
    setNome('');
    setCpf('');
    setRg('');
    setTelefone('');
    setWhatsapp('');
    setEndereco('');
    setCidade('');
    setEstado('SP');
    setFotoDocumento('');
    setObservacao('');
    setStatus('Ativo');
    setIsModalOpen(true);
  };

  const openEditarModal = (cli: Cliente) => {
    setEditingCliente(cli);
    setNome(cli.nome);
    setCpf(cli.cpf);
    setRg(cli.rg);
    setTelefone(cli.telefone);
    setWhatsapp(cli.whatsapp);
    setEndereco(cli.endereco);
    setCidade(cli.cidade);
    setEstado(cli.estado);
    setFotoDocumento(cli.fotoDocumento || '');
    setObservacao(cli.observacao || '');
    setStatus(cli.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !cpf) return;

    if (editingCliente) {
      updateCliente(editingCliente.id, {
        nome,
        cpf,
        rg,
        telefone,
        whatsapp,
        endereco,
        cidade,
        estado,
        fotoDocumento,
        observacao,
        status,
      });
    } else {
      addCliente({
        nome,
        cpf,
        rg,
        telefone,
        whatsapp: whatsapp || telefone,
        endereco,
        cidade,
        estado,
        fotoDocumento,
        observacao,
        status,
      });
    }

    setIsModalOpen(false);
  };

  // Document photo handler (file upload or URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoDocumento(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtering
  const clientesFiltrados = clientes.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search) ||
      c.telefone.includes(search);

    const matchesStatus =
      statusFilter === 'TODOS' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Gestão de Clientes</h2>
          <p className="text-xs text-zinc-400">
            Cadastre, edite e consulte o histórico financeiro dos mutuários.
          </p>
        </div>

        <button
          onClick={openNovoModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-amber-500/10 transition-all hover:brightness-110"
        >
          <UserPlus className="h-4 w-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nome, CPF ou Telefone..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['TODOS', 'Ativo', 'Inadimplente', 'Quitado', 'Inativo'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Clientes Table */}
      <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Cliente / Documentos</th>
                <th className="py-3 px-4">Contato / WhatsApp</th>
                <th className="py-3 px-4">Endereço & Localidade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cli) => {
                  let statusBadge = (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      🟢 Ativo
                    </span>
                  );
                  if (cli.status === 'Inadimplente') {
                    statusBadge = (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/20">
                        🔴 Inadimplente
                      </span>
                    );
                  } else if (cli.status === 'Quitado') {
                    statusBadge = (
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                        🔵 Quitado
                      </span>
                    );
                  } else if (cli.status === 'Inativo') {
                    statusBadge = (
                      <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-400">
                        ⚪ Inativo
                      </span>
                    );
                  }

                  const formatPhoneForWA = (cli.whatsapp || cli.telefone).replace(/\D/g, '');

                  return (
                    <tr key={cli.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                            {cli.nome.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-100">{cli.nome}</div>
                            <div className="text-[10px] text-zinc-400">
                              CPF: {cli.cpf} {cli.rg && `| RG: ${cli.rg}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{cli.telefone}</span>
                        </div>
                        {cli.whatsapp && (
                          <a
                            href={`https://wa.me/${formatPhoneForWA}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline mt-0.5"
                          >
                            <MessageCircle className="h-3 w-3" />
                            Abrir WhatsApp
                          </a>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                          <span className="truncate max-w-[200px]">{cli.endereco}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 pl-5">
                          {cli.cidade} - {cli.estado}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{statusBadge}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedClienteForHistory(cli)}
                            className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/10"
                            title="Ver Histórico de Empréstimos"
                          >
                            <History className="h-3.5 w-3.5" />
                            Histórico
                          </button>

                          <button
                            onClick={() => openEditarModal(cli)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400"
                            title="Editar Cliente"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir o cliente ${cli.nome}?`)) {
                                deleteCliente(cli.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-950 hover:text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Novo / Editar Cliente Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-400" />
                {editingCliente ? 'Editar Cadastro do Cliente' : 'Novo Cadastro de Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    RG
                  </label>
                  <input
                    type="text"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                    placeholder="00.000.000-0"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Telefone Principal
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    WhatsApp (Envio automático de cobranças)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="5511999998888"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Status do Cliente
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusCliente)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inadimplente">Inadimplente</option>
                    <option value="Quitado">Quitado</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, Número, Bairro, Complemento"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Document photo upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Foto do Documento (RG / CNH)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-400 hover:file:bg-zinc-700"
                    />
                  </div>
                  {fotoDocumento && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={fotoDocumento}
                        alt="Foto Documento"
                        className="h-16 w-24 rounded-lg object-cover border border-amber-500/40"
                      />
                      <span className="text-[11px] text-emerald-400">
                        Foto carregada com sucesso
                      </span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Observações Internas
                  </label>
                  <textarea
                    rows={2}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Histórico comercial, referências bancárias, hábitos de pagamento..."
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:brightness-110"
                >
                  {editingCliente ? 'Atualizar Cliente' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Histórico Modal */}
      {selectedClienteForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase">
                  Histórico do Mutuário
                </span>
                <h3 className="text-lg font-bold text-zinc-100">
                  {selectedClienteForHistory.nome}
                </h3>
                <span className="text-xs text-zinc-400">
                  CPF: {selectedClienteForHistory.cpf} • Telefone: {selectedClienteForHistory.telefone}
                </span>
              </div>
              <button
                onClick={() => setSelectedClienteForHistory(null)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Client summary box */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs">
              <div>
                <span className="text-zinc-500 block">Endereço</span>
                <span className="text-zinc-200 font-medium">
                  {selectedClienteForHistory.endereco}, {selectedClienteForHistory.cidade}/{selectedClienteForHistory.estado}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Status Cadastral</span>
                <span className="text-amber-400 font-bold">
                  {selectedClienteForHistory.status}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Observações</span>
                <span className="text-zinc-300 italic">
                  {selectedClienteForHistory.observacao || 'Sem observações cadastradas.'}
                </span>
              </div>
            </div>

            {/* Document photo if present */}
            {selectedClienteForHistory.fotoDocumento && (
              <div className="mt-3">
                <span className="text-xs font-semibold text-zinc-400 block mb-1">
                  Documento Anexado
                </span>
                <img
                  src={selectedClienteForHistory.fotoDocumento}
                  alt="Documento"
                  className="h-28 rounded-xl object-cover border border-amber-500/30"
                />
              </div>
            )}

            {/* Loan History List */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-400" />
                Empréstimos Concedidos
              </h4>

              {emprestimos.filter((e) => e.clienteID === selectedClienteForHistory.id).length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center bg-zinc-950 rounded-xl">
                  Nenhum empréstimo registrado para este cliente.
                </p>
              ) : (
                <div className="space-y-4">
                  {emprestimos
                    .filter((e) => e.clienteID === selectedClienteForHistory.id)
                    .map((emp) => (
                      <div
                        key={emp.id}
                        className="rounded-xl border border-amber-500/20 bg-zinc-950 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between text-xs border-b border-zinc-800 pb-2">
                          <div>
                            <span className="font-bold text-amber-300">
                              Empréstimo R$ {emp.valorEmprestado.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-zinc-500 text-[10px] ml-2">
                              (Juros: {emp.juros}% {emp.tipoJuros} • Total: R$ {emp.valorTotal.toLocaleString('pt-BR')})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir o empréstimo #${emp.id}? Os indicadores do Painel de Controle serão recalculados.`)) {
                                  deleteEmprestimo(emp.id);
                                }
                              }}
                              title="Excluir empréstimo inserido por erro"
                              className="rounded bg-red-950/60 border border-red-500/40 px-2 py-0.5 text-red-300 hover:bg-red-900 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                              Excluir
                            </button>
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 font-bold text-amber-400 border border-amber-500/30">
                              {emp.status}
                            </span>
                          </div>
                        </div>

                        {/* Installment detail */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          {(emp.parcelas || []).map((par) => (
                            <div
                              key={par.id}
                              className={`rounded-lg border p-2 ${
                                par.status === 'Pago'
                                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                                  : par.status === 'Atrasado'
                                  ? 'border-red-500/30 bg-red-950/20 text-red-300'
                                  : 'border-zinc-800 bg-zinc-900 text-zinc-300'
                              }`}
                            >
                              <div className="font-bold">Parcela #{par.numero}</div>
                              <div>Venc: {par.vencimento}</div>
                              <div className="font-extrabold text-amber-300">
                                R$ {par.valorParcela.toLocaleString('pt-BR')}
                              </div>
                              <div className="text-[9px] uppercase mt-0.5 font-bold">
                                {par.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
              <button
                onClick={() => setSelectedClienteForHistory(null)}
                className="rounded-xl bg-zinc-800 px-5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
              >
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
