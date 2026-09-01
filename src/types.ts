// Types and Interfaces for Wakasek Kurikulum Command Center

export interface ProgramKerja {
  id: string;
  semester: 1 | 2;
  program: string;
  targetWaktu: string;
  tanggungJawab: string;
  status: 'Belum' | 'Sedang' | 'Selesai';
  evidenceName?: string;
  evidenceType?: string;
  evidenceSize?: string;
  evidenceDate?: string;
  evidenceContent?: string; // base64 or placeholder
  notes?: string;
}

export interface SiswaNilai {
  id: string;
  nisn: string;
  nama: string;
  kelas: string; // '7A', '7B', '8A', '8B', '9A', '9B'
  mapel: string; // 'Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pancasila'
  tugas: number;
  uh: number; // Ulangan Harian
  uts: number;
  uas: number;
  akhir: number; // Calculated average or weighted
  tugas1?: number;
  tugas2?: number;
  tugas3?: number;
  tugas4?: number;
  tugas5?: number;
  tugas6?: number;
  tugas7?: number;
  tugas8?: number;
  tugas9?: number;
  tugas10?: number;
  uh1?: number;
  uh2?: number;
  uh3?: number;
  uh4?: number;
  uh5?: number;
}

export interface IntervensiSiswa {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  mapel: string;
  nilaiAkhir: number;
  masalah: string;
  rencanaTindakLanjut: string;
  tanggalIntervensi: string;
  status: 'Rencana' | 'Berjalan' | 'Selesai';
}

export interface SupervisiGuru {
  id: string;
  namaGuru: string;
  mapel: string;
  tanggal: string;
  kelas: string;
  skorPendahuluan: number; // 1-100
  skorInti: number; // 1-100
  skorPenutup: number; // 1-100
  skorRataRata: number;
  catatanKekuatan: string;
  catatanPengembangan: string;
  rekomendasi: string;
}

export interface PerangkatAjarKelasDetail {
  kalenderAkademik: boolean;
  cp: boolean;
  analisisCp: boolean;
  tp: boolean;
  atp: boolean;
  prota: boolean;
  prosem: boolean;
  mingguEfektif: boolean;
  modulAjar: boolean;
  asesmen: boolean;
  formatPenilaian: boolean;
  rubrikPenilaian: boolean;
}

export interface PerangkatAjar {
  id: string;
  namaGuru: string;
  mapel: string;
  kelasAjar: string;
  kalenderAkademik: boolean;
  cp: boolean;
  analisisCp: boolean;
  tp: boolean;
  atp: boolean;
  prota: boolean; // Program Tahunan
  prosem: boolean; // Program Semester
  mingguEfektif: boolean;
  modulAjar: boolean;
  asesmen: boolean;
  formatPenilaian: boolean;
  rubrikPenilaian: boolean;
  revisiTerakhir: string;
  kepatuhanKelas?: {
    [kelasName: string]: PerangkatAjarKelasDetail;
  };
}

export interface DokumenKurikulum {
  id: string;
  namaFile: string;
  kategori: 'Buku I KOSP' | 'Buku II Silabus/ATP' | 'Buku III RPP/Modul' | 'Panduan Akademik' | 'SK Pembagian Tugas';
  tahunAjaran: string;
  status: 'Final' | 'Draft' | 'Revisi';
  tanggalDibuat: string;
  pembuat: string;
  ukuran: string;
  fileData?: string; // base64 data url from laptop/pc
  fileType?: string; // mime type
  driveFolder?: string; // e.g. "DOKUMEN KOSP"
  driveFileId?: string; // Google Drive file ID
  driveSynced?: boolean; // Google Drive sync status
  driveSyncTime?: string;
  driveUrl?: string; // direct link / viewer in Google Drive
  riwayatRevisi: {
    versi: string;
    tanggal: string;
    oleh: string;
    keterangan: string;
  }[];
}

