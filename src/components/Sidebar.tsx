import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  GraduationCap, 
  Users, 
  FileText,
  School,
  LogOut,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Utama',
      subtitle: 'Ringkasan & Early Warning',
      icon: LayoutDashboard,
    },
    {
      id: 'program-kerja',
      label: 'Program Kerja',
      subtitle: 'Tupoksi Perencanaan & Evaluasi',
      icon: ClipboardList,
    },
    {
      id: 'analisis-akademik',
      label: 'Analisis Akademik',
      subtitle: 'Tupoksi Evaluasi Belajar',
      icon: GraduationCap,
      children: [
        { id: 'analisis-jurnal', label: 'Jurnal Mengajar' },
        { id: 'analisis-nilai', label: 'Nilai & Intervensi' }
      ]
    },
    {
      id: 'supervisi-guru',
      label: 'Supervisi & Mutu KBM',
      subtitle: 'Kontrol & Pendampingan Guru',
      icon: Users,
      children: [
        { id: 'supervisi-administrasi', label: 'Administrasi Pembelajaran' },
        { id: 'supervisi-jurnal-kbm', label: 'Jurnal Mengajar' }
      ]
    },
    {
      id: 'dokumen-kurikulum',
      label: 'Dokumen Kurikulum (KOSP)',
      subtitle: 'Bank Data & Catatan Revisi',
      icon: FileText,
    },
  ];

  return (
    <aside className="w-80 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-10" id="sidebar-container">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800" id="sidebar-header">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/20 flex items-center justify-center shrink-0 w-11 h-11 overflow-hidden">
            <img 
              src="/SEKOLAH.png" 
              alt="Logo SMPN 2 Puriala" 
              className="h-9 w-9 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('sidebar-logo-fallback');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div id="sidebar-logo-fallback" style={{ display: 'none' }}>
              <School className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white tracking-wide">SIMUTU</h1>
            <p className="text-[11px] text-emerald-400 font-medium">SMP NEGERI 2 PURIALA</p>
          </div>
        </div>
      </div>

      {/* User profile info */}
      <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-950/40" id="sidebar-user-profile">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-emerald-500/30">
            SP
          </div>
          <div className="overflow-hidden">
            <h3 className="font-semibold text-xs text-slate-200 truncate">Suherman, S.Pd.Gr</h3>
            <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-medium mt-0.5">
              Wakasek Kurikulum
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 bg-slate-900/60 rounded px-2.5 py-1.5 border border-slate-800/40">
          <Calendar className="h-3 w-3 text-emerald-400 shrink-0" />
          <span>TA 2026/2027 • Semester Ganjil</span>
        </div>
      </div>

      {/* Sidebar Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar" id="sidebar-navigation">
        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2.5 mb-2">
          STRUKTUR MENU UTAMA
        </p>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isParentOfActiveChild = item.children && item.children.some(child => child.id === activeTab);
          const isActive = activeTab === item.id || isParentOfActiveChild;
          const hasChildren = !!item.children;
          
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (hasChildren) {
                    setActiveTab(item.children![0].id);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between text-left px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-emerald-600 text-white font-medium shadow-md shadow-emerald-600/10' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
                id={`sidebar-tab-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-emerald-500/40 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                  }`}>
                    <IconComponent className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 leading-none ${isActive ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                {!hasChildren && (
                  <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                    isActive ? 'text-white opacity-100 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                  }`} />
                )}
              </button>

              {/* Sub-menu options rendering */}
              {hasChildren && isActive && (
                <div className="pl-12 pr-2 py-1 space-y-1 bg-slate-950/20 rounded-lg border-l-2 border-emerald-500/40 ml-4 animate-fade-in">
                  {item.children!.map((child) => {
                    const isChildActive = activeTab === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => setActiveTab(child.id)}
                        className={`w-full text-left py-2 px-3 text-[11px] rounded-lg transition-all ${
                          isChildActive
                            ? 'text-white bg-slate-800/80 font-bold shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
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
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center text-[10px] text-slate-500" id="sidebar-footer">
        <p>© 2026 SMP Negeri Indonesia</p>
        <p className="mt-0.5 text-emerald-600 font-semibold uppercase tracking-wider">Kurikulum Merdeka v2.0</p>
      </div>
    </aside>
  );
}
