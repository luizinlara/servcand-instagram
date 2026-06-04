import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesService } from '../services';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilesPage() {
  const { hasPermission, user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProfile, setEditProfile] = useState<any>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesService.findAll(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => profilesService.findPermissions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profilesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const groupedPermissions = (permissions as any[]).reduce((acc: any, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div><h2>Perfis & Permissões</h2><p>Controle de acesso por perfil</p></div>
        {hasPermission('profiles:create') && (
          <button id="btn-add-profile" className="btn btn-primary" onClick={() => { setEditProfile(null); setShowModal(true); }}>
            <Plus size={16} /> Novo Perfil
          </button>
        )}
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {isLoading ? null : (profiles as any[]).map((p: any) => (
          <div key={p.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="stat-icon purple"><Shield size={20} /></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{p.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p._count?.users || 0} usuários</p>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{p.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
              {p.permissions.slice(0, 5).map((pp: any) => (
                <span key={pp.permission.name} className="badge badge-primary" style={{ fontSize: '0.6rem' }}>
                  {pp.permission.name}
                </span>
              ))}
              {p.permissions.length > 5 && (
                <span className="badge badge-inactive" style={{ fontSize: '0.6rem' }}>
                  +{p.permissions.length - 5}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {hasPermission('profiles:update') && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditProfile(p); setShowModal(true); }}>
                  <Edit size={14} /> Editar
                </button>
              )}
              {hasPermission('profiles:delete') && !p.isSystem && (
                <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Excluir perfil?')) deleteMutation.mutate(p.id); }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ProfileModal
          profile={editProfile}
          permissions={groupedPermissions}
          companyId={user?.companyId || ''}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['profiles'] }); }}
        />
      )}
    </div>
  );
}

function ProfileModal({ profile, permissions, companyId, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    description: profile?.description || '',
    companyId: profile?.companyId || companyId,
    permissionIds: profile?.permissions?.map((pp: any) => pp.permission.id) || [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const togglePermission = (permId: string) => {
    setForm((f) => ({
      ...f,
      permissionIds: f.permissionIds.includes(permId)
        ? f.permissionIds.filter((id: string) => id !== permId)
        : [...f.permissionIds, permId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      if (profile?.id) await profilesService.update(profile.id, form);
      else await profilesService.create(form);
      onSuccess();
    } catch (err: any) { alert(err?.message || 'Erro'); } finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2>{profile ? 'Editar Perfil' : 'Novo Perfil'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nome do Perfil *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input className="form-control" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              PERMISSÕES
            </h4>

            {Object.entries(permissions).map(([module, perms]: [string, any]) => (
              <div key={module} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {module}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {perms.map((perm: any) => (
                    <label key={perm.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.35rem 0.65rem',
                      background: form.permissionIds.includes(perm.id) ? 'rgba(108, 99, 255, 0.15)' : 'var(--bg-elevated)',
                      border: `1px solid ${form.permissionIds.includes(perm.id) ? 'rgba(108, 99, 255, 0.4)' : 'var(--border)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: form.permissionIds.includes(perm.id) ? 'var(--primary-light)' : 'var(--text-muted)',
                    }}>
                      <input type="checkbox" checked={form.permissionIds.includes(perm.id)} onChange={() => togglePermission(perm.id)} style={{ display: 'none' }} />
                      {perm.action}
                    </label>
                  ))}
                </div>
              </div>
            ))}
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
