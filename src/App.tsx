import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProgramKerjaView from './components/ProgramKerja';
import AnalisisAkademik from './components/AnalisisAkademik';
import SupervisiGuruView from './components/SupervisiGuru';
import DokumenKurikulumView from './components/DokumenKurikulum';
import JurnalMengajarView from './components/JurnalMengajar';
import AnalisisJurnal from './components/AnalisisJurnal';
import { 
  ProgramKerja, 
  SiswaNilai, 
  IntervensiSiswa, 
  SupervisiGuru, 
  PerangkatAjar, 
  PerangkatAjarKelasDetail,
  DokumenKurikulum,
  JurnalMengajar,
  JurnalMengajarHarian,
  INITIAL_PROGRAMS,
  INITIAL_SISWA_NILAI,
  INITIAL_INTERVENSI,
  INITIAL_SUPERVISI,
  INITIAL_COMPLIANCE,
  INITIAL_DOCUMENTS,
  INITIAL_JURNAL,
  INITIAL_JURNAL_HARIAN
} from './types';
import { 
  DEFAULT_SPREADSHEET_ID, 
  fetchGoogleSheetNilai, 
  fetchGoogleSheetJurnal,
  syncToGoogleSheetHook 
} from './lib/googleSheetSync';
import { 
  Bell, 
  Calendar, 
  HelpCircle, 
  CheckCircle,
  Clock,
  Menu
} from 'lucide-react';

