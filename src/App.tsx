import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProgramKerjaView from './components/ProgramKerja';
import AnalisisAkademik from './components/AnalisisAkademik';
import SupervisiGuruView from './components/SupervisiGuru';
import DokumenKurikulumView from './components/DokumenKurikulum';
import JurnalMengajarView from './components/JurnalMengajar';
import AnalisisJurnal from './components/AnalisisJurnal';
import AbsenPiketView from './components/AbsenPiket';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, googleSignOut, setManualAccessToken } from './lib/googleDriveAuth';
import { fetchGoogleSheetValuesWithToken, parseSheetValuesToNilai, parseSheetValuesToJurnal, findSpreadsheetByName, fetchDriveImagesMap, parsePiketSheetValues, fetchPublicGoogleSheetValues } from './lib/googleDriveApi';
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
  AbsenPiket,
  INITIAL_PROGRAMS,
  INITIAL_SISWA_NILAI,
  INITIAL_INTERVENSI,
  INITIAL_SUPERVISI,
  INITIAL_COMPLIANCE,
  INITIAL_DOCUMENTS,
  INITIAL_JURNAL,
  INITIAL_JURNAL_HARIAN,
  INITIAL_ABSEN_PIKET
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
  Menu,
  Search,
  LogOut,
  X,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Navigation active tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Google Drive Auth states
  const [gDriveUser, setGDriveUser] = useState<any | null>(null);
  const [gDriveToken, setGDriveToken] = useState<string | null>(null);
  const [gDriveNeedsAuth, setGDriveNeedsAuth] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGDriveUser(user);
        setGDriveToken(token);
        setGDriveNeedsAuth(false);
      },
      () => {
        setGDriveUser(null);
        setGDriveToken(null);
        setGDriveNeedsAuth(true);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const [showManualTokenModal, setShowManualTokenModal] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [manualTokenError, setManualTokenError] = useState<string | null>(null);
  const [lastLoginError, setLastLoginError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLastLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGDriveUser(result.user);
        setGDriveToken(result.accessToken);
        setGDriveNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      const errMsg = err?.message || String(err);
      setLastLoginError(errMsg);
      // Automatically show manual fallback when popup window is closed or blocked inside the cross-origin iframe
      setShowManualTokenModal(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) {
      setManualTokenError('Access token tidak boleh kosong.');
      return;
    }
    setIsLoggingIn(true);
    setManualTokenError(null);
    try {
      const result = await setManualAccessToken(manualTokenInput.trim());
      setGDriveUser(result.user);
      setGDriveToken(result.accessToken);
      setGDriveNeedsAuth(false);
      setShowManualTokenModal(false);
      setManualTokenInput('');
    } catch (err: any) {
      setManualTokenError(err.message || 'Token tidak valid atau tidak dapat memverifikasi profil.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setGDriveUser(null);
      setGDriveToken(null);
      setGDriveNeedsAuth(true);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Google Sheets Sync Configuration States
  const [googleSheetId, setGoogleSheetId] = useState<string>(() => {
    const saved = localStorage.getItem('kurikulum_google_sheet_id');
    if (saved && saved.trim() !== '') {
      return saved;
    }
    const defaultId = '1khEqfRH_nulcMllKz45oA5-sEEAWN-KjXZP538tC3Sg';
    try {
      localStorage.setItem('kurikulum_google_sheet_id', defaultId);
    } catch (e) {}
    return defaultId;
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

  // Absen Piket states
  const [absenPiket, setAbsenPiket] = useState<AbsenPiket[]>(() => {
    const saved = localStorage.getItem('kurikulum_absen_piket');
    return saved ? JSON.parse(saved) : INITIAL_ABSEN_PIKET;
  });

  const [googlePiketSheetId, setGooglePiketSheetId] = useState<string>(() => {
    const saved = localStorage.getItem('kurikulum_google_piket_sheet_id');
    return saved || '11UF_YrzScgc4SwRf9B9GeEKVYXhkQUBGJremP60RU4I';
  });

  const [piketSyncLoading, setPiketSyncLoading] = useState<boolean>(false);
  const [piketSyncError, setPiketSyncError] = useState<string | null>(null);
  const [lastPiketSyncTime, setLastPiketSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('kurikulum_last_piket_sync_time') || null;
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
    localStorage.setItem('kurikulum_absen_piket', JSON.stringify(absenPiket));
  }, [absenPiket]);

  useEffect(() => {
    localStorage.setItem('kurikulum_google_piket_sheet_id', googlePiketSheetId);
  }, [googlePiketSheetId]);

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
      const targetId = (customId || googleSheetId || localStorage.getItem('kurikulum_google_sheet_id') || '1khEqfRH_nulcMllKz45oA5-sEEAWN-KjXZP538tC3Sg').trim();
      
      let data: SiswaNilai[] = [];
      
      // If we have an active Google token, pull using Google Sheets REST API directly (allows private sheet access!)
      if (gDriveToken) {
        try {
          const rows = await fetchGoogleSheetValuesWithToken(gDriveToken, targetId, 'NILAI');
          data = parseSheetValuesToNilai(rows);
        } catch (authError: any) {
          console.warn("REST API fetch failed, trying public CSV fallback:", authError);
          // If the REST API fails (e.g. token expired or wrong scope), fallback to the public CSV fetch
          data = await fetchGoogleSheetNilai(targetId);
        }
      } else {
        // Fallback: public CSV export
        data = await fetchGoogleSheetNilai(targetId);
      }
      
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
      console.warn("Google Sheets Nilai Sync issue:", String(error).replace(/Failed to fetch/gi, "Koneksi jaringan dibatasi (CORS)"));
      let msg = error.message || String(error);
      if (msg.includes('Failed to fetch') || msg.includes('failed to fetch') || msg.includes('fetch')) {
        msg = "Gagal memuat (Koneksi jaringan dibatasi / CORS Block): Koneksi langsung diblokir oleh peramban atau sheet belum dipublikasikan. Solusi: (1) Hubungkan Google Drive Anda di panel atas untuk melewati batasan CORS secara aman, atau (2) Pada Spreadsheet, pilih File > Bagikan > Publikasikan ke web, pilih format CSV, lalu publikasikan.";
      } else {
        msg = "Gagal mengimpor dari Google Sheets: " + msg;
      }
      setGoogleSyncError(msg);
    } finally {
      setGoogleSyncLoading(false);
    }
  };

  // Handler: Pull/sync Jurnal Mengajar from Google Sheets
  const handlePullJurnal = async (sheetId?: string) => {
    setJurnalSyncLoading(true);
    setJurnalSyncError(null);
    try {
      let targetId = (sheetId || googleSheetId || localStorage.getItem('kurikulum_google_sheet_id') || '1khEqfRH_nulcMllKz45oA5-sEEAWN-KjXZP538tC3Sg').trim();
      
      if (gDriveToken) {
        try {
          const foundId = await findSpreadsheetByName(gDriveToken, 'JURNAL MENGAJAR');
          if (foundId) {
            targetId = foundId;
            setGoogleSheetId(foundId);
          }
        } catch (findErr) {
          console.warn("Auto-find of JURNAL MENGAJAR spreadsheet by name failed:", findErr);
        }
      }

      let records: JurnalMengajarHarian[] = [];
      
      if (gDriveToken) {
        try {
          const imagesMap = await fetchDriveImagesMap(gDriveToken);
          const rows = await fetchGoogleSheetValuesWithToken(gDriveToken, targetId, 'JURNAL MENGAJAR');
          records = parseSheetValuesToJurnal(rows, imagesMap);
        } catch (authError: any) {
          console.warn("REST API Jurnal fetch failed, trying public CSV fallback:", authError);
          records = await fetchGoogleSheetJurnal(targetId);
        }
      } else {
        records = await fetchGoogleSheetJurnal(targetId);
      }
      
      if (records && records.length > 0) {
        setJurnalHarian(records);
        const now = new Date();
        setLastJurnalSyncTime(now);
        localStorage.setItem('kurikulum_jurnal_last_sync_time', now.toISOString());
      } else {
        throw new Error('Tidak ada data jurnal yang berhasil dibaca dari Google Sheet JURNAL MENGAJAR.');
      }
    } catch (err: any) {
      console.warn("Google Sheets Jurnal Sync issue:", String(err).replace(/Failed to fetch/gi, "Koneksi jaringan dibatasi (CORS)"));
      let msg = err.message || String(err);
      if (msg.includes('Failed to fetch') || msg.includes('failed to fetch') || msg.includes('fetch')) {
        msg = "Gagal memuat Jurnal (Koneksi jaringan dibatasi / CORS Block): Koneksi diblokir oleh peramban atau sheet belum dipublikasikan. Solusi: (1) Hubungkan Google Drive Anda di panel atas untuk melewati batasan CORS secara aman, atau (2) Pastikan spreadsheet Anda telah dipublikasikan ke web (File > Bagikan > Publikasikan ke web).";
      } else {
        msg = "Gagal menyinkronkan data Jurnal Mengajar dari Google Sheets: " + msg;
      }
      setJurnalSyncError(msg);
    } finally {
      setJurnalSyncLoading(false);
    }
  };

  // Handler: Pull/sync Absen Piket from Google Sheets
  const handlePullPiket = async (sheetId?: string) => {
    setPiketSyncLoading(true);
    setPiketSyncError(null);
    try {
      let targetId = (sheetId || googlePiketSheetId || '11UF_YrzScgc4SwRf9B9GeEKVYXhkQUBGJremP60RU4I').trim();
      let datangRows: any[][] = [];
      let pulangRows: any[][] = [];

      if (gDriveToken) {
        try {
          // Attempt authenticated fetching via Google Drive API
          [datangRows, pulangRows] = await Promise.all([
            fetchGoogleSheetValuesWithToken(gDriveToken, targetId, 'ABSEN DATANG'),
            fetchGoogleSheetValuesWithToken(gDriveToken, targetId, 'ABSEN PULANG')
          ]);
        } catch (authError: any) {
          console.warn("REST API Piket fetch failed, trying public CSV fallback:", authError);
          // Fallback to public CSV
          [datangRows, pulangRows] = await Promise.all([
            fetchPublicGoogleSheetValues(targetId, 'ABSEN DATANG'),
            fetchPublicGoogleSheetValues(targetId, 'ABSEN PULANG')
          ]);
        }
      } else {
        // Fallback to public CSV if no token is available
        [datangRows, pulangRows] = await Promise.all([
          fetchPublicGoogleSheetValues(targetId, 'ABSEN DATANG'),
          fetchPublicGoogleSheetValues(targetId, 'ABSEN PULANG')
        ]);
      }

      const parsed = parsePiketSheetValues(datangRows, pulangRows);

      if (parsed && parsed.length > 0) {
        setAbsenPiket(parsed);
        const nowString = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        setLastPiketSyncTime(nowString);
        localStorage.setItem('kurikulum_last_piket_sync_time', nowString);
      } else {
        throw new Error('Tidak ada data absen piket yang berhasil dibaca atau diuraikan dari Google Sheet BUKU PIKET.');
      }
    } catch (err: any) {
      console.warn('Failed to pull piket data issue:', String(err).replace(/Failed to fetch/gi, "Koneksi jaringan dibatasi (CORS)"));
      const is403 = String(err).includes('403') || String(err).includes('Izin ditolak') || String(err).includes('access') || String(err).includes('Forbidden');
      const isFetch = String(err).includes('Failed to fetch') || String(err).includes('failed to fetch') || String(err).includes('fetch');
      let msg = err.message || String(err);
      if (is403) {
        msg = 'Izin ditolak (403): Akun Anda tidak memiliki akses ke Spreadsheet ini. Solusi: Pada Google Sheet "BUKU PIKET", klik tombol "Bagikan" (Share) lalu ubah akses umum menjadi "Siapa saja yang memiliki link" (Anyone with the link) dengan peran Penglihat (Viewer).';
      } else if (isFetch) {
        msg = 'Gagal memuat Piket (Koneksi jaringan dibatasi / CORS Block): Koneksi diblokir oleh peramban atau sheet belum dipublikasikan. Solusi: (1) Hubungkan Google Drive Anda di panel atas untuk melewati batasan CORS secara aman, atau (2) Pastikan spreadsheet Anda telah dipublikasikan ke web (File > Bagikan > Publikasikan ke web) dengan lembar kerja ABSEN DATANG & ABSEN PULANG.';
      } else {
        msg = 'Gagal menyinkronkan data Buku Piket: ' + msg;
      }
      setPiketSyncError(msg);
    } finally {
      setPiketSyncLoading(false);
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

  // Automatically pull Jurnal Mengajar when navigating to the Jurnal tab
  useEffect(() => {
    if (activeTab === 'supervisi-jurnal-kbm') {
      handlePullJurnal().catch(() => {});
    }
  }, [activeTab, gDriveToken]);

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

  // Handler: Bulk merge / Sync curriculum documents from Google Drive
  const handleSyncDocuments = (syncedDocs: DokumenKurikulum[]) => {
    setDocuments(prev => {
      const updated = [...prev];
      syncedDocs.forEach(newDoc => {
        const existingIdx = updated.findIndex(d => 
          (newDoc.driveFileId && d.driveFileId === newDoc.driveFileId) || 
          d.namaFile.toLowerCase() === newDoc.namaFile.toLowerCase()
        );
        if (existingIdx > -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...newDoc,
            riwayatRevisi: [
              ...updated[existingIdx].riwayatRevisi,
              ...newDoc.riwayatRevisi.filter(nr => 
                !updated[existingIdx].riwayatRevisi.some(er => er.versi === nr.versi)
              )
            ]
          };
        } else {
          updated.unshift(newDoc);
        }
      });
      return updated;
    });
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
            gDriveToken={gDriveToken}
            onLoginGDrive={handleGoogleLogin}
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
            gDriveToken={gDriveToken}
            onLoginGDrive={handleGoogleLogin}
          />
        );
      case 'supervisi-absen-piket':
        return (
          <AbsenPiketView 
            piketList={absenPiket}
            onPullPiket={handlePullPiket}
            googleSheetId={googlePiketSheetId}
            onSaveSheetId={setGooglePiketSheetId}
            syncLoading={piketSyncLoading}
            syncError={piketSyncError}
            lastSyncTime={lastPiketSyncTime}
            gDriveToken={gDriveToken}
            onLoginGDrive={handleGoogleLogin}
          />
        );
      case 'dokumen-kurikulum':
        return (
          <DokumenKurikulumView 
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onSyncDocuments={handleSyncDocuments}
            onAddRevisi={handleAddRevisi}
            onDeleteDocument={handleDeleteDocument}
            gDriveToken={gDriveToken}
            onLoginGDrive={handleGoogleLogin}
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
      case 'analisis-nilai': return 'Analisis Nilai & Intervensi';
      case 'supervisi-guru':
      case 'supervisi-administrasi': return 'Administrasi Pembelajaran';
      case 'supervisi-jurnal-kbm': return 'Jurnal Harian Mengajar Guru';
      case 'supervisi-absen-piket': return 'Buku Absen Piket Guru';
      case 'dokumen-kurikulum': return 'Dokumen Kurikulum (KOSP)';
      default: return 'Command Center';
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans" id="applet-viewport">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        gDriveUser={gDriveUser}
        gDriveToken={gDriveToken}
        gDriveNeedsAuth={gDriveNeedsAuth}
        isLoggingIn={isLoggingIn}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
      />

      {/* Main Command Center Stage */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-scroll-container">
        {/* Top Control Bar Header */}
        <header className="bg-white h-16 border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs non-printable" id="top-bar-header">
          {/* Left: Title & Info Sekolah */}
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <h2 className="font-bold text-sm text-slate-800 tracking-wide uppercase">
              {getPageTitle()}
            </h2>
            <div className="hidden sm:flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-extrabold border border-slate-200/50">
              <span>SIMUTU</span>
              <span className="text-slate-300">•</span>
              <span>SMP Negeri 2 Puriala</span>
            </div>
          </div>

          {/* Middle: Elegant Search Bar */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-full px-3 py-1.5 w-48 lg:w-72 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/40 transition-all">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Cari data, jurnal, atau dokumen..." 
              className="bg-transparent border-none text-[11px] focus:outline-hidden w-full text-slate-700 placeholder-slate-400 font-semibold"
            />
          </div>

          {/* Right: Actions, Google Drive, and Profile Wakasek */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Google Drive Status & Login */}
            <div id="header-gdrive-status">
              {gDriveUser ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full py-1 pl-2.5 pr-3 text-xs shadow-xs" title={`${gDriveUser.displayName || 'Akun Google'} Terhubung`}>
                  {gDriveUser.photoURL ? (
                    <img src={gDriveUser.photoURL} alt="Google Photo" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] text-white font-bold">GD</div>
                  )}
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden lg:inline text-[10px] text-emerald-800 font-bold">Drive Terhubung</span>
                  <button 
                    onClick={handleGoogleLogout}
                    className="ml-1 text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                    title="Putuskan Google Drive"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-full transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  title="Hubungkan Google Drive"
                >
                  {isLoggingIn ? (
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.47 14.88L14.47 6.22C14.16 5.68 13.59 5.35 12.97 5.35H7L5 8.81L9.97 17.43C10.28 17.97 10.85 18.3 11.47 18.3H17.47L19.47 14.88ZM10.5 15.65L8 11.31H12.94L15.44 15.65H10.5Z" />
                    </svg>
                  )}
                  <span>Hubungkan Drive</span>
                </button>
              )}
            </div>

            {/* Notification system */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative bg-slate-50 hover:bg-slate-100 p-2 rounded-full text-slate-600 transition-colors border border-slate-200/50 cursor-pointer"
                id="btn-bell-notifications"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-rose-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
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
              className="bg-slate-50 hover:bg-slate-100 p-2 rounded-full text-slate-500 transition-colors border border-slate-200/50 cursor-pointer"
              title="Informasi Sistem"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Profil Wakasek (Suherman, S.Pd.Gr) */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 h-8" id="header-user-profile">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold text-[11px] border border-emerald-500/20">
                SH
              </div>
              <div className="hidden lg:block text-left">
                <h4 className="text-xs font-bold text-slate-800 leading-none">Suherman, S.Pd.Gr</h4>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Wakasek Kurikulum</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab Workspace Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1400px] w-full mx-auto" id="workspace-viewport">
          {renderTabContent()}
        </main>
      </div>

      {/* Fallback Google OAuth Manual Token Modal */}
      {showManualTokenModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="manual-oauth-token-modal">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Otentikasi Google Drive</h4>
              </div>
              <button
                onClick={() => setShowManualTokenModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-150 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed space-y-1.5">
                <span className="font-extrabold block text-amber-900">Mengapa pop-up tidak terbuka?</span>
                <p>
                  Peramban Anda memblokir jendela pop-up Google OAuth karena aplikasi dijalankan di dalam <b>iframe pratinjau AI Studio</b> yang sangat ketat.
                </p>
                <div className="pt-1 font-bold space-y-1 text-amber-900 text-[10px]">
                  <p>✓ Solusi Utama: Klik tombol <span className="underline">"Buka di Tab Baru"</span> di kanan atas layar pratinjau.</p>
                  <p>✓ Solusi Instan: Masukkan OAuth Access Token secara manual di bawah ini untuk menghubungkan Google Drive secara langsung.</p>
                </div>
              </div>

              <form onSubmit={handleManualTokenSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Google OAuth Access Token</label>
                  <textarea
                    rows={3}
                    value={manualTokenInput}
                    onChange={(e) => {
                      setManualTokenInput(e.target.value);
                      setManualTokenError(null);
                    }}
                    placeholder="ya29.a0AcvD..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-700 placeholder-slate-400 leading-normal"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Dapatkan Access Token uji dari <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Google OAuth Playground</a> dengan scope Google Drive.
                  </p>
                </div>

                {manualTokenError && (
                  <p className="text-[10px] font-bold text-rose-600">{manualTokenError}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualTokenModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <span>Hubungkan Token</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
