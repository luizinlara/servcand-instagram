import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salaryService, personsService } from '../services';
import { DollarSign, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function SalaryPage() {
  const qc = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const { data: report, isLoading } = useQuery({
    queryKey: ['salary-report', selectedWeek, selectedYear],
    queryFn: () => salaryService.getReport({ weekNumber: selectedWeek, year: selectedYear }),
  });

  const generateCompanyPaymentsMutation = useMutation({
    mutationFn: (data: { weekNumber: number; year: number }) =>
      salaryService.generateWeeklyPaymentsForCompany(data),
    onSuccess: () => {
      alert('Folha de pagamento calculada com sucesso para toda a empresa!');
      qc.invalidateQueries({ queryKey: ['salary-report'] });
    },
    onError: (err: any) => {
      alert(err?.message || 'Erro ao calcular a folha de pagamento.');
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => salaryService.markAsPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary-report'] }),
  });

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const handleGenerateWeeklyPayments = () => {
    const week = selectedWeek || getWeekNumber(new Date());
    const year = selectedYear || new Date().getFullYear();
    if (confirm(`Deseja calcular os salários de todos os funcionários para a Semana ${week} de ${year}?`)) {
      generateCompanyPaymentsMutation.mutate({ weekNumber: week, year });
    }
  };

  const r: any = report || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Salários e Pagamentos</h2>
          <p>Controle de pagamentos semanais por funcionário</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="number" className="form-control" style={{ width: 100 }}
            placeholder="Semana" min={1} max={53}
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : undefined)}
          />
          <input
            type="number" className="form-control" style={{ width: 100 }}
            placeholder="Ano" min={2024} max={2030}
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
          />
          <button
            className="btn btn-primary"
            onClick={handleGenerateWeeklyPayments}
            disabled={generateCompanyPaymentsMutation.isPending}
          >
            {generateCompanyPaymentsMutation.isPending ? 'Calculando...' : 'Calcular Ganhos da Semana'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h3>R$ {Number(r.totalPayout || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p>Total do Período</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><CheckCircle size={22} /></div>
          <div className="stat-info">
            <h3>{r.approvedCount ?? 0}</h3>
            <p>Pagamentos Aprovados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h3>{r.paymentsCount ?? 0}</h3>
            <p>Total de Registros</p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Região</th>
              <th>Nível</th>
              <th>Missões</th>
              <th>Base</th>
              <th>Bônus</th>
              <th>Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></td></tr>
            ) : !(r.payments?.length) ? (
              <tr><td colSpan={9}><div className="empty-state"><h3>Nenhum pagamento nesse período</h3></div></td></tr>
            ) : r.payments.map((p: any) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.person?.firstName} {p.person?.lastName}
                  </div>
                </td>
                <td>{p.person?.region?.name || '—'}</td>
                <td><span className="level-badge">Lv. {p.levelAtTime}</span></td>
                <td>{p.missionsCompleted}</td>
                <td style={{ color: 'var(--text-primary)' }}>R$ {Number(p.amount).toFixed(2)}</td>
                <td style={{ color: 'var(--accent)' }}>+R$ {Number(p.bonus).toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                  R$ {Number(p.total).toFixed(2)}
                </td>
                <td>
                  <span className={`badge ${
                    p.status === 'PAID' ? 'badge-active' :
                    p.status === 'APPROVED' ? 'badge-primary' :
                    p.status === 'PENDING' ? 'badge-pending' : 'badge-inactive'
                  }`}>
                    {p.status === 'PAID' ? 'Pago' : p.status === 'APPROVED' ? 'Aprovado' : p.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                  </span>
                </td>
                <td>
                  {p.status === 'APPROVED' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => markPaidMutation.mutate(p.id)}
                      disabled={markPaidMutation.isPending}
                    >
                      <CheckCircle size={14} /> Marcar Pago
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
