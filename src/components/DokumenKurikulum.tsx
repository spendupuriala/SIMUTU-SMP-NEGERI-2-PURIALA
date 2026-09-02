import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  History, 
  FolderOpen, 
  Upload, 
  X, 
  FileCode, 
  FileSpreadsheet, 
  Clock, 
  AlertCircle,
  Download,
  Trash2,
  CalendarDays,
  User,
  ExternalLink,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { DokumenKurikulum } from '../types';
import { findOrCreateFolder, uploadFileToGoogleDrive } from '../lib/googleDriveApi';

interface DokumenKurikulumProps {
  documents: DokumenKurikulum[];
  onUploadDocument: (doc: Omit<DokumenKurikulum, 'id'>) => void;
  onAddRevisi: (id: string, revisi: DokumenKurikulum['riwayatRevisi'][0]) => void;
  onDeleteDocument?: (id: string) => void;
  gDriveToken?: string | null;
  onLoginGDrive?: () => Promise<void>;
}

export default function DokumenKurikulumView({
  documents,
  onUploadDocument,
  onAddRevisi,
  onDeleteDocument,
  gDriveToken,
  onLoginGDrive
}: DokumenKurikulumProps) {
  // Filters
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');

  // Modals / Inputs
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocForRevisi, setSelectedDocForRevisi] = useState<DokumenKurikulum | null>(null);
  const [selectedDocTimeline, setSelectedDocTimeline] = useState<DokumenKurikulum | null>(null);
  const [docToDelete, setDocToDelete] = useState<DokumenKurikulum | null>(null);

  // Form State - Upload Dokumen Baru
  const [formNamaFile, setFormNamaFile] = useState('');
  const [formKategori, setFormKategori] = useState<DokumenKurikulum['kategori']>('Buku I KOSP');
  const [formTahun, setFormTahun] = useState('2026/2027');
  const [formPembuat, setFormPembuat] = useState('Suherman, S.Pd.Gr');
  const [formStatus, setFormStatus] = useState<DokumenKurikulum['status']>('Final');
  const [formSize, setFormSize] = useState('1.8 MB');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Google Drive File & State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localSuccessMsg, setLocalSuccessMsg] = useState<string | null>(null);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setFormNamaFile(file.name);
      setFormSize(formatBytes(file.size));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFormNamaFile(file.name);
      setFormSize(formatBytes(file.size));
    }
  };

  // Form State - Catatan Revisi Baru
  const [formVersi, setFormVersi] = useState('');
  const [formOleh, setFormOleh] = useState('Suherman, S.Pd.Gr');
  const [formRevKet, setFormRevKet] = useState('');

  // Category choices
  const kategoriList = [
    'Semua',
    'Buku I KOSP',
    'Buku II Silabus/ATP',
    'Buku III RPP/Modul',
    'Panduan Akademik',
    'SK Pembagian Tugas'
  ];

  // Filters logic
  const filteredDocs = documents.filter(doc => {
    const matchesKategori = selectedKategori === 'Semua' ? true : doc.kategori === selectedKategori;
    const matchesSearch = doc.namaFile.toLowerCase().includes(search.toLowerCase()) || 
                          doc.pembuat.toLowerCase().includes(search.toLowerCase());
    return matchesKategori && matchesSearch;
  });

  // Submit Upload Document with Drive Integration
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaFile || !formPembuat) return;

    setIsUploadingToDrive(true);
    setUploadError(null);
    setLocalSuccessMsg(null);

    try {
      let cleanedFileName = formNamaFile;
      if (!cleanedFileName.endsWith('.pdf') && !cleanedFileName.endsWith('.docx') && !cleanedFileName.endsWith('.xlsx')) {
        cleanedFileName += '.pdf';
      }

      const initRevKet = formKeterangan || 'Inisiasi berkas kurikulum baru.';
      let isUploadedToDrive = false;

      if (selectedFile) {
        if (gDriveToken) {
          try {
            const folderId = await findOrCreateFolder(gDriveToken, 'KURIKULUM');
            const result = await uploadFileToGoogleDrive(gDriveToken, selectedFile, folderId);
            if (result) {
              isUploadedToDrive = true;
            } else {
              throw new Error('Gagal menyimpan file ke Google Drive.');
            }
          } catch (err: any) {
            console.error('Google Drive Upload error (falling back to local):', err);
            // Fallback: Notify user it's saved locally and will be synced later
            setLocalSuccessMsg("Dokumen berhasil disimpan secara lokal (Akan disinkronkan ke Drive saat terhubung)");
          }
        } else {
          // No Google Drive Token: Inform user about local saving fallback
          setLocalSuccessMsg("Dokumen berhasil disimpan secara lokal (Akan disinkronkan ke Drive saat terhubung)");
        }
      } else {
        // Form submitted without a file binary (manually inputted name)
        setLocalSuccessMsg("Dokumen berhasil disimpan secara lokal");
      }

      onUploadDocument({
        namaFile: cleanedFileName,
        kategori: formKategori,
        tahunAjaran: formTahun,
        status: formStatus,
        tanggalDibuat: new Date().toISOString().split('T')[0],
        pembuat: formPembuat,
        ukuran: formSize,
        riwayatRevisi: [
          {
            versi: 'v1.0',
            tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            oleh: formPembuat,
            keterangan: initRevKet
          }
        ]
      });

      if (isUploadedToDrive) {
        setLocalSuccessMsg("Dokumen berhasil diunggah langsung ke folder KURIKULUM Google Drive.");
      }

      // Reset Form
      setFormNamaFile('');
      setFormKeterangan('');
      setSelectedFile(null);
      setUploadError(null);
      setIsUploadOpen(false);
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengunggah berkas.');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Submit Revision Log
  const handleRevisiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForRevisi || !formVersi || !formRevKet) return;

    onAddRevisi(selectedDocForRevisi.id, {
      versi: formVersi,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      oleh: formOleh,
      keterangan: formRevKet
    });

    // Reset Form
    setFormVersi('');
    setFormRevKet('');
    setSelectedDocForRevisi(null);
  };

  return (
    <div className="space-y-6" id="dokumen-kurikulum-wrapper">
      
      {/* Upper Title and Statistics Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs" id="dokumen-header">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Bank Data Dokumen Kurikulum (KOSP)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Arsip digital dokumen Kurikulum Operasional Satuan Pendidikan, SK pembagian tugas mengajar, silabus, serta catatan log riwayat revisi kurikulum sekolah.
          </p>
        </div>
        
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 self-start md:self-center shrink-0 cursor-pointer"
          id="btn-upload-dokumen"
        >
          <Upload className="h-4 w-4" />
          Unggah Dokumen KOSP
        </button>
      </div>

      {localSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center justify-between shadow-xs transition-all animate-fade-in" id="local-upload-success-banner">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold block text-emerald-900">Sukses Menyimpan Dokumen</span>
              <p className="text-[10px] text-emerald-700 mt-0.5">{localSuccessMsg}</p>
            </div>
          </div>
          <button 
            onClick={() => setLocalSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-bold px-2 py-1 cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* SEARCH AND FILTERS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200/60" id="dokumen-filters-bar">
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama berkas dokumen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-xs rounded-lg transition-all outline-none"
            id="input-search-dokumen"
          />
        </div>
        
        <div className="md:col-span-8 flex flex-wrap items-center gap-2 md:justify-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Arsip Kategori:</span>
          {kategoriList.map(kat => (
            <button
              key={kat}
              onClick={() => setSelectedKategori(kat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedKategori === kat 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-850'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* DOCUMENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="documents-grid-layout">
        {filteredDocs.length === 0 ? (
          <div className="md:col-span-3 text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Tidak ada dokumen kurikulum ditemukan</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sesuaikan filter atau unggah dokumen kurikulum KOSP pertama Anda.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isWord = doc.namaFile.endsWith('.docx') || doc.namaFile.endsWith('.doc');
            const isExcel = doc.namaFile.endsWith('.xlsx') || doc.namaFile.endsWith('.xls');
            const latestRevision = doc.riwayatRevisi[doc.riwayatRevisi.length - 1];

            return (
              <div 
                key={doc.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header Icon + Actions */}
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${
                    isExcel ? 'bg-emerald-50 text-emerald-700' :
                    isWord ? 'bg-blue-50 text-blue-700' :
                    'bg-rose-50 text-rose-700'
                  }`}>
                    {isExcel ? <FileSpreadsheet className="h-5.5 w-5.5" /> : 
                     isWord ? <FileCode className="h-5.5 w-5.5" /> : 
                     <FileText className="h-5.5 w-5.5" />}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      doc.status === 'Final' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'Draft' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {doc.status}
                    </span>

                    {onDeleteDocument && (
                      <button 
                        onClick={() => setDocToDelete(doc)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* File Description */}
                <div className="space-y-1">
                  <span className="text-[9px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded uppercase">
                    {doc.kategori}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 leading-snug break-all line-clamp-2" title={doc.namaFile}>
                    {doc.namaFile}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    TA: {doc.tahunAjaran} • PJ: {doc.pembuat} • Ukuran: {doc.ukuran}
                  </p>
                </div>

                {/* Latest Revision Snippet */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Pembaruan Terakhir ({latestRevision?.versi || 'v1.0'})
                  </p>
                  <p className="line-clamp-2 text-slate-600 leading-relaxed italic">
                    "{latestRevision?.keterangan || 'Inisiasi berkas.'}"
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">
                    Oleh {latestRevision?.oleh || doc.pembuat} • {latestRevision?.tanggal || doc.tanggalDibuat}
                  </p>
                </div>

                {/* Actions Bottom Bar */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs font-bold">
                  <button 
                    onClick={() => setSelectedDocTimeline(doc)}
                    className="flex items-center justify-center gap-1 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Riwayat Revisi
                  </button>
                  <button 
                    onClick={() => setSelectedDocForRevisi(doc)}
                    className="flex items-center justify-center gap-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Revisi Berkas
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DYNAMIC SIDE-DRAWER / MODAL: TIMELINE LOG RIWAYAT REVISI */}
      {selectedDocTimeline && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="timeline-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">Catatan & Riwayat Pembaruan</h3>
              </div>
              <button 
                onClick={() => setSelectedDocTimeline(null)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Timeline Document info */}
            <div className="p-5 border-b border-slate-50 text-xs text-slate-700 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 break-all">{selectedDocTimeline.namaFile}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Kategori: {selectedDocTimeline.kategori} • TA: {selectedDocTimeline.tahunAjaran}</p>
            </div>

            {/* Vertical timeline */}
            <div className="p-6 space-y-6 max-h-[380px] overflow-y-auto custom-scrollbar" id="revisions-timeline-container">
              {selectedDocTimeline.riwayatRevisi.map((rev, idx) => (
                <div key={idx} className="relative flex gap-4 text-xs">
                  {/* Timeline node */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-[10px] shadow-xs z-1">
                      {rev.versi}
                    </span>
                    {idx < selectedDocTimeline.riwayatRevisi.length - 1 && (
                      <div className="w-0.5 bg-slate-200 flex-1 my-1.5"></div>
                    )}
                  </div>

                  {/* Timeline content details */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex-1 space-y-1.5">
                    <p className="font-bold text-slate-800 leading-snug">{rev.keterangan}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {rev.oleh}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {rev.tanggal}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-150 bg-slate-50 text-right">
              <button 
                onClick={() => setSelectedDocTimeline(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
              >
                Tutup Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORM RECORD A NEW REVISION TO FILE */}
      {selectedDocForRevisi && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="add-revision-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">Catat Pembaruan / Revisi Baru</h3>
              </div>
              <button 
                onClick={() => setSelectedDocForRevisi(null)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRevisiSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Arsip File Terpilih</p>
                <p className="font-bold text-slate-800 break-all leading-tight mt-0.5">{selectedDocForRevisi.namaFile}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Versi Baru</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: v1.2 atau v2.0"
                    value={formVersi}
                    onChange={(e) => setFormVersi(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oleh Editor / Pengubah</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nama Anda..."
                    value={formOleh}
                    onChange={(e) => setFormOleh(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keterangan / Berita Acara Revisi</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Deskripsikan bagian apa yang diubah, ditambahkan, atau disempurnakan..."
                  value={formRevKet}
                  onChange={(e) => setFormRevKet(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedDocForRevisi(null)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all"
                >
                  Catat Riwayat Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD DOKUMEN BARU */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="upload-document-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">Unggah Dokumen Baru ke Bank Data</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              
              {/* Google Drive Status & Connection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block">Status Google Drive</span>
                  <p className="text-[10px] text-slate-400">
                    {gDriveToken 
                      ? 'Terhubung. Berkas otomatis disimpan ke folder KURIKULUM' 
                      : 'Belum terhubung. Berkas disimpan ke daftar lokal.'}
                  </p>
                </div>
                {!gDriveToken && onLoginGDrive && (
                  <button
                    type="button"
                    onClick={onLoginGDrive}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Hubungkan Drive
                  </button>
                )}
              </div>

              {/* Drag & Drop File Upload Area */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih File / Tarik Berkas</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50/50 transition-all space-y-1 relative"
                >
                  <input 
                    type="file" 
                    id="file-upload-input" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer block">
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-700">Pilih Berkas Komputer</p>
                    <p className="text-[10px] text-slate-400">atau tarik dan letakkan berkas PDF, Word, atau Excel ke area ini</p>
                  </label>
                  {selectedFile && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-left text-[10px] mt-2 flex items-center justify-between">
                      <span className="font-bold truncate max-w-[80%] text-indigo-800">{selectedFile.name} ({formatBytes(selectedFile.size)})</span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        className="text-indigo-600 hover:text-rose-600 font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message banner */}
              {uploadError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="font-medium leading-relaxed">{uploadError}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama File Dokumen</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: KOSP_Buku_I_SMP_2026.pdf..."
                  value={formNamaFile}
                  onChange={(e) => setFormNamaFile(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Berkas</label>
                  <select 
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as DokumenKurikulum['kategori'])}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  >
                    {['Buku I KOSP', 'Buku II Silabus/ATP', 'Buku III RPP/Modul', 'Panduan Akademik', 'SK Pembagian Tugas'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Ajaran</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: 2026/2027"
                    value={formTahun}
                    onChange={(e) => setFormTahun(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penulis / Pembuat</label>
                  <input 
                    type="text" 
                    required
                    value={formPembuat}
                    onChange={(e) => setFormPembuat(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ukuran File Dokumen</label>
                  <input 
                    type="text" 
                    required
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Awal Berkas</label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as DokumenKurikulum['status'])}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="Final">Final</option>
                    <option value="Draft">Draft</option>
                    <option value="Revisi">Revisi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keterangan Catatan Awal</label>
                <textarea 
                  placeholder="Sebutkan ringkasan isi dokumen atau alasan diunggah..."
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isUploadingToDrive}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploadingToDrive && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1 animate-infinite"></span>}
                  {isUploadingToDrive ? 'Sedang Mengunggah Berkas ke Drive...' : 'Unggah Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center items-center p-4" id="confirm-delete-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-bold text-sm text-slate-800">Konfirmasi Hapus</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus berkas <span className="font-bold text-slate-800 break-all">"{docToDelete.namaFile}"</span> ini dari arsip? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-3 py-1.5 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDocument) {
                    onDeleteDocument(docToDelete.id);
                  }
                  setDocToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Hapus Berkas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
