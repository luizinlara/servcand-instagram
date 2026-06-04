import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, profilesService, companiesService, personsService } from '../services';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Usuários do Sistema</h2><p>Usuários com acesso ao painel</p></div>
        {hasPermission('users:create') && (
          <button id="btn-add-user" className="btn btn-primary" onClick={() => { setEditUser(null); setShowModal(true); }}>
            <Plus size={16} /> Novo Usuário
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Empresa</th>
              <th>Perfil</th>
              <th>Pessoa Vinculada</th>
              <th>Status</th>
              <th>Último Login</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></td></tr>
            ) : (users as any[]).map((u: any) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.email}</td>
                <td>{u.company?.name}</td>
                <td><span className="badge badge-primary">{u.profile?.name}</span></td>
                <td>{u.person ? `${u.person.firstName} ${u.person.lastName}` : '—'}</td>
                <td><span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.isActive ? 'Ativo' : 'Inativo'}</span></td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {hasPermission('users:update') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(u); setShowModal(true); }}>
                        <Edit size={14} />
                      </button>
                    )}
                    {hasPermission('users:delete') && (
                      <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Excluir usuário?')) deleteMutation.mutate(u.id); }}>
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
        <UserModal
          user={editUser}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['users'] }); }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSuccess }: any) {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(user || { companyId: currentUser?.companyId });
  const [isLoading, setIsLoading] = useState(false);
  const set = (f: string, v: any) => setForm((prev: any) => ({ ...prev, [f]: v }));

  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: () => profilesService.findAll() });
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => companiesService.findAll(), enabled: currentUser?.isAdmin });
  const { data: persons = [] } = useQuery({ queryKey: ['persons-all'], queryFn: () => personsService.findAll() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const payload = { ...form };
      if (!payload.personId) delete payload.personId;
      if (user?.id) await usersService.update(user.id, payload);
      else await usersService.create(payload);
      onSuccess();
    } catch (err: any) { alert(err?.message || 'Erro'); } finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input className="form-control" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} required />
            </div>
            {!user && (
              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input className="form-control" type="password" value={form.password || ''} onChange={(e) => set('password', e.target.value)} required minLength={6} />
              </div>
            )}
            {currentUser?.isAdmin && (
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <select className="form-control" value={form.companyId || ''} onChange={(e) => set('companyId', e.target.value)}>
                  <option value="">Selecione...</option>
                  {(companies as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Perfil *</label>
              <select className="form-control" value={form.profileId || ''} onChange={(e) => set('profileId', e.target.value)} required>
                <option value="">Selecione...</option>
                {(profiles as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pessoa Vinculada (Opcional)</label>
              <select className="form-control" value={form.personId || ''} onChange={(e) => set('personId', e.target.value || '')}>
                <option value="">Selecione...</option>
                {(persons as any[]).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
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