// Initial Data Generators
export const INITIAL_PROGRAMS: ProgramKerja[] = [
  {
    id: 'prog-1',
    semester: 1,
    program: 'Penyusunan Kurikulum Operasional Satuan Pendidikan (KOSP) Tahun Ajaran 2026/2027',
    targetWaktu: 'Juli 2026',
    tanggungJawab: 'Wakasek Kurikulum & Tim Pengembang',
    status: 'Selesai',
    evidenceName: 'SK_Penyusunan_KOSP_2026.pdf',
    evidenceType: 'application/pdf',
    evidenceSize: '1.2 MB',
    evidenceDate: '12 Juli 2026',
    notes: 'Sudah ditandatangani Kepala Sekolah dan disahkan Pengawas Pembina.'
  },
  {
    id: 'prog-2',
    semester: 1,
    program: 'In House Training (IHT) Implementasi Kurikulum Merdeka & Diferensiasi Pembelajaran',
    targetWaktu: 'Juli 2026',
    tanggungJawab: 'Staf Kurikulum',
    status: 'Selesai',
    evidenceName: 'Notulen_IHT_Kurikulum_Merdeka.pdf',
    evidenceType: 'application/pdf',
    evidenceSize: '850 KB',
    evidenceDate: '18 Juli 2026',
    notes: 'Dihadiri oleh seluruh 24 guru mata pelajaran.'
  },
  {
    id: 'prog-3',
    semester: 1,
    program: 'Penyusunan Pembagian Tugas Mengajar & Jadwal Pelajaran Semester Ganjil',
    targetWaktu: 'Juli 2026',
    tanggungJawab: 'Wakasek Kurikulum',
    status: 'Selesai',
    evidenceName: 'SK_Pembagian_Tugas_Ganjil.pdf',
    evidenceType: 'application/pdf',
    evidenceSize: '2.4 MB',
    evidenceDate: '15 Juli 2026',
    notes: 'Jadwal 40 JP/minggu telah diintegrasikan dengan proyek P5.'
  },
  {
    id: 'prog-4',
    semester: 1,
    program: 'Supervisi Klinis Akademik dan Observasi Kelas Gelombang I',
    targetWaktu: 'September - Oktober 2026',
    tanggungJawab: 'Wakasek Kurikulum & Kepala Sekolah',
    status: 'Sedang',
    notes: 'Sedang berjalan untuk 12 guru kelompok sains dan sosial.'
  },
  {
    id: 'prog-5',
    semester: 1,
    program: 'Pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK) 2026',
    targetWaktu: 'September 2026',
    tanggungJawab: 'Proktor & Teknisi ANBK',
    status: 'Belum',
    notes: 'Simulasi mandiri tahap II dijadwalkan awal September.'
  },
  {
    id: 'prog-6',
    semester: 1,
    program: 'Penyusunan Soal & Pelaksanaan Sumatif Tengah Semester (STS) Ganjil',
    targetWaktu: 'Oktober 2026',
    tanggungJawab: 'Panitia STS',
    status: 'Belum'
  },
  {
    id: 'prog-7',
    semester: 2,
    program: 'Pengolahan Nilai & Pembagian Raport Semester Ganjil',
    targetWaktu: 'Desember 2026',
    tanggungJawab: 'Wali Kelas & Kurikulum',
    status: 'Belum'
  },
  {
    id: 'prog-8',
    semester: 2,
    program: 'Review KOSP dan Analisis Evaluasi Pembelajaran Semester I',
    targetWaktu: 'Januari 2027',
    tanggungJawab: 'Wakasek Kurikulum',
    status: 'Belum'
  }
];

