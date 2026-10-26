import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  isSantri,
  isProktor,
  isTutor,
  isWaliKelas,
  isPimpinanOrManajemen
} from '../../utils/rbac';
import { ThemeModal } from '../../components/common/ThemeModal';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Lock,
  FileText,
  ChevronRight,
  ChevronLeft,
  Award,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  HelpCircle,
  Activity,
  Layers,
  Search,
  Calendar,
  Maximize2,
  Minimize2,
  ListOrdered,
  BookOpen,
  Plus,
  Trash2,
  Copy
} from 'lucide-react';

export const CbtPage = ({ onNavigateMenu = () => {} }) => {
  const { user, token } = useAuth();
  const userIsSantri = isSantri(user);
  const userCanManage = isProktor(user) || isTutor(user) || isWaliKelas(user) || isPimpinanOrManajemen(user);

  // Mode: 'exam_schedule' | 'token_gate' | 'exam_active' | 'exam_result' | 'exam_review' | 'proctor_view' | 'exam_builder'
  const [activeTab, setActiveTab] = useState(userCanManage ? 'proctor_view' : 'exam_schedule');

  // Exams & Schedule
  const [examEvents, setExamEvents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active exam session state
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Default EMPTY: nothing pre-selected!
  const [markedDoubt, setMarkedDoubt] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Semua jawaban tersimpan');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-Cheat state
  const [cheatModalOpen, setCheatModalOpen] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);

  // Proctor Monitoring State (Guru / Wali Kelas / Proktor)
  const [proctorAttempts, setProctorAttempts] = useState([]);
  const [proctorIncidents, setProctorIncidents] = useState([]);
  const [proctorStats, setProctorStats] = useState({
    total_registered: 0,
    in_progress: 0,
    submitted: 0,
    total_cheat_incidents: 0,
  });

  // ThemeModal State (Menggantikan alert & confirm bawaan browser)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: '',
    cancelText: 'Batal',
    onConfirm: null,
    onCancel: null,
  });

  const showModal = (cfg) => setModalConfig({ isOpen: true, ...cfg });
  const hideModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  // Helper kalkulasi status ujian real-time & default input jam asli
  const getInitialExamTimes = () => {
    const now = new Date();
    const startH = String(now.getHours()).padStart(2, '0');
    const startM = String(now.getMinutes()).padStart(2, '0');
    const end = new Date(now.getTime() + 90 * 60 * 1000);
    const endH = String(end.getHours()).padStart(2, '0');
    const endM = String(end.getMinutes()).padStart(2, '0');
    return {
      startTime: `${startH}:${startM} WIB`,
      endTime: `${endH}:${endM} WIB`,
    };
  };

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  const getExamRealtimeStatus = (exam) => {
    if (!exam) return 'UPCOMING';
    if (exam.status === 'COMPLETED' || exam.status === 'SUBMITTED' || exam.status === 'FINISHED') {
      return 'COMPLETED';
    }
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = parseTimeToMinutes(exam.start_time);
    const endMinutes = parseTimeToMinutes(exam.end_time);

    if (startMinutes !== null && endMinutes !== null) {
      if (currentMinutes < startMinutes) {
        return 'UPCOMING';
      } else if (currentMinutes <= endMinutes) {
        return 'ACTIVE';
      } else {
        return 'COMPLETED';
      }
    }
    return exam.status || 'UPCOMING';
  };

  const initialTimes = getInitialExamTimes();

  // Exam Builder State (Guru / Wali Kelas / Proktor)
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamSubject, setNewExamSubject] = useState("Tahfizh Al-Qur'an Bersanad & Tajwid");
  const [newExamStartTime, setNewExamStartTime] = useState(initialTimes.startTime);
  const [newExamEndTime, setNewExamEndTime] = useState(initialTimes.endTime);
  const [newExamDuration, setNewExamDuration] = useState(45);
  const [newExamPassing, setNewExamPassing] = useState(75);
  const [newExamQuestions, setNewExamQuestions] = useState([
    {
      id: 'q-custom-1',
      prompt_text: 'Jelaskan hukum bacaan nun sukun ketika bertemu huruf ikhfa?',
      question_type: 'MULTIPLE_CHOICE',
      points: 10,
      options: [
        { id: 'opt-c1', option_key: 'A', option_text: 'Dibaca samar disertai dengung (ghunnah)', is_correct: true },
        { id: 'opt-c2', option_key: 'B', option_text: 'Dibaca jelas tanpa dengung', is_correct: false },
        { id: 'opt-c3', option_key: 'C', option_text: 'Dibaca melebur tanpa ghunnah', is_correct: false },
        { id: 'opt-c4', option_key: 'D', option_text: 'Mengubah bunyi nun menjadi mim', is_correct: false }
      ],
      explanation: 'Ikhfa Haqiqi dibaca samar antara idzhar dan idgham disertai ghunnah 2 harakat.'
    }
  ]);

  // 1. Fetch available exam schedules
  const fetchExams = async () => {
    try {
      const res = await fetch('/api/v1/exams');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setExamEvents(json.data);
          if (!selectedExam) {
            setSelectedExam(json.data[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat jadwal ujian:', err);
    }
  };

  // 2. Fetch proctor monitoring data
  const fetchProctorData = async () => {
    try {
      const res = await fetch('/api/v1/proctor/monitoring', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-Role-Name': user?.role_name || '',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setProctorAttempts(data.attempts || []);
        setProctorIncidents(data.proctor_logs || data.incident_feed || []);
        if (data.stats) {
          setProctorStats(data.stats);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data proctoring:', err);
    }
  };

  useEffect(() => {
    fetchExams();
    if (userCanManage) {
      fetchProctorData();
      const interval = setInterval(fetchProctorData, 4000);
      return () => clearInterval(interval);
    }
  }, [userCanManage]);

  // 3. Countdown Timer effect
  useEffect(() => {
    if (activeTab !== 'exam_active' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, timeLeft]);

  // 4. Anti-Cheat Event Listeners (Tab-switch and Blur)
  useEffect(() => {
    if (activeTab !== 'exam_active') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerCheatIncident('TAB_SWITCH', 'Santri berpindah dari tab ujian CBT ke tab/jendela eksternal browser.');
      }
    };

    const handleWindowBlur = () => {
      triggerCheatIncident('WINDOW_BLUR', 'Santri melepaskan fokus layar ujian CBT (membuka aplikasi lain di desktop).');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeTab, activeAttempt]);

  const triggerCheatIncident = async (type, description) => {
    setCheatCount((prev) => prev + 1);
    setCheatModalOpen(true);

    try {
      await fetch('/api/v1/exams/log-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: activeAttempt?.id || 'att-active',
          student_id: user?.id || user?.username || 'u0000012b',
          student_name: user?.full_name || 'Muhammad Abdullah Ziyad',
          incident_type: type,
          description,
        }),
      });
      if (userCanManage) {
        fetchProctorData();
      }
    } catch (err) {
      console.warn('Gagal mencatat insiden anti-cheat:', err);
    }
  };

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // 5. Select exam from schedule list to enter token
  const handleSelectExamFromSchedule = (exam) => {
    if (exam.status === 'UPCOMING') {
      showModal({
        title: 'Jadwal Ujian Belum Dimulai',
        message: `Ujian ini dijadwalkan pada pukul ${exam.start_time} s.d. ${exam.end_time}. Silakan tunggu jadwal pelaksanaan aktif.`,
        type: 'info'
      });
      return;
    }
    setSelectedExam(exam);
    setTokenInput('');
    setTokenError('');
    setActiveTab('token_gate');
  };

  // 6. Handle Start Exam with Token
  const handleStartExam = async () => {
    if (!tokenInput.trim()) {
      setTokenError('Harap masukkan token ujian resmi.');
      return;
    }
    setTokenError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/exams/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: selectedExam?.id || 'exam-01',
          exam_token: tokenInput.trim(),
          student_id: user?.id || user?.username || 'u0000012b',
          student_name: user?.full_name || 'Muhammad Abdullah Ziyad',
          nisn: user?.nisn || '0081234561',
        }),
      });

      let json = {};
      try {
        json = await res.json();
      } catch (e) {
        json = {};
      }

      if (!res.ok || !json.success) {
        if (json.is_submitted) {
          showModal({
            title: 'Ujian Telah Selesai Dikerjakan',
            message: `Sesi ujian Anda telah dikumpulkan dan tersimpan di server. Anda tidak dapat mengerjakan ulang kecuali mendapatkan izin remedial dari Guru/Pengawas.`,
            type: 'warning',
            confirmText: 'Buka Hasil Ujian & Pembahasan',
            onConfirm: () => {
              if (json.data) {
                setExamResult(json.data);
                setActiveTab('exam_result');
              }
            }
          });
          setLoading(false);
          return;
        }
        setTokenError(json.message || `Token ujian tidak valid atau terjadi kendala server (Status: ${res.status}).`);
        setLoading(false);
        return;
      }

      // Start fresh or active attempt
      setActiveAttempt(json.data);
      // Clean slate: only set answers if continuing an in-progress attempt
      setAnswers(json.data.answers || {});
      setCurrentQuestionIndex(0);
      setTimeLeft((selectedExam?.duration_minutes || 45) * 60);
      setCheatCount(json.data.cheat_incident_count || 0);
      setActiveTab('exam_active');
    } catch (err) {
      setTokenError('Terjadi kesalahan jaringan saat memulai ujian.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Handle Option Selection (Auto-Save)
  const handleSelectOption = async (questionId, optionKey) => {
    const updated = { ...answers, [questionId]: optionKey };
    setAnswers(updated);
    setAutoSaveStatus('Menyimpan jawaban...');

    try {
      const res = await fetch('/api/v1/exams/save-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: activeAttempt?.id || 'att-active',
          question_id: questionId,
          answer: optionKey,
        }),
      });
      if (res.ok) {
        setAutoSaveStatus('Jawaban tersimpan di server ✓');
      } else {
        setAutoSaveStatus('Tersimpan di memori');
      }
    } catch (err) {
      setAutoSaveStatus('Tersimpan di memori');
    }
  };

  // 8. Submit Exam
  const handleSubmitExam = async () => {
    setShowSubmitModal(false);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/exams/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: activeAttempt?.id || 'att-active',
          student_id: user?.id || user?.username || 'u0000012b',
          answers,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setExamResult(json.data);
        setActiveTab('exam_result');
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
      } else {
        showModal({
          title: 'Gagal Mengirim Ujian',
          message: json.message || 'Gagal mengirim jawaban ujian ke server.',
          type: 'error'
        });
      }
    } catch (err) {
      showModal({
        title: 'Kesalahan Sistem',
        message: 'Terjadi kesalahan saat menyelesaikan ujian.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 9. Proctor Actions
  const handleResetSession = (attemptId, studentName) => {
    showModal({
      title: 'Konfirmasi Reset Sesi Ujian',
      message: `Apakah Anda yakin ingin mereset sesi ujian untuk santri "${studentName}"? Santri akan dapat login kembali ke lembar ujian.`,
      type: 'confirm',
      confirmText: 'Ya, Reset Sesi',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/proctor/reset-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempt_id: attemptId }),
          });
          const json = await res.json();
          if (res.ok) {
            showModal({
              title: 'Sesi Berhasil Direset',
              message: json.message,
              type: 'success'
            });
            fetchProctorData();
          }
        } catch (err) {
          showModal({
            title: 'Gagal Mereset',
            message: 'Terjadi kesalahan jaringan saat mereset sesi ujian.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleGrantRemedial = (attemptId, studentName) => {
    showModal({
      title: 'Konfirmasi Izin Remedial',
      message: `Izinkan sesi remedial untuk santri "${studentName}"?\n\nLembar ujian sebelumnya akan di-reset agar santri dapat membuka kembali ujian untuk perbaikan nilai.`,
      type: 'confirm',
      confirmText: 'Ya, Berikan Izin Remedial',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/proctor/grant-remedial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempt_id: attemptId }),
          });
          const json = await res.json();
          if (res.ok) {
            showModal({
              title: 'Izin Remedial Diberikan',
              message: json.message,
              type: 'success'
            });
            fetchProctorData();
          }
        } catch (err) {
          showModal({
            title: 'Gagal Memberikan Izin',
            message: 'Terjadi kesalahan jaringan saat mengizinkan remedial.',
            type: 'error'
          });
        }
      }
    });
  };

  // 10. Guru / Proktor: Buat Ujian Baru & Auto Generate Token
  const handleCreateExam = async (e) => {
    if (e) e.preventDefault();
    if (!newExamTitle.trim()) {
      showModal({
        title: 'Judul Ujian Kosong',
        message: 'Harap masukkan judul ujian sebelum menerbitkan jadwal.',
        type: 'warning'
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/exams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newExamTitle.trim(),
          subject_name: newExamSubject,
          course_class_name: 'Kelas X Paket C — Umar bin Khattab',
          tutor_name: user?.full_name || 'Ustadz Pengampu',
          start_time: newExamStartTime,
          end_time: newExamEndTime,
          duration_minutes: Number(newExamDuration) || 45,
          passing_score: Number(newExamPassing) || 75,
          questions: newExamQuestions,
        }),
      });
      let json = {};
      try {
        json = await res.json();
      } catch (e) {
        json = {};
      }

      if (res.ok && json.success) {
        showModal({
          title: 'Jadwal & Token Ujian Resmi Diterbitkan!',
          message: `Ujian "${newExamTitle}" berhasil disusun dan tersimpan dalam sistem.\n\n🔑 Token Ujian Otomatis: ${json.token}\n\nToken ini disusun otomatis oleh sistem dan siap dibagikan kepada peserta didik saat jam pelaksanaan ujian berlangsung.`,
          type: 'success',
          confirmText: 'Buka Pantauan Pengawas',
          onConfirm: () => {
            fetchExams();
            setActiveTab('proctor_view');
          }
        });
        setNewExamTitle('');
      } else {
        showModal({
          title: 'Gagal Menyusun Ujian',
          message: json.message || `Terjadi kendala pada server (Status: ${res.status}).`,
          type: 'error'
        });
      }
    } catch (err) {
      showModal({
        title: 'Kesalahan Jaringan',
        message: 'Tidak dapat menghubungi server ujian. Pastikan koneksi atau backend Go Fiber berjalan di port 8080.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questionsList = selectedExam?.questions || [];
  const currentQuestion = questionsList[currentQuestionIndex];
  const totalQuestions = questionsList.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (SIGNATURE DEI BANNER) */}
      {/* ======================================================== */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30 print:hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <ShieldCheck className="w-72 h-72" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Asesmen CBT & Integritas Ujian</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Asesmen CBT & Pengawasan Ujian Online
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Sistem evaluasi berbasis komputer dengan proteksi integritas layar, auto-save jawaban, dan penilaian objektif berstandar nasional.
          </p>
        </div>
      </div>

      {/* Switcher Khusus Pendidik / Proktor / Manajemen */}
      {userCanManage && activeTab !== 'exam_active' && (
        <div className="flex flex-wrap items-center p-1.5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-xs gap-1.5 print:hidden">
          <button
            onClick={() => setActiveTab('proctor_view')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'proctor_view'
                ? 'bg-dei-emerald text-white shadow-sm'
                : 'text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Grid Pengawas (Live)</span>
          </button>
          <button
            onClick={() => setActiveTab('exam_builder')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'exam_builder'
                ? 'bg-dei-emerald text-white shadow-sm'
                : 'text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bank Soal & Buat Ujian Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('exam_schedule')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'exam_schedule' || activeTab === 'token_gate'
                ? 'bg-dei-emerald text-white shadow-sm'
                : 'text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Monitoring Jadwal & Token</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PROCTOR MONITORING GRID (VIEW PROKTOR / GURU) */}
      {/* ======================================================== */}
      {activeTab === 'proctor_view' && userCanManage && (() => {
        const inProgressCount = proctorAttempts.filter((a) => a.status === 'IN_PROGRESS').length;
        const submittedCount = proctorAttempts.filter((a) => a.status === 'SUBMITTED').length;

        return (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="text-[11px] font-bold text-dei-muted uppercase">Total Santri Terdaftar</div>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink mt-1">
                {proctorStats.total_registered || proctorAttempts.length} Santri
              </div>
              <div className="text-[10px] text-dei-emerald font-semibold mt-1">Kelas X Paket C</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="text-[11px] font-bold text-dei-muted uppercase">Sesi Berjalan (In Progress)</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2">
                <span>{inProgressCount}</span>
                {inProgressCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-dei-muted mt-1">
                {inProgressCount > 0 ? 'Mengerjakan di layar CBT' : 'Tidak ada santri di ruang ujian'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="text-[11px] font-bold text-dei-muted uppercase">Sudah Dikumpulkan</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {submittedCount} Selesai
              </div>
              <div className="text-[10px] text-dei-muted mt-1">Ternilai otomatis</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <div className="text-[11px] font-bold text-dei-muted uppercase">Token Ujian Aktif</div>
              <div className="text-lg font-mono font-black text-purple-600 dark:text-purple-400 mt-1">
                UTS-PKBM-2026
              </div>
              <div className="text-[10px] text-dei-muted mt-1">Berlaku untuk UTS Ganjil</div>
            </div>
          </div>

          {/* Grid Table */}
          <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <Activity className="w-4 h-4 text-dei-emerald" />
                  Grid Pemantauan Ujian Real-Time
                </h2>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted">
                  Sinkronisasi langsung dengan peramban santri (pembaruan otomatis tiap 4 detik).
                </p>
              </div>
              <button
                onClick={fetchProctorData}
                className="px-3 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-dei-line dark:border-dei-dark-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-dei-muted dark:text-dei-dark-muted uppercase font-bold text-[10px] tracking-wider border-b border-dei-line dark:border-dei-dark-line">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4 text-center">Status Sesi</th>
                    <th className="py-3 px-4 text-center">Progres Jawaban</th>
                    <th className="py-3 px-4 text-center">Insiden Layar</th>
                    <th className="py-3 px-4 text-right">Aksi Proktor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dei-line dark:border-dei-dark-line">
                  {proctorAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-dei-muted dark:text-dei-dark-muted">
                        Belum ada sesi ujian santri yang tercatat saat ini. Sesi ujian akan otomatis terpantau secara real-time saat santri mulai memasukkan token ujian.
                      </td>
                    </tr>
                  ) : (
                    proctorAttempts.map((att, idx) => {
                    const ansCount = Object.keys(att.answers || {}).length;
                    const isCheating = att.cheat_incident_count > 0;
                    return (
                      <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-dei-ink dark:text-dei-dark-ink">{att.student_name}</div>
                          <div className="text-[10px] font-mono text-dei-muted">NISN: {att.nisn}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-dei-ink dark:text-dei-dark-ink">{att.exam_title}</div>
                          <div className="text-[10px] text-dei-muted">{att.subject_name}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {att.status === 'IN_PROGRESS' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Sedang Mengerjakan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Selesai (Skor: {att.total_score || 90})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {(() => {
                            const totalQ = att.questions?.length || att.total_questions || (att.exam_title?.includes('1') ? 1 : 11);
                            const safeTotal = totalQ > 0 ? totalQ : 1;
                            const pct = Math.min(100, Math.round((ansCount / safeTotal) * 100));
                            return (
                              <>
                                <div>{ansCount} / {safeTotal} Soal</div>
                                <div className="w-20 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mt-1 overflow-hidden">
                                  <div
                                    className="h-full bg-dei-emerald rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isCheating ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {att.cheat_incident_count} Insiden Terdeteksi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                              <Check className="w-3 h-3" />
                              Layar Aman
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {att.status === 'SUBMITTED' ? (
                              <button
                                onClick={() => handleGrantRemedial(att.id, att.student_name)}
                                className="px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-100 transition-colors"
                              >
                                Izinkan Remedial
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResetSession(att.id, att.student_name)}
                                className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reset Sesi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>

            {/* Incident Feed */}
            <div className="pt-2">
              <h3 className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Linimasa Pelanggaran Layar Terkini (Proctor Incident Feed)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {proctorIncidents.length === 0 ? (
                  <div className="p-3 text-center text-xs text-dei-muted rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
                    Belum ada insiden pelanggaran layar yang dilaporkan.
                  </div>
                ) : (
                  proctorIncidents.map((inc, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span className="font-bold text-dei-ink dark:text-dei-dark-ink">{inc.student_name}</span>
                        <span className="text-dei-muted">•</span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{inc.incident_type}</span>
                        <span className="text-dei-muted">•</span>
                        <span className="text-dei-muted">{inc.description}</span>
                      </div>
                      <div className="text-[10px] font-mono text-dei-muted">
                        {new Date(inc.logged_at).toLocaleTimeString('id-ID')} WIB
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })()}

      {/* ======================================================== */}
      {/* 2b. BANK SOAL & BUAT UJIAN BARU (AUTO-TOKEN GURU) */}
      {/* ======================================================== */}
      {activeTab === 'exam_builder' && userCanManage && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <h2 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <FileText className="w-5 h-5 text-dei-emerald" />
                  Bank Soal & Susun Jadwal Ujian Baru
                </h2>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-0.5">
                  Guru menyusun butir soal, kunci jawaban, dan jadwal pelaksanaan. Sistem akan secara otomatis menyusun <b>Token Ujian Resmi</b> saat Anda menerbitkan jadwal.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-dei-emerald border border-emerald-300">
                Otomatisasi Token Gate
              </span>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-6">
              {/* Form Atribut Ujian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink">
                    Judul Ujian / Asesmen
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: UTS Ganjil — Fiqih Ibadah & Thaharah"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:ring-2 focus:ring-dei-emerald focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink">
                    Mata Pelajaran
                  </label>
                  <select
                    value={newExamSubject}
                    onChange={(e) => setNewExamSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:ring-2 focus:ring-dei-emerald focus:outline-none font-semibold"
                  >
                    <option value="Tahfizh Al-Qur'an Bersanad & Tajwid">Tahfizh Al-Qur'an Bersanad & Tajwid</option>
                    <option value="Bahasa Arab Komunikatif & Nahwu">Bahasa Arab Komunikatif & Nahwu</option>
                    <option value="PAI & Fiqih Ibadah">PAI & Fiqih Ibadah</option>
                    <option value="Matematika Terapan & Logika Digital">Matematika Terapan & Logika Digital</option>
                    <option value="Bahasa Indonesia (Paket C)">Bahasa Indonesia (Paket C)</option>
                    <option value="AI Literacy & Digital Skill">AI Literacy & Digital Skill</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink">
                    Jam Mulai Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={newExamStartTime}
                    onChange={(e) => setNewExamStartTime(e.target.value)}
                    placeholder="08:00 WIB"
                    className="w-full px-3 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink">
                    Jam Selesai Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={newExamEndTime}
                    onChange={(e) => setNewExamEndTime(e.target.value)}
                    placeholder="09:30 WIB"
                    className="w-full px-3 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink">
                    Durasi Pengerjaan & KKM
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newExamDuration}
                      onChange={(e) => setNewExamDuration(e.target.value)}
                      placeholder="Menit"
                      className="w-1/2 px-3 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-mono text-center font-bold"
                    />
                    <input
                      type="number"
                      value={newExamPassing}
                      onChange={(e) => setNewExamPassing(e.target.value)}
                      placeholder="KKM"
                      className="w-1/2 px-3 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Daftar Butir Soal */}
              <div className="space-y-4 pt-4 border-t border-dei-line dark:border-dei-dark-line">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                    <span>Daftar Butir Soal ({newExamQuestions.length} Butir Soal)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNo = newExamQuestions.length + 1;
                      setNewExamQuestions([
                        ...newExamQuestions,
                        {
                          id: `q-custom-${nextNo}`,
                          prompt_text: '',
                          question_type: 'MULTIPLE_CHOICE',
                          points: 10,
                          options: [
                            { id: `opt-${nextNo}a`, option_key: 'A', option_text: '', is_correct: true },
                            { id: `opt-${nextNo}b`, option_key: 'B', option_text: '', is_correct: false },
                            { id: `opt-${nextNo}c`, option_key: 'C', option_text: '', is_correct: false },
                            { id: `opt-${nextNo}d`, option_key: 'D', option_text: '', is_correct: false }
                          ],
                          explanation: ''
                        }
                      ]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-dei-emerald dark:text-dei-emerald-neon text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Butir Soal</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {newExamQuestions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-dei-emerald">
                          Soal Nomor #{qIdx + 1}
                        </span>
                        {newExamQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewExamQuestions(newExamQuestions.filter((_, idx) => idx !== qIdx));
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-dei-muted">
                          Teks Pertanyaan / Soal
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={q.prompt_text}
                          onChange={(e) => {
                            const updated = [...newExamQuestions];
                            updated[qIdx].prompt_text = e.target.value;
                            setNewExamQuestions(updated);
                          }}
                          placeholder="Ketik butir soal ujian di sini..."
                          className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-xs focus:ring-2 focus:ring-dei-emerald focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-dei-muted">
                          Pilihan Jawaban & Tandai Kunci Jawaban yang Benar
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={opt.option_key}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                                opt.is_correct
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400'
                                  : 'bg-white dark:bg-dei-dark-surface border-dei-line dark:border-dei-dark-line'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={opt.is_correct}
                                onChange={() => {
                                  const updated = [...newExamQuestions];
                                  updated[qIdx].options = updated[qIdx].options.map((o, oI) => ({
                                    ...o,
                                    is_correct: oI === optIdx
                                  }));
                                  setNewExamQuestions(updated);
                                }}
                                className="w-4 h-4 text-dei-emerald focus:ring-dei-emerald cursor-pointer"
                              />
                              <span className="font-mono font-bold text-xs text-dei-ink dark:text-dei-dark-ink w-4">
                                {opt.option_key}.
                              </span>
                              <input
                                type="text"
                                required
                                value={opt.option_text}
                                onChange={(e) => {
                                  const updated = [...newExamQuestions];
                                  updated[qIdx].options[optIdx].option_text = e.target.value;
                                  setNewExamQuestions(updated);
                                }}
                                placeholder={`Pilihan ${opt.option_key}`}
                                className="flex-1 px-2 py-1 rounded-lg border border-dei-line dark:border-dei-dark-line bg-transparent text-xs focus:outline-none"
                              />
                              {opt.is_correct && (
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                  Kunci ✓
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-dei-muted">
                          Pembahasan Singkat / Dalil Referensi
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const updated = [...newExamQuestions];
                            updated[qIdx].explanation = e.target.value;
                            setNewExamQuestions(updated);
                          }}
                          placeholder="Penjelasan ringkas mengapa kunci tersebut benar..."
                          className="w-full px-3 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-dei-line dark:border-dei-dark-line flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('proctor_view')}
                  className="px-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-muted hover:text-dei-ink"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-all flex items-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Menerbitkan Ujian...' : 'Terbitkan Jadwal & Buat Token Otomatis'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. JADWAL UJIAN HARI INI (SEBELUM MASUK TOKEN) */}
      {/* ======================================================== */}
      {activeTab === 'exam_schedule' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-dei-emerald" />
                  Jadwal Pelaksanaan Ujian Hari Ini
                </h2>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-0.5">
                  Ujian hanya dapat dibuka saat jam sesi sedang berlangsung dan memerlukan token resmi dari pengawas.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink">
                Senin, 19 Oktober 2026
              </span>
            </div>

            {/* List of Scheduled Exams */}
            <div className="space-y-3 pt-2">
              {examEvents.map((exam) => {
                const realtimeStatus = getExamRealtimeStatus(exam);
                const isActive = realtimeStatus === 'ACTIVE';
                const isUpcoming = realtimeStatus === 'UPCOMING';
                const isCompleted = realtimeStatus === 'COMPLETED';

                return (
                  <div
                    key={exam.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500/20'
                        : isCompleted
                        ? 'bg-neutral-50/60 dark:bg-neutral-800/20 border-dei-line dark:border-dei-dark-line opacity-80'
                        : 'bg-white dark:bg-dei-dark-surface border-dei-line dark:border-dei-dark-line'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Sedang Berlangsung (Aktif)
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-dei-muted">
                            Akan Datang ({exam.start_time})
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300">
                            Waktu Ujian Selesai ({exam.end_time})
                          </span>
                        )}
                        <span className="text-xs text-dei-muted font-mono">
                          Durasi: {exam.duration_minutes} Menit • KKM: {exam.passing_score}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-dei-ink dark:text-dei-dark-ink">
                        {exam.title}
                      </h3>
                      <div className="text-xs text-dei-muted flex items-center gap-2">
                        <span>Mata Pelajaran: <b>{exam.subject_name}</b></span>
                        <span>•</span>
                        <span>Pengampu: {exam.tutor_name}</span>
                        <span>•</span>
                        <span>Waktu: <b>{exam.start_time} - {exam.end_time}</b></span>
                      </div>
                    </div>

                    <div>
                      {userCanManage ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dei-line dark:border-dei-dark-line flex items-center gap-2">
                            <span className="text-[10px] text-dei-muted font-bold uppercase">Token Ujian:</span>
                            <span className="font-mono font-black text-xs text-dei-emerald dark:text-dei-emerald-neon">{exam.exam_token}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(exam.exam_token);
                                showModal({
                                  title: 'Token Berhasil Disalin!',
                                  message: `Token ujian resmi "${exam.exam_token}" telah disalin ke clipboard Anda. Silakan bagikan kepada santri yang berhak.`,
                                  type: 'success'
                                });
                              }}
                              className="p-1 hover:text-dei-emerald text-dei-muted transition-colors"
                              title="Salin Token"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExam(exam);
                              setActiveTab('exam_review');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-dei-muted" />
                            <span>Preview Soal</span>
                          </button>
                        </div>
                      ) : isActive ? (
                        <button
                          onClick={() => handleSelectExamFromSchedule(exam)}
                          className="px-5 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-all flex items-center gap-2 shadow-sm"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Buka Ujian (Masukkan Token)</span>
                        </button>
                      ) : isUpcoming ? (
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-dei-muted text-xs font-bold cursor-not-allowed opacity-60"
                        >
                          Belum Dimulai (Pukul {exam.start_time})
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-dei-muted text-xs font-bold cursor-not-allowed opacity-60"
                        >
                          Waktu Ujian Telah Berakhir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TOKEN GATE ENTRY (SETELAH MEMILIH UJIAN AKTIF) */}
      {/* ======================================================== */}
      {activeTab === 'token_gate' && selectedExam && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-lg space-y-5">
            <button
              onClick={() => setActiveTab('exam_schedule')}
              className="text-xs text-dei-muted hover:text-dei-ink flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Jadwal Ujian Hari Ini</span>
            </button>

            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink">
                Otorisasi Masuk Ujian CBT
              </h2>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed">
                {selectedExam.title} ({selectedExam.start_time} - {selectedExam.end_time})
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Ketentuan Sesi Ujian:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                <li>Ujian yang telah dikumpulkan <b>tidak dapat dibuka kembali</b> kecuali mendapat izin remedial.</li>
                <li>Layar terpantau sistem anti-curang. Tab switch akan dicatat di log pengawas.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-dei-muted uppercase tracking-wider">
                Token Ujian Resmi
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value.toUpperCase());
                  setTokenError('');
                }}
                placeholder="Contoh: UTS-PKBM-2026"
                className="w-full px-4 py-3.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink font-mono font-bold tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-dei-emerald"
              />
              {tokenError && (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tokenError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setTokenInput('UTS-PKBM-2026')}
              className="w-full text-[11px] font-semibold text-dei-emerald hover:underline text-center"
            >
              ⚡ Salin Token Resmi Demo: <b>UTS-PKBM-2026</b>
            </button>

            <button
              onClick={handleStartExam}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bismillah, Masuk Ruang Ujian</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ACTIVE EXAM (DISTRACTION-FREE & NO HEADER OVERLAP!) */}
      {/* ======================================================== */}
      {activeTab === 'exam_active' && currentQuestion && (
        <div className="space-y-4">
          {/* Top Exam Status Bar (Clean container outside card, NO overlap!) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                  {selectedExam?.title}
                </h2>
                <div className="text-[10px] text-dei-muted flex items-center gap-2">
                  <span>Peserta: <b>{user?.full_name || 'Muhammad Abdullah Ziyad'}</b></span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{autoSaveStatus}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl border border-dei-line dark:border-dei-dark-line text-dei-muted hover:text-dei-ink text-xs flex items-center gap-1"
                title="Layar Penuh Tanpa Gangguan"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}</span>
              </button>

              {/* Countdown Timer */}
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-bold text-sm ${
                timeLeft < 300
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 animate-pulse'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink border-dei-line dark:border-dei-dark-line'
              }`}>
                <Clock className="w-4 h-4 text-dei-muted" />
                <span>{formatTimer(timeLeft)}</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai & Kumpulkan</span>
              </button>
            </div>
          </div>

          {/* Exam Grid: Left Question (3 cols), Right Palette (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Question Box */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-6">
                {/* Question Header & Doubt Marker */}
                <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-dei-emerald/10 text-dei-emerald font-black text-xs">
                      Soal No. {currentQuestionIndex + 1}
                    </span>
                    <span className="text-xs text-dei-muted font-semibold">
                      {currentQuestion.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda (10 Poin)' : 'Uraian Esai (20 Poin)'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setMarkedDoubt((prev) => ({
                        ...prev,
                        [currentQuestion.id]: !prev[currentQuestion.id],
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                      markedDoubt[currentQuestion.id]
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                        : 'border-dei-line dark:border-dei-dark-line text-dei-muted hover:text-dei-ink'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{markedDoubt[currentQuestion.id] ? 'Ditandai Ragu-Ragu' : 'Tandai Ragu-Ragu'}</span>
                  </button>
                </div>

                {/* Prompt Text - CLEAR & UNCLUTTERED */}
                <div className="text-base sm:text-lg font-semibold text-dei-ink dark:text-dei-dark-ink leading-relaxed pt-1">
                  {currentQuestion.prompt_text}
                </div>

                {/* Multiple Choice Options */}
                {currentQuestion.question_type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt.option_key;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(currentQuestion.id, opt.option_key)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-dei-emerald ring-2 ring-dei-emerald/30 shadow-sm'
                              : 'bg-neutral-50/50 dark:bg-neutral-800/40 border-dei-line dark:border-dei-dark-line hover:border-neutral-400 dark:hover:border-neutral-600'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-dei-emerald text-white'
                                : 'bg-white dark:bg-neutral-700 text-dei-muted dark:text-dei-dark-muted border border-dei-line dark:border-dei-dark-line'
                            }`}
                          >
                            {opt.option_key}
                          </div>
                          <div className={`text-xs sm:text-sm pt-0.5 leading-relaxed ${
                            isSelected ? 'font-bold text-emerald-900 dark:text-emerald-200' : 'text-dei-ink dark:text-dei-dark-ink'
                          }`}>
                            {opt.option_text}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Essay Input */}
                {currentQuestion.question_type === 'ESSAY' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-dei-muted uppercase tracking-wider">
                      Uraian Jawaban Santri:
                    </label>
                    <textarea
                      rows={6}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                      placeholder="Ketikkan uraian jawaban penjelasan Anda di sini..."
                      className="w-full p-4 rounded-2xl border border-dei-line dark:border-dei-dark-line bg-neutral-50/50 dark:bg-neutral-800/50 text-dei-ink dark:text-dei-dark-ink text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                    />
                    <div className="flex items-center justify-between text-[11px] text-dei-muted">
                      <span>Karakter: {(answers[currentQuestion.id] || '').length} huruf</span>
                      <span>Disimpan otomatis ke server</span>
                    </div>
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-dei-line dark:border-dei-dark-line">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="text-xs font-bold text-dei-muted">
                    Soal {currentQuestionIndex + 1} dari {totalQuestions}
                  </div>

                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="px-4 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Tinjau & Selesai</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Question Palette */}
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink uppercase tracking-wider">
                    Palet Nomor Soal
                  </h3>
                  <span className="text-[11px] font-bold text-dei-emerald">
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {questionsList.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isDoubt = !!markedDoubt[q.id];
                    const isActive = idx === currentQuestionIndex;

                    let btnStyle = 'bg-neutral-100 dark:bg-neutral-800 text-dei-muted border-dei-line dark:border-dei-dark-line';
                    if (isAnswered) {
                      btnStyle = 'bg-dei-emerald text-white border-dei-emerald font-bold';
                    }
                    if (isDoubt) {
                      btnStyle = 'bg-amber-400 text-white border-amber-400 font-bold';
                    }
                    if (isActive) {
                      btnStyle += ' ring-2 ring-purple-500 ring-offset-2';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${btnStyle}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="pt-3 border-t border-dei-line dark:border-dei-dark-line space-y-1.5 text-[10px] text-dei-muted">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-dei-emerald" />
                    <span>Sudah Dijawab ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-400" />
                    <span>Ragu-Ragu ({Object.keys(markedDoubt).filter((k) => markedDoubt[k]).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-neutral-200 dark:bg-neutral-700" />
                    <span>Belum Dijawab ({totalQuestions - answeredCount})</span>
                  </div>
                </div>

                {/* Anti-Cheat Counter */}
                <div className="pt-3 border-t border-dei-line dark:border-dei-dark-line">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line text-center space-y-1">
                    <div className="text-[10px] font-bold text-dei-muted uppercase">Status Layar Ujian</div>
                    <div className="text-xs font-bold text-dei-emerald flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Pelanggaran Layar: {cheatCount} Kali</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. EXAM RESULT & SCORE CARD (SETELAH SELESAI UJIAN) */}
      {/* ======================================================== */}
      {activeTab === 'exam_result' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-lg text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-dei-emerald flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              Alhamdulillah, Ujian Berhasil Dikumpulkan
            </span>
            <h2 className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink">
              Hasil Asesmen CBT Online
            </h2>
            <p className="text-xs text-dei-muted dark:text-dei-dark-muted max-w-md mx-auto">
              Jawaban pilihan ganda Anda telah dinilai otomatis secara real-time.
            </p>
          </div>

          {/* Score Card */}
          <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line flex items-center justify-around">
            <div>
              <div className="text-[10px] font-bold text-dei-muted uppercase">Skor Pilihan Ganda</div>
              <div className="text-4xl font-black text-dei-emerald dark:text-dei-emerald-neon mt-1">
                {examResult?.score_pg ?? 90}
                <span className="text-base text-dei-muted font-normal"> / 100</span>
              </div>
            </div>
            <div className="h-12 w-px bg-dei-line dark:bg-dei-dark-line" />
            <div>
              <div className="text-[10px] font-bold text-dei-muted uppercase">Status Kelulusan</div>
              <div className="mt-1">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  LULUS KKM (75)
                </span>
              </div>
            </div>
            <div className="h-12 w-px bg-dei-line dark:bg-dei-dark-line" />
            <div>
              <div className="text-[10px] font-bold text-dei-muted uppercase">Predikat Nilai</div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                Mumtaz (A)
              </div>
            </div>
          </div>

          {/* Information Notice on E-Rapor Access */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-left text-xs text-blue-900 dark:text-blue-200 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Informasi Pembagian E-Rapor Semester:</span>
            </div>
            <p className="text-[11px] text-blue-800/90 dark:text-blue-200/90 leading-relaxed">
              Nilai ujian ini telah tersimpan di pangkalan data. E-Rapor Digital resmi akan dibuka aksesnya untuk santri dan wali santri setelah seluruh nilai difinalisasi serta diumumkan resmi oleh <b>Wali Kelas</b> pada hari pembagian rapor.
            </p>
          </div>

          {/* Action Buttons (Lihat Rincian Hasil & Kembali ke Jadwal) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('exam_review')}
              className="px-5 py-3 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors flex items-center gap-2 shadow-sm"
            >
              <ListOrdered className="w-4 h-4" />
              <span>Lihat Rincian Jawaban & Pembahasan</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('exam_schedule');
                setActiveAttempt(null);
                setAnswers({});
              }}
              className="px-4 py-3 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Kembali ke Daftar Ujian Hari Ini
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. EXAM REVIEW & ANSWER KEY (RINCIAN HASIL UJIAN) */}
      {/* ======================================================== */}
      {activeTab === 'exam_review' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <h2 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink">
                  Rincian Jawaban & Pembahasan Ujian
                </h2>
                <p className="text-xs text-dei-muted">
                  Telaah evaluasi butir soal pilihan ganda dan kunci jawaban terstandarisasi.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('exam_result')}
                className="px-3 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-muted hover:text-dei-ink"
              >
                Kembali ke Skor
              </button>
            </div>

            <div className="space-y-4">
              {questionsList.map((q, idx) => {
                const studentAns = answers[q.id] || (examResult?.answers && examResult.answers[q.id]) || '-';
                const correctOpt = q.options?.find((o) => o.isCorrect || o.is_correct);
                const isCorrect = correctOpt ? studentAns === correctOpt.option_key : true;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-5 rounded-2xl border-2 space-y-3 text-xs shadow-sm transition-all ${
                      isCorrect
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                        Butir Soal #{idx + 1}
                      </span>
                      {q.question_type === 'MULTIPLE_CHOICE' && (
                        isCorrect ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Jawaban Anda Benar (+10 Poin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Jawaban Anda Salah (Skor: 0 Poin)
                          </span>
                        )
                      )}
                    </div>

                    <p className="font-bold text-dei-ink dark:text-dei-dark-ink text-sm leading-relaxed">
                      {q.prompt_text}
                    </p>

                    {/* Komparasi Jawaban */}
                    <div className="p-3.5 rounded-xl bg-white/80 dark:bg-dei-dark-surface/90 border border-dei-line dark:border-dei-dark-line flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-dei-muted font-semibold">Jawaban Anda:</span>
                        <span className={`px-2.5 py-0.5 rounded-md font-mono font-black ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
                        }`}>
                          {studentAns}
                        </span>
                      </div>
                      {correctOpt && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-dei-muted font-semibold">Kunci Jawaban yang Benar:</span>
                          <span className="px-2.5 py-0.5 rounded-md font-mono font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                            {correctOpt.option_key} — {correctOpt.option_text}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Kotak Pembahasan */}
                    <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pembahasan & Dalil Referensi:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {q.explanation || 'Pembahasan terstandarisasi berdasarkan kaidah tajwid sanad riwayat Imam Hafsh dan silabus resmi PKBM Digital Dar El Iman.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setActiveTab('exam_schedule');
                  setActiveAttempt(null);
                  setAnswers({});
                }}
                className="px-5 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors"
              >
                Selesai Meninjau, Kembali ke Jadwal Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. ANTI-CHEAT MODAL */}
      {/* ======================================================== */}
      {cheatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border-2 border-rose-500 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Peringatan Integritas Ujian #{cheatCount}
              </span>
              <h3 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink">
                Terdeteksi Meninggalkan Layar CBT!
              </h3>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed">
                Jendela peramban Anda sempat beralih ke tab atau aplikasi lain. Pelanggaran ini <b>langsung dicatat dan dikirim ke Grid Pengawas Proktor secara real-time</b>.
              </p>
            </div>

            <button
              onClick={() => setCheatModalOpen(false)}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md"
            >
              Saya Mengerti, Kembali Mengerjakan Ujian
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-dei-ink dark:text-dei-dark-ink">
                Konfirmasi Pengumpulan Lembar Jawaban
              </h3>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed">
                Anda telah menjawab <b>{answeredCount}</b> dari <b>{totalQuestions}</b> butir soal. Apakah Anda yakin ingin mengumpulkan ujian sekarang?
              </p>
            </div>

            {totalQuestions - answeredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-left text-[11px] text-amber-800 dark:text-amber-300">
                ⚠️ Masih ada <b>{totalQuestions - answeredCount} butir soal</b> yang belum Anda jawab. Lembar ujian tidak dapat dibuka kembali setelah dikumpulkan.
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cek Ulang
              </button>
              <button
                onClick={handleSubmitExam}
                className="flex-1 py-2.5 px-4 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors shadow-sm"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. THEME MODAL (PENGGANTI ALERT & CONFIRM BROWSER) */}
      {/* ======================================================== */}
      <ThemeModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          hideModal();
        }}
        onCancel={() => {
          if (modalConfig.onCancel) modalConfig.onCancel();
          hideModal();
        }}
        onClose={hideModal}
      />
    </div>
  );
};

export default CbtPage;
