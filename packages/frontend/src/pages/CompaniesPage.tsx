import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { companiesService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export default function CompaniesPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState<any>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesService.findAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Empresas</h2>
          <p>Gestão multi-tenant de empresas</p>
        </div>
        {hasPermission('companies:create') && (
          <button id="btn-add-company" className="btn btn-primary" onClick={() => { setEditCompany(null); setShowModal(true); }}>
            <Plus size={16} /> Nova Empresa
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>E-mail</th>
              <th>Usuários</th>
              <th>Pessoas</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading-spinner" />
              </td></tr>
            ) : (companies as any[]).map((c: any) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                </td>
                <td>{c.cnpj || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c._count?.users ?? 0}</td>
                <td>{c._count?.persons ?? 0}</td>
                <td>
                  <span className={`badge ${c.isAdmin ? 'badge-primary' : 'badge-inactive'}`}>
                    {c.isAdmin ? 'Admin Geral' : 'Empresa'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${c.isActive ? 'badge-active' : 'badge-inactive'}`}>
                    {c.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {hasPermission('companies:update') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditCompany(c); setShowModal(true); }}>
                        <Edit size={14} />
                      </button>
                    )}
                    {hasPermission('companies:delete') && !c.isAdmin && (
                      <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Confirmar exclusão?')) deleteMutation.mutate(c.id); }}>
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

      {showModal && (
        <CompanyModal
          company={editCompany}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['companies'] }); }}
        />
      )}
    </div>
  );
}

function CompanyModal({ company, onClose, onSuccess }: any) {
  const [form, setForm] = useState(company || {});
  const [isLoading, setIsLoading] = useState(false);
  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (company?.id) await companiesService.update(company.id, form);
      else await companiesService.create(form);
      onSuccess();
    } catch (err: any) { alert(err?.message || 'Erro'); } finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{company ? 'Editar Empresa' : 'Nova Empresa'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Nome da Empresa *</label>
                <input className="form-control" value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input className="form-control" value={form.cnpj || ''} onChange={(e) => set('cnpj', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-control" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-control" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input className="form-control" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
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
