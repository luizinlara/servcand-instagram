import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, UserCheck, XCircle } from 'lucide-react';
import { leadershipService, regionsService, personsService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export default function LeadershipPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: leadership = [], isLoading } = useQuery({
    queryKey: ['leadership'],
    queryFn: () => leadershipService.findAll(),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => leadershipService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leadership'] }),
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Lideranças Regionais</h2><p>Gerenciamento de líderes por bairro/região</p></div>
        {hasPermission('leadership:create') && (
          <button id="btn-add-leader" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Designar Líder
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Líder</th>
              <th>Região</th>
              <th>Telefone</th>
              <th>Instagram</th>
              <th>Início</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></td></tr>
            ) : (leadership as any[]).length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><UserCheck style={{ margin: '0 auto 0.5rem' }} /><h3>Nenhuma liderança cadastrada</h3></div></td></tr>
            ) : (leadership as any[]).map((l: any) => (
              <tr key={l.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {l.person?.firstName} {l.person?.lastName}
                  </div>
                </td>
                <td>{l.region?.name}</td>
                <td>{l.person?.phone || '—'}</td>
                <td>{l.person?.instagramUsername ? `@${l.person.instagramUsername}` : '—'}</td>
                <td>{new Date(l.startDate).toLocaleDateString('pt-BR')}</td>
                <td>
                  <span className={`badge ${l.isActive ? 'badge-active' : 'badge-inactive'}`}>
                    {l.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  {l.isActive && hasPermission('leadership:update') && (
                    <button
                      className="btn btn-danger btn-sm"
                      title="Desativar"
                      onClick={() => { if (confirm('Desativar esta liderança?')) deactivateMutation.mutate(l.id); }}
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <LeadershipModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['leadership'] }); }}
        />
      )}
    </div>
  );
}

function LeadershipModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { data: regions = [] } = useQuery({ queryKey: ['regions'], queryFn: () => regionsService.findAll() });
  const { data: persons = [] } = useQuery({ queryKey: ['persons'], queryFn: () => personsService.findAll({ status: 'ACTIVE' }) });
  const set = (f: string, v: any) => setForm((prev: any) => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try { await leadershipService.create(form); onSuccess(); }
    catch (err: any) { alert(err?.message || 'Erro'); } finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h2>Designar Liderança</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Pessoa / Líder *</label>
              <select className="form-control" value={form.personId || ''} onChange={(e) => set('personId', e.target.value)} required>
                <option value="">Selecione...</option>
                {(persons as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Região *</label>
              <select className="form-control" value={form.regionId || ''} onChange={(e) => set('regionId', e.target.value)} required>
                <option value="">Selecione...</option>
                {(regions as any[]).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Designar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
