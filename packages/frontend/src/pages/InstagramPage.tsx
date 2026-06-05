import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instagramService, personsService } from '../services';
import { Instagram, Plus, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function InstagramPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const { data: persons = [] } = useQuery({
    queryKey: ['persons', 'active'],
    queryFn: () => personsService.findAll({ status: 'ACTIVE' }),
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['instagram-posts', selectedPersonId],
    queryFn: () => instagramService.getPostsByPerson(selectedPersonId),
    enabled: !!selectedPersonId,
  });

  const { data: config } = useQuery({
    queryKey: ['instagram-config'],
    queryFn: () => instagramService.getConfig(),
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Monitoramento Instagram</h2><p>Acompanhe publicações e validação de missões</p></div>
        {hasPermission('instagram:manage') && (
          <button id="btn-add-post" className="btn btn-primary" onClick={() => setShowPostModal(true)}>
            <Plus size={16} /> Registrar Post Manual
          </button>
        )}
      </div>

      {/* Config Banner */}
      {(config as any)?.isActive ? (
        <div className="card" style={{ background: 'rgba(67, 233, 123, 0.08)', borderColor: 'rgba(67, 233, 123, 0.3)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Webhook Instagram Ativo</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Conta: {(config as any)?.instagramAccountId || 'Configurada'} • Monitorando automaticamente
              </div>
            </div>
          </div>
          {hasPermission('instagram:manage') && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowConfigModal(true)}>
              Editar Configuração
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ background: 'rgba(247, 151, 30, 0.08)', borderColor: 'rgba(247, 151, 30, 0.3)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Instagram size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Webhook não configurado no sistema</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Clique ao lado para cadastrar as credenciais da empresa e ativar o monitoramento automático
              </div>
            </div>
          </div>
          {hasPermission('instagram:manage') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowConfigModal(true)}>
              Configurar Integração
            </button>
          )}
        </div>
      )}

      {/* Person Selector */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Selecionar Pessoa:</label>
          <select
            className="form-control"
            style={{ maxWidth: 300 }}
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
          >
            <option value="">Selecione uma pessoa...</option>
            {(persons as any[]).map((p: any) => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName} {p.instagramUsername ? `(@${p.instagramUsername})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts */}
      {!selectedPersonId ? (
        <div className="empty-state card">
          <Instagram size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3>Selecione uma pessoa para ver as publicações</h3>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Post ID</th>
                <th>Data</th>
                <th>Foto</th>
                <th>Marcou</th>
                <th>Comentou</th>
                <th>Compartilhou</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></td></tr>
              ) : (posts as any[]).length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><h3>Nenhum post registrado</h3></div></td></tr>
              ) : (posts as any[]).map((post: any) => (
                <tr key={post.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{post.instagramPostId}</td>
                  <td>{new Date(post.timestamp).toLocaleDateString('pt-BR')}</td>
                  <td>{post.hasPhoto ? '✅' : '❌'}</td>
                  <td>{post.hasTag ? '✅' : '❌'}</td>
                  <td>{post.hasComment ? '✅' : '❌'}</td>
                  <td>{post.hasShare ? '✅' : '❌'}</td>
                  <td>
                    <span className={`badge ${
                      post.status === 'VALIDATED' ? 'badge-active' :
                      post.status === 'VALIDATING' ? 'badge-pending' : 'badge-inactive'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPostModal && (
        <ManualPostModal
          persons={persons as any[]}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => { setShowPostModal(false); qc.invalidateQueries({ queryKey: ['instagram-posts'] }); }}
        />
      )}

      {showConfigModal && (
        <ConfigModal
          config={config}
          onClose={() => setShowConfigModal(false)}
          onSuccess={() => { setShowConfigModal(false); qc.invalidateQueries({ queryKey: ['instagram-config'] }); }}
        />
      )}
    </div>
  );
}

function ConfigModal({ config, onClose, onSuccess }: any) {
  const [form, setForm] = useState<any>({
    instagramAccountId: '',
    accessToken: '',
    webhookVerifyToken: '',
    isActive: true,
    ...config,
  });
  const [isLoading, setIsLoading] = useState(false);
  const set = (f: string, v: any) => setForm((prev: any) => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await instagramService.updateConfig(form);
      onSuccess();
    } catch (err: any) {
      alert(err?.message || 'Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Configurar Webhook do Instagram</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">ID da Conta Comercial do Instagram</label>
              <input
                className="form-control"
                value={form.instagramAccountId || ''}
                onChange={(e) => set('instagramAccountId', e.target.value)}
                placeholder="Ex: 17841400000000000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Token de Acesso (Access Token)</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.accessToken || ''}
                onChange={(e) => set('accessToken', e.target.value)}
                placeholder="Cole o token de acesso de longa duração do Meta"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Token de Verificação do Webhook (Verify Token)</label>
              <input
                className="form-control"
                value={form.webhookVerifyToken || ''}
                onChange={(e) => set('webhookVerifyToken', e.target.value)}
                placeholder="Deve coincidir com o configurado no portal da Meta"
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                />
                Ativar automação do Instagram
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManualPostModal({ persons, onClose, onSuccess }: any) {
  const [form, setForm] = useState<any>({ hasPhoto: true });
  const [isLoading, setIsLoading] = useState(false);
  const set = (f: string, v: any) => setForm((prev: any) => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      await instagramService.createManualPost({ ...form, instagramPostId: form.instagramPostId || `manual-${Date.now()}` });
      onSuccess();
    } catch (err: any) { alert(err?.message || 'Erro'); } finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Registrar Post Manual</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Pessoa *</label>
              <select className="form-control" value={form.personId || ''} onChange={(e) => set('personId', e.target.value)} required>
                <option value="">Selecione...</option>
                {persons.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ID do Post Instagram</label>
              <input className="form-control" value={form.instagramPostId || ''} onChange={(e) => set('instagramPostId', e.target.value)} placeholder="ID do post (opcional)" />
            </div>
            <div className="form-group">
              <label className="form-label">URL da Mídia</label>
              <input className="form-control" value={form.mediaUrl || ''} onChange={(e) => set('mediaUrl', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { field: 'hasTag', label: '🏷️ Marcou a empresa' },
                { field: 'hasComment', label: '💬 Comentou' },
                { field: 'hasShare', label: '🔁 Compartilhou' },
              ].map(({ field, label }) => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={!!form[field]} onChange={(e) => set(field, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Registrando...' : 'Registrar e Validar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
