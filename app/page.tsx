"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Registro {
  id: number;
  nome: string;
  data: string;
  entrada: string;
  saida: string;
}

export default function FolhaDePonto() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');

  const [formData, setFormData] = useState({ 
    nome: '', 
    data: new Date().toISOString().split('T')[0], 
    entrada: '', 
    saida: '' 
  });
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);

  const carregarDados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registros_ponto')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setRegistros(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const dadosParaEnviar = { ...formData };

    if (isEditing !== null) {
      const { error } = await supabase.from('registros_ponto').update(dadosParaEnviar).eq('id', isEditing);
      if (!error) {
        setIsEditing(null);
        alert("Atualizado com sucesso!");
      }
    } else {
      const { error } = await supabase.from('registros_ponto').insert([dadosParaEnviar]);
      if (!error) alert("Ponto registrado!");
    }
    
    setFormData({ ...formData, entrada: '', saida: '' });
    await carregarDados(); 
  };

  const verificarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaInput === 'artesanato2025') {
      setAutenticado(true);
      carregarDados(); // Recarrega ao logar para garantir a exibição
    } else {
      alert("Senha incorreta!");
      setSenhaInput('');
    }
  };

  const excluirRegistro = async (id: number) => {
    if (confirm("Excluir este registro?")) {
      await supabase.from('registros_ponto').delete().eq('id', id);
      carregarDados();
    }
  };

  // FILTRO CORRIGIDO - Limpa as strings para comparar apenas YYYY-MM-DD
  const registrosExibidos = registros.filter(reg => {
    if (!reg.data) return false;
    const dataLimpaBanco = reg.data.split('T')[0].trim();
    const dataLimpaFiltro = filtroData.split('T')[0].trim();
    return dataLimpaBanco === dataLimpaFiltro;
  });

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text('Arte Mãos e Flores - Relatório', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Nome', 'Data', 'Entrada', 'Saída']],
      body: registrosExibidos.map(r => [r.nome, r.data, r.entrada, r.saida]),
    });
    doc.save(`ponto-${filtroData}.pdf`);
  };

  return (
    <main className="container py-5">
      <div className="text-center mb-5">
        <Image src="/logo.png" alt="Logo" width={70} height={70} className="mb-3 rounded-circle" 
               onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1 className="text-success fw-bold">Arte Mãos e Flores</h1>
        {loading && <div className="spinner-border text-success spinner-border-sm"></div>}
      </div>

      <div className="row g-4">
        {/* FORMULÁRIO (ESQUERDA) */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0">
            <div className={`card-header ${isEditing ? 'bg-primary' : 'bg-success'} text-white fw-bold py-3 text-center`}>
              {isEditing ? 'EDITANDO PONTO' : 'REGISTRAR PONTO'}
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Nome do Colaborador</label>
                  <input type="text" className="form-control" required value={formData.nome}
                         onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Data</label>
                  <input type="date" className="form-control" required value={formData.data}
                         onChange={e => setFormData({...formData, data: e.target.value})} />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label small fw-bold">Entrada</label>
                    <input type="time" className="form-control" required value={formData.entrada}
                           onChange={e => setFormData({...formData, entrada: e.target.value})} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label small fw-bold">Saída</label>
                    <input type="time" className="form-control" required value={formData.saida}
                           onChange={e => setFormData({...formData, saida: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className={`btn ${isEditing ? 'btn-primary' : 'btn-success'} w-100 fw-bold`}>
                  {isEditing ? 'SALVAR ALTERAÇÕES' : 'BATER PONTO'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ÁREA ADMINISTRATIVA (DIREITA) */}
        <div className="col-lg-8">
          {!autenticado ? (
            <div className="card shadow-sm border-0 p-5 text-center bg-light border-top border-success border-4">
              <h5 className="text-dark fw-bold mb-3">Área de Visualização</h5>
              <p className="small text-muted mb-4">Apenas para administradores.</p>
              <form onSubmit={verificarSenha} className="d-flex justify-content-center gap-2">
                <input type="password" placeholder="Senha..." className="form-control w-50"
                       value={senhaInput} onChange={e => setSenhaInput(e.target.value)} />
                <button className="btn btn-dark fw-bold">Ver Dados</button>
              </form>
            </div>
          ) : (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <h6 className="mb-0 fw-bold text-success">HISTÓRICO DO DIA</h6>
                <div className="d-flex gap-2">
                  <input type="date" className="form-control form-control-sm" 
                         value={filtroData} onChange={e => setFiltroData(e.target.value)} />
                  <button onClick={() => setAutenticado(false)} className="btn btn-sm btn-outline-danger">Sair</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle text-center mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase">
                      <th className="text-start ps-4">Nome</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosExibidos.length > 0 ? (
                      registrosExibidos.map(reg => (
                        <tr key={reg.id}>
                          <td className="text-start ps-4 fw-bold text-dark">{reg.nome}</td>
                          <td>{reg.entrada}</td>
                          <td>{reg.saida}</td>
                          <td>
                            <button onClick={() => excluirRegistro(reg.id)} className="btn btn-sm text-danger">Excluir</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="py-5 text-muted">Nenhum ponto batido em {new Date(filtroData + 'T12:00:00').toLocaleDateString('pt-BR')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {registrosExibidos.length > 0 && (
                <div className="card-footer bg-white border-0 py-3">
                  <button onClick={gerarPDF} className="btn btn-dark w-100 fw-bold shadow-sm">🖨️ IMPRIMIR PDF</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}