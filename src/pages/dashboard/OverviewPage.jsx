import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Users,
  Award,
  AlertCircle,
  FileCheck2,
  Send,
  User,
  Phone,
  FileText,
  Upload,
  BookOpen,
  X,
  Check,
  Clock,
  Globe,
  CreditCard,
  ChevronRight,
  FileCheck,
  Info,
  Calendar,
  Lock,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  BarChart3,
  TrendingUp,
  Activity,
  CheckSquare,
  GraduationCap,
  MapPin,
  Mail,
  CalendarDays,
  BadgeCheck,
  QrCode,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getRoleDisplayBadge,
  isSantri,
  isTutor,
  isWaliSantri,
  isPimpinanOrManajemen,
  isWaliKelas
} from '../../utils/rbac';

export const OverviewPage = ({ onNavigateHome, onNavigateMenu, activeMenu = 'overview' }) => {
  const { user, token, changePassword, demoAccounts, login } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState({
    attendance: [],
    tahfizhLogs: [],
    assignments: [],
    submissions: [],
    exams: [],
    invoices: [],
    accreditationMetrics: null,
    dapodikSummary: null,
    loading: true
  });

  // Profile modal & interactive chart state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('biodata'); // 'biodata', 'akademik', 'dokumen', 'keamanan'
  const [chartPeriod, setChartPeriod] = useState('mingguan'); // 'mingguan', 'bulanan'
  const [hoveredDay, setHoveredDay] = useState(null);
  const [profileUpdateMsg, setProfileUpdateMsg] = useState('');

  // Change password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  // Template for single calon santri
  const createEmptyStudent = (idx = 1) => ({
    id: 'student-' + Date.now() + '-' + idx,
    fullName: idx === 1 && !user?.full_name?.includes('Guest') ? user?.full_name || '' : '',
    nik: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    schoolOrigin: '',
    program: 'Paket C (Setara SMA - MIPA)',
    tahfizhTarget: 'Tahfizh 5 Juz',
    useSharedKk: idx > 0,
    fileKk: null,
    fileAkta: null,
    fileIjazah: null,
    registrationNumber: '',
    status: 'SUBMITTED',
    statusNotes: 'Berkas formulir dan dokumen prasyarat pendaftaran telah diterima. Panitia sedang memverifikasi keabsahan berkas.',
    nis: '',
    user_account: null
  });

  // Data Orang Tua / Wali untuk PPDB Multi-Santri
  const [guardianData, setGuardianData] = useState(() => {
    try {
      const saved = localStorage.getItem('pkbm_guest_ppdb_registration');
      if (saved) {
        const obj = JSON.parse(saved);
        return {
          parentName: obj.parentName || obj.guardian_name || '',
          parentPhone: obj.parentPhone || obj.guardian_phone || '',
          parentEmail: obj.parentEmail || obj.email || '',
          country: obj.country || 'Indonesia',
          address: obj.address || '',
          isDiaspora: !!obj.isDiaspora
        };
      }
    } catch (e) {}
    return {
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      country: 'Indonesia',
      address: '',
      isDiaspora: false
    };
  });

  // Daftar Calon Santri (Multi-Santri / Saudara Kandung)
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('pkbm_guest_ppdb_registration');
      if (saved) {
        const obj = JSON.parse(saved);
        if (Array.isArray(obj.students) && obj.students.length > 0) return obj.students;
      }
    } catch (e) {}
    return [createEmptyStudent(1)];
  });

  const [activeStudentTab, setActiveStudentTab] = useState(0);
  const [activeTrackTab, setActiveTrackTab] = useState(0);

  const [ppdbSubmitted, setPpdbSubmitted] = useState(() => {
    try {
      const saved = localStorage.getItem('pkbm_guest_ppdb_registration');
      if (saved) {
        const obj = JSON.parse(saved);
        return !!obj.submitted;
      }
    } catch (e) {}
    return false;
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backward compatibility alias
  const forms = students;
  const setForms = setStudents;
  const activeFormIndex = activeStudentTab;
  const setActiveFormIndex = setActiveStudentTab;

  // Live Sync with Admin PPDB Desk changes
  useEffect(() => {
    try {
      const adminRegsStr = localStorage.getItem('pkbm_ppdb_new_registrations');
      if (adminRegsStr && forms.length > 0) {
        const adminRegs = JSON.parse(adminRegsStr);
        let updated = false;

        const newForms = forms.map(f => {
          if (!f.registrationNumber && !f.fullName) return f;
          const match = adminRegs.find(ar =>
            (ar.registration_number && ar.registration_number === f.registrationNumber) ||
            (ar.full_name && f.fullName && ar.full_name.toLowerCase() === f.fullName.toLowerCase())
          );
          if (match && (match.status !== f.status || match.nis !== f.nis || (match.selection_notes || match.doc_notes) !== f.statusNotes)) {
            updated = true;
            return {
              ...f,
              status: match.status || f.status,
              statusNotes: match.selection_notes || match.doc_notes || f.statusNotes,
              nis: match.nis || f.nis,
              user_account: match.user_account || f.user_account
            };
          }
          return f;
        });

        if (updated) {
          setForms(newForms);
          localStorage.setItem('pkbm_ppdb_forms', JSON.stringify(newForms));
        }
      }
    } catch (e) {}
  }, [activeMenu]);

  useEffect(() => {
    const fetchHealthAndMetrics = async () => {
      try {
        const [healthRes, attRes, thfRes, asgRes, submRes, examRes, invRes, accRes, dapoRes] = await Promise.allSettled([
          fetch('/api/v1/health'),
          fetch('/api/v1/curriculum/attendance'),
          fetch('/api/v1/tahfizh/logs'),
          fetch('/api/v1/assignments'),
          fetch('/api/v1/assignments/submissions'),
          fetch('/api/v1/exams'),
          fetch('/api/v1/finance/invoices'),
          fetch('/api/v1/quality/accreditation/checklist'),
          fetch('/api/v1/dapodik/validation-audit')
        ]);

        if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
          const json = await healthRes.value.json();
          setHealthData(json);
        }

        const attendance = attRes.status === 'fulfilled' && attRes.value.ok ? await attRes.value.json() : [];
        const tahfizhLogs = thfRes.status === 'fulfilled' && thfRes.value.ok ? await thfRes.value.json() : [];
        const assignments = asgRes.status === 'fulfilled' && asgRes.value.ok ? await asgRes.value.json() : [];
        const submissions = submRes.status === 'fulfilled' && submRes.value.ok ? await submRes.value.json() : [];
        const exams = examRes.status === 'fulfilled' && examRes.value.ok ? await examRes.value.json() : [];
        const invoices = invRes.status === 'fulfilled' && invRes.value.ok ? await invRes.value.json() : [];
        const accreditation = accRes.status === 'fulfilled' && accRes.value.ok ? await accRes.value.json() : null;
        const dapodik = dapoRes.status === 'fulfilled' && dapoRes.value.ok ? await dapoRes.value.json() : null;

        setMetricsData({
          attendance: Array.isArray(attendance) ? attendance : (attendance?.data || []),
          tahfizhLogs: Array.isArray(tahfizhLogs) ? tahfizhLogs : (tahfizhLogs?.data || []),
          assignments: Array.isArray(assignments) ? assignments : (assignments?.data || []),
          submissions: Array.isArray(submissions) ? submissions : (submissions?.data || []),
          exams: Array.isArray(exams) ? exams : (exams?.data || []),
          invoices: Array.isArray(invoices) ? invoices : (invoices?.data || []),
          accreditationMetrics: accreditation?.metrics || null,
          dapodikSummary: dapodik?.summary || dapodik || null,
          loading: false
        });
      } catch (err) {
        console.error('Gagal mengambil status health & metrik backend:', err);
        setMetricsData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchHealthAndMetrics();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });
    setPassSubmitting(true);

    const res = await changePassword({
      currentPassword: currentPass,
      newPassword: newPass,
      confirmPassword: confirmPass,
    });
    setPassSubmitting(false);

    if (res.success) {
      setPassMessage({ type: 'success', text: res.message });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassMessage({ type: 'error', text: res.message });
    }
  };

  const handleQuickSwitchRole = (demo) => {
    login(demo.username, demo.password);
  };

  // Multi-Student Handlers
  const handleAddStudent = () => {
    if (students.length >= 3) {
      alert('Maksimal penambahan 3 calon santri dalam satu formulir pendaftaran keluarga (saudara kandung).');
      return;
    }
    const newStudent = createEmptyStudent(students.length + 1);
    setStudents(prev => [...prev, newStudent]);
    setActiveStudentTab(students.length);
  };

  const handleRemoveStudent = (idxToRemove) => {
    if (students.length <= 1) return;
    setStudents(prev => prev.filter((_, idx) => idx !== idxToRemove));
    if (activeStudentTab >= idxToRemove && activeStudentTab > 0) {
      setActiveStudentTab(activeStudentTab - 1);
    }
    if (activeTrackTab >= idxToRemove && activeTrackTab > 0) {
      setActiveTrackTab(activeTrackTab - 1);
    }
  };

  const updateStudentField = (idx, field, value) => {
    setStudents(prev => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], [field]: value };
      return clone;
    });
  };

  const handleStudentFileChange = (idx, fileType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const fileObj = {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type,
        dataUrl: reader.result
      };
      setStudents(prev => {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], [fileType]: fileObj };
        return clone;
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit validation
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!guardianData.parentName.trim() || !guardianData.parentPhone.trim() || !guardianData.parentEmail.trim()) {
      alert('Mohon lengkapi Data Orang Tua / Wali (Nama, Nomor WhatsApp, dan Email wajib diisi).');
      return;
    }
    for (let i = 0; i < students.length; i++) {
      const st = students[i];
      if (!st.fullName.trim() || !st.nik.trim() || !st.birthPlace.trim() || !st.birthDate) {
        alert(`Mohon lengkapi Biodata Calon Santri #${i + 1} (${st.fullName || 'Calon Santri'}).`);
        return;
      }
      const effectiveKk = (i > 0 && st.useSharedKk) ? students[0].fileKk : st.fileKk;
      if (!effectiveKk) {
        alert(`Mohon unggah Scan Kartu Keluarga untuk Calon Santri #${i + 1} (${st.fullName}).`);
        return;
      }
      if (!st.fileAkta) {
        alert(`Mohon unggah Scan Akta Kelahiran untuk Calon Santri #${i + 1} (${st.fullName}).`);
        return;
      }
    }
    setShowConfirmModal(true);
  };

  // Confirm and send to backend PPDB & admin seeder storage
  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updatedStudents = students.map((st, i) => ({
        ...st,
        registrationNumber: st.registrationNumber || ('REG-2027-' + Math.floor(100 + Math.random() * 890)),
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
      }));

      for (const st of updatedStudents) {
        const targetPkg = st.program.includes('Paket A') ? 'PAKET_A' : st.program.includes('Paket B') ? 'PAKET_B' : 'PAKET_C';
        const payload = {
          target_package: targetPkg,
          full_name: st.fullName,
          gender: st.gender === 'Perempuan' ? 'P' : 'L',
          nik: st.nik,
          nisn: '009' + Math.floor(1000000 + Math.random() * 9000000),
          birth_place: st.birthPlace,
          birth_date: st.birthDate || '2010-01-01',
          phone: guardianData.parentPhone,
          email: guardianData.parentEmail,
          is_diaspora: st.program.includes('Diaspora') || guardianData.isDiaspora,
          country: guardianData.country || 'Indonesia',
          timezone: 'Asia/Jakarta (WIB)',
          guardian_name: guardianData.parentName,
          guardian_phone: guardianData.parentPhone,
          guardian_relationship: 'Orang Tua / Wali',
          notes: `PPDB Multi-Santri. Asal Sekolah: ${st.schoolOrigin || '-'}. Target Tahfizh: ${st.tahfizhTarget}. Berkas: KK (${(st.useSharedKk ? updatedStudents[0].fileKk?.name : st.fileKk?.name) || 'kk.pdf'}), Akta (${st.fileAkta?.name || 'akta.pdf'})`
        };

        try {
          await fetch('/api/v1/ppdb/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          console.warn('Backend register sync fallback:', e);
        }

        try {
          const adminExisting = JSON.parse(localStorage.getItem('pkbm_ppdb_new_registrations') || '[]');
          const adminRecord = {
            id: 'preg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            registration_number: st.registrationNumber,
            full_name: st.fullName,
            gender: st.gender === 'Perempuan' ? 'P' : 'L',
            target_package: targetPkg,
            nik: st.nik,
            nisn: payload.nisn,
            phone: guardianData.parentPhone,
            email: guardianData.parentEmail,
            guardian_name: guardianData.parentName,
            guardian_phone: guardianData.parentPhone,
            guardian_relationship: 'Orang Tua / Wali',
            status: 'SUBMITTED',
            is_diaspora: guardianData.country !== 'Indonesia',
            country: guardianData.country,
            timezone: 'Asia/Jakarta (WIB)',
            notes: payload.notes,
            created_at: new Date().toISOString(),
            documents: [
              { id: 'doc-kk-' + Date.now(), document_type: 'KK', file_url: '#', dataUrl: st.fileKk?.dataUrl, verification_notes: `File: ${st.fileKk?.name || 'kk.pdf'}`, is_verified: false },
              { id: 'doc-akta-' + Date.now(), document_type: 'AKTA_LAHIR', file_url: '#', dataUrl: st.fileAkta?.dataUrl, verification_notes: `File: ${st.fileAkta?.name || 'akta.pdf'}`, is_verified: false },
              ...(st.fileIjazah ? [{ id: 'doc-ijazah-' + Date.now(), document_type: 'IJAZAH_SEBELUMNYA', file_url: '#', dataUrl: st.fileIjazah?.dataUrl, verification_notes: `File: ${st.fileIjazah?.name || 'ijazah.pdf'}`, is_verified: false }] : [])
            ]
          };
          localStorage.setItem('pkbm_ppdb_new_registrations', JSON.stringify([adminRecord, ...adminExisting]));
        } catch (e) {}
      }

      setStudents(updatedStudents);
      setPpdbSubmitted(true);
      localStorage.setItem('pkbm_guest_ppdb_registration', JSON.stringify({
        ...guardianData,
        students: updatedStudents,
        submitted: true,
        submittedAt: new Date().toISOString()
      }));

      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Terjadi kesalahan saat mengirim formulir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper copy registration number
  const copyRegNumber = (num) => {
    navigator.clipboard?.writeText(num);
    alert(`Nomor registrasi ${num} berhasil disalin!`);
  };

  // ========================================================
  // IF USER IS GUEST PPDB: RENDER PPDB APPLICATION SUITE
  // ========================================================
  if (user?.role_name === 'GUEST_PPDB') {
    const trackedStudent = students[activeTrackTab] || students[0] || {};

    return (
      <div className="space-y-6 pb-12">
        {/* Banner PPDB Guest */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white relative overflow-hidden shadow-xl border border-emerald-700/40">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-300 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Penerimaan Santri Baru (PPDB) Multi-Santri TA 2027/2028</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Portal Pendaftaran Santri Baru — PKBM Digital Dar El Iman
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-2 leading-relaxed">
            Ahlan wa Sahlan! Anda dapat mendaftarkan <b>hingga 3 calon santri sekaligus (saudara kandung)</b> dalam satu formulir wali, dengan berkas dan pilihan program masing-masing.
          </p>
        </div>

        {/* ======================================================== */}
        {/* SUBMENU 1: FORMULIR PENDAFTARAN (OVERVIEW) */}
        {/* ======================================================== */}
        {activeMenu === 'overview' && (
          <div className="space-y-6">
            {ppdbSubmitted && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
                <div className="space-y-1">
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Berkas Pendaftaran ({students.length} Santri) Telah Dikirim & Terkunci</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                    Santri terdaftar:{' '}
                    {students.map((st, i) => (
                      <span key={st.id || i} className="font-semibold">
                        {st.fullName || `Santri #${i + 1}`} (<span className="font-mono text-emerald-900 dark:text-emerald-100">{st.registrationNumber || 'REG-2027-003'}</span>){i < students.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateMenu && onNavigateMenu('status')}
                  className="px-4 py-2 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lihat Status Seleksi Santri →</span>
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Card 1: Data Orang Tua / Wali (Shared for all siblings) */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
                  <div>
                    <h2 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      1. Data Orang Tua / Wali & Kontak Keluarga (Satu Keluarga)
                    </h2>
                    <p className="text-xs text-dei-muted mt-0.5">
                      Kontak resmi ini digunakan untuk notifikasi seleksi seluruh anak yang didaftarkan.
                    </p>
                  </div>
                  {ppdbSubmitted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                      <Lock className="w-3 h-3" /> Terkunci
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                      Nama Lengkap Orang Tua / Wali *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={ppdbSubmitted}
                      value={guardianData.parentName}
                      onChange={(e) => setGuardianData({ ...guardianData, parentName: e.target.value })}
                      placeholder="Contoh: Ir. Hendra Gunawan / Ummu Ziyad"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                      Nomor WhatsApp Aktif Wali * (Untuk Wawancara & Info Seleksi)
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={ppdbSubmitted}
                      value={guardianData.parentPhone}
                      onChange={(e) => setGuardianData({ ...guardianData, parentPhone: e.target.value })}
                      placeholder="Contoh: 081234567890..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                      Alamat Email Aktif * (Pengiriman Akun LMS & Pengumuman SK)
                    </label>
                    <input
                      type="email"
                      required
                      disabled={ppdbSubmitted}
                      value={guardianData.parentEmail}
                      onChange={(e) => setGuardianData({ ...guardianData, parentEmail: e.target.value })}
                      placeholder="Contoh: walisantri@gmail.com..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                      Negara Domisili *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={ppdbSubmitted}
                      value={guardianData.country}
                      onChange={(e) => setGuardianData({ ...guardianData, country: e.target.value })}
                      placeholder="Indonesia / Arab Saudi / Qatar / Malaysia..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                      Alamat Lengkap Domisili Keluarga
                    </label>
                    <input
                      type="text"
                      disabled={ppdbSubmitted}
                      value={guardianData.address}
                      onChange={(e) => setGuardianData({ ...guardianData, address: e.target.value })}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Multi-Student Form Header & Tabs */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dei-line dark:border-dei-dark-line">
                  <div>
                    <h2 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                      <User className="w-5 h-5 text-dei-emerald" />
                      2. Data Calon Santri ({students.length} Santri Didaftarkan)
                    </h2>
                    <p className="text-xs text-dei-muted mt-0.5">
                      Pilih tab di bawah untuk mengisi data dan berkas masing-masing calon santri.
                    </p>
                  </div>

                  {!ppdbSubmitted && students.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 font-bold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>+ Tambah Santri #{students.length + 1} (Maks. 3)</span>
                    </button>
                  )}
                </div>

                {/* Multi-Student Tab Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {students.map((st, idx) => {
                    const isActive = activeStudentTab === idx;
                    return (
                      <button
                        key={st.id || idx}
                        type="button"
                        onClick={() => setActiveStudentTab(idx)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                          isActive
                            ? 'bg-dei-emerald text-white shadow-md'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-dei-muted hover:text-dei-ink hover:bg-neutral-200'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                        }`}>
                          {idx + 1}
                        </span>
                        <span>{st.fullName || `Calon Santri #${idx + 1}`}</span>
                        {idx > 0 && !ppdbSubmitted && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStudent(idx);
                            }}
                            className="p-1 hover:bg-white/20 rounded-lg ml-1 text-white/80 hover:text-white"
                            title="Hapus santri ini"
                          >
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Student Form Fields */}
                {students[activeStudentTab] && (() => {
                  const currentSt = students[activeStudentTab];
                  const idx = activeStudentTab;
                  const effectiveKk = (idx > 0 && currentSt.useSharedKk) ? students[0].fileKk : currentSt.fileKk;

                  return (
                    <div className="space-y-6 pt-2 animate-in fade-in">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          Sedang Mengisi: <b>Calon Santri #{idx + 1}</b> {currentSt.fullName ? `(${currentSt.fullName})` : ''}
                        </span>
                        {idx > 0 && !ppdbSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(idx)}
                            className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Santri #{idx + 1}</span>
                          </button>
                        )}
                      </div>

                      {/* Biodata Anak */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                            Nama Lengkap Calon Santri #{idx + 1} *
                          </label>
                          <input
                            type="text"
                            required
                            disabled={ppdbSubmitted}
                            value={currentSt.fullName}
                            onChange={(e) => updateStudentField(idx, 'fullName', e.target.value)}
                            placeholder="Contoh: Muhammad Abdullah Ziyad"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                            Nomor Induk Kependudukan (NIK) Calon Santri *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={16}
                            disabled={ppdbSubmitted}
                            value={currentSt.nik}
                            onChange={(e) => updateStudentField(idx, 'nik', e.target.value)}
                            placeholder="16 digit NIK sesuai KK..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                            Tempat & Tanggal Lahir *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              disabled={ppdbSubmitted}
                              value={currentSt.birthPlace}
                              onChange={(e) => updateStudentField(idx, 'birthPlace', e.target.value)}
                              placeholder="Kota Lahir..."
                              className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <input
                              type="date"
                              required
                              disabled={ppdbSubmitted}
                              value={currentSt.birthDate}
                              onChange={(e) => updateStudentField(idx, 'birthDate', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                            Jenis Kelamin *
                          </label>
                          <select
                            disabled={ppdbSubmitted}
                            value={currentSt.gender}
                            onChange={(e) => updateStudentField(idx, 'gender', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="Laki-laki">Laki-laki (Ikhwan)</option>
                            <option value="Perempuan">Perempuan (Akhwat)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                            Asal Sekolah Sebelumnya
                          </label>
                          <input
                            type="text"
                            disabled={ppdbSubmitted}
                            value={currentSt.schoolOrigin}
                            onChange={(e) => updateStudentField(idx, 'schoolOrigin', e.target.value)}
                            placeholder="Nama SD/SMP/Pondok Pesantren sebelumnya..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Program & Kurikulum Tahfizh Santri ini */}
                      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-3">
                        <span className="font-bold text-xs text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-dei-gold" />
                          Pilihan Program Kesetaraan & Target Tahfizh Santri #{idx + 1}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-dei-muted mb-1">
                              Jenjang Pendidikan Kesetaraan
                            </label>
                            <select
                              disabled={ppdbSubmitted}
                              value={currentSt.program}
                              onChange={(e) => updateStudentField(idx, 'program', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="Paket A (Setara SD)">Paket A (Setara SD) — Program Pondasi & Adab</option>
                              <option value="Paket B (Setara SMP)">Paket B (Setara SMP) — Kurikulum Merdeka + Diniyyah</option>
                              <option value="Paket C (Setara SMA - MIPA)">Paket C (Setara SMA) — Peminatan MIPA</option>
                              <option value="Paket C (Setara SMA - IPS)">Paket C (Setara SMA) — Peminatan IPS</option>
                              <option value="Santri Diaspora Luar Negeri">Santri Diaspora (Online Luar Negeri & Lintas Waktu)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-dei-muted mb-1">
                              Target Kurikulum Tahfizh
                            </label>
                            <select
                              disabled={ppdbSubmitted}
                              value={currentSt.tahfizhTarget}
                              onChange={(e) => updateStudentField(idx, 'tahfizhTarget', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="Tahfizh Reguler">Tahfizh Reguler (Juz 30 & Surah Pilihan)</option>
                              <option value="Tahfizh 5 Juz">Target 5 Juz Mutqin</option>
                              <option value="Tahfizh 15 Juz">Target 15 Juz Intensif</option>
                              <option value="Tahfizh 30 Juz Bersanad">Target 30 Juz Bersanad Hafsh 'an 'Ashim</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Berkas Persyaratan Santri Ini */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="font-bold text-xs text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-purple-600" />
                            Unggah Dokumen Calon Santri #{idx + 1} (PDF / JPG / PNG)
                          </span>

                          {/* Sibling Shared KK Toggle for Sibling 2 & 3 */}
                          {idx > 0 && !ppdbSubmitted && (
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                              <input
                                type="checkbox"
                                checked={currentSt.useSharedKk}
                                onChange={(e) => updateStudentField(idx, 'useSharedKk', e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>Gunakan Scan Kartu Keluarga yang sama dengan Santri #1</span>
                            </label>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* File 1: Scan KK */}
                          <div className="p-4 rounded-2xl border-2 border-dashed border-dei-line dark:border-dei-dark-line bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-dei-ink dark:text-dei-dark-ink">1. Scan Kartu Keluarga *</span>
                                {effectiveKk ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Terunggah
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-500 font-bold">Wajib</span>
                                )}
                              </div>
                              <p className="text-[11px] text-dei-muted mt-1 leading-snug">
                                {idx > 0 && currentSt.useSharedKk
                                  ? 'Otomatis menggunakan berkas KK yang diunggah pada Santri #1 (Satu Kartu Keluarga).'
                                  : 'Scan Kartu Keluarga resmi Dukcapil calon santri.'}
                              </p>
                            </div>

                            {idx > 0 && currentSt.useSharedKk ? (
                              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
                                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Tersambung ke KK Santri #1</span>
                                </div>
                                <span className="text-[10px] text-dei-muted block truncate mt-0.5">
                                  {students[0]?.fileKk?.name || 'Menunggu unggahan KK pada Santri #1'}
                                </span>
                              </div>
                            ) : currentSt.fileKk ? (
                              <div className="p-2.5 rounded-xl bg-white dark:bg-dei-dark-surface border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                                <div className="truncate pr-2">
                                  <span className="font-bold block truncate text-emerald-700 dark:text-emerald-300">{currentSt.fileKk.name}</span>
                                  <span className="text-[10px] text-dei-muted">{currentSt.fileKk.size}</span>
                                </div>
                                {!ppdbSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() => updateStudentField(idx, 'fileKk', null)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <label className={`cursor-pointer w-full py-3 px-4 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-center text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm ${ppdbSubmitted ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5 text-dei-emerald" />
                                <span>Pilih File KK</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={ppdbSubmitted}
                                  onChange={(e) => handleStudentFileChange(idx, 'fileKk', e)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          {/* File 2: Scan Akta Kelahiran */}
                          <div className="p-4 rounded-2xl border-2 border-dashed border-dei-line dark:border-dei-dark-line bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-dei-ink dark:text-dei-dark-ink">2. Scan Akta Lahir *</span>
                                {currentSt.fileAkta ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Terunggah
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-500 font-bold">Wajib</span>
                                )}
                              </div>
                              <p className="text-[11px] text-dei-muted mt-1 leading-snug">
                                Akta Kelahiran resmi khusus atas nama Calon Santri #{idx + 1}.
                              </p>
                            </div>

                            {currentSt.fileAkta ? (
                              <div className="p-2.5 rounded-xl bg-white dark:bg-dei-dark-surface border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                                <div className="truncate pr-2">
                                  <span className="font-bold block truncate text-emerald-700 dark:text-emerald-300">{currentSt.fileAkta.name}</span>
                                  <span className="text-[10px] text-dei-muted">{currentSt.fileAkta.size}</span>
                                </div>
                                {!ppdbSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() => updateStudentField(idx, 'fileAkta', null)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <label className={`cursor-pointer w-full py-3 px-4 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-center text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm ${ppdbSubmitted ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5 text-dei-emerald" />
                                <span>Pilih File Akta</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={ppdbSubmitted}
                                  onChange={(e) => handleStudentFileChange(idx, 'fileAkta', e)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          {/* File 3: Ijazah / Rapor */}
                          <div className="p-4 rounded-2xl border-2 border-dashed border-dei-line dark:border-dei-dark-line bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-dei-ink dark:text-dei-dark-ink">3. Ijazah / Rapor</span>
                                {currentSt.fileIjazah ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Terunggah
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-dei-muted font-bold">Opsional</span>
                                )}
                              </div>
                              <p className="text-[11px] text-dei-muted mt-1 leading-snug">
                                Ijazah jenjang sebelumnya (SD/SMP) atau buku rapor terakhir.
                              </p>
                            </div>

                            {currentSt.fileIjazah ? (
                              <div className="p-2.5 rounded-xl bg-white dark:bg-dei-dark-surface border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                                <div className="truncate pr-2">
                                  <span className="font-bold block truncate text-emerald-700 dark:text-emerald-300">{currentSt.fileIjazah.name}</span>
                                  <span className="text-[10px] text-dei-muted">{currentSt.fileIjazah.size}</span>
                                </div>
                                {!ppdbSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() => updateStudentField(idx, 'fileIjazah', null)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <label className={`cursor-pointer w-full py-3 px-4 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-center text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm ${ppdbSubmitted ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5 text-dei-emerald" />
                                <span>Pilih Ijazah / Rapor</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={ppdbSubmitted}
                                  onChange={(e) => handleStudentFileChange(idx, 'fileIjazah', e)}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                {ppdbSubmitted ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Formulir pendaftaran ({students.length} santri) sudah berhasil dikirim
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateMenu && onNavigateMenu('status')}
                      className="py-3 px-8 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white font-extrabold text-sm shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
                    >
                      <Search className="w-4 h-4" />
                      <span>Pantau Status Seleksi Santri →</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="py-3.5 px-8 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white font-extrabold text-sm shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Periksa & Kirim Berkas Pendaftaran ({students.length} Santri) →</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBMENU 2: STATUS & TRACKING PENDAFTARAN (PPDB TRACKER) */}
        {/* ======================================================== */}
        {activeMenu === 'status' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
            {/* Multi-Student Tracking Switcher Pills */}
            {students.length > 1 && (
              <div className="p-3 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm flex items-center justify-between gap-3 overflow-x-auto">
                <span className="text-xs font-bold text-dei-muted whitespace-nowrap pl-2">
                  Pilih Santri yang Dipantau:
                </span>
                <div className="flex items-center gap-2">
                  {students.map((st, idx) => {
                    const isTracked = activeTrackTab === idx;
                    return (
                      <button
                        key={st.id || idx}
                        onClick={() => setActiveTrackTab(idx)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                          isTracked
                            ? 'bg-dei-emerald text-white shadow-md'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-dei-muted hover:text-dei-ink'
                        }`}
                      >
                        <span>{st.gender === 'Perempuan' ? '👧' : '👦'}</span>
                        <span>Santri #{idx + 1}: {st.fullName || 'Calon Santri'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isTracked ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {st.status === 'ACCEPTED' ? '✓ Diterima' : st.status === 'TEST_PASSED' ? 'Lulus Tes' : st.status === 'DOCUMENTS_VERIFIED' ? 'Berkas Valid' : 'Verifikasi'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dei-line dark:border-dei-dark-line">
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                    TRACKING PPDB ONLINE • SANTRI #{activeTrackTab + 1}
                  </span>
                  <h2 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink">
                    Status Seleksi: {trackedStudent.fullName || 'Calon Santri'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-dei-muted">
                      No. Registrasi: <b className="font-mono text-emerald-700 dark:text-emerald-300">{trackedStudent.registrationNumber || 'REG-2027-003'}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyRegNumber(trackedStudent.registrationNumber || 'REG-2027-003')}
                      className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                      title="Salin Nomor Registrasi"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-dei-muted">• Jenjang: <b>{trackedStudent.program || 'Paket C'}</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackedStudent.status === 'ACCEPTED' ? (
                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Lulus & Resmi Diterima
                    </span>
                  ) : trackedStudent.status === 'TEST_PASSED' ? (
                    <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Langkah 3: Penetapan SK & NIS
                    </span>
                  ) : trackedStudent.status === 'DOCUMENTS_VERIFIED' ? (
                    <span className="px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Langkah 2: Placement Test Tahfizh
                    </span>
                  ) : trackedStudent.status === 'REJECTED' ? (
                    <span className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Belum Memenuhi Syarat
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Langkah 1: Verifikasi Berkas
                    </span>
                  )}
                </div>
              </div>

              {/* Acceptance Banner if Lulus & Akun Diterbitkan */}
              {trackedStudent.status === 'ACCEPTED' && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-3 shadow-lg animate-in zoom-in-95">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-amber-300 flex-shrink-0" />
                    <div>
                      <h3 className="font-black text-base">Mubarak! Calon Santri Resmi Diterima di PKBM Digital Dar El Iman</h3>
                      <p className="text-xs text-emerald-100">Nomor Induk Santri (NIS) dan Akun Belajar LMS Resmi telah diterbitkan:</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                      <span className="text-emerald-200 block text-[10px]">Nomor Induk Santri (NIS) Resmi:</span>
                      <span className="font-mono font-black text-sm text-amber-300">{trackedStudent.nis || '202710005'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                      <span className="text-emerald-200 block text-[10px]">Akun Belajar LMS Siswa:</span>
                      <span className="font-mono font-bold text-xs text-white">
                        User: {trackedStudent.user_account?.username || 'santri.' + (trackedStudent.fullName?.split(' ')[0] || 'siswa').toLowerCase()} / Sandi: {trackedStudent.user_account?.temporary_password || 'Santri2027!'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 3-Stage Progress Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Stage 1 */}
                <div className={`p-4 rounded-2xl border-2 space-y-2 ${
                  trackedStudent.status === 'DOCUMENTS_VERIFIED' || trackedStudent.status === 'TEST_PASSED' || trackedStudent.status === 'ACCEPTED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                    : trackedStudent.status === 'SUBMITTED'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-dei-line'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {(trackedStudent.status === 'DOCUMENTS_VERIFIED' || trackedStudent.status === 'TEST_PASSED' || trackedStudent.status === 'ACCEPTED') ? '✓' : '1'}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                      {(trackedStudent.status === 'DOCUMENTS_VERIFIED' || trackedStudent.status === 'TEST_PASSED' || trackedStudent.status === 'ACCEPTED') ? 'Lolos Sah' : 'Sedang Berjalan'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">1. Verifikasi Berkas & Identitas</h3>
                  <p className="text-[11px] text-dei-muted leading-relaxed">
                    Pemeriksaan keabsahan NIK, Kartu Keluarga, Akta Lahir, dan formulir pendaftaran oleh Panitia PPDB.
                  </p>
                </div>

                {/* Stage 2 */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  trackedStudent.status === 'TEST_PASSED' || trackedStudent.status === 'ACCEPTED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500'
                    : trackedStudent.status === 'DOCUMENTS_VERIFIED'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-500'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-dei-line opacity-75'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                      {(trackedStudent.status === 'TEST_PASSED' || trackedStudent.status === 'ACCEPTED') ? '✓' : '2'}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300">
                      {(trackedStudent.status === 'TEST_PASSED' || trackedStudent.status === 'ACCEPTED') ? 'Lulus Mumtaz' : trackedStudent.status === 'DOCUMENTS_VERIFIED' ? 'Jadwal Tes Daring' : 'Belum Dimulai'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">2. Placement Test Tahfizh</h3>
                  <p className="text-[11px] text-dei-muted leading-relaxed">
                    Uji baca Al-Qur'an (makharijul huruf & tajwid) dan wawancara komitmen belajar daring santri & wali.
                  </p>
                </div>

                {/* Stage 3 */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  trackedStudent.status === 'ACCEPTED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500'
                    : trackedStudent.status === 'TEST_PASSED'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-dei-line opacity-75'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {trackedStudent.status === 'ACCEPTED' ? '✓' : '3'}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">
                      {trackedStudent.status === 'ACCEPTED' ? 'Diterima Resmi' : trackedStudent.status === 'TEST_PASSED' ? 'Penerbitan SK & NIS' : 'Langkah Akhir'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">3. Penetapan SK & Akun LMS</h3>
                  <p className="text-[11px] text-dei-muted leading-relaxed">
                    Penerbitan SK Direktur, Nomor Induk Santri (NIS) resmi, dan pembuatan akun email LMS untuk KBM daring.
                  </p>
                </div>
              </div>

              {/* Official Notes from Committee */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line space-y-2">
                <span className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Catatan Panitia Seleksi PPDB ({trackedStudent.fullName}):
                </span>
                <p className="text-xs text-dei-muted leading-relaxed bg-white dark:bg-dei-dark-surface p-3 rounded-xl border border-dei-line dark:border-dei-dark-line">
                  {trackedStudent.statusNotes || 'Berkas formulir dan dokumen prasyarat pendaftaran telah diterima. Panitia sedang memverifikasi keabsahan berkas.'}
                </p>
              </div>

              {/* Kontak Konfirmasi */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <span className="font-bold block">Saluran Resmi Notifikasi Seleksi:</span>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Panitia akan menghubungi wali santri melalui WhatsApp: <b>{guardianData.parentPhone || '0812-XXXX-XXXX'}</b> dan Email: <b>{guardianData.parentEmail || 'walisantri@darel-iman.or.id'}</b>. Simpan nomor resmi sekretariat: +62 821-7000-0000.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBMENU 3: INFO PROGRAM KESETARAAN */}
        {/* ======================================================== */}
        {activeMenu === 'program' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">Paket A (Setara SD)</span>
                <h3 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink">Pendidikan Dasar & Karakter</h3>
                <p className="text-xs text-dei-muted leading-relaxed">
                  Fokus pondasi membaca, menulis, berhitung, akidah dasar, hafalan juz 30 mutqin, serta adab harian sunnah nabawiyyah.
                </p>
                <div className="text-[11px] text-dei-muted space-y-1 pt-2 border-t border-dei-line dark:border-dei-dark-line">
                  <div>• Usia: 7 - 12 Tahun / Dewasa</div>
                  <div>• Kurikulum: Merdeka Terpadu</div>
                  <div>• Ijazah: Resmi Kemendikbudristek</div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">Paket B (Setara SMP)</span>
                <h3 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink">Akademik & Bahasa Arab</h3>
                <p className="text-xs text-dei-muted leading-relaxed">
                  Penguatan sains dan literasi, bahasa Arab dasar, tajwid bersanad, hafalan 5-10 juz, dan persiapan menuju jenjang menengah.
                </p>
                <div className="text-[11px] text-dei-muted space-y-1 pt-2 border-t border-dei-line dark:border-dei-dark-line">
                  <div>• Usia: Lulusan SD / Sederajat</div>
                  <div>• Durasi: 3 Tahun Pendidikan</div>
                  <div>• Ijazah: Resmi Ber-QR Code</div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-extrabold text-xs">Paket C (Setara SMA)</span>
                <h3 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink">Peminatan MIPA & IPS</h3>
                <p className="text-xs text-dei-muted leading-relaxed">
                  Kesiapan masuk Perguruan Tinggi Negeri (SNBP/SNBT) maupun universitas luar negeri (Timur Tengah & Barat), bekal wirausaha, serta IT skill.
                </p>
                <div className="text-[11px] text-dei-muted space-y-1 pt-2 border-t border-dei-line dark:border-dei-dark-line">
                  <div>• Peminatan: MIPA atau IPS</div>
                  <div>• Tahfizh: Hingga 30 Juz Bersanad</div>
                  <div>• Ijazah: Resmi SNPMB Eligible</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBMENU 4: KURIKULUM & TAHFIZH */}
        {/* ======================================================== */}
        {activeMenu === 'kurikulum' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
              <h2 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                <Award className="w-5 h-5 text-dei-gold" />
                Sinergi Kurikulum Merdeka & Halaqah Tahfizh Bersanad
              </h2>
              <p className="text-xs text-dei-muted leading-relaxed">
                PKBM Digital Dar El Iman memadukan standar capaian pembelajaran nasional dari Kemendikbudristek dengan kurikulum diniyyah Ahlussunnah wal Jama'ah dan bimbingan tahfizh Al-Qur'an terpadu secara daring.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line space-y-1 text-xs">
                  <span className="font-bold text-emerald-600 block">1. Pembelajaran Mandiri Terbimbing (LMS)</span>
                  <p className="text-dei-muted">Modul digital interaktif, rekaman video tutor, serta penugasan berkala yang dapat diakses 24/7 dari seluruh zona waktu dunia.</p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line space-y-1 text-xs">
                  <span className="font-bold text-emerald-600 block">2. Setoran Tahfizh Virtual 1-on-1</span>
                  <p className="text-dei-muted">Bimbingan tahfizh harian bersama musyrif bersanad riwayat Hafsh 'an 'Ashim melalui ruang video conference interaktif.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBMENU 5: PANDUAN BERKAS PERSYARATAN */}
        {/* ======================================================== */}
        {activeMenu === 'berkas' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
              <h2 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                Panduan Kelengkapan Dokumen Administrasi PPDB
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                  <b className="text-dei-ink dark:text-dei-dark-ink block mb-1">• Calon Santri Domisili Dalam Negeri (Nasional):</b>
                  <p className="text-dei-muted">Scan KK asli, Scan Akta Lahir asli, Ijazah jenjang sebelumnya ber-NISN valid dari Dapodik, dan KTP orang tua/wali.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                  <b className="text-dei-ink dark:text-dei-dark-ink block mb-1">• Calon Santri Diaspora Luar Negeri:</b>
                  <p className="text-dei-muted">Paspor WNI yang masih berlaku, Surat Keterangan Domisili KBRI/KJRI setempat, dan transkrip nilai sekolah luar negeri (jika pindahan).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBMENU 6: INFORMASI BIAYA & SPP */}
        {/* ======================================================== */}
        {activeMenu === 'biaya' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
              <h2 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Rincian Biaya Pendidikan & Program Beasiswa
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800/40 text-center space-y-2">
                  <span className="font-bold text-xs text-dei-muted block">Paket A (Setara SD)</span>
                  <div className="text-xl font-black text-emerald-600">Rp 250.000</div>
                  <span className="text-[10px] text-dei-muted block">SPP Bulanan Terpadu</span>
                </div>
                <div className="p-4 rounded-2xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800/40 text-center space-y-2">
                  <span className="font-bold text-xs text-dei-muted block">Paket B (Setara SMP)</span>
                  <div className="text-xl font-black text-emerald-600">Rp 300.000</div>
                  <span className="text-[10px] text-dei-muted block">SPP Bulanan Terpadu</span>
                </div>
                <div className="p-4 rounded-2xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800/40 text-center space-y-2">
                  <span className="font-bold text-xs text-dei-muted block">Paket C (Setara SMA)</span>
                  <div className="text-xl font-black text-emerald-600">Rp 350.000</div>
                  <span className="text-[10px] text-dei-muted block">SPP Bulanan Terpadu</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <span className="font-bold block">Program Beasiswa LAZ Dar El Iman:</span>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Tersedia beasiswa penuh (100%) untuk santri huffazh Al-Qur'an 30 juz dan keringanan SPP 50% bagi keluarga dhuafa dari alokasi dana zakat & infak yayasan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* POPUP MODAL 1: PRE-SUBMIT CONFIRMATION MODAL */}
        {/* ======================================================== */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-dei-dark-surface rounded-3xl max-w-2xl w-full border border-dei-line dark:border-dei-dark-line shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-base text-dei-ink dark:text-dei-dark-ink">
                    Konfirmasi Pengiriman Berkas ({students.length} Calon Santri)
                  </h3>
                </div>
                <button onClick={() => setShowConfirmModal(false)} className="text-dei-muted hover:text-dei-ink p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-dei-muted leading-relaxed">
                  Mohon pastikan data wali santri dan seluruh data calon santri yang didaftarkan sudah lengkap dan benar:
                </p>

                {/* Info Wali */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-dei-line dark:border-dei-dark-line space-y-1.5">
                  <span className="font-bold text-dei-ink dark:text-dei-dark-ink block text-[11px] uppercase tracking-wider text-emerald-700">
                    Data Orang Tua / Wali
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-dei-muted">Nama:</span> <b>{guardianData.parentName}</b></div>
                    <div><span className="text-dei-muted">WhatsApp:</span> <b className="font-mono">{guardianData.parentPhone}</b></div>
                    <div><span className="text-dei-muted">Email:</span> <b className="font-mono">{guardianData.parentEmail}</b></div>
                    <div><span className="text-dei-muted">Negara:</span> <b>{guardianData.country}</b></div>
                  </div>
                </div>

                {/* List Calon Santri */}
                <div className="space-y-2.5">
                  <span className="font-bold text-dei-ink dark:text-dei-dark-ink block text-[11px] uppercase tracking-wider text-emerald-700">
                    Daftar Calon Santri yang Diajukan ({students.length} Anak):
                  </span>
                  {students.map((st, idx) => {
                    const effectiveKk = (idx > 0 && st.useSharedKk) ? students[0].fileKk : st.fileKk;
                    return (
                      <div key={st.id || idx} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-dei-line dark:border-dei-dark-line space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-xs text-dei-ink dark:text-dei-dark-ink">
                          <span>Santri #{idx + 1}: {st.fullName} ({st.gender})</span>
                          <span className="text-emerald-700 dark:text-emerald-300">{st.program}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-dei-muted">
                          <div>NIK: <b className="font-mono text-dei-ink dark:text-dei-dark-ink">{st.nik}</b></div>
                          <div>Target: <b className="text-dei-ink dark:text-dei-dark-ink">{st.tahfizhTarget}</b></div>
                          <div className="sm:col-span-2 text-purple-700 dark:text-purple-300">
                            Berkas: KK ({effectiveKk?.name || 'KK Santri #1'}), Akta ({st.fileAkta?.name}){st.fileIjazah ? `, Ijazah (${st.fileIjazah.name})` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  Setelah dikirim, seluruh data pendaftaran akan dikunci dan diteruskan ke Panitia PPDB untuk verifikasi berkas dan jadwal placement test.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dei-line dark:border-dei-dark-line">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-muted hover:text-dei-ink"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmedSubmit}
                  className="px-6 py-2.5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-black shadow-lg flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Mengirimkan Berkas ({students.length} Santri)...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ya, Kirim Formulir ({students.length} Santri)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* POPUP MODAL 2: SUCCESS SUBMISSION POPUP MODAL */}
        {/* ======================================================== */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-dei-dark-surface rounded-3xl max-w-xl w-full border border-emerald-300 dark:border-emerald-800 shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 text-center max-h-[90vh] overflow-y-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink">
                  Alhamdulillah, Berkas Pendaftaran Berhasil Dikirim!
                </h3>
                <p className="text-xs text-dei-muted leading-relaxed max-w-md mx-auto">
                  Sebanyak <b>{students.length} calon santri</b> telah berhasil didaftarkan ke Panitia PPDB PKBM Digital Dar El Iman Padang.
                </p>
              </div>

              <div className="space-y-2.5 text-left">
                {students.map((st, idx) => (
                  <div key={st.id || idx} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-dei-line dark:border-dei-dark-line text-xs font-mono flex items-center justify-between">
                    <div>
                      <span className="font-sans font-bold text-dei-ink dark:text-dei-dark-ink block">
                        Santri #{idx + 1}: {st.fullName}
                      </span>
                      <span className="font-sans text-[11px] text-dei-muted">{st.program}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold text-xs block">
                        {st.registrationNumber || 'REG-2027-003'}
                      </span>
                      <span className="text-[10px] font-sans text-amber-600 font-semibold">Verifikasi Berkas</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-muted hover:text-dei-ink"
                >
                  Tutup Pop-Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    if (onNavigateMenu) onNavigateMenu('status');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-black shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buka Status & Tracking PPDB</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STANDARD EXECUTIVE & ACADEMIC DASHBOARD FOR OTHER ROLES
  const roleName = user?.role_name || '';
  const userIsSantri = isSantri(user);
  const userIsTutor = isTutor(user);
  const userIsWali = isWaliSantri(user);
  const userIsPimpinan = isPimpinanOrManajemen(user);
  const roleBadge = getRoleDisplayBadge(user);

  // Weekly study / teaching activity dataset
  const weeklyStudyData = {
    mingguan: [
      { day: 'Sen', label: 'Senin', online: 3.5, halaqah: 2.0, total: 5.5, subject: 'Bahasa Arab & Nahwu', verses: '15 Ayat' },
      { day: 'Sel', label: 'Selasa', online: 4.0, halaqah: 1.5, total: 5.5, subject: 'Matematika & Fiqih', verses: '12 Ayat' },
      { day: 'Rab', label: 'Rabu', online: 2.5, halaqah: 2.5, total: 5.0, subject: 'Tahfizh Surah An-Naba', verses: '20 Ayat' },
      { day: 'Kam', label: 'Kamis', online: 4.5, halaqah: 2.0, total: 6.5, subject: 'Aqidah Wasithiyah & IPA', verses: '18 Ayat' },
      { day: 'Jum', label: 'Jumat', online: 2.0, halaqah: 3.0, total: 5.0, subject: 'Khatmil Qur\'an & Hadits', verses: '30 Ayat' },
      { day: 'Sab', label: 'Sabtu', online: 3.0, halaqah: 1.0, total: 4.0, subject: 'Studi Mandiri PKBM', verses: '10 Ayat' },
      { day: 'Ahd', label: 'Ahad', online: 1.5, halaqah: 1.5, total: 3.0, subject: 'Muraja\'ah Akbar', verses: '25 Ayat' }
    ],
    bulanan: [
      { day: 'P-1', label: 'Pekan 1', online: 18.0, halaqah: 12.0, total: 30.0, subject: 'Akademik Umum', verses: '80 Ayat' },
      { day: 'P-2', label: 'Pekan 2', online: 20.5, halaqah: 11.5, total: 32.0, subject: 'KBM Daring & Ula', verses: '95 Ayat' },
      { day: 'P-3', label: 'Pekan 3', online: 19.0, halaqah: 13.0, total: 32.0, subject: 'Simulasi CBT', verses: '110 Ayat' },
      { day: 'P-4', label: 'Pekan 4', online: 22.0, halaqah: 14.5, total: 36.5, subject: 'Ujian Tasmi\'', verses: '130 Ayat' }
    ]
  };

  const currentChartData = weeklyStudyData[chartPeriod] || weeklyStudyData.mingguan;
  const maxChartVal = chartPeriod === 'mingguan' ? 8 : 45;

  // Role Profile Details
  const profileDetails = {
    idCard: userIsSantri
      ? (user?.username === 'santri.yafiq' ? 'DEI-2026-C-0983' : 'DEI-2026-C-0982')
      : userIsTutor ? 'DEI-GTY-041'
      : userIsWali ? 'DEI-WALI-881'
      : 'DEI-ADM-001',
    nik: userIsSantri ? '1371052809070002' : '1371011405780001',
    nisnNuptk: userIsSantri
      ? (user?.username === 'santri.yafiq' ? '0081234562' : '0081234561')
      : userIsTutor ? '198504122010011005'
      : '-',
    gender: 'Laki-laki',
    birthPlaceDate: userIsSantri ? 'Padang, 28 September 2007' : 'Bukittinggi, 14 Mei 1985',
    unitProgram: userIsSantri ? 'PKBM Paket C (Setara SMA - MIPA)' : userIsTutor ? 'Bidang Studi Syari\'ah & Halaqah Sanad' : userIsWali ? 'Orang Tua / Wali Santri' : 'Manajemen PKBM Dar El Iman',
    rombelKelas: userIsSantri ? 'Kelas X Paket C — Umar bin Khattab' : userIsTutor ? 'Pengampu Kelas X - XII & Halaqah 3' : 'Pembina Santri',
    waliKelas: 'Ustadzah Fatimah, S.Pd.',
    pembimbingTahfizh: 'Ustadz Ahmad Fauzi, Lc.',
    phone: user?.phone || '0812-7654-3210',
    email: user?.email || 'santri.ziyad@student.darel-iman.sch.id',
    address: 'Jl. Tuanku Tambusai No. 12, Kel. Padang Barat, Kota Padang, Sumatera Barat',
    statusAkun: 'Aktif Terverifikasi',
    tahunAjaran: '2026/2027 Ganjil',
    sanadStatus: 'Sanad Qira\'ah \'Ashim Riwayat Hafsh (Thariq Asy-Syathibiyyah)',
    targetJuz: 'Target 5 Juz (Capaian: 4.8 Juz)'
  };

  // Dynamic Real Metrics Calculations from Seed Data & Backend APIs
  // 1. Santri Metrics
  const myAttendance = metricsData.attendance.filter(
    (a) => a.student_id === user?.id || (user?.full_name && a.student_name && a.student_name.toLowerCase().includes(user.full_name.toLowerCase()))
  );
  const myPresentCount = myAttendance.filter((a) => a.status === 'HADIR').length;
  const santriStudyHours = (myPresentCount > 0 ? myPresentCount : Math.min(14, metricsData.attendance.filter(a => a.status === 'HADIR').length || 14)) * 2.5;

  const myTahfizh = metricsData.tahfizhLogs.filter(
    (t) => t.student_id === user?.id || (user?.full_name && t.student_name && t.student_name.toLowerCase().includes(user.full_name.toLowerCase()))
  );
  const santriJuzCount = myTahfizh.length > 0 ? (4.0 + myTahfizh.length * 0.4).toFixed(1) : '4.8';
  const santriTargetPercent = Math.min(100, Math.round((parseFloat(santriJuzCount) / 5) * 100));

  const mySubmissions = metricsData.submissions.filter(
    (s) => s.student_id === user?.id || (user?.full_name && s.student_name && s.student_name.toLowerCase().includes(user.full_name.toLowerCase()))
  );
  const totalAssignmentsCount = Math.max(metricsData.assignments.length, 3);
  const mySubmissionCount = mySubmissions.length > 0 ? mySubmissions.length : Math.min(totalAssignmentsCount, 2);
  const taskPercent = Math.round((mySubmissionCount / totalAssignmentsCount) * 100);

  const gradedSubmissions = mySubmissions.filter((s) => s.score != null);
  const avgCbtScore = gradedSubmissions.length > 0
    ? (gradedSubmissions.reduce((acc, s) => acc + Number(s.score), 0) / gradedSubmissions.length).toFixed(1)
    : '93.5';
  const cbtPredicate = Number(avgCbtScore) >= 90 ? 'Mumtaz (Istimewa)' : 'Jayyid Jiddan (Sangat Baik)';

  // 2. Tutor Metrics
  const uniqueStudentNames = new Set(metricsData.attendance.map((a) => a.student_name).filter(Boolean));
  const tutorStudentCount = Math.max(uniqueStudentNames.size, 15);
  const tutorTeachingHours = Math.max(new Set(metricsData.attendance.map((a) => a.date + a.subject_name)).size * 2, 24);
  const totalSubmissionsCount = metricsData.submissions.length || 3;
  const gradedSubmissionsCount = metricsData.submissions.filter((s) => s.score != null).length || 3;
  const gradeCompletionPercent = Math.round((gradedSubmissionsCount / totalSubmissionsCount) * 100);
  const totalAttendanceCount = metricsData.attendance.length || 20;
  const totalHadirCount = metricsData.attendance.filter((a) => a.status === 'HADIR').length || 18;
  const attendanceRate = ((totalHadirCount / totalAttendanceCount) * 100).toFixed(1);

  // 3. Wali Santri Metrics
  const waliUnpaidInvoices = metricsData.invoices.filter(
    (inv) => (inv.student_name?.toLowerCase().includes('faris') || inv.student_name?.toLowerCase().includes('fatih') || inv.student_name?.toLowerCase().includes('ziyad')) && inv.status === 'UNPAID'
  );
  const waliSppStatus = waliUnpaidInvoices.length > 0 ? `${waliUnpaidInvoices.length} Tagihan Aktif` : 'Lunas';
  const waliSppSubtext = waliUnpaidInvoices.length > 0
    ? `Rp ${(Number(waliUnpaidInvoices[0]?.amount) || 0).toLocaleString('id-ID')} Jatuh Tempo`
    : 'Terbayar s/d Periode Berjalan';

  // 4. Admin / Pimpinan Metrics
  const adminTotalStudents = metricsData.dapodikSummary?.total_students || 150;
  const adminAccredScore = metricsData.accreditationMetrics?.completion_percent
    ? `${metricsData.accreditationMetrics.completion_percent}%`
    : '98.5%';
  const adminAccredGrade = metricsData.accreditationMetrics?.projected_grade || 'BAN-PDM Target Unggul';
  const adminServerStatus = healthData?.status === 'ok' ? '100% Online' : '99.98%';

  // Get initials for profile avatar
  const getInitials = (name) => {
    if (!name) return 'DEI';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <GraduationCap className="w-72 h-72" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Pembelajaran & Administrasi Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ahlan wa Sahlan, {user?.full_name}!
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Anda berhasil masuk sebagai <span className="font-bold underline text-white">{user?.role_name}</span>.
            Sistem ditenagai oleh backend <span className="font-bold">Go Fiber v2 + GORM</span> serta
            frontend modern <span className="font-bold">React 18 & Tailwind CSS</span>.
          </p>
        </div>
      </div>

      {/* Profile Summary & Identity Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Avatar & Basic Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-dei-emerald to-emerald-800 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md border-2 border-amber-300/40">
                {getInitials(user?.full_name)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-dei-dark-surface animate-pulse" title="Status: Online" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-dei-ink dark:text-dei-dark-ink">
                  {user?.full_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-dei-emerald border border-emerald-200 dark:border-emerald-800">
                  {roleBadge?.label || user?.role_name}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <BadgeCheck className="w-3 h-3 text-amber-500" />
                  <span>{profileDetails.statusAkun}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dei-muted dark:text-dei-dark-muted font-medium">
                <span className="flex items-center gap-1 font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-dei-emerald" />
                  {profileDetails.unitProgram}
                </span>
                <span className="hidden sm:inline text-dei-line dark:text-dei-dark-line">•</span>
                <span className="flex items-center gap-1 font-mono">
                  <QrCode className="w-3.5 h-3.5 text-dei-gold" />
                  ID: <span className="font-bold text-dei-ink dark:text-dei-dark-ink">{profileDetails.idCard}</span>
                </span>
                <span className="hidden sm:inline text-dei-line dark:text-dei-dark-line">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  TA {profileDetails.tahunAjaran}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-dei-line dark:border-dei-dark-line">
            <button
              type="button"
              onClick={() => {
                setProfileTab('dokumen');
                setShowProfileModal(true);
              }}
              className="py-2.5 px-4 rounded-xl border border-dei-line dark:border-dei-dark-line hover:border-dei-gold bg-dei-bg dark:bg-dei-dark-bg text-xs font-bold text-dei-ink dark:text-dei-dark-ink flex items-center gap-2 transition-all"
            >
              <QrCode className="w-4 h-4 text-dei-gold" />
              <span>ID Card Digital</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileTab('biodata');
                setShowProfileModal(true);
              }}
              className="py-2.5 px-5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-black shadow-md hover:shadow-lg flex items-center gap-2 transition-all"
            >
              <User className="w-4 h-4" />
              <span>Lihat Biodata & Profil Lengkap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role-Tailored KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {userIsSantri ? (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Jam Belajar Pekan Ini</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-dei-emerald flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{santriStudyHours} Jam</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14% dari pekan sebelumnya</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Capaian Tahfizh Sanad</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-dei-gold flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{santriJuzCount} / 5 Juz</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>{santriTargetPercent}% Target Semester Terpenuhi</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Tugas & KBM Terkumpul</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{mySubmissionCount} / {totalAssignmentsCount} Tugas</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{taskPercent}% Selesai Tepat Waktu</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Rata-rata Nilai CBT</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{avgCbtScore} <span className="text-sm font-semibold text-dei-muted">/ 100</span></div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Predikat: {cbtPredicate}</span>
              </div>
            </div>
          </>
        ) : userIsTutor ? (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Santri Binaan Aktif</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-dei-emerald flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{tutorStudentCount} Santri</div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-2">Halaqah Asy-Syathibi & Kelas X Paket C</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Jam KBM & Halaqah</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-dei-gold flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{tutorTeachingHours} JP / Pekan</div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">100% Target RPP Terpenuhi</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Tugas Santri Terperiksa</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{gradedSubmissionsCount} / {totalSubmissionsCount} Berkas</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-bold">{gradeCompletionPercent}% Selesai Dikoreksi</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Tingkat Kehadiran Kelas</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-dei-emerald flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{attendanceRate}%</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-bold">Kehadiran Sangat Baik</p>
            </div>
          </>
        ) : userIsWali ? (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Santri Dalam Binaan</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-dei-emerald flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">2 Anak</div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-2">Ahmad Faris & Maryam Khadijah</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Presensi Rata-rata</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{attendanceRate}%</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-bold">100% Hadir Pekan Ini</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Progres Hafalan Qur'an</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-dei-gold flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{santriJuzCount} Juz</div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">Kualitas Setoran: Mutqin</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Administrasi & SPP</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-dei-emerald flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className={`text-2xl font-black ${waliSppStatus === 'Lunas' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{waliSppStatus}</div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-2">{waliSppSubtext}</p>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Total Santri Terdaftar</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-dei-emerald flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{adminTotalStudents} Santri</div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-2">Terdata Valid di Dapodik & Rombel</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Tingkat Kelulusan CBT</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">96.2%</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-bold">Memenuhi Standar Kelulusan KKM</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Kesiapan Akreditasi</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-dei-gold flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">{adminAccredScore}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">{adminAccredGrade}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">Kondisi Server & Backend</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-dei-emerald flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{adminServerStatus}</div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-2">Go Fiber v2 + MySQL Seeder Aktif</p>
            </div>
          </>
        )}
      </div>

      {/* Interactive Activity Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Column (2 Cols on lg) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-dei-emerald" />
                <h3 className="text-base font-black text-dei-ink dark:text-dei-dark-ink">
                  Aktivitas Belajar & KBM Terpadu
                </h3>
              </div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-0.5">
                Alokasi waktu interaksi KBM daring, halaqah tahfizh, dan muraja'ah mandiri
              </p>
            </div>

            {/* Period Switcher */}
            <div className="flex items-center p-1 bg-dei-bg dark:bg-dei-dark-bg rounded-xl border border-dei-line dark:border-dei-dark-line self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartPeriod('mingguan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartPeriod === 'mingguan'
                    ? 'bg-dei-emerald text-white shadow-xs'
                    : 'text-dei-muted hover:text-dei-ink dark:hover:text-white'
                }`}
              >
                Pekan Ini
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod('bulanan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartPeriod === 'bulanan'
                    ? 'bg-dei-emerald text-white shadow-xs'
                    : 'text-dei-muted hover:text-dei-ink dark:hover:text-white'
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>

          {/* Interactive Bar Chart Visualization */}
          <div className="pt-4 pb-2">
            <div className="h-56 sm:h-64 flex items-end gap-2 sm:gap-4 px-2 border-b border-dei-line dark:border-dei-dark-line relative">
              {/* Background Guide Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-gray-400 w-full" />
                <div className="border-b border-dashed border-gray-400 w-full" />
                <div className="border-b border-dashed border-gray-400 w-full" />
                <div className="border-b border-dashed border-gray-400 w-full" />
              </div>

              {currentChartData.map((item) => {
                const heightPercent = Math.min(100, Math.round((item.total / maxChartVal) * 100));
                const onlinePercent = Math.round((item.online / item.total) * 100);
                const isHovered = hoveredDay === item.day;

                return (
                  <div
                    key={item.day}
                    onMouseEnter={() => setHoveredDay(item.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10"
                  >
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-16 sm:-top-20 z-20 bg-dei-ink text-white dark:bg-gray-900 text-left p-2.5 rounded-xl shadow-xl border border-white/10 text-[11px] whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-extrabold text-amber-300 flex items-center justify-between gap-2">
                          <span>{item.label}</span>
                          <span className="font-mono">{item.total} Jam</span>
                        </div>
                        <div className="text-gray-200 mt-0.5">
                          KBM: <span className="font-bold text-emerald-400">{item.online} Jam</span> • Halaqah: <span className="font-bold text-amber-400">{item.halaqah} Jam</span>
                        </div>
                        <div className="text-[10px] text-gray-300 truncate max-w-[170px]">
                          {item.subject} ({item.verses})
                        </div>
                      </div>
                    )}

                    {/* Stacked Vertical Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[38px] rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-300 ${
                        isHovered ? 'ring-2 ring-dei-gold shadow-lg scale-105' : 'hover:opacity-90'
                      }`}
                    >
                      {/* Halaqah Tahfizh Portion (Amber Gold) */}
                      <div
                        style={{ height: `${100 - onlinePercent}%` }}
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400 transition-all"
                        title={`Halaqah: ${item.halaqah} Jam`}
                      />
                      {/* KBM Daring Portion (Emerald) */}
                      <div
                        style={{ height: `${onlinePercent}%` }}
                        className="w-full bg-gradient-to-t from-dei-emerald-dark to-dei-emerald transition-all"
                        title={`KBM Daring: ${item.online} Jam`}
                      />
                    </div>

                    {/* Day Label */}
                    <span className={`text-[11px] sm:text-xs font-bold mt-2 transition-colors ${
                      isHovered ? 'text-dei-emerald dark:text-amber-400' : 'text-dei-muted dark:text-dei-dark-muted'
                    }`}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-gradient-to-r from-dei-emerald to-dei-emerald-dark" />
                <span className="text-dei-ink dark:text-dei-dark-ink">KBM Daring & Modul Umum</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-gradient-to-r from-amber-400 to-amber-500" />
                <span className="text-dei-ink dark:text-dei-dark-ink">Halaqah Tahfizh & Sanad</span>
              </div>
              <div className="text-[11px] text-dei-muted dark:text-dei-dark-muted">
                *Sentuh atau arahkan kursor ke bar untuk detail
              </div>
            </div>
          </div>
        </div>

        {/* Right Insight & Productivity Column */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-dei-gold" />
              <h4 className="text-sm font-extrabold text-dei-ink dark:text-dei-dark-ink">
                Ringkasan Produktivitas
              </h4>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                <span className="text-[11px] font-bold text-dei-muted dark:text-dei-dark-muted uppercase tracking-wider">
                  Total Waktu Aktif Pekan Ini
                </span>
                <div className="text-xl font-black text-dei-emerald mt-0.5">
                  34 Jam 30 Menit
                </div>
                <p className="text-[11px] text-dei-muted dark:text-dei-dark-muted mt-1">
                  Rata-rata 4.9 jam/hari (Target: 4.0 jam/hari)
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                <span className="text-[11px] font-bold text-dei-muted dark:text-dei-dark-muted uppercase tracking-wider">
                  Hari Paling Produktif
                </span>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  Kamis (6.5 Jam)
                </div>
                <p className="text-[11px] text-dei-muted dark:text-dei-dark-muted mt-1">
                  Materi Aqidah Wasithiyah & Praktikum Sains
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50/50 dark:from-emerald-950/30 dark:to-amber-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-dei-emerald">
                  <BadgeCheck className="w-4 h-4 text-dei-gold" />
                  <span>Rekomendasi AI Tutor DEI:</span>
                </div>
                <p className="text-xs text-dei-ink dark:text-dei-dark-ink leading-relaxed">
                  "Pola setoran ziyadah dan muraja'ah subuh Anda sangat konsisten. Pertahankan ritme ini menjelang evaluasi tasmi' akhir semester!"
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateMenu && onNavigateMenu('tahfizh')}
            className="w-full py-2.5 px-4 rounded-xl bg-dei-bg dark:bg-dei-dark-bg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-dei-line dark:border-dei-dark-line hover:border-dei-emerald text-xs font-bold text-dei-ink dark:text-dei-dark-ink flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Buka Riwayat Mutaba'ah Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5 text-dei-emerald" />
          </button>
        </div>
      </div>

      {/* Target Progress & Today's Agenda Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Capaian Santri */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-dei-gold" />
              <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink">
                Target Capaian & Mutaba'ah
              </h3>
            </div>
            <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted font-mono">
              Semester Genap
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Progress 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-dei-ink dark:text-dei-dark-ink">Tahfizh Qur'an (Target 5 Juz)</span>
                <span className="text-dei-emerald font-mono">4.8 / 5.0 Juz (96%)</span>
              </div>
              <div className="h-2.5 w-full bg-dei-bg dark:bg-dei-dark-bg rounded-full overflow-hidden border border-dei-line dark:border-dei-dark-line">
                <div className="h-full bg-gradient-to-r from-dei-emerald to-emerald-500 rounded-full w-[96%]" />
              </div>
            </div>

            {/* Progress 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-dei-ink dark:text-dei-dark-ink">Modul PKBM Merdeka Belajar (12 Modul)</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">11 / 12 Modul (91%)</span>
              </div>
              <div className="h-2.5 w-full bg-dei-bg dark:bg-dei-dark-bg rounded-full overflow-hidden border border-dei-line dark:border-dei-dark-line">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-[91%]" />
              </div>
            </div>

            {/* Progress 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-dei-ink dark:text-dei-dark-ink">Mutaba'ah Dzikir Pagi Petang</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">27 / 30 Hari (90%)</span>
              </div>
              <div className="h-2.5 w-full bg-dei-bg dark:bg-dei-dark-bg rounded-full overflow-hidden border border-dei-line dark:border-dei-dark-line">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full w-[90%]" />
              </div>
            </div>

            {/* Progress 4 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-dei-ink dark:text-dei-dark-ink">Presensi Shalat 5 Waktu Berjamaah</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">100% Konsisten</span>
              </div>
              <div className="h-2.5 w-full bg-dei-bg dark:bg-dei-dark-bg rounded-full overflow-hidden border border-dei-line dark:border-dei-dark-line">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Agenda & Jadwal KBM Hari Ini */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-dei-emerald" />
              <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink">
                Agenda & KBM Hari Ini
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-dei-emerald">
              Aktif
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-dei-muted font-mono">07.30 - 09.00</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    Selesai
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink">
                  Halaqah Tahfizh Subuh & Ziyadah
                </h4>
                <p className="text-[11px] text-dei-muted">Ustadz Dr. Ahmad Hidayat, Lc., M.A. • Halaqah 3</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 relative overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-dei-emerald" />
              <div className="space-y-0.5 pl-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">09.15 - 11.00</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    Sedang Berlangsung
                  </span>
                </div>
                <h4 className="text-xs font-black text-dei-emerald dark:text-emerald-300">
                  Fiqih Muamalah & Kewirausahaan Islam
                </h4>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400">Ustadz Ridwan, S.H.I. • Google Meet Interaktif</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateMenu && onNavigateMenu('kbm')}
                className="py-1.5 px-3 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-[11px] font-bold shadow-xs shrink-0"
              >
                Gabung
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-dei-muted font-mono">13.30 - 15.00</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    Akan Datang
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink">
                  Matematika Terapan & Statistika
                </h4>
                <p className="text-[11px] text-dei-muted">Ustadzah Fatimah, M.Pd. • Modul 08 KBM</p>
              </div>
              <Clock className="w-4 h-4 text-dei-muted shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Direct Module Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateMenu && onNavigateMenu('kbm')}
          className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm hover:border-dei-emerald cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-dei-emerald font-mono">
              KBM & Kurikulum
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-dei-emerald group-hover:translate-x-1 transition-transform">
              <span>Buka KBM</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink group-hover:text-dei-emerald transition-colors">
            KBM, Silabus Kurikulum & Tugas
          </h3>
          <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-1 leading-relaxed">
            Jadwal KBM daring, link Google Meet interaktif, unduh silabus PDF, serta pengumpulan tugas santri.
          </p>
        </div>

        <div
          onClick={() => onNavigateMenu && onNavigateMenu('presensi')}
          className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm hover:border-blue-500 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-mono">
              Presensi & Kehadiran
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Buka Presensi</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Presensi & Kehadiran Santri
          </h3>
          <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-1 leading-relaxed">
            Check-in mandiri santri, pengajuan izin/sakit online, verifikasi approval ustadz, dan ekspor PDF resmi.
          </p>
        </div>

        <div
          onClick={() => onNavigateMenu && onNavigateMenu('tahfizh')}
          className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm hover:border-amber-400 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-mono">
              Halaqah Tahfizh
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Buka Tahfizh</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            Halaqah Tahfizh Qur'an Bersanad
          </h3>
          <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-1 leading-relaxed">
            Halaqah Sanad Imam Hafsh, input rekaman setoran Ziyadah/Muraja'ah, grading kelancaran, dan grafik capaian juz.
          </p>
        </div>
      </div>

      {/* System Diagnostics & Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted uppercase">Framework Backend</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl font-extrabold text-dei-ink dark:text-dei-dark-ink">
            {healthData?.framework || 'Go Fiber v2 + GORM'}
          </div>
          <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-1">
            Port 8080 terhubung via Vite Proxy
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted uppercase">Database MySQL</span>
            <Database className="w-4 h-4 text-dei-emerald dark:text-dei-emerald-neon" />
          </div>
          <div className="text-xl font-extrabold text-dei-ink dark:text-dei-dark-ink truncate">
            {healthData?.database || 'pkbm_digital_darel_iman'}
          </div>
          <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-1 truncate">
            Status: {healthData?.db_status || 'Koneksi siap'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted uppercase">Autentikasi JWT</span>
            <ShieldCheck className="w-4 h-4 text-dei-gold" />
          </div>
          <div className="text-xl font-extrabold text-dei-ink dark:text-dei-dark-ink">
            Sesi Aktif (Remember Me)
          </div>
          <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-1 font-mono truncate">
            Auto-Keep Alive • Sub ID: {user?.id}
          </p>
        </div>
      </div>

      {/* Quick Role Switcher Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
        <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
          <Users className="w-4 h-4 text-dei-emerald dark:text-dei-emerald-neon" />
          Uji Coba Ganti Peran Instan:
        </h3>
        <div className="flex flex-wrap gap-2">
          {demoAccounts.slice(0, 8).map((demo) => (
            <button
              key={demo.username}
              onClick={() => handleQuickSwitchRole(demo)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                user?.username === demo.username
                  ? 'bg-dei-emerald text-white border-dei-emerald'
                  : 'bg-dei-bg dark:bg-dei-dark-bg border-dei-line dark:border-dei-dark-line text-dei-ink dark:text-dei-dark-ink hover:border-dei-emerald'
              }`}
            >
              <span>{demo.icon}</span>
              <span>{demo.role_display}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Ganti Password Test */}
      <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-dei-gold" />
          Uji Endpoint Ganti Kata Sandi (POST /api/v1/auth/change-password):
        </h3>

        {passMessage.text && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
            }`}
          >
            {passMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{passMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="password"
            required
            placeholder="Kata Sandi Lama"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Kata Sandi Baru (min 6 karakter)"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
          />
          <input
            type="password"
            required
            placeholder="Ulangi Kata Sandi Baru"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
          />
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={passSubmitting}
              className="py-2 px-5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow disabled:opacity-50"
            >
              {passSubmitting ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Biodata & Profil Lengkap */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-3xl rounded-3xl shadow-2xl border border-dei-line dark:border-dei-dark-line overflow-hidden my-8">
            {/* Header Modal with Banner */}
            <div className="p-6 bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white relative">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white text-dei-emerald font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300">
                  {getInitials(user?.full_name)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-white">{user?.full_name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
                      {roleBadge?.label || user?.role_name}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 flex items-center gap-2">
                    <span>ID: {profileDetails.idCard}</span>
                    <span>•</span>
                    <span>{profileDetails.unitProgram}</span>
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/20 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setProfileTab('biodata')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all ${
                    profileTab === 'biodata'
                      ? 'bg-white text-dei-emerald shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Biodata Pribadi
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('akademik')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all ${
                    profileTab === 'akademik'
                      ? 'bg-white text-dei-emerald shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Akademik & Sanad
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('dokumen')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all ${
                    profileTab === 'dokumen'
                      ? 'bg-white text-dei-emerald shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Kartu Digital & Berkas
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('keamanan')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all ${
                    profileTab === 'keamanan'
                      ? 'bg-white text-dei-emerald shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Pengaturan & Keamanan
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {profileUpdateMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{profileUpdateMsg}</span>
                </div>
              )}

              {profileTab === 'biodata' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dei-muted dark:text-dei-dark-muted flex items-center gap-1.5">
                    <User className="w-4 h-4 text-dei-emerald" />
                    Informasi Kependudukan & Kontak
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Nama Lengkap Sesuai KTP / KK</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{user?.full_name}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Nomor Induk Kependudukan (NIK)</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5 font-mono">{profileDetails.nik}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Tempat & Tanggal Lahir</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{profileDetails.birthPlaceDate}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Jenis Kelamin</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{profileDetails.gender}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Nomor WhatsApp Aktif</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5 font-mono">{profileDetails.phone}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Alamat Surel (Email)</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5 font-mono truncate">{profileDetails.email}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                    <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Alamat Lengkap Domisili</span>
                    <p className="text-xs font-semibold text-dei-ink dark:text-dei-dark-ink mt-1 leading-relaxed">
                      {profileDetails.address}
                    </p>
                  </div>
                </div>
              )}

              {profileTab === 'akademik' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dei-muted dark:text-dei-dark-muted flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-dei-emerald" />
                    Data Pembelajaran & Kelembagaan
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Program Pendidikan</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{profileDetails.unitProgram}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Rombel / Kelas Aktif</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{profileDetails.rombelKelas}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">NISN / NUPTK</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5 font-mono">{profileDetails.nisnNuptk}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                      <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted font-bold">Wali Kelas / Pembina</span>
                      <p className="text-sm font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{profileDetails.waliKelas}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-1.5">
                    <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-dei-gold" />
                      Status Halaqah Tahfizh Qur'an Bersanad:
                    </span>
                    <p className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                      {profileDetails.sanadStatus}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Pembimbing: {profileDetails.pembimbingTahfizh} • {profileDetails.targetJuz}
                    </p>
                  </div>
                </div>
              )}

              {profileTab === 'dokumen' && (
                <div className="space-y-6">
                  {/* Virtual ID Card DEI */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-dei-emerald-dark to-dei-emerald text-white shadow-xl relative overflow-hidden border-2 border-amber-300/60">
                    <div className="absolute right-0 top-0 bottom-0 w-48 bg-white/5 transform skew-x-12 pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                          Kartu Tanda Digital Santri / Civitas
                        </span>
                        <h4 className="text-sm font-black tracking-tight">
                          PKBM & MA'HAD DAR EL IMAN PADANG
                        </h4>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase text-amber-300 border border-white/30">
                        {roleBadge?.label || user?.role_name}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white text-dei-emerald font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300">
                          {getInitials(user?.full_name)}
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-base font-extrabold text-white">{user?.full_name}</h5>
                          <p className="text-xs text-emerald-200 font-mono">ID: {profileDetails.idCard}</p>
                          <p className="text-[11px] text-emerald-100">{profileDetails.unitProgram}</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-white text-dei-ink flex flex-col items-center justify-center shadow-md self-start sm:self-auto">
                        <QrCode className="w-12 h-12 text-dei-emerald" />
                        <span className="text-[9px] font-mono font-bold mt-0.5 text-dei-muted">VERIFIED DEI</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between text-[10px] text-emerald-200">
                      <span>Tahun Ajaran: {profileDetails.tahunAjaran}</span>
                      <span>Akreditasi BAN-PDM: Unggul (A)</span>
                    </div>
                  </div>

                  {/* Document Verification Check */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-dei-muted dark:text-dei-dark-muted">
                      Status Kelengkapan Berkas Persyaratan
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex items-center justify-between">
                        <span className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">Kartu Keluarga (KK)</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex items-center justify-between">
                        <span className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">Akta Kelahiran</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex items-center justify-between">
                        <span className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">Ijazah / Rapor Asli</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex items-center justify-between">
                        <span className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">Surat Keterangan Sehat</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'keamanan' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dei-muted dark:text-dei-dark-muted flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-dei-gold" />
                    Preferensi Akun & Pembaruan Kontak
                  </h4>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setProfileUpdateMsg('Kontak nomor HP dan alamat profil berhasil disimpan!');
                      setTimeout(() => setProfileUpdateMsg(''), 4000);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                          Nomor WhatsApp (Notifikasi KBM & SPP)
                        </label>
                        <input
                          type="text"
                          defaultValue={profileDetails.phone}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-mono text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                          Email Alternatif
                        </label>
                        <input
                          type="email"
                          defaultValue={profileDetails.email}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                        Alamat Domisili Terkini
                      </label>
                      <input
                        type="text"
                        defaultValue={profileDetails.address}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="py-2.5 px-5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-black shadow-md flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Simpan Perubahan Kontak</span>
                      </button>
                    </div>
                  </form>

                  <div className="pt-4 border-t border-dei-line dark:border-dei-dark-line">
                    <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted">
                      Log Aktivitas Sesi:
                    </span>
                    <p className="text-xs text-dei-ink dark:text-dei-dark-ink mt-1 font-mono">
                      Login Terakhir: Hari ini via IP 192.168.1.1 (Browser Desktop React SPA)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-dei-bg dark:bg-dei-dark-bg border-t border-dei-line dark:border-dei-dark-line flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="py-2.5 px-6 rounded-xl bg-dei-ink text-white dark:bg-gray-800 text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewPage;
