"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'bootstrap/dist/css/bootstrap.min.css'


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
  const [formData, setFormData] = useState({ 
    nome: '', 
    data: new Date().toISOString().split('T')[0], 
    entrada: '', 
    saida: '' 
  });
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);

  // Carregar dados
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('ponto_arte_maos_flores');
    if (dadosSalvos) {
      setRegistros(JSON.parse(dadosSalvos));
    }
  }, []);

  // Salvar dados
  useEffect(() => {
    localStorage.setItem('ponto_arte_maos_flores', JSON.stringify(registros));
  }, [registros]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing !== null) {
      // Lógica de Edição
      setRegistros(prev => prev.map(reg => 
        reg.id === isEditing ? { ...formData, id: isEditing } : reg
      ));
      setIsEditing(null);
      alert("Registro atualizado!");
    } else {
      // Lógica de Novo Registro
      const novoRegistro = { ...formData, id: Date.now() };
      setRegistros(prev => [...prev, novoRegistro]);
      alert("Ponto registrado!");
    }
    
    setFormData({ ...formData, entrada: '', saida: '' });
  };

  const prepararEdicao = (reg: Registro) => {
    setFormData({ nome: reg.nome, data: reg.data, entrada: reg.entrada, saida: reg.saida });
    setIsEditing(reg.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const excluirRegistro = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      setRegistros(prev => prev.filter(reg => reg.id !== id));
    }
  };

  const cancelarEdicao = () => {
    setIsEditing(null);
    setFormData({ ...formData, entrada: '', saida: '' });
  };

  const registrosExibidos = registros.filter(reg => reg.data === filtroData);

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 167, 69);
    doc.text('Arte Mãos e Flores', 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Relatório de Ponto - Data: ${filtroData}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [['Colaborador', 'Entrada', 'Saída']],
      body: registrosExibidos.map(r => [r.nome, r.entrada, r.saida]),
      headStyles: { fillColor: [40, 167, 69] },
    });
    doc.save(`ponto-${filtroData}.pdf`);
  };

  return (
    <main className="container py-5">
      <div className="text-center mb-5">
        <div className="d-flex justify-content-center align-items-center mb-3 flex-wrap">
          <Image src="/logo.png" alt="Logo" width={60} height={60} className="me-3" 
                 onError={(e) => (e.currentTarget.style.display = 'none')} />
          <h1 className="display-5 text-success fw-bold mb-0">Arte Mãos e Flores</h1>
        </div>
      </div>

      <div className="row g-4">
        {/* FORMULÁRIO */}
        <div className="col-lg-4">
          <div className={`card shadow-sm border-0 ${isEditing ? 'border-primary' : ''}`} style={{ borderLeft: isEditing ? '5px solid #007bff' : 'none' }}>
            <div className={`card-header ${isEditing ? 'bg-primary' : 'bg-success'} text-white`}>
              <h5 className="mb-0">{isEditing ? '📝 Editando Ponto' : '📥 Novo Registro'}</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Colaborador</label>
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
                  {isEditing ? 'Salvar Alterações' : 'Registrar Ponto'}
                </button>
                {isEditing && (
                  <button type="button" onClick={cancelarEdicao} className="btn btn-link w-100 mt-2 text-muted">
                    Cancelar Edição
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* TABELA COM AÇÕES */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 text-secondary">Registros de {filtroData}</h5>
              <input type="date" className="form-control form-control-sm w-auto shadow-sm" 
                     value={filtroData} onChange={e => setFiltroData(e.target.value)} />
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Nome</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosExibidos.length > 0 ? (
                      registrosExibidos.map((reg) => (
                        <tr key={reg.id}>
                          <td className="ps-4 fw-bold">{reg.nome}</td>
                          <td>{reg.entrada}</td>
                          <td>{reg.saida}</td>
                          <td className="text-center">
                            <button onClick={() => prepararEdicao(reg)} className="btn btn-sm btn-outline-primary me-2">
                              Editar
                            </button>
                            <button onClick={() => excluirRegistro(reg.id)} className="btn btn-sm btn-outline-danger">
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">Nenhum registro encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {registrosExibidos.length > 0 && (
              <div className="card-footer bg-white border-0 py-3">
                <button onClick={gerarPDF} className="btn btn-dark w-100 shadow-sm">
                  🖨️ Gerar PDF do Dia
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}