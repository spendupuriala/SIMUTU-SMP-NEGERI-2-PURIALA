import React, { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, Loader2, ArrowRight, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { listGoogleDriveSpreadsheets } from '../lib/googleDriveApi';

interface GoogleDrivePickerProps {
  token: string;
  onSelect: (spreadsheetId: string, spreadsheetName: string) => void;
  onClose: () => void;
}

export default function GoogleDrivePicker({ token, onSelect, onClose }: GoogleDrivePickerProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGoogleDriveSpreadsheets(token);
      setFiles(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat berkas dari Google Drive. Pastikan Anda telah memberikan izin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadFiles();
    }
  }, [token]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-fade-in" id="google-drive-picker-modal">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Pilih Spreadsheet dari Google Drive</h2>
              <p className="text-[11px] text-slate-500">Pilih berkas untuk dihubungkan dengan SIMUTU</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari spreadsheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg outline-none text-xs transition-all"
            />
          </div>
          <button 
            onClick={loadFiles}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
            title="Muat ulang"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content Section */}
        <div className="max-h-80 overflow-y-auto p-2 min-h-60 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-2 py-10">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Menghubungi Google Drive...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-2 text-center p-6 py-10">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-xs text-slate-800 font-bold">Gagal Memuat Berkas</p>
              <p className="text-[11px] text-slate-500 max-w-xs">{error}</p>
              <button 
                onClick={loadFiles}
                className="mt-2 px-3 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-500 transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-1.5 text-center p-6 py-10 text-slate-400">
              <FileSpreadsheet className="h-10 w-10 text-slate-300 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">Tidak Ada Spreadsheet Ditemukan</p>
              <p className="text-[11px] max-w-xs">Pastikan Anda memiliki Spreadsheet berformat Google Sheets di Google Drive Anda.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors shrink-0">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Diubah: {new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(file.id, file.name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[10px] font-bold transition-all shrink-0"
                  >
                    Hubungkan
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
