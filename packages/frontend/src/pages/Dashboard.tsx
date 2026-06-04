import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Star, DollarSign, TrendingUp, Award, Instagram } from 'lucide-react';
import { personsService, companiesService, missionsService, salaryService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, isSuperAdmin } = useAuth();

  if (user?.profile?.name === 'EMPLOYEE') {
    return <EmployeeDashboard user={user} />;
  }

  const { data: personStats } = useQuery({
    queryKey: ['person-stats'],
    queryFn: () => personsService.getStats(),
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-count'],
    queryFn: () => companiesService.findAll(),
    enabled: isSuperAdmin(),
  });

  const { data: missions } = useQuery({
    queryKey: ['missions'],
    queryFn: () => missionsService.findAll(),
  });

  const { data: salaryReport } = useQuery({
    queryKey: ['salary-report'],
    queryFn: () => salaryService.getReport(),
  });

  const stats: any = personStats || {};

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(67, 233, 123, 0.08) 100%)',
        borderColor: 'rgba(108, 99, 255, 0.3)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              👋 Bem-vindo, {user?.email?.split('@')[0]}!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {user?.companyName} • {user?.profile?.name}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semana atual</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-light)' }}>
              {getWeekNumber(new Date())}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={22} /></div>
          <div className="stat-info">
            <h3>{stats.total ?? '—'}</h3>
            <p>Total de Pessoas</p>
            <span className="stat-badge up">+{stats.pending ?? 0} pendentes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><Users size={22} /></div>
          <div className="stat-info">
            <h3>{stats.active ?? '—'}</h3>
            <p>Pessoas Ativas</p>
            <span className="stat-badge up">Em operação</span>
          </div>
        </div>

        {isSuperAdmin() && (
          <div className="stat-card">
            <div className="stat-icon orange"><Building2 size={22} /></div>
            <div className="stat-info">
              <h3>{(companies as any[])?.length ?? '—'}</h3>
              <p>Empresas</p>
              <span className="stat-badge up">Multi-tenant</span>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon pink"><Star size={22} /></div>
          <div className="stat-info">
            <h3>{(missions as any[])?.length ?? '—'}</h3>
            <p>Missões Ativas</p>
            <span className="stat-badge up">Semanais</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h3>R$ {Number((salaryReport as any)?.totalPayout || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p>Payout Semanal</p>
            <span className="stat-badge up">{(salaryReport as any)?.approvedCount ?? 0} aprovados</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><Users size={22} /></div>
          <div className="stat-info">
            <h3>{stats.pending ?? '—'}</h3>
            <p>Aguardando Aprovação</p>
            <span className="stat-badge down">Revisar</span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* System Info */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary-light)' }} />
            Sistema de Gamificação
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { label: 'Salário Mensal Base', value: 'R$ 1.000,00' },
              { label: 'Disponível por Semana', value: 'R$ 250,00' },
              { label: 'Missões para Nível', value: '100 pontos' },
              { label: 'Bônus por Nível', value: '+10% ao mês' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-light)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Types */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Instagram size={18} style={{ color: 'var(--secondary)' }} />
            Missões Instagram
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '📸', label: 'Publicar Foto', points: '25 pts', required: true },
              { icon: '🏷️', label: 'Marcar a Empresa', points: '25 pts', required: true },
              { icon: '💬', label: 'Comentar', points: '25 pts', required: true },
              { icon: '🔁', label: 'Compartilhar', points: '25 pts', required: false },
            ].map((m) => (
              <div key={m.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{m.icon}</span>
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.label}</span>
                <span className={`badge ${m.required ? 'badge-primary' : 'badge-inactive'}`}>{m.points}</span>
                {m.required && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Obrigatório</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ user }: { user: any }) {
  const personId = user?.person?.id;

  const { data: weeklyMissionsData, isLoading: isMissionsLoading } = useQuery({
    queryKey: ['employee-weekly-missions', personId],
    queryFn: () => missionsService.getWeeklyMissions(personId),
    enabled: !!personId,
  });

  const { data: salaryData, isLoading: isSalaryLoading } = useQuery({
    queryKey: ['employee-salary', personId],
    queryFn: () => salaryService.getPersonSalary(personId),
    enabled: !!personId,
  });

  if (!personId) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <Award size={48} style={{ color: 'var(--warning)', marginBottom: '1rem', marginInline: 'auto' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Vínculo de Funcionário Pendente</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', marginInline: 'auto', lineHeight: '1.5' }}>
          Seu usuário não está vinculado a nenhuma pessoa/funcionário cadastrado. Por favor, solicite a um administrador ou liderança para vincular este usuário (<strong>{user.email}</strong>) ao seu cadastro em "Pessoas".
        </p>
      </div>
    );
  }

  const TYPE_LABELS: Record<string, string> = {
    POST_PHOTO: '📸 Publicar Foto', TAG_COMPANY: '🏷️ Marcar Empresa',
    COMMENT_POST: '💬 Comentar', SHARE_POST: '🔁 Compartilhar',
    REACH_FOLLOWERS: '👥 Seguidores', CUSTOM: '✨ Personalizada',
  };

  const currentLevel = salaryData?.person?.level || user.person?.level || 1;
  const totalPoints = salaryData?.person?.totalPoints || user.person?.totalPoints || 0;
  const nextLevelPoints = currentLevel * 100;

  const approvedPayments = (salaryData?.payments || [])
    .filter((p: any) => p.status === 'APPROVED' || p.status === 'PENDING');
  const totalAReceber = approvedPayments.reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);

  const paidPayments = (salaryData?.payments || [])
    .filter((p: any) => p.status === 'PAID');
  const totalRecebido = paidPayments.reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(67, 233, 123, 0.08) 100%)',
        borderColor: 'rgba(108, 99, 255, 0.3)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              👋 Olá, {user.person?.firstName}! {user.person?.instagramUsername && `(@${user.person.instagramUsername})`}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Parabéns pelo seu trabalho na empresa {user.companyName}. Continue completando as missões!
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nível Atual</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
              <Star size={20} fill="var(--primary-light)" /> {currentLevel}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon orange"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h3>R$ {totalAReceber.toFixed(2)}</h3>
            <p>A Receber (Pendente)</p>
            <span className="stat-badge up" style={{ background: 'rgba(247, 151, 30, 0.1)', color: 'var(--warning)', fontSize: '0.75rem' }}>
              Aguardando pagamento
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h3>R$ {totalRecebido.toFixed(2)}</h3>
            <p>Total Recebido (Pago)</p>
            <span className="stat-badge up" style={{ background: 'rgba(67, 233, 123, 0.1)', color: 'var(--accent)', fontSize: '0.75rem' }}>
              Pago com sucesso
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><TrendingUp size={22} /></div>
          <div className="stat-info">
            <h3>R$ {Number(salaryData?.currentWeek?.weeklyTotal || 0).toFixed(2)}</h3>
            <p>Ganhos da Semana (Atual)</p>
            <span className="stat-badge up" style={{ background: 'rgba(108, 99, 255, 0.1)', color: 'var(--primary-light)', fontSize: '0.75rem' }}>
              Base: R$ {Number(salaryData?.currentWeek?.weeklyBase || 0).toFixed(2)} + Bônus: R$ {Number(salaryData?.currentWeek?.levelBonus || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink"><Award size={22} /></div>
          <div className="stat-info">
            <h3>{totalPoints}</h3>
            <p>Pontos Acumulados</p>
            <span className="stat-badge up" style={{ background: 'rgba(255, 101, 132, 0.1)', color: 'var(--secondary)', fontSize: '0.75rem' }}>
              Próximo nível: {nextLevelPoints} pts
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        {/* Weekly Missions */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} style={{ color: 'var(--primary-light)' }} />
            Minhas Missões da Semana ({weeklyMissionsData?.weekNumber || '—'})
          </h3>

          {isMissionsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></div>
          ) : (weeklyMissionsData?.missions || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Nenhuma missão disponível para esta semana.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(weeklyMissionsData.missions as any[]).map((m: any) => (
                <div key={m.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: '8px',
                  border: m.completed ? '1px solid rgba(67, 233, 123, 0.2)' : '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '1.5rem' }}>
                    {TYPE_LABELS[m.type]?.slice(0, 2) || '✨'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      {m.name}
                      {m.isRequired && <span className="badge badge-primary" style={{ fontSize: '0.6rem', marginLeft: '0.5rem' }}>Obrigatória</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {m.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent)' }}>
                      R$ {Number(m.rewardValue || 0).toFixed(2)}
                    </div>
                    <span className={`badge ${m.completed ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                      {m.completed ? 'Concluída' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments History */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} style={{ color: 'var(--accent)' }} />
            Histórico de Ganhos Semanais
          </h3>

          {isSalaryLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></div>
          ) : (salaryData?.payments || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Nenhum ganho registrado ainda.
            </div>
          ) : (
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Semana/Ano</th>
                    <th>Valor Base</th>
                    <th>Bônus Nível</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(salaryData.payments as any[]).map((p: any) => (
                    <tr key={p.id}>
                      <td>Semana {p.weekNumber} / {p.year}</td>
                      <td>R$ {Number(p.amount).toFixed(2)}</td>
                      <td>R$ {Number(p.bonus).toFixed(2)}</td>
                      <td style={{ fontWeight: '600', color: 'var(--accent)' }}>R$ {Number(p.total).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          p.status === 'PAID' ? 'badge-active' :
                          p.status === 'APPROVED' ? 'badge-active' :
                          p.status === 'PENDING' ? 'badge-pending' : 'badge-inactive'
                        }`}>
                          {p.status === 'PAID' ? 'Pago' :
                           p.status === 'APPROVED' ? 'Aprovado' :
                           p.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
