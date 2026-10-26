/**
 * Antarmuka Role-Based Access Control (RBAC) Terpusat
 * PKBM Digital Dar El Iman
 * 
 * Mengatur 18 peran pengguna secara terstruktur, ketat, dan transparan
 * guna mencegah salah klasifikasi akun (misal guru/manajemen terdeteksi sebagai santri).
 */

// 1. KATEGORI UTAMA PERAN
export const ROLE_CATEGORIES = {
  PIMPINAN: 'PIMPINAN',           // Super Admin, Dewan Pembina, Direktur, Tim Mutu
  MANAJEMEN: 'MANAJEMEN',         // Manajer Akademik, Kesiswaan, Keuangan, Teknologi
  PENDIDIK: 'PENDIDIK',           // Wali Kelas, Tutor/Guru Pengampu
  TEKNIS: 'TEKNIS',               // Proktor Ujian, Operator Dapodik, Tata Usaha
  SANTRI: 'SANTRI',               // Santri Kesetaraan Paket A, B, C
  WALI_SANTRI: 'WALI_SANTRI',     // Orang Tua / Wali Murid
  GUEST: 'GUEST',                 // Calon Santri Baru (PPDB)
};

// 2. DAFTAR PERAN RESMI
export const ROLES = {
  // Pimpinan
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEWAN_PEMBINA: 'DEWAN_PEMBINA',
  DIREKTUR_PKBM: 'DIREKTUR_PKBM',
  TIM_MUTU: 'TIM_MUTU',

  // Manajemen
  MANAJER_AKADEMIK: 'MANAJER_AKADEMIK',
  MANAJER_KESISWAAN: 'MANAJER_KESISWAAN',
  MANAJER_KEUANGAN: 'MANAJER_KEUANGAN',
  MANAJER_TEKNOLOGI: 'MANAJER_TEKNOLOGI',

  // Pendidik
  WALI_KELAS: 'WALI_KELAS',
  TUTOR: 'TUTOR',
  GURU: 'GURU',

  // Tenaga Kependidikan & Teknis
  PROKTOR_UJIAN: 'PROKTOR_UJIAN',
  OPERATOR: 'OPERATOR',
  ADMIN: 'ADMIN',

  // Santri & Keluarga
  SISWA: 'SISWA',
  SANTRI: 'SANTRI',
  STUDENT: 'STUDENT',
  WALI_SANTRI: 'WALI_SANTRI',
  ORANG_TUA: 'ORANG_TUA',
  GUEST_PPDB: 'GUEST_PPDB',
};

// 3. PENGELOMPOKAN ROLE KE KATEGORI
export const getRoleCategory = (user) => {
  const role = typeof user === 'string' ? user : (user?.role_name || '');

  if (['SUPER_ADMIN', 'DEWAN_PEMBINA', 'DIREKTUR_PKBM', 'TIM_MUTU'].includes(role)) {
    return ROLE_CATEGORIES.PIMPINAN;
  }
  if (['MANAJER_AKADEMIK', 'MANAJER_KESISWAAN', 'MANAJER_KEUANGAN', 'MANAJER_TEKNOLOGI'].includes(role)) {
    return ROLE_CATEGORIES.MANAJEMEN;
  }
  if (['WALI_KELAS', 'TUTOR', 'GURU'].includes(role)) {
    return ROLE_CATEGORIES.PENDIDIK;
  }
  if (['PROKTOR_UJIAN', 'OPERATOR', 'ADMIN'].includes(role)) {
    return ROLE_CATEGORIES.TEKNIS;
  }
  if (['SISWA', 'SANTRI', 'STUDENT'].includes(role)) {
    return ROLE_CATEGORIES.SANTRI;
  }
  if (['WALI_SANTRI', 'ORANG_TUA'].includes(role)) {
    return ROLE_CATEGORIES.WALI_SANTRI;
  }
  if (role === 'GUEST_PPDB') {
    return ROLE_CATEGORIES.GUEST;
  }

  // Fallback berdasarkan username atau display name jika role_name kosong
  if (user?.username?.startsWith('santri.')) return ROLE_CATEGORIES.SANTRI;
  if (user?.username?.startsWith('tutor.')) return ROLE_CATEGORIES.PENDIDIK;
  if (user?.username?.startsWith('wali.')) return ROLE_CATEGORIES.PENDIDIK;
  if (user?.username?.startsWith('manajer.')) return ROLE_CATEGORIES.MANAJEMEN;

  return ROLE_CATEGORIES.PIMPINAN; // Default aman
};

