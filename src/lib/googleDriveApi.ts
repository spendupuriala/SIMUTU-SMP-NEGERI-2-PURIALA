import { SiswaNilai, JurnalMengajarHarian, AbsenPiket } from '../types';

/**
 * Finds a spreadsheet by name on Google Drive.
 */
export async function findSpreadsheetByName(accessToken: string, name: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${name}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }
  } catch (e) {
    console.error("Error finding spreadsheet by name:", e);
  }
  return null;
}

/**
 * Lists spreadsheets from user's Google Drive.
 */
export async function listGoogleDriveSpreadsheets(accessToken: string): Promise<any[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime%20desc&fields=files(id%2Cname%2CmodifiedTime%2CwebViewLink)&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(`Gagal memuat daftar Google Drive (401) - Sesi login Google Drive Anda telah berakhir. Silakan hubungkan kembali akun Anda.`);
    }
    throw new Error(`Gagal memuat daftar Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetches Sheet values from Google Sheets API using the access token.
 */
export async function fetchGoogleSheetValuesWithToken(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const rangeEncoded = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeEncoded}?valueRenderOption=FORMATTED_VALUE`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(`Izin ditolak (403): Akun Anda tidak memiliki akses ke Spreadsheet ini.`);
    }
    if (response.status === 404) {
      throw new Error(`Spreadsheet tidak ditemukan (404): Periksa kembali ID Spreadsheet Anda.`);
    }
    throw new Error(`Gagal membaca data dari Google Sheets (${response.status})`);
  }

  const data = await response.json();
  return data.values || [];
}

/**
 * Normalizes subject names from Google Sheet to match the official 12 subjects.
 */