export const INITIAL_SISWA_NILAI: SiswaNilai[] = [
  // Kelas VII.A
  { id: 'sn-1', nisn: '0091234561', nama: 'Aditya Pratama', kelas: 'VII.A', mapel: 'Matematika', tugas: 82, uh: 78, uts: 80, uas: 85, akhir: 81.3 },
  { id: 'sn-2', nisn: '0091234561', nama: 'Aditya Pratama', kelas: 'VII.A', mapel: 'IPA', tugas: 85, uh: 80, uts: 82, uas: 88, akhir: 83.8 },
  { id: 'sn-3', nisn: '0091234562', nama: 'Budi Santoso', kelas: 'VII.A', mapel: 'Matematika', tugas: 60, uh: 55, uts: 62, uas: 58, akhir: 58.7 }, // Below target (70)
  { id: 'sn-4', nisn: '0091234562', nama: 'Budi Santoso', kelas: 'VII.A', mapel: 'IPA', tugas: 70, uh: 65, uts: 68, uas: 72, akhir: 68.8 },
  { id: 'sn-5', nisn: '0091234563', nama: 'Citra Kirana', kelas: 'VII.A', mapel: 'Matematika', tugas: 90, uh: 92, uts: 88, uas: 94, akhir: 91.0 },
  { id: 'sn-6', nisn: '0091234563', nama: 'Citra Kirana', kelas: 'VII.A', mapel: 'IPA', tugas: 94, uh: 95, uts: 92, uas: 90, akhir: 92.7 },
  { id: 'sn-7', nisn: '0091234564', nama: 'Dinda Lestari', kelas: 'VII.A', mapel: 'Matematika', tugas: 55, uh: 50, uts: 48, uas: 60, akhir: 53.3 }, // Below target
  { id: 'sn-8', nisn: '0091234564', nama: 'Dinda Lestari', kelas: 'VII.A', mapel: 'Bahasa Indonesia', tugas: 75, uh: 72, uts: 80, uas: 78, akhir: 76.3 },
  
  // Kelas VIII
  { id: 'sn-9', nisn: '0081234571', nama: 'Eko Wijaya', kelas: 'VIII', mapel: 'Matematika', tugas: 78, uh: 74, uts: 82, uas: 80, akhir: 78.5 },
  { id: 'sn-10', nisn: '0081234571', nama: 'Eko Wijaya', kelas: 'VIII', mapel: 'Bahasa Inggris', tugas: 52, uh: 58, uts: 60, uas: 55, akhir: 56.3 }, // Below target
  { id: 'sn-11', nisn: '0081234572', nama: 'Fajar Nugraha', kelas: 'VIII', mapel: 'IPA', tugas: 80, uh: 84, uts: 85, uas: 82, akhir: 82.8 },
  { id: 'sn-12', nisn: '0081234573', nama: 'Gita Safitri', kelas: 'VIII', mapel: 'Matematika', tugas: 95, uh: 98, uts: 96, uas: 98, akhir: 96.8 },
  { id: 'sn-13', nisn: '0081234574', nama: 'Hendra Setiawan', kelas: 'VIII', mapel: 'IPA', tugas: 62, uh: 58, uts: 60, uas: 64, akhir: 61.0 }, // Below target
  
  // Kelas IX
  { id: 'sn-14', nisn: '0071234581', nama: 'Indah Permata', kelas: 'IX', mapel: 'Matematika', tugas: 88, uh: 90, uts: 85, uas: 89, akhir: 88.0 },
  { id: 'sn-15', nisn: '0071234582', nama: 'Joko Susilo', kelas: 'IX', mapel: 'Matematika', tugas: 45, uh: 40, uts: 52, uas: 48, akhir: 46.3 }, // Below target
  { id: 'sn-16', nisn: '0071234582', nama: 'Joko Susilo', kelas: 'IX', mapel: 'IPA', tugas: 58, uh: 52, uts: 55, uas: 60, akhir: 56.3 }, // Below target
  { id: 'sn-17', nisn: '0071234583', nama: 'Kartika Sari', kelas: 'IX', mapel: 'Bahasa Indonesia', tugas: 88, uh: 92, uts: 90, uas: 94, akhir: 91.0 },
  { id: 'sn-18', nisn: '0071234584', nama: 'Lukman Hakim', kelas: 'IX', mapel: 'Bahasa Inggris', tugas: 78, uh: 80, uts: 75, uas: 82, akhir: 78.8 }
];