// 4. PEMERIKSAAN PERAN SPESIFIK (BOOLEAN HELPERS)
export const isPimpinan = (user) => getRoleCategory(user) === ROLE_CATEGORIES.PIMPINAN;
export const isManajemen = (user) => getRoleCategory(user) === ROLE_CATEGORIES.MANAJEMEN;
export const isPimpinanOrManajemen = (user) => isPimpinan(user) || isManajemen(user);

export const isSuperAdmin = (user) => user?.role_name === 'SUPER_ADMIN';
export const isDirektur = (user) => user?.role_name === 'DIREKTUR_PKBM';
export const isWaliKelas = (user) => user?.role_name === 'WALI_KELAS';

export const isTutor = (user) => {
  const role = user?.role_name;
  return role === 'TUTOR' || role === 'GURU' || user?.username?.startsWith('tutor.');
};

export const isMusyrifTahfizh = (user) => {
  if (user?.role_name === 'SUPER_ADMIN') return true;
  if (user?.username === 'tutor.ahmad') return true;
  const name = (user?.full_name || '').toLowerCase();
  return isTutor(user) && (name.includes('ahmad fauzi') || name.includes('tahfizh'));
};

export const isOtherTutor = (user) => {
  return isTutor(user) && !isMusyrifTahfizh(user);
};

export const isProktor = (user) => {
  return user?.role_name === 'PROKTOR_UJIAN' || user?.role_name === 'MANAJER_TEKNOLOGI' || user?.role_name === 'SUPER_ADMIN';
};

export const isStaff = (user) => {
  return getRoleCategory(user) === ROLE_CATEGORIES.TEKNIS;
};

// STRICT SANTRI CHECK: Hanya return true jika BENAR-BENAR akun santri!
export const isSantri = (user) => {
  const role = user?.role_name;
  return role === 'SISWA' || role === 'SANTRI' || role === 'STUDENT';
};

export const isWaliSantri = (user) => {
  const role = user?.role_name;
  return role === 'WALI_SANTRI' || role === 'ORANG_TUA';
};

export const isGuestPPDB = (user) => {
  return user?.role_name === 'GUEST_PPDB';
};

// 5. HELPER BADGE & LABEL VISUAL
export const getRoleDisplayBadge = (user) => {
  const userObj = typeof user === 'string' ? { role_name: user, role_display: user } : user;
  const category = getRoleCategory(userObj);
  const role = userObj?.role_name;

  if (category === ROLE_CATEGORIES.PIMPINAN) {
    return {
      category: 'Pimpinan Yayasan',
      label: user?.role_display || 'Pimpinan Eksekutif',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
      icon: '👑',
    };
  }
  if (category === ROLE_CATEGORIES.MANAJEMEN) {
    return {
      category: 'Manajemen Operasional',
      label: user?.role_display || 'Manajemen PKBM',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
      icon: '📊',
    };
  }
  if (role === 'WALI_KELAS') {
    return {
      category: 'Pendidik',
      label: 'Wali Kelas X Paket C',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200',
      icon: '📋',
    };
  }
  if (category === ROLE_CATEGORIES.PENDIDIK) {
    return {
      category: 'Pendidik',
      label: user?.role_display || 'Tutor / Guru Pengampu',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
      icon: '📖',
    };
  }
  if (category === ROLE_CATEGORIES.TEKNIS) {
    return {
      category: 'Tenaga Teknis & Kependidikan',
      label: user?.role_display || 'Pengawas CBT / Staf',
      color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200',
      icon: '🛡️',
    };
  }
  if (category === ROLE_CATEGORIES.SANTRI) {
    return {
      category: 'Santri',
      label: user?.role_display || 'Santri Kesetaraan',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200',
      icon: '🎒',
    };
  }
  if (category === ROLE_CATEGORIES.WALI_SANTRI) {
    return {
      category: 'Wali Santri',
      label: 'Orang Tua / Wali Santri',
      color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200',
      icon: '👨‍👩‍👧‍👦',
    };
  }
  return {
    category: 'Tamu',
    label: 'Guest PPDB Calon Santri',
    color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300',
    icon: '✨',
  };
};

