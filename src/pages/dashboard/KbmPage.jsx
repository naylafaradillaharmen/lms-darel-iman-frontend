import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  Award,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  Send,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  Square,
  Play,
  Pause,
  Printer,
  Download,
  Lock,
  Unlock,
  Settings,
  RefreshCw,
  XCircle,
  Info,
  Check,
  X,
  FileCheck,
  HelpCircle,
  AlertTriangle,
  Film,
  FileDown,
  Headphones,
  FileCode,
  Plus,
  ArrowLeft,
  PenTool
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeModal } from '../../components/common/ThemeModal';
import {
  isPimpinan,
  isManajemen,
  isPimpinanOrManajemen,
  isWaliKelas as checkIsWaliKelas,
  isTutor as checkIsTutor,
  isSantri,
  getRoleDisplayBadge
} from '../../utils/rbac';

export const KbmPage = ({ onNavigateMenu }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('jadwal'); // 'jadwal' | 'modul' | 'tugas'

  // Data states
  const [subjects, setSubjects] = useState([]);
  const [courseClasses, setCourseClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [topics, setTopics] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);
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

  // Modul Belajar & Materi Multimedia State
  const [materials, setMaterials] = useState([
    {
      id: 'mat-01',
      subject_code: 'THF-01',
      subject_name: "Tahfizh Al-Qur'an Bersanad",
      title: "Hukum Mad Far'i dan Kaidah Waqaf Ibtida'",
      meeting_no: 4,
      author: 'Ustadz Ahmad Fauzan, Al-Hafizh',
      format: 'YOUTUBE', // 'YOUTUBE' | 'PDF' | 'AUDIO' | 'TEXT'
      media_url: 'https://www.youtube.com/watch?v=k3_tw44QsZQ',
      duration: '18 Menit',
      description: 'Penjelasan detail mengenai klasifikasi mad far\'i muttashil, munfashil, lazim, serta rambu-rambu waqaf tam dan hasan dalam tilawah bersanad.',
      article_content: '',
      created_at: '18 Okt 2026',
    },
    {
      id: 'mat-02',
      subject_code: 'ARB-01',
      subject_name: 'Bahasa Arab Komunikatif & Nahwu',
      title: "Diktat Lengkap: Al-Jumlatul Ismiyyah wa Khabaruha",
      meeting_no: 5,
      author: 'Ustadz Ridwan Malik, Lc.',
      format: 'PDF',
      media_url: 'https://cdn.darel-iman.or.id/modul/diktat-nahwu-dasar.pdf',
      duration: '14 Halaman PDF',
      description: 'Modul digital kaidah penyusunan mubtada dan ragam khabar (mufrad, syibhul jumlah, jumlah fi\'liyyah) disertai contoh penerapannya.',
      article_content: '',
      created_at: '17 Okt 2026',
    },
    {
      id: 'mat-03',
      subject_code: 'THF-01',
      subject_name: "Tahfizh Al-Qur'an Bersanad",
      title: "Murottal Panduan & Talaqqi Surah An-Naba' (Ayat 1-20)",
      meeting_no: 3,
      author: 'Syaikh Masyari Rasyid (Talaqqi Sanad)',
      format: 'AUDIO',
      media_url: 'https://server8.mp3quran.net/afs/078.mp3',
      duration: '06:45 Menit',
      description: 'Rekaman audio talaqqi bertempo tartil untuk mempermudah santri menyamakan harakat mad dan ghunnah sebelum setoran ujian.',
      article_content: '',
      created_at: '16 Okt 2026',
    },
    {
      id: 'mat-04',
      subject_code: 'MTK-10',
      subject_name: 'Matematika Terapan & Logika Digital',
      title: "Rangkuman Materi: Logika Proposisi & Gerbang Logika Digital",
      meeting_no: 6,
      author: 'Ir. Hendra Wijaya, M.Kom.',
      format: 'TEXT',
      media_url: '',
      duration: 'Bacaan 10 Menit',
      description: 'Penjelasan konsep tabel kebenaran AND, OR, NOT, Implikasi, serta penerapannya dalam algoritma komputasi dan rangkaian digital.',
      article_content: `1. Definisi Logika Proposisi:
Proposisi adalah suatu kalimat deklaratif yang bernilai benar (True) atau salah (False), tetapi tidak dapat bernilai keduanya sekaligus. Dalam perancangan sistem logika digital dan komputasi, proposisi disimbolkan dengan p, q, r.

2. Operator Logika Dasar:
- Konjungsi (AND - ∧): Bernilai benar HANYA JIKA kedua proposisi bernilai benar.
- Disjungsi (OR - ∨): Bernilai benar jika salah satu atau kedua proposisi bernilai benar.
- Negasi (NOT - ¬): Membalikkan nilai kebenaran.
- Implikasi (p → q): Hanya bernilai salah jika anteseden (p) bernilai benar namun konsekuen (q) bernilai salah.

3. Penerapan pada Sirkuit Digital:
Operator logika ini diimplementasikan secara fisik sebagai Logic Gates yang menjadi pondasi pemrosesan aritmetika biner dan seluruh CPU modern.`,
      created_at: '15 Okt 2026',
    },
  ]);

  // In-App Viewer Modal State (Membuka YouTube, PDF, Audio, atau Teks langsung di halaman)
  const [activeViewerMaterial, setActiveViewerMaterial] = useState(null);

  // Studio Tambah & Edit Materi Pembelajaran LMS (Halaman Penuh Khusus Guru/Tutor/Admin)
  const [isMaterialStudioOpen, setIsMaterialStudioOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [matSubject, setMatSubject] = useState('THF-01');
  const [matTitle, setMatTitle] = useState('');
  const [matMeeting, setMatMeeting] = useState(1);
  const [matFormat, setMatFormat] = useState('YOUTUBE');
  const [matUrl, setMatUrl] = useState('');
  const [matDuration, setMatDuration] = useState('15 Menit');
  const [matDescription, setMatDescription] = useState('');
  const [matTextContent, setMatTextContent] = useState('');

  // Helper YouTube Embed Link Extractor
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1&rel=0`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Open Studio for Creating New Material (Page Baru)
  const handleOpenCreateMaterial = () => {
    setEditingMaterialId(null);
    setMatSubject('THF-01');
    setMatTitle('');
    setMatMeeting(1);
    setMatFormat('YOUTUBE');
    setMatUrl('https://www.youtube.com/watch?v=k3_tw44QsZQ');
    setMatDuration('15 Menit');
    setMatDescription('');
    setMatTextContent('');
    setIsMaterialStudioOpen(true);
  };

  // Open Studio for Editing Existing Material (Page Baru)
  const handleOpenEditMaterial = (mat) => {
    setEditingMaterialId(mat.id);
    setMatSubject(mat.subject_code || 'THF-01');
    setMatTitle(mat.title || '');
    setMatMeeting(mat.meeting_no || 1);
    setMatFormat(mat.format || 'YOUTUBE');
    setMatUrl(mat.media_url || '');
    setMatDuration(mat.duration || '15 Menit');
    setMatDescription(mat.description || '');
    setMatTextContent(mat.article_content || '');
    setIsMaterialStudioOpen(true);
  };

  // Delete Material Handler with Confirmation
  const handleDeleteMaterial = (mat) => {
    showModal({
      title: 'Hapus Materi Pembelajaran?',
      message: `Apakah Anda yakin ingin menghapus materi "${mat.title}" (${mat.subject_name} Pertemuan ${mat.meeting_no})? Materi yang dihapus tidak akan dapat diakses lagi oleh santri.`,
      type: 'confirm',
      confirmText: 'Ya, Hapus Materi',
      cancelText: 'Batal',
      onConfirm: () => {
        setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
        showModal({
          title: 'Materi Berhasil Dihapus',
          message: `Materi "${mat.title}" telah dihapus dari katalog modul LMS.`,
          type: 'success'
        });
      },
      onCancel: () => {}
    });
  };

  // Submit Handler: Simpan Materi (Baru atau Update Perubahan)
  const handleSaveMaterial = (e) => {
    e.preventDefault();
    if (!matTitle.trim()) {
      showModal({
        title: 'Judul Wajib Diisi',
        message: 'Silakan masukkan judul materi pembelajaran.',
        type: 'warning'
      });
      return;
    }

    const subObj = subjects.find((s) => (s.code || s.Code) === matSubject) || {
      name: matSubject === 'THF-01' ? "Tahfizh Al-Qur'an Bersanad" : "Mata Pelajaran",
    };
    const subName = subObj.name || subObj.Name || (
      matSubject === 'THF-01' ? "Tahfizh Al-Qur'an Bersanad" :
      matSubject === 'ARB-01' ? "Bahasa Arab Komunikatif & Nahwu" :
      matSubject === 'MTK-10' ? "Matematika Terapan & Logika Digital" :
      "Pendidikan Agama Islam & Adab"
    );

    if (editingMaterialId) {
      setMaterials((prev) =>
        prev.map((m) => {
          if (m.id === editingMaterialId) {
            return {
              ...m,
              subject_code: matSubject,
              subject_name: subName,
              title: matTitle.trim(),
              meeting_no: Number(matMeeting) || 1,
              format: matFormat,
              media_url: matUrl.trim(),
              duration: matDuration.trim() || '15 Menit',
              description: matDescription.trim(),
              article_content: matTextContent.trim(),
            };
          }
          return m;
        })
      );
      setIsMaterialStudioOpen(false);
      showModal({
        title: 'Perubahan Materi Disimpan!',
        message: `Materi "${matTitle.trim()}" berhasil diperbarui. Santri dapat langsung melihat pembaruan modul.`,
        type: 'success'
      });
    } else {
      const newMat = {
        id: `mat-${Date.now()}`,
        subject_code: matSubject,
        subject_name: subName,
        title: matTitle.trim(),
        meeting_no: Number(matMeeting) || 1,
        author: user?.full_name || 'Ustadz Pengampu',
        format: matFormat,
        media_url: matUrl.trim(),
        duration: matDuration.trim() || '15 Menit',
        description: matDescription.trim(),
        article_content: matTextContent.trim(),
        created_at: 'Hari Ini (Baru Saja)',
      };

      setMaterials((prev) => [newMat, ...prev]);
      setIsMaterialStudioOpen(false);
      // Reset form
      setMatTitle('');
      setMatUrl('');
      setMatDescription('');
      setMatTextContent('');

      showModal({
        title: 'Materi Berhasil Diterbitkan!',
        message: `Materi "${newMat.title}" berhasil diterbitkan ke katalog modul LMS. Santri sekarang dapat mengakses dan mempelajarinya langsung di platform web.`,
        type: 'success'
      });
    }
  };

  // Filter state for modules
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Personal notes and module completion state for dedicated learning page
  const [personalNotes, setPersonalNotes] = useState({});
  const [completedMaterials, setCompletedMaterials] = useState(['mat-1']);

  const handleSaveNote = (materialId, note) => {
    setPersonalNotes((prev) => ({ ...prev, [materialId]: note }));
  };

  // Assignment submission modal & file/audio upload state
  const [submittingAsg, setSubmittingAsg] = useState(null);
  const [submText, setSubmText] = useState('');
  const [submUrl, setSubmUrl] = useState('');
  const [submFeedback, setSubmFeedback] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null); // { name, size, type, dataUrl }

  // Direct In-Browser Voice Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Grading modal (for tutor/admin)
  const [gradingSubm, setGradingSubm] = useState(null);
  const [gradeScore, setGradeScore] = useState(90);
  const [gradeComment, setGradeComment] = useState('');

  // Meet management modal (for tutor/admin)
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [meetUrlInput, setMeetUrlInput] = useState('');
  const [meetActiveInput, setMeetActiveInput] = useState(true);
  const [meetSaving, setMeetSaving] = useState(false);

  // Strict RBAC Role Flags
  const isSuperAdminOrDirector = isPimpinanOrManajemen(user);
  const isWaliKelas = checkIsWaliKelas(user);
  const isTutor = checkIsTutor(user);
  const isStudent = isSantri(user);
  const isTutorOrAdmin = isSuperAdminOrDirector || isWaliKelas || isTutor;
  const roleBadge = getRoleDisplayBadge(user);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSub, resCls, resSch, resTop, resAsg, resSubm, resAtt] = await Promise.all([
        fetch('/api/v1/curriculum/subjects'),
        fetch('/api/v1/curriculum/classes'),
        fetch('/api/v1/curriculum/schedules'),
        fetch('/api/v1/lms/topics'),
        fetch('/api/v1/assignments/'),
        fetch('/api/v1/assignments/submissions'),
        fetch('/api/v1/curriculum/attendance'),
      ]);

      const [dSub, dCls, dSch, dTop, dAsg, dSubm, dAtt] = await Promise.all([
        resSub.json(),
        resCls.json(),
        resSch.json(),
        resTop.json(),
        resAsg.json(),
        resSubm.json(),
        resAtt.json(),
      ]);

      if (dSub.success) setSubjects(dSub.data);
      if (dCls.success) setCourseClasses(dCls.data);
      if (dSch.success) setSchedules(dSch.data);
      if (dTop.success) setTopics(dTop.data);
      if (dAsg.success) setAssignments(dAsg.data);
      if (dSubm.success) setSubmissions(dSubm.data);
      if (dAtt.success) setAttendance(dAtt.data);
    } catch (err) {
      console.error('Gagal mengambil data KBM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Voice Recording Functions
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
          setRecordedAudioUrl(base64data);
          setUploadedFile({
            name: `Rekaman-Suara-${Date.now()}.mp3`,
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            type: 'audio',
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
      console.warn('Microphone permission denied:', err);
      showModal({
        title: 'Izin Mikrofon Diperlukan',
        message: 'Izin mikrofon diperlukan untuk merekam suara tugas. Silakan aktifkan izin mikrofon di browser Anda.',
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

  // Direct File Upload handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a');
      const isImage = file.type.startsWith('image/');
      setUploadedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: isAudio ? 'audio' : isImage ? 'image' : 'doc',
        dataUrl: reader.result,
      });
      if (isAudio) {
        setRecordedAudioUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Assignment
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    try {
      const finalFileUrl = uploadedFile?.dataUrl || submUrl || 'https://cdn.darel-iman.or.id/submissions/tugas-santri.mp3';

      const res = await fetch('/api/v1/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: submittingAsg.id,
          student_id: user?.id || user?.username || 'santri-01',
          student_name: user?.full_name || 'Muhammad Abdullah Ziyad',
          submission_text: submText,
          file_url: finalFileUrl,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmFeedback('Alhamdulillah, tugas dan berkas/audio berhasil dikirim ke Ustadz!');
        setTimeout(() => {
          setSubmittingAsg(null);
          setSubmFeedback('');
          setSubmText('');
          setSubmUrl('');
          setUploadedFile(null);
          setRecordedAudioUrl('');
          fetchData();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tutor Grade Submission
  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/assignments/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: gradingSubm.id,
          score: parseFloat(gradeScore),
          feedback: gradeComment,
          tutor_id: user?.id || 't0000009',
          tutor_name: user?.full_name || 'Ustadz Ahmad Fauzi, Lc.',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGradingSubm(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tutor Update Meeting Link
  const handleSaveMeetingLink = async (e) => {
    e.preventDefault();
    setMeetSaving(true);
    try {
      const res = await fetch('/api/v1/curriculum/schedules/meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: editingSchedule.id || editingSchedule.ID,
          meeting_link: meetUrlInput,
          is_active: meetActiveInput,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingSchedule(null);
        fetchData();
      }
    } catch (err) {
      console.error('Gagal memperbarui meeting link:', err);
    } finally {
      setMeetSaving(false);
    }
  };

  // Taught classes / subjects isolation for tutor
  const myClasses = courseClasses.filter((c) => {
    if (!isTutor) return true;
    const matchId = c.tutor_id === user?.id;
    const matchName = user?.full_name && c.tutor_name && (
      c.tutor_name.toLowerCase().includes(user.full_name.toLowerCase()) ||
      user.full_name.toLowerCase().includes(c.tutor_name.toLowerCase())
    );
    const matchUsername = user?.username === 'tutor.ahmad'
      ? (c.subject_code === 'THF-01' || c.subject_code === 'ARB-01')
      : user?.username === 'tutor.fauzan'
      ? (c.subject_code === 'MTK-10' || c.subject_code === 'TEC-01')
      : false;
    return matchId || matchName || matchUsername;
  });

  const myClassIDs = myClasses.map((c) => c.id);
  const mySubjectNames = myClasses.map((c) => c.subject_name);

  // STRICT DATA ISOLATION: JADWAL KBM
  const displayedSchedules = (isSuperAdminOrDirector || isWaliKelas || isStudent)
    ? schedules
    : schedules.filter((sch) => {
        const cId = sch.course_class_id || sch.CourseClassID;
        if (myClassIDs.includes(cId)) return true;
        if (user?.username === 'tutor.ahmad' && (cId === 'cc-01' || cId === 'cc-02')) return true;
        if (user?.username === 'tutor.fauzan' && cId === 'cc-04') return true;
        return false;
      });

  // STRICT DATA ISOLATION: TUGAS (ASSIGNMENTS)
  const displayedAssignments = (isSuperAdminOrDirector || isWaliKelas)
    ? assignments
    : isTutor
    ? assignments.filter((asg) => {
        if (asg.tutor_id && asg.tutor_id === user?.id) return true;
        if (asg.subject_name && mySubjectNames.includes(asg.subject_name)) return true;
        if (asg.course_class_id && myClassIDs.includes(asg.course_class_id)) return true;
        if (user?.username === 'tutor.ahmad' && (asg.id === 'asg-01' || (asg.subject_name || '').includes('Tahfizh'))) return true;
        if (user?.username === 'tutor.fauzan' && (asg.id === 'asg-03' || (asg.subject_name || '').includes('Matematika'))) return true;
        return false;
      })
    : assignments;

  // STRICT DATA ISOLATION: PENGUMPULAN TUGAS (SUBMISSIONS)
  const displayedSubmissions = (isSuperAdminOrDirector || isWaliKelas)
    ? submissions
    : isTutor
    ? submissions.filter((s) => {
        if (s.tutor_id && s.tutor_id === user?.id) return true;
        if (s.subject_name && mySubjectNames.includes(s.subject_name)) return true;
        if (user?.username === 'tutor.ahmad' && ((s.subject_name || '').includes('Tahfizh') || s.assignment_id === 'asg-01')) return true;
        if (user?.username === 'tutor.fauzan' && ((s.subject_name || '').includes('Matematika') || s.assignment_id === 'asg-03')) return true;
        return false;
      })
    : submissions.filter((s) => {
        // Santri strictly only sees THEIR OWN submission
        const sName = (s.student_name || s.StudentName || '').toLowerCase().trim();
        const uName = (user?.full_name || '').toLowerCase().trim();
        const uUser = (user?.username || '').toLowerCase().trim();
        const sId = (s.student_id || s.StudentID || '').toLowerCase().trim();

        const matchName = uName && (sName.includes(uName) || uName.includes(sName));
        const matchUser = uUser && (sId.includes(uUser) || uUser.includes(sId));
        const matchId = user?.id && sId === String(user.id).toLowerCase();

        return matchName || matchUser || matchId;
      });

  const filteredSubjects = subjects.filter((s) => {
    const cat = s.category || s.Category || '';
    const name = s.name || s.Name || '';
    const code = s.code || s.Code || '';
    if (subjectFilter !== 'ALL' && cat !== subjectFilter) return false;
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase()) && !code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getDayName = (d) => {
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
    return days[d] || 'Hari Terjadwal';
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ========================================================
  // HALAMAN DEDIKASI: STUDIO PENULISAN & EDIT MATERI KBM
  // Menggantikan modal layar layang dengan halaman mandiri luas untuk materi panjang
  // ========================================================
  if (isMaterialStudioOpen) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMaterialStudioOpen(false)}
              className="px-4 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-dei-ink dark:text-dei-dark-ink text-xs font-bold transition-all flex items-center gap-2 border border-dei-line dark:border-dei-dark-line shadow-xs group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Kembali ke Silabus & Modul</span>
            </button>
            <div className="hidden md:block h-6 w-px bg-dei-line dark:border-dei-dark-line" />
            <div className="hidden md:flex items-center gap-2 text-xs text-dei-muted dark:text-dei-dark-muted">
              <span>Studio KBM</span>
              <span>/</span>
              <span className="font-bold text-dei-emerald dark:text-dei-emerald-neon">
                {editingMaterialId ? 'Edit Materi Pembelajaran' : 'Penerbitan Materi Baru'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              {editingMaterialId ? '✏️ Mode Edit Materi Guru' : '✨ Penerbitan Materi Baru LMS'}
            </span>
          </div>
        </div>

        {/* Studio Form Container */}
        <form onSubmit={handleSaveMaterial} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-lg space-y-6">
          <div className="border-b border-dei-line dark:border-dei-dark-line pb-4">
            <h2 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink">
              {editingMaterialId ? 'Perbarui Konten & Media Pembelajaran' : 'Studio Pembuatan Materi Pembelajaran (Halaman Mandiri)'}
            </h2>
            <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-1 leading-relaxed">
              Halaman studio mandiri ini menyediakan ruang luas bagi Guru/Ustadz untuk menuliskan diktat materi mendalam, menyematkan video YouTube, modul dokumen PDF, maupun murottal audio talaqqi tanpa terhalang ruang sempit modal melayang.
            </p>
          </div>

          {/* Row 1: Mapel, Pertemuan, Durasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <label className="block text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                Mata Pelajaran
              </label>
              <select
                value={matSubject}
                onChange={(e) => setMatSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
              >
                <option value="THF-01">THF-01 • Tahfizh Al-Qur'an Bersanad</option>
                <option value="ARB-01">ARB-01 • Bahasa Arab Komunikatif & Nahwu</option>
                <option value="MTK-10">MTK-10 • Matematika Terapan & Logika Digital</option>
                <option value="PAI-01">PAI-01 • Pendidikan Agama Islam & Adab</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                Pertemuan Ke-
              </label>
              <input
                type="number"
                min="1"
                max="48"
                required
                value={matMeeting}
                onChange={(e) => setMatMeeting(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                Estimasi Durasi / Waktu
              </label>
              <input
                type="text"
                required
                value={matDuration}
                onChange={(e) => setMatDuration(e.target.value)}
                placeholder="Contoh: 20 Menit / 15 Halaman"
                className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Row 2: Judul Materi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
              Judul Lengkap Materi Pembelajaran
            </label>
            <input
              type="text"
              required
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              placeholder="Contoh: Kaidah Mad Lazim Mutsaqqal Kalimi & Penerapannya dalam Riwayat Hafsh"
              className="w-full px-4 py-3 rounded-2xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-sm font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
            />
          </div>

          {/* Row 3: Pilihan Format Media */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
              Pilih Format Media Materi:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMatFormat('YOUTUBE');
                  if (!matUrl) setMatUrl('https://www.youtube.com/watch?v=k3_tw44QsZQ');
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  matFormat === 'YOUTUBE'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 ring-2 ring-rose-400 shadow-sm'
                    : 'border-dei-line dark:border-dei-dark-line bg-white dark:bg-neutral-800 text-dei-muted hover:bg-neutral-50'
                }`}
              >
                <Film className="w-6 h-6 text-rose-600" />
                <div>
                  <div className="font-extrabold text-xs">Video YouTube</div>
                  <div className="text-[10px] opacity-75">Embed di Layar In-App</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMatFormat('PDF');
                  if (!matUrl) setMatUrl('https://cdn.darel-iman.or.id/modul/diktat-nahwu-dasar.pdf');
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  matFormat === 'PDF'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400 shadow-sm'
                    : 'border-dei-line dark:border-dei-dark-line bg-white dark:bg-neutral-800 text-dei-muted hover:bg-neutral-50'
                }`}
              >
                <FileText className="w-6 h-6 text-amber-600" />
                <div>
                  <div className="font-extrabold text-xs">Dokumen PDF</div>
                  <div className="text-[10px] opacity-75">Pratinjau Dokumen Resmi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMatFormat('AUDIO');
                  if (!matUrl) setMatUrl('https://server8.mp3quran.net/afs/078.mp3');
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  matFormat === 'AUDIO'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 ring-2 ring-purple-400 shadow-sm'
                    : 'border-dei-line dark:border-dei-dark-line bg-white dark:bg-neutral-800 text-dei-muted hover:bg-neutral-50'
                }`}
              >
                <Headphones className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="font-extrabold text-xs">Audio Talaqqi</div>
                  <div className="text-[10px] opacity-75">Pemutar Audio Web</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMatFormat('TEXT')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  matFormat === 'TEXT'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ring-2 ring-blue-400 shadow-sm'
                    : 'border-dei-line dark:border-dei-dark-line bg-white dark:bg-neutral-800 text-dei-muted hover:bg-neutral-50'
                }`}
              >
                <BookOpen className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-extrabold text-xs">Artikel / Teks Diktat</div>
                  <div className="text-[10px] opacity-75">Editor Teks Mandiri</div>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Format Fields */}
          {matFormat === 'YOUTUBE' && (
            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
              <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                Tautan / URL Video YouTube
              </label>
              <input
                type="url"
                required
                value={matUrl}
                onChange={(e) => setMatUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-neutral-900 text-xs font-mono"
              />
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Sistem otomatis mengonversi tautan menjadi pemutar embed langsung di website tanpa membuka aplikasi eksternal YouTube.
              </p>
            </div>
          )}

          {matFormat === 'PDF' && (
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                Tautan Berkas PDF Digital
              </label>
              <input
                type="url"
                required
                value={matUrl}
                onChange={(e) => setMatUrl(e.target.value)}
                placeholder="https://.../dokumen.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-neutral-900 text-xs font-mono"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Dokumen PDF akan langsung terbuka di peramban santri dengan fitur zoom, navigasi halaman, dan tombol unduh resmi.
              </p>
            </div>
          )}

          {matFormat === 'AUDIO' && (
            <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-3">
              <label className="block text-xs font-bold text-purple-900 dark:text-purple-200">
                Tautan File Audio Talaqqi / Murottal (.mp3 / .ogg)
              </label>
              <input
                type="url"
                required
                value={matUrl}
                onChange={(e) => setMatUrl(e.target.value)}
                placeholder="https://.../murottal.mp3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-neutral-900 text-xs font-mono"
              />
              <p className="text-[11px] text-purple-700 dark:text-purple-300">
                Audio akan diputar via pemutar web bawaan dilengkapi pengatur kecepatan untuk mempermudah latihan hafalan santri.
              </p>
            </div>
          )}

          {matFormat === 'TEXT' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-blue-900 dark:text-blue-200">
                    Area Penulisan Diktat & Materi Teks Mendalam
                  </label>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Tulis materi selengkap mungkin. Ruang penulisan luas tanpa batasan karakter modal melayang.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-mono px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800 font-bold text-blue-800 dark:text-blue-300">
                    {matTextContent.trim() ? matTextContent.trim().split(/\s+/).length : 0} Kata
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800 font-bold text-blue-800 dark:text-blue-300">
                    {matTextContent.length} Karakter
                  </span>
                </div>
              </div>

              {/* Formatting Quick Insert Helpers */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMatTextContent((prev) => prev + '\n\n### 📖 Pokok Pembahasan Baru:\n')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-neutral-700 text-blue-900 dark:text-blue-200"
                >
                  + Judul Bab
                </button>
                <button
                  type="button"
                  onClick={() => setMatTextContent((prev) => prev + '\n- Poin Penjelasan 1\n- Poin Penjelasan 2\n')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-neutral-700 text-blue-900 dark:text-blue-200"
                >
                  + Daftar Poin
                </button>
                <button
                  type="button"
                  onClick={() => setMatTextContent((prev) => prev + '\n> Dalil / Rujukan Hadits:\n> "..."\n')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-neutral-700 text-blue-900 dark:text-blue-200"
                >
                  + Kotak Dalil / Rujukan
                </button>
                <button
                  type="button"
                  onClick={() => setMatTextContent((prev) => prev + '\n\n✨ Kesimpulan Pembelajaran:\n')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-neutral-700 text-blue-900 dark:text-blue-200"
                >
                  + Kesimpulan
                </button>
              </div>

              <textarea
                rows={14}
                required
                value={matTextContent}
                onChange={(e) => setMatTextContent(e.target.value)}
                placeholder="Tuliskan materi pembelajaran secara komprehensif di sini..."
                className="w-full px-4 py-3 rounded-2xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-neutral-900 text-xs leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
            </div>
          )}

          {/* Row 4: Ringkasan Materi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
              Ringkasan Materi (1–2 Kalimat)
            </label>
            <textarea
              rows={2}
              required
              value={matDescription}
              onChange={(e) => setMatDescription(e.target.value)}
              placeholder="Gambaran umum kompetensi yang dipelajari pada materi ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-xs focus:outline-none focus:ring-2 focus:ring-dei-emerald"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dei-line dark:border-dei-dark-line">
            <button
              type="button"
              onClick={() => setIsMaterialStudioOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-muted hover:text-dei-ink transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{editingMaterialId ? 'Simpan Perubahan Materi' : 'Terbitkan Materi Pembelajaran'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ========================================================
  // HALAMAN DEDIKASI: AKSES MODUL & RUANG PEMBELAJARAN
  // Menggantikan modal popup melayang menjadi halaman penuh tersendiri
  // ========================================================
  if (activeViewerMaterial) {
    const siblingMaterials = materials.filter(
      (m) => m.subject_code === activeViewerMaterial.subject_code
    );
    const otherMaterials = materials.filter(
      (m) => m.subject_code !== activeViewerMaterial.subject_code
    );
    const isCompleted = completedMaterials.includes(activeViewerMaterial.id);

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
        {/* 1. TOP BAR NAVIGASI & AKSI PEMBELAJARAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveViewerMaterial(null)}
              className="px-4 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-dei-ink dark:text-dei-dark-ink text-xs font-bold transition-all flex items-center gap-2 border border-dei-line dark:border-dei-dark-line shadow-xs group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Kembali ke Silabus & KBM</span>
            </button>
            <div className="hidden md:block h-6 w-px bg-dei-line dark:bg-dei-dark-line" />
            <div className="hidden md:flex items-center gap-2 text-xs text-dei-muted dark:text-dei-dark-muted">
              <span>Ruang Belajar</span>
              <span>/</span>
              <span className="font-bold text-dei-emerald dark:text-dei-emerald-neon">{activeViewerMaterial.subject_name}</span>
              <span>/</span>
              <span className="font-bold text-dei-ink dark:text-dei-dark-ink truncate max-w-xs">Pertemuan {activeViewerMaterial.meeting_no}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
              activeViewerMaterial.format === 'YOUTUBE'
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : activeViewerMaterial.format === 'PDF'
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : activeViewerMaterial.format === 'AUDIO'
                ? 'bg-purple-50 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}>
              {activeViewerMaterial.format === 'YOUTUBE' && <Film className="w-3.5 h-3.5 text-rose-600" />}
              {activeViewerMaterial.format === 'PDF' && <FileText className="w-3.5 h-3.5 text-amber-600" />}
              {activeViewerMaterial.format === 'AUDIO' && <Headphones className="w-3.5 h-3.5 text-purple-600" />}
              {activeViewerMaterial.format === 'TEXT' && <BookOpen className="w-3.5 h-3.5 text-blue-600" />}
              <span>
                {activeViewerMaterial.format === 'YOUTUBE' ? 'Video Pembelajaran YouTube' :
                 activeViewerMaterial.format === 'PDF' ? 'Modul Diktat PDF Resmi' :
                 activeViewerMaterial.format === 'AUDIO' ? 'Audio Talaqqi Murottal' : 'Diktat Pembelajaran Teks'}
              </span>
            </span>

            <button
              onClick={() => {
                if (!completedMaterials.includes(activeViewerMaterial.id)) {
                  setCompletedMaterials((prev) => [...prev, activeViewerMaterial.id]);
                }
                showModal({
                  title: 'Capaian Pembelajaran Tercatat!',
                  message: `Alhamdulillah, modul "${activeViewerMaterial.title}" telah Anda pelajari dan tercatat pada jurnal belajar santri.`,
                  type: 'success'
                });
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-dei-emerald hover:bg-dei-emerald-dark text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isCompleted ? 'Sudah Dipelajari (Tuntas)' : 'Tandai Selesai Dipelajari'}
              </span>
            </button>
          </div>
        </div>

        {/* 2. HERO HEADER MODUL TERPILIH */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-dei-emerald to-emerald-950 text-white relative overflow-hidden shadow-lg border border-emerald-700/50">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black uppercase bg-white/15 backdrop-blur-sm border border-white/20 text-emerald-100">
                {activeViewerMaterial.subject_code} • Pertemuan Ke-{activeViewerMaterial.meeting_no}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {activeViewerMaterial.subject_name}
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Estimasi Durasi: {activeViewerMaterial.duration}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
              {activeViewerMaterial.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-emerald-100/90 pt-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span>Pengampu: <b>{activeViewerMaterial.author}</b></span>
              </div>
              <span className="text-white/30">•</span>
              <div>Diterbitkan: {activeViewerMaterial.created_at}</div>
              <span className="text-white/30">•</span>
              <div className="text-amber-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Akses Modul Resmi PKBM Digital Dar El Iman</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. GRID 2 KOLOM PEMBELAJARAN LENGKAP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM UTAMA: MEDIA VIEWER & MATERI (8 KOLOM) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
                <h3 className="text-sm font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-dei-emerald" />
                  Media Pembelajaran Modul
                </h3>
                {activeViewerMaterial.format === 'PDF' && (
                  <a
                    href={activeViewerMaterial.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Berkas PDF Resmi</span>
                  </a>
                )}
              </div>

              {/* YOUTUBE EMBED PLAYER */}
              {activeViewerMaterial.format === 'YOUTUBE' && (
                <div className="space-y-3">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-neutral-800">
                    <iframe
                      src={getYoutubeEmbedUrl(activeViewerMaterial.media_url)}
                      title={activeViewerMaterial.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line text-xs text-dei-muted dark:text-dei-dark-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Pemutar video YouTube resmi terintegrasi langsung di dalam halaman modul LMS.</span>
                    </div>
                    <a
                      href={activeViewerMaterial.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-dei-emerald font-bold hover:underline flex items-center gap-1 self-end sm:self-auto"
                    >
                      <span>Tonton di YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* PDF VIEWER */}
              {activeViewerMaterial.format === 'PDF' && (
                <div className="space-y-3">
                  <div className="w-full h-[680px] rounded-2xl overflow-hidden border border-dei-line dark:border-dei-dark-line shadow-inner bg-neutral-100 dark:bg-neutral-900">
                    <iframe
                      src={activeViewerMaterial.media_url}
                      title={activeViewerMaterial.title}
                      className="w-full h-full border-0"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 text-xs text-dei-muted flex items-center justify-between">
                    <span>Jika pratinjau browser tidak muncul, silakan klik tombol unduh berkas PDF di atas.</span>
                  </div>
                </div>
              )}

              {/* AUDIO TALAQQI PLAYER */}
              {activeViewerMaterial.format === 'AUDIO' && (
                <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-neutral-800 dark:to-neutral-900 border border-emerald-200 dark:border-emerald-800 text-center space-y-6">
                  <div className="w-24 h-24 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-dei-emerald flex items-center justify-center mx-auto shadow-md">
                    <Volume2 className="w-12 h-12 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink">
                      {activeViewerMaterial.title}
                    </h4>
                    <p className="text-xs text-dei-muted">
                      Audio Talaqqi Murottal Berkualitas Tinggi • Format MP3 Audio Stream
                    </p>
                  </div>
                  <div className="max-w-xl mx-auto pt-2">
                    <audio
                      controls
                      autoPlay
                      src={activeViewerMaterial.media_url}
                      className="w-full shadow-md rounded-2xl"
                    />
                  </div>
                </div>
              )}

              {/* DIKTAT / ARTIKEL TEKS */}
              {activeViewerMaterial.format === 'TEXT' && (
                <div className="p-6 sm:p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line space-y-4">
                  <div className="text-xs font-extrabold uppercase text-dei-muted tracking-wider">
                    Diktat Kuliah Mandiri & Kaidah Pembahasan:
                  </div>
                  <div className="text-sm text-dei-ink dark:text-dei-dark-ink leading-relaxed whitespace-pre-wrap font-sans">
                    {activeViewerMaterial.article_content || activeViewerMaterial.description}
                  </div>
                </div>
              )}

              {/* DESKRIPSI & RINGKASAN MATERI */}
              {activeViewerMaterial.description && (
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="font-extrabold text-xs text-dei-ink dark:text-dei-dark-ink uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-dei-emerald" />
                    <span>Rangkuman & Arahan Belajar:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-dei-muted dark:text-dei-dark-muted leading-relaxed">
                    {activeViewerMaterial.description}
                  </p>
                </div>
              )}
            </div>

            {/* LEMBAR CATATAN MANDIRI SANTRI (INTERAKTIF & TERSIMPAN LOKAL) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-dei-ink dark:text-dei-dark-ink tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-dei-emerald" />
                  <span>Lembar Catatan Mandiri Santri</span>
                </h4>
                <span className="text-[10px] text-dei-muted">Catatan tersimpan selama sesi aktif</span>
              </div>
              <textarea
                rows={4}
                value={personalNotes[activeViewerMaterial.id] || ''}
                onChange={(e) => handleSaveNote(activeViewerMaterial.id, e.target.value)}
                placeholder="Tuliskan faedah ilmu, kaidah tajwid, ringkasan, atau pertanyaan untuk Ustadz pembimbing di sini..."
                className="w-full p-3.5 rounded-2xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800/70 text-xs sm:text-sm text-dei-ink dark:text-dei-dark-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-dei-emerald resize-y"
              />
            </div>
          </div>

          {/* KOLOM KANAN: NAVIGASI SILABUS & GURU PENGAMPU (4 KOLOM) */}
          <div className="lg:col-span-4 space-y-5">
            {/* KARTU GURU PENGAMPU */}
            <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
              <div className="text-xs font-extrabold text-dei-muted uppercase tracking-wider">
                Guru Pengampu Modul
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-dei-emerald font-black text-base flex items-center justify-center border border-emerald-300/60 shadow-xs">
                  {activeViewerMaterial.author ? activeViewerMaterial.author.split(' ')[1]?.[0] || 'U' : 'U'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink leading-tight">
                    {activeViewerMaterial.author}
                  </h4>
                  <p className="text-[11px] text-dei-muted">Pembimbing {activeViewerMaterial.subject_name}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-dei-line dark:border-dei-dark-line text-xs text-dei-muted leading-relaxed">
                Apabila santri memiliki pertanyaan terkait materi ini, silakan sampaikan saat sesi tatap muka daring atau melalui halaqah pekanan.
              </div>
            </div>

            {/* DAFTAR PERTEMUAN MODUL MAPEL INI */}
            <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-dei-ink dark:text-dei-dark-ink tracking-wider">
                  Daftar Pertemuan Modul Ini
                </h4>
                <span className="text-[10px] font-bold text-dei-emerald">
                  {siblingMaterials.length} Modul
                </span>
              </div>
              <div className="space-y-2">
                {siblingMaterials.map((mat) => {
                  const isCur = mat.id === activeViewerMaterial.id;
                  const isDone = completedMaterials.includes(mat.id);
                  return (
                    <button
                      key={mat.id}
                      onClick={() => setActiveViewerMaterial(mat)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 ${
                        isCur
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-dei-emerald text-dei-ink dark:text-dei-dark-ink shadow-xs ring-1 ring-dei-emerald/40'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 border-dei-line dark:border-dei-dark-line hover:border-dei-emerald hover:bg-white text-dei-muted dark:text-dei-dark-muted'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-black flex-shrink-0 mt-0.5 ${
                        isCur
                          ? 'bg-dei-emerald text-white shadow-xs'
                          : isDone
                          ? 'bg-emerald-200 text-emerald-900 font-bold'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-dei-ink dark:text-dei-dark-ink'
                      }`}>
                        {isDone ? '✓' : mat.meeting_no}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold uppercase text-dei-gold">
                            Pertemuan {mat.meeting_no}
                          </span>
                          {isCur && (
                            <span className="text-[9px] font-black uppercase text-dei-emerald">Aktif</span>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink truncate">
                          {mat.title}
                        </h5>
                        <div className="text-[10px] text-dei-muted">{mat.duration}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* JELAJAHI MODUL MATA PELAJARAN LAIN */}
            {otherMaterials.length > 0 && (
              <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase text-dei-ink dark:text-dei-dark-ink tracking-wider">
                  Modul Mata Pelajaran Lain
                </h4>
                <div className="space-y-2">
                  {otherMaterials.slice(0, 3).map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => setActiveViewerMaterial(mat)}
                      className="w-full text-left p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line hover:border-dei-emerald hover:bg-white text-xs transition-all space-y-1"
                    >
                      <div className="text-[10px] font-extrabold text-dei-gold">{mat.subject_name}</div>
                      <div className="font-bold text-dei-ink dark:text-dei-dark-ink truncate">{mat.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Notifikasi Tema */}
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
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden print:hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <BookOpen className="w-72 h-72" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manajemen KBM & Kurikulum Merdeka</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ruang Pembelajaran & Silabus Akademik
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Akses jadwal KBM daring, modul Kurikulum Merdeka + Diniyyah, pengumpulan tugas, dan sistem presensi santri mandiri dengan verifikasi persetujuan Ustadz pengampu.
          </p>
        </div>
      </div>

      {/* SCOPE & PRIVACY NOTICE BANNER */}
      <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-sm print:hidden bg-white dark:bg-dei-dark-surface border-dei-line dark:border-dei-dark-line">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-dei-emerald flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
              <span>Isolasi & Hak Akses Data Terpadu:</span>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                {user?.role_name || 'SISWA'}
              </span>
            </div>
            <p className="text-[11px] text-dei-muted dark:text-dei-dark-muted">
              {isSuperAdminOrDirector ? (
                `Hak Akses ${roleBadge.label}: Akses pengawasan sistematis ke seluruh kelas rombel, silabus, dan data akademik PKBM.`
              ) : isWaliKelas ? (
                'Hak Akses Wali Kelas X Paket C: Akses monitoring penuh seluruh mata pelajaran, santri, dan nilai rombel binaan.'
              ) : isTutor ? (
                `Hak Akses Guru Pengampu: Data KBM, jadwal, tugas, & nilai terisolasi ketat hanya untuk mata pelajaran yang Anda bimbing (${mySubjectNames.length > 0 ? mySubjectNames.join(' & ') : 'Tahfizh Al-Qur\'an & Bahasa Arab'}).`
              ) : isStudent ? (
                `Hak Akses Santri Mandiri (${user?.full_name || 'Santri'}): Pengumpulan tugas, berkas audio, dan nilai Anda tersimpan secara privat & terlindungi.`
              ) : (
                `Hak Akses ${roleBadge.label}: Akses data disesuaikan dengan lingkup penugasan institusi.`
              )}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-dei-muted dark:text-dei-dark-muted whitespace-nowrap hidden sm:inline">
          🔒 RBAC Enforced
        </span>
      </div>

      {/* Navigation Tabs & Presensi Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dei-line dark:border-dei-dark-line pb-2 print:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            id="tab-kbm-jadwal"
            onClick={() => setActiveTab('jadwal')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'jadwal'
                ? 'bg-dei-emerald text-white shadow'
                : 'bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal KBM & Kelas Daring</span>
          </button>

          <button
            id="tab-kbm-modul"
            onClick={() => setActiveTab('modul')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'modul'
                ? 'bg-dei-emerald text-white shadow'
                : 'bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Silabus & Modul Ajar</span>
          </button>

          <button
            id="tab-kbm-tugas"
            onClick={() => setActiveTab('tugas')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'tugas'
                ? 'bg-dei-emerald text-white shadow'
                : 'bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tugas & Penilaian</span>
            {displayedAssignments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-emerald-950">
                {displayedAssignments.length}
              </span>
            )}
          </button>
        </div>

        {onNavigateMenu && (
          <button
            onClick={() => onNavigateMenu('presensi')}
            className="py-2 px-3.5 rounded-xl border border-dei-emerald/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-dei-emerald dark:text-dei-emerald-neon text-xs font-bold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-dei-emerald" />
            <span>Buka Presensi & Kehadiran (Halaman Terpisah)</span>
          </button>
        )}
      </div>

      {/* TAB 1: JADWAL KBM & KELAS DARING */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                <Calendar className="w-5 h-5 text-dei-emerald dark:text-dei-emerald-neon" />
                Jadwal Kelas Tatap Muka Virtual (Pekan Ini)
              </h2>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted mt-0.5">
                {isSuperAdminOrDirector || isWaliKelas
                  ? 'Monitoring seluruh sesi kelas KBM tatap muka virtual.'
                  : isTutor
                  ? `Menampilkan jadwal sesi kelas yang Anda ampu (${mySubjectNames.length > 0 ? mySubjectNames.join(' & ') : 'Mata Pelajaran Diampu'}).`
                  : 'Santri hanya dapat memasuki ruang Google Meet setelah link diaktifkan oleh Ustadz pengampu.'}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-dei-emerald border border-emerald-200 dark:border-emerald-800">
              Rombel: Kelas X Paket C — Umar bin Khattab
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedSchedules.map((sch, idx) => {
              const dayOfWeek = sch.day_of_week ?? sch.DayOfWeek ?? 1;
              const startTime = sch.start_time || sch.StartTime || '08:00';
              const endTime = sch.end_time || sch.EndTime || '09:30';
              const meetingLink = sch.meeting_link || sch.MeetingLink;
              const isActive = (sch.is_active ?? sch.IsActive ?? false) && Boolean(meetingLink);
              const courseClassId = sch.course_class_id || sch.CourseClassID || '';

              return (
                <div
                  key={sch.id || sch.ID || idx}
                  className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm hover:border-dei-emerald transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-dei-emerald dark:text-dei-emerald-neon">
                        {getDayName(dayOfWeek)}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-dei-muted dark:text-dei-dark-muted">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{startTime} - {endTime} WIB</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="text-xs font-bold text-dei-gold">
                        {courseClassId === 'cc-01' ? "THF-01 • Tahfizh Al-Qur'an Bersanad" :
                         courseClassId === 'cc-02' ? 'ARB-01 • Bahasa Arab & Nahwu' :
                         courseClassId === 'cc-03' ? 'IND-10 • Bahasa Indonesia' :
                         'MTK-10 • Matematika Terapan'}
                      </div>
                      <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink">
                        Kelas X Paket C — Umar bin Khattab
                      </h3>
                      <p className="text-xs text-dei-muted dark:text-dei-dark-muted">
                        Tutor: {courseClassId === 'cc-01' || courseClassId === 'cc-02' ? 'Ustadz Ahmad Fauzi, Lc.' :
                                courseClassId === 'cc-03' ? 'Ustadzah Fatimah, S.Pd.' : 'Ahmad Fauzan, S.Kom., M.T.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-dei-line dark:border-dei-dark-line space-y-2">
                    <div className="flex items-center justify-between">
                      {isActive ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ruang Meet Aktif (Siap Masuk)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          Ruang Meet Belum Dibuka
                        </span>
                      )}

                      {isTutorOrAdmin && (
                        <button
                          onClick={() => {
                            setEditingSchedule(sch);
                            setMeetUrlInput(meetingLink || 'https://meet.google.com/pkbm-live-kbm');
                            setMeetActiveInput(isActive);
                          }}
                          className="py-1 px-2.5 rounded-lg border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-dei-ink dark:text-dei-dark-ink text-xs font-semibold hover:border-dei-emerald flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3 text-dei-gold" />
                          <span>Atur Meet</span>
                        </button>
                      )}
                    </div>

                    {isActive ? (
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-4 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold flex items-center justify-center gap-2 shadow"
                      >
                        <Video className="w-4 h-4" />
                        <span>Masuk Kelas (Google Meet)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <div className="space-y-1">
                        <button
                          disabled
                          className="w-full py-2 px-4 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-dashed border-gray-300 dark:border-neutral-700"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Menunggu Tutor Membuka Ruang Kelas</span>
                        </button>
                        <p className="text-[10px] text-center text-dei-muted dark:text-dei-dark-muted">
                          Tautan Meet akan terbuka otomatis saat Ustadz pengampu mengaktifkan sesi.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SILABUS & MODUL AJAR (MULTIMEDIA & IN-APP VIEWERS) */}
      {activeTab === 'modul' && (
        <div className="space-y-6">
          {/* Action & Filter Header */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white dark:bg-dei-dark-surface p-5 rounded-3xl border border-dei-line dark:border-dei-dark-line shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-dei-ink dark:text-dei-dark-ink">
                  Katalog Materi Pembelajaran & Modul Digital
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {materials.length} Materi Terbit
                </span>
              </div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted">
                Santri dapat mengakses video YouTube, dokumen PDF, audio talaqqi, dan artikel materi <b>langsung di dalam situs tanpa berpindah halaman</b>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              {isTutorOrAdmin && (
                <button
                  type="button"
                  onClick={handleOpenCreateMaterial}
                  className="px-4 py-2.5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Terbitkan Materi Pembelajaran Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Multimedia Materials Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-dei-emerald" />
                Materi Interaktif Siap Pelajari (Tersedia Pemutar In-App)
              </h3>
              <span className="text-[11px] text-dei-muted">Klik kartu untuk membuka materi langsung di layar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {materials.map((mat) => {
                const isYt = mat.format === 'YOUTUBE';
                const isPdf = mat.format === 'PDF';
                const isAudio = mat.format === 'AUDIO';
                const isText = mat.format === 'TEXT';

                return (
                  <div
                    key={mat.id}
                    className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm hover:shadow-md hover:border-dei-emerald transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-neutral-100 dark:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink font-mono border border-dei-line dark:border-dei-dark-line">
                          {mat.subject_code} • Pertemuan {mat.meeting_no}
                        </span>

                        {isYt && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1.5">
                            <Film className="w-3 h-3 text-rose-600" />
                            Video YouTube (Embed)
                          </span>
                        )}
                        {isPdf && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-amber-600" />
                            Dokumen PDF Resmi
                          </span>
                        )}
                        {isAudio && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 flex items-center gap-1.5">
                            <Headphones className="w-3 h-3 text-purple-600" />
                            Audio Talaqqi / Kajian
                          </span>
                        )}
                        {isText && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-blue-600" />
                            Artikel & Diktat Teks
                          </span>
                        )}
                      </div>

                      {/* Title & Subject */}
                      <div
                        onClick={() => setActiveViewerMaterial(mat)}
                        className="cursor-pointer group"
                      >
                        <h4 className="text-base font-extrabold text-dei-ink dark:text-dei-dark-ink group-hover:text-dei-emerald transition-colors leading-snug">
                          {mat.title}
                        </h4>
                        <div className="text-xs font-semibold text-dei-gold mt-0.5">
                          {mat.subject_name}
                        </div>
                      </div>

                      <p className="text-xs text-dei-muted dark:text-dei-dark-muted line-clamp-2 leading-relaxed">
                        {mat.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Open Module Page Button */}
                    <div className="pt-3 border-t border-dei-line dark:border-dei-dark-line flex items-center justify-between gap-3 text-xs flex-wrap">
                      <div className="text-[11px] text-dei-muted leading-tight">
                        <div className="font-semibold text-dei-ink dark:text-dei-dark-ink">{mat.author}</div>
                        <div>Durasi: {mat.duration}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isTutorOrAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditMaterial(mat);
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line hover:bg-neutral-100 dark:hover:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink font-bold text-xs transition-colors flex items-center gap-1"
                              title="Edit Materi Pembelajaran"
                            >
                              <PenTool className="w-3.5 h-3.5 text-dei-emerald" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMaterial(mat);
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center gap-1"
                              title="Hapus Materi Pembelajaran"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setActiveViewerMaterial(mat)}
                          className="px-3.5 py-2 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Buka Akses Modul →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference Silabus Rombel */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-extrabold text-dei-ink dark:text-dei-dark-ink">
              Silabus Mata Pelajaran Rombel Kelas X Paket C
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map((sub, idx) => {
                const code = sub.code || sub.Code || 'MODUL';
                const name = sub.name || sub.Name || 'Mata Pelajaran';
                const category = sub.category || sub.Category || 'UMUM_KEMENDIKBUD';
                const description = sub.description || sub.Description || 'Modul materi silabus resmi.';

                return (
                  <div
                    key={sub.id || sub.ID || idx}
                    className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm flex flex-col justify-between hover:border-dei-emerald transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                          {code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          category === 'KHAS_DAR_EL_IMAN'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-dei-emerald dark:text-dei-emerald-neon'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        }`}>
                          {category === 'KHAS_DAR_EL_IMAN' ? 'Khas Yayasan' : 'Kurikulum Merdeka'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink mb-1">
                        {name}
                      </h3>
                      <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed mb-4">
                        {description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-dei-line dark:border-dei-dark-line flex items-center justify-between text-xs">
                      <span className="font-semibold text-dei-muted dark:text-dei-dark-muted">
                        12 Pertemuan
                      </span>
                      <button
                        onClick={() => {
                          const matched = materials.find((m) => m.subject_code === code) || materials[0];
                          setActiveViewerMaterial(matched);
                        }}
                        className="font-bold text-dei-emerald dark:text-dei-emerald-neon hover:underline flex items-center gap-1"
                      >
                        Buka Akses Modul →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TUGAS & PENILAIAN */}
      {activeTab === 'tugas' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-dei-emerald dark:text-dei-emerald-neon" />
              Daftar Tugas & Pengumpulan Santri
            </h2>
            {isTutorOrAdmin ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Mode Penilai: Ustadz / Tutor Pengampu</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-dei-emerald">
                Santri: {user?.full_name || 'Santri'}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {displayedAssignments.map((asg, idx) => {
              const title = asg.title || asg.Title || 'Tugas Santri';
              const dueDate = asg.due_date || asg.DueDate || 'Ahad Pekan Depan';
              const instructions = asg.instructions || asg.Instructions || 'Lengkapi tugas berikut.';
              const maxScore = asg.max_score ?? asg.MaxScore ?? 100;
              const subjectName = asg.subject_name || (asg.id === 'asg-01' ? "Tahfizh Al-Qur'an Bersanad" : asg.id === 'asg-02' ? "Bahasa Indonesia" : "Matematika Terapan");
              const tutorName = asg.tutor_name || (asg.id === 'asg-01' ? "Ustadz Ahmad Fauzi, Lc." : asg.id === 'asg-02' ? "Ustadzah Fatimah, S.Pd." : "Ahmad Fauzan, S.Kom., M.T.");

              return (
                <div
                  key={asg.id || asg.ID || idx}
                  className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-dei-line dark:border-dei-dark-line">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-dei-gold">
                          {subjectName} • Kelas X Paket C
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-neutral-100 dark:bg-neutral-800 text-dei-muted">
                          Tutor: {tutorName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink mt-1">
                        {title}
                      </h3>
                    </div>
                    <div className="text-xs text-dei-muted dark:text-dei-dark-muted font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                      <span>Batas Waktu: <b>{dueDate}</b></span>
                    </div>
                  </div>

                  <div className="text-xs text-dei-muted dark:text-dei-dark-muted whitespace-pre-line leading-relaxed">
                    {instructions}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-dei-muted dark:text-dei-dark-muted">
                      Nilai Maksimal: <b>{maxScore}</b>
                    </span>

                    {!isTutorOrAdmin ? (
                      <button
                        id="btn-open-submit-asg"
                        onClick={() => setSubmittingAsg(asg)}
                        className="py-2 px-4 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Kumpulkan Jawaban / Audio</span>
                      </button>
                    ) : (
                      <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        <span>Mode Penilai: Silakan periksa & berikan nilai pada tabel di bawah</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submissions Table & Grading Area */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-dei-emerald dark:text-dei-emerald-neon" />
                {isSuperAdminOrDirector
                  ? 'Riwayat Pengumpulan & Nilai Semua Santri (Mode Pimpinan)'
                  : isWaliKelas
                  ? 'Monitoring Nilai Santri Kelas X Paket C (Wali Kelas)'
                  : isTutor
                  ? `Pengumpulan Tugas Santri — ${mySubjectNames.length > 0 ? mySubjectNames.join(' & ') : 'Mata Pelajaran Diampu'}`
                  : `Riwayat Tugas Saya (${user?.full_name || 'Santri'})`}
              </h3>
              <span className="text-xs text-dei-muted dark:text-dei-dark-muted font-mono">
                {displayedSubmissions.length} Data Tugas
              </span>
            </div>

            {displayedSubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-dei-muted dark:text-dei-dark-muted bg-dei-bg dark:bg-dei-dark-bg rounded-xl border border-dashed border-dei-line dark:border-dei-dark-line space-y-2">
                <FileText className="w-8 h-8 mx-auto text-dei-muted opacity-40" />
                <p className="font-semibold">
                  {isTutor
                    ? 'Belum ada pengumpulan tugas dari santri untuk mata pelajaran yang Anda ampu.'
                    : 'Belum ada data pengumpulan tugas untuk akun santri Anda.'}
                </p>
                {!isTutorOrAdmin && (
                  <p>Silakan klik tombol <b>"Kumpulkan Jawaban / Audio"</b> di atas untuk menyetor tugas pertama.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-dei-line dark:border-dei-dark-line text-dei-muted dark:text-dei-dark-muted font-bold">
                      <th className="py-2.5 px-3">Santri</th>
                      <th className="py-2.5 px-3">Mata Pelajaran</th>
                      <th className="py-2.5 px-3">Catatan Jawaban</th>
                      <th className="py-2.5 px-3">Berkas / Audio</th>
                      <th className="py-2.5 px-3">Waktu Kirim</th>
                      <th className="py-2.5 px-3">Nilai</th>
                      <th className="py-2.5 px-3">Feedback Tutor</th>
                      {isTutorOrAdmin && <th className="py-2.5 px-3 text-right">Aksi Penilai</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dei-line dark:divide-dei-dark-line">
                    {displayedSubmissions.map((subm, idx) => {
                      const studentName = subm.student_name || subm.StudentName || 'Santri';
                      const submissionText = subm.submission_text || subm.SubmissionText || '-';
                      const fileUrl = subm.file_url || subm.FileURL;
                      const rawTime = subm.submitted_at || subm.SubmittedAt || subm.created_at;
                      const timeStr = rawTime ? new Date(rawTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '16:00 WIB';
                      const score = subm.score ?? subm.Score;
                      const feedback = subm.feedback || subm.Feedback || '-';
                      const isAudio = fileUrl && (fileUrl.includes('audio') || fileUrl.includes('.mp3') || fileUrl.startsWith('data:audio'));

                      return (
                        <tr key={subm.id || subm.ID || idx} className="hover:bg-dei-bg dark:hover:bg-dei-dark-bg/60">
                          <td className="py-3 px-3 font-bold text-dei-ink dark:text-dei-dark-ink whitespace-nowrap">
                            {studentName}
                          </td>
                          <td className="py-3 px-3 font-semibold text-dei-gold whitespace-nowrap text-[11px]">
                            {subm.subject_name || (subm.assignment_id === 'asg-01' ? "Tahfizh Al-Qur'an" : subm.assignment_id === 'asg-02' ? "Bahasa Indonesia" : "Matematika Terapan")}
                          </td>
                          <td className="py-3 px-3 text-dei-muted dark:text-dei-dark-muted max-w-[200px] truncate">
                            {submissionText}
                          </td>
                          <td className="py-3 px-3">
                            {fileUrl ? (
                              <div className="space-y-1">
                                {isAudio ? (
                                  <div className="space-y-1">
                                    <audio controls src={fileUrl} className="h-7 w-44 rounded" />
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                      <Volume2 className="w-3 h-3" /> Audio Setoran
                                    </span>
                                  </div>
                                ) : (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-dei-emerald dark:text-dei-emerald-neon font-bold hover:underline flex items-center gap-1"
                                  >
                                    Lihat Berkas <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-3 text-dei-muted dark:text-dei-dark-muted font-mono whitespace-nowrap">
                            {timeStr}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {score != null ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-dei-emerald dark:text-dei-emerald-neon font-mono">
                                {Number(score).toFixed(1)} / 100
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                Menunggu Dinilai
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-dei-muted dark:text-dei-dark-muted italic max-w-[200px] truncate">
                            {feedback}
                          </td>
                          {isTutorOrAdmin && (
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setGradingSubm(subm);
                                  setGradeScore(score != null ? score : 90);
                                  setGradeComment(feedback !== '-' ? feedback : '');
                                }}
                                className="py-1 px-3 rounded-lg bg-dei-emerald text-white text-[11px] font-bold hover:bg-dei-emerald-dark transition-colors shadow"
                              >
                                {score != null ? 'Koreksi Nilai' : 'Beri Nilai'}
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
        </div>
      )}

      {/* MODAL KUMPUL TUGAS SANTRI (DENGAN DIRECT AUDIO/FILE UPLOAD & DIRECT VOICE RECORDER) */}
      {submittingAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-dei-dark-surface rounded-2xl shadow-2xl border border-dei-line dark:border-dei-dark-line p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <span className="text-[11px] font-bold text-dei-gold">Pengumpulan Tugas Santri</span>
                <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink">
                  {submittingAsg.title || submittingAsg.Title}
                </h3>
              </div>
              <button
                onClick={() => {
                  stopRecording();
                  setSubmittingAsg(null);
                }}
                className="text-dei-muted hover:text-dei-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {submFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{submFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Teks Jawaban / Catatan Santri *
                </label>
                <textarea
                  id="input-asg-text"
                  required
                  rows={3}
                  value={submText}
                  onChange={(e) => setSubmText(e.target.value)}
                  placeholder="Tuliskan jawaban atau rangkuman materi tugas Anda di sini..."
                  className="w-full p-3 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                />
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-dei-emerald" />
                    Upload Audio / Foto / Dokumen Langsung (Tanpa Perlu Link)
                  </label>
                  <span className="text-[10px] text-dei-muted font-semibold">Opsional Langsung</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-dei-muted mb-1">
                    Pilih Berkas dari HP / Laptop (Audio, Gambar, atau PDF):
                  </label>
                  <input
                    type="file"
                    accept="audio/*,image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full text-xs text-dei-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-dei-emerald file:text-white hover:file:bg-dei-emerald-dark cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-dei-muted">Atau Rekam Suara Langsung (Mic):</span>
                    {isRecording && (
                      <span className="text-xs font-bold font-mono text-red-500 animate-pulse flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        {formatTimer(recordingSeconds)}
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
                        <span>Mulai Rekam Suara</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="py-1.5 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold flex items-center gap-1.5 shadow animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Selesai & Simpan Rekaman</span>
                      </button>
                    )}
                  </div>
                </div>

                {uploadedFile && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-200 truncate max-w-[280px]">
                        ✓ {uploadedFile.name} ({uploadedFile.size})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setRecordedAudioUrl('');
                        }}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        Hapus
                      </button>
                    </div>

                    {recordedAudioUrl && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-dei-muted">Putar untuk mendengarkan kembali:</span>
                        <audio controls src={recordedAudioUrl} className="w-full h-8" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1">
                  Atau Masukkan Tautan Link (Alternatif jika ada di Google Drive / CDN):
                </label>
                <input
                  type="url"
                  value={submUrl}
                  onChange={(e) => setSubmUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopRecording();
                    setSubmittingAsg(null);
                  }}
                  className="py-2 px-4 rounded-xl border text-xs font-semibold text-dei-muted hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  id="btn-send-assignment"
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Tugas ke Ustadz</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BERI NILAI TUTOR */}
      {gradingSubm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-dei-dark-surface rounded-2xl shadow-2xl border border-dei-line dark:border-dei-dark-line p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <span className="text-[11px] font-bold text-dei-gold">Form Penilaian Tutor</span>
                <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink">
                  Santri: {gradingSubm.student_name || gradingSubm.StudentName}
                </h3>
              </div>
              <button
                onClick={() => setGradingSubm(null)}
                className="text-dei-muted hover:text-dei-ink font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line space-y-2 text-xs">
              <span className="font-bold text-dei-muted">Jawaban Santri:</span>
              <p className="text-dei-ink dark:text-dei-dark-ink italic">
                "{gradingSubm.submission_text || gradingSubm.SubmissionText || 'Tidak ada teks'}"
              </p>

              {(gradingSubm.file_url || gradingSubm.FileURL) && (
                <div className="pt-2 border-t border-dei-line dark:border-dei-dark-line space-y-1">
                  <span className="font-bold text-dei-muted flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-dei-emerald" /> Dengar Audio / Buka Berkas Setoran:
                  </span>
                  <audio controls src={gradingSubm.file_url || gradingSubm.FileURL} className="w-full h-8 mt-1" />
                </div>
              )}
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Skor Nilai Formatif (Skala 0 - 100) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={0.5}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-base font-extrabold font-mono text-dei-emerald focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Catatan Masukan / Feedback Tutor *
                </label>
                <textarea
                  required
                  rows={3}
                  value={gradeComment}
                  onChange={(e) => setGradeComment(e.target.value)}
                  placeholder="Masya Allah, bacaan tajwid sangat baik..."
                  className="w-full p-3 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubm(null)}
                  className="py-2 px-4 rounded-xl border text-xs font-semibold text-dei-muted hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold shadow"
                >
                  Simpan Nilai & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ATUR GOOGLE MEET OLEH TUTOR */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-dei-dark-surface rounded-2xl shadow-2xl border border-dei-line dark:border-dei-dark-line p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <span className="text-[11px] font-bold text-dei-gold">Kontrol Virtual Room</span>
                <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink">
                  Atur Link Google Meet KBM
                </h3>
              </div>
              <button
                onClick={() => setEditingSchedule(null)}
                className="text-dei-muted hover:text-dei-ink font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeetingLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Tautan / Link Google Meet Kelas *
                </label>
                <input
                  type="url"
                  required
                  value={meetUrlInput}
                  onChange={(e) => setMeetUrlInput(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                />
              </div>

              <div className="p-3 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                    Status Ruang Kelas Meet
                  </div>
                  <div className="text-[11px] text-dei-muted">
                    {meetActiveInput
                      ? 'Ruang aktif: Tombol Masuk di santri menyala'
                      : 'Ruang ditutup: Tombol Masuk di santri terkunci'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMeetActiveInput(!meetActiveInput)}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    meetActiveInput
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {meetActiveInput ? 'Buka Kelas (Aktif)' : 'Tutup (Nonaktif)'}
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
        onConfirm={modalConfig.onConfirm ? () => {
          modalConfig.onConfirm();
          hideModal();
        } : undefined}
        onCancel={modalConfig.onCancel ? () => {
          modalConfig.onCancel();
          hideModal();
        } : undefined}
        onClose={hideModal}
      />
    </div>
  );
};

export default KbmPage;
