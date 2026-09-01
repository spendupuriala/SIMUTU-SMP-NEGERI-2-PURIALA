import React from 'react';
import { 
  ClipboardList, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  Plus, 
  ArrowRight,
  CheckCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import { ProgramKerja, SiswaNilai, IntervensiSiswa, SupervisiGuru, PerangkatAjar } from '../types';

interface DashboardProps {
  programs: ProgramKerja[];
  nilaiSiswa: SiswaNilai[];
  intervensi: IntervensiSiswa[];
  supervisi: SupervisiGuru[];
  compliance: PerangkatAjar[];
  setActiveTab: (tab: string) => void;
  onAddQuickIntervention: (siswa: SiswaNilai) => void;
}

export default function Dashboard({ 
  programs, 
  nilaiSiswa, 
  intervensi, 
  supervisi, 
  compliance, 
  setActiveTab,
  onAddQuickIntervention
}: DashboardProps) {

  // Calculations
  const totalPrograms = programs.length;
  const completedPrograms = programs.filter(p => p.status === 'Selesai').length;
  const inProgressPrograms = programs.filter(p => p.status === 'Sedang').length;
  const pendingPrograms = programs.filter(p => p.status === 'Belum').length;
  
  const programProgressPercent = totalPrograms > 0 
    ? Math.round((completedPrograms / totalPrograms) * 100) 
    : 0;

  // Grades targets / warnings (KKM = 70)
  const KKM = 70;
  const underperformingSiswa = nilaiSiswa.filter(n => n.akhir < KKM);
  
  // Compliance score
  const getTeacherComplianceStats = (c: typeof compliance[0]) => {
    const keys = [
      'kalenderAkademik', 'cp', 'analisisCp', 'tp', 'atp',
      'prota', 'prosem', 'mingguEfektif', 'modulAjar',
      'asesmen', 'formatPenilaian', 'rubrikPenilaian'
    ] as const;
    
    const classes = c.kelasAjar.split(',').map(s => s.trim()).filter(Boolean);
    if (classes.length === 0) return { checked: 0, total: 0, percent: 0 };

    let checked = 0;
    let total = 0;

    classes.forEach(cls => {
      total += keys.length;
      if (c.kepatuhanKelas && c.kepatuhanKelas[cls]) {
        keys.forEach(key => {
          if (c.kepatuhanKelas![cls][key] === true) checked++;
        });
      } else {
        keys.forEach(key => {
          if (c[key as keyof typeof c] === true) checked++;
        });
      }
    });

    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { checked, total, percent };
  };

  const { totalChecklists, checkedChecklists } = compliance.reduce((acc, curr) => {
    const stats = getTeacherComplianceStats(curr);
    return {
      totalChecklists: acc.totalChecklists + stats.total,
      checkedChecklists: acc.checkedChecklists + stats.checked
    };
  }, { totalChecklists: 0, checkedChecklists: 0 });

  const compliancePercent = totalChecklists > 0 
    ? Math.round((checkedChecklists / totalChecklists) * 100) 
    : 0;

  // Average performance
  const avgSupervisiScore = supervisi.length > 0
    ? (supervisi.reduce((acc, curr) => acc + curr.skorRataRata, 0) / supervisi.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6" id="dashboard-view-wrapper">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden" id="dashboard-welcome-banner">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-emerald-400 via-indigo-500 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
                Pusat Kendali Utama
              </span>
              <span className="text-xs text-slate-400">• Diperbarui Real-time</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Selamat Datang Kembali, Pak Suherman!</h2>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Pantau keterlaksanaan Program Kerja Kurikulum Merdeka, analisis peta mutu nilai siswa, audit perangkat ajar guru, serta tindak lanjuti siswa yang membutuhkan intervensi.
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-right hidden sm:block shrink-0">
            <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Mata Pelajaran Aktif</p>
            <p className="text-xl font-bold text-emerald-400">6 Utama</p>
            <p className="text-[10px] text-slate-400">Kelas 7, 8, dan 9</p>
          </div>
        </div>
      </div>

      {/* Top Level Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5" id="dashboard-metrics-grid">
        {/* Keterlaksanaan Program */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="metric-program-kerja">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Program Kerja Ganjil</span>
              <span className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                <ClipboardList className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900">{programProgressPercent}%</span>
              <span className="text-xs text-slate-400 ml-2">Selesai</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${programProgressPercent}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              {completedPrograms} dari {totalPrograms} program terselesaikan
            </p>
          </div>
        </div>

        {/* Early Warning Nilai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="metric-warning-nilai">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Siswa di Bawah Target</span>
              <span className={`p-2 rounded-xl ${underperformingSiswa.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className={`text-2xl font-bold ${underperformingSiswa.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {underperformingSiswa.length}
              </span>
              <span className="text-xs text-slate-400 ml-2">Kasus Nilai &lt; {KKM}</span>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => setActiveTab('analisis-akademik')}
              className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors group"
            >
              Tinjau Peta Mutu
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Rata-Rata Supervisi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="metric-supervisi">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Rata-Rata Hasil Supervisi</span>
              <span className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900">{avgSupervisiScore}</span>
              <span className="text-xs text-emerald-600 font-medium ml-2">Skor Indeks</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-slate-400 font-medium">
              Hasil observasi dari {supervisi.length} guru di semester ini
            </p>
          </div>
        </div>

        {/* Compliance RPP/Modul */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="metric-compliance">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Kepatuhan Perangkat Ajar</span>
              <span className="bg-cyan-50 text-cyan-600 p-2 rounded-xl">
                <BookOpen className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900">{compliancePercent}%</span>
              <span className="text-xs text-slate-400 ml-2">Kepatuhan</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${compliancePercent}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              {checkedChecklists} dari {totalChecklists} dokumen terverifikasi
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-content">
        
        {/* Left Column: Early Warning Widget & Program Kerja Ringkasan */}
        <div className="lg:col-span-8 space-y-6" id="dashboard-left-column">
          
          {/* Widget Early Warning */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="early-warning-widget-card">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Widget Early Warning Akademik</h3>
                  <p className="text-[10px] text-slate-500">Daftar siswa dengan nilai semester/harian di bawah target KKM (70)</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {underperformingSiswa.length} Masalah Terdeteksi
              </span>
            </div>

            <div className="p-0 overflow-x-auto">
              {underperformingSiswa.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Semua Siswa Memenuhi Target</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tidak ada nilai siswa di bawah KKM 70 pada sistem saat ini.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/20">
                      <th className="py-3 px-5">Nama Siswa</th>
                      <th className="py-3 px-3">Kelas</th>
                      <th className="py-3 px-3">Mata Pelajaran</th>
                      <th className="py-3 px-3 text-center">Nilai Akhir</th>
                      <th className="py-3 px-3 text-center">Status Tindak Lanjut</th>
                      <th className="py-3 px-5 text-right">Aksi Pintas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {underperformingSiswa.slice(0, 5).map((siswa) => {
                      // Check if already in intervention
                      const isIntervened = intervensi.find(i => i.siswaId === siswa.id || (i.namaSiswa === siswa.nama && i.mapel === siswa.mapel));
                      return (
                        <tr key={siswa.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-5 font-bold text-slate-700">{siswa.nama}</td>
                          <td className="py-3 px-3"><span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">{siswa.kelas}</span></td>
                          <td className="py-3 px-3 font-medium text-slate-500">{siswa.mapel}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              {siswa.akhir}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isIntervened ? (
                              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isIntervened.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                isIntervened.status === 'Berjalan' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                'bg-slate-50 text-slate-700 border border-slate-100'
                              }`}>
                                {isIntervened.status === 'Selesai' ? 'Remedial Selesai' :
                                 isIntervened.status === 'Berjalan' ? 'Sedang Dibimbing' : 'Direncanakan'}
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                                Butuh Intervensi
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-5 text-right">
                            {isIntervened ? (
                              <button 
                                onClick={() => setActiveTab('analisis-akademik')}
                                className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold transition-colors"
                              >
                                Lihat Jadwal
                              </button>
                            ) : (
                              <button 
                                onClick={() => onAddQuickIntervention(siswa)}
                                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded transition-colors border border-emerald-100 flex items-center gap-0.5 ml-auto"
                              >
                                <Plus className="h-3 w-3" />
                                Buat Intervensi
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {underperformingSiswa.length > 5 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <button 
                  onClick={() => setActiveTab('analisis-akademik')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
                >
                  Lihat Semua {underperformingSiswa.length} Siswa Bermasalah
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Ringkasan Keterlaksanaan Program Kerja */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5" id="program-summary-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Status Keterlaksanaan Program Kerja</h3>
                <p className="text-[10px] text-slate-500">Masing-masing status tupoksi perencanaan dan evaluasi kurikulum</p>
              </div>
              <button 
                onClick={() => setActiveTab('program-kerja')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
              >
                Atur Master Program
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Program work status pill bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-xl font-bold text-emerald-700">{completedPrograms}</p>
                <p className="text-[10px] text-emerald-600 font-semibold uppercase">Selesai</p>
              </div>
              
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <Clock className="h-5 w-5 text-indigo-500" />
                </div>
                <p className="text-xl font-bold text-indigo-700">{inProgressPrograms}</p>
                <p className="text-[10px] text-indigo-600 font-semibold uppercase">Sedang Berjalan</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <HelpCircle className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-xl font-bold text-slate-700">{pendingPrograms}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Belum Mulai</p>
              </div>
            </div>

            {/* List of 3 nearest programs */}
            <div className="mt-4 space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioritas Program Terdekat</p>
              {programs.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50/20 text-xs transition-colors">
                  <div className="overflow-hidden pr-3">
                    <p className="font-semibold text-slate-700 truncate">{p.program}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PJ: {p.tanggungJawab} • Target: {p.targetWaktu}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                    p.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'Sedang' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Quick Shortcuts & Academic Calendar Reminder */}
        <div className="lg:col-span-4 space-y-6" id="dashboard-right-column">
          
          {/* Quick Action Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5" id="quick-action-shortcuts-card">
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-800">Pintasan Harian Kurikulum</h3>
            </div>
            
            <div className="space-y-2.5">
              <button 
                onClick={() => setActiveTab('program-kerja')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-100 hover:border-slate-200 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">Unggah Bukti Fisik Proker</p>
                  <p className="text-[10px] text-slate-400">Monitoring & Evidence Tracker</p>
                </div>
                <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </button>

              <button 
                onClick={() => setActiveTab('analisis-akademik')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-100 hover:border-slate-200 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">Import Rekap Nilai Siswa</p>
                  <p className="text-[10px] text-slate-400">Unggah dari file Excel/CSV</p>
                </div>
                <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </button>

              <button 
                onClick={() => setActiveTab('supervisi-guru')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-100 hover:border-slate-200 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">Input Hasil Observasi KBM</p>
                  <p className="text-[10px] text-slate-400">Isi Form Supervisi Guru</p>
                </div>
                <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </button>

              <button 
                onClick={() => setActiveTab('dokumen-kurikulum')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-100 hover:border-slate-200 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">Unggah Dokumen KOSP</p>
                  <p className="text-[10px] text-slate-400">Tambah ke Bank Data Sekolah</p>
                </div>
                <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Academic Stats Box */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden" id="academic-stats-reminder">
            <div className="relative z-10 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-white/10 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Info Akademik
                </span>
                <span className="text-indigo-300 text-[10px]">Tahun Pelajaran 2026/2027</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-200">Statistik Guru Mengajar</p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 border border-white/10 rounded-xl py-2">
                    <p className="text-lg font-bold text-indigo-300">{compliance.length}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Jumlah Guru</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl py-2">
                    <p className="text-lg font-bold text-emerald-400">
                      {compliance.filter(c => getTeacherComplianceStats(c).percent === 100).length}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase">100% Compliant</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 text-[11px] text-slate-300">
                <p className="font-semibold text-white">Catatan Wakasek:</p>
                <p className="mt-1 leading-relaxed text-slate-300 italic">
                  "Pastikan supervisi gelombang I diselesaikan tepat waktu sebelum pelaksanaan Sumatif Tengah Semester di bulan Oktober."
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
