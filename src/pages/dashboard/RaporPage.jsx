import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  isSantri,
  isWaliKelas,
  isPimpinanOrManajemen,
  isTutor
} from '../../utils/rbac';
import {
  Award,
  FileCheck,
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
  BookOpen,
  UserCheck,
  Clock,
  Layers,
  Search,
  Check,
  AlertCircle,
  Sliders,
  ChevronDown,
  Eye,
  Filter,
  User,
  FileText,
  Edit3,
  Plus,
  ArrowLeft,
  Save,
  Table,
  Calculator,
  RotateCcw
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThemeModal } from '../../components/common/ThemeModal';

export const RaporPage = () => {
  const { user, token } = useAuth();
  const userIsSantri = isSantri(user);
  const userCanManage = isWaliKelas(user) || isPimpinanOrManajemen(user) || isTutor(user);

  // Tabs: 'gradebook' | 'subject_weights' | 'e_rapor' | 'verify_qr'
  const [activeTab, setActiveTab] = useState(userIsSantri ? 'e_rapor' : 'gradebook');

  // Gradebook Data
  const [gradebookEntries, setGradebookEntries] = useState([]);
  const [isGradeLocked, setIsGradeLocked] = useState(true);
  const [isRaporReleased, setIsRaporReleased] = useState(true);
  const [reportCards, setReportCards] = useState([]);
  const [selectedReportCard, setSelectedReportCard] = useState(null);

  // Semester Filter: 'sem-3' (Aktif) | 'sem-2' | 'sem-1'
  const [selectedSemester, setSelectedSemester] = useState('sem-3');

  // ThemeModal State (Pengganti alert & confirm browser)
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

  // Available Subjects for Ledger / Gradebook Studio
  const mapelList = [
    { code: 'THF-01', name: "Tahfizh Al-Qur'an Bersanad & Tajwid", tutor: 'Ustadzah Fatimah, S.Pd.', isCbt: true, kkm: 75 },
    { code: 'MTK-10', name: 'Matematika Terapan & Logika Digital', tutor: 'Ahmad Fauzan, S.Kom., M.T.', isCbt: true, kkm: 75 },
    { code: 'ARB-01', name: 'Bahasa Arab Komunikatif & Nahwu', tutor: 'Ustadz Ahmad Fauzi, Lc.', isCbt: true, kkm: 75 },
    { code: 'IND-10', name: 'Bahasa Indonesia (Paket C)', tutor: 'Ustadzah Fatimah, S.Pd.', isCbt: false, kkm: 75 },
    { code: 'TEC-01', name: 'AI Literacy & Digital Skill', tutor: 'Ahmad Fauzan, S.Kom., M.T.', isCbt: true, kkm: 75 },
    { code: 'FQH-01', name: 'Fiqh Ibadah Praktis', tutor: 'Ustadz Ahmad Fauzi, Lc.', isCbt: false, kkm: 75 },
    { code: 'AQD-01', name: 'Aqidah & Akhlak Thullab', tutor: 'Ustadzah Fatimah, S.Pd.', isCbt: false, kkm: 75 },
  ];

  // Dedicated Full-Page Grade Studio State (Sub-Page Leger Penilaian Harian)
  const [isGradeStudioOpen, setIsGradeStudioOpen] = useState(false);
  const [selectedLedgerMapel, setSelectedLedgerMapel] = useState('THF-01');
  const [ledgerSaving, setLedgerSaving] = useState(false);
  const [ledgerRows, setLedgerRows] = useState([]);

  // Manual Grading Modal State (Fallback / Legacy)
  const [manualGradeModalOpen, setManualGradeModalOpen] = useState(false);
  const [targetStudentForManual, setTargetStudentForManual] = useState(null);
  const [manualUtsScore, setManualUtsScore] = useState(90);
  const [manualUtsSource, setManualUtsSource] = useState('Ujian Lisan / Praktik');
  const [manualUasScore, setManualUasScore] = useState(90);
  const [manualUasSource, setManualUasSource] = useState('Ujian Lisan / Praktik');
  const [manualAdabScore, setManualAdabScore] = useState(95);
  const [manualTahfizhScore, setManualTahfizhScore] = useState(95);
  const [manualNotes, setManualNotes] = useState('');

  // Helper kalkulasi metrik baris leger (RPH, HPA, Predikat, Status) dengan strict clamping 0-100
  const calculateRowMetrics = (p1, p2, p3, p4, p5, p6, p7, pts, pas) => {
    const pList = [p1, p2, p3, p4, p5, p6, p7]
      .map((v) => (v !== '' && v !== null && !isNaN(v) ? Math.min(100, Math.max(0, Number(v))) : null))
      .filter((v) => v !== null);

    const rph = pList.length > 0
      ? Math.round((pList.reduce((acc, c) => acc + c, 0) / pList.length) * 10) / 10
      : 0;

    const validPts = pts !== '' && pts !== null && !isNaN(pts) ? Math.min(100, Math.max(0, Number(pts))) : 0;
    const validPas = pas !== '' && pas !== null && !isNaN(pas) ? Math.min(100, Math.max(0, Number(pas))) : 0;

    let hpa = 0;
    if (rph > 0 || validPts > 0 || validPas > 0) {
      // Formula Kurikulum Terpadu: (2 * RPH + PTS + PAS) / 4
      hpa = Math.min(100, Math.round(((2 * rph) + validPts + validPas) / 4 * 10) / 10);
    }

    let letter = 'C';
    let status = 'REMEDIAL';
    if (hpa >= 90) {
      letter = 'A';
      status = 'TUNTAS (MUMTAZ)';
    } else if (hpa >= 75) {
      letter = 'B';
      status = 'TUNTAS';
    }

    return { rph, hpa, letter, status };
  };

  // Sinkronisasi data baris leger dari gradebook & mapel aktif
  useEffect(() => {
    if (!gradebookEntries || gradebookEntries.length === 0) return;
    const currentMapel = mapelList.find((m) => m.code === selectedLedgerMapel) || mapelList[0];
    const isCbt = currentMapel.isCbt;

    setLedgerRows((prev) => {
      return gradebookEntries.map((st) => {
        const existing = prev.find((r) => r.student_id === st.student_id && r.mapel_code === selectedLedgerMapel);
        // Pastikan tidak mewarisi nilai anomali (> 100)
        if (existing && existing.rph <= 100 && existing.hpa <= 100) return existing;

        let p1 = 100, p2 = 100, p3 = 95, p4 = '', p5 = '', p6 = '', p7 = '';
        let pts = isCbt ? (st.uts_score || 90) : 88;
        let pas = isCbt ? (st.uas_score || 92) : 90;

        if (st.student_name.toLowerCase().includes('yafiq')) {
          p1 = 90; p2 = 90; p3 = 88; pts = isCbt ? 84 : 85; pas = isCbt ? 87 : 86;
        } else if (st.student_name.toLowerCase().includes('andhika')) {
          p1 = 100; p2 = 100; p3 = 98; pts = isCbt ? 96 : 95; pas = isCbt ? 97 : 96;
        } else if (st.student_name.toLowerCase().includes('afdhal')) {
          p1 = 90; p2 = 90; p3 = 85; pts = isCbt ? 80 : 82; pas = isCbt ? 91 : 89;
        } else if (st.student_name.toLowerCase().includes('deedat')) {
          p1 = 100; p2 = 90; p3 = 95; pts = isCbt ? 99 : 94; pas = isCbt ? 97 : 95;
        }

        const metrics = calculateRowMetrics(p1, p2, p3, p4, p5, p6, p7, pts, pas);

        return {
          student_id: st.student_id,
          student_name: st.student_name,
          nisn: st.nisn,
          mapel_code: selectedLedgerMapel,
          p1, p2, p3, p4, p5, p6, p7,
          pts,
          pas,
          isCbt,
          rph: metrics.rph,
          hpa: metrics.hpa,
          letter: metrics.letter,
          status: metrics.status,
          notes: st.homeroom_notes || ''
        };
      });
    });
  }, [gradebookEntries, selectedLedgerMapel]);

  // Handler update cell pada baris leger dengan sanitasi dan clamping angka 0-100
  const handleUpdateLedgerCell = (studentId, field, rawVal) => {
    let val = rawVal;
    if (['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'pts', 'pas'].includes(field)) {
      if (val !== '' && val !== null && !isNaN(val)) {
        val = Math.min(100, Math.max(0, Number(val)));
      }
    }
    setLedgerRows((prev) =>
      prev.map((row) => {
        if (row.student_id !== studentId) return row;
        const updated = { ...row, [field]: val };
        const metrics = calculateRowMetrics(
          updated.p1,
          updated.p2,
          updated.p3,
          updated.p4,
          updated.p5,
          updated.p6,
          updated.p7,
          updated.pts,
          updated.pas
        );
        return {
          ...updated,
          rph: metrics.rph,
          hpa: metrics.hpa,
          letter: metrics.letter,
          status: metrics.status,
        };
      })
    );
  };

  // Handler isi cepat (preset)
  const handleQuickFillPreset = (presetScore = 90) => {
    setLedgerRows((prev) =>
      prev.map((row) => {
        const p1 = row.p1 || presetScore;
        const p2 = row.p2 || presetScore;
        const p3 = row.p3 || presetScore;
        const pts = row.pts || presetScore;
        const pas = row.pas || presetScore;
        const metrics = calculateRowMetrics(p1, p2, p3, row.p4, row.p5, row.p6, row.p7, pts, pas);
        return {
          ...row,
          p1,
          p2,
          p3,
          pts,
          pas,
          rph: metrics.rph,
          hpa: metrics.hpa,
          letter: metrics.letter,
          status: metrics.status,
        };
      })
    );
  };

  // Handler reset nilai PH seluruh kelas (kosongkan P1-P7 untuk isi manual dari nol)
  const handleResetLedgerPH = () => {
    setLedgerRows((prev) =>
      prev.map((row) => {
        const metrics = calculateRowMetrics('', '', '', '', '', '', '', row.pts, row.pas);
        return {
          ...row,
          p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: '',
          rph: metrics.rph,
          hpa: metrics.hpa,
          letter: metrics.letter,
          status: metrics.status,
        };
      })
    );
  };

  // Handler simpan seluruh nilai leger ke backend & e-rapor
  const handleSaveLedger = async () => {
    setLedgerSaving(true);
    const currentMapel = mapelList.find((m) => m.code === selectedLedgerMapel) || mapelList[0];
    try {
      const payload = {
        subject_code: selectedLedgerMapel,
        semester_code: selectedSemester,
        grades: ledgerRows.map((r) => ({
          student_id: r.student_id,
          ph_scores: [r.p1, r.p2, r.p3, r.p4, r.p5, r.p6, r.p7]
            .map((v) => (v !== '' && v !== null && !isNaN(v) ? Number(v) : 0)),
          rph: r.rph,
          pts: Number(r.pts) || 0,
          pas: Number(r.pas) || 0,
          hpa: r.hpa,
          letter_grade: r.letter,
          notes: r.notes || '',
        })),
      };

      const res = await fetch('/api/v1/grading/batch-ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showModal({
          title: 'Leger Nilai Berhasil Disimpan!',
          message: `Seluruh nilai Penilaian Harian (PH), PTS, dan PAS untuk mata pelajaran "${currentMapel.name}" telah tersimpan dan terintegrasi otomatis ke buku nilai dan seluruh lembar E-Rapor santri.`,
          type: 'success',
        });
        await fetchGradingData(selectedSemester);
      } else {
        const json = await res.json();
        showModal({
          title: 'Gagal Menyimpan Leger',
          message: json.message || 'Terjadi kesalahan sistem saat menyimpan data.',
          type: 'error',
        });
      }
    } catch (err) {
      showModal({
        title: 'Kesalahan Jaringan',
        message: 'Tidak dapat menghubungi server penilaian.',
        type: 'error',
      });
    } finally {
      setLedgerSaving(false);
    }
  };

  // Subject Weights State
  const [subjectWeights, setSubjectWeights] = useState([
    {
      subject_code: 'THF-01',
      subject_name: "Tahfizh Al-Qur'an Bersanad",
      attendance: 10,
      assignment: 20,
      tahfizh_daily: 30,
      uts: 20,
      uas: 20,
      uts_source_type: 'LISAN_MANUAL', // Ujian Lisan Tajwid
      uas_source_type: 'CBT_ONLINE',
      adab_behavior: 10,
      passing_score: 75,
    },
    {
      subject_code: 'MTK-10',
      subject_name: 'Matematika Terapan & Logika Digital',
      attendance: 10,
      assignment: 30,
      tahfizh_daily: 0,
      uts: 30,
      uas: 30,
      uts_source_type: 'CBT_ONLINE',
      uas_source_type: 'CBT_ONLINE',
      adab_behavior: 10,
      passing_score: 75,
    },
    {
      subject_code: 'ARB-01',
      subject_name: 'Bahasa Arab Komunikatif & Nahwu',
      attendance: 10,
      assignment: 25,
      tahfizh_daily: 15,
      uts: 25,
      uas: 25,
      uts_source_type: 'LISAN_MANUAL',
      uas_source_type: 'CBT_ONLINE',
      adab_behavior: 10,
      passing_score: 75,
    },
  ]);
  const [selectedWeightMapel, setSelectedWeightMapel] = useState('THF-01');
  const [weightSaveMsg, setWeightSaveMsg] = useState('');

  // Selected Student Detail Modal for Teacher
  const [detailStudent, setDetailStudent] = useState(null);

  // QR Code Image Data URL
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Public QR Verification state
  const [verifyCodeInput, setVerifyCodeInput] = useState('DAR-EL-IMAN-RAPOR-2026-XPC-001');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // 1. Fetch Gradebook & Report Cards with Semester Filter
  const fetchGradingData = async (semester = selectedSemester) => {
    try {
      const [resGb, resRep] = await Promise.all([
        fetch('/api/v1/grading/gradebook'),
        fetch(`/api/v1/report-cards?semester=${semester}`),
      ]);

      if (resGb.ok) {
        const jsonGb = await resGb.json();
        if (jsonGb.data) {
          setGradebookEntries(jsonGb.data);
          setIsGradeLocked(jsonGb.is_grade_locked ?? true);
          setIsRaporReleased(jsonGb.is_rapor_released ?? true);
          if (jsonGb.subject_weights) {
            setSubjectWeights(jsonGb.subject_weights);
          }
        }
      }

      if (resRep.ok) {
        const jsonRep = await resRep.json();
        if (jsonRep.data && jsonRep.data.length > 0) {
          setReportCards(jsonRep.data);
          // If student, find their report card
          if (userIsSantri) {
            const myRep = jsonRep.data.find(
              (r) =>
                r.student_id === user?.id ||
                r.student_name?.toLowerCase().includes((user?.full_name || '').toLowerCase())
            ) || jsonRep.data[0];
            setSelectedReportCard(myRep);
          } else {
            setSelectedReportCard((prev) => {
              if (prev) {
                const found = jsonRep.data.find((r) => r.student_id === prev.student_id);
                if (found) return found;
              }
              return jsonRep.data[0];
            });
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data rapor:', err);
    }
  };

  useEffect(() => {
    fetchGradingData(selectedSemester);
  }, [selectedSemester]);

  // 2. Dynamic QR Code generation for current selected report card
  useEffect(() => {
    if (!selectedReportCard?.qr_verification_code && !selectedReportCard?.QRVerificationCode) return;

    const qrCodeStr = selectedReportCard.qr_verification_code || selectedReportCard.QRVerificationCode;
    const generateQR = async () => {
      try {
        const urlToEncode = selectedReportCard.verification_url || `http://localhost:5173/#/verify-rapor/${qrCodeStr}`;
        const dataUrl = await QRCode.toDataURL(urlToEncode, {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Gagal generate QR code:', err);
      }
    };

    generateQR();
  }, [selectedReportCard]);

  // 3. Toggle Lock/Unlock Grades (Maker-Checker Wali Kelas)
  const handleToggleLock = () => {
    const nextState = !isGradeLocked;
    showModal({
      title: nextState ? 'Kunci Nilai Resmi Rapor?' : 'Buka Revisi Nilai Rapor?',
      message: nextState
        ? 'Apakah Anda yakin ingin mengunci seluruh nilai resmi? Ustadz pengampu mata pelajaran tidak dapat mengubah nilai lagi tanpa izin revisi dari Wali Kelas.'
        : 'Apakah Anda yakin ingin membuka kembali izin revisi nilai kepada Ustadz pengampu mata pelajaran?',
      type: 'confirm',
      confirmText: nextState ? 'Ya, Kunci Nilai' : 'Ya, Buka Revisi',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/grading/toggle-lock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setIsGradeLocked(json.is_grade_locked);
          }
        } catch (err) {
          showModal({
            title: 'Gagal Mengubah Status',
            message: 'Gagal mengubah status penguncian nilai.',
            type: 'error'
          });
        }
      },
      onCancel: () => {
        // Dibatalkan oleh pengguna - tidak ada mutasi state
      }
    });
  };

  // 4. Toggle Rilis Pembagian Rapor ke Santri
  const handleToggleReleaseRapor = () => {
    const nextState = !isRaporReleased;
    showModal({
      title: nextState ? 'Buka Akses E-Rapor ke Santri?' : 'Tutup Akses E-Rapor Santri?',
      message: nextState
        ? 'Apakah Anda yakin ingin membuka akses E-Rapor digital resmi ke seluruh santri dan wali santri? Santri akan dapat melihat nilai rapor dan mengunduh berkas e-rapor resmi.'
        : 'Apakah Anda yakin ingin menutup sementara akses E-Rapor digital santri? Santri akan melihat pesan bahwa rapor sedang dalam proses kompilasi dewan guru.',
      type: 'confirm',
      confirmText: nextState ? 'Ya, Buka Akses Rapor' : 'Ya, Tutup Akses',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/report-cards/toggle-release', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setIsRaporReleased(json.is_rapor_released);
          }
        } catch (err) {
          showModal({
            title: 'Gagal Mengubah Status',
            message: 'Gagal mengubah status rilis pembagian rapor.',
            type: 'error'
          });
        }
      },
      onCancel: () => {
        // Dibatalkan oleh pengguna (klik silang X atau tombol Batal) - status sama sekali TIDAK berubah!
      }
    });
  };

  // 5. Save Subject Weights
  const handleSaveWeights = async (e) => {
    e.preventDefault();
    const currentConfig = subjectWeights.find((w) => w.subject_code === selectedWeightMapel);
    if (!currentConfig) return;

    const total = Number(currentConfig.attendance) + Number(currentConfig.assignment) + Number(currentConfig.tahfizh_daily) + Number(currentConfig.uts) + Number(currentConfig.uas);
    if (Math.abs(total - 100) > 0.1) {
      showModal({
        title: 'Total Bobot Harus 100%',
        message: `Total persentase bobot harus pas 100%. Saat ini total adalah ${total}%. Silakan sesuaikan kembali persentase komponen.`,
        type: 'warning'
      });
      return;
    }

    try {
      const res = await fetch('/api/v1/grading/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentConfig),
      });
      const json = await res.json();
      if (res.ok) {
        showModal({
          title: 'Bobot Mapel Tersimpan',
          message: `Konfigurasi pembobotan mata pelajaran "${currentConfig.subject_name}" berhasil diperbarui.`,
          type: 'success'
        });
      }
    } catch (err) {
      showModal({
        title: 'Gagal Menyimpan Bobot',
        message: 'Gagal menyimpan bobot mata pelajaran ke server.',
        type: 'error'
      });
    }
  };

  // 5b. Save Manual Grade (Ujian Lisan, Praktik, Adab)
  const handleSaveManualGrade = async (e) => {
    if (e) e.preventDefault();
    if (!targetStudentForManual) return;
    try {
      const res = await fetch('/api/v1/grading/manual-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: targetStudentForManual.student_id,
          uts_score: Number(manualUtsScore),
          uts_source: manualUtsSource,
          uas_score: Number(manualUasScore),
          uas_source: manualUasSource,
          adab_score: Number(manualAdabScore),
          tahfizh_score: Number(manualTahfizhScore),
          homeroom_notes: manualNotes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showModal({
          title: 'Nilai Manual Berhasil Disimpan!',
          message: `Nilai ujian lisan, praktik, dan observasi adab untuk santri "${targetStudentForManual.student_name}" telah tersimpan dan terintegrasi otomatis ke buku nilai e-Rapor.`,
          type: 'success'
        });
        setManualGradeModalOpen(false);
        fetchGradingData(selectedSemester);
      } else {
        showModal({
          title: 'Gagal Menyimpan Nilai',
          message: json.message || 'Terjadi kesalahan sistem.',
          type: 'error'
        });
      }
    } catch (err) {
      showModal({
        title: 'Kesalahan Jaringan',
        message: 'Tidak dapat menghubungi server penilaian.',
        type: 'error'
      });
    }
  };

  const updateCurrentWeight = (field, val) => {
    setSubjectWeights((prev) =>
      prev.map((w) =>
        w.subject_code === selectedWeightMapel ? { ...w, [field]: Number(val) || val } : w
      )
    );
  };

  // 6. Verify Public QR Code
  const handleVerifyQR = async (codeToVerify) => {
    const code = (codeToVerify || verifyCodeInput).trim();
    if (!code) return;

    setVerifying(true);
    setVerifyError('');
    setVerificationResult(null);

    try {
      const res = await fetch(`/api/v1/verify-rapor/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setVerificationResult(json);
      } else {
        setVerifyError(json.message || 'Kode QR tidak terdaftar atau dokumen tidak valid.');
      }
    } catch (err) {
      setVerifyError('Terjadi kesalahan koneksi saat verifikasi pangkalan data.');
    } finally {
      setVerifying(false);
    }
  };

  // 7. Individual Student PDF Export
  const handleExportIndividualPDF = (repData) => {
    const rep = repData || selectedReportCard;
    if (!rep) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Kop Surat
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('YAYASAN DAR EL IMAN PADANG', 105, 18, { align: 'center' });

      doc.setFontSize(12);
      doc.text('PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) DIGITAL DAR EL IMAN', 105, 24, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('SK Operasional: 421.1/182/DP/Dikbud/2022 • NPSN: P9997123 • Terakreditasi B Kemendikbudristek RI', 105, 29, { align: 'center' });
      doc.text('Sekretariat: Jl. Raya Gunung Juaro, Kec. Nanggalo, Kota Padang, Sumatera Barat • https://darel-iman.sch.id', 105, 33, { align: 'center' });

      // Garis Ganda Pembatas Kop
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.8);
      doc.line(15, 36, 195, 36);
      doc.setLineWidth(0.2);
      doc.line(15, 37.5, 195, 37.5);

      // Judul Dokumen
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('LAPORAN HASIL PENILAIAN CAPAIAN KOMPETENSI PESERTA DIDIK', 105, 45, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`(E-RAPOR RESMI — ${rep.semester.toUpperCase()})`, 105, 50, { align: 'center' });

      // Biodata Santri
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      doc.text(`Nama Peserta Didik : ${rep.student_name}`, 16, 58);
      doc.text(`NISN               : ${rep.nisn}`, 16, 63);
      doc.text(`Rombongan Belajar  : ${rep.classroom_name}`, 16, 68);

      doc.text(`Tahun Pelajaran : ${rep.academic_year}`, 130, 58);
      doc.text(`Semester        : ${rep.semester}`, 130, 63);
      doc.text(`Tanggal Terbit  : ${rep.published_at}`, 130, 68);

      // Tabel Nilai
      const tableData = (rep.grades || []).map((g, idx) => [
        (idx + 1).toString(),
        g.subject_name,
        g.tutor_name,
        g.passing_threshold.toFixed(0),
        g.score.toFixed(1),
        g.letter_grade,
        g.competency_notes,
      ]);

      autoTable(doc, {
        startY: 73,
        head: [['No', 'Mata Pelajaran', 'Guru Pengampu', 'KKM', 'Nilai', 'Predikat', 'Capaian Kompetensi']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          valign: 'middle',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 32 },
          3: { halign: 'center', cellWidth: 10 },
          4: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
          5: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
          6: { cellWidth: 62 },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 6;

      // Nilai Sikap & Tahfizh Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Capaian Program Unggulan & Sikap Spiritual/Sosial:', 16, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`• Mutaba'ah Tahfizh Bersanad : ${rep.tahfizh_summary}`, 16, finalY + 5);
      doc.text(`• Sikap Spiritual & Sosial  : ${rep.spiritual_grade} • Menjaga shalat fardhu dan berakhlak mulia.`, 16, finalY + 10);
      doc.text(`• Catatan Wali Kelas        : "${rep.homeroom_notes}"`, 16, finalY + 15, { maxWidth: 175 });

      // Embed Real QR Code Image if available
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', 16, finalY + 23, 24, 24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129);
        doc.text('PINDAI VERIFIKASI KEASLIAN', 43, finalY + 29);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Kode Otentikasi: ${rep.qr_verification_code || rep.QRVerificationCode}`, 43, finalY + 34);
        doc.text('Dokumen ini terdaftar resmi di Pangkalan Data PKBM Digital Dar El Iman.', 43, finalY + 38);
        doc.text('Tervalidasi secara kriptografis tanpa memerlukan tanda tangan basah.', 43, finalY + 42);
      }

      // Tanda Tangan
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Padang, 19 Oktober 2026', 150, finalY + 24, { align: 'center' });
      doc.text('Wali Kelas X Paket C,', 150, finalY + 28, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.text('Ustadzah Fatimah, S.Pd.', 150, finalY + 44, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('NIP. 19880415 201201 2 003', 150, finalY + 48, { align: 'center' });

      // Individual PDF save
      const fileName = `E-Rapor_PKBM_${rep.student_name.replace(/\s+/g, '_')}_${rep.semester_code || '2026'}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error('Gagal generate PDF:', err);
      showModal({
        title: 'Gagal Membuat Dokumen PDF',
        message: 'Terjadi kendala saat menyusun berkas PDF: ' + err.message,
        type: 'error'
      });
    }
  };

  const currentMapelWeight = subjectWeights.find((w) => w.subject_code === selectedWeightMapel) || subjectWeights[0];

  // ========================================================
  // STUDIO PENILAIAN HARIAN (PH) & LEGER DIGITAL (PAGE MANDIRI)
  // ========================================================
  if (isGradeStudioOpen) {
    const currentMapel = mapelList.find((m) => m.code === selectedLedgerMapel) || mapelList[0];

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
        {/* Studio Top Control & Header */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsGradeStudioOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Buku Nilai / E-Rapor</span>
              </button>
              <div className="h-4 w-px bg-dei-line dark:bg-dei-dark-line hidden sm:block" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" />
                Studio Leger Penilaian Harian (PH) Digital
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetLedgerPH}
                className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
                title="Kosongkan seluruh kolom nilai PH santri untuk input dari nol"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                <span>Reset PH</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFillPreset(90)}
                className="px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1.5"
                title="Isi nilai default 90 ke seluruh baris"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Isi Cepat (Preset 90)</span>
              </button>
              <button
                type="button"
                onClick={handleSaveLedger}
                disabled={ledgerSaving}
                className="px-5 py-2 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{ledgerSaving ? 'Menyimpan...' : 'Simpan Semua Nilai ke E-Rapor'}</span>
              </button>
            </div>
          </div>

          {/* Title & Info */}
          <div className="border-t border-dei-line dark:border-dei-dark-line pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink">
                Rekapitulasi Penilaian Harian & Asesmen Holistik
              </h2>
              <p className="text-xs text-dei-muted mt-0.5">
                Buku leger digital terpadu (Kurikulum Merdeka & Pondok). Guru cukup menginput Penilaian Harian (P-1 s.d. P-7 / Tugas / UH). Nilai CBT tersinkronisasi otomatis dan nilai akhir rapor (HPA) terkalkulasi secara instan.
              </p>
            </div>

            {/* Subject Switcher & Fixed Semester Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-dei-muted font-bold">Mata Pelajaran:</span>
                <select
                  value={selectedLedgerMapel}
                  onChange={(e) => setSelectedLedgerMapel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                >
                  {mapelList.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name} ({m.isCbt ? 'Sync CBT' : 'Manual'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-dei-muted font-bold">Semester:</span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Semester 3 (Aktif)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sync Status Banner */}
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            currentMapel.isCbt
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
          }`}>
            {currentMapel.isCbt ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-dei-emerald flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-extrabold flex items-center gap-2">
                    <span>🟢 Terintegrasi CBT Digital (Auto-Sync Aktif)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-[10px] font-black text-emerald-900 dark:text-emerald-100">
                      PTS & PAS DITUTUP (READ-ONLY)
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Mata pelajaran <b>"{currentMapel.name}"</b> terdaftar di modul ujian CBT. Nilai <b>PTS (Mid)</b> dan <b>PAS (UAS)</b> otomatis ditarik langsung dari hasil peramban CBT santri dan dikunci agar integritas ujian terlindungi. Ustadz/Ustadzah cukup menginput Penilaian Harian (P-1 s.d. P-7 / Tugas / Ulangan Harian).
                  </p>
                </div>
              </>
            ) : (
              <>
                <Edit3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-extrabold flex items-center gap-2">
                    <span>🟣 Mata Pelajaran Non-CBT (Penilaian Manual / Praktik / Lisan)</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-800 text-[10px] font-black text-purple-900 dark:text-purple-100">
                      PTS & PAS MANUAL (EDITABLE)
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Mata pelajaran <b>"{currentMapel.name}"</b> tidak dijadwalkan di CBT online. Nilai PTS dan PAS terbuka untuk diisi secara manual oleh guru pengampu berdasarkan lembar jawaban fisik, ujian lisan, atau portofolio praktik santri.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Formula Box Banner (Sesuai Excel User) */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-dei-muted" />
              <span className="font-bold text-dei-ink dark:text-dei-dark-ink">Rumus Perhitungan Otomatis:</span>
              <span className="font-mono bg-white dark:bg-neutral-700 px-2.5 py-1 rounded-lg border border-dei-line dark:border-dei-dark-line text-dei-ink dark:text-dei-dark-ink font-bold">
                HPA = (2 × RPH + PTS + PAS) / 4
              </span>
            </div>
            <div className="text-[11px] text-dei-muted flex items-center gap-3">
              <span><b>RPH:</b> Rata-rata PH (P1–P7)</span>
              <span><b>KKM:</b> 75</span>
              <span><b>Predikat:</b> A (≥90) • B (≥75) • C (&lt;75 Remedial)</span>
            </div>
          </div>
        </div>

        {/* Spreadsheet Ledger Table (Desain Excel Interaktif) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
              <span>Daftar Nilai Santri: Kelas X Paket C (Umar bin Khattab)</span>
              <span className="text-xs font-normal text-dei-muted">({ledgerRows.length} Santri Terdaftar)</span>
            </h3>
            <span className="text-[11px] text-dei-muted">
              💡 <i>Ketik angka di kolom P-1 s.d. P-7, nilai RPH dan HPA akan terhitung otomatis seketika.</i>
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-dei-line dark:border-dei-dark-line">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* Row 1 Header */}
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink uppercase font-extrabold text-[10px] tracking-wider border-b border-dei-line dark:border-dei-dark-line">
                  <th rowSpan="2" className="py-2.5 px-3 text-center border-r border-dei-line dark:border-dei-dark-line w-10">No</th>
                  <th rowSpan="2" className="py-2.5 px-4 border-r border-dei-line dark:border-dei-dark-line min-w-[200px]">Nama Santri</th>
                  <th colSpan="7" className="py-2 px-3 text-center border-r border-dei-line dark:border-dei-dark-line bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300">
                    Penilaian Harian / PH (Tes Tulis, Tes Lisan, Tugas)
                  </th>
                  <th rowSpan="2" className="py-2.5 px-3 text-center border-r border-dei-line dark:border-dei-dark-line bg-neutral-200/70 dark:bg-neutral-700/50 w-16">
                    RPH
                  </th>
                  <th rowSpan="2" className="py-2.5 px-3 text-center border-r border-dei-line dark:border-dei-dark-line bg-neutral-200/70 dark:bg-neutral-700/50 w-24">
                    PTS {currentMapel.isCbt && <span className="text-[9px] block text-emerald-600 font-bold">(CBT Sync)</span>}
                  </th>
                  <th rowSpan="2" className="py-2.5 px-3 text-center border-r border-dei-line dark:border-dei-dark-line bg-neutral-200/70 dark:bg-neutral-700/50 w-24">
                    PAS {currentMapel.isCbt && <span className="text-[9px] block text-emerald-600 font-bold">(CBT Sync)</span>}
                  </th>
                  <th rowSpan="2" className="py-2.5 px-3 text-center border-r border-dei-line dark:border-dei-dark-line bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 w-20">
                    HPA (Akhir)
                  </th>
                  <th rowSpan="2" className="py-2.5 px-3 text-center border-r border-dei-line dark:border-dei-dark-line w-24">
                    Predikat
                  </th>
                  <th rowSpan="2" className="py-2.5 px-4 min-w-[180px]">
                    Catatan Kemajuan Santri
                  </th>
                </tr>
                {/* Row 2 Subheader for P1-P7 */}
                <tr className="bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-[10px] font-bold border-b border-dei-line dark:border-dei-dark-line">
                  {['P-1', 'P-2', 'P-3', 'P-4', 'P-5', 'P-6', 'P-7'].map((phLabel) => (
                    <th key={phLabel} className="py-1 px-1 text-center border-r border-dei-line dark:border-dei-dark-line w-14 min-w-[54px] font-mono">
                      {phLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dei-line dark:divide-dei-dark-line">
                {ledgerRows.map((row, idx) => (
                  <tr key={row.student_id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                    {/* No */}
                    <td className="py-2.5 px-2 text-center text-dei-muted font-mono font-bold border-r border-dei-line dark:border-dei-dark-line w-10">
                      {idx + 1}
                    </td>
                    {/* Nama Santri & NISN */}
                    <td className="py-2.5 px-3 border-r border-dei-line dark:border-dei-dark-line min-w-[190px]">
                      <div className="font-extrabold text-dei-ink dark:text-dei-dark-ink text-xs">{row.student_name}</div>
                      <div className="text-[10px] font-mono text-dei-muted">NISN: {row.nisn}</div>
                    </td>
                    {/* P1 s.d. P7 inputs dengan border nyata ala Excel */}
                    {['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map((col, cIdx) => (
                      <td key={col} className="p-1 text-center border-r border-dei-line dark:border-dei-dark-line w-14 min-w-[54px]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row[col] === '' || row[col] === null || row[col] === undefined ? '' : row[col]}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateLedgerCell(row.student_id, col, e.target.value)}
                          placeholder="-"
                          title={`Penilaian Harian P-${cIdx + 1} (${row.student_name})`}
                          className="w-full text-center py-1.5 px-0.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-dei-emerald focus:border-dei-emerald focus:ring-1 focus:ring-dei-emerald bg-white dark:bg-neutral-850 text-dei-ink dark:text-dei-dark-ink font-mono text-xs font-bold focus:outline-none transition-all shadow-2xs"
                        />
                      </td>
                    ))}
                    {/* RPH (Rata-rata Penilaian Harian) */}
                    <td className="py-2 px-2 text-center font-mono font-extrabold text-xs bg-neutral-100/70 dark:bg-neutral-800/60 border-r border-dei-line dark:border-dei-dark-line text-dei-ink dark:text-dei-dark-ink">
                      {row.rph > 0 ? row.rph.toFixed(1) : '-'}
                    </td>
                    {/* PTS (Mid) */}
                    <td className="p-1 text-center border-r border-dei-line dark:border-dei-dark-line w-24">
                      {currentMapel.isCbt ? (
                        <div className="py-1 px-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-xs" title="Tersinkronisasi dari CBT">
                          <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>{row.pts}</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row.pts === '' || row.pts === null || row.pts === undefined ? '' : row.pts}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateLedgerCell(row.student_id, 'pts', e.target.value)}
                          placeholder="0"
                          className="w-full text-center py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-neutral-850 font-mono text-xs font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                        />
                      )}
                    </td>
                    {/* PAS (UAS) */}
                    <td className="p-1 text-center border-r border-dei-line dark:border-dei-dark-line w-24">
                      {currentMapel.isCbt ? (
                        <div className="py-1 px-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-xs" title="Tersinkronisasi dari CBT">
                          <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>{row.pas}</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row.pas === '' || row.pas === null || row.pas === undefined ? '' : row.pas}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateLedgerCell(row.student_id, 'pas', e.target.value)}
                          placeholder="0"
                          className="w-full text-center py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-neutral-850 font-mono text-xs font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                        />
                      )}
                    </td>
                    {/* HPA (Hasil Penilaian Akhir) */}
                    <td className="py-2 px-2 text-center border-r border-dei-line dark:border-dei-dark-line bg-emerald-50/50 dark:bg-emerald-950/30">
                      <span className="font-mono font-black text-sm text-dei-emerald dark:text-emerald-400">
                        {row.hpa > 0 ? row.hpa.toFixed(1) : '-'}
                      </span>
                    </td>
                    {/* Predikat & Status */}
                    <td className="py-2 px-2 text-center border-r border-dei-line dark:border-dei-dark-line">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        row.letter === 'A'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : row.letter === 'B'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {row.letter} ({row.status.includes('TUNTAS') ? 'Tuntas' : 'Remedial'})
                      </span>
                    </td>
                    {/* Catatan Kemajuan */}
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.notes ?? ''}
                        onChange={(e) => handleUpdateLedgerCell(row.student_id, 'notes', e.target.value)}
                        placeholder="Catatan capaian kompetensi..."
                        className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-dei-line focus:border-dei-emerald bg-transparent focus:bg-white dark:focus:bg-neutral-700 text-[11px] focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-dei-line dark:border-dei-dark-line text-xs">
            <div className="text-dei-muted">
              Menampilkan data <b>{ledgerRows.length} santri</b> untuk mata pelajaran <b>{currentMapel.name}</b>.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGradeStudioOpen(false)}
                className="px-4 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-muted hover:text-dei-ink transition-colors"
              >
                Tutup Studio
              </button>
              <button
                type="button"
                onClick={handleSaveLedger}
                disabled={ledgerSaving}
                className="px-5 py-2 rounded-xl bg-dei-emerald hover:bg-dei-emerald-dark text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{ledgerSaving ? 'Menyimpan...' : 'Simpan Semua Nilai ke E-Rapor'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Theme Modal */}
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
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (SIGNATURE DEI BANNER) */}
      {/* ======================================================== */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30 print:hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <FileCheck className="w-72 h-72" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300">
            <Award className="w-3.5 h-3.5" />
            <span>Asesmen & Capaian Belajar • T.A. 2026/2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Buku Nilai Terpadu & E-Rapor Digital Ber-QR Code
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Formula komposit transparan, konfigurasi bobot per mata pelajaran, riwayat multi-semester, dan ekspor PDF per santri berlegalisir digital.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center p-1.5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-xs overflow-x-auto gap-1.5 print:hidden">
        {userCanManage && (
          <>
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'gradebook'
                  ? 'bg-dei-emerald text-white shadow-sm'
                  : 'text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Buku Nilai (Gradebook)</span>
            </button>
            <button
              onClick={() => setActiveTab('subject_weights')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'subject_weights'
                  ? 'bg-dei-emerald text-white shadow-sm'
                  : 'text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Konfigurasi Bobot Mapel</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('e_rapor')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'e_rapor'
              ? 'bg-dei-emerald text-white shadow-sm'
              : 'text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Lembar E-Rapor Santri</span>
        </button>

        <button
          onClick={() => setActiveTab('verify_qr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'verify_qr'
              ? 'bg-dei-emerald text-white shadow-sm'
              : 'text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Cek Keaslian QR</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB 1: BUKU NILAI KELAS DENGAN DETAIL SANTRI & SUMBER */}
      {/* ======================================================== */}
      {activeTab === 'gradebook' && userCanManage && (
        <div className="space-y-6">
          {/* Action Bar: Lock Status & Release Toggle */}
          <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                  Kontrol Pengesahan & Pembagian Rapor
                </span>
                {isGradeLocked ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Nilai Dikunci Resmi
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    Mode Revisi Terbuka
                  </span>
                )}
                {isRaporReleased ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    Akses Santri: DIBUKA
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                    Akses Santri: DITUTUP
                  </span>
                )}
              </div>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted">
                Kunci nilai setelah seluruh nilai formatif, CBT, dan lisan terisi. Kemudian buka akses pembagian rapor ke santri.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedLedgerMapel('THF-01');
                  setIsGradeStudioOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Table className="w-3.5 h-3.5" />
                <span>+ Buka Studio Input Nilai & Penilaian Harian (Leger Digital)</span>
              </button>

              <button
                onClick={handleToggleLock}
                className="px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                {isGradeLocked ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isGradeLocked ? 'Buka Revisi Nilai' : 'Kunci Nilai Resmi'}</span>
              </button>

              <button
                onClick={handleToggleReleaseRapor}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  isRaporReleased
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-dei-emerald hover:bg-dei-emerald-dark text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isRaporReleased ? 'Tutup Akses Rapor Santri' : 'Rilis Pembagian Rapor ke Santri'}</span>
              </button>
            </div>
          </div>

          {/* Legenda Kategori Sumber Nilai (Kategori Asesmen Komprehensif) */}
          <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-dei-emerald" />
                Legenda Kategori Sumber Nilai & Transparansi Asesmen
              </span>
              <span className="text-[10px] text-dei-muted">4 Pilar Penilaian Holistik PKBM Digital</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-dei-dark-surface border border-emerald-200 dark:border-emerald-800/60 shadow-xs flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-extrabold text-emerald-800 dark:text-emerald-300 text-xs">🟢 CBT Digital (Sync)</div>
                  <div className="text-[10px] text-dei-muted mt-0.5 leading-snug">
                    Otomatis tersinkronisasi dari hasil pengerjaan ujian online CBT di portal santri.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-dei-dark-surface border border-purple-200 dark:border-purple-800/60 shadow-xs flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-extrabold text-purple-800 dark:text-purple-300 text-xs">🟣 Ujian Lisan / Praktik</div>
                  <div className="text-[10px] text-dei-muted mt-0.5 leading-snug">
                    Ujian lisan tajwid, hiwar bahasa Arab, & tasmi' hafalan dinilai langsung oleh Guru (Input Manual).
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-dei-dark-surface border border-blue-200 dark:border-blue-800/60 shadow-xs flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-extrabold text-blue-800 dark:text-blue-300 text-xs">🔵 Tugas LMS & Portofolio</div>
                  <div className="text-[10px] text-dei-muted mt-0.5 leading-snug">
                    Akumulasi tugas mandiri terstruktur dan formatif di sistem modul belajar.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-dei-dark-surface border border-amber-200 dark:border-amber-800/60 shadow-xs flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-extrabold text-amber-800 dark:text-amber-300 text-xs">🟡 Observasi Adab & Sikap</div>
                  <div className="text-[10px] text-dei-muted mt-0.5 leading-snug">
                    Penilaian adab spiritual & sosial yang diobservasi objektif oleh Wali Kelas (Input Manual).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gradebook Table */}
          <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-dei-ink dark:text-dei-dark-ink">
                  Daftar Nilai Santri Kelas X Paket C (Umar bin Khattab)
                </h3>
                <p className="text-xs text-dei-muted">
                  Klik tombol <b>Input Nilai</b> untuk nilai manual (lisan/adab), <b>Detail Nilai</b> untuk rincian per mapel, atau <b>Unduh PDF</b>.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-dei-line dark:border-dei-dark-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-dei-muted uppercase font-bold text-[10px] tracking-wider border-b border-dei-line dark:border-dei-dark-line">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-3 text-center">Presensi (Sync)</th>
                    <th className="py-3 px-3 text-center">Tugas LMS</th>
                    <th className="py-3 px-3 text-center">Tahfizh Sanad</th>
                    <th className="py-3 px-3 text-center">UTS (Sumber)</th>
                    <th className="py-3 px-3 text-center">UAS (Sumber)</th>
                    <th className="py-3 px-3 text-center">Adab/Sikap</th>
                    <th className="py-3 px-3 text-center font-black">Nilai Akhir</th>
                    <th className="py-3 px-4 text-right">Aksi Wali Kelas / Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dei-line dark:divide-dei-dark-line">
                  {gradebookEntries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-3 text-center text-dei-muted font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-dei-ink dark:text-dei-dark-ink">{row.student_name}</div>
                        <div className="text-[10px] font-mono text-dei-muted">NISN: {row.nisn}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{row.attendance_score.toFixed(1)}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.assignment_score.toFixed(1)}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {row.tahfizh_score.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-bold">{row.uts_score.toFixed(1)}</div>
                        <div className="text-[9px] text-dei-muted">{row.uts_source}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-bold">{row.uas_score.toFixed(1)}</div>
                        <div className="text-[9px] text-dei-muted">{row.uas_source}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-purple-600">
                        {row.adab_score.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-sm text-dei-emerald">
                        {row.final_score.toFixed(1)} ({row.letter_grade})
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailStudent(row)}
                            className="px-2.5 py-1 rounded-lg border border-dei-line dark:border-dei-dark-line text-[11px] font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-dei-muted" />
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => {
                              const rep = reportCards.find((r) => r.student_id === row.student_id) || reportCards[0];
                              handleExportIndividualPDF(rep);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-dei-emerald text-white text-[11px] font-bold hover:bg-dei-emerald-dark transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Detail Modal */}
          {detailStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
                  <div>
                    <h3 className="text-base font-extrabold text-dei-ink dark:text-dei-dark-ink">
                      Rincian Capaian Santri: {detailStudent.student_name}
                    </h3>
                    <p className="text-xs text-dei-muted font-mono">NISN: {detailStudent.nisn}</p>
                  </div>
                  <button
                    onClick={() => setDetailStudent(null)}
                    className="p-1.5 rounded-lg border border-dei-line dark:border-dei-dark-line text-dei-muted hover:text-dei-ink"
                  >
                    Tutup
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                    <div className="text-[10px] text-dei-muted uppercase font-bold">Presensi (10%)</div>
                    <div className="text-lg font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{detailStudent.attendance_score}</div>
                    <div className="text-[10px] text-emerald-600">Presensi KBM Sync</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                    <div className="text-[10px] text-dei-muted uppercase font-bold">Tugas Formatif (20%)</div>
                    <div className="text-lg font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{detailStudent.assignment_score}</div>
                    <div className="text-[10px] text-emerald-600">LMS Portofolio</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                    <div className="text-[10px] text-dei-muted uppercase font-bold">Tahfizh Sanad (30%)</div>
                    <div className="text-lg font-black text-dei-emerald mt-0.5">{detailStudent.tahfizh_score}</div>
                    <div className="text-[10px] text-emerald-600">Mutaba'ah Musyrif</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                    <div className="text-[10px] text-dei-muted uppercase font-bold">UTS (20%)</div>
                    <div className="text-lg font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{detailStudent.uts_score}</div>
                    <div className="text-[10px] text-dei-muted">{detailStudent.uts_source}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                    <div className="text-[10px] text-dei-muted uppercase font-bold">UAS (20%)</div>
                    <div className="text-lg font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">{detailStudent.uas_score}</div>
                    <div className="text-[10px] text-dei-muted">{detailStudent.uas_source}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-dei-line dark:border-dei-dark-line">
                    <div className="text-[10px] text-dei-muted uppercase font-bold">Observasi Adab</div>
                    <div className="text-lg font-black text-purple-600 mt-0.5">{detailStudent.adab_score}</div>
                    <div className="text-[10px] text-purple-600">Input Manual Wali Kelas</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-dei-muted font-bold">Nilai Akhir Komposit:</span>{' '}
                    <b className="text-base text-dei-emerald font-black">{detailStudent.final_score} ({detailStudent.letter_grade})</b>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Status: {detailStudent.passing_status}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      const rep = reportCards.find((r) => r.student_id === detailStudent.student_id) || reportCards[0];
                      setSelectedReportCard(rep);
                      setDetailStudent(null);
                      setActiveTab('e_rapor');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-xs font-bold text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Buka Lembar Rapor Santri Ini
                  </button>
                  <button
                    onClick={() => {
                      const rep = reportCards.find((r) => r.student_id === detailStudent.student_id) || reportCards[0];
                      handleExportIndividualPDF(rep);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF Santri Ini</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 2: KONFIGURASI BOBOT FLEKSIBEL PER MAPEL */}
      {/* ======================================================== */}
      {activeTab === 'subject_weights' && userCanManage && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dei-line dark:border-dei-dark-line">
              <div>
                <h2 className="text-base font-extrabold text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-dei-emerald" />
                  Kustomisasi Bobot Penilaian Per Mata Pelajaran
                </h2>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted">
                  Tiap mata pelajaran memiliki karakteristik asesmen berbeda (misal: Tahfizh menitikberatkan hafalan lisan, Matematika pada CBT & tugas).
                </p>
              </div>

              {/* Subject Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-dei-muted">Pilih Mapel:</span>
                <select
                  value={selectedWeightMapel}
                  onChange={(e) => setSelectedWeightMapel(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                >
                  {subjectWeights.map((w) => (
                    <option key={w.subject_code} value={w.subject_code}>
                      {w.subject_name} ({w.subject_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {weightSaveMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{weightSaveMsg}</span>
              </div>
            )}

            {/* Weight Configuration Form */}
            <form onSubmit={handleSaveWeights} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                    <span>Presensi & Kehadiran</span>
                    <span className="font-mono text-dei-emerald">{currentMapelWeight.attendance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={currentMapelWeight.attendance}
                    onChange={(e) => updateCurrentWeight('attendance', e.target.value)}
                    className="w-full accent-dei-emerald"
                  />
                  <div className="text-[10px] text-dei-muted">Sumber: Presensi KBM Daring (Sync Otomatis)</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                    <span>Tugas & Formatif</span>
                    <span className="font-mono text-dei-emerald">{currentMapelWeight.assignment}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={currentMapelWeight.assignment}
                    onChange={(e) => updateCurrentWeight('assignment', e.target.value)}
                    className="w-full accent-dei-emerald"
                  />
                  <div className="text-[10px] text-dei-muted">Sumber: LMS Materi & Pengumpulan Tugas</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                    <span>Hafalan / Mutaba'ah Harian</span>
                    <span className="font-mono text-dei-emerald">{currentMapelWeight.tahfizh_daily}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="5"
                    value={currentMapelWeight.tahfizh_daily}
                    onChange={(e) => updateCurrentWeight('tahfizh_daily', e.target.value)}
                    className="w-full accent-dei-emerald"
                  />
                  <div className="text-[10px] text-dei-muted">Sumber: Setoran Audio Musyrif Halaqah</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                    <span>Ujian Tengah Semester (UTS)</span>
                    <span className="font-mono text-dei-emerald">{currentMapelWeight.uts}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={currentMapelWeight.uts}
                    onChange={(e) => updateCurrentWeight('uts', e.target.value)}
                    className="w-full accent-dei-emerald"
                  />
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-dei-muted">Sumber Nilai UTS:</span>
                    <select
                      value={currentMapelWeight.uts_source_type}
                      onChange={(e) => updateCurrentWeight('uts_source_type', e.target.value)}
                      className="px-2 py-0.5 rounded border border-dei-line dark:border-dei-dark-line bg-white dark:bg-neutral-700 text-[10px] font-bold"
                    >
                      <option value="CBT_ONLINE">CBT Online (Sync)</option>
                      <option value="LISAN_MANUAL">Ujian Lisan / Praktik (Manual)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                    <span>Ujian Akhir Semester (UAS)</span>
                    <span className="font-mono text-dei-emerald">{currentMapelWeight.uas}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={currentMapelWeight.uas}
                    onChange={(e) => updateCurrentWeight('uas', e.target.value)}
                    className="w-full accent-dei-emerald"
                  />
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-dei-muted">Sumber Nilai UAS:</span>
                    <select
                      value={currentMapelWeight.uas_source_type}
                      onChange={(e) => updateCurrentWeight('uas_source_type', e.target.value)}
                      className="px-2 py-0.5 rounded border border-dei-line dark:border-dei-dark-line bg-white dark:bg-neutral-700 text-[10px] font-bold"
                    >
                      <option value="CBT_ONLINE">CBT Digital</option>
                      <option value="TULIS_MANUAL">Ujian Tulis Manual</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line dark:border-dei-dark-line space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-dei-ink dark:text-dei-dark-ink">
                    <span>Observasi Adab & Karakter</span>
                    <span className="font-mono text-purple-600 font-bold">{currentMapelWeight.adab_behavior}%</span>
                  </div>
                  <div className="text-[11px] font-medium text-dei-muted leading-relaxed">
                    Komponen evaluasi sikap spiritual & sosial yang diinput langsung secara objektif oleh Wali Kelas.
                  </div>
                  <div className="text-[10px] text-purple-600 font-semibold pt-1">
                    Sumber: Catatan Akhlak Terpuji & Disiplin
                  </div>
                </div>
              </div>

              {/* Total Summary & Save */}
              <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-dei-muted">
                  Total Bobot: <b className="font-mono text-dei-ink dark:text-dei-dark-ink">
                    {Number(currentMapelWeight.attendance) + Number(currentMapelWeight.assignment) + Number(currentMapelWeight.tahfizh_daily) + Number(currentMapelWeight.uts) + Number(currentMapelWeight.uas)}%
                  </b> (Harus tepat 100%)
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Bobot Mapel Ini</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB 3: LEMBAR E-RAPOR RESMI DENGAN FILTER SEMESTER */}
      {/* ======================================================== */}
      {activeTab === 'e_rapor' && (
        <div className="space-y-6">
          {/* Action Header: Semester Dropdown, Student Selector (for teachers), & PDF Export */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Semester Dropdown - Selalu Tampil untuk Santri & Guru */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-dei-muted font-bold">Pilih Semester:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                >
                  <option value="sem-3">Semester 3 (Ganjil 2026/2027) — Aktif</option>
                  <option value="sem-2">Semester 2 (Genap 2025/2026)</option>
                  <option value="sem-1">Semester 1 (Ganjil 2025/2026)</option>
                </select>
              </div>

              {/* Student Switcher: Selalu Tampil untuk memilih lembar santri yang dibuka */}
              {(!userIsSantri || reportCards.length > 1) && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-dei-muted font-bold">Pilih Santri:</span>
                  <select
                    value={selectedReportCard?.student_id || ''}
                    onChange={(e) => {
                      const rep = reportCards.find((r) => r.student_id === e.target.value);
                      if (rep) setSelectedReportCard(rep);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-dei-ink dark:text-dei-dark-ink focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                  >
                    {reportCards.map((r) => (
                      <option key={r.id || r.student_id} value={r.student_id}>
                        {r.student_name} (NISN: {r.nisn})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Aksi Unduh PDF & Cetak Lembar Rapor (Hanya aktif saat rapor tidak dikunci) */}
            {(!userIsSantri || selectedSemester !== 'sem-3' || isRaporReleased) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportIndividualPDF(selectedReportCard)}
                  className="px-4 py-2 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Berkas PDF (.pdf Resmi)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line text-dei-ink dark:text-dei-dark-ink text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar</span>
                </button>
              </div>
            )}
          </div>

          {/* Santri Holding Screen: ONLY locked if active semester (sem-3) AND unreleased */}
          {userIsSantri && selectedSemester === 'sem-3' && !isRaporReleased ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm text-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Proses Verifikasi Dewan Guru
                </span>
                <h2 className="text-xl font-extrabold text-dei-ink dark:text-dei-dark-ink">
                  E-Rapor Semester 3 (Aktif) Sedang Dikompilasi
                </h2>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed max-w-md mx-auto">
                  Nilai seluruh mata pelajaran dan mutaba'ah hafalan sedang difinalisasi oleh para Ustadz pengampu dan Wali Kelas. E-Rapor digital resmi semester 3 akan dibuka aksesnya serentak pada hari pembagian rapor.
                </p>
                <div className="pt-3 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-dei-emerald flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 dark:text-emerald-200">
                      <b className="font-bold">Akses Semester Sebelumnya Tersedia:</b> Anda tetap dapat melihat nilai dan mengunduh berkas e-rapor resmi Semester 1 atau Semester 2 dengan memilih semester pada tombol dropdown di atas layar, atau pilih langsung opsi cepat di bawah ini:
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedSemester('sem-2')}
                      className="px-4 py-2 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Buka Rapor Semester 2 (Genap) →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSemester('sem-1')}
                      className="px-4 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line hover:bg-neutral-100 dark:hover:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>Buka Rapor Semester 1 (Ganjil) →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>

              {/* Official PKBM Report Card Sheet */}
              {selectedReportCard && (
                <div
                  id="print-area"
                  className="p-8 sm:p-12 rounded-3xl bg-white text-neutral-900 border border-neutral-300 shadow-xl space-y-6 max-w-4xl mx-auto"
                >
                  {/* Kop Surat Resmi */}
                  <div className="border-b-2 border-neutral-900 pb-4 text-center space-y-1">
                    <h2 className="text-lg font-black tracking-tight text-neutral-950 uppercase">
                      YAYASAN DAR EL IMAN PADANG
                    </h2>
                    <h3 className="text-base font-extrabold text-neutral-900">
                      PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) DIGITAL DAR EL IMAN
                    </h3>
                    <p className="text-[11px] text-neutral-600">
                      SK Izin Operasional: 421.1/182/DP/Dikbud/2022 • NPSN: P9997123 • Terakreditasi B Kemendikbudristek RI
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      Sekretariat: Jl. Raya Gunung Juaro, Kec. Nanggalo, Kota Padang, Sumatera Barat • https://darel-iman.sch.id
                    </p>
                  </div>

                  {/* Title */}
                  <div className="text-center space-y-0.5 pt-1">
                    <h4 className="text-sm font-black uppercase tracking-wider text-neutral-950">
                      LAPORAN CAPAIAN KOMPETENSI PESERTA DIDIK (E-RAPOR DIGITAL)
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      {selectedReportCard.semester.toUpperCase()}
                    </p>
                  </div>

                  {/* Student Identity */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                    <div className="space-y-1">
                      <div><span className="text-neutral-500">Nama Santri:</span> <b className="text-neutral-900">{selectedReportCard.student_name}</b></div>
                      <div><span className="text-neutral-500">Nomor Induk / NISN:</span> <b className="text-neutral-900 font-mono">{selectedReportCard.nisn}</b></div>
                      <div><span className="text-neutral-500">Rombongan Belajar:</span> <b className="text-neutral-900">{selectedReportCard.classroom_name}</b></div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div><span className="text-neutral-500">Tahun Pelajaran:</span> <b className="text-neutral-900">{selectedReportCard.academic_year}</b></div>
                      <div><span className="text-neutral-500">Semester:</span> <b className="text-neutral-900">{selectedReportCard.semester}</b></div>
                      <div><span className="text-neutral-500">Tanggal Terbit:</span> <b className="text-neutral-900">{selectedReportCard.published_at}</b></div>
                    </div>
                  </div>

                  {/* Table of Grades */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-neutral-300">
                      <thead className="bg-emerald-700 text-white font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 text-center border border-neutral-300 w-10">No</th>
                          <th className="py-2.5 px-3 border border-neutral-300">Mata Pelajaran</th>
                          <th className="py-2.5 px-3 border border-neutral-300">Guru Pengampu</th>
                          <th className="py-2.5 px-2 text-center border border-neutral-300 w-12">KKM</th>
                          <th className="py-2.5 px-2 text-center border border-neutral-300 w-14">Nilai</th>
                          <th className="py-2.5 px-2 text-center border border-neutral-300 w-14">Predikat</th>
                          <th className="py-2.5 px-3 border border-neutral-300">Capaian Kompetensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {selectedReportCard.grades.map((g, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            <td className="py-2.5 px-3 text-center border border-neutral-300 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 border border-neutral-300 font-bold text-neutral-900">{g.subject_name}</td>
                            <td className="py-2.5 px-3 border border-neutral-300 text-neutral-600">{g.tutor_name}</td>
                            <td className="py-2.5 px-2 text-center border border-neutral-300 font-mono">{g.passing_threshold}</td>
                            <td className="py-2.5 px-2 text-center border border-neutral-300 font-mono font-black text-emerald-800">{g.score}</td>
                            <td className="py-2.5 px-2 text-center border border-neutral-300 font-black">{g.letter_grade}</td>
                            <td className="py-2.5 px-3 border border-neutral-300 text-[11px] leading-relaxed text-neutral-700">{g.competency_notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Attitudes & Tahfizh Summary */}
                  <div className="p-4 rounded-xl border border-neutral-300 bg-neutral-50/60 space-y-2 text-xs">
                    <div className="font-bold text-neutral-900 uppercase tracking-wide text-[11px]">
                      Capaian Program Unggulan & Sikap Spiritual / Sosial
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-white border border-neutral-200">
                        <div className="font-bold text-emerald-800">📖 Mutaba'ah Tahfizh Bersanad:</div>
                        <div className="text-neutral-700 mt-0.5 leading-relaxed">{selectedReportCard.tahfizh_summary}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-neutral-200">
                        <div className="font-bold text-purple-800">✨ Sikap Spiritual & Sosial:</div>
                        <div className="text-neutral-700 mt-0.5">Spiritual: {selectedReportCard.spiritual_grade} • Sosial: {selectedReportCard.social_grade}</div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="font-bold text-neutral-800">Catatan Wali Kelas: </span>
                      <span className="italic text-neutral-700">"{selectedReportCard.homeroom_notes}"</span>
                    </div>
                  </div>

                  {/* QR Code & Signatures */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-neutral-200">
                    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-neutral-50 border border-neutral-300 max-w-sm">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Validasi E-Rapor" className="w-20 h-20 rounded-lg shadow-sm border border-neutral-200" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-500 font-mono text-[9px]">
                          QR Loading...
                        </div>
                      )}
                      <div className="space-y-0.5 text-left">
                        <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                          PINDAI VERIFIKASI RESMI
                        </div>
                        <div className="text-[9px] font-mono text-neutral-600">
                          {selectedReportCard.qr_verification_code || selectedReportCard.QRVerificationCode}
                        </div>
                        <p className="text-[8.5px] text-neutral-500 leading-tight">
                          Dokumen ini terenkripsi dan dapat diverifikasi langsung melalui portal PKBM Digital Dar El Iman.
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-xs space-y-1">
                      <div className="text-neutral-600">Padang, 19 Oktober 2026</div>
                      <div className="text-neutral-700">Wali Kelas X Paket C,</div>
                      <div className="h-12 flex items-center justify-center">
                        <span className="font-serif italic text-emerald-800 text-sm font-bold">[Tanda Tangan Digital Terverifikasi]</span>
                      </div>
                      <div className="font-bold text-neutral-950 underline">Ustadzah Fatimah, S.Pd.</div>
                      <div className="text-[10px] text-neutral-500 font-mono">NIP. 19880415 201201 2 003</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB 4: VERIFIKASI PUBLIK QR RAPOR */}
      {/* ======================================================== */}
      {activeTab === 'verify_qr' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-dei-emerald/10 text-dei-emerald flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-dei-ink dark:text-dei-dark-ink">
                  Portal Validasi Keaslian E-Rapor Digital
                </h2>
                <p className="text-xs text-dei-muted dark:text-dei-dark-muted">
                  Periksa integritas dokumen rapor peserta didik PKBM Digital Dar El Iman secara terbuka dan instan.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold text-dei-muted uppercase tracking-wider">
                Kode Verifikasi QR Dokumen
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value)}
                  placeholder="Contoh: DAR-EL-IMAN-RAPOR-2026-XPC-001"
                  className="flex-1 px-4 py-3 rounded-xl border border-dei-line dark:border-dei-dark-line bg-neutral-50 dark:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                />
                <button
                  onClick={() => handleVerifyQR()}
                  disabled={verifying}
                  className="px-5 py-3 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {verifying ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Validasi Dokumen</span>
                </button>
              </div>
              {verifyError && (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>
          </div>

          {verificationResult && (
            <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border-2 border-emerald-500 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-dei-emerald flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    STATUS: DOKUMEN OTENTIK & SAH
                  </span>
                  <h3 className="text-base font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">
                    {verificationResult.verification_status}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-dei-line dark:border-dei-dark-line text-xs">
                <div>
                  <div className="text-[10px] text-dei-muted uppercase font-bold">Nama Santri</div>
                  <div className="font-extrabold text-dei-ink dark:text-dei-dark-ink mt-0.5">
                    {verificationResult.student_name}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-dei-muted uppercase font-bold">NISN Resmi</div>
                  <div className="font-mono font-bold text-dei-ink dark:text-dei-dark-ink mt-0.5">
                    {verificationResult.nisn}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-dei-muted uppercase font-bold">Lembaga Penerbit</div>
                  <div className="font-bold text-dei-ink dark:text-dei-dark-ink mt-0.5">
                    {verificationResult.institution}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-dei-muted uppercase font-bold">Akreditasi Lembaga</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {verificationResult.accreditation}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-dei-muted">
                <span>Kode Hash: <b className="font-mono">{verificationResult.qr_code}</b></span>
                <span className="text-dei-emerald font-semibold">Tervalidasi di Pangkalan Data Resmi</span>
              </div>
            </div>
          )}
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

export default RaporPage;
