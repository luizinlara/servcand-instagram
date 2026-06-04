import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parametersService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Save } from 'lucide-react';

export default function ParametersPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: params, isLoading } = useQuery({
    queryKey: ['parameters'],
    queryFn: () => parametersService.get(),
  });

  const [form, setForm] = useState<any>(null);

  React.useEffect(() => {
    if (params && !form) setForm(params);
  }, [params]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => parametersService.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parameters'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  if (isLoading || !form) return <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Parâmetros do Sistema</h2>
          <p>Configure salário, missões e regras de gamificação</p>
        </div>
        {hasPermission('parameters:update') && (
          <button
            id="btn-save-params"
            className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending}
          >
            <Save size={16} /> {saved ? 'Salvo!' : 'Salvar Parâmetros'}
          </button>
        )}
      </div>

      <div className="grid-2">
        {/* Salary Config */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            💰 Configuração Salarial
          </h3>

          <div className="form-group">
            <label className="form-label">Salário Mensal Base (R$)</label>
            <input
              id="param-monthly-salary"
              className="form-control"
              type="number"
              min={0}
              step={10}
              value={form.monthlyBaseSalary || 1000}
              onChange={(e) => set('monthlyBaseSalary', parseFloat(e.target.value))}
              disabled={!hasPermission('parameters:update')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor por Semana (R$)</label>
            <input
              id="param-weekly-amount"
              className="form-control"
              type="number"
              min={0}
              step={10}
              value={form.weeklyAmount || 250}
              onChange={(e) => set('weeklyAmount', parseFloat(e.target.value))}
              disabled={!hasPermission('parameters:update')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Semanas por Mês</label>
            <input
              id="param-weeks-per-month"
              className="form-control"
              type="number"
              min={1}
              max={5}
              value={form.weeksPerMonth || 4}
              onChange={(e) => set('weeksPerMonth', parseInt(e.target.value))}
              disabled={!hasPermission('parameters:update')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bônus por Nível (%)</label>
            <input
              id="param-level-bonus"
              className="form-control"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.levelBonusPercentage || 10}
              onChange={(e) => set('levelBonusPercentage', parseFloat(e.target.value))}
              disabled={!hasPermission('parameters:update')}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              A cada nível ganho, o funcionário recebe +{form.levelBonusPercentage || 10}% sobre o valor semanal
            </small>
          </div>
        </div>

        {/* Mission Config */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            ⭐ Configuração de Missões
          </h3>

          <div className="form-group">
            <label className="form-label">Missões Obrigatórias por Semana</label>
            <input
              id="param-missions-per-week"
              className="form-control"
              type="number"
              min={1}
              value={form.missionsRequiredPerWeek || 3}
              onChange={(e) => set('missionsRequiredPerWeek', parseInt(e.target.value))}
              disabled={!hasPermission('parameters:update')}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              O funcionário precisa completar esse número de missões para receber o pagamento semanal
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Pontos para Subir de Nível</label>
            <input
              id="param-points-per-level"
              className="form-control"
              type="number"
              min={1}
              value={form.missionPointsToLevel || 100}
              onChange={(e) => set('missionPointsToLevel', parseInt(e.target.value))}
              disabled={!hasPermission('parameters:update')}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Pontos acumulados multiplicados pelo nível atual = pontos para próximo nível
            </small>
          </div>

          {/* Preview */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              📊 Simulação de Salário
            </h4>
            {[1, 2, 3, 5].map((level) => {
              const bonus = (form.levelBonusPercentage || 10) * (level - 1) / 100;
              const weekly = (form.weeklyAmount || 250) * (1 + bonus);
              const monthly = weekly * (form.weeksPerMonth || 4);
              return (
                <div key={level} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Nível {level}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    R$ {weekly.toFixed(2)}/sem • R$ {monthly.toFixed(2)}/mês
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
