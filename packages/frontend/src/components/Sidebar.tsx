import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Shield, MapPin,
  Star, Instagram, DollarSign, Settings, LogOut,
  ChevronRight, Award, UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  permission?: string;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { to: '/persons', icon: <Users size={18} />, label: 'Pessoas', permission: 'persons:read' },
      { to: '/leadership', icon: <UserCheck size={18} />, label: 'Lideranças', permission: 'leadership:read' },
      { to: '/regions', icon: <MapPin size={18} />, label: 'Regiões', permission: 'regions:read' },
    ],
  },
  {
    title: 'Gamificação',
    items: [
      { to: '/missions', icon: <Star size={18} />, label: 'Missões', permission: 'missions:read' },
      { to: '/salary', icon: <DollarSign size={18} />, label: 'Salários', permission: 'salary:read' },
      { to: '/instagram', icon: <Instagram size={18} />, label: 'Instagram', permission: 'instagram:read' },
    ],
  },
  {
    title: 'Administração',
    items: [
      { to: '/companies', icon: <Building2 size={18} />, label: 'Empresas', permission: 'companies:read' },
      { to: '/users', icon: <Shield size={18} />, label: 'Usuários', permission: 'users:read' },
      { to: '/profiles', icon: <Award size={18} />, label: 'Perfis', permission: 'profiles:read' },
      { to: '/parameters', icon: <Settings size={18} />, label: 'Parâmetros', permission: 'parameters:read' },
    ],
  },
];

export default function Sidebar() {
  const { user, hasPermission, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">SC</div>
        <div className="sidebar-logo-text">
          <h2>ServcCand</h2>
          <span>{user?.companyName || 'Sistema'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => {
              if (user?.profile?.name === 'EMPLOYEE') {
                return item.to === '/dashboard';
              }
              return !item.permission || hasPermission(item.permission);
            }
          );
          if (!visibleItems.length) return null;

          return (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info" onClick={handleLogout} title="Clique para sair">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <h4>{user?.email}</h4>
            <span>{user?.profile?.name}</span>
          </div>
          <LogOut size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
        </div>
      </div>
    </aside>
  );
}
