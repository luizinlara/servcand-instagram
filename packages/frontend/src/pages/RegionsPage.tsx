import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { regionsService, leadershipService, personsService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export default function RegionsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editRegion, setEditRegion] = useState<any>(null);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.findAll(),
  });

  const deleteRegion = useMutation({
    mutationFn: (id: string) => regionsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Regiões / Bairros</h2><p>Organização geográfica por área</p></div>
        {hasPermission('regions:create') && (
          <button id="btn-add-region" className="btn btn-primary" onClick={() => { setEditRegion(null); setShowRegionModal(true); }}>
            <Plus size={16} /> Nova Região
          </button>
        )}
      </div>

      <div className="grid-3">
        {isLoading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        ) : (regions as any[]).map((r: any) => (
          <div key={r.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="stat-icon purple"><MapPin size={20} /></div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{r.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', flex: 1, padding: '0.5rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{r._count?.persons || 0}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pessoas</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1, padding: '0.5rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{r._count?.leaderships || 0}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lideranças</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setSelectedRegion(r); setShowLeaderModal(true); }}>
                Ver Líderes
              </button>
              {hasPermission('regions:update') && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditRegion(r); setShowRegionModal(true); }}>
                  <Edit size={14} />
                </button>
              )}
              {hasPermission('regions:delete') && (
                <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Excluir?')) deleteRegion.mutate(r.id); }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showRegionModal && (
        <RegionModal
          region={editRegion}
          onClose={() => setShowRegionModal(false)}
          onSuccess={() => { setShowRegionModal(false); qc.invalidateQueries({ queryKey: ['regions'] }); }}
        />
      )}
    </div>
  );
}

function RegionModal({ region, onClose, onSuccess }: any) {
  const { user } = useAuth();
  const [form, setForm] = useState(region || { companyId: user?.companyId });
  const [isLoading, setIsLoading] = useState(false);
  const set = (f: string, v: any) => setForm((prev: any) => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      if (region?.id) await regionsService.update(region.id, form);
      else await regionsService.create(form);
      onSuccess();
    } catch (err: any) { alert(err?.message || 'Erro'); } finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h2>{region ? 'Editar Região' : 'Nova Região'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome da Região/Bairro *</label>
              <input className="form-control" value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea className="form-control" value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={2} />
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
