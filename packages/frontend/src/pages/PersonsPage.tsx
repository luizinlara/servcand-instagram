import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { personsService, regionsService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'badge-active', PENDING: 'badge-pending',
  INACTIVE: 'badge-inactive', SUSPENDED: 'badge-suspended',
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo', PENDING: 'Pendente', INACTIVE: 'Inativo', SUSPENDED: 'Suspenso',
};

export default function PersonsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPerson, setEditPerson] = useState<any>(null);
  const [approveModal, setApproveModal] = useState<any>(null);

  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['persons', search, statusFilter],
    queryFn: () => personsService.findAll({ search, status: statusFilter || undefined }),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.findAll(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: any) => personsService.approve(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['persons'] }); setApproveModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => personsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
  });

  const handleApprove = (person: any, status: string) => {
    approveMutation.mutate({ id: person.id, data: { status } });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Pessoas / Funcionários</h2>
          <p>Cadastro interno e externo de pessoas</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {hasPermission('persons:create') && (
            <button id="btn-add-person" className="btn btn-primary" onClick={() => { setEditPerson(null); setShowModal(true); }}>
              <Plus size={16} /> Nova Pessoa
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              id="search-persons"
              placeholder="Buscar por nome, CPF, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            id="filter-status"
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PENDING">Pendente</option>
            <option value="INACTIVE">Inativo</option>
            <option value="SUSPENDED">Suspenso</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Região</th>
              <th>Instagram</th>
              <th>Nível</th>
              <th>Status</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading-spinner" />
              </td></tr>
            ) : (persons as any[]).length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <p>Nenhuma pessoa encontrada</p>
                </div>
              </td></tr>
            ) : (persons as any[]).map((p: any) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.firstName} {p.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                </td>
                <td>{p.cpf || '—'}</td>
                <td>{p.phone}</td>
                <td>{p.region?.name || '—'}</td>
                <td>
                  {p.instagramUsername ? (
                    <span style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>@{p.instagramUsername}</span>
                  ) : '—'}
                </td>
                <td>
                  <span className="level-badge">Lv. {p.level}</span>
                </td>
                <td>
                  <span className={`badge ${STATUS_MAP[p.status] || ''}`}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                </td>
                <td>
                  <span className={`badge ${p.registrationType === 'PUBLIC' ? 'badge-inactive' : 'badge-primary'}`}>
                    {p.registrationType === 'PUBLIC' ? 'Público' : 'Interno'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {p.status === 'PENDING' && hasPermission('persons:approve') && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          title="Aprovar"
                          onClick={() => handleApprove(p, 'ACTIVE')}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Rejeitar"
                          onClick={() => handleApprove(p, 'INACTIVE')}
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                    {hasPermission('persons:update') && (
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Editar"
                        onClick={() => { setEditPerson(p); setShowModal(true); }}
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {hasPermission('persons:delete') && (
                      <button
                        className="btn btn-danger btn-sm"
                        title="Excluir"
                        onClick={() => { if (confirm('Confirmar exclusão?')) deleteMutation.mutate(p.id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <PersonModal
          person={editPerson}
          regions={regions as any[]}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['persons'] }); }}
        />
      )}
    </div>
  );
}

function PersonModal({ person, regions, onClose, onSuccess }: any) {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(person || { companyId: currentUser?.companyId });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (person?.id) {
        await personsService.update(person.id, form);
      } else {
        await personsService.create(form);
      }
      onSuccess();
    } catch (err: any) {
      alert(err?.message || 'Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>{person ? 'Editar Pessoa' : 'Nova Pessoa'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-control" value={form.firstName || ''} onChange={(e) => set('firstName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sobrenome *</label>
                <input className="form-control" value={form.lastName || ''} onChange={(e) => set('lastName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">CPF</label>
                <input className="form-control" value={form.cpf || ''} onChange={(e) => set('cpf', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone *</label>
                <input className="form-control" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-control" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input className="form-control" value={form.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Instagram (@)</label>
                <input className="form-control" value={form.instagramUsername || ''} onChange={(e) => set('instagramUsername', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Região</label>
                <select className="form-control" value={form.regionId || ''} onChange={(e) => set('regionId', e.target.value)}>
                  <option value="">Selecione...</option>
                  {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {!person && currentUser?.isAdmin && (
                <div className="form-group">
                  <label className="form-label">Empresa ID *</label>
                  <input className="form-control" value={form.companyId || ''} onChange={(e) => set('companyId', e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}>
                  <option value="ACTIVE">Ativo</option>
                  <option value="PENDING">Pendente</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
