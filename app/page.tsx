"use client";
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Definição do tipo para os dados do ponto
interface Registro {
  nome: string;
  data: string;
  entrada: string;
  saida: string;
}

export default function FolhaDePonto() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [formData, setFormData] = useState({ 
    nome: '', 
    data: new Date().toISOString().split('T')[0], // Inicia com a data de hoje
    entrada: '', 
    saida: '' 
  });
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);

  // 1. CARREGAR DADOS: Verifica se está no navegador e busca no LocalStorage
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('ponto_arte_maos_flores');
    if (dadosSalvos) {
      try {
        setRegistros(JSON.parse(dadosSalvos));
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    }
  }, []);

  // 2. SALVAR DADOS: Sempre que a lista mudar, atualiza o LocalStorage
  useEffect(() => {
    if (registros.length > 0) {
      localStorage.setItem('ponto_arte_maos_flores', JSON.stringify(registros));
    }
  }, [registros]);

  const adicionarRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    const novoRegistro = { ...formData };
    setRegistros(prev => [...prev, novoRegistro]);
    
    // Reseta horários mas mantém o nome para agilizar se for o mesmo usuário
    setFormData({ ...formData, entrada: '', saida: '' });
    alert("Ponto registrado!");
  };

  const registrosExibidos = registros.filter(reg => reg.data === filtroData);

  const gerarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(40, 167, 69); // Verde institucional
    doc.text('Arte Mãos e Flores', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Relatório de Ponto - Data: ${filtroData}`, 14, 28);
    doc.line(14, 32, 196, 32);

    autoTable(doc, {
      startY: 40,
      head: [['Colaborador', 'Data', 'Entrada', 'Saída']],
      body: registrosExibidos.map(r => [r.nome, r.data, r.entrada, r.saida]),
      headStyles: { fillColor: [40, 167, 69] },
      theme: 'grid'
    });

    doc.save(`folha-ponto-${filtroData}.pdf`);
  };

  return (
    <main className="container py-5">
      {/* CABEÇALHO */}
      <div className="text-center mb-5">
        <h1 className="display-4 text-success fw-bold">Arte Mãos e Flores</h1>
        <p className="lead text-muted">Sistema de Registro de Frequência Digital</p>
      </div>

      <div className="row g-4">
        {/* COLUNA DO FORMULÁRIO */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-success text-white fw-bold">
              Registrar Ponto
            </div>
            <div className="card-body">
              <form onSubmit={adicionarRegistro}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Nome do Colaborador</label>
                  <input type="text" className="form-control" required
                    value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Data</label>
                  <input type="date" className="form-control" required
                    value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label small fw-bold">Entrada</label>
                    <input type="time" className="form-control" required
                      value={formData.entrada} onChange={e => setFormData({...formData, entrada: e.target.value})} />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label small fw-bold">Saída</label>
                    <input type="time" className="form-control" required
                      value={formData.saida} onChange={e => setFormData({...formData, saida: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn btn-success w-100 mt-2 fw-bold">
                  Salvar Registro
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* COLUNA DA LISTA / HISTÓRICO */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="fw-bold text-secondary">Visualizar Registros</span>
              <div className="d-flex align-items-center">
                <label className="me-2 small text-muted">Dia:</label>
                <input type="date" className="form-control form-control-sm" 
                  value={filtroData} onChange={e => setFiltroData(e.target.value)} />
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Nome</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosExibidos.length > 0 ? (
                      registrosExibidos.map((reg, i) => (
                        <tr key={i}>
                          <td className="fw-bold text-dark">{reg.nome}</td>
                          <td>{reg.entrada}</td>
                          <td>{reg.saida}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted">
                          Nenhum registro para o dia selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {registrosExibidos.length > 0 && (
                <div className="mt-3">
                  <button onClick={gerarPDF} className="btn btn-primary d-flex align-items-center gap-2">
                    <span>Exportar PDF do Dia</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center mt-5 text-muted small">
        © {new Date().getFullYear()} Arte Mãos e Flores - Gestão Interna
      </footer>
    </main>
  );
}