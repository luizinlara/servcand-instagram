import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
  '/persons': { title: 'Pessoas', subtitle: 'Gerenciamento de funcionários' },
  '/leadership': { title: 'Lideranças', subtitle: 'Lideranças por região/bairro' },
  '/regions': { title: 'Regiões', subtitle: 'Gerenciamento de bairros e regiões' },
  '/missions': { title: 'Missões', subtitle: 'Missões semanais e gamificação' },
  '/salary': { title: 'Salários', subtitle: 'Controle de pagamentos semanais' },
  '/instagram': { title: 'Instagram', subtitle: 'Monitoramento e automação' },
  '/companies': { title: 'Empresas', subtitle: 'Multi-empresa - gestão geral' },
  '/users': { title: 'Usuários', subtitle: 'Usuários do sistema' },
  '/profiles': { title: 'Perfis & Permissões', subtitle: 'Controle de acesso' },
  '/parameters': { title: 'Parâmetros', subtitle: 'Configurações do sistema' },
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const page = pageTitles[location.pathname] || { title: 'ServCand', subtitle: '' };

  return (
    <header className="header">
      <div className="header-left">
        <h1>{page.title}</h1>
        {page.subtitle && <p>{page.subtitle}</p>}
      </div>
      <div className="header-right">
        <button className="btn btn-secondary btn-icon" title="Notificações">
          <Bell size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
          {user?.companyName}
        </div>
      </div>
    </header>
  );
}
