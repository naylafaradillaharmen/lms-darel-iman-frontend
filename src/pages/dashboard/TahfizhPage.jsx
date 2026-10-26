import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Calendar,
  Volume2,
  ExternalLink,
  PlusCircle,
  Clock,
  UserCheck,
  Bookmark,
  Mic,
  MicOff,
  Square,
  Search,
  Filter,
  AlertCircle,
  FileAudio,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeModal } from '../../components/common/ThemeModal';
import {
  isPimpinan,
  isManajemen,
  isPimpinanOrManajemen,
  isWaliKelas,
  isTutor,
  isMusyrifTahfizh,
  isOtherTutor,
  isSantri,
  getRoleDisplayBadge
} from '../../utils/rbac';

export const TahfizhPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // ThemeModal State (Pengganti alert & confirm browser)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  const showModal = (cfg) => setModalConfig({ isOpen: true, ...cfg });
  const hideModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  // Form input setoran state (for student or tutor)
  const [showInputForm, setShowInputForm] = useState(false);
  const [logType, setLogType] = useState('ZIYADAH');
  const [surahName, setSurahName] = useState("An-Naba'");
  const [ayatStart, setAyatStart] = useState(1);
  const [ayatEnd, setAyatEnd] = useState(16);
  const [studentNotes, setStudentNotes] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Direct Audio Upload & Voice Recording state
  const [uploadedAudioFile, setUploadedAudioFile] = useState(null); // { name, size, dataUrl }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Musyrif Evaluation Modal state
  const [evaluatingLog, setEvaluatingLog] = useState(null);
  const [evalGrade, setEvalGrade] = useState('MUMTAZ');
  const [evalTajweedScore, setEvalTajweedScore] = useState('MUMTAZ');
  const [evalMakhrajScore, setEvalMakhrajScore] = useState('Fasih & Tepat Sesuai Kaidah');
  const [evalNotes, setEvalNotes] = useState('Masya Allah bacaan tartil, makhraj dan mad thabi\'i terjaga dengan baik.');
  const [evalSaving, setEvalSaving] = useState(false);

  // Strict RBAC Role Helpers
  const userIsPimpinan = isPimpinan(user);
  const userIsWaliKelas = isWaliKelas(user);
  const userIsMusyrif = isMusyrifTahfizh(user);
  const userIsSantri = isSantri(user);
  const userIsNonTahfizhStaff = !userIsMusyrif && !userIsWaliKelas && !userIsPimpinan && !userIsSantri;

  const isTutorOrAdmin = userIsPimpinan || userIsWaliKelas || userIsMusyrif;
  const roleBadge = getRoleDisplayBadge(user);

  const fetchTahfizhData = async () => {
    setLoading(true);
    try {
      const [resLogs, resGroups] = await Promise.all([
        fetch('/api/v1/tahfizh/logs'),
        fetch('/api/v1/tahfizh/groups'),
      ]);
      const [dLogs, dGroups] = await Promise.all([resLogs.json(), resGroups.json()]);
      if (dLogs.success) setLogs(dLogs.data);
      if (dGroups.success) setGroups(dGroups.data);
    } catch (err) {
      console.error('Gagal mengambil data tahfizh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTahfizhData();
  }, []);

  // Voice recording controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result;
          setRecordedVoiceUrl(base64data);
          setUploadedAudioFile({
            name: `Setoran-Tahfizh-${surahName}-${Date.now()}.mp3`,
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            dataUrl: base64data,
          });
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone error:', err);
      showModal({
        title: 'Izin Mikrofon Diperlukan',
        message: 'Izin mikrofon diperlukan untuk merekam bacaan Al-Qur\'an langsung. Silakan aktifkan izin mikrofon atau unggah berkas audio rekaman.',
        type: 'warning'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  // Direct File input for audio
  const handleAudioFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedAudioFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl: reader.result,
      });
      setRecordedVoiceUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Setoran Tahfizh
  // NOTE: If student submits, Grade is ALWAYS 'MENUNGGU_NILAI' (student CANNOT grade themselves!)
  const handleCreateLog = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalAudioUrl = uploadedAudioFile?.dataUrl || audioUrl || 'https://cdn.darel-iman.or.id/audio/setoran-an-naba-ziyad.mp3';

      const res = await fetch('/api/v1/tahfizh/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.id || user?.username || 'u0000012b',
          student_name: user?.full_name || 'Muhammad Abdullah Ziyad',
          log_type: logType,
          surah_name: surahName,
          ayat_start: parseInt(ayatStart),
          ayat_end: parseInt(ayatEnd),
          grade: 'MENUNGGU_NILAI', // Exclusively evaluated by Musyrif
          notes: studentNotes || 'Bismillah ustadz, mohon koreksi dan penilaian bacaan tajwid saya.',
          audio_url: finalAudioUrl,
          tutor_name: 'Ustadz Ahmad Fauzi, Lc.',
          tutor_id: 't0000009',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedbackMsg(json.message);
        setTimeout(() => {
          setSaving(false);
          setShowInputForm(false);
          setFeedbackMsg('');
          setUploadedAudioFile(null);
          setRecordedVoiceUrl('');
          setStudentNotes('');
          fetchTahfizhData();
        }, 1300);
      }
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  // Musyrif Submit Evaluation
  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    setEvalSaving(true);
    try {
      const res = await fetch('/api/v1/tahfizh/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: evaluatingLog.id || evaluatingLog.ID,
          grade: evalGrade,
          tajweed_score: evalTajweedScore,
          makhraj_score: evalMakhrajScore,
          notes: evalNotes,
          tutor_id: user?.id || 't0000009',
          tutor_name: user?.full_name || 'Ustadz Ahmad Fauzi, Lc.',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEvaluatingLog(null);
        fetchTahfizhData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvalSaving(false);
    }
  };

  // DATA ISOLATION FILTER FOR TAHFIZH LOGS:
  // - Pimpinan & Wali Kelas: Have class-wide / global monitoring access.
  // - Tahfizh Musyrif (Ustadz Ahmad Fauzi): Views and grades setoran for his halaqah.
  // - Santri (e.g. Ziyad, Yafiq): ONLY sees their own personal setoran records.
  // - Non-Musyrif Staff / Other Tutor: Empty setoran (data terisolasi rapet).
  const displayedLogs = (userIsPimpinan || userIsWaliKelas)
    ? logs
    : userIsMusyrif
    ? logs.filter((l) => (l.tutor_id === user?.id || (l.tutor_name || '').includes('Ahmad Fauzi') || !l.tutor_id))
    : userIsSantri
    ? logs.filter((l) => {
        const lName = (l.student_name || l.StudentName || '').toLowerCase().trim();
        const uName = (user?.full_name || '').toLowerCase().trim();
        const uUser = (user?.username || '').toLowerCase().trim();
        const sId = (l.student_id || l.StudentID || '').toLowerCase().trim();

        const matchName = uName && (lName.includes(uName) || uName.includes(lName));
        const matchUser = uUser && (sId.includes(uUser) || uUser.includes(sId));
        const matchId = user?.id && sId === String(user.id).toLowerCase();

        return matchName || matchUser || matchId;
      })
    : [];

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const surahList = [
    "An-Naba' (40 Ayat)",
    "An-Nazi'at (46 Ayat)",
    "'Abasa (42 Ayat)",
    'At-Takwir (29 Ayat)',
    'Al-Infitar (19 Ayat)',
    'Al-Muthaffifin (36 Ayat)',
    'Al-Insyiqaq (25 Ayat)',
    'Al-Buruj (22 Ayat)',
    'Ath-Thariq (17 Ayat)',
    "Al-A'la (19 Ayat)",
    'Al-Ghasyiyah (26 Ayat)',
    'Al-Fajr (30 Ayat)',
    'Al-Balad (20 Ayat)',
    'Asy-Syams (15 Ayat)',
    'Al-Lail (21 Ayat)',
    'Adh-Dhuha (11 Ayat)',
    'Al-Insyirah (8 Ayat)',
    'At-Tin (8 Ayat)',
    "Al-'Alaq (19 Ayat)",
    'Al-Qadr (5 Ayat)',
    'Al-Bayyinah (8 Ayat)',
    'Az-Zalzalah (8 Ayat)',
    "Al-'Adiyat (11 Ayat)",
    "Al-Qari'ah (11 Ayat)",
    'At-Takatsur (8 Ayat)',
    "Al-'Ashr (3 Ayat)",
    'Al-Humazah (9 Ayat)',
    'Al-Fil (5 Ayat)',
    'Quraisy (4 Ayat)',
    "Al-Ma'un (7 Ayat)",
    'Al-Kautsar (3 Ayat)',
    'Al-Kafirun (6 Ayat)',
    'An-Nashr (3 Ayat)',
    'Al-Lahab (5 Ayat)',
    'Al-Ikhlas (4 Ayat)',
    'Al-Falaq (5 Ayat)',
    'An-Nas (6 Ayat)',
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner Tahfizh */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <Award className="w-72 h-72" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300">
            <Award className="w-3.5 h-3.5" />
            <span>Halaqah Tahfizh Al-Qur'an Bersanad</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mutaba'ah & Sanad Al-Qur'an
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Kurikulum Tahfizh bersanad <b>Hafsh 'an 'Ashim Min Thariq Asy-Syathibiyyah</b>. Santri menyetor bacaan audio langsung dari mikrofon/berkas, dinilai secara eksklusif oleh Ustadz Musyrif.
          </p>
        </div>
      </div>



      {/* Info Halaqah Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-dei-line dark:border-dei-dark-line">
          <div>
            <span className="text-[11px] font-bold text-dei-gold uppercase tracking-wider">Halaqah Binaan</span>
            <h2 className="text-lg font-extrabold text-dei-ink dark:text-dei-dark-ink mt-0.5">
              Halaqah Imam Asy-Syathibi (Paket C Ikhwan)
            </h2>
            <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-0.5">
              Musyrif: <b>Ustadz Ahmad Fauzi, Lc.</b> • Target: <b>Juz 30 (An-Naba' s.d. An-Nas)</b>
            </p>
          </div>

          {userIsSantri ? (
            <button
              id="btn-toggle-setoran-form"
              onClick={() => setShowInputForm(!showInputForm)}
              className="py-2.5 px-4 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow flex items-center gap-2 flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>{showInputForm ? 'Tutup Formulir Setoran' : 'Setor Hafalan Baru (Audio)'}</span>
            </button>
          ) : userIsMusyrif ? (
            <span className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-dei-emerald text-xs font-bold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-dei-emerald" />
              <span>Mode Penilaian Musyrif Aktif</span>
            </span>
          ) : (
            <span className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Akses Khusus Musyrif & Wali Kelas</span>
            </span>
          )}
        </div>

        {/* 3 KPI stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-3.5 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
            <span className="text-xs text-dei-muted dark:text-dei-dark-muted">Total Setoran Anda</span>
            <div className="text-xl font-extrabold text-dei-emerald dark:text-dei-emerald-neon mt-1">
              {displayedLogs.length} Kali Setoran
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Mutaba'ah Harian</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
            <span className="text-xs text-dei-muted dark:text-dei-dark-muted">Predikat Kualitas</span>
            <div className="text-xl font-extrabold text-dei-gold mt-1">Mumtaz Bersanad</div>
            <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted">Kaidah Tajwid Terpenuhi</span>
          </div>

          <div className="p-3.5 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
            <span className="text-xs text-dei-muted dark:text-dei-dark-muted">Status Sanad</span>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">Hafsh 'an 'Ashim</div>
            <span className="text-[11px] text-dei-muted dark:text-dei-dark-muted">Teruji Musyrif Resmi</span>
          </div>
        </div>
      </div>

      {/* FORMULIR INPUT SETORAN TAHFIZH (SANTRI ONLY SUBMITS AUDIO, MUSYRIF GRADES) */}
      {showInputForm && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border-2 border-dei-emerald dark:border-dei-emerald-neon shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
            <div>
              <span className="text-[11px] font-bold text-dei-gold">Setoran Santri</span>
              <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-dei-emerald" />
                Formulir Setoran Hafalan Al-Qur'an (Ziyadah / Muraja'ah)
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-dei-emerald font-mono">
              Santri: {user?.full_name || 'Santri'}
            </span>
          </div>

          {/* Alert explaining that grading is done by Musyrif */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ketentuan Penilaian Sanad & Tajwid:</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                Santri hanya menyetorkan rekaman audio dan rincian ayat. Predikat (Mumtaz, Jayyid, dll.) serta penilaian makhraj & tajwid <b>dinilai secara eksklusif oleh Ustadz Musyrif</b> setelah rekaman didengarkan.
              </p>
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Jenis Setoran Hafalan *
                </label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-bold text-dei-ink dark:text-dei-dark-ink"
                >
                  <option value="ZIYADAH">Ziyadah (Hafalan Baru)</option>
                  <option value="MURAJAAH">Muraja'ah (Pengulangan Hafalan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Pilihan Surah *
                </label>
                <select
                  value={surahName}
                  onChange={(e) => setSurahName(e.target.value.split(' ')[0])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-bold text-dei-ink dark:text-dei-dark-ink"
                >
                  {surahList.map((s) => (
                    <option key={s} value={s.split(' ')[0]}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Rentang Ayat (Mulai s.d. Selesai) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    required
                    value={ayatStart}
                    onChange={(e) => setAyatStart(e.target.value)}
                    placeholder="Ayat awal"
                    className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-bold"
                  />
                  <input
                    type="number"
                    min={1}
                    required
                    value={ayatEnd}
                    onChange={(e) => setAyatEnd(e.target.value)}
                    placeholder="Ayat akhir"
                    className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Status Penilaian
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Menunggu Penilaian Musyrif</span>
                </div>
              </div>
            </div>

            {/* DIRECT AUDIO RECORDING & FILE UPLOAD */}
            <div className="p-4 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line space-y-3">
              <label className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-dei-emerald" />
                Unggah Berkas Audio atau Rekam Suara Langsung *
              </label>

              {/* Option A: Direct File Upload */}
              <div>
                <span className="block text-[11px] font-semibold text-dei-muted mb-1">
                  1. Pilih File Audio (MP3 / WAV / M4A) dari perangkat Anda:
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="w-full text-xs text-dei-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-dei-emerald file:text-white hover:file:bg-dei-emerald-dark cursor-pointer"
                />
              </div>

              {/* Option B: Voice Recorder Mic */}
              <div className="pt-2 border-t border-dei-line dark:border-dei-dark-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-dei-muted">
                    2. Atau Rekam Lantunan Ayat Langsung (Gunakan Mikrofon):
                  </span>
                  {isRecording && (
                    <span className="text-xs font-bold font-mono text-red-500 animate-pulse flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      Merekam: {formatTimer(recordingSeconds)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="py-1.5 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Mulai Rekam Suara Setoran</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="py-1.5 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold flex items-center gap-1.5 shadow animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Selesai Merekam</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Playback Preview */}
              {recordedVoiceUrl && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Audio Setoran Siap Dikirim ({uploadedAudioFile?.name || 'Rekaman Suara'})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedAudioFile(null);
                        setRecordedVoiceUrl('');
                      }}
                      className="text-red-500 font-bold text-xs"
                    >
                      Hapus
                    </button>
                  </div>
                  <audio controls src={recordedVoiceUrl} className="w-full h-8" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                Catatan Santri (Opsional)
              </label>
              <textarea
                rows={2}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Misal: Bismillah ustadz, saya mengulang ayat 1-16 karena kemarin sempat ragu di ayat 12..."
                className="w-full p-3 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:outline-none focus:ring-2 focus:ring-dei-emerald"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopRecording();
                  setShowInputForm(false);
                }}
                className="py-2 px-4 rounded-xl border text-xs font-semibold text-dei-muted hover:bg-neutral-100"
              >
                Batal
              </button>
              <button
                id="btn-save-setoran"
                type="submit"
                disabled={saving}
                className="py-2 px-6 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow disabled:opacity-50"
              >
                {saving ? 'Mengirim...' : 'Kirim Setoran ke Musyrif'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABEL MUTABA'AH RIWAYAT SETORAN TAHFIZH */}
      <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-dei-line dark:border-dei-dark-line">
          <div>
            <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-dei-emerald dark:text-dei-emerald-neon" />
              {userIsSantri
                ? `Buku Mutaba'ah Setoran Saya (${user?.full_name || 'Santri'})`
                : userIsMusyrif || userIsWaliKelas || userIsPimpinan
                ? 'Buku Mutaba\'ah Riwayat Setoran Seluruh Santri'
                : `Buku Mutaba'ah Halaqah Tahfizh (Akses Terbatas: ${roleBadge.label})`}
            </h3>
            <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-0.5">
              {userIsSantri
                ? 'Daftar riwayat setoran hafalan Al-Qur\'an dan hasil evaluasi tajwid dari Musyrif Anda.'
                : userIsMusyrif || userIsWaliKelas || userIsPimpinan
                ? 'Ustadz Musyrif dapat memutar rekaman suara santri dan memberikan penilaian tajwid serta predikat kelulusan.'
                : 'Sesuai kebijakan isolasi data, mutaba\'ah setoran santri dikelola khusus oleh Musyrif Pembimbing.'}
            </p>
          </div>
          <span className="text-xs text-dei-muted font-mono">{displayedLogs.length} Catatan Masuk</span>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-dei-muted dark:text-dei-dark-muted bg-dei-bg dark:bg-dei-dark-bg rounded-xl border border-dashed border-dei-line dark:border-dei-dark-line space-y-2">
            <Lock className="w-8 h-8 mx-auto text-dei-muted opacity-40" />
            <p className="font-semibold">{userIsSantri ? 'Belum ada catatan setoran untuk akun Anda.' : 'Bukan Pengampu Tahfizh / Musyrif Halaqah'}</p>
            <p>{userIsSantri ? 'Silakan klik tombol "Setor Hafalan Baru (Audio)" untuk mengirim setoran pertama.' : 'Data mutaba\'ah setoran santri tersimpan privat dan hanya dapat diakses oleh Musyrif Pembimbing (Ustadz Ahmad Fauzi, Lc.) serta Wali Kelas.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dei-line dark:border-dei-dark-line text-dei-muted dark:text-dei-dark-muted font-bold">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Santri</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Surah & Ayat</th>
                  <th className="py-2.5 px-3">Audio Setoran</th>
                  <th className="py-2.5 px-3">Predikat Musyrif</th>
                  <th className="py-2.5 px-3">Catatan / Evaluasi</th>
                  {isTutorOrAdmin && <th className="py-2.5 px-3 text-right">Aksi Musyrif</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-dei-line dark:divide-dei-dark-line">
                {displayedLogs.map((log, idx) => {
                  const logDate = log.log_date || log.LogDate || (log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : '2026-10-18');
                  const studentName = log.student_name || log.StudentName || 'Santri';
                  const logType = log.type || log.Type || 'ZIYADAH';
                  const surah = log.surah_name || log.SurahName || "An-Naba'";
                  const startAyah = log.start_ayah ?? log.StartAyah ?? 1;
                  const endAyah = log.end_ayah ?? log.EndAyah ?? 10;
                  const fluencyScore = log.fluency_score || log.FluencyScore || 'MENUNGGU_NILAI';
                  const notes = log.notes || log.Notes || '-';
                  const audio = log.audio_record_url || log.AudioRecordURL;
                  const isPending = fluencyScore === 'MENUNGGU_NILAI' || log.status === 'MENUNGGU_NILAI';

                  return (
                    <tr key={log.id || log.ID || idx} className="hover:bg-dei-bg dark:hover:bg-dei-dark-bg/60">
                      <td className="py-3 px-3 text-dei-muted dark:text-dei-dark-muted font-mono whitespace-nowrap">
                        {logDate}
                      </td>
                      <td className="py-3 px-3 font-bold text-dei-ink dark:text-dei-dark-ink whitespace-nowrap">
                        {studentName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          logType === 'ZIYADAH'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-dei-emerald dark:text-dei-emerald-neon'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        }`}>
                          {logType === 'ZIYADAH' ? 'Ziyadah (Baru)' : 'Muraja\'ah'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-dei-ink dark:text-dei-dark-ink whitespace-nowrap">
                        Surah {surah} ({startAyah}-{endAyah})
                      </td>
                      <td className="py-3 px-3">
                        {audio ? (
                          <div className="space-y-1">
                            <audio controls src={audio} className="h-7 w-44 rounded" />
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Menunggu Dinilai</span>
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            fluencyScore === 'MUMTAZ'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-dei-emerald dark:text-dei-emerald-neon'
                          }`}>
                            ★ {fluencyScore}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-dei-muted dark:text-dei-dark-muted italic max-w-[220px] truncate">
                        {notes}
                      </td>
                      {isTutorOrAdmin && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEvaluatingLog(log);
                              setEvalGrade(isPending ? 'MUMTAZ' : fluencyScore);
                              setEvalTajweedScore('MUMTAZ');
                              setEvalMakhrajScore('Fasih & Sesuai Kaidah');
                              setEvalNotes(notes !== '-' ? notes : 'Masya Allah, makhraj fasih dan tajwid tepat.');
                            }}
                            className={`py-1 px-3 rounded-lg text-white text-[11px] font-bold shadow transition-colors ${
                              isPending
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-dei-emerald hover:bg-dei-emerald-dark'
                            }`}
                          >
                            {isPending ? 'Beri Nilai & Evaluasi' : 'Koreksi Nilai'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL BERI NILAI & EVALUASI TAHFIZH MUSYRIF */}
      {evaluatingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-dei-dark-surface rounded-2xl shadow-2xl border border-dei-line dark:border-dei-dark-line p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <span className="text-[11px] font-bold text-dei-gold">Penilaian Musyrif Bersanad</span>
                <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink">
                  Evaluasi Setoran: {evaluatingLog.student_name || evaluatingLog.StudentName}
                </h3>
              </div>
              <button
                onClick={() => setEvaluatingLog(null)}
                className="text-dei-muted hover:text-dei-ink font-bold"
              >
                ✕
              </button>
            </div>

            {/* Setoran Info & Audio Player */}
            <div className="p-3.5 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-dei-ink dark:text-dei-dark-ink">
                  Surah {evaluatingLog.surah_name || evaluatingLog.SurahName} (Ayat {evaluatingLog.start_ayah ?? evaluatingLog.StartAyah}-{evaluatingLog.end_ayah ?? evaluatingLog.EndAyah})
                </span>
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {evaluatingLog.type || evaluatingLog.Type || 'ZIYADAH'}
                </span>
              </div>

              {(evaluatingLog.audio_record_url || evaluatingLog.AudioRecordURL) && (
                <div className="pt-2 border-t border-dei-line dark:border-dei-dark-line space-y-1">
                  <span className="font-bold text-dei-muted flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-dei-emerald" /> Dengar Rekaman Suara Santri:
                  </span>
                  <audio controls src={evaluatingLog.audio_record_url || evaluatingLog.AudioRecordURL} className="w-full h-8 mt-1" />
                </div>
              )}
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Predikat Kelancaran & Mutqin *
                </label>
                <select
                  value={evalGrade}
                  onChange={(e) => setEvalGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-bold text-dei-emerald"
                >
                  <option value="MUMTAZ">MUMTAZ (Istimewa / Nilai A — Mutqin Sempurna)</option>
                  <option value="JAYYID_JIDDAN">JAYYID JIDDAN (Sangat Baik / Nilai B+)</option>
                  <option value="JAYYID">JAYYID (Baik / Nilai B — Sedikit Koreksi)</option>
                  <option value="MAQBUL">MAQBUL (Cukup / Nilai C — Perlu Muraja'ah Ulang)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1">
                    Makharijul Huruf:
                  </label>
                  <select
                    value={evalMakhrajScore}
                    onChange={(e) => setEvalMakhrajScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-semibold"
                  >
                    <option value="Fasih & Tepat Sesuai Kaidah">Fasih & Tepat Sesuai Kaidah</option>
                    <option value="Cukup Baik (Perlu Latihan Huruf Halqiyah)">Cukup Baik (Perlu Latihan Huruf Halqiyah)</option>
                    <option value="Kurang Tepat (Wajib Mengulang)">Kurang Tepat (Wajib Mengulang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1">
                    Ahkamut Tajwid (Mad & Ghunnah):
                  </label>
                  <select
                    value={evalTajweedScore}
                    onChange={(e) => setEvalTajweedScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-semibold"
                  >
                    <option value="MUMTAZ">Mumtaz (Mad Thabi'i Konsisten 2 Harakat)</option>
                    <option value="JAYYID_JIDDAN">Jayyid Jiddan (Ghunnah Sempurna)</option>
                    <option value="JAYYID">Jayyid (Terkadang Mad Lebih Panjang)</option>
                    <option value="MAQBUL">Maqbul (Perlu Bimbingan Mad Jaiz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Catatan Evaluasi Tajwid & Bimbingan Musyrif *
                </label>
                <textarea
                  required
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="Tuliskan catatan perbaikan makhraj atau mad di sini..."
                  className="w-full p-3 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingLog(null)}
                  className="py-2 px-4 rounded-xl border text-xs font-semibold text-dei-muted hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={evalSaving}
                  className="py-2 px-5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  {evalSaving ? 'Menyimpan...' : 'Simpan Nilai & Predikat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme Modal Pop-up (Pengganti window.alert/confirm) */}
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

export default TahfizhPage;
