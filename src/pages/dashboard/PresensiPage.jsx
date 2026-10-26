import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Printer,
  Search,
  Check,
  X,
  FileText,
  FileDown,
  Sparkles,
  UploadCloud,
  Download,
  BookOpen,
  Filter,
  RefreshCw,
  HelpCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomDropdown from '../../components/common/CustomDropdown';
import { exportAttendancePDF } from '../../utils/pdfExport';
import {
  isPimpinan,
  isManajemen,
  isPimpinanOrManajemen,
  isWaliKelas,
  isTutor,
  isStaff,
  isSantri,
  getRoleDisplayBadge
} from '../../utils/rbac';

export const PresensiPage = ({ onNavigateMenu }) => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfDownloadSuccess, setPdfDownloadSuccess] = useState('');

  // Filter states
  const [attPeriod, setAttPeriod] = useState('month'); // 'day' | 'week' | 'month' | 'all'
  const [attStatusFilter, setAttStatusFilter] = useState('ALL');
  const [attSearch, setAttSearch] = useState('');

  // Student check-in states
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState('');
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [izinType, setIzinType] = useState('IZIN'); // 'IZIN' | 'SAKIT'
  const [izinReason, setIzinReason] = useState('');
  const [izinAttachment, setIzinAttachment] = useState('');

  // Tutor rejection modal state
  const [rejectingAtt, setRejectingAtt] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Strict RBAC Role Scoping
  const userIsPimpinan = isPimpinan(user);
  const userIsManajemen = isManajemen(user);
  const userIsPimpinanOrManajemen = isPimpinanOrManajemen(user);
  const userIsWaliKelas = isWaliKelas(user);
  const userIsTutor = isTutor(user);
  const userIsSantri = isSantri(user);
  const roleBadge = getRoleDisplayBadge(user);

  const isTutorOrAdmin = userIsPimpinanOrManajemen || userIsWaliKelas || userIsTutor || isStaff(user);

  // Tutor's taught subjects & classes scope
  const tutorTaughtSubjects = (() => {
    if (!userIsTutor) return [];
    if (user?.username === 'tutor.ahmad') return ["Tahfizh Al-Qur'an Bersanad", "Bahasa Arab Komunikatif & Nahwu"];
    if (user?.username === 'tutor.fauzan') return ["Matematika Terapan", "AI Literacy & Digital Skill"];
    return [];
  })();

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/curriculum/attendance');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAttendance(json.data);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // STUDENT CHECK-IN FUNCTION
  const handleStudentCheckIn = async (status, reason = '', attachmentUrl = '') => {
    setCheckInLoading(true);
    const studentNisn = user?.username === 'santri.yafiq' ? '0081234562' : '0081234561';
    try {
      const res = await fetch('/api/v1/curriculum/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id || user?.username || 'u0000012b',
          student_name: user?.full_name || 'Muhammad Abdullah Ziyad',
          nisn: studentNisn,
          classroom_name: 'Kelas X Paket C — Umar bin Khattab',
          subject_name: "Tahfizh Al-Qur'an Bersanad",
          status: status,
          reason: reason,
          attachment_url: attachmentUrl,
          date: '2026-10-18',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCheckInMsg(json.message);
        setShowIzinModal(false);
        setIzinReason('');
        setIzinAttachment('');
        setTimeout(() => {
          setCheckInMsg('');
          fetchData();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckInLoading(false);
    }
  };

  // TUTOR APPROVE / REJECT
  const handleTutorApprove = async (attId, action, rejectionReason = '') => {
    try {
      const res = await fetch('/api/v1/curriculum/attendance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_id: attId,
          action: action,
          rejection_reason: rejectionReason,
          tutor_name: user?.full_name || 'Ustadz Ahmad Fauzi, Lc.',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRejectingAtt(null);
        setRejectReasonInput('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Student's own record for today (Strict Isolation - No Data Leaks)
  const studentTodayRecord = attendance.find((a) => {
    if (user?.id && a.student_id === String(user.id)) return a.date === '2026-10-18';
    if (user?.username === 'santri.yafiq' && (a.student_name || '').includes('Yafiq')) return a.date === '2026-10-18';
    if (user?.username === 'santri.ziyad' && (a.student_name || '').includes('Ziyad')) return a.date === '2026-10-18';
    const isMe = (a.student_name || '').toLowerCase().trim() === (user?.full_name || '').toLowerCase().trim();
    return isMe && a.date === '2026-10-18';
  });

  // Student's historical attendance records (Strict Isolation)
  const myAttendanceHistory = attendance.filter((a) => {
    if (user?.id && a.student_id === String(user.id)) return true;
    if (user?.username === 'santri.yafiq' && (a.student_name || '').includes('Yafiq')) return true;
    if (user?.username === 'santri.ziyad' && (a.student_name || '').includes('Ziyad')) return true;
    return (a.student_name || '').toLowerCase().trim() === (user?.full_name || '').toLowerCase().trim();
  });

  // Pending leave requests for tutor review (Strict Role & Scope Isolation)
  const pendingIzinRequests = attendance.filter((a) => {
    if (a.status !== 'IZIN' && a.status !== 'SAKIT') return false;
    if (a.approval_status !== 'PENDING') return false;
    if (a.date !== '2026-10-18') return false;

    // Super Admin & Wali Kelas have class-wide oversight
    if (userIsPimpinanOrManajemen || userIsWaliKelas) return true;

    // Subject Tutor only sees approvals for their own subjects
    if (userIsTutor) {
      if (a.tutor_id && a.tutor_id === user?.id) return true;
      if (a.tutor_name && user?.full_name && a.tutor_name.toLowerCase().includes(user.full_name.toLowerCase())) return true;
      if (tutorTaughtSubjects.length > 0 && tutorTaughtSubjects.includes(a.subject_name)) return true;
      return false;
    }
    return false;
  });

  // Scoped Attendance: Tutor only sees subjects they teach, Wali Kelas & Admin oversee all
  const scopedAttendance = attendance.filter((item) => {
    if (userIsPimpinanOrManajemen || userIsWaliKelas) return true;
    if (userIsTutor) {
      if (item.tutor_id && item.tutor_id === user?.id) return true;
      if (item.tutor_name && user?.full_name && item.tutor_name.toLowerCase().includes(user.full_name.toLowerCase())) return true;
      if (tutorTaughtSubjects.length > 0 && tutorTaughtSubjects.includes(item.subject_name)) return false;
      return false;
    }
    return true;
  });

  // Filtered class attendance for table & export
  const filteredAttendance = scopedAttendance.filter((item) => {
    // Period filter
    if (attPeriod === 'day' && item.date !== '2026-10-18') return false;
    if (attPeriod === 'week' && !item.date?.startsWith('2026-10-1')) return false;
    if (attPeriod === 'month' && !item.date?.startsWith('2026-10')) return false;

    // Status filter
    if (attStatusFilter !== 'ALL' && item.status !== attStatusFilter) return false;

    // Search query
    if (attSearch) {
      const q = attSearch.toLowerCase();
      const matchName = (item.student_name || '').toLowerCase().includes(q);
      const matchNisn = (item.nisn || '').toLowerCase().includes(q);
      const matchSubject = (item.subject_name || '').toLowerCase().includes(q);
      if (!matchName && !matchNisn && !matchSubject) return false;
    }

    return true;
  });

  // Direct PDF Download Handler
  const handleExportPDF = () => {
    setIsExportingPdf(true);
    try {
      const periodMap = {
        month: 'Bulan Ini (Oktober 2026)',
        day: 'Hari Ini (18 Okt 2026)',
        week: 'Pekan Ini',
        all: 'Semua Periode'
      };
      const statusMap = {
        ALL: 'Semua Status',
        HADIR: 'Hadir',
        IZIN: 'Izin',
        SAKIT: 'Sakit',
        ALPA: 'Alpa'
      };
      const fileName = exportAttendancePDF({
        records: filteredAttendance,
        periodLabel: periodMap[attPeriod] || attPeriod,
        statusFilterLabel: statusMap[attStatusFilter] || attStatusFilter,
        className: 'Kelas X Paket C — Umar bin Khattab',
        academicYear: '2026/2027 Ganjil',
        tutorName: user?.full_name || 'Ustadz Ahmad Fauzi, Lc.'
      });
      setPdfDownloadSuccess(`File PDF "${fileName}" berhasil digenerate dan otomatis terunduh ke komputer Anda!`);
      setTimeout(() => setPdfDownloadSuccess(''), 6000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white relative overflow-hidden shadow-lg print:hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <UserCheck className="w-72 h-72" />
        </div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manajemen Presensi Santri & Ustadz</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {userIsSantri ? 'Presensi Mandiri Santri KBM Daring' : 'Rekapitulasi & Verifikasi Presensi KBM'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {userIsSantri
              ? 'Konfirmasi kehadiran harian pada sesi pembelajaran aktif, ajukan izin resmi berhalangan hadir, serta pantau riwayat kehadiran semester Anda.'
              : 'Kelola kehadiran seluruh santri rombel, verifikasi pengajuan izin/sakit santri secara real-time, dan cetak laporan presensi resmi berstandar PKBM.'}
          </p>
        </div>
      </div>



      {/* ALERT CHECK-IN SUCCESS */}
      {checkInMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-bounce print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{checkInMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAMPILAN KHUSUS SANTRI VS GURU/MANAJEMEN */}
      {/* ======================================================== */}
      {userIsSantri ? (
        <div className="space-y-6">
          {/* KARTU CHECK-IN SESI KBM HARI INI */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border-2 border-dei-emerald dark:border-dei-emerald-neon shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <span className="text-[11px] font-bold text-dei-gold uppercase tracking-wider">
                  Presensi KBM Daring Hari Ini
                </span>
                <h2 className="text-lg font-extrabold text-dei-ink dark:text-dei-dark-ink mt-0.5">
                  Tahfizh Al-Qur'an Bersanad (Ustadz Ahmad Fauzi, Lc.)
                </h2>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-dei-emerald" />
                  <span>Sesi KBM: <b>08:00 - 09:30 WIB</b> (Ahad, 18 Oktober 2026)</span>
                </p>
              </div>

              {studentTodayRecord ? (
                <div className="flex items-center gap-2">
                  {studentTodayRecord.status === 'HADIR' ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-dei-emerald flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>SUDAH HADIR ({studentTodayRecord.time_recorded || '07:55 WIB'})</span>
                    </span>
                  ) : studentTodayRecord.approval_status === 'PENDING' ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>PENGAJUAN {studentTodayRecord.status} MENUNGGU PERSETUJUAN</span>
                    </span>
                  ) : studentTodayRecord.approval_status === 'REJECTED' ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>IZIN DITOLAK USTADZ</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {studentTodayRecord.status} (Disetujui)
                    </span>
                  )}
                </div>
              ) : (
                <span className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>BELUM ISI PRESENSI HARI INI</span>
                </span>
              )}
            </div>

            {/* Condition Details */}
            {(!studentTodayRecord || studentTodayRecord.approval_status === 'REJECTED') && (
              <div className="space-y-3">
                {studentTodayRecord?.approval_status === 'REJECTED' && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-900 dark:text-red-200 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Pengajuan Izin Anda Ditolak oleh Ustadz:</span>
                    </div>
                    <p className="italic pl-5">
                      "{studentTodayRecord.rejection_reason || studentTodayRecord.notes || 'Surat izin tidak lengkap'}"
                    </p>
                    <p className="text-[11px] text-red-700 dark:text-red-300 pl-5">
                      ⚠️ Anda diberikan kesempatan untuk mengisi ulang presensi (Hadir atau perbarui alasan izin) sebelum jam KBM berakhir (09:30 WIB). Lewat batas waktu, status otomatis dianggap <b>ALPA</b>.
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-xs text-dei-ink dark:text-dei-dark-ink">
                      Konfirmasi Kehadiran atau Ajukan Izin:
                    </h4>
                    <p className="text-[11px] text-dei-muted dark:text-dei-dark-muted mt-0.5">
                      Klik tombol <b>"Konfirmasi Hadir"</b> jika Anda mengikuti kelas daring, atau ajukan izin jika berhalangan hadir.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleStudentCheckIn('HADIR')}
                      disabled={checkInLoading}
                      className="py-2.5 px-4 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Konfirmasi Hadir Sekarang</span>
                    </button>

                    <button
                      onClick={() => {
                        setIzinType('IZIN');
                        setShowIzinModal(true);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Ajukan Izin / Sakit</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {studentTodayRecord?.status === 'HADIR' && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Alhamdulillah, presensi <b>HADIR</b> Anda telah tercatat pada jam <b>{studentTodayRecord.time_recorded}</b>. Silakan bergabung ke Google Meet sesuai jadwal KBM.
                </span>
              </div>
            )}

            {studentTodayRecord?.approval_status === 'PENDING' && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pengajuan {studentTodayRecord.status} Anda Sedang Ditinjau:</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-5">
                  Alasan: <i>"{studentTodayRecord.reason || studentTodayRecord.notes}"</i>
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 pl-5">
                  Ustadz pengampu akan meninjau dan memberikan persetujuan. Jika permohonan disetujui, kehadiran Anda akan dihitung Izin resmi. Jika ditolak, Anda akan menerima pemberitahuan untuk absen ulang.
                </p>
              </div>
            )}
          </div>

          {/* RIWAYAT PRESENSI PRIBADI SANTRI */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-dei-emerald" />
                  Riwayat Presensi Saya (Semester Ganjil 2026/2027)
                </h3>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-0.5">
                  Daftar kehadiran pribadi Anda pada seluruh sesi pembelajaran PKBM.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-dei-line dark:border-dei-dark-line text-dei-muted">
                    <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                    <th className="py-2.5 px-3 font-semibold">Mata Pelajaran</th>
                    <th className="py-2.5 px-3 font-semibold">Waktu Masuk</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dei-line dark:divide-dei-dark-line">
                  {myAttendanceHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-3 font-mono font-medium text-dei-ink dark:text-dei-dark-ink">
                        {item.date}
                      </td>
                      <td className="py-3 px-3 font-bold text-dei-ink dark:text-dei-dark-ink">
                        {item.subject_name}
                      </td>
                      <td className="py-3 px-3 text-dei-muted">{item.time_recorded || '-'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'HADIR'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'IZIN'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : item.status === 'SAKIT'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-dei-muted italic max-w-[250px] truncate">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* TAMPILAN KHUSUS USTADZ / TUTOR / ADMIN */
        /* ======================================================== */
        <div className="space-y-6">
          {/* WIDGET PERMOHONAN IZIN/SAKIT SANTRI MENUNGGU PERSETUJUAN */}
          {pendingIzinRequests.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-600 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
                    Pengajuan Izin & Sakit Santri Menunggu Persetujuan Ustadz ({pendingIzinRequests.length})
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  Sesi KBM Hari Ini (18 Okt 2026)
                </span>
              </div>

              <div className="space-y-2">
                {pendingIzinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-dei-dark-surface border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-dei-ink dark:text-dei-dark-ink text-sm">
                          {req.student_name}
                        </span>
                        <span className="px-2 py-0.2 rounded font-bold font-mono text-[10px] bg-amber-100 text-amber-800">
                          {req.nisn}
                        </span>
                        <span className="px-2 py-0.2 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-dei-muted dark:text-dei-dark-muted">
                        Alasan: <b className="text-dei-ink dark:text-dei-dark-ink">{req.reason || req.notes}</b> • Diajukan: {req.time_recorded}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleTutorApprove(req.id, 'APPROVE')}
                        className="py-1.5 px-3 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white font-bold flex items-center gap-1 shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui (Approve)</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingAtt(req);
                          setRejectReasonInput('Alasan izin kurang lengkap atau belum ada surat keterangan.');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak Izin</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4 SUMMARY CARDS KELAS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
            <div className="p-4 rounded-xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-xs font-semibold text-dei-muted dark:text-dei-dark-muted">Persentase Hadir</span>
              <div className="text-2xl font-extrabold text-dei-emerald dark:text-dei-emerald-neon mt-1">94.4%</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">17 Hadir Tepat Waktu</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-xs font-semibold text-dei-muted dark:text-dei-dark-muted">Izin Resmi</span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">1 Santri</div>
              <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted">Surat Orang Tua</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-xs font-semibold text-dei-muted dark:text-dei-dark-muted">Sakit Berobat</span>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">1 Santri</div>
              <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted">Surat Keterangan Dokter</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-xs font-semibold text-dei-muted dark:text-dei-dark-muted">Alpa (Tanpa Ket.)</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">0 Santri</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Tertib Prima</span>
            </div>
          </div>

          {/* BARIS KONTROL & FILTER TERPADU (MUTLAK SEGARIS PENUH) */}
          <div className="flex flex-nowrap items-center justify-between gap-3 bg-white dark:bg-dei-dark-surface p-3 rounded-2xl border border-dei-line dark:border-dei-dark-line shadow-sm print:hidden overflow-x-auto min-w-0">
            {/* Sisi Kiri: Filter Dropdown Ber-sudut Elegan */}
            <div className="flex flex-nowrap items-center gap-3 flex-shrink-0">
              <CustomDropdown
                label="Periode:"
                value={attPeriod}
                onChange={setAttPeriod}
                options={[
                  { value: 'month', label: 'Bulan Ini (Oktober 2026)' },
                  { value: 'day', label: 'Hari Ini (18 Okt 2026)' },
                  { value: 'week', label: 'Pekan Ini' },
                  { value: 'all', label: 'Semua' },
                ]}
              />

              <CustomDropdown
                label="Status:"
                value={attStatusFilter}
                onChange={setAttStatusFilter}
                options={[
                  { value: 'ALL', label: 'Semua Status' },
                  { value: 'HADIR', label: 'Hadir' },
                  { value: 'IZIN', label: 'Izin' },
                  { value: 'SAKIT', label: 'Sakit' },
                  { value: 'ALPA', label: 'Alpa' },
                ]}
              />
            </div>

            {/* Sisi Kanan: Input Pencarian Santri & Tombol Ekspor PDF Segaris */}
            <div className="flex flex-nowrap items-center gap-2.5 flex-shrink-0">
              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-dei-muted" />
                <input
                  type="text"
                  placeholder="Cari santri..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                />
              </div>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                title="Download langsung file PDF rekapitulasi presensi resmi"
                className="py-2 px-3.5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 flex-shrink-0 transition-all whitespace-nowrap active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <FileDown className={`w-4 h-4 text-emerald-200 ${isExportingPdf ? 'animate-bounce' : ''}`} />
                <span>{isExportingPdf ? 'Mengunduh PDF...' : 'Ekspor PDF'}</span>
              </button>
            </div>
          </div>

          {/* NOTIFIKASI SUKSES UNDUH PDF */}
          {pdfDownloadSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fadeIn print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{pdfDownloadSuccess}</span>
              </div>
              <button
                onClick={() => setPdfDownloadSuccess('')}
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TABEL PRESENSI FORMAT RESMI DENGAN KOP SURAT */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
            {/* Kop Laporan Resmi PKBM */}
            <div className="text-center pb-4 border-b-2 border-dei-emerald space-y-1">
              <p className="text-[11px] font-bold text-dei-emerald uppercase tracking-widest">
                Yayasan Dar El Iman Padang — Pusat Kegiatan Belajar Masyarakat (PKBM)
              </p>
              <h2 className="text-base sm:text-lg font-black text-dei-ink dark:text-dei-dark-ink">
                DAFTAR REKAPITULASI PRESENSI KEHADIRAN KBM SANTRI
              </h2>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted">
                Rombel: <b>Kelas X Paket C — Umar bin Khattab</b> • Tahun Ajaran: <b>2026/2027 Ganjil</b> • Periode: <b>Oktober 2026</b>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-dei-line dark:border-dei-dark-line text-dei-ink dark:text-dei-dark-ink font-bold bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Nama Santri</th>
                    <th className="py-2.5 px-3">Mata Pelajaran</th>
                    <th className="py-2.5 px-3 text-center">Waktu Masuk</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Catatan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dei-line dark:divide-dei-dark-line">
                  {filteredAttendance.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 text-center font-mono text-dei-muted">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-dei-muted whitespace-nowrap">{item.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-dei-ink dark:text-dei-dark-ink whitespace-nowrap">
                        {item.nisn}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-dei-ink dark:text-dei-dark-ink">
                        {item.student_name}
                      </td>
                      <td className="py-2.5 px-3 text-dei-muted whitespace-nowrap">{item.subject_name}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-dei-muted">{item.time_recorded || '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'HADIR'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'IZIN'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : item.status === 'SAKIT'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-dei-muted italic text-[11px] max-w-[200px] truncate">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-dei-muted">
                        Tidak ada data presensi yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Kolom Tanda Tangan Resmi (Cetak / PDF) */}
            <div className="pt-8 pb-4 flex justify-between text-xs text-dei-ink dark:text-dei-dark-ink">
              <div className="text-center space-y-12">
                <p>Mengetahui,<br /><b>Direktur PKBM Digital Dar El Iman</b></p>
                <div>
                  <p className="font-bold underline">Dr. Muhammad Ridwan, Lc., M.Pd.</p>
                  <p className="text-[11px] text-dei-muted">NIY. 201208 001</p>
                </div>
              </div>
              <div className="text-center space-y-12">
                <p>Padang, 18 Oktober 2026<br /><b>{isWaliKelas ? 'Wali Kelas X Paket C' : 'Tutor / Ustadz Pengampu KBM'}</b></p>
                <div>
                  <p className="font-bold underline">{user?.full_name || 'Ustadz Ahmad Fauzi, Lc.'}</p>
                  <p className="text-[11px] text-dei-muted">NIY. 201809 045</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL AJUKAN IZIN / SAKIT SANTRI */}
      {/* ======================================================== */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-dei-line dark:border-dei-dark-line space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                  Permohonan Izin / Sakit KBM
                </h3>
              </div>
              <button
                onClick={() => setShowIzinModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4 text-dei-muted" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-dei-ink dark:text-dei-dark-ink block mb-1">
                  Jenis Ketidakhadiran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIzinType('IZIN')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      izinType === 'IZIN'
                        ? 'bg-amber-500 text-white border-amber-600 shadow'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-dei-muted border-dei-line dark:border-dei-dark-line'
                    }`}
                  >
                    Izin Urusan Keluarga
                  </button>
                  <button
                    type="button"
                    onClick={() => setIzinType('SAKIT')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      izinType === 'SAKIT'
                        ? 'bg-blue-600 text-white border-blue-700 shadow'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-dei-muted border-dei-line dark:border-dei-dark-line'
                    }`}
                  >
                    Sakit (Dengan Bukti)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-dei-ink dark:text-dei-dark-ink block mb-1">
                  Alasan Lengkap:
                </label>
                <textarea
                  rows="3"
                  value={izinReason}
                  onChange={(e) => setIzinReason(e.target.value)}
                  placeholder="Tuliskan keterangan lengkap alasan tidak dapat mengikuti kelas daring hari ini..."
                  className="w-full p-3 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-dei-ink dark:text-dei-dark-ink block mb-1">
                  Unggah Surat / Foto Bukti (Opsional):
                </label>
                <div className="p-3 rounded-xl border-2 border-dashed border-dei-line dark:border-dei-dark-line text-center hover:border-amber-500 cursor-pointer transition-colors bg-dei-bg dark:bg-dei-dark-bg">
                  <UploadCloud className="w-5 h-5 mx-auto text-dei-muted mb-1" />
                  <p className="text-[11px] text-dei-muted">
                    {izinAttachment ? 'Surat/Bukti telah dilampirkan' : 'Klik untuk unggah foto surat izin / surat dokter'}
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setIzinAttachment(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                    id="izin-file-input"
                  />
                  <label htmlFor="izin-file-input" className="text-[10px] text-amber-600 font-bold block mt-1 cursor-pointer">
                    Pilih Berkas dari Komputer/HP
                  </label>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200">
                💡 Permohonan akan masuk ke antrean approval ustadz pengampu KBM. Harap hubungi wali kelas jika sangat mendesak.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dei-line dark:border-dei-dark-line">
              <button
                type="button"
                onClick={() => setShowIzinModal(false)}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-dei-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!izinReason || checkInLoading}
                onClick={() =>
                  handleStudentCheckIn(
                    izinType,
                    izinReason,
                    izinAttachment ? `/uploads/attendance/${izinAttachment}` : ''
                  )
                }
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kirim Permohonan Izin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PENOLAKAN IZIN OLEH USTADZ */}
      {/* ======================================================== */}
      {rejectingAtt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-dei-line dark:border-dei-dark-line space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                  Tolak Pengajuan Izin Santri
                </h3>
              </div>
              <button
                onClick={() => setRejectingAtt(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4 text-dei-muted" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-dei-muted dark:text-dei-dark-muted">
                Santri: <b>{rejectingAtt.student_name}</b> ({rejectingAtt.nisn})<br />
                Alasan Diajukan: <i>"{rejectingAtt.reason || rejectingAtt.notes}"</i>
              </p>

              <div>
                <label className="font-bold text-dei-ink dark:text-dei-dark-ink block mb-1">
                  Alasan Penolakan dari Ustadz:
                </label>
                <textarea
                  rows="3"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="Tuliskan catatan mengapa permohonan izin ini ditolak..."
                  className="w-full p-3 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-900 dark:text-red-200">
                ⚠️ Santri akan melihat catatan ini di portal mereka dan diberikan kesempatan absen ulang sebelum jam KBM berakhir.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dei-line dark:border-dei-dark-line">
              <button
                type="button"
                onClick={() => setRejectingAtt(null)}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-dei-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!rejectReasonInput}
                onClick={() => handleTutorApprove(rejectingAtt.id, 'REJECT', rejectReasonInput)}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Konfirmasi Tolak Izin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresensiPage;
