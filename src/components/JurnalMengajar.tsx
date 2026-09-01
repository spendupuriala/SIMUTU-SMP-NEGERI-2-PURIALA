import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  RefreshCw, 
  Folder, 
  Database, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle, 
  Filter, 
  Clock, 
  BookOpen, 
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { JurnalMengajarHarian } from '../types';

interface JurnalMengajarProps {
  jurnalHarian: JurnalMengajarHarian[];
  onPullJurnal: (sheetId: string) => Promise<void>;
  googleSheetId: string;
  setGoogleSheetId: (id: string) => void;
  syncLoading: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
}

export default function JurnalMengajarView({
  jurnalHarian,
  onPullJurnal,
  googleSheetId,
  setGoogleSheetId,
  syncLoading,
  syncError,
  lastSyncTime
}: JurnalMengajarProps) {
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHari, setSelectedHari] = useState('Semua');
  const [selectedKelas, setSelectedKelas] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [localSheetId, setLocalSheetId] = useState(googleSheetId);
  const [showConfig, setShowConfig] = useState(false);

  // Photo viewer modal state
  const [activePhoto, setActivePhoto] = useState<{ url: string; title: string } | null>(null);

  // Handle Sheet ID Update
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleSheetId(localSheetId.trim());
    setShowConfig(false);
  };

  // Sync / Pull Handler
  const handlePullData = async () => {
    try {
      await onPullJurnal(localSheetId);
    } catch (err) {
      console.error(err);
    }
  };

  // Unique options for filters based on dataset
  const classesList = useMemo(() => {
    const set = new Set<string>();
    jurnalHarian.forEach(j => {
      if (j.kelas) set.add(j.kelas);
    });
    return ['Semua', ...Array.from(set).sort()];
  }, [jurnalHarian]);

  const hariList = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Filtered dataset
  const filteredJurnal = useMemo(() => {
    return jurnalHarian.filter(item => {
      const matchesSearch = 
        (item.namaGuru || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.mapel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.topik || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kegiatan || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesHari = selectedHari === 'Semua' || item.hari.toLowerCase() === selectedHari.toLowerCase();
      const matchesKelas = selectedKelas === 'Semua' || item.kelas === selectedKelas;
      
      let matchesStatus = true;
      if (selectedStatus !== 'Semua') {
        const isTerlambat = item.keterangan.toLowerCase().includes('lambat') || item.keterangan.toLowerCase().includes('terlambat');
        if (selectedStatus === 'TEPAT WAKTU') {
          matchesStatus = !isTerlambat;
        } else if (selectedStatus === 'TERLAMBAT') {
          matchesStatus = isTerlambat;
        }
      }

      return matchesSearch && matchesHari && matchesKelas && matchesStatus;
    });
  }, [jurnalHarian, searchTerm, selectedHari, selectedKelas, selectedStatus]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredJurnal.length;
    const tepatWaktu = filteredJurnal.filter(item => {
      const text = item.keterangan.toLowerCase();
      return !text.includes('lambat') && !text.includes('terlambat');
    }).length;
    const terlambat = total - tepatWaktu;
    const rasioTepatWaktu = total > 0 ? Math.round((tepatWaktu / total) * 100) : 100;

    return { total, tepatWaktu, terlambat, rasioTepatWaktu };
  }, [filteredJurnal]);

  return (
    <div className="p-6 space-y-6" id="jurnal-mengajar-container">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs" id="jurnal-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>Supervisi & Mutu KBM</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800">Rekapitulasi Jurnal Mengajar Guru</h1>
          <p className="text-xs text-slate-500">
            Pemantauan langsung KBM harian secara otomatis dari lembar Google Sheets guru mapel.
          </p>
        </div>

        {/* Sync Controls / Pull Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-colors"
            id="btn-toggle-sheet-config"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Konfigurasi Google Sheets</span>
          </button>

          <button
            onClick={handlePullData}
            disabled={syncLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors cursor-pointer"
            id="btn-pull-jurnal"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>{syncLoading ? 'Menarik Data...' : 'Tarik Data (Pull)'}</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Configuration Panel */}
      {showConfig && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-fade-in" id="sheet-config-panel">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Pemetaan Integrasi Google Drive</h4>
                <p className="text-[11px] text-slate-500">Tabel tersinkron dengan dokumen terpusat di Drive sekolah.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowConfig(false)} 
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <Folder className="h-4 w-4 text-amber-500" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Folder Google Drive</span>
                <span className="font-semibold text-slate-700">ABSEN MAPEL/JURNAL MENGAJAR</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Nama File Spreadsheet</span>
                <span className="font-semibold text-slate-700">JURNAL MENGAJAR</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <Database className="h-4 w-4 text-indigo-500" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Nama Sheet Target</span>
                <span className="font-semibold text-slate-700">JURNAL MENGAJAR</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block">Spreadsheet ID Google Sheets</label>
              <input
                type="text"
                value={localSheetId}
                onChange={(e) => setLocalSheetId(e.target.value)}
                placeholder="Masukkan ID Google Spreadsheet..."
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-700"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl h-9.5 transition-colors cursor-pointer"
            >
              Simpan ID
            </button>
          </form>
        </div>
      )}

      {/* Sync Status Notifications */}
      {syncError && (
        <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-700" id="sync-error-banner">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Sinkronisasi Jurnal Mengajar Gagal</p>
            <p>{syncError}</p>
            <p className="text-[10px] text-rose-500/80 font-medium">
              Pastikan Spreadsheet ID benar, sheet dinamai &quot;JURNAL MENGAJAR&quot;, serta lembar kerja telah dipublikasikan ke web sebagai format CSV.
            </p>
          </div>
        </div>
      )}

      {lastSyncTime && !syncError && (
        <div className="bg-emerald-50 border border-emerald-200/50 p-3.5 rounded-xl flex items-center gap-3 text-xs text-emerald-800" id="sync-success-banner">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          <div>
            <span className="font-bold">Koneksi Aktif!</span> Data berhasil ditarik dari Google Sheets terakhir pada <span className="font-bold">{lastSyncTime.toLocaleTimeString()} {lastSyncTime.toLocaleDateString()}</span>.
          </div>
        </div>
      )}

      {/* Quick Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="jurnal-stats-grid">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Entri Jurnal</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-400">jam pembelajaran</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">PBM Tepat Waktu</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{stats.tepatWaktu}</span>
            <span className="text-xs text-emerald-500 font-medium">({stats.rasioTepatWaktu}%)</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${stats.rasioTepatWaktu}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Terlambat Mengisi</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600">{stats.terlambat}</span>
            <span className="text-xs text-slate-400">KBM harian</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${stats.total > 0 ? (stats.terlambat / stats.total) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-indigo-200" />
            <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider">Info Alur Data</span>
          </div>
          <p className="text-[10.5px] text-indigo-100 leading-relaxed font-medium">
            Guru mengisi link absensi mapel di kelas, sistem meredistribusi ke spreadsheet Jurnal Mengajar secara otomatis untuk direkap di sini.
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4" id="jurnal-filters-panel">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Filter className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pencarian & Penyaringan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari guru, mata pelajaran, topik..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Filter Hari */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Hari</span>
            <select
              value={selectedHari}
              onChange={(e) => setSelectedHari(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none py-1.5 cursor-pointer"
            >
              {hariList.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Filter Kelas */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Kelas</span>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none py-1.5 cursor-pointer"
            >
              {classesList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Filter Status Keterangan */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Keterangan</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none py-1.5 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="TEPAT WAKTU">TEPAT WAKTU</option>
              <option value="TERLAMBAT">TERLAMBAT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="jurnal-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="jurnal-records-table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-5">Hari / Tanggal</th>
                <th className="py-3 px-3 text-center">Waktu Input</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-5">Nama Guru</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-4 text-center">Jam / Durasi</th>
                <th className="py-3 px-6">Topik / Kegiatan</th>
                <th className="py-3 px-3 text-center">Dokumentasi</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredJurnal.length > 0 ? (
                filteredJurnal.map((item, index) => {
                  const isLate = item.keterangan.toLowerCase().includes('lambat') || item.keterangan.toLowerCase().includes('terlambat');
                  
                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                      {/* Hari & Tanggal */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800">{item.hari}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{item.tanggal}</div>
                      </td>

                      {/* Waktu Input */}
                      <td className="py-4 px-3 text-center">
                        <span className="bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded-md text-[10.5px] border border-slate-200/40 font-bold">
                          {item.waktuInput}
                        </span>
                      </td>

                      {/* Mata Pelajaran */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-700">{item.mapel}</div>
                      </td>

                      {/* Nama Guru */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-indigo-950">{item.namaGuru}</div>
                        <div className="text-[9.5px] text-slate-400 font-medium">Guru Mapel</div>
                      </td>

                      {/* Kelas */}
                      <td className="py-4 px-3 text-center">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {item.kelas}
                        </span>
                      </td>

                      {/* Durasi */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-500 font-mono text-[10.5px]">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{item.durasi}</span>
                        </div>
                      </td>

                      {/* Topik & Kegiatan */}
                      <td className="py-4 px-6 max-w-sm">
                        <div className="font-bold text-slate-800 line-clamp-1">{item.topik}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed font-medium">
                          {item.kegiatan}
                        </p>
                      </td>

                      {/* Dokumentasi */}
                      <td className="py-4 px-3 text-center">
                        {item.foto ? (
                          <button
                            onClick={() => setActivePhoto({ url: item.foto, title: `${item.namaGuru} - ${item.mapel}` })}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:bg-indigo-50 border border-indigo-200/40 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <ImageIcon className="h-3 w-3" />
                            <span>Lihat Foto</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Media</span>
                        )}
                      </td>

                      {/* Status / Keterangan */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          isLate 
                            ? 'bg-rose-50 text-rose-700 border-rose-100/80 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100/80'
                        }`}>
                          {item.keterangan.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Database className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-400">Tidak ada data jurnal yang cocok dengan filter aktif</p>
                    <p className="text-[10px] text-slate-400/85">Silakan reset filter atau klik Tarik Data untuk mengunduh dari Sheets.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {activePhoto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in" id="photo-viewer-overlay">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DOKUMENTASI PEMBELAJARAN</span>
                <h4 className="font-bold text-xs text-slate-800 leading-tight">{activePhoto.title}</h4>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Photo content */}
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px]">
              <img
                src={activePhoto.url}
                alt="Dokumentasi KBM"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.src = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=600";
                }}
                className="max-h-[450px] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Rerunning Referrer Block: Protected Access</span>
              <a 
                href={activePhoto.url} 
                target="_blank" 
                rel="noreferrer"
                className="font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
              >
                <span>Buka Gambar Asli</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