export function normalizeMapel(val: string): string {
  const s = String(val || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return 'Matematika';

  if (s.includes('pancasila') || s.includes('kewarganegaraan') || s === 'ppkn' || s === 'pkn') {
    return 'Pendidikan Pancasila';
  }
  if (s.includes('matematika') || s === 'mtk') {
    return 'Matematika';
  }
  if (s.includes('pjok') || s.includes('penjas') || s.includes('olahraga') || s.includes('jasmani')) {
    return 'PJOK';
  }
  if (s === 'ips' || s.includes('sosial') || s.includes('sejarah') || s.includes('ilmapengetahuanosial') || s.includes('sosiologi')) {
    return 'IPS';
  }
  if (s.includes('prakarya') || s.includes('kerajinan')) {
    return 'Prakarya';
  }
  if (s === 'ipa' || s.includes('alam') || s.includes('sains') || s.includes('ilmapengetahuanalam') || s.includes('biologi') || s.includes('fisika')) {
    return 'IPA';
  }
  if (s.includes('agama') || s.includes('islam') || s === 'pai' || s.includes('pendidikanagamaislam')) {
    return 'Pendidikan Agama Islam';
  }
  if (s.includes('koding') || s.includes('coding') || s.includes('pemrograman')) {
    return 'Koding';
  }
  if (s.includes('informatika') || s.includes('komputer') || s === 'tik') {
    return 'Informatika';
  }
  if (s.includes('inggris') || s === 'ing' || s === 'english') {
    return 'Bahasa Inggris';
  }
  if (s.includes('indonesia') || s === 'ind' || s.includes('bahasaindonesia')) {
    return 'Bahasa Indonesia';
  }
  if (s.includes('mulok') || s.includes('lokal') || s.includes('muatanlokal')) {
    return 'Mulok';
  }

  // Exact match search in the official 12 subjects
  const officialMapels = [
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
  const found = officialMapels.find(m => m.toLowerCase().replace(/\s+/g, '') === s);
  if (found) return found;

  // Otherwise, do capitalized words
  return String(val).trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Parses Google Sheet rows (Nilai) into the application's structure.
 */
export function parseSheetValuesToNilai(rows: any[][]): SiswaNilai[] {
  if (!rows || rows.length < 2) return [];
  const tempGroup: { [key: string]: SiswaNilai } = {};

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells || cells.length < 4) continue;

    const rawNamaSiswa = String(cells[1] || '').trim();
    const mapelValue = normalizeMapel(String(cells[2] || 'Matematika').trim());
    const rawJpType = String(cells[3] || '').trim();
    const jpTypeLower = rawJpType.toLowerCase();
    const nilaiValue = parseFloat(cells[4]) || 0;
    const kelasValue = String(cells[7] || cells[5] || 'VII.A').trim();

    if (!rawNamaSiswa || rawNamaSiswa.toLowerCase() === 'nama_siswa' || rawNamaSiswa.toLowerCase() === 'nama' || rawNamaSiswa.toLowerCase() === 'ref_id_siswa') continue;

    const groupKey = `${rawNamaSiswa}||${mapelValue}`.toLowerCase();

    if (!tempGroup[groupKey]) {
      // Format Data Awal (Reset State): Ensure all columns are explicitly initialized to 0
      tempGroup[groupKey] = {
        id: `sn-gsheet-${rawNamaSiswa.replace(/\s+/g, '')}-${mapelValue.replace(/\s+/g, '')}`,
        nisn: '0000000000',
        nama: rawNamaSiswa,
        kelas: kelasValue,
        mapel: mapelValue,
        tugas: 0,
        uh: 0,
        uts: 0,
        uas: 0,
        akhir: 0,
        tugas1: 0,
        tugas2: 0,
        tugas3: 0,
        tugas4: 0,
        tugas5: 0,
        tugas6: 0,
        tugas7: 0,
        tugas8: 0,
        tugas9: 0,
        tugas10: 0,
        uh1: 0,
        uh2: 0,
        uh3: 0,
        uh4: 0,
        uh5: 0
      };
    }

    const groupObj = tempGroup[groupKey];

    // Logika Pemetaan ke Kolom Leger Aplikasi dengan Pencocokan Teks Presisi (Exact Text Matching)
    // Tanpa penimpaan mendatar (No Duplicate/Fallback Spread)
    if (rawJpType === 'Tugas 1' || jpTypeLower === 't1' || jpTypeLower === 'tugas 1' || jpTypeLower === 'tugas1') {
      groupObj.tugas1 = nilaiValue;
    } else if (rawJpType === 'Tugas 2' || jpTypeLower === 't2' || jpTypeLower === 'tugas 2' || jpTypeLower === 'tugas2') {
      groupObj.tugas2 = nilaiValue;
    } else if (rawJpType === 'Tugas 3' || jpTypeLower === 't3' || jpTypeLower === 'tugas 3' || jpTypeLower === 'tugas3') {
      groupObj.tugas3 = nilaiValue;
    } else if (rawJpType === 'Tugas 4' || jpTypeLower === 't4' || jpTypeLower === 'tugas 4' || jpTypeLower === 'tugas4') {
      groupObj.tugas4 = nilaiValue;
    } else if (rawJpType === 'Tugas 5' || jpTypeLower === 't5' || jpTypeLower === 'tugas 5' || jpTypeLower === 'tugas5') {
      groupObj.tugas5 = nilaiValue;
    } else if (rawJpType === 'Tugas 6' || jpTypeLower === 't6' || jpTypeLower === 'tugas 6' || jpTypeLower === 'tugas6') {
      groupObj.tugas6 = nilaiValue;
    } else if (rawJpType === 'Tugas 7' || jpTypeLower === 't7' || jpTypeLower === 'tugas 7' || jpTypeLower === 'tugas7') {
      groupObj.tugas7 = nilaiValue;
    } else if (rawJpType === 'Tugas 8' || jpTypeLower === 't8' || jpTypeLower === 'tugas 8' || jpTypeLower === 'tugas8') {
      groupObj.tugas8 = nilaiValue;
    } else if (rawJpType === 'Tugas 9' || jpTypeLower === 't9' || jpTypeLower === 'tugas 9' || jpTypeLower === 'tugas9') {
      groupObj.tugas9 = nilaiValue;
    } else if (rawJpType === 'Tugas 10' || jpTypeLower === 't10' || jpTypeLower === 'tugas 10' || jpTypeLower === 'tugas10') {
      groupObj.tugas10 = nilaiValue;
    } else if (rawJpType === 'UH1' || jpTypeLower === 'uh1' || jpTypeLower === 'uh 1') {
      groupObj.uh1 = nilaiValue;
    } else if (rawJpType === 'UH2' || jpTypeLower === 'uh2' || jpTypeLower === 'uh 2') {
      groupObj.uh2 = nilaiValue;
    } else if (rawJpType === 'UH3' || jpTypeLower === 'uh3' || jpTypeLower === 'uh 3') {
      groupObj.uh3 = nilaiValue;
    } else if (rawJpType === 'UH4' || jpTypeLower === 'uh4' || jpTypeLower === 'uh 4') {
      groupObj.uh4 = nilaiValue;
    } else if (rawJpType === 'UH5' || jpTypeLower === 'uh5' || jpTypeLower === 'uh 5') {
      groupObj.uh5 = nilaiValue;
    } else if (rawJpType === 'UTS' || jpTypeLower === 'uts') {
      groupObj.uts = nilaiValue;
    } else if (rawJpType === 'UAS' || jpTypeLower === 'uas') {
      groupObj.uas = nilaiValue;
    }
  }

  return Object.values(tempGroup).map(record => {
    const t1 = record.tugas1 ?? 0;
    const t2 = record.tugas2 ?? 0;
    const t3 = record.tugas3 ?? 0;
    const t4 = record.tugas4 ?? 0;
    const t5 = record.tugas5 ?? 0;
    const t6 = record.tugas6 ?? 0;
    const t7 = record.tugas7 ?? 0;
    const t8 = record.tugas8 ?? 0;
    const t9 = record.tugas9 ?? 0;
    const t10 = record.tugas10 ?? 0;

    const uh1 = record.uh1 ?? 0;
    const uh2 = record.uh2 ?? 0;
    const uh3 = record.uh3 ?? 0;
    const uh4 = record.uh4 ?? 0;
    const uh5 = record.uh5 ?? 0;

    record.tugas = parseFloat(((t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8 + t9 + t10) / 10).toFixed(1));
    record.uh = parseFloat(((uh1 + uh2 + uh3 + uh4 + uh5) / 5).toFixed(1));
    record.akhir = parseFloat(((record.tugas + record.uh + record.uts + record.uas) / 4).toFixed(1));
    return record;
  });
}

/**
 * Finds the folder JURNAL MENGAJAR_Images with ID '10WNk0RjqId5DKvMq535j1y3Zew7roqyR' and lists all its files to map filenames to their properties.
 */
export async function fetchDriveImagesMap(accessToken: string): Promise<Record<string, { id: string; webViewLink?: string; webContentLink?: string; thumbnailLink?: string }>> {
  const map: Record<string, { id: string; webViewLink?: string; webContentLink?: string; thumbnailLink?: string }> = {};
  const folderId = '10WNk0RjqId5DKvMq535j1y3Zew7roqyR';
  try {
    const filesQuery = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${filesQuery}&fields=files(id,name,webViewLink,webContentLink,thumbnailLink)&pageSize=1000`;
    const filesRes = await fetch(filesUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (filesRes.ok) {
      const filesData = await filesRes.json();
      if (filesData.files) {
        for (const file of filesData.files) {
          if (file.name && file.id) {
            const cleanName = file.name.trim().toLowerCase();
            map[cleanName] = { 
              id: file.id, 
              webViewLink: file.webViewLink,
              webContentLink: file.webContentLink,
              thumbnailLink: file.thumbnailLink
            };
          }
        }
      }
    }
  } catch (err) {
    console.error("Error fetching drive images map:", err);
  }
  return map;
}

/**
 * Parses Google Sheet rows (Jurnal) into the application's structure.
 */
export function parseSheetValuesToJurnal(
  rows: any[][],
  imagesMap?: Record<string, { id: string; webViewLink?: string; webContentLink?: string; thumbnailLink?: string }>
): JurnalMengajarHarian[] {
  if (!rows || rows.length <= 1) return [];
  const records: JurnalMengajarHarian[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length < 6) continue;

    const hari = String(cols[1] || '').trim();
    const tanggal = String(cols[2] || '').trim();
    const waktuInput = String(cols[3] || '').trim();
    const mapel = String(cols[4] || '').trim();
    const namaGuru = String(cols[5] || '').trim();
    const kelas = String(cols[6] || '').trim();
    
    const jamMulai = String(cols[7] || '').trim();
    const jamSelesai = String(cols[8] || '').trim();
    const durasi = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : (jamMulai || jamSelesai || '-');

    const topik = String(cols[9] || '').trim();
    const kegiatan = String(cols[10] || '').trim();
    
    const rawFoto = String(cols[11] || '').trim();
    let foto = rawFoto;
    let fotoDriveId = '';
    let fotoWebViewLink = '';

    if (rawFoto) {
      let cleanFilename = rawFoto;
      if (rawFoto.includes('/')) {
        cleanFilename = rawFoto.split('/').pop() || rawFoto;
      }
      cleanFilename = cleanFilename.trim();

      let foundFile: { id: string; webViewLink?: string; webContentLink?: string; thumbnailLink?: string } | null = null;
      if (imagesMap) {
        const cleanLower = cleanFilename.toLowerCase();
        if (imagesMap[cleanLower]) {
          foundFile = imagesMap[cleanLower];
        } else {
          // Look up where file name in Google Drive contains the extracted sheet name
          const entry = Object.entries(imagesMap).find(([name]) => name.includes(cleanLower) || cleanLower.includes(name));
          if (entry) {
            foundFile = entry[1];
          }
        }
      }

      if (foundFile) {
        fotoDriveId = foundFile.id;
        fotoWebViewLink = foundFile.webViewLink || '';
        foto = foundFile.webContentLink || foundFile.thumbnailLink || `https://lh3.googleusercontent.com/d/${foundFile.id}`;
      } else {
        // Fallback: match by URL
        const idMatch = rawFoto.match(/id=([^&]+)/) || rawFoto.match(/\/d\/([^/]+)/);
        if (idMatch && idMatch[1]) {
          fotoDriveId = idMatch[1];
          foto = `https://lh3.googleusercontent.com/d/${fotoDriveId}`;
        }
      }
    }

    const keterangan = String(cols[12] || 'TEPAT WAKTU').trim();

    if (namaGuru.toLowerCase().includes('guru') && mapel.toLowerCase().includes('mapel')) continue;
    if (hari.toLowerCase().includes('hari') && tanggal.toLowerCase().includes('tanggal')) continue;

    records.push({
      id: `gdrive-jurnal-${i}-${Date.now()}`,
      hari,
      tanggal,
      waktuInput,
      mapel,
      namaGuru,
      kelas,
      durasi,
      topik,
      kegiatan,
      foto,
      keterangan,
      fotoDriveId,
      fotoWebViewLink
    });
  }

  return records;
}

