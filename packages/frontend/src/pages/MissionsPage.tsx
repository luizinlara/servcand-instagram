import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Star, CheckCircle, Award } from 'lucide-react';
import { missionsService, personsService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const MISSION_TYPES = ['POST_PHOTO', 'TAG_COMPANY', 'COMMENT_POST', 'SHARE_POST', 'REACH_FOLLOWERS', 'CUSTOM'];
const TYPE_LABELS: Record<string, string> = {
  POST_PHOTO: '📸 Publicar Foto', TAG_COMPANY: '🏷️ Marcar Empresa',
  COMMENT_POST: '💬 Comentar', SHARE_POST: '🔁 Compartilhar',
  REACH_FOLLOWERS: '👥 Seguidores', CUSTOM: '✨ Personalizada',
};

export default function MissionsPage() {
  const { hasPermission, user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'config' | 'validation'>('config');
  const [showModal, setShowModal] = useState(false);
  const [editMission, setEditMission] = useState<any>(null);

  // States for manual validation tab
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [validateParams, setValidateParams] = useState<any>(null); // params for validation modal

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: () => missionsService.findAll(),
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons', 'active'],
    queryFn: () => personsService.findAll({ status: 'ACTIVE' }),
  });

  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['weekly-missions', selectedPersonId],
    queryFn: () => missionsService.getWeeklyMissions(selectedPersonId),
    enabled: activeTab === 'validation' && !!selectedPersonId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => missionsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions'] }),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Missões Semanais</h2>
          <p>Gerenciamento de missões e validação manual de conclusão</p>
        </div>
        {activeTab === 'config' && hasPermission('missions:create') && (
          <button id="btn-add-mission" className="btn btn-primary" onClick={() => { setEditMission(null); setShowModal(true); }}>
            <Plus size={16} /> Nova Missão
          </button>
        )}
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            background: activeTab === 'config' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'config' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          Modelos de Missões
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          style={{
            background: activeTab === 'validation' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'validation' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          Validação Manual
        </button>
      </div>

      {/* Tab 1: Configuration of Mission Templates */}
      {activeTab === 'config' && (
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          {isLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
          ) : missions.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <p>Nenhuma missão cadastrada</p>
            </div>
          ) : (missions as any[]).map((m: any) => (
            <div key={m.id} className="card" style={{ position: 'relative' }}>
              {m.isRequired && (
                <span className="badge badge-primary" style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.6rem' }}>
                  Obrigatória
                </span>
              )}
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
                {TYPE_LABELS[m.type]?.slice(0, 2) || '✨'}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{m.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {m.description || TYPE_LABELS[m.type]}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="level-badge">
                    <Star size={12} /> {m.points} pts
                  </span>
                  <span className="level-badge" style={{ background: 'rgba(67, 233, 123, 0.1)', color: 'var(--accent)' }}>
                    R$ {Number(m.rewardValue || 0).toFixed(2)}
                  </span>
                </div>
                <span className={`badge ${m.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {m.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              {(hasPermission('missions:update') || hasPermission('missions:delete')) && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  {hasPermission('missions:update') && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditMission(m); setShowModal(true); }}>
                      <Edit size={14} /> Editar
                    </button>
                  )}
                  {hasPermission('missions:delete') && (
                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Excluir missão?')) deleteMutation.mutate(m.id); }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Manual Validation */}
      {activeTab === 'validation' && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Selecionar Pessoa:</label>
              <select
                className="form-control"
                style={{ maxWidth: 350 }}
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
              >
                <option value="">Selecione uma pessoa...</option>
                {(persons as any[]).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} {p.instagramUsername ? `(@${p.instagramUsername})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedPersonId ? (
            <div className="empty-state card" style={{ padding: '3rem' }}>
              <Award size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3>Selecione uma pessoa para gerenciar e validar as missões semanais</h3>
            </div>
          ) : (
            <div>
              {isWeeklyLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="stat-icon purple" style={{ width: 40, height: 40 }}><Star size={20} /></div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semana / Ano</div>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                          Semana {weeklyData?.weekNumber} de {weeklyData?.year}
                        </div>
                      </div>
                    </div>
                    <div className="card" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="stat-icon green" style={{ width: 40, height: 40 }}><CheckCircle size={20} /></div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missões Concluídas</div>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                          {weeklyData?.completedCount} de {weeklyData?.totalCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Missão</th>
                          <th>Tipo</th>
                          <th>Pontos</th>
                          <th>Obrigatória</th>
                          <th>Status</th>
                          <th>Evidência</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(weeklyData?.missions || []).map((m: any) => (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                            <td>{TYPE_LABELS[m.type] || m.type}</td>
                            <td>
                              <span className="level-badge">{m.points} pts</span>
                            </td>
                            <td>
                              {m.isRequired ? (
                                <span className="badge badge-primary">Sim</span>
                              ) : (
                                <span className="badge badge-inactive">Não</span>
                              )}
                            </td>
                            <td>
                              {m.completed ? (
                                <span className="badge badge-active">Concluída</span>
                              ) : (
                                <span className="badge badge-pending">Pendente</span>
                              )}
                            </td>
                            <td>
                              {m.personMission?.evidence ? (
                                <a
                                  href={m.personMission.evidence}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.85rem' }}
                                >
                                  Ver Link
                                </a>
                              ) : m.personMission?.notes ? (
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} title={m.personMission.notes}>
                                  Com observação
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              {!m.completed ? (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setValidateParams({
                                      personId: selectedPersonId,
                                      missionId: m.id,
                                      weekNumber: weeklyData.weekNumber,
                                      year: weeklyData.year,
                                    });
                                  }}
                                >
                                  Marcar Concluída
                                </button>
                              ) : (
                                <button className="btn btn-secondary btn-sm" disabled>
                                  Concluída
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <MissionModal
          mission={editMission}
          companyId={user?.companyId || ''}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['missions'] }); }}
        />
      )}

      {validateParams && (
        <ValidateMissionModal
          params={validateParams}
          onClose={() => setValidateParams(null)}
          onSuccess={() => {
            setValidateParams(null);
            qc.invalidateQueries({ queryKey: ['weekly-missions', selectedPersonId] });
            qc.invalidateQueries({ queryKey: ['persons'] });
          }}
        />
      )}
    </div>
  );
}

function MissionModal({ mission, companyId, onClose, onSuccess }: any) {
  const [form, setForm] = useState(mission || { companyId, points: 25, rewardValue: 0, isRequired: false, isActive: true });
  const [isLoading, setIsLoading] = useState(false);
  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mission?.id) await missionsService.update(mission.id, { ...form, rewardValue: Number(form.rewardValue || 0) });
      else await missionsService.create({ ...form, rewardValue: Number(form.rewardValue || 0) });
      onSuccess();
    } catch (err: any) { alert(err?.message || 'Erro'); } finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{mission ? 'Editar Missão' : 'Nova Missão'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome da Missão *</label>
              <input className="form-control" value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <select className="form-control" value={form.type || ''} onChange={(e) => set('type', e.target.value)} required>
                <option value="">Selecione o tipo...</option>
                {MISSION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea className="form-control" value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={3} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Pontos</label>
                <input className="form-control" type="number" min={1} value={form.points || 25} onChange={(e) => set('points', parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Recompensa (R$)</label>
                <input className="form-control" type="number" step="0.01" min={0} value={form.rewardValue || 0} onChange={(e) => set('rewardValue', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Obrigatória?</label>
                <select className="form-control" value={form.isRequired ? 'true' : 'false'} onChange={(e) => set('isRequired', e.target.value === 'true')}>
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ValidateMissionModal({ params, onClose, onSuccess }: any) {
  const [evidence, setEvidence] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await missionsService.validate({
        personId: params.personId,
        missionId: params.missionId,
        weekNumber: params.weekNumber,
        year: params.year,
        evidence: evidence || undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      alert(err?.message || 'Erro ao validar missão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Marcar Missão como Concluída</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Confirmar a conclusão desta missão para a <strong>Semana {params.weekNumber} de {params.year}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">Link de Evidência (Opcional)</label>
              <input
                className="form-control"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Ex: link da publicação do Instagram"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Observações (Opcional)</label>
              <textarea
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Validado manualmente pela liderança"
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Concluindo...' : 'Concluir Missão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
