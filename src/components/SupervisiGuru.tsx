import React, { useState } from 'react';
import { 
  Users, 
  FileCheck, 
  UserCheck, 
  Award, 
  Plus, 
  CheckSquare, 
  TrendingUp, 
  X, 
  ClipboardList, 
  Star, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Info,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { SupervisiGuru, PerangkatAjar } from '../types';

export const DAFTAR_ADMINISTRASI = [
  { key: 'kalenderAkademik', label: 'Kalender Akademik', short: 'Kalender' },
  { key: 'cp', label: 'Capaian Pembelajaran (CP)', short: 'CP' },
  { key: 'analisisCp', label: 'Analisis CP', short: 'Analisis CP' },
  { key: 'tp', label: 'Tujuan Pembelajaran (TP)', short: 'TP' },
  { key: 'atp', label: 'Alur Tujuan Pembelajaran (ATP)', short: 'ATP' },
  { key: 'prota', label: 'Program Tahunan (Prota)', short: 'Prota' },
  { key: 'prosem', label: 'Program Semester (Prosem)', short: 'Prosem' },
  { key: 'mingguEfektif', label: 'Minggu Efektif', short: 'M. Efektif' },
  { key: 'modulAjar', label: 'Modul Ajar / RPP', short: 'Modul Ajar' },
  { key: 'asesmen', label: 'Asesmen', short: 'Asesmen' },
  { key: 'formatPenilaian', label: 'Format Penilaian', short: 'Format Nilai' },
  { key: 'rubrikPenilaian', label: 'Rubrik Penilaian', short: 'Rubrik' },
] as const;

interface SupervisiGuruProps {
  supervisi: SupervisiGuru[];
  compliance: PerangkatAjar[];
  onAddSupervisi: (supervisi: Omit<SupervisiGuru, 'id'>) => void;
  onToggleCompliance: (id: string, field: keyof PerangkatAjar) => void;
  onUpdateCompliance?: (id: string, kepatuhanKelas: Record<string, any>) => void;
  onAddComplianceGuru: (guru: Omit<PerangkatAjar, 'id'>) => void;
  onDeleteSupervisi?: (id: string) => void;
  onDeleteCompliance?: (id: string) => void;
}

export default function SupervisiGuruView({
  supervisi,
  compliance,
  onAddSupervisi,
  onToggleCompliance,
  onUpdateCompliance,
  onAddComplianceGuru,
  onDeleteSupervisi,
  onDeleteCompliance
}: SupervisiGuruProps) {
  // Sub-tabs
  const [subTab, setSubTab] = useState<'form' | 'kinerja' | 'compliance'>('compliance');

  // Modal / Inputs state
  const [isSupervisiOpen, setIsSupervisiOpen] = useState(false);
  const [isAddGuruOpen, setIsAddGuruOpen] = useState(false);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<PerangkatAjar | null>(null);
  const [activeClassTab, setActiveClassTab] = useState<string>('');
  const [selectedSupervisi, setSelectedSupervisi] = useState<SupervisiGuru | null>(null);

  // Safe delete confirmation modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'compliance' | 'supervisi' | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  // Form State - Input Observasi Kelas Baru
  const [formNamaGuru, setFormNamaGuru] = useState('');
  const [formMapel, setFormMapel] = useState('Matematika');
  const [formKelas, setFormKelas] = useState('VII.A');
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [scorePendahuluan, setScorePendahuluan] = useState(80);
  const [scoreInti, setScoreInti] = useState(80);
  const [scorePenutup, setScorePenutup] = useState(80);
  const [formKekuatan, setFormKekuatan] = useState('');
  const [formPengembangan, setFormPengembangan] = useState('');
  const [formRekomendasi, setFormRekomendasi] = useState('');

  // Form State - Tambah Guru untuk Compliance
  const [formAddNama, setFormAddNama] = useState('');
  const [formAddMapel, setFormAddMapel] = useState('Matematika');
  const [formAddKelas, setFormAddKelas] = useState('VII.A, VII.B');

  // Submit Supervisi Form
  const handleSupervisiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaGuru || !formKekuatan || !formPengembangan || !formRekomendasi) return;

    const avg = parseFloat(((scorePendahuluan + scoreInti + scorePenutup) / 3).toFixed(1));

    onAddSupervisi({
      namaGuru: formNamaGuru,
      mapel: formMapel,
      kelas: formKelas,
      tanggal: formTanggal,
      skorPendahuluan: scorePendahuluan,
      skorInti: scoreInti,
      skorPenutup: scorePenutup,
      skorRataRata: avg,
      catatanKekuatan: formKekuatan,
      catatanPengembangan: formPengembangan,
      rekomendasi: formRekomendasi
    });

    // Reset Form
    setFormNamaGuru('');
    setFormKekuatan('');
    setFormPengembangan('');
    setFormRekomendasi('');
    setIsSupervisiOpen(false);
    setSubTab('kinerja'); // Switch to performance list to see result
  };

  // Submit Add Guru for compliance list
  const handleAddGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddNama) return;

    onAddComplianceGuru({
      namaGuru: formAddNama,
      mapel: formAddMapel,
      kelasAjar: formAddKelas,
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
      rubrikPenilaian: false,
      revisiTerakhir: new Date().toISOString().split('T')[0]
    });

    setFormAddNama('');
    setFormAddKelas('VII.A, VII.B');
    setIsAddGuruOpen(false);
  };

  // Toggle class document checklist and call parent handler
  const handleToggleClassDocument = (field: typeof DAFTAR_ADMINISTRASI[number]['key']) => {
    if (!editingTeacher || !activeClassTab || !onUpdateCompliance) return;

    // Clone or initialize kepatuhanKelas
    const kepatuhanKelas = { ...(editingTeacher.kepatuhanKelas || {}) };
    
    // Initialize class detail if it doesn't exist
    if (!kepatuhanKelas[activeClassTab]) {
      kepatuhanKelas[activeClassTab] = {
        kalenderAkademik: false, cp: false, analisisCp: false, tp: false, atp: false,
        prota: false, prosem: false, mingguEfektif: false, modulAjar: false,
        asesmen: false, formatPenilaian: false, rubrikPenilaian: false
      };
    }

    const currentClassDetail = { ...kepatuhanKelas[activeClassTab] };
    currentClassDetail[field] = !currentClassDetail[field];
    kepatuhanKelas[activeClassTab] = currentClassDetail;

    // Call prop to update parent state
    onUpdateCompliance(editingTeacher.id, kepatuhanKelas);

    // Also update our local copy of editingTeacher so the UI updates instantly
    setEditingTeacher(prev => {
      if (!prev) return null;
      return {
        ...prev,
        kepatuhanKelas
      };
    });
  };

  // Helper to calculate checked & total checklists for a teacher
  const getTeacherComplianceStats = (c: PerangkatAjar) => {
    const keys = [
      'kalenderAkademik', 'cp', 'analisisCp', 'tp', 'atp',
      'prota', 'prosem', 'mingguEfektif', 'modulAjar',
      'asesmen', 'formatPenilaian', 'rubrikPenilaian'
    ] as const;
    
    const classes = c.kelasAjar.split(',').map(s => s.trim()).filter(Boolean);
    if (classes.length === 0) return { checked: 0, total: 0, percent: 0, perClassPercent: {} as Record<string, number> };

    let checked = 0;
    let total = 0;
    const perClassPercent: Record<string, number> = {};

    classes.forEach(cls => {
      let classChecked = 0;
      let classTotal = keys.length;
      total += classTotal;

      if (c.kepatuhanKelas && c.kepatuhanKelas[cls]) {
        keys.forEach(key => {
          if (c.kepatuhanKelas![cls][key] === true) {
            checked++;
            classChecked++;
          }
        });
      } else {
        keys.forEach(key => {
          if (c[key] === true) {
            checked++;
            classChecked++;
          }
        });
      }

      perClassPercent[cls] = Math.round((classChecked / classTotal) * 100);
    });

    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { checked, total, percent, perClassPercent };
  };

  const { totalItems, fulfilledItems } = compliance.reduce((acc, curr) => {
    const stats = getTeacherComplianceStats(curr);
    return {
      totalItems: acc.totalItems + stats.total,
      fulfilledItems: acc.fulfilledItems + stats.checked
    };
  }, { totalItems: 0, fulfilledItems: 0 });

  const totalCompliancePercent = totalItems > 0 ? Math.round((fulfilledItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6" id="supervisi-view-wrapper">
      
      {/* Upper Title and Subtabs Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs" id="supervisi-header">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Supervisi Akademik & Mutu Pembelajaran</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau dan tingkatkan mutu KBM berlandaskan standar Kurikulum Merdeka. Audit kepatuhan kelengkapan administrasi ajar guru secara interaktif.
          </p>
        </div>

        {/* Local Navigation tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 shrink-0" id="supervisi-tabs-row">
          <button 
            onClick={() => setSubTab('compliance')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'compliance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Kepatuhan Dokumen (Compliance)
          </button>
          <button 
            onClick={() => setSubTab('kinerja')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'kinerja' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Grafik & Rekap Kinerja Guru
          </button>
        </div>
      </div>

      {/* SUBTAB 1: COMPLIANCE PERANGKAT AJAR (INTERACTIVE CHECKLIST) */}
      {subTab === 'compliance' && (
        <div className="space-y-6" id="compliance-view-container">
          
          {/* Compliance Stats Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  ADMINISTRASI GURU
                </span>
                <span className="text-slate-400 text-xs">• TA 2026/2027 Ganjil</span>
              </div>
              <h3 className="text-base font-bold">Audit Kelengkapan Dokumen Pembelajaran (Compliance)</h3>
              <p className="text-slate-300 text-xs">Centang berkas administrasi secara digital (12 jenis dokumen KBM sesuai standar Kurikulum Merdeka).</p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-800/60 p-4 border border-slate-700/50 rounded-xl shrink-0 min-w-[260px]">
              <div className="space-y-1 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Indeks Kepatuhan</p>
                <p className="text-2xl font-bold text-emerald-400">{totalCompliancePercent}%</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${totalCompliancePercent}%` }}></div>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400 font-semibold pl-4 border-l border-slate-700">
                <p className="text-white text-lg font-bold">{fulfilledItems}</p>
                <p className="text-[10px]">Dari {totalItems} Berkas</p>
              </div>
            </div>
          </div>

          {/* Compliance Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="compliance-list-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <h3 className="font-bold text-sm text-slate-800">Daftar Audit Berkas per Guru</h3>
              <button
                onClick={() => setIsAddGuruOpen(true)}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-150 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Daftarkan Guru Baru
              </button>
            </div>

            <div className="overflow-x-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/20">
                    <th className="py-3 px-5">Nama Guru / Mata Pelajaran</th>
                    <th className="py-3 px-4">Kelas Ajar</th>
                    <th className="py-3 px-5">Kepatuhan per Kelas (%)</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {compliance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 px-5 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <ClipboardList className="h-6 w-6" />
                          </div>
                          <h4 className="text-slate-800 font-bold text-xs">Belum Ada Data Guru</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-xs">
                            Silakan klik tombol "Daftarkan Guru Baru" di atas untuk menambahkan guru dan mengaudit kepatuhan administrasinya.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    compliance.map((c) => {
                      const stats = getTeacherComplianceStats(c);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-5">
                            <p className="font-bold text-slate-800 leading-tight">{c.namaGuru}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Mapel: {c.mapel}</p>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-500">
                            <div className="flex flex-wrap gap-1">
                              {c.kelasAjar.split(',').map(s => s.trim()).filter(Boolean).map(cls => (
                                <span key={cls} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold text-[10px] whitespace-nowrap">
                                  {cls}
                                </span>
                              ))}
                            </div>
                          </td>
                          
                          <td className="py-4 px-5">
                            <div className="flex flex-wrap gap-2 items-center">
                              {Object.entries(stats.perClassPercent).map(([cls, pct]) => {
                                const colorClass = 
                                  pct === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  pct > 50 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200';
                                return (
                                  <span key={cls} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border font-bold text-[10px] ${colorClass}`}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pct === 100 ? '#10b981' : pct > 50 ? '#6366f1' : '#f43f5e' }}></span>
                                    {cls}: {pct}%
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingTeacher(c);
                                  const classes = c.kelasAjar.split(',').map(s => s.trim()).filter(Boolean);
                                  setActiveClassTab(classes[0] || 'VII.A');
                                  setIsEditTeacherOpen(true);
                                }}
                                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-150 transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <ClipboardList className="h-3.5 w-3.5" />
                                Edit Data Guru
                              </button>
                              {onDeleteCompliance && (
                                <button
                                  onClick={() => {
                                    setDeleteId(c.id);
                                    setDeleteType('compliance');
                                    setDeleteName(c.namaGuru);
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-150 transition-colors cursor-pointer"
                                  title="Hapus Data Guru"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
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
      )}

      {/* SUBTAB 2: GRAFIK & REKAP KINERJA GURU (SUPERVISI LOGGER) */}
      {subTab === 'kinerja' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="performance-view-container">
          
          {/* Left Column: Observational Log & Performance Matrix */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="supervisi-list-card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <h3 className="font-bold text-sm text-slate-800">Riwayat Observasi Kelas Digital ({supervisi.length})</h3>
              <button
                onClick={() => setIsSupervisiOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Input Observasi Baru
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto custom-scrollbar">
              {supervisi.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Info className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold">Belum ada riwayat supervisi</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mulai dengan mengklik tombol "Input Observasi Baru" di atas.</p>
                </div>
              ) : (
                supervisi.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedSupervisi(s)}
                    className="p-4.5 hover:bg-slate-50/40 cursor-pointer flex justify-between items-start text-xs transition-colors"
                  >
                    <div className="space-y-1.5 overflow-hidden pr-4">
                      <div>
                        <span className="inline-block text-[9px] bg-slate-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded mr-2">
                          {s.mapel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{s.tanggal}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{s.namaGuru}</h4>
                      <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                        <span className="text-slate-400">Target Observasi:</span> Kelas {s.kelas}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                          Kekuatan: {s.catatanKekuatan.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">INDeks SKOR</p>
                        <p className="font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded text-sm border border-indigo-100">
                          {s.skorRataRata}
                        </p>
                      </div>
                      
                      {onDeleteSupervisi && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(s.id);
                            setDeleteType('supervisi');
                            setDeleteName(s.namaGuru);
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Strengths & Weaknesses Feedback Drawer */}
          <div className="lg:col-span-4" id="supervisi-feedback-panel">
            {selectedSupervisi ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs sticky top-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">Lembar Evaluasi Guru</span>
                  <button 
                    onClick={() => setSelectedSupervisi(null)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-slate-800 leading-tight">{selectedSupervisi.namaGuru}</h4>
                  <p className="text-[10px] text-slate-400">{selectedSupervisi.mapel} • Kelas {selectedSupervisi.kelas}</p>
                </div>

                {/* Indikator Scores Breakdown */}
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Breakdown Indikator Kurikulum Merdeka</p>
                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">1. Pendahuluan (Apersepsi):</span>
                      <span className="font-bold">{selectedSupervisi.skorPendahuluan}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">2. Inti (Berdiferensiasi):</span>
                      <span className="font-bold">{selectedSupervisi.skorInti}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">3. Penutup (Refleksi):</span>
                      <span className="font-bold">{selectedSupervisi.skorPenutup}/100</span>
                    </div>
                    <div className="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between text-indigo-900 font-bold">
                      <span>Rata-Rata Hasil:</span>
                      <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">{selectedSupervisi.skorRataRata}</span>
                    </div>
                  </div>
                </div>

                {/* Qualitative Strength and Area of Development fields */}
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-700 flex items-center gap-1 uppercase text-[10px]">
                      <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                      Kekuatan Mengajar
                    </p>
                    <p className="text-slate-600 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/50 leading-relaxed">
                      {selectedSupervisi.catatanKekuatan}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-amber-700 flex items-center gap-1 uppercase text-[10px]">
                      <ShieldAlert className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      Area Pengembangan
                    </p>
                    <p className="text-slate-600 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/50 leading-relaxed">
                      {selectedSupervisi.catatanPengembangan}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider block">
                      Rekomendasi Tindak Lanjut
                    </p>
                    <p className="text-indigo-950 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/60 leading-relaxed">
                      {selectedSupervisi.rekomendasi}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500 sticky top-6">
                <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Lembar Analisis Mengajar</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Pilih salah satu riwayat observasi kelas untuk meninjau secara mendalam kekuatan mengajar guru, area pengembangan, serta butir rekomendasi klinis.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL: INPUT SUPERVISI BARU */}
      {isSupervisiOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="add-supervisi-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">Form Observasi Kelas Digital</h3>
              </div>
              <button 
                onClick={() => setIsSupervisiOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSupervisiSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Guru</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Drs. Ahmad Junaedi..."
                    value={formNamaGuru}
                    onChange={(e) => setFormNamaGuru(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Observasi</label>
                  <input 
                    type="date" 
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</label>
                  <select 
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  >
                    {['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pancasila'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelas Observasi</label>
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
              </div>

              {/* Slider / Score inputs */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penilaian Indikator (1 - 100)</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Kegiatan Pendahuluan (Apersepsi & Target):</span>
                      <span className="text-indigo-600">{scorePendahuluan} Poin</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" 
                      value={scorePendahuluan}
                      onChange={(e) => setScorePendahuluan(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Kegiatan Inti (Diferensiasi & TPACK):</span>
                      <span className="text-indigo-600">{scoreInti} Poin</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" 
                      value={scoreInti}
                      onChange={(e) => setScoreInti(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Kegiatan Penutup (Refleksi & Formatir):</span>
                      <span className="text-indigo-600">{scorePenutup} Poin</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" 
                      value={scorePenutup}
                      onChange={(e) => setScorePenutup(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kekuatan Mengajar Guru</label>
                <input 
                  type="text" required
                  placeholder="Contoh: Sangat interaktif dalam mengajukan pertanyaan reflektif..."
                  value={formKekuatan}
                  onChange={(e) => setFormKekuatan(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Area Pengembangan Teridentifikasi</label>
                <input 
                  type="text" required
                  placeholder="Contoh: Pengelolaan durasi diskusi kelompok masih longgar..."
                  value={formPengembangan}
                  onChange={(e) => setFormPengembangan(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rekomendasi Tindak Lanjut</label>
                <input 
                  type="text" required
                  placeholder="Contoh: Menggunakan timer digital di kelas saat aktivitas kelompok..."
                  value={formRekomendasi}
                  onChange={(e) => setFormRekomendasi(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsSupervisiOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all"
                >
                  Simpan Hasil Observasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DAFTAR GURU BARU (COMPLIANCE) */}
      {isAddGuruOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="add-guru-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4.5 w-4.5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Daftarkan Guru Baru (Audit Berkas)</h3>
              </div>
              <button 
                onClick={() => setIsAddGuruOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddGuruSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap Guru (Beserta Gelar)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Rian Hidayat, S.Pd..."
                  value={formAddNama}
                  onChange={(e) => setFormAddNama(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</label>
                  <select 
                    value={formAddMapel}
                    onChange={(e) => setFormAddMapel(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  >
                    {['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pancasila'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rombel / Kelas Mengajar</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: 7A, 7B, 8C"
                    value={formAddKelas}
                    onChange={(e) => setFormAddKelas(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddGuruOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all"
                >
                  Daftarkan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA GURU (COMPLIANCE PER KELAS) */}
      {isEditTeacherOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="edit-teacher-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Edit Data Administrasi Guru</h3>
                  <p className="text-[10px] text-slate-400">Pembaruan berkas kelengkapan per kelas mengajar</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsEditTeacherOpen(false);
                  setEditingTeacher(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Teacher Info Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{editingTeacher.namaGuru}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Mata Pelajaran: <span className="font-semibold text-slate-700">{editingTeacher.mapel}</span></p>
                </div>
                <div className="bg-white/80 border border-slate-200 py-1.5 px-3 rounded-lg text-xs">
                  <span className="text-slate-400 font-medium">Terakhir Audit: </span>
                  <span className="font-mono font-bold text-slate-700">{editingTeacher.revisiTerakhir}</span>
                </div>
              </div>

              {/* Class Selection Tabs */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Rombel / Kelas Mengajar</label>
                <div className="flex flex-wrap gap-2">
                  {editingTeacher.kelasAjar.split(',').map(s => s.trim()).filter(Boolean).map((cls) => {
                    const isActive = activeClassTab === cls;
                    
                    // Calc compliance percent for this specific class to show in tab
                    const keys = [
                      'kalenderAkademik', 'cp', 'analisisCp', 'tp', 'atp',
                      'prota', 'prosem', 'mingguEfektif', 'modulAjar',
                      'asesmen', 'formatPenilaian', 'rubrikPenilaian'
                    ] as const;
                    let classChecked = 0;
                    if (editingTeacher.kepatuhanKelas && editingTeacher.kepatuhanKelas[cls]) {
                      keys.forEach(k => {
                        if (editingTeacher.kepatuhanKelas![cls][k] === true) classChecked++;
                      });
                    } else {
                      keys.forEach(k => {
                        if (editingTeacher[k] === true) classChecked++;
                      });
                    }
                    const classPercent = Math.round((classChecked / keys.length) * 100);

                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setActiveClassTab(cls)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10' 
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span>Kelas {cls}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
                          isActive 
                            ? 'bg-indigo-500 text-white' 
                            : classPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {classPercent}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 12 Checklist Perangkat Ajar Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Checklist 12 Perangkat Ajar - Kelas {activeClassTab}
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold italic bg-indigo-50 px-2 py-0.5 rounded">
                    Centang untuk audit kelengkapan berkas khusus kelas ini
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {DAFTAR_ADMINISTRASI.map((item) => {
                    const isFulfilled = editingTeacher.kepatuhanKelas?.[activeClassTab]?.[item.key] === true;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleToggleClassDocument(item.key)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer select-none group ${
                          isFulfilled 
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 border-emerald-150' 
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isFulfilled ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}>
                            {isFulfilled && (
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs font-semibold">{item.label}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                          isFulfilled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isFulfilled ? 'Lengkap' : 'Belum'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 italic">
                *Sistem menyimpan perubahan dan memperbarui skor kepatuhan secara otomatis.
              </span>
              <button 
                type="button"
                onClick={() => {
                  setIsEditTeacherOpen(false);
                  setEditingTeacher(null);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/15 transition-all cursor-pointer"
              >
                Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFE CUSTOM CONFIRMATION MODAL (BYPASSING BLOCKED WINDOW.CONFIRM) */}
      {deleteId && deleteType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4" id="custom-confirm-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Konfirmasi Hapus</h4>
                <p className="text-[10px] text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data {deleteType === 'compliance' ? 'administrasi' : 'supervisi'} untuk guru <span className="font-bold text-slate-800">{deleteName}</span>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteType(null);
                  setDeleteName('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteType === 'compliance' && onDeleteCompliance) {
                    onDeleteCompliance(deleteId);
                  } else if (deleteType === 'supervisi' && onDeleteSupervisi) {
                    onDeleteSupervisi(deleteId);
                    if (selectedSupervisi?.id === deleteId) {
                      setSelectedSupervisi(null);
                    }
                  }
                  setDeleteId(null);
                  setDeleteType(null);
                  setDeleteName('');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/15 transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