/**
 * Finds or creates a folder named folderName on Google Drive.
 */
export async function findOrCreateFolder(accessToken: string, folderName: string): Promise<string> {
  const query = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`;
  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }
  } catch (err) {
    console.error("Error searching folder:", err);
  }

  // Not found, create it
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (createRes.ok) {
    const data = await createRes.json();
    return data.id;
  }
  throw new Error(`Failed to find or create folder: ${folderName}`);
}

/**
 * Uploads a file to Google Drive under a specific parent folder.
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  file: File,
  folderId: string
): Promise<{ id: string; webViewLink?: string } | null> {
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const reader = new FileReader();
  const fileContentPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const arrayBuffer = await fileContentPromise;
  
  const metadataPart = 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata);
  const mediaPartHeader = `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  const blob = new Blob([
    delimiter,
    metadataPart,
    delimiter,
    mediaPartHeader,
    new Uint8Array(arrayBuffer),
    close_delim
  ], { type: `multipart/related; boundary=${boundary}` });

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: blob,
    }
  );

  if (response.ok) {
    return await response.json();
  } else {
    const errorText = await response.text();
    console.error('Google Drive Upload failed:', errorText);
    throw new Error('Google Drive upload failed: ' + errorText);
  }
}

export function parsePiketSheetValues(datangRows: any[][], pulangRows: any[][]): AbsenPiket[] {
  const map: Record<string, { tanggal: string; namaGuru: string; jamDatang: string; jamPulang: string }> = {};

  // Find column indices dynamically
  const getColIndices = (headers: any[], mode: 'datang' | 'pulang') => {
    let namaIdx = -1;
    let tanggalIdx = -1;
    let waktuIdx = -1;

    if (headers) {
      for (let i = 0; i < headers.length; i++) {
        const val = String(headers[i] || '').toLowerCase().trim();
        if (val.includes('nama') || val.includes('guru') || val.includes('nip')) {
          if (namaIdx === -1 || val.includes('nama')) namaIdx = i;
        }
        if (val.includes('tanggal') || val.includes('tgl') || val.includes('date')) {
          tanggalIdx = i;
        }
        
        // Exact column matching matching requested columns first
        if (mode === 'datang' && val.includes('datang') && !val.includes('jadwal')) {
          waktuIdx = i;
        } else if (mode === 'pulang' && val.includes('pulang') && !val.includes('jadwal')) {
          waktuIdx = i;
        }
      }

      // Safe fallbacks if specific mode column was not found
      if (waktuIdx === -1) {
        for (let i = 0; i < headers.length; i++) {
          const val = String(headers[i] || '').toLowerCase().trim();
          if ((val.includes('jam') || val.includes('waktu') || val.includes('pukul') || val.includes('time') || val.includes('timestamp')) && !val.includes('jadwal')) {
            waktuIdx = i;
            break;
          }
        }
      }
    }

    // Fallbacks if not found
    if (namaIdx === -1) namaIdx = 1;
    if (tanggalIdx === -1) tanggalIdx = 2;
    if (waktuIdx === -1) waktuIdx = 3;

    return { namaIdx, tanggalIdx, waktuIdx };
  };

  // 1. Process ABSEN DATANG
  if (datangRows && datangRows.length > 1) {
    const headers = datangRows[0];
    const { namaIdx, tanggalIdx, waktuIdx } = getColIndices(headers, 'datang');

    for (let i = 1; i < datangRows.length; i++) {
      const cols = datangRows[i];
      if (!cols || cols.length === 0) continue;

      const nama = String(cols[namaIdx] || '').trim();
      const tanggal = String(cols[tanggalIdx] || '').trim();
      let jam = String(cols[waktuIdx] || '').trim();

      if (!nama || nama.toLowerCase().includes('nama') || nama.toLowerCase().includes('guru')) continue;

      if (jam.includes(' ') && (jam.includes(':') || jam.includes('.'))) {
        const parts = jam.split(' ');
        jam = parts[parts.length - 1];
      }

      const key = `${nama.toLowerCase()}_${tanggal}`;
      map[key] = {
        tanggal,
        namaGuru: nama,
        jamDatang: jam || '-',
        jamPulang: '-'
      };
    }
  }

  // 2. Process ABSEN PULANG
  if (pulangRows && pulangRows.length > 1) {
    const headers = pulangRows[0];
    const { namaIdx, tanggalIdx, waktuIdx } = getColIndices(headers, 'pulang');

    for (let i = 1; i < pulangRows.length; i++) {
      const cols = pulangRows[i];
      if (!cols || cols.length === 0) continue;

      const nama = String(cols[namaIdx] || '').trim();
      const tanggal = String(cols[tanggalIdx] || '').trim();
      let jam = String(cols[waktuIdx] || '').trim();

      if (!nama || nama.toLowerCase().includes('nama') || nama.toLowerCase().includes('guru')) continue;

      if (jam.includes(' ') && (jam.includes(':') || jam.includes('.'))) {
        const parts = jam.split(' ');
        jam = parts[parts.length - 1];
      }

      const key = `${nama.toLowerCase()}_${tanggal}`;
      if (map[key]) {
        map[key].jamPulang = jam || '-';
      } else {
        map[key] = {
          tanggal,
          namaGuru: nama,
          jamDatang: '-',
          jamPulang: jam || '-'
        };
      }
    }
  }

  // Convert map to list of AbsenPiket items
  const result: AbsenPiket[] = Object.values(map).map((entry, idx) => {
    let status: 'Lengkap' | 'TIDAK ABSEN PULANG' | 'TIDAK ABSEN DATANG' = 'Lengkap';
    let keterangan = 'Hadir Lengkap';

    if (entry.jamDatang === '-') {
      status = 'TIDAK ABSEN DATANG';
      keterangan = 'Tidak melakukan absen datang';
    } else if (entry.jamPulang === '-') {
      status = 'TIDAK ABSEN PULANG';
      keterangan = 'Tidak melakukan absen pulang';
    }

    return {
      id: `piket-imported-${idx}-${Date.now()}`,
      tanggal: entry.tanggal,
      namaGuru: entry.namaGuru,
      jamDatang: entry.jamDatang,
      jamPulang: entry.jamPulang,
      status,
      keterangan
    };
  });

  return result.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export function parseCSVTo2DArray(csvText: string): any[][] {
  if (!csvText || !csvText.trim()) return [];
  const lines = csvText.split(/\r?\n/);
  const result: any[][] = [];

  const splitCSVRow = (row: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim().replace(/^"|"$/g, ''));
    return cells;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      result.push(splitCSVRow(line));
    }
  }
  return result;
}