export const INITIAL_INTERVENSI: IntervensiSiswa[] = [
  {
    id: 'int-1',
    siswaId: 'sn-3',
    namaSiswa: 'Budi Santoso',
    kelas: 'VII.A',
    mapel: 'Matematika',
    nilaiAkhir: 58.7,
    masalah: 'Kesulitan memahami konsep Aljabar dasar dan operasi pecahan.',
    rencanaTindakLanjut: 'Bimbingan belajar sore kelompok khusus (Remedial Teaching) selama 3 pertemuan.',
    tanggalIntervensi: '2026-09-05',
    status: 'Berjalan'
  },
  {
    id: 'int-2',
    siswaId: 'sn-7',
    namaSiswa: 'Dinda Lestari',
    kelas: 'VII.A',
    mapel: 'Matematika',
    nilaiAkhir: 53.3,
    masalah: 'Kurang konsentrasi saat PBM, lambat mengerjakan tugas.',
    rencanaTindakLanjut: 'Konsultasi dengan wali kelas dan bimbingan sebaya oleh siswa Citra Kirana.',
    tanggalIntervensi: '2026-09-08',
    status: 'Rencana'
  },
  {
    id: 'int-3',
    siswaId: 'sn-10',
    namaSiswa: 'Eko Wijaya',
    kelas: 'VIII',
    mapel: 'Bahasa Inggris',
    nilaiAkhir: 56.3,
    masalah: 'Penguasaan kosakata (vocabulary) sangat minim, kesulitan tenses dasar.',
    rencanaTindakLanjut: 'Pemberian kamus mini buatan guru dan kuis kosakata interaktif digital.',
    tanggalIntervensi: '2026-09-04',
    status: 'Berjalan'
  },
  {
    id: 'int-4',
    siswaId: 'sn-15',
    namaSiswa: 'Joko Susilo',
    kelas: 'IX',
    mapel: 'Matematika',
    nilaiAkhir: 46.3,
    masalah: 'Sering absen tanpa keterangan, motivasi belajar matematika rendah.',
    rencanaTindakLanjut: 'Pemanggilan orang tua bersama Guru BK, dibuatkan modul latihan ringkas mandiri.',
    tanggalIntervensi: '2026-08-28',
    status: 'Selesai'
  }
];

export const INITIAL_SUPERVISI: SupervisiGuru[] = [
  {
    id: 'sup-1',
    namaGuru: 'Drs. Ahmad Junaedi',
    mapel: 'Matematika',
    tanggal: '2026-08-15',
    kelas: '9A',
    skorPendahuluan: 85,
    skorInti: 78,
    skorPenutup: 80,
    skorRataRata: 81.0,
    catatanKekuatan: 'Apersepsi sangat bagus, mengaitkan matematika dengan kehidupan sehari-hari secara apik.',
    catatanPengembangan: 'Pengelolaan kelas pada akhir diskusi kelompok agak riuh, beberapa siswa pasif.',
    rekomendasi: 'Menggunakan aplikasi pembagi kelompok acak agar anggota kelompok lebih heterogen.'
  },
  {
    id: 'sup-2',
    namaGuru: 'Siti Rahma, S.Pd.',
    mapel: 'IPA',
    tanggal: '2026-08-19',
    kelas: '8B',
    skorPendahuluan: 90,
    skorInti: 92,
    skorPenutup: 90,
    skorRataRata: 90.7,
    catatanKekuatan: 'Praktikum terstruktur sangat baik, mengimplementasikan sintaks Discovery Learning dengan sempurna.',
    catatanPengembangan: 'Pemanfaatan waktu agak meleset 5 menit karena durasi praktikum memanjang.',
    rekomendasi: 'Membuat timekeeper kelompok di antara siswa untuk mengatur durasi pengamatan.'
  },
  {
    id: 'sup-3',
    namaGuru: 'Budi Santoso, M.Pd.',
    mapel: 'Bahasa Indonesia',
    tanggal: '2026-08-22',
    kelas: 'VII.A',
    skorPendahuluan: 80,
    skorInti: 82,
    skorPenutup: 75,
    skorRataRata: 79.0,
    catatanKekuatan: 'Suara lantang dan jelas, penggunaan media presentasi interaktif Canva sangat menarik bagi siswa.',
    catatanPengembangan: 'Bagian refleksi penutup terburu-buru, kesimpulan didominasi oleh guru sendiri.',
    rekomendasi: 'Berikan ruang bagi 2-3 siswa untuk menyampaikan kesimpulan/refleksi lisan sebelum kelas diakhiri.'
  },
  {
    id: 'sup-4',
    namaGuru: 'Sri Wahyuni, S.S.',
    mapel: 'Bahasa Inggris',
    tanggal: '2026-08-26',
    kelas: '8A',
    skorPendahuluan: 75,
    skorInti: 70,
    skorPenutup: 72,
    skorRataRata: 72.3,
    catatanKekuatan: 'Ramah, sabar dalam merespon siswa yang kesulitan melafalkan kosakata bahasa Inggris.',
    catatanPengembangan: 'Pembelajaran masih sangat teacher-centered. Aktivitas berbicara (speaking) siswa sangat minim.',
    rekomendasi: 'Terapkan metode Role Play atau Jigsaw dalam berkelompok untuk mendorong interaksi berbahasa Inggris antar siswa.'
  }
];

