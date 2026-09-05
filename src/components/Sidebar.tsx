import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  GraduationCap, 
  Users, 
  FileText,
  School,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gDriveUser: any;
  gDriveToken: string | null;
  gDriveNeedsAuth: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab,
  gDriveUser,
  gDriveToken,
  gDriveNeedsAuth,
  isLoggingIn,
  onLogin,
  onLogout
}: SidebarProps) {
  
  const menuGroups = [
    {
      title: 'UTAMA',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Utama',
          icon: LayoutDashboard,
        },
        {
          id: 'program-kerja',
          label: 'Program Kerja',
          icon: ClipboardList,
        }
      ]
    },
    {
      title: 'AKADEMIK',
      items: [
        {
          id: 'analisis-akademik',
          label: 'Analisis Akademik',
          icon: GraduationCap,
        }
      ]
    },
    {
      title: 'SUPERVISI',
      items: [
        {
          id: 'supervisi-guru',
          label: 'Supervisi & Mutu KBM',
          icon: Users,
          children: [
            { id: 'supervisi-administrasi', label: 'Administrasi Pembelajaran' },
            { id: 'supervisi-jurnal-kbm', label: 'Jurnal Mengajar' },
            { id: 'supervisi-absen-piket', label: 'Absen Piket' }
          ]
        }
      ]
    },
    {
      title: 'KURIKULUM',
      items: [
        {
          id: 'dokumen-kurikulum',
          label: 'Dokumen Kurikulum (KOSP)',
          icon: FileText,
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-10 shrink-0" id="sidebar-container">
      {/* Compact Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between" id="sidebar-header">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-500/10 p-1 rounded-lg border border-emerald-500/20 flex items-center justify-center shrink-0 w-8 h-8 overflow-hidden">
            <img 
              src="/sekolah_logo.jpg?v=2" 
              alt="Logo SMPN 2 Puriala" 
              className="h-6 w-6 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('sidebar-logo-fallback');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div id="sidebar-logo-fallback" style={{ display: 'none' }}>
              <School className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-xs leading-none text-white tracking-wider">SIMUTU</h1>
            <p className="text-[9px] text-emerald-400 font-bold mt-1 tracking-wide uppercase">SMPN 2 Puriala</p>
          </div>
        </div>
      </div>

      {/* Structured Compact Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto custom-scrollbar" id="sidebar-navigation">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase px-2 mb-1.5">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isParentOfActiveChild = item.children && item.children.some(child => child.id === activeTab);
                const isActive = activeTab === item.id || isParentOfActiveChild;
                const hasChildren = !!item.children;
                
                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          setActiveTab(item.children![0].id);
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg transition-all duration-150 group relative ${
                        isActive 
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      }`}
                      id={`sidebar-tab-${item.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded transition-colors duration-150 ${
                          isActive ? 'bg-emerald-500/30 text-white' : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700'
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className={`text-[11px] font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {item.label}
                        </span>
                      </div>
                      {!hasChildren && (
                        <ChevronRight className={`h-3 w-3 transition-transform duration-150 ${
                          isActive ? 'text-white opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-0.5'
                        }`} />
                      )}
                    </button>

                    {/* Sub-menu rendering */}
                    {hasChildren && isActive && (
                      <div className="pl-8 pr-1 py-0.5 space-y-0.5 bg-slate-950/20 rounded-md border-l border-emerald-500/40 ml-3.5 animate-fade-in">
                        {item.children!.map((child) => {
                          const isChildActive = activeTab === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => setActiveTab(child.id)}
                              className={`w-full text-left py-1 px-2.5 text-[10px] rounded transition-all ${
                                isChildActive
                                  ? 'text-white bg-slate-800 font-extrabold'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                              }`}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/10 text-center text-[9px] text-slate-500 shrink-0" id="sidebar-footer">
        <p className="font-semibold text-emerald-600/90 uppercase tracking-wider">Kurikulum Merdeka v2.0</p>
      </div>
    </aside>
  );
}