export async function fetchWithCorsProxy(url: string): Promise<string> {
  const proxies = [
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
  ];
  
  let lastError = null;
  for (const proxyFn of proxies) {
    try {
      const proxyUrl = proxyFn(url);
      const res = await fetch(proxyUrl);
      if (res.ok) {
        return await res.text();
      }
    } catch (err) {
      lastError = err;
    }
  }
  
  // Try direct fetch as fallback
  const response = await fetch(url);
  if (response.ok) {
    return await response.text();
  }
  throw lastError || new Error("Gagal mengambil data melalui CORS Proxy.");
}

export async function fetchPublicGoogleSheetValues(spreadsheetId: string, sheetName: string): Promise<any[][]> {
  try {
    const sheetIdClean = spreadsheetId.trim();
    const sheetNameEncoded = encodeURIComponent(sheetName);
    const url = `https://docs.google.com/spreadsheets/d/${sheetIdClean}/gviz/tq?tqx=out:csv&sheet=${sheetNameEncoded}`;
    
    const csvText = await fetchWithCorsProxy(url);
    return parseCSVTo2DArray(csvText);
  } catch (error: any) {
    console.warn('Public sheet fetch issue:', error);
    let cleanMsg = error.message || String(error);
    if (cleanMsg.includes('Failed to fetch') || cleanMsg.includes('failed to fetch') || cleanMsg.includes('fetch')) {
      cleanMsg = "Koneksi jaringan dibatasi (CORS / Peramban)";
    }
    throw new Error(cleanMsg);
  }
}

export async function listFolderFiles(accessToken: string, folderId: string): Promise<any[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,iconLink,modifiedTime,size)&pageSize=100`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(`Izin ditolak (403): Akun Anda tidak memiliki akses ke Folder Google Drive ini.`);
    }
    if (response.status === 404) {
      throw new Error(`Folder tidak ditemukan (404): Periksa kembali ID Folder Google Drive Anda.`);
    }
    throw new Error(`Gagal membaca data dari Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}


