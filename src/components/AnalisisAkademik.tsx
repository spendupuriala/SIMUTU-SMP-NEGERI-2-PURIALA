import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Upload, 
  BarChart3, 
  AlertTriangle, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Info,
  CalendarDays,
  Sparkles,
  ClipboardCheck,
  Check,
  Database,
  RefreshCw,
  Settings,
  CloudDownload,
  CloudUpload,
  Copy,
  ExternalLink,
  FileJson
} from 'lucide-react';
import { SiswaNilai, IntervensiSiswa } from '../types';
import { generateAppsScriptCode } from '../lib/googleSheetSync';

import GoogleDrivePicker from './GoogleDrivePicker';

interface AnalisisAkademikProps {
  nilaiSiswa: SiswaNilai[];
  intervensi: IntervensiSiswa[];
  onAddNilaiSiswa: (nilai: Omit<SiswaNilai, 'id'>) => void;
  onAddIntervensi: (intervensi: Omit<IntervensiSiswa, 'id'>) => void;
  onUpdateIntervensiStatus: (id: string, status: IntervensiSiswa['status']) => void;
  onBulkImport: (records: SiswaNilai[]) => void;
  onDeleteNilaiSiswa?: (id: string) => void;
  
  // Google Sheets props
  googleSheetId?: string;
  setGoogleSheetId?: (id: string) => void;
  googleWebhookUrl?: string;
  setGoogleWebhookUrl?: (url: string) => void;
  googleSyncLoading?: boolean;
  googleSyncError?: string | null;
  lastGoogleSyncTime?: string | null;
  onRefreshFromGoogleSheets?: (customId?: string) => Promise<void>;
  onSyncToGoogleSheets?: (webhookUrl?: string, customRecords?: SiswaNilai[]) => Promise<boolean | true>;

  // Google Drive token & connection
  gDriveToken?: string | null;
  onLoginGDrive?: () => void;
}

