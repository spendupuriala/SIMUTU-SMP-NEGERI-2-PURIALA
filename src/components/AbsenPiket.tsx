import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Database, 
  FileSpreadsheet, 
  Folder, 
  X,
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { AbsenPiket } from '../types';

interface AbsenPiketProps {
  piketList: AbsenPiket[];
  onPullPiket: (sheetId: string) => Promise<void>;
  googleSheetId: string;
  onSaveSheetId: (id: string) => void;
  syncLoading: boolean;
  syncError: string | null;
  lastSyncTime: string | null;
  gDriveToken: string | null;
  onLoginGDrive: () => void;
}

export default function AbsenPiketView({
  piketList,
  onPullPiket,
  googleSheetId,
  onSaveSheetId,
  syncLoading,
  syncError,
  lastSyncTime,
  gDriveToken,
  onLoginGDrive
}: AbsenPiketProps) {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [localSheetId, setLocalSheetId] = useState<string>(googleSheetId);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  
  // Set default filter date to today if present in data, otherwise empty (meaning show all by default)
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    setLocalSheetId(googleSheetId);
  }, [googleSheetId]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSheetId(localSheetId.trim());
    setShowConfig(false);
  };

  const handlePullData = async () => {
    await onPullPiket(googleSheetId);
  };

  // Get list of unique dates for date filter
  const dateList = useMemo(() => {
    const set = new Set<string>();
    piketList.forEach(item => {
      if (item.tanggal) set.add(item.tanggal);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [piketList]);

  // Filtered dataset
  const filteredPiket = useMemo(() => {
    return piketList.filter(item => {
      const matchesSearch = (item.namaGuru || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !selectedDate || item.tanggal === selectedDate;
      
      let matchesStatus = true;
      if (selectedStatus !== 'Semua') {
        if (selectedStatus === 'Lengkap') {
          matchesStatus = item.status === 'Lengkap';
        } else if (selectedStatus === 'Tidak Absen Pulang') {
          matchesStatus = item.status === 'TIDAK ABSEN PULANG';
        }
      }

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [piketList, searchTerm, selectedDate, selectedStatus]);

  // Statistics / KPI Cards
  const stats = useMemo(() => {
    // We compute stats based on either selected date, or overall if no date selected
    const targetSet = selectedDate 
      ? piketList.filter(item => item.tanggal === selectedDate)
      : piketList;

    const totalHadir = targetSet.length;
    const lengkap = targetSet.filter(item => item.status === 'Lengkap').length;
    const tidakAbsenPulang = targetSet.filter(item => item.status === 'TIDAK ABSEN PULANG').length;

    return { totalHadir, lengkap, tidakAbsenPulang };
  }, [piketList, selectedDate]);

  return (
    <div className="p-6 space-y-6" id="absen-piket-container">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs" id="piket-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            <span>Supervisi & Mutu KBM</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 font-display">Buku Absen Piket Guru</h1>
          <p className="text-xs text-slate-500">
            Rekap kehadiran datang dan pulang guru piket harian yang terintegrasi secara otomatis dari Google Sheets.
          </p>
        </div>

        {/* Sync Controls / Pull Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-colors"
            id="btn-toggle-piket-config"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Konfigurasi Google Sheets</span>
          </button>

          <button
            onClick={handlePullData}
            disabled={syncLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors cursor-pointer"
            id="btn-pull-piket"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>{syncLoading ? 'Menarik Data...' : 'Tarik Data (Pull)'}</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Configuration Panel */}
      {showConfig && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-fade-in" id="piket-config-panel">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Pemetaan Integrasi Buku Piket</h4>
                <p className="text-[11px] text-slate-500">Tabel tersinkron dengan dokumen BUKU PIKET di Google Drive.</p>
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
                <span className="font-semibold text-slate-700">ABSEN MAPEL/BK</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Nama File Spreadsheet</span>
                <span className="font-semibold text-slate-700">BUKU PIKET</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center gap-3">
              <Database className="h-4 w-4 text-indigo-500" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Nama Sheet Target</span>
                <span className="font-semibold text-slate-700">ABSEN DATANG & ABSEN PULANG</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 block">Spreadsheet ID Google Sheets</label>
                {gDriveToken ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    ✓ Google Drive Aktif
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onLoginGDrive}
                    className="text-[10px] text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                    title="Hubungkan akun Google Drive Anda"
                  >
                    Hubungkan Google Drive
                  </button>
                )}
              </div>
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
        <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-700" id="piket-sync-error-banner">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Sinkronisasi Absen Piket Gagal</p>
            <p>{syncError}</p>
          </div>
        </div>
      )}

      {lastSyncTime && !syncError && (
        <div className="bg-emerald-50 border border-emerald-200/60 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-800" id="piket-sync-success-banner">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <p>Terakhir sinkronisasi otomatis Google Drive pada: <span className="font-mono font-bold">{lastSyncTime}</span></p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="piket-kpi-cards">
        {/* Card 1: Total Guru Hadir */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Guru Hadir {selectedDate ? 'Hari Ini' : '(Semua Tanggal)'}</span>
            <h3 className="text-2xl font-black text-slate-800 leading-none">{stats.totalHadir}</h3>
            <p className="text-[10px] text-slate-400">Tercatat dalam log piket</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Absen Lengkap */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Absen Lengkap (Datang & Pulang)</span>
            <h3 className="text-2xl font-black text-emerald-600 leading-none">{stats.lengkap}</h3>
            <p className="text-[10px] text-slate-400">Tepat waktu datang & pulang</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Belum Absen Pulang */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Belum / Tidak Absen Pulang</span>
            <h3 className="text-2xl font-black text-rose-600 leading-none">{stats.tidakAbsenPulang}</h3>
            <p className="text-[10px] text-rose-500 font-semibold">Memerlukan konfirmasi piket</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4" id="piket-filter-panel">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span>Saringan & Pencarian Rekapitulasi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 w-full focus-within:ring-2 focus-within:ring-indigo-500/15 focus-within:border-indigo-500 transition-all text-xs">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Cari nama guru..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-slate-700 placeholder-slate-400 font-semibold"
            />
          </div>

          {/* Filter Date */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 w-full text-xs">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-slate-700 font-semibold cursor-pointer"
            >
              <option value="">Semua Tanggal</option>
              {dateList.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 w-full text-xs">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-slate-700 font-semibold cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lengkap">Lengkap (Hadir & Pulang)</option>
              <option value="Tidak Absen Pulang">Tidak Absen Pulang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="piket-table-container">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-800">Daftar Rekap Absensi Piket</h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
            Menampilkan {filteredPiket.length} Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="py-3.5 px-6 w-16 text-center">No</th>
                <th className="py-3.5 px-4 w-32">Tanggal</th>
                <th className="py-3.5 px-4">Nama Guru</th>
                <th className="py-3.5 px-4 w-32 text-center">Jam Datang</th>
                <th className="py-3.5 px-4 w-32 text-center">Jam Pulang</th>
                <th className="py-3.5 px-6 w-56 text-center">Keterangan / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPiket.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data absen piket yang cocok dengan filter atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredPiket.map((item, index) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-6 font-mono text-slate-400 text-center">{index + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{item.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.namaGuru}</td>
                      <td className="py-3 px-4 font-mono text-center text-slate-700">
                        {item.jamDatang === '-' ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                            {item.jamDatang}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-center text-slate-700">
                        {item.jamPulang === '-' ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                            {item.jamPulang}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {item.status === 'Lengkap' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Lengkap
                          </span>
                        ) : item.status === 'TIDAK ABSEN PULANG' ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-rose-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            TIDAK ABSEN PULANG
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            TIDAK ABSEN DATANG
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