export default function App() {
  // Navigation active tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Google Sheets Sync Configuration States
  const [googleSheetId, setGoogleSheetId] = useState<string>(() => {
    return localStorage.getItem('kurikulum_google_sheet_id') || DEFAULT_SPREADSHEET_ID;
  });

  const [googleWebhookUrl, setGoogleWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('kurikulum_google_webhook_url') || '';
  });

  const [googleSyncLoading, setGoogleSyncLoading] = useState<boolean>(false);
  const [googleSyncError, setGoogleSyncError] = useState<string | null>(null);
  const [lastGoogleSyncTime, setLastGoogleSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('kurikulum_last_sync_time') || null;
  });

  // Unified State Engine
  const [programs, setPrograms] = useState<ProgramKerja[]>(() => {
    const saved = localStorage.getItem('kurikulum_programs');
    return saved ? JSON.parse(saved) : INITIAL_PROGRAMS;
  });

  const [nilaiSiswa, setNilaiSiswa] = useState<SiswaNilai[]>(() => {
    const saved = localStorage.getItem('kurikulum_nilai_siswa');
    return saved ? JSON.parse(saved) : INITIAL_SISWA_NILAI;
  });

  const [intervensi, setIntervensi] = useState<IntervensiSiswa[]>(() => {
    const saved = localStorage.getItem('kurikulum_intervensi');
    return saved ? JSON.parse(saved) : INITIAL_INTERVENSI;
  });

  const [supervisi, setSupervisi] = useState<SupervisiGuru[]>(() => {
    const saved = localStorage.getItem('kurikulum_supervisi');
    return saved ? JSON.parse(saved) : INITIAL_SUPERVISI;
  });

  const [compliance, setCompliance] = useState<PerangkatAjar[]>(() => {
    const saved = localStorage.getItem('kurikulum_compliance');
    return saved ? JSON.parse(saved) : INITIAL_COMPLIANCE;
  });

  const [documents, setDocuments] = useState<DokumenKurikulum[]>(() => {
    const saved = localStorage.getItem('kurikulum_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [jurnals, setJurnals] = useState<JurnalMengajar[]>(() => {
    const saved = localStorage.getItem('kurikulum_jurnals');
    return saved ? JSON.parse(saved) : INITIAL_JURNAL;
  });

  const [jurnalHarian, setJurnalHarian] = useState<JurnalMengajarHarian[]>(() => {
    const saved = localStorage.getItem('kurikulum_jurnal_harian');
    return saved ? JSON.parse(saved) : INITIAL_JURNAL_HARIAN;
  });

  const [jurnalSyncLoading, setJurnalSyncLoading] = useState<boolean>(false);
  const [jurnalSyncError, setJurnalSyncError] = useState<string | null>(null);
  const [lastJurnalSyncTime, setLastJurnalSyncTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('kurikulum_jurnal_last_sync_time');
    return saved ? new Date(saved) : null;
  });

  const [notifications, setNotifications] = useState<string[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('kurikulum_programs', JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem('kurikulum_nilai_siswa', JSON.stringify(nilaiSiswa));
  }, [nilaiSiswa]);

  useEffect(() => {
    localStorage.setItem('kurikulum_intervensi', JSON.stringify(intervensi));
  }, [intervensi]);

  useEffect(() => {
    localStorage.setItem('kurikulum_supervisi', JSON.stringify(supervisi));
  }, [supervisi]);

  useEffect(() => {
    localStorage.setItem('kurikulum_compliance', JSON.stringify(compliance));
  }, [compliance]);

  useEffect(() => {
    localStorage.setItem('kurikulum_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('kurikulum_jurnals', JSON.stringify(jurnals));
  }, [jurnals]);

  useEffect(() => {
    localStorage.setItem('kurikulum_jurnal_harian', JSON.stringify(jurnalHarian));
  }, [jurnalHarian]);

  useEffect(() => {
    localStorage.setItem('kurikulum_google_sheet_id', googleSheetId);
  }, [googleSheetId]);

  useEffect(() => {
    localStorage.setItem('kurikulum_google_webhook_url', googleWebhookUrl);
  }, [googleWebhookUrl]);

  // Handler: Fetch/refresh data from Google Sheets
  const handleRefreshFromGoogleSheets = async (customId?: string) => {
    setGoogleSyncLoading(true);
    setGoogleSyncError(null);
    try {
      const targetId = customId || googleSheetId;
      const data = await fetchGoogleSheetNilai(targetId);
      if (data && data.length > 0) {
        setNilaiSiswa(data);
        const timeString = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        setLastGoogleSyncTime(timeString);
        localStorage.setItem('kurikulum_last_sync_time', timeString);
      } else {
        throw new Error("Data sheet kosong atau tidak valid.");
      }
    } catch (error: any) {
      const msg = error.message || "Gagal mengimpor dari Google Sheets. Pastikan link diatur agar semua orang yang memiliki link dapat melihat.";
      setGoogleSyncError(msg);
      console.error(error);
    } finally {
      setGoogleSyncLoading(false);
    }
  };

  // Handler: Pull/sync Jurnal Mengajar from Google Sheets
  const handlePullJurnal = async (sheetId: string) => {
    setJurnalSyncLoading(true);
    setJurnalSyncError(null);
    try {
      const targetId = sheetId || googleSheetId;
      const records = await fetchGoogleSheetJurnal(targetId);
      if (records && records.length > 0) {
        setJurnalHarian(records);
        const now = new Date();
        setLastJurnalSyncTime(now);
        localStorage.setItem('kurikulum_jurnal_last_sync_time', now.toISOString());
      } else {
        throw new Error('Tidak ada data jurnal yang berhasil dibaca dari Google Sheet JURNAL MENGAJAR.');
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal menyinkronkan data Jurnal Mengajar dari Google Sheets.';
      setJurnalSyncError(msg);
      throw err;
    } finally {
      setJurnalSyncLoading(false);
    }
  };

  // Handler: Sync all data to Google Sheets via Apps Script Webhook
  const handleSyncToGoogleSheets = async (webhookUrlToUse?: string, customRecords?: SiswaNilai[]) => {
    const url = webhookUrlToUse || googleWebhookUrl;
    if (!url) {
      throw new Error("URL Webhook Google Apps Script belum dikonfigurasi.");
    }
    setGoogleSyncLoading(true);
    setGoogleSyncError(null);
    try {
      const recordsToSync = customRecords || nilaiSiswa;
      const success = await syncToGoogleSheetHook(url, recordsToSync);
      if (success) {
        const timeString = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        setLastGoogleSyncTime(timeString);
        localStorage.setItem('kurikulum_last_sync_time', timeString);
        return true;
      } else {
        throw new Error("Respon server Google Sheets menunjukkan kegagalan.");
      }
    } catch (error: any) {
      const msg = error.message || "Gagal mensinkronisasikan ke Google Sheets.";
      setGoogleSyncError(msg);
      throw error;
    } finally {
      setGoogleSyncLoading(false);
    }
  };

  // Automatically fetch from Google Sheets on app startup
  useEffect(() => {
    handleRefreshFromGoogleSheets();
  }, []);

  // Compute live notifications for the banner
  useEffect(() => {
    const alerts: string[] = [];
    
    // Alert 1: underperforming grades
    const lowGradesCount = nilaiSiswa.filter(n => n.akhir < 70).length;
    if (lowGradesCount > 0) {
      alerts.push(`${lowGradesCount} siswa terdeteksi memiliki nilai akhir di bawah KKM (70)`);
    }

    // Alert 2: incomplete teacher compliance
    const uncompliantCount = compliance.filter(c => {
      const classes = c.kelasAjar.split(',').map(s => s.trim()).filter(Boolean);
      if (classes.length === 0) return true;
      const keys = [
        'kalenderAkademik', 'cp', 'analisisCp', 'tp', 'atp',
        'prota', 'prosem', 'mingguEfektif', 'modulAjar',
        'asesmen', 'formatPenilaian', 'rubrikPenilaian'
      ] as const;
      
      return classes.some(cls => {
        if (!c.kepatuhanKelas || !c.kepatuhanKelas[cls]) return true;
        const detail = c.kepatuhanKelas[cls];
        return keys.some(key => detail[key] !== true);
      });
    }).length;
    if (uncompliantCount > 0) {
      alerts.push(`${uncompliantCount} guru belum menyerahkan berkas administrasi KBM secara lengkap`);
    }

    // Alert 3: active pending programs for current semester
    const activePendingProgs = programs.filter(p => p.semester === 1 && p.status === 'Belum').length;
    if (activePendingProgs > 0) {
      alerts.push(`Ada ${activePendingProgs} program semester ganjil yang belum mulai dilaksanakan`);
    }

    setNotifications(alerts);
  }, [nilaiSiswa, compliance, programs]);

  // Handler: Add a program
  const handleAddProgram = (newProg: Omit<ProgramKerja, 'id'>) => {
    const p: ProgramKerja = {
      ...newProg,
      id: `prog-${Date.now()}`
    };
    setPrograms(prev => [p, ...prev]);
  };

  // Handler: Update program status
  const handleUpdateProgramStatus = (id: string, status: ProgramKerja['status']) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === id) {
        // If status changes to Selesai, set date, else leave it
        return {
          ...p,
          status,
          evidenceDate: status === 'Selesai' && !p.evidenceDate 
            ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
            : p.evidenceDate
        };
      }
      return p;
    }));
  };

  // Handler: Upload program evidence
  const handleUploadEvidence = (id: string, fileInfo: { name: string; size: string; date: string }) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === id) {
        if (!fileInfo.name) {
          // Deleting
          return {
            ...p,
            evidenceName: undefined,
            evidenceSize: undefined,
            evidenceDate: undefined
          };
        }
        return {
          ...p,
          evidenceName: fileInfo.name,
          evidenceSize: fileInfo.size,
          evidenceDate: fileInfo.date,
          status: 'Selesai' // Autocomplete program on upload
        };
      }
      return p;
    }));
  };

  // Handler: Update program evaluation notes
  const handleUpdateProgramNotes = (id: string, notes: string) => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
  };

  // Handler: Delete program
  const handleDeleteProgram = (id: string) => {
    setPrograms(prev => prev.filter(p => p.id !== id));
  };

  // Handler: Add single student grade
  const handleAddNilaiSiswa = (newNilai: Omit<SiswaNilai, 'id'>) => {
    const item: SiswaNilai = {
      ...newNilai,
      id: `sn-${Date.now()}`
    };
    setNilaiSiswa(prev => [item, ...prev]);
  };

  // Handler: Delete student grade
  const handleDeleteNilaiSiswa = (id: string) => {
    setNilaiSiswa(prev => prev.filter(n => n.id !== id));
  };

  // Handler: Bulk import student grades
  const handleBulkImport = (newRecords: SiswaNilai[]) => {
    setNilaiSiswa(prev => [...newRecords, ...prev]);
  };

  // Handler: Add student remedial intervention
  const handleAddIntervensi = (newInt: Omit<IntervensiSiswa, 'id'>) => {
    const item: IntervensiSiswa = {
      ...newInt,
      id: `int-${Date.now()}`
    };
    setIntervensi(prev => [item, ...prev]);
  };

  // Handler: Update intervention status
  const handleUpdateIntervensiStatus = (id: string, status: IntervensiSiswa['status']) => {
    setIntervensi(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  // Handler: Add teacher classroom observation
  const handleAddSupervisi = (newSup: Omit<SupervisiGuru, 'id'>) => {
    const item: SupervisiGuru = {
      ...newSup,
      id: `sup-${Date.now()}`
    };
    setSupervisi(prev => [item, ...prev]);
  };

  // Handler: Delete classroom observation record
  const handleDeleteSupervisi = (id: string) => {
    setSupervisi(prev => prev.filter(s => s.id !== id));
  };

  // Handler: Delete teacher from compliance checklist
  const handleDeleteCompliance = (id: string) => {
    setCompliance(prev => prev.filter(c => c.id !== id));
  };

  // Handler: Update a teacher's entire class-by-class compliance mapping
  const handleUpdateTeacherCompliance = (id: string, kepatuhanKelas: Record<string, PerangkatAjarKelasDetail>) => {
    setCompliance(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          kepatuhanKelas,
          revisiTerakhir: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));
  };

  // Handler: Check off teacher compliance document
  const handleToggleCompliance = (id: string, field: keyof PerangkatAjar) => {
    setCompliance(prev => prev.map(c => {
      if (c.id === id) {
        const val = c[field];
        if (typeof val === 'boolean') {
          return {
            ...c,
            [field]: !val,
            revisiTerakhir: new Date().toISOString().split('T')[0]
          };
        }
      }
      return c;
    }));
  };

  // Handler: Add teacher to compliance checklist
  const handleAddComplianceGuru = (newGuru: Omit<PerangkatAjar, 'id'>) => {
    const classes = newGuru.kelasAjar.split(',').map(s => s.trim()).filter(Boolean);
    const kepatuhanKelas: Record<string, PerangkatAjarKelasDetail> = {};
    classes.forEach(cls => {
      kepatuhanKelas[cls] = {
        kalenderAkademik: false,
        cp: false,
        analisisCp: false,
        tp: false,
        atp: false,
        prota: false,
        prosem: false,
        mingguEfektif: false,
        modulAjar: false,
        asesmen: false,
        formatPenilaian: false,
        rubrikPenilaian: false
      };
    });

    const item: PerangkatAjar = {
      ...newGuru,
      id: `comp-${Date.now()}`,
      kepatuhanKelas
    };
    setCompliance(prev => [item, ...prev]);
  };

  // Handler: Upload curriculum file document
  const handleUploadDocument = (newDoc: Omit<DokumenKurikulum, 'id'>) => {
    const doc: DokumenKurikulum = {
      ...newDoc,
      id: `doc-${Date.now()}`
    };
    setDocuments(prev => [doc, ...prev]);
  };

  // Handler: Record revision history for curriculum file
  const handleAddRevisi = (id: string, revisi: DokumenKurikulum['riwayatRevisi'][0]) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          riwayatRevisi: [...d.riwayatRevisi, revisi],
          status: 'Revisi',
          tanggalDibuat: new Date().toISOString().split('T')[0]
        };
      }
      return d;
    }));
  };

  // Handler: Delete curriculum document
  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Helper shortcut from dashboard to schedule intervention on a warning student
  const handleQuickIntervention = (siswa: SiswaNilai) => {
    handleAddIntervensi({
      siswaId: siswa.id,
      namaSiswa: siswa.nama,
      kelas: siswa.kelas,
      mapel: siswa.mapel,
      nilaiAkhir: siswa.akhir,
      masalah: `Kesulitan pada materi pembelajaran ${siswa.mapel}.`,
      rencanaTindakLanjut: 'Dijadwalkan untuk Remedial Teaching sore hari.',
      tanggalIntervensi: new Date().toISOString().split('T')[0],
      status: 'Rencana'
    });
    setActiveTab('analisis-nilai');
  };

  // Handler: Add teaching journal entry
  const handleAddJurnal = (newJur: Omit<JurnalMengajar, 'id'>) => {
    const item: JurnalMengajar = {
      ...newJur,
      id: `jur-${Date.now()}`
    };
    setJurnals(prev => [item, ...prev]);
  };

  // Handler: Delete teaching journal entry
  const handleDeleteJurnal = (id: string) => {
    setJurnals(prev => prev.filter(j => j.id !== id));
  };

  // Tab routing
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            programs={programs}
            nilaiSiswa={nilaiSiswa}
            intervensi={intervensi}
            supervisi={supervisi}
            compliance={compliance}
            setActiveTab={setActiveTab}
            onAddQuickIntervention={handleQuickIntervention}
          />
        );
      case 'program-kerja':
        return (
          <ProgramKerjaView 
            programs={programs}
            onAddProgram={handleAddProgram}
            onUpdateProgramStatus={handleUpdateProgramStatus}
            onUploadEvidence={handleUploadEvidence}
            onUpdateProgramNotes={handleUpdateProgramNotes}
            onDeleteProgram={handleDeleteProgram}
          />
        );
      case 'analisis-akademik':
      case 'analisis-jurnal':
        return (
          <AnalisisJurnal 
            jurnals={jurnals}
            onAddJurnal={handleAddJurnal}
            onDeleteJurnal={handleDeleteJurnal}
          />
        );
      case 'analisis-nilai':
        return (
          <AnalisisAkademik 
            nilaiSiswa={nilaiSiswa}
            intervensi={intervensi}
            onAddNilaiSiswa={handleAddNilaiSiswa}
            onAddIntervensi={handleAddIntervensi}
            onUpdateIntervensiStatus={handleUpdateIntervensiStatus}
            onBulkImport={handleBulkImport}
            onDeleteNilaiSiswa={handleDeleteNilaiSiswa}
            googleSheetId={googleSheetId}
            setGoogleSheetId={setGoogleSheetId}
            googleWebhookUrl={googleWebhookUrl}
            setGoogleWebhookUrl={setGoogleWebhookUrl}
            googleSyncLoading={googleSyncLoading}
            googleSyncError={googleSyncError}
            lastGoogleSyncTime={lastGoogleSyncTime}
            onRefreshFromGoogleSheets={handleRefreshFromGoogleSheets}
            onSyncToGoogleSheets={handleSyncToGoogleSheets}
          />
        );
      case 'supervisi-guru':
      case 'supervisi-administrasi':
        return (
          <SupervisiGuruView 
            supervisi={supervisi}
            compliance={compliance}
            onAddSupervisi={handleAddSupervisi}
            onToggleCompliance={handleToggleCompliance}
            onUpdateCompliance={handleUpdateTeacherCompliance}
            onAddComplianceGuru={handleAddComplianceGuru}
            onDeleteSupervisi={handleDeleteSupervisi}
            onDeleteCompliance={handleDeleteCompliance}
          />
        );
      case 'supervisi-jurnal-kbm':
        return (
          <JurnalMengajarView 
            jurnalHarian={jurnalHarian}
            onPullJurnal={handlePullJurnal}
            googleSheetId={googleSheetId}
            setGoogleSheetId={setGoogleSheetId}
            syncLoading={jurnalSyncLoading}
            syncError={jurnalSyncError}
            lastSyncTime={lastJurnalSyncTime}
          />
        );
      case 'dokumen-kurikulum':
        return (
          <DokumenKurikulumView 
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onAddRevisi={handleAddRevisi}
            onDeleteDocument={handleDeleteDocument}
          />
        );
      default:
        return <div className="text-slate-500 font-bold p-8">Halaman Tidak Ditemukan.</div>;
    }
  };

  // Format Page Title
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Utama';
      case 'program-kerja': return 'Manajemen Program Kerja';
      case 'analisis-akademik':
      case 'analisis-jurnal': return 'Rekapitulasi Jurnal Mengajar';
      case 'analisis-nilai': return 'Analisis Nilai & Intervensi';
      case 'supervisi-guru':
      case 'supervisi-administrasi': return 'Administrasi Pembelajaran';
      case 'supervisi-jurnal-kbm': return 'Jurnal Harian Mengajar Guru';
      case 'dokumen-kurikulum': return 'Dokumen Kurikulum (KOSP)';
      default: return 'Command Center';
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans" id="applet-viewport">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Command Center Stage */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-scroll-container">
        {/* Top Control Bar Header */}
        <header className="bg-white h-16 border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs non-printable" id="top-bar-header">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-sm text-slate-800 tracking-wide uppercase">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Live Clock / Calendar widget */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200/40">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>31 Agustus 2026 • Ganjil</span>
            </div>

            {/* Notification system */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-600 transition-colors border border-slate-200/40 cursor-pointer"
                id="btn-bell-notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification drop-down */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-3 z-50 animate-fade-in" id="notifications-box-dropdown">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-800">Notifikasi Peringatan ({notifications.length})</span>
                    <button 
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-4">Tidak ada notifikasi aktif.</p>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div key={idx} className="flex gap-2 p-2 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/50 rounded-lg text-[11px] text-rose-800 leading-snug">
                          <span className="text-rose-500 font-bold shrink-0">⚠️</span>
                          <p>{notif}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Button */}
            <button 
              onClick={() => alert('SIMUTU SMP NEGERI 2 PURIALA - Gunakan panel navigasi kiri untuk mengakses berbagai Tupoksi Kurikulum Merdeka (Program Kerja, Rekap Nilai, Observasi Guru, dan Bank Dokumen KOSP). Semua data tersimpan aman secara offline pada peramban Anda.')}
              className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-500 transition-colors border border-slate-200/40 cursor-pointer"
              title="Informasi Sistem"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Workspace Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1400px] w-full mx-auto" id="workspace-viewport">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
