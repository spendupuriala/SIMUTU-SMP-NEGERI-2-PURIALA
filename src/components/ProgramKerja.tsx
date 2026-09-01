import React, { useState, useRef } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  FileCheck, 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  ChevronRight, 
  FileText,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { ProgramKerja } from '../types';

interface ProgramKerjaProps {
  programs: ProgramKerja[];
  onAddProgram: (program: Omit<ProgramKerja, 'id'>) => void;
  onUpdateProgramStatus: (id: string, status: ProgramKerja['status']) => void;
  onUploadEvidence: (id: string, fileInfo: { name: string; size: string; date: string }) => void;
  onUpdateProgramNotes: (id: string, notes: string) => void;
  onDeleteProgram?: (id: string) => void;
}

export default function ProgramKerjaView({
  programs,
  onAddProgram,
  onUpdateProgramStatus,
  onUploadEvidence,
  onUpdateProgramNotes,
  onDeleteProgram
}: ProgramKerjaProps) {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<'all' | '1' | '2'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Belum' | 'Sedang' | 'Selesai'>('all');
  
  // Modals / Detail drawer states
  const [selectedProgram, setSelectedProgram] = useState<ProgramKerja | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Form input states
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramSemester, setNewProgramSemester] = useState<'1' | '2'>('1');
  const [newProgramTarget, setNewProgramTarget] = useState('');
  const [newProgramPJ, setNewProgramPJ] = useState('');
  const [newProgramNotes, setNewProgramNotes] = useState('');

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.tanggungJawab.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = semesterFilter === 'all' ? true : p.semester.toString() === semesterFilter;
    const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    
    return matchesSearch && matchesSemester && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName || !newProgramTarget || !newProgramPJ) return;

    onAddProgram({
      program: newProgramName,
      semester: parseInt(newProgramSemester) as 1 | 2,
      targetWaktu: newProgramTarget,
      tanggungJawab: newProgramPJ,
      status: 'Belum',
      notes: newProgramNotes || undefined
    });

    // Reset Form
    setNewProgramName('');
    setNewProgramSemester('1');
    setNewProgramTarget('');
    setNewProgramPJ('');
    setNewProgramNotes('');
    setIsAddModalOpen(false);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;
      
      onUploadEvidence(id, {
        name: file.name,
        size: sizeStr,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      });

      // Update selected view if open
      if (selectedProgram && selectedProgram.id === id) {
        setSelectedProgram({
          ...selectedProgram,
          evidenceName: file.name,
          evidenceSize: sizeStr,
          evidenceDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          status: 'Selesai' // Auto complete on upload if needed or let user choose
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      onUploadEvidence(id, {
        name: file.name,
        size: sizeStr,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      });

      // Update selected view if open
      if (selectedProgram && selectedProgram.id === id) {
        setSelectedProgram({
          ...selectedProgram,
          evidenceName: file.name,
          evidenceSize: sizeStr,
          evidenceDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        });
      }
    }
  };

  // Completion calculation for LPPK
  const completedCount = programs.filter(p => p.status === 'Selesai').length;
  const inProgressCount = programs.filter(p => p.status === 'Sedang').length;
  const totalCount = programs.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6" id="program-kerja-container">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs" id="program-kerja-header">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Manajemen Program Kerja Kurikulum</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Urus draf program kerja tahunan sekolah, pantau bukti fisik pelaksanaan, dan cetak Laporan Pelaksanaan Program Kerja (LPPK) otomatis.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <button 
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            id="btn-cetak-lppk"
          >
            <Printer className="h-4 w-4" />
            Cetak LPPK
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/15 transition-all cursor-pointer"
            id="btn-tambah-program"
          >
            <Plus className="h-4 w-4" />
            Tambah Program
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200/60" id="program-filters-bar">
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari program kerja atau penanggung jawab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-xs rounded-lg transition-all outline-none"
            id="input-search-program"
          />
        </div>
        <div className="md:col-span-8 flex flex-wrap items-center gap-3 md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button 
              onClick={() => setSemesterFilter('all')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${semesterFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semua Semester
            </button>
            <button 
              onClick={() => setSemesterFilter('1')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${semesterFilter === '1' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semester 1 (Ganjil)
            </button>
            <button 
              onClick={() => setSemesterFilter('2')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${semesterFilter === '2' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semester 2 (Genap)
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Semua Status
            </button>
            <button 
              onClick={() => setStatusFilter('Belum')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${statusFilter === 'Belum' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Belum
            </button>
            <button 
              onClick={() => setStatusFilter('Sedang')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${statusFilter === 'Sedang' ? 'bg-indigo-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Sedang
            </button>
            <button 
              onClick={() => setStatusFilter('Selesai')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${statusFilter === 'Selesai' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="program-main-grid">
        {/* Master Program List Table / Cards - Spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="program-list-card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <h3 className="font-bold text-sm text-slate-800">Master Daftar Program Kerja ({filteredPrograms.length})</h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Klik baris untuk interaksi / bukti fisik</span>
          </div>

          <div className="p-0 overflow-x-auto">
            {filteredPrograms.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Tidak ada program kerja ditemukan</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Sesuaikan filter atau tambahkan program kerja baru.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/20">
                    <th className="py-3 px-5">Detail Program</th>
                    <th className="py-3 px-3">PJ & Target</th>
                    <th className="py-3 px-3 text-center">Semester</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {filteredPrograms.map((p) => {
                    const isSelected = selectedProgram?.id === p.id;
                    return (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedProgram(p)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-700 leading-snug">{p.program}</p>
                          {p.evidenceName ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 font-medium px-2 py-0.5 rounded border border-emerald-100/50 mt-1">
                              <FileCheck className="h-3 w-3" />
                              Bukti: {p.evidenceName}
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] text-slate-400 mt-1">Belum ada bukti fisik diunggah</span>
                          )}
                        </td>
                        <td className="py-4 px-3">
                          <p className="font-medium text-slate-600">{p.tanggungJawab}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-indigo-400" />
                            {p.targetWaktu}
                          </p>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[10px] ${
                            p.semester === 1 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}>
                            Smtr {p.semester}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            p.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            p.status === 'Sedang' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {p.status === 'Selesai' && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                            {p.status === 'Sedang' && <Clock className="h-3 w-3 text-indigo-500 shrink-0" />}
                            {p.status === 'Belum' && <HelpCircle className="h-3 w-3 text-slate-400 shrink-0" />}
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <select 
                              value={p.status}
                              onChange={(e) => {
                                const newStat = e.target.value as ProgramKerja['status'];
                                onUpdateProgramStatus(p.id, newStat);
                                if (selectedProgram?.id === p.id) {
                                  setSelectedProgram({ ...selectedProgram, status: newStat });
                                }
                              }}
                              className="text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded cursor-pointer outline-none focus:border-indigo-500"
                            >
                              <option value="Belum">Belum</option>
                              <option value="Sedang">Sedang</option>
                              <option value="Selesai">Selesai</option>
                            </select>
                            
                            {onDeleteProgram && (
                              <button 
                                onClick={() => {
                                  if (confirm('Yakin ingin menghapus program kerja ini?')) {
                                    onDeleteProgram(p.id);
                                    if (selectedProgram?.id === p.id) setSelectedProgram(null);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Hapus Program"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tracker & Evidence Panel (Dynamic Detail Panel for Selected Program) - Spans 1 col */}
        <div className="lg:col-span-1" id="tracker-evidence-sidebar">
          {selectedProgram ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5 sticky top-6" id="evidence-upload-panel">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <FileText className="h-4.5 w-4.5 text-indigo-500" />
                  <span className="font-bold text-xs">Detail & Bukti Fisik</span>
                </div>
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Program Name */}
              <div className="space-y-1">
                <span className="inline-block text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Semester {selectedProgram.semester}
                </span>
                <h4 className="font-bold text-xs text-slate-800 leading-relaxed">{selectedProgram.program}</h4>
                <p className="text-[10px] text-slate-400">PJ: {selectedProgram.tanggungJawab} • Target: {selectedProgram.targetWaktu}</p>
              </div>

              {/* Status Indicator */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-3 gap-1 rounded-lg border border-slate-200 p-0.5 bg-white">
                    {(['Belum', 'Sedang', 'Selesai'] as ProgramKerja['status'][]).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          onUpdateProgramStatus(selectedProgram.id, st);
                          setSelectedProgram({ ...selectedProgram, status: st });
                        }}
                        className={`py-1 text-[10px] font-bold rounded text-center transition-colors ${
                          selectedProgram.status === st 
                            ? st === 'Selesai' ? 'bg-emerald-600 text-white' : st === 'Sedang' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evidence Drag-and-drop file uploader */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bukti Pelaksanaan (Evidence)</p>
                
                {selectedProgram.evidenceName ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-2">
                    <FileCheck className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">{selectedProgram.evidenceName}</p>
                      <p className="text-[10px] text-emerald-600/80 font-medium">Ukuran: {selectedProgram.evidenceSize} • Diunggah: {selectedProgram.evidenceDate}</p>
                    </div>
                    <button
                      onClick={() => {
                        // Reset file input
                        onUploadEvidence(selectedProgram.id, { name: '', size: '', date: '' });
                        setSelectedProgram({
                          ...selectedProgram,
                          evidenceName: undefined,
                          evidenceSize: undefined,
                          evidenceDate: undefined
                        });
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-bold bg-white hover:bg-rose-50 border border-rose-200 px-3 py-1 rounded transition-colors"
                    >
                      Hapus Bukti Fisik
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => handleDragOver(e, selectedProgram.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, selectedProgram.id)}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragOverId === selectedProgram.id 
                        ? 'border-indigo-500 bg-indigo-50/40 scale-98 shadow-inner' 
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/30'
                    }`}
                  >
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-slate-600">Drag & Drop Bukti Fisik</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 mb-3.5">Mendukung Gambar, Notulen, SK (Maks 10MB)</p>
                    
                    <input 
                      type="file" 
                      id={`sidebar-file-upload-${selectedProgram.id}`} 
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e, selectedProgram.id)}
                      className="hidden" 
                    />
                    <label 
                      htmlFor={`sidebar-file-upload-${selectedProgram.id}`}
                      className="inline-block text-[10px] text-indigo-600 hover:text-indigo-700 font-bold bg-white hover:bg-indigo-50 border border-indigo-200 shadow-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer select-none"
                    >
                      Pilih Dokumen File
                    </label>
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Evaluasi / Hambatan</p>
                <textarea
                  value={selectedProgram.notes || ''}
                  onChange={(e) => {
                    onUpdateProgramNotes(selectedProgram.id, e.target.value);
                    setSelectedProgram({ ...selectedProgram, notes: e.target.value });
                  }}
                  placeholder="Tambahkan catatan kelancaran program atau hambatan di sini..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-slate-50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg transition-all outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500 sticky top-6">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Pelacak Bukti Fisik</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pilih program kerja dari daftar sebelah kiri untuk mengunggah bukti fisik (foto, notulen, SK) serta melacak detail kelancarannya.</p>
            </div>
          )}
        </div>
      </div>

      {/* LPPK PRINT PREVIEW MODAL */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start p-4 md:p-8" id="lppk-print-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden animate-fade-in my-4 border border-slate-200">
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 non-printable">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-xs tracking-wider">PRINTOUT PREVIEW: LAPORAN PELAKSANAAN PROGRAM KERJA (LPPK)</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak Dokumen
                </button>
                <button 
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 md:p-12 bg-white overflow-y-auto print-container flex-1 max-h-[80vh] custom-scrollbar" id="lppk-document-sheet">
              {/* Kop Surat (Letterhead) */}
              <div className="text-center space-y-1 pb-4 border-b-3 border-double border-slate-900">
                <h2 className="font-bold text-base uppercase leading-tight tracking-wider text-slate-900">PEMERINTAH KOTA INDONESIA</h2>
                <h1 className="font-extrabold text-lg uppercase leading-tight tracking-wide text-slate-900">DINAS PENDIDIKAN NASIONAL</h1>
                <h3 className="font-bold text-md uppercase leading-tight tracking-wide text-indigo-950">SMP NEGERI INDONESIA</h3>
                <p className="text-[10px] text-slate-500 italic font-medium">Jalan Pendidikan No. 45, Kecamatan Kurikulum, Kota Belajar • Telp: (021) 123456</p>
              </div>

              {/* Document Title */}
              <div className="text-center mt-6 mb-5 space-y-0.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 underline">LAPORAN PELAKSANAAN PROGRAM KERJA (LPPK) BIDANG KURIKULUM</h4>
                <p className="text-[10px] text-slate-600 font-semibold uppercase">TAHUN PELAJARAN 2026/2027 • SEMESTER GANJIL</p>
              </div>

              {/* LPPK Meta Information */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-800 bg-slate-50 p-4 rounded-xl mb-6">
                <div className="space-y-1">
                  <p><span className="font-bold text-slate-500 inline-block w-28">Pelapor</span>: Suherman, S.Pd.Gr</p>
                  <p><span className="font-bold text-slate-500 inline-block w-28">Jabatan</span>: Wakasek Kurikulum</p>
                  <p><span className="font-bold text-slate-500 inline-block w-28">Tanggal Laporan</span>: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="font-bold text-slate-500 inline-block w-28">Penerima</span>: Kepala SMP Negeri 2 Puriala</p>
                  <p><span className="font-bold text-slate-500 inline-block w-28">Jumlah Program</span>: {totalCount} Kegiatan</p>
                  <p className="flex items-center gap-1">
                    <span className="font-bold text-slate-500 inline-block w-28">Tingkat Ketercapaian</span>: 
                    <span className="font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded text-[10px]">
                      {completionRate}% Terlaksana
                    </span>
                  </p>
                </div>
              </div>

              {/* Table of Programs */}
              <table className="w-full text-left border border-slate-300 border-collapse mt-4 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-800 uppercase">
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center w-10">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Kegiatan / Program Kerja</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Target Waktu</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Penanggung Jawab</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Status</th>
                    <th className="py-2.5 px-3">Keterangan / Bukti Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-700">
                  {programs.map((p, index) => (
                    <tr key={p.id} className="border-b border-slate-300 hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center">{index + 1}</td>
                      <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-900 leading-snug">{p.program}</td>
                      <td className="py-2.5 px-3 border-r border-slate-300 font-medium">{p.targetWaktu}</td>
                      <td className="py-2.5 px-3 border-r border-slate-300 font-medium">{p.tanggungJawab}</td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center">
                        <span className="font-bold uppercase text-[9px]">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="leading-relaxed">{p.notes || '-'}</p>
                        {p.evidenceName && (
                          <p className="text-[9px] text-emerald-600 font-bold mt-1">Bukti: {p.evidenceName} ({p.evidenceSize})</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Rekapitulasi Summary */}
              <div className="mt-6 p-4 border border-slate-300 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase">Ringkasan Keterlaksanaan:</p>
                <div className="grid grid-cols-3 gap-4">
                  <p><span className="font-semibold text-emerald-600">Selesai (100%):</span> {completedCount} kegiatan</p>
                  <p><span className="font-semibold text-indigo-600">Dalam Pelaksanaan:</span> {inProgressCount} kegiatan</p>
                  <p><span className="font-semibold text-rose-600">Belum Berjalan:</span> {totalCount - completedCount - inProgressCount} kegiatan</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-12 grid grid-cols-2 gap-12 text-xs text-center text-slate-900 font-medium">
                <div className="space-y-16">
                  <p>Mengetahui,<br /><span className="font-bold">Kepala SMP Negeri 2 Puriala</span></p>
                  <div>
                    <p className="font-bold underline">H. Supardi, M.Pd.</p>
                    <p className="text-[10px] text-slate-500">NIP. 19680321 199203 1 002</p>
                  </div>
                </div>
                <div className="space-y-16">
                  <p>Pelapor,<br /><span className="font-bold">Wakasek Bidang Kurikulum</span></p>
                  <div>
                    <p className="font-bold underline">Suherman, S.Pd.Gr</p>
                    <p className="text-[10px] text-slate-500">NIP. 19821105 200801 1 003</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROGRAM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="add-program-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">Tambah Program Kerja Baru</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Program Kerja / Kegiatan</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Pelaksanaan Asesmen Akhir Semester"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester</label>
                  <select 
                    value={newProgramSemester}
                    onChange={(e) => setNewProgramSemester(e.target.value as '1' | '2')}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="1">Semester 1 (Ganjil)</option>
                    <option value="2">Semester 2 (Genap)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Waktu Pelaksanaan</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: September 2026"
                    value={newProgramTarget}
                    onChange={(e) => setNewProgramTarget(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penanggung Jawab (PJ)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Drs. Ahmad Junaedi / MGMP IPA"
                  value={newProgramPJ}
                  onChange={(e) => setNewProgramPJ(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Pendukung (Opsional)</label>
                <textarea 
                  placeholder="Kebutuhan sarpras atau deskripsi ringkas..."
                  rows={2}
                  value={newProgramNotes}
                  onChange={(e) => setNewProgramNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none resize-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