export const INITIAL_COMPLIANCE: PerangkatAjar[] = [];

export const INITIAL_DOCUMENTS: DokumenKurikulum[] = [
  {
    id: 'doc-1',
    namaFile: 'Buku_I_KOSP_SMP_Merdeka_2026_2027_FINAL.pdf',
    kategori: 'Buku I KOSP',
    tahunAjaran: '2026/2027',
    status: 'Final',
    tanggalDibuat: '2026-07-10',
    pembuat: 'Tim Pengembang Kurikulum',
    ukuran: '4.5 MB',
    driveFolder: 'DOKUMEN KOSP',
    driveSynced: true,
    driveSyncTime: '2026-07-10 09:30',
    riwayatRevisi: [
      { versi: 'v1.0', tanggal: '2026-06-25', oleh: 'Wakasek Kurikulum', keterangan: 'Draft awal KOSP menyesuaikan regulasi permendikbud terbaru.' },
      { versi: 'v1.1', tanggal: '2026-07-05', oleh: 'Tim Reviewer', keterangan: 'Revisi struktur analisis karakteristik satuan pendidikan.' },
      { versi: 'v2.0_Final', tanggal: '2026-07-10', oleh: 'Wakasek Kurikulum', keterangan: 'Persetujuan akhir oleh Kepala Sekolah dan Pengawas.' }
    ]
  },
  {
    id: 'doc-2',
    namaFile: 'ATP_Matematika_Fase_D_Kelas_7_8_9.xlsx',
    kategori: 'Buku II Silabus/ATP',
    tahunAjaran: '2026/2027',
    status: 'Final',
    tanggalDibuat: '2026-07-15',
    pembuat: 'MGMP Matematika Sekolah',
    ukuran: '320 KB',
    driveFolder: 'DOKUMEN KOSP',
    driveSynced: true,
    driveSyncTime: '2026-07-15 11:20',
    riwayatRevisi: [
      { versi: 'v1.0', tanggal: '2026-07-15', oleh: 'Drs. Ahmad Junaedi', keterangan: 'Penyusunan Alur Tujuan Pembelajaran Fase D.' }
    ]
  },
  {
    id: 'doc-3',
    namaFile: 'Modul_Ajar_IPA_Suhu_dan_Kalor_K7.pdf',
    kategori: 'Buku III RPP/Modul',
    tahunAjaran: '2026/2027',
    status: 'Draft',
    tanggalDibuat: '2026-07-22',
    pembuat: 'Siti Rahma, S.Pd.',
    ukuran: '1.8 MB',
    driveFolder: 'DOKUMEN KOSP',
    driveSynced: true,
    driveSyncTime: '2026-07-22 14:15',
    riwayatRevisi: [
      { versi: 'v0.1', tanggal: '2026-07-22', oleh: 'Siti Rahma, S.Pd.', keterangan: 'Draft awal modul ajar berdiferensiasi.' }
    ]
  },
  {
    id: 'doc-4',
    namaFile: 'SK_Pembagian_Tugas_Mengajar_Kurikulum_2026.pdf',
    kategori: 'SK Pembagian Tugas',
    tahunAjaran: '2026/2027',
    status: 'Final',
    tanggalDibuat: '2026-07-14',
    pembuat: 'Kepala Sekolah',
    ukuran: '1.5 MB',
    driveFolder: 'DOKUMEN KOSP',
    driveSynced: true,
    driveSyncTime: '2026-07-14 10:00',
    riwayatRevisi: [
      { versi: 'v1.0', tanggal: '2026-07-14', oleh: 'Sekretariat Sekolah', keterangan: 'Penerbitan SK Resmi No. 421/045/SK/2026.' }
    ]
  }
];

