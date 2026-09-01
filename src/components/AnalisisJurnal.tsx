import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X
} from 'lucide-react';
import { JurnalMengajar } from '../types';

interface AnalisisJurnalProps {
  jurnals: JurnalMengajar[];
  onAddJurnal: (newJur: Omit<JurnalMengajar, 'id'>) => void;
  onDeleteJurnal: (id: string) => void;
}

export default function AnalisisJurnal({
  jurnals,
  onAddJurnal,
  onDeleteJurnal
}: AnalisisJurnalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formNamaGuru, setFormNamaGuru] = useState('');
  const [formMapel, setFormMapel] = useState('Matematika');
  const [formKelas, setFormKelas] = useState('VII.A');
  const [formJamKe, setFormJamKe] = useState('1-2');
  const [formMateriAjar, setFormMateriAjar] = useState('');
  const [formHadir, setFormHadir] = useState(30);
  const [formSakit, setFormSakit] = useState(0);
  const [formIzin, setFormIzin] = useState(0);
  const [formAlfa, setFormAlfa] = useState(0);
  const [formCatatan, setFormCatatan] = useState('');
  const [formStatus, setFormStatus] = useState<'Terlaksana' | 'Tertunda' | 'Selesai'>('Terlaksana');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaGuru || !formMateriAjar) return;

    onAddJurnal({
      tanggal: formTanggal,
      namaGuru: formNamaGuru,
      mapel: formMapel,
      kelas: formKelas,
      jamKe: formJamKe,
      materiAjar: formMateriAjar,
      absensiSiswa: {
        hadir: Number(formHadir),
        sakit: Number(formSakit),
        izin: Number(formIzin),
        alfa: Number(formAlfa)
      },
      catatanKejadian: formCatatan,
      statusPelaksanaan: formStatus
    });

    // Reset Form
    setFormNamaGuru('');
    setFormMateriAjar('');
    setFormCatatan('');
    setIsAddOpen(false);
  };

  const filteredJurnals = jurnals.filter(item => {
    const matchesSearch = 
      item.namaGuru.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materiAjar.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'Semua' || item.kelas === selectedClass;

    return matchesSearch && matchesClass;
  });

  const uniqueClasses = ['Semua', 'VII.A', 'VII.B', 'VIII', 'IX', '8A', '8B', '9A'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Analisis Akademik</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800">Catatan Jurnal Mengajar</h1>
          <p className="text-xs text-slate-500">Mencatat, memantau, dan menganalisis keterlaksanaan materi PBM guru.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Jurnal</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari guru, mapel, materi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 w-full md:w-48">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Kelas</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none py-1 cursor-pointer"
          >
            {uniqueClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-4">Guru / Mapel</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3 text-center">Jam</th>
                <th className="py-3 px-6">Materi Pembelajaran</th>
                <th className="py-3 px-4 text-center">Absensi (H/S/I/A)</th>
                <th className="py-3 px-5">Catatan Kejadian</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredJurnals.length > 0 ? (
                filteredJurnals.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-5 font-medium text-slate-600">{item.tanggal}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{item.namaGuru}</div>
                      <div className="text-[10px] text-slate-400">{item.mapel}</div>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {item.kelas}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center font-mono font-semibold text-slate-500">{item.jamKe}</td>
                    <td className="py-4 px-6 font-medium text-slate-700 max-w-xs">{item.materiAjar}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="font-mono text-[11px] font-bold text-slate-700">
                        <span className="text-emerald-600">{item.absensiSiswa.hadir}</span>/
                        <span className="text-blue-500">{item.absensiSiswa.sakit}</span>/
                        <span className="text-amber-500">{item.absensiSiswa.izin}</span>/
                        <span className="text-rose-500">{item.absensiSiswa.alfa}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-400 italic max-w-xs">{item.catatanKejadian || '-'}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.statusPelaksanaan === 'Selesai'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {item.statusPelaksanaan}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onDeleteJurnal(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Tidak ada jurnal mengajar tersedia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Tambah Jurnal Mengajar Baru</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Tanggal</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Kelas</label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="VII.A">VII.A</option>
                    <option value="VII.B">VII.B</option>
                    <option value="VIII">VIII</option>
                    <option value="IX">IX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Nama Guru</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama guru..."
                    value={formNamaGuru}
                    onChange={(e) => setFormNamaGuru(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Mata Pelajaran</label>
                  <select
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="IPA">IPA</option>
                    <option value="IPS">IPS</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Pancasila">Pancasila</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Jam Ke</label>
                  <input
                    type="text"
                    value={formJamKe}
                    onChange={(e) => setFormJamKe(e.target.value)}
                    placeholder="Contoh: 1-2"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Terlaksana">Terlaksana</option>
                    <option value="Tertunda">Tertunda</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Materi Pembelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan materi ajar..."
                  value={formMateriAjar}
                  onChange={(e) => setFormMateriAjar(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <label className="font-bold text-slate-700 block mb-1">Absensi Siswa (Jumlah)</label>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <label className="text-[10px] text-emerald-600 font-bold block mb-1">Hadir</label>
                    <input
                      type="number"
                      value={formHadir}
                      onChange={(e) => setFormHadir(Number(e.target.value))}
                      className="w-full text-center border border-slate-200 rounded-lg p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-blue-500 font-bold block mb-1">Sakit</label>
                    <input
                      type="number"
                      value={formSakit}
                      onChange={(e) => setFormSakit(Number(e.target.value))}
                      className="w-full text-center border border-slate-200 rounded-lg p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-500 font-bold block mb-1">Izin</label>
                    <input
                      type="number"
                      value={formIzin}
                      onChange={(e) => setFormIzin(Number(e.target.value))}
                      className="w-full text-center border border-slate-200 rounded-lg p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-500 font-bold block mb-1">Alfa</label>
                    <input
                      type="number"
                      value={formAlfa}
                      onChange={(e) => setFormAlfa(Number(e.target.value))}
                      className="w-full text-center border border-slate-200 rounded-lg p-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Catatan Kejadian / Kejadian Penting</label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Catatan kelas atau siswa bermasalah..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
