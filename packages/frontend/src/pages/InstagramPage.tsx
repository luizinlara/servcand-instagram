import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instagramService, personsService } from '../services';
import { Instagram, Plus, CheckCircle, RefreshCw, Eye, Terminal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function InstagramPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'logs'>('posts');
  const [selectedLogPayload, setSelectedLogPayload] = useState<any | null>(null);

  const { data: persons = [] } = useQuery({
    queryKey: ['persons', 'active'],
    queryFn: () => personsService.findAll({ status: 'ACTIVE' }),
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['instagram-posts', selectedPersonId],
    queryFn: () => instagramService.getPostsByPerson(selectedPersonId),
    enabled: !!selectedPersonId && activeTab === 'posts',
  });

  const { data: config } = useQuery({
    queryKey: ['instagram-config'],
    queryFn: () => instagramService.getConfig(),
  });

  const { data: logs = [], isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['instagram-logs'],
    queryFn: () => instagramService.getLogs(),
    enabled: activeTab === 'logs',
    refetchInterval: activeTab === 'logs' ? 5000 : false,
  });

  const getLogDetails = (payload: any) => {
    if (!payload) return 'Sem payload';
    if (payload.object === 'instagram') {
      const changes: string[] = [];
      payload.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          changes.push(`${change.field} (${change.value?.username || change.value?.from?.username || 'desconhecido'})`);
        });
      });
      return changes.length > 0 ? `Instagram: ${changes.join(', ')}` : 'Evento Instagram';
    }
    if (payload['hub.challenge']) {
      return `Validação de Webhook (Desafio: ${payload['hub.challenge']})`;
    }
    return JSON.stringify(payload).substring(0, 60) + '...';
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Monitoramento Instagram</h2><p>Acompanhe publicações e validação de missões</p></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'posts' && hasPermission('instagram:manage') && (
            <button id="btn-add-post" className="btn btn-primary" onClick={() => setShowPostModal(true)}>
              <Plus size={16} /> Registrar Post Manual
            </button>
          )}
          {activeTab === 'logs' && (
            <button className="btn btn-secondary" onClick={() => refetchLogs()}>
              <RefreshCw size={16} /> Atualizar Logs
            </button>
          )}
        </div>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className="btn"
          onClick={() => setActiveTab('posts')}
          style={{
            background: activeTab === 'posts' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'posts' ? 'white' : 'var(--text-muted)',
            border: activeTab === 'posts' ? 'none' : '1px solid var(--border)',
            fontWeight: 500,
            padding: '0.5rem 1rem'
          }}
        >
          <Instagram size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Publicações
        </button>
        <button
          className="btn"
          onClick={() => setActiveTab('logs')}
          style={{
            background: activeTab === 'logs' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'logs' ? 'white' : 'var(--text-muted)',
            border: activeTab === 'logs' ? 'none' : '1px solid var(--border)',
            fontWeight: 500,
            padding: '0.5rem 1rem'
          }}
        >
          <Terminal size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Logs do Webhook
        </button>
      </div>

      {activeTab === 'posts' ? (
        <>
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
        </>
      ) : (
        /* Logs Tab */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Detalhes do Evento</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLogs ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></td></tr>
              ) : (logs as any[]).length === 0 ? (
                <tr><td colSpan={3}><div className="empty-state"><h3>Nenhum webhook recebido recentemente</h3><p>Os payloads enviados pelo Meta/Instagram aparecerão aqui em tempo real.</p></div></td></tr>
              ) : (logs as any[]).map((log: any) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {getLogDetails(log.payload)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => setSelectedLogPayload(log.payload)}
                    >
                      <Eye size={12} /> Ver JSON
                    </button>
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

      {selectedLogPayload && (
        <JSONModal
          payload={selectedLogPayload}
          onClose={() => setSelectedLogPayload(null)}
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

function JSONModal({ payload, onClose }: { payload: any; onClose: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h2>Conteúdo do Webhook</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <pre style={{
            background: 'var(--bg-elevated)',
            padding: '1rem',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--text-secondary)'
          }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