export interface JurnalMengajar {
  id: string;
  tanggal: string;
  namaGuru: string;
  mapel: string;
  kelas: string;
  jamKe: string;
  materiAjar: string;
  absensiSiswa: {
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
  };
  catatanKejadian: string;
  statusPelaksanaan: 'Terlaksana' | 'Tertunda' | 'Selesai';
}

export const INITIAL_JURNAL: JurnalMengajar[] = [
  {
    id: 'jur-1',
    tanggal: '2026-08-24',
    namaGuru: 'Drs. Ahmad Junaedi',
    mapel: 'Matematika',
    kelas: '9A',
    jamKe: '1-2',
    materiAjar: 'Bilangan Berpangkat dan Bentuk Akar (Eksponen)',
    absensiSiswa: { hadir: 30, sakit: 1, izin: 1, alfa: 0 },
    catatanKejadian: 'Siswa aktif mengerjakan kuis kelompok. 2 siswa sempat kebingungan menyederhanakan pangkat pecahan.',
    statusPelaksanaan: 'Terlaksana'
  },
  {
    id: 'jur-2',
    tanggal: '2026-08-24',
    namaGuru: 'Siti Rahma, S.Pd.',
    mapel: 'IPA',
    kelas: '8B',
    jamKe: '3-4',
    materiAjar: 'Struktur dan Fungsi Organ Tubuh Manusia (Sistem Pencernaan)',
    absensiSiswa: { hadir: 31, sakit: 0, izin: 1, alfa: 0 },
    catatanKejadian: 'Praktikum uji zat makanan dengan lugol dan benedict terlaksana dengan lancar dan rapi.',
    statusPelaksanaan: 'Terlaksana'
  },
  {
    id: 'jur-3',
    tanggal: '2026-08-25',
    namaGuru: 'Budi Santoso, M.Pd.',
    mapel: 'Bahasa Indonesia',
    kelas: 'VII.A',
    jamKe: '1-3',
    materiAjar: 'Mengeksplorasi Teks Deskripsi tentang Keindahan Alam Daerah',
    absensiSiswa: { hadir: 28, sakit: 2, izin: 0, alfa: 2 },
    catatanKejadian: 'Terdapat 2 siswa tanpa keterangan (alfa). Kegiatan menulis teks deskripsi berjalan interaktif menggunakan media foto.',
    statusPelaksanaan: 'Terlaksana'
  },
  {
    id: 'jur-4',
    tanggal: '2026-08-25',
    namaGuru: 'Sri Wahyuni, S.S.',
    mapel: 'Bahasa Inggris',
    kelas: 'VIII',
    jamKe: '5-6',
    materiAjar: 'Expressing Ability and Willingness (Can and Will)',
    absensiSiswa: { hadir: 32, sakit: 0, izin: 0, alfa: 0 },
    catatanKejadian: 'Kehadiran lengkap. Siswa berlatih dialog berpasangan di depan kelas, sebagian masih canggung melafalkan can.',
    statusPelaksanaan: 'Selesai'
  },
  {
    id: 'jur-5',
    tanggal: '2026-08-26',
    namaGuru: 'Rian Hidayat, S.Pd.',
    mapel: 'IPS',
    kelas: 'VII.B',
    jamKe: '2-4',
    materiAjar: 'Kondisi Geografis dan Peta Lingkungan Rumah',
    absensiSiswa: { hadir: 29, sakit: 1, izin: 1, alfa: 1 },
    catatanKejadian: 'Pembelajaran di luar kelas untuk memetakan arah mata angin. Siswa sangat antusias menggambar sketsa.',
    statusPelaksanaan: 'Terlaksana'
  },
  {
    id: 'jur-6',
    tanggal: '2026-08-26',
    namaGuru: 'Dewi Lestari, S.Pd.',
    mapel: 'Pancasila',
    kelas: 'VII.A',
    jamKe: '5-6',
    materiAjar: 'Sejarah Perumusan Pancasila sebagai Dasar Negara',
    absensiSiswa: { hadir: 31, sakit: 1, izin: 0, alfa: 0 },
    catatanKejadian: 'Nonton bareng video sejarah sidang BPUPKI dilanjutkan refleksi nilai ketuhanan dan kemানুsiaan.',
    statusPelaksanaan: 'Terlaksana'
  }
];