export default function AnalisisAkademik({
  nilaiSiswa,
  intervensi,
  onAddNilaiSiswa,
  onAddIntervensi,
  onUpdateIntervensiStatus,
  onBulkImport,
  onDeleteNilaiSiswa,
  googleSheetId = '',
  setGoogleSheetId,
  googleWebhookUrl = '',
  setGoogleWebhookUrl,
  googleSyncLoading = false,
  googleSyncError = null,
  lastGoogleSyncTime = null,
  onRefreshFromGoogleSheets,
  onSyncToGoogleSheets,
  gDriveToken = null,
  onLoginGDrive
}: AnalisisAkademikProps) {
  // Navigation internal tabs
  const [activeSubTab, setActiveSubTab] = useState<'rekap' | 'peta' | 'intervensi'>('rekap');

  // Google Sheets Setup Modal States
  const [isGSheetModalOpen, setIsGSheetModalOpen] = useState(false);
  const [tempSheetId, setTempSheetId] = useState(googleSheetId);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(googleWebhookUrl);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState('');
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  // Sync temp state with prop updates
  useEffect(() => {
    setTempSheetId(googleSheetId);
  }, [googleSheetId]);

  useEffect(() => {
    setTempWebhookUrl(googleWebhookUrl);
  }, [googleWebhookUrl]);

  // Filter States
  const [selectedKelas, setSelectedKelas] = useState<string>('VII.A');
  const [selectedMapel, setSelectedMapel] = useState<string>('Matematika');
  const [rekapSearch, setRekapSearch] = useState('');
  const [intervensiSearch, setIntervensiSearch] = useState('');

  // Modals / Input drawer states
  const [isAddNilaiOpen, setIsAddNilaiOpen] = useState(false);
  const [isAddIntervensiOpen, setIsAddIntervensiOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Form State - Add Single Student Nilai
  const [formNama, setFormNama] = useState('');
  const [formNISN, setFormNISN] = useState('');
  const [formKelas, setFormKelas] = useState('VII.A');
  const [formMapel, setFormMapel] = useState('Matematika');
  const [formTugas, setFormTugas] = useState('80');
  const [formUH, setFormUH] = useState('80');
  const [formUTS, setFormUTS] = useState('80');
  const [formUAS, setFormUAS] = useState('80');

  // Detailed assessment form states
  const [formTugas1, setFormTugas1] = useState('80');
  const [formTugas2, setFormTugas2] = useState('80');
  const [formTugas3, setFormTugas3] = useState('80');
  const [formTugas4, setFormTugas4] = useState('80');
  const [formTugas5, setFormTugas5] = useState('80');
  const [formTugas6, setFormTugas6] = useState('80');
  const [formTugas7, setFormTugas7] = useState('80');
  const [formTugas8, setFormTugas8] = useState('80');
  const [formTugas9, setFormTugas9] = useState('80');
  const [formTugas10, setFormTugas10] = useState('80');

  const [formUH1, setFormUH1] = useState('80');
  const [formUH2, setFormUH2] = useState('80');
  const [formUH3, setFormUH3] = useState('80');
  const [formUH4, setFormUH4] = useState('80');
  const [formUH5, setFormUH5] = useState('80');

  // Form State - Add Intervensi
  const [selectedWarningSiswa, setSelectedWarningSiswa] = useState<SiswaNilai | null>(null);
  const [formMasalah, setFormMasalah] = useState('');
  const [formRencana, setFormRencana] = useState('');
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);

  // Bulk Import State
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // KKM Constant
  const KKM = 70;

  // Filtered grade rekap
  const filteredNilai = nilaiSiswa.filter(item => {
    const matchesKelas = selectedKelas === 'Semua' ? true : item.kelas === selectedKelas;
    const matchesMapel = selectedMapel === 'Semua' ? true : item.mapel === selectedMapel;
    const matchesSearch = item.nama.toLowerCase().includes(rekapSearch.toLowerCase()) || 
                          item.nisn.includes(rekapSearch);
    return matchesKelas && matchesMapel && matchesSearch;
  });

  // Unique lists for selector options
  const kelasList = ['Semua', 'VII.A', 'VII.B', 'VIII', 'IX'];
  const mapelList = [
    'Semua',
    'Pendidikan Pancasila',
    'Matematika',
    'PJOK',
    'IPS',
    'Prakarya',
    'IPA',
    'Pendidikan Agama Islam',
    'Koding',
    'Informatika',
    'Bahasa Inggris',
    'Bahasa Indonesia',
    'Mulok'
  ];

  // Leger statistics computation
  const stats = React.useMemo(() => {
    const list = nilaiSiswa.filter(n => {
      const matchK = selectedKelas === 'Semua' ? true : n.kelas === selectedKelas;
      const matchM = selectedMapel === 'Semua' ? true : n.mapel === selectedMapel;
      return matchK && matchM;
    });

    if (list.length === 0) return { avg: 0, max: 0, min: 0, tuntas: 0, tuntasPercent: 0, underperforming: [] };

    const sum = list.reduce((acc, curr) => acc + curr.akhir, 0);
    const max = Math.max(...list.map(n => n.akhir));
    const min = Math.min(...list.map(n => n.akhir));
    const tuntasList = list.filter(n => n.akhir >= KKM);
    const tuntasPercent = Math.round((tuntasList.length / list.length) * 100);

    return {
      avg: parseFloat((sum / list.length).toFixed(1)),
      max,
      min,
      tuntas: tuntasList.length,
      tuntasPercent,
      underperforming: list.filter(n => n.akhir < KKM)
    };
  }, [nilaiSiswa, selectedKelas, selectedMapel]);

  // Chart data for subjects (computed for selectedKelas)
  const chartDataMapel = React.useMemo(() => {
    const mapels = [
      'Pendidikan Pancasila',
      'Matematika',
      'PJOK',
      'IPS',
      'Prakarya',
      'IPA',
      'Pendidikan Agama Islam',
      'Koding',
      'Informatika',
      'Bahasa Inggris',
      'Bahasa Indonesia',
      'Mulok'
    ];
    return mapels.map(m => {
      const records = nilaiSiswa.filter(n => {
        const matchK = selectedKelas === 'Semua' ? true : n.kelas === selectedKelas;
        return matchK && n.mapel === m;
      });
      const avg = records.length > 0 
        ? parseFloat((records.reduce((acc, curr) => acc + curr.akhir, 0) / records.length).toFixed(1)) 
        : 0;
      return { mapel: m, rataRata: avg, jumlahSiswa: records.length };
    });
  }, [nilaiSiswa, selectedKelas]);

  // Chart data for classes (computed for selectedMapel)
  const chartDataKelas = React.useMemo(() => {
    const kelases = ['VII.A', 'VII.B', 'VIII', 'IX'];
    return kelases.map(k => {
      const records = nilaiSiswa.filter(n => {
        const matchM = selectedMapel === 'Semua' ? true : n.mapel === selectedMapel;
        return n.kelas === k && matchM;
      });
      const avg = records.length > 0 
        ? parseFloat((records.reduce((acc, curr) => acc + curr.akhir, 0) / records.length).toFixed(1)) 
        : 0;
      return { kelas: k, rataRata: avg, jumlahSiswa: records.length };
    });
  }, [nilaiSiswa, selectedMapel]);

  // Bulk Import Parser
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess('');

    if (!importText.trim()) {
      setImportError('Teks import tidak boleh kosong.');
      return;
    }

    try {
      const lines = importText.split('\n');
      const parsedRecords: SiswaNilai[] = [];
      let skippedLines = 0;

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('nama') || line.toLowerCase().includes('nisn'))) {
          // Skip header
          return;
        }

        const parts = line.split(/[,\t]/); // Split by comma or tab
        if (parts.length >= 7) {
          const nisn = parts[0].trim();
          const nama = parts[1].trim();
          const kelas = parts[2].trim();
          const mapel = parts[3].trim();
          const tugas = parseFloat(parts[4].trim()) || 0;
          const uh = parseFloat(parts[5].trim()) || 0;
          const uts = parseFloat(parts[6].trim()) || 0;
          const uas = parseFloat(parts[7]?.trim()) || 0;
          
          // Math average
          const akhir = parseFloat(((tugas + uh + uts + uas) / 4).toFixed(1));

          if (nama && kelas && mapel) {
            parsedRecords.push({
              id: `sn-imported-${Date.now()}-${index}`,
              nisn: nisn || '0000000000',
              nama,
              kelas,
              mapel,
              tugas,
              uh,
              uts,
              uas,
              akhir
            });
          } else {
            skippedLines++;
          }
        } else if (line.trim() !== '') {
          skippedLines++;
        }
      });

      if (parsedRecords.length === 0) {
        throw new Error('Format salah. Pastikan format mengandung: NISN, Nama, Kelas, Mapel, Tugas, UH, UTS, UAS');
      }

      onBulkImport(parsedRecords);
      setImportSuccess(`Berhasil mengimpor ${parsedRecords.length} data nilai siswa!${skippedLines > 0 ? ` (${skippedLines} baris dilewati karena format tidak cocok)` : ''}`);
      setImportText('');
      setTimeout(() => {
        setIsImportOpen(false);
        setImportSuccess('');
      }, 2000);

    } catch (err: any) {
      setImportError(err.message || 'Gagal memproses data. Cek kembali tata letak data.');
    }
  };

  // Add individual grade submit
  const handleAddNilaiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama) return;

    const t1 = parseFloat(formTugas1) || 0;
    const t2 = parseFloat(formTugas2) || 0;
    const t3 = parseFloat(formTugas3) || 0;
    const t4 = parseFloat(formTugas4) || 0;
    const t5 = parseFloat(formTugas5) || 0;
    const t6 = parseFloat(formTugas6) || 0;
    const t7 = parseFloat(formTugas7) || 0;
    const t8 = parseFloat(formTugas8) || 0;
    const t9 = parseFloat(formTugas9) || 0;
    const t10 = parseFloat(formTugas10) || 0;

    const u1 = parseFloat(formUH1) || 0;
    const u2 = parseFloat(formUH2) || 0;
    const u3 = parseFloat(formUH3) || 0;
    const u4 = parseFloat(formUH4) || 0;
    const u5 = parseFloat(formUH5) || 0;

    const ts = parseFloat(formUTS) || 0;
    const as = parseFloat(formUAS) || 0;

    const tAvg = parseFloat(((t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8 + t9 + t10) / 10).toFixed(1));
    const hAvg = parseFloat(((u1 + u2 + u3 + u4 + u5) / 5).toFixed(1));
    const ak = parseFloat(((tAvg + hAvg + ts + as) / 4).toFixed(1));

    onAddNilaiSiswa({
      nisn: formNISN || '0000000000',
      nama: formNama,
      kelas: formKelas,
      mapel: formMapel,
      tugas: tAvg,
      uh: hAvg,
      uts: ts,
      uas: as,
      akhir: ak,
      tugas1: t1,
      tugas2: t2,
      tugas3: t3,
      tugas4: t4,
      tugas5: t5,
      tugas6: t6,
      tugas7: t7,
      tugas8: t8,
      tugas9: t9,
      tugas10: t10,
      uh1: u1,
      uh2: u2,
      uh3: u3,
      uh4: u4,
      uh5: u5
    });

    setFormNama('');
    setFormNISN('');
    setIsAddNilaiOpen(false);
  };

  // Add Intervention submit
  const handleAddIntervensiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarningSiswa || !formMasalah || !formRencana) return;

    onAddIntervensi({
      siswaId: selectedWarningSiswa.id,
      namaSiswa: selectedWarningSiswa.nama,
      kelas: selectedWarningSiswa.kelas,
      mapel: selectedWarningSiswa.mapel,
      nilaiAkhir: selectedWarningSiswa.akhir,
      masalah: formMasalah,
      rencanaTindakLanjut: formRencana,
      tanggalIntervensi: formTanggal,
      status: 'Rencana'
    });

    setSelectedWarningSiswa(null);
    setFormMasalah('');
    setFormRencana('');
    setIsAddIntervensiOpen(false);
  };

  const handleLoadSamplePaste = () => {
    const sampleText = 
`NISN,Nama Siswa,Kelas,Mapel,Tugas,UH,UTS,UAS
0091234591,Guntur Saputra,VII.A,Matematika,65,58,62,60
0091234592,Hany Marlina,VII.A,Matematika,92,90,88,94
0091234593,Indra Gunawan,VII.A,Matematika,55,45,50,48
0081234594,Juliana Fitri,VIII,IPA,85,82,88,86
0071234595,Kevin Pratama,IX,Bahasa Inggris,58,62,55,50`;
    setImportText(sampleText);
  };

  return (
    <div className="space-y-6" id="analisis-akademik-wrapper">
      
      {/* Header Info Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs" id="analisis-header">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Analisis Akademik & Peta Mutu</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekap nilai semester (Tugas, UH, UTS, UAS), visualisasikan Leger capaian mata pelajaran, dan rumuskan program remedial untuk siswa di bawah target.
          </p>
        </div>
        
        {/* Internal Subtabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 shrink-0" id="subtab-selectors">
          <button 
            onClick={() => setActiveSubTab('rekap')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'rekap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Rekap & Import Nilai
          </button>
          <button 
            onClick={() => setActiveSubTab('peta')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'peta' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Leger & Peta Mutu
          </button>
          <button 
            onClick={() => setActiveSubTab('intervensi')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'intervensi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Early Warning & Intervensi
          </button>
        </div>
      </div>

      {/* FILTER PANEL - Common across tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-4" id="academic-filters-row">
        <div className="flex flex-wrap items-center gap-4">
          {/* Kelas Selector */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Kelas</span>
            <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
              {kelasList.map(k => (
                <button
                  key={k}
                  onClick={() => setSelectedKelas(k)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${selectedKelas === k ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Mapel Selector */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</span>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 p-1.5 rounded-lg font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500"
            >
              {mapelList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Key Statistics Banner */}
        <div className="flex gap-6 text-xs border-l border-slate-200 pl-6 shrink-0 hidden sm:flex">
          <div>
            <p className="text-[10px] font-semibold text-slate-400">RATA-RATA KELOMPOK</p>
            <p className="text-lg font-bold text-slate-800">{stats.avg}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">KETUNTASAN BELAJAR</p>
            <p className="text-lg font-bold text-emerald-600">{stats.tuntasPercent}%</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">SISWA DI BAWAH KKM (70)</p>
            <p className="text-lg font-bold text-amber-600">{stats.underperforming.length}</p>
          </div>
        </div>
      </div>

      {/* GOOGLE SHEET SYNC CONTROL BAR */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4" id="google-sheet-sync-panel">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Database className={`h-5 w-5 ${googleSyncLoading ? 'animate-spin text-sky-400' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Sinkronisasi Google Drive Aktif</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Koneksi Terhubung"></span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
              Folder: <strong className="text-slate-200">PROJE GLIDE</strong> • File: <strong className="text-slate-200">RUMAH BELAJAR</strong> • Sheet: <strong className="text-emerald-400 font-bold">NILAI</strong>
            </p>
          </div>
        </div>

        {/* Sync status info & actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-left md:text-right text-[10px] text-slate-400 mr-2 hidden sm:block">
            {lastGoogleSyncTime ? (
              <p>Terakhir sinkronisasi: <strong className="text-slate-200">{lastGoogleSyncTime}</strong></p>
            ) : (
              <p>Menunggu sinkronisasi...</p>
            )}
            <p className="text-slate-500">Spreadsheet ID: {googleSheetId ? `${googleSheetId.substring(0, 12)}...` : 'Bawaan'}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Pull Button */}
            <button
              onClick={() => onRefreshFromGoogleSheets?.(googleSheetId)}
              disabled={googleSyncLoading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 text-sky-400 ${googleSyncLoading ? 'animate-spin' : ''}`} />
              Tarik Data (Pull)
            </button>

            {/* Push Button (Webhook) */}
            <button
              onClick={async () => {
                if (!googleWebhookUrl) {
                  setIsGSheetModalOpen(true);
                  return;
                }
                setPushStatus('loading');
                try {
                  const res = await onSyncToGoogleSheets?.();
                  if (res) {
                    setPushStatus('success');
                    setPushMessage('Berhasil menyinkronkan data nilai terbaru ke Google Sheet!');
                    setTimeout(() => setPushStatus('idle'), 3000);
                  }
                } catch (e: any) {
                  setPushStatus('error');
                  setPushMessage(e.message || 'Gagal mengirim data. Hubungi admin.');
                  setTimeout(() => setPushStatus('idle'), 5000);
                }
              }}
              disabled={googleSyncLoading || pushStatus === 'loading'}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              {pushStatus === 'loading' ? 'Mengirim...' : 'Kirim Update (Push)'}
            </button>

            {/* Config Button */}
            <button
              onClick={() => setIsGSheetModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Konfigurasi Integrasi Google Sheets"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {googleSyncError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-lg text-xs flex items-start gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Gagal Sinkronisasi Google Sheets:</p>
            <p className="mt-0.5 text-slate-600">{googleSyncError}</p>
          </div>
        </div>
      )}

      {pushStatus === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 animate-bounce" />
          <p className="font-semibold">{pushMessage}</p>
        </div>
      )}

      {pushStatus === 'error' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <p className="font-semibold">{pushMessage}</p>
        </div>
      )}

      {/* SUBTAB 1: REKAP & IMPORT DATA NILAI */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-6" id="rekap-subtab-view">
          
          {/* Quick Info & Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" id="rekap-header-actions">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari siswa berdasarkan nama..."
                value={rekapSearch}
                onChange={(e) => setRekapSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-xs rounded-lg transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-2 self-start shrink-0">
              <button 
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Import Excel/CSV
              </button>
              <button 
                onClick={() => setIsAddNilaiOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Input Nilai Manual
              </button>
            </div>
          </div>

          {/* Ledger Table Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="grades-table-card">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <h3 className="font-bold text-sm text-slate-800">
                Peta Leger Nilai Ganjil • Kelas: {selectedKelas} • Mapel: {selectedMapel}
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">{filteredNilai.length} Baris Data Terdaftar</span>
            </div>

            <div className="overflow-x-auto p-0">
              {filteredNilai.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Info className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Tidak ada rekap nilai siswa ditemukan</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pilih filter kelas lain atau silakan import / input nilai siswa baru.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/20">
                      <th className="py-3 px-5">Nama Lengkap</th>
                      <th className="py-3 px-3">Kelas</th>
                      <th className="py-3 px-3">Mata Pelajaran</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 1">T1</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 2">T2</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 3">T3</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 4">T4</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 5">T5</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 6">T6</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 7">T7</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 8">T8</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 9">T9</th>
                      <th className="py-3 px-1.5 text-center bg-indigo-50/20 text-indigo-700" title="Tugas 10">T10</th>
                      <th className="py-3 px-1.5 text-center bg-emerald-50/20 text-emerald-700" title="Ulangan Harian 1">UH1</th>
                      <th className="py-3 px-1.5 text-center bg-emerald-50/20 text-emerald-700" title="Ulangan Harian 2">UH2</th>
                      <th className="py-3 px-1.5 text-center bg-emerald-50/20 text-emerald-700" title="Ulangan Harian 3">UH3</th>
                      <th className="py-3 px-1.5 text-center bg-emerald-50/20 text-emerald-700" title="Ulangan Harian 4">UH4</th>
                      <th className="py-3 px-1.5 text-center bg-emerald-50/20 text-emerald-700" title="Ulangan Harian 5">UH5</th>
                      <th className="py-3 px-3 text-center">UTS</th>
                      <th className="py-3 px-3 text-center">UAS</th>
                      <th className="py-3 px-4 text-center bg-slate-50">Nilai Akhir</th>
                      <th className="py-3 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredNilai.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-800">{item.nama}</td>
                        <td className="py-3.5 px-3"><span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">{item.kelas}</span></td>
                        <td className="py-3.5 px-3 font-medium text-slate-500">{item.mapel}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas1 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas2 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas3 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas4 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas5 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas6 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas7 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas8 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas9 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-indigo-50/5 font-semibold text-slate-700">{item.tugas10 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-emerald-50/5 font-semibold text-slate-700">{item.uh1 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-emerald-50/5 font-semibold text-slate-700">{item.uh2 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-emerald-50/5 font-semibold text-slate-700">{item.uh3 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-emerald-50/5 font-semibold text-slate-700">{item.uh4 ?? 0}</td>
                        <td className="py-3.5 px-1.5 text-center bg-emerald-50/5 font-semibold text-slate-700">{item.uh5 ?? 0}</td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">{item.uts}</td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-700">{item.uas}</td>
                        <td className="py-3.5 px-4 text-center bg-slate-50 font-extrabold">
                          <span className={`px-2 py-0.5 rounded ${
                            item.akhir < KKM 
                              ? 'text-rose-600 bg-rose-50 border border-rose-100' 
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                          }`}>
                            {item.akhir}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {item.akhir < KKM && (
                              <button
                                onClick={() => {
                                  setSelectedWarningSiswa(item);
                                  setIsAddIntervensiOpen(true);
                                }}
                                className="text-[10px] text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded font-bold transition-colors"
                              >
                                Buat Intervensi
                              </button>
                            )}
                            {onDeleteNilaiSiswa && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus data nilai siswa ${item.nama}?`)) {
                                    onDeleteNilaiSiswa(item.id);
                                  }
                                }}
                                className="text-[10px] text-slate-400 hover:text-rose-600 px-2 py-1 rounded transition-colors"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: LEGER & PETA MUTU (VISUALISASI GRAFIK CAPAIAN) */}
      {activeSubTab === 'peta' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="peta-mutu-charts-view">
          
          {/* Chart 1: Rata-Rata Capaian per Mata Pelajaran (Bar SVG) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs" id="chart-mapel-card">
            <div className="mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-500" />
                Rata-Rata Capaian per Mata Pelajaran (Kelas: {selectedKelas})
              </h3>
              <p className="text-[10px] text-slate-400">Grafik komparatif nilai akhir rata-rata kelas terpilih terhadap target KKM (70)</p>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="space-y-4 pt-2">
              {chartDataMapel.map((item, idx) => {
                const maxBarWidth = 100; // percent
                const barPercent = item.rataRata; // grade is max 100
                const isUnderKKM = item.rataRata < KKM;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[150px]">{item.mapel}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">({item.jumlahSiswa} siswa)</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${isUnderKKM ? 'text-rose-600 bg-rose-50' : 'text-emerald-700 bg-emerald-50'}`}>
                          {item.rataRata || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden relative border border-slate-150">
                      {/* KKM Line Marker at 70% */}
                      <div className="absolute left-[70%] top-0 bottom-0 w-0.5 bg-rose-500/50 z-2" title="Garis Batas Target KKM 70">
                        <span className="absolute right-1 top-0 text-[8px] font-bold text-rose-500/80">KKM</span>
                      </div>
                      
                      {/* Bar Fill */}
                      <div 
                        className={`h-full rounded-l-md transition-all duration-500 flex items-center pl-2.5 ${
                          item.rataRata === 0 ? 'w-0' :
                          isUnderKKM 
                            ? 'bg-gradient-to-r from-rose-400 to-rose-500' 
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        }`}
                        style={{ width: `${barPercent}%` }}
                      >
                        {item.rataRata > 20 && (
                          <span className="text-[9px] font-bold text-white leading-none">
                            {Math.round(barPercent)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Peta Mutu Capaian per Rombel / Kelas (Bar SVG) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs" id="chart-kelas-card">
            <div className="mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                Peta Mutu Rata-Rata per Kelas / Rombel (Mapel: {selectedMapel})
              </h3>
              <p className="text-[10px] text-slate-400">Pemetaan kualitas serapan kurikulum di tingkat kelas 7, 8, dan 9</p>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="space-y-4 pt-2">
              {chartDataKelas.map((item, idx) => {
                const barPercent = item.rataRata;
                const isUnderKKM = item.rataRata < KKM;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded text-[10px]">Kelas {item.kelas}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">({item.jumlahSiswa} nilai)</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${isUnderKKM ? 'text-rose-600 bg-rose-50' : 'text-emerald-700 bg-emerald-50'}`}>
                          {item.rataRata || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden relative border border-slate-150">
                      {/* KKM Line Marker at 70% */}
                      <div className="absolute left-[70%] top-0 bottom-0 w-0.5 bg-rose-500/50 z-2"></div>
                      
                      {/* Bar Fill */}
                      <div 
                        className={`h-full rounded-l-md transition-all duration-500 flex items-center pl-2.5 ${
                          item.rataRata === 0 ? 'w-0' :
                          isUnderKKM 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                            : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                        }`}
                        style={{ width: `${barPercent}%` }}
                      >
                        {item.rataRata > 20 && (
                          <span className="text-[9px] font-bold text-white leading-none">
                            {Math.round(barPercent)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quality Summary Box */}
            <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5 text-xs text-indigo-950">
              <p className="font-bold flex items-center gap-1 text-xs">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Rekomendasi Peta Mutu:
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Pencapaian nilai mata pelajaran <strong className="text-indigo-900">{selectedMapel}</strong> tertinggi berada pada rombel kelas dengan rata-rata tertinggi. Sementara rombel kelas yang berada di bawah target KKM (70) wajib dikoordinasikan dengan wali kelas terkait untuk pendalaman materi/tambahan bimbingan sore.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: EARLY WARNING & INTERVENSI */}
      {activeSubTab === 'intervensi' && (
        <div className="space-y-6" id="intervensi-subtab-view">
          {/* Summary Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3">
              <div className="bg-amber-100 text-amber-700 p-2 rounded-xl shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Sistem Deteksi Remedial (Early Warning)</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">Siswa yang di bawah KKM wajib dibuatkan rencana intervensi. Sebanyak <strong className="text-amber-700">{stats.underperforming.length}</strong> siswa butuh rencana tindak lanjut.</p>
              </div>
            </div>
            {stats.underperforming.length > 0 && (
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                Ada {stats.underperforming.length} Masalah Aktif
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="intervensi-main-layout">
            
            {/* Left Box: Underperforming Students waiting for action (2 Columns) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="warning-students-list-card">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40">
                <h3 className="font-bold text-sm text-slate-800">Antrean Siswa Butuh Jadwal Remedial</h3>
              </div>
              <div className="p-0 divide-y divide-slate-100 max-h-[420px] overflow-y-auto custom-scrollbar">
                {stats.underperforming.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Tidak ada siswa yang butuh intervensi</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Seluruh capaian nilai siswa memenuhi target di atas KKM 70.</p>
                  </div>
                ) : (
                  stats.underperforming.map((siswa) => {
                    // Check if already in intervention
                    const isIntervened = intervensi.find(i => i.siswaId === siswa.id || (i.namaSiswa === siswa.nama && i.mapel === siswa.mapel));
                    return (
                      <div key={siswa.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">{siswa.nama}</p>
                          <p className="text-[10px] text-slate-400">
                            Kelas: <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">{siswa.kelas}</span> • Mapel: <strong className="text-slate-600">{siswa.mapel}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[9px] font-bold text-slate-400">NILAI AKHIR</p>
                            <p className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded text-xs border border-rose-100">{siswa.akhir}</p>
                          </div>

                          {isIntervened ? (
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                              <Check className="h-3.5 w-3.5" />
                              Sudah Dijadwal
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedWarningSiswa(siswa);
                                setFormMasalah(`Kesulitan memahami kompetensi dasar pada mata pelajaran ${siswa.mapel}. Nilai akhir semester ${siswa.akhir} di bawah KKM.`);
                                setFormRencana(`Mengadakan sesi bimbingan khusus (Remedial Teaching) dan ujian ulang (Remedial Test).`);
                                setIsAddIntervensiOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              Buat Jadwal
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Box: Active Interventions tracker (1 Column) */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col" id="active-interventions-tracker">
              <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Log Jadwal Intervensi ({intervensi.length})</h3>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">Remedial Tracker</span>
              </div>

              <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-1">
                {intervensi.length === 0 ? (
                  <div className="text-center p-8 text-slate-400">
                    <p className="text-xs">Belum ada jadwal intervensi dibuat.</p>
                  </div>
                ) : (
                  intervensi.map((item) => (
                    <div key={item.id} className="border border-slate-150 hover:border-slate-250 bg-slate-50/50 p-3 rounded-xl space-y-2 text-xs transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{item.namaSiswa}</p>
                          <p className="text-[10px] text-slate-400">Kelas {item.kelas} • {item.mapel}</p>
                        </div>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateIntervensiStatus(item.id, e.target.value as IntervensiSiswa['status'])}
                          className={`text-[9px] font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                            item.status === 'Selesai' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            item.status === 'Berjalan' ? 'bg-sky-50 border-sky-200 text-sky-700' :
                            'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          <option value="Rencana">Rencana</option>
                          <option value="Berjalan">Berjalan</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 space-y-1">
                        <p><strong className="text-slate-500 font-semibold">Diagnosis:</strong> {item.masalah}</p>
                        <p><strong className="text-slate-500 font-semibold">Tindakan:</strong> {item.rencanaTindakLanjut}</p>
                      </div>

                      <p className="text-[9px] text-slate-400 flex items-center gap-1 font-medium">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        Jadwal: {item.tanggalIntervensi}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODAL: INPUT NILAI MANUAL */}
      {isAddNilaiOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="add-nilai-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">Input Nilai Siswa Manual</h3>
              </div>
              <button 
                onClick={() => setIsAddNilaiOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddNilaiSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Siswa</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nama lengkap siswa..."
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelas / Rombel</label>
                  <select 
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  >
                    {['VII.A', 'VII.B', 'VIII', 'IX'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</label>
                  <select 
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  >
                    {[
                      'Pendidikan Pancasila',
                      'Matematika',
                      'PJOK',
                      'IPS',
                      'Prakarya',
                      'IPA',
                      'Pendidikan Agama Islam',
                      'Koding',
                      'Informatika',
                      'Bahasa Inggris',
                      'Bahasa Indonesia',
                      'Mulok'
                    ].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nilai Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 max-h-[320px] overflow-y-auto">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nilai Tugas (T1 - T10)</p>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const getters: {[key: number]: string} = {
                        1: formTugas1, 2: formTugas2, 3: formTugas3, 4: formTugas4, 5: formTugas5,
                        6: formTugas6, 7: formTugas7, 8: formTugas8, 9: formTugas9, 10: formTugas10
                      };
                      const setters: {[key: number]: (val: string) => void} = {
                        1: setFormTugas1, 2: setFormTugas2, 3: setFormTugas3, 4: setFormTugas4, 5: setFormTugas5,
                        6: setFormTugas6, 7: setFormTugas7, 8: setFormTugas8, 9: setFormTugas9, 10: setFormTugas10
                      };
                      return (
                        <div key={num} className="space-y-1">
                          <label className="text-[9px] font-semibold text-slate-500 block">T{num}</label>
                          <input 
                            type="number" 
                            min="0" max="100" 
                            value={getters[num]}
                            onChange={(e) => setters[num](e.target.value)}
                            className="w-full text-center text-xs p-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ulangan Harian (UH1 - UH5)</p>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const getters: {[key: number]: string} = {
                        1: formUH1, 2: formUH2, 3: formUH3, 4: formUH4, 5: formUH5
                      };
                      const setters: {[key: number]: (val: string) => void} = {
                        1: setFormUH1, 2: setFormUH2, 3: setFormUH3, 4: setFormUH4, 5: setFormUH5
                      };
                      return (
                        <div key={num} className="space-y-1">
                          <label className="text-[9px] font-semibold text-slate-500 block">UH{num}</label>
                          <input 
                            type="number" 
                            min="0" max="100" 
                            value={getters[num]}
                            onChange={(e) => setters[num](e.target.value)}
                            className="w-full text-center text-xs p-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ujian Semester</p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-500 block">UTS</label>
                      <input 
                        type="number" 
                        min="0" max="100" 
                        value={formUTS}
                        onChange={(e) => setFormUTS(e.target.value)}
                        className="w-full text-center text-xs p-2 bg-white border border-slate-200 focus:border-indigo-500 rounded outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-500 block">UAS</label>
                      <input 
                        type="number" 
                        min="0" max="100" 
                        value={formUAS}
                        onChange={(e) => setFormUAS(e.target.value)}
                        className="w-full text-center text-xs p-2 bg-white border border-slate-200 focus:border-indigo-500 rounded outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddNilaiOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCEL/CSV DATA PASTE IMPORTER */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="import-grades-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Import Data Nilai via Copy-Paste</h3>
              </div>
              <button 
                onClick={() => setIsImportOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Salin baris data dari Microsoft Excel atau Google Sheets, lalu tempel di kotak teks di bawah. Format kolom harus diurutkan:
                  <br />
                  <strong className="text-slate-700">NISN, Nama, Kelas, Mapel, Tugas, UH, UTS, UAS</strong>
                </p>
                <button
                  type="button"
                  onClick={handleLoadSamplePaste}
                  className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold underline"
                >
                  Load Contoh Format Salinan
                </button>
              </div>

              <textarea 
                required
                rows={7}
                placeholder="Tempel baris data Excel di sini...&#10;Contoh:&#10;0091234123,Andi Setiawan,VII.A,Matematika,80,75,82,80"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none resize-none transition-all"
              />

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-lg">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] rounded-lg font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {importSuccess}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all"
                >
                  Verifikasi & Import Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULING INTERVENSI */}
      {isAddIntervensiOpen && selectedWarningSiswa && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="schedule-intervention-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-800">Jadwalkan Remedial / Intervensi</h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedWarningSiswa(null);
                  setIsAddIntervensiOpen(false);
                }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddIntervensiSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1 border border-slate-100 text-xs">
                <p><span className="font-bold text-slate-500 inline-block w-24">Siswa</span>: <strong className="text-slate-800">{selectedWarningSiswa.nama}</strong></p>
                <p><span className="font-bold text-slate-500 inline-block w-24">Kelas</span>: {selectedWarningSiswa.kelas}</p>
                <p><span className="font-bold text-slate-500 inline-block w-24">Mata Pelajaran</span>: {selectedWarningSiswa.mapel}</p>
                <p className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 inline-block w-24">Nilai Akhir</span>: 
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                    {selectedWarningSiswa.akhir} &lt; KKM 70
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnosis Masalah Belajar</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Belum menguasai konsep dasar pecahan..."
                  value={formMasalah}
                  onChange={(e) => setFormMasalah(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rencana Tindak Lanjut / Kegiatan</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Remedial teaching kelompok sore dan kuis ulang..."
                  value={formRencana}
                  onChange={(e) => setFormRencana(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  required
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedWarningSiswa(null);
                    setIsAddIntervensiOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all"
                >
                  Simpan Jadwal Remedial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOOGLE SHEETS SETUP CONFIG MODAL */}
      {isGSheetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-fade-in" id="google-sheets-setup-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Konfigurasi Sinkronisasi Google Sheets</h3>
              </div>
              <button 
                onClick={() => {
                  setSaveSuccess(false);
                  setIsGSheetModalOpen(false);
                }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Alert Warning Scope */}
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl flex items-start gap-2.5">
                <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">Penyelarasan Google Drive & Glide</p>
                  <p className="mt-0.5 leading-relaxed text-slate-600">
                    Aplikasi ini dirancang untuk membaca & menulis data langsung dari folder Google Drive Anda <strong className="text-slate-800">"PROJE GLIDE"</strong>, pada file <strong className="text-slate-800">"RUMAH BELAJAR"</strong> dengan nama Sheet <strong className="text-emerald-700">"NILAI"</strong>.
                  </p>
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ID Spreadsheet Google Sheets</label>
                    {gDriveToken ? (
                      <button
                        type="button"
                        onClick={() => setIsDrivePickerOpen(true)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-500 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Pilih dari Google Drive
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onLoginGDrive}
                        className="text-[10px] text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                        title="Hubungkan akun Google Drive Anda"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 opacity-60" />
                        Hubungkan Google Drive
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Masukkan ID Spreadsheet..."
                    value={tempSheetId}
                    onChange={(e) => setTempSheetId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg outline-none font-mono text-[11px] transition-all"
                  />
                  <p className="text-[10px] text-slate-400">
                    ID adalah rangkaian huruf & angka panjang pada tautan Google Sheets Anda. Contoh: https://docs.google.com/spreadsheets/d/<span className="font-bold text-slate-600 font-mono">1YweatgIfl...</span>/edit
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">URL Webhook Google Apps Script (Untuk Tulis/Push)</label>
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">Opsional</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Contoh: https://script.google.com/macros/s/.../exec"
                    value={tempWebhookUrl}
                    onChange={(e) => setTempWebhookUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg outline-none font-mono text-[11px] transition-all"
                  />
                  <p className="text-[10px] text-slate-400">
                    Wajib diisi jika Anda ingin perubahan nilai di aplikasi ini langsung terkirim dan mengupdate Google Sheet Anda secara realtime.
                  </p>
                </div>
              </div>

              {/* Save State Notification */}
              {saveSuccess && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-3 rounded-lg flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <p className="font-semibold">Konfigurasi ID Google Sheet berhasil disimpan & diperbarui!</p>
                </div>
              )}

              {/* Step by Step Apps Script Tutorial */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-slate-700">Cara Mengaktifkan Fitur Kirim Data (Push)</span>
                  </div>
                  <button
                    onClick={() => {
                      const code = generateAppsScriptCode(tempSheetId);
                      navigator.clipboard.writeText(code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    type="button"
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md border border-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedCode ? 'Disalin!' : 'Salin Kode Script'}
                  </button>
                </div>
                
                <div className="p-4 space-y-3 leading-relaxed text-slate-600">
                  <p>Ikuti langkah mudah berikut agar data di spreadsheet Anda selalu terupdate secara otomatis:</p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Buka spreadsheet Google Sheets <strong className="text-slate-800">"RUMAH BELAJAR"</strong> Anda di Google Drive.</li>
                    <li>Pada menu atas, pilih <strong className="text-indigo-600">Ekstensi &gt; Apps Script</strong>.</li>
                    <li>Hapus semua kode bawaan, lalu tempelkan (paste) kode script yang baru saja Anda salin dengan tombol di atas.</li>
                    <li>Klik ikon disk <strong className="text-slate-800">(Simpan)</strong> atau tekan <kbd className="bg-slate-100 px-1 border rounded text-[10px]">Ctrl+S</kbd>.</li>
                    <li>Klik tombol biru <strong className="text-slate-800">Terapkan &gt; Terapkan Baru (Deploy &gt; New deployment)</strong>.</li>
                    <li>Pilih jenis terapkan: <strong className="text-slate-800">Aplikasi Web (Web App)</strong>.</li>
                    <li>Atur akses: Jalankan sebagai <strong className="text-indigo-600">"Saya" (Me)</strong> dan Siapa yang memiliki akses ke <strong className="text-indigo-600">"Siapa Saja" (Anyone)</strong>.</li>
                    <li>Klik <strong className="text-slate-800">Terapkan (Deploy)</strong>, setujui izin otorisasi Google, lalu salin <strong className="text-slate-800">URL Aplikasi Web</strong> yang diberikan dan tempelkan pada kolom URL Webhook di atas.</li>
                  </ol>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsGSheetModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (setGoogleSheetId) setGoogleSheetId(tempSheetId);
                    if (setGoogleWebhookUrl) setGoogleWebhookUrl(tempWebhookUrl);
                    setSaveSuccess(true);
                    setTimeout(() => {
                      setSaveSuccess(false);
                      setIsGSheetModalOpen(false);
                      // Trigger data fetch with new ID
                      onRefreshFromGoogleSheets?.(tempSheetId);
                    }, 1200);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Simpan & Hubungkan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Google Drive Picker Modal */}
      {isDrivePickerOpen && gDriveToken && (
        <GoogleDrivePicker
          token={gDriveToken}
          onSelect={(id, name) => {
            setTempSheetId(id);
            if (setGoogleSheetId) setGoogleSheetId(id);
            setIsDrivePickerOpen(false);
            // Automatically refresh data with the newly chosen sheet
            onRefreshFromGoogleSheets?.(id);
          }}
          onClose={() => setIsDrivePickerOpen(false)}
        />
      )}

    </div>
  );
}