// 6. FILTER MENU NAVIGASI PER PERAN (Strict Role-Based Sidebar)
export const getAllowedMenusForRole = (user) => {
  let role = user?.role_name || '';

  if (!role && user?.username) {
    if (user.username === 'admin') role = 'SUPER_ADMIN';
    else if (user.username === 'direktur') role = 'DIREKTUR_PKBM';
    else if (user.username === 'pembina') role = 'DEWAN_PEMBINA';
    else if (user.username === 'operator') role = 'OPERATOR';
    else if (user.username === 'manajer.it') role = 'MANAJER_TEKNOLOGI';
    else if (user.username === 'manajer.keuangan') role = 'MANAJER_KEUANGAN';
    else if (user.username === 'manajer.kesiswaan') role = 'MANAJER_KESISWAAN';
    else if (user.username === 'manajer.akademik') role = 'MANAJER_AKADEMIK';
    else if (user.username === 'wali.kelas') role = 'WALI_KELAS';
    else if (user.username.startsWith('tutor.')) role = 'TUTOR';
    else if (user.username.startsWith('santri.')) role = 'SANTRI';
  }

  if (role === 'GUEST_PPDB') {
    return ['overview', 'status', 'program', 'kurikulum', 'berkas', 'biaya'];
  }
  // Pimpinan & Super Admin: Semua Modul Termasuk Kemitraan Diaspora, Penjaminan Mutu & AI Tutor (Tahap 5)
  if (['SUPER_ADMIN', 'DIREKTUR_PKBM', 'DEWAN_PEMBINA', 'TIM_MUTU'].includes(role)) {
    return ['overview', 'kbm', 'presensi', 'tahfizh', 'cbt', 'rapor', 'ppdb', 'keuangan', 'dapodik', 'kemitraan', 'mutu', 'ai-tutor'];
  }
  // Manajer Teknologi (IT): Sistem, CBT, Dapodik, dan AI Tutor
  if (role === 'MANAJER_TEKNOLOGI') {
    return ['overview', 'cbt', 'dapodik', 'ai-tutor'];
  }
  // Manajer Akademik: KBM, CBT, Rapor, Mutu, dan AI Tutor
  if (role === 'MANAJER_AKADEMIK') {
    return ['overview', 'kbm', 'cbt', 'rapor', 'mutu', 'ai-tutor'];
  }
  // Manajer Kesiswaan: Presensi, Tahfizh, PPDB Kesiswaan, Kemitraan Diaspora, dan AI Tutor
  if (role === 'MANAJER_KESISWAAN') {
    return ['overview', 'presensi', 'tahfizh', 'ppdb', 'kemitraan', 'ai-tutor'];
  }
  // Manajer Keuangan: Keuangan SPP & Beasiswa, Mutu BSC
  if (role === 'MANAJER_KEUANGAN') {
    return ['overview', 'keuangan', 'mutu'];
  }
  // Proktor Ujian: CBT & Proctoring
  if (role === 'PROKTOR_UJIAN') {
    return ['overview', 'cbt'];
  }
  // Operator: Sinkronisasi Dapodik
  if (role === 'OPERATOR') {
    return ['overview', 'dapodik'];
  }
  // Wali Kelas: KBM, Presensi, Tahfizh, CBT, Rapor, dan AI Tutor
  if (role === 'WALI_KELAS') {
    return ['overview', 'kbm', 'presensi', 'tahfizh', 'cbt', 'rapor', 'ai-tutor'];
  }
  // Tutor / Guru:
  if (role === 'TUTOR' || role === 'GURU' || user?.username?.startsWith('tutor.')) {
    const isMusyrif = isMusyrifTahfizh(user);
    const menus = ['overview', 'kbm', 'presensi', 'cbt', 'rapor', 'ai-tutor'];
    if (isMusyrif) {
      menus.splice(3, 0, 'tahfizh');
    }
    return menus;
  }
  // Santri: Belajar, Presensi, Tahfizh, CBT, Rapor, Tagihan SPP, dan AI Tutor (TIDAK ADA PPDB)
  if (isSantri(user)) {
    return ['overview', 'kbm', 'presensi', 'tahfizh', 'cbt', 'rapor', 'keuangan', 'ai-tutor'];
  }
  // Wali Santri: Presensi, Tahfizh, Rapor, Tagihan SPP, dan AI Tutor (TIDAK ADA PPDB)
  if (isWaliSantri(user)) {
    return ['overview', 'presensi', 'tahfizh', 'rapor', 'keuangan', 'ai-tutor'];
  }
  return ['overview'];
};

export default {
  ROLE_CATEGORIES,
  ROLES,
  getRoleCategory,
  isPimpinan,
  isManajemen,
  isPimpinanOrManajemen,
  isSuperAdmin,
  isDirektur,
  isWaliKelas,
  isTutor,
  isMusyrifTahfizh,
  isOtherTutor,
  isProktor,
  isStaff,
  isSantri,
  isWaliSantri,
  isGuestPPDB,
  getRoleDisplayBadge,
  getAllowedMenusForRole,
};