export interface JurnalMengajarHarian {
  id: string;
  hari: string;
  tanggal: string;
  waktuInput: string;
  mapel: string;
  namaGuru: string;
  kelas: string;
  durasi: string;
  topik: string;
  kegiatan: string;
  foto: string;
  keterangan: string;
}

export const INITIAL_JURNAL_HARIAN: JurnalMengajarHarian[] = [
  {
    id: 'jmh-1',
    hari: 'Senin',
    tanggal: '2026-08-31',
    waktuInput: '07.25',
    mapel: 'Matematika',
    namaGuru: 'Drs. Ahmad Junaedi',
    kelas: 'VII.A',
    durasi: '07.20 - 08.40',
    topik: 'Bilangan Bulat & Operasi Hitung',
    kegiatan: 'Pemaparan materi operasi bilangan bulat negatif menggunakan garis bilangan, diikuti latihan soal mandiri.',
    foto: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400',
    keterangan: 'TEPAT WAKTU'
  },
  {
    id: 'jmh-2',
    hari: 'Senin',
    tanggal: '2026-08-31',
    waktuInput: '09.15',
    mapel: 'IPA',
    namaGuru: 'Siti Rahma, S.Pd.',
    kelas: 'VIII.A',
    durasi: '08.40 - 10.00',
    topik: 'Suhu dan Alat Ukurnya (Termometer)',
    kegiatan: 'Praktikum mengukur suhu air menggunakan termometer raksa dan termometer alkohol, mencatat hasil dalam lembar observasi.',
    foto: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400',
    keterangan: 'TEPAT WAKTU'
  },
  {
    id: 'jmh-3',
    hari: 'Senin',
    tanggal: '2026-08-31',
    waktuInput: '10.35',
    mapel: 'Bahasa Indonesia',
    namaGuru: 'Budi Santoso, M.Pd.',
    kelas: 'IX.A',
    durasi: '10.20 - 11.40',
    topik: 'Menelaah Struktur Teks Laporan Percobaan',
    kegiatan: 'Menganalisis bagian tujuan, alat/bahan, langkah-langkah, hasil, dan simpulan dari contoh teks laporan yang dibagikan.',
    foto: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400',
    keterangan: 'TERLAMBAT 15 menit'
  },
  {
    id: 'jmh-4',
    hari: 'Selasa',
    tanggal: '2026-09-01',
    waktuInput: '07.22',
    mapel: 'Bahasa Inggris',
    namaGuru: 'Sri Wahyuni, S.S.',
    kelas: 'VIII.B',
    durasi: '07.20 - 08.40',
    topik: 'Describing People & Places (Adjectives)',
    kegiatan: 'Siswa berpasangan mendeskripsikan teman sebangku menggunakan adjectives yang tepat dalam percakapan terpandu.',
    foto: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400',
    keterangan: 'TEPAT WAKTU'
  }
];
