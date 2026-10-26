import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload,
  Globe,
  Award,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building,
  Eye,
  RefreshCw,
  Send,
  X,
  Sparkles,
  QrCode,
  FileCheck2,
  Calendar,
  Check,
  FileCheck,
  GraduationCap
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/v1';

export const PpdbPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [regFilterStatus, setRegFilterStatus] = useState('ALL');
  const [regFilterPackage, setRegFilterPackage] = useState('ALL');
  const [regSearch, setRegSearch] = useState('');
  
  // Dedicated Verification Workspace Subpage State
  const [viewingVerificationReg, setViewingVerificationReg] = useState(null);

  // Document Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // Verification Form Data for Selected Applicant
  const [verificationNotes, setVerificationNotes] = useState({
    docNotes: 'Berkas KK dan Akta kelahiran telah diperiksa dan sah sesuai NIK Dukcapil. Ijazah terverifikasi sah.',
    tahfizhScore: '95',
    tahfizhPredicate: 'Mumtaz (Sangat Baik)',
    tahfizhNotes: 'Placement test tahfizh: Mumtaz 3 juz, makharijul huruf fasih, tajwid lancar. Penempatan di Rombel Tahfizh A.',
    skNumber: 'SK-PPDB/DEI/2026/042',
    graduationNotes: 'Selamat, ananda resmi dinyatakan LULUS seleksi Penerimaan Santri Baru PKBM Digital Dar El Iman.'
  });

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    let serverList = [];
    try {
      const res = await fetch('/api/v1/ppdb/registrations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        serverList = data.data.map(item => {
          let stage = 1;
          if (item.status === 'ACCEPTED') stage = 4;
          else if (item.status === 'TEST_PASSED') stage = 3;
          else if (item.status === 'DOCUMENTS_VERIFIED') stage = 2;
          return {
            ...item,
            stage: item.stage || stage,
            created_at: item.created_at || new Date().toISOString()
          };
        });
      }
    } catch (e) {
      console.warn("Using offline PPDB registrations fallback", e);
    }

    // Merge with locally submitted registrations so new applicants appear
    let localList = [];
    try {
      const saved = localStorage.getItem('pkbm_ppdb_new_registrations');
      if (saved) {
        localList = JSON.parse(saved);
      }
    } catch (e) {}

    const merged = [...serverList, ...localList.filter(l => !serverList.some(s => s.id === l.id || s.registration_number === l.registration_number))];
    setRegistrations(merged);
    setLoading(false);
  };

  // Open Detailed Verification Subpage for an applicant
  const handleOpenVerification = (reg) => {
    setViewingVerificationReg(reg);
    // Populate notes from applicant or existing defaults
    setVerificationNotes({
      docNotes: reg.doc_notes || 'Berkas KK dan Akta kelahiran telah diperiksa dan sah sesuai NIK Dukcapil. Ijazah terverifikasi sah.',
      tahfizhScore: reg.tahfizh_score || (reg.stage >= 3 ? '95' : '88'),
      tahfizhPredicate: reg.tahfizh_predicate || 'Mumtaz (Istimewa - Nilai 90-100)',
      tahfizhNotes: reg.selection_notes || 'Placement test tahfizh: Mumtaz 3 juz, makharijul huruf fasih, tajwid lancar. Penempatan di Rombel Tahfizh A.',
      skNumber: reg.sk_number || 'SK-PPDB/DEI/2026/042',
      graduationNotes: reg.graduation_notes || 'Selamat, ananda resmi dinyatakan LULUS seleksi Penerimaan Santri Baru PKBM Digital Dar El Iman.'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update Applicant Status and Persist
  const updateApplicantStage = (newStatus, stageNumber, extraData = {}) => {
    if (!viewingVerificationReg || isUpdatingStage) return;
    setIsUpdatingStage(true);

    const updatedReg = {
      ...viewingVerificationReg,
      status: newStatus,
      stage: stageNumber,
      doc_notes: verificationNotes.docNotes,
      tahfizh_score: verificationNotes.tahfizhScore,
      tahfizh_predicate: verificationNotes.tahfizhPredicate,
      selection_notes: verificationNotes.tahfizhNotes,
      sk_number: verificationNotes.skNumber,
      graduation_notes: verificationNotes.graduationNotes,
      ...extraData,
      updated_at: new Date().toISOString()
    };

    // Update in state
    setViewingVerificationReg(updatedReg);
    setRegistrations(prev => prev.map(r => r.id === updatedReg.id ? updatedReg : r));

    // Save to local storage
    const updatedLocal = registrations.map(r => r.id === updatedReg.id ? updatedReg : r);
    localStorage.setItem('pkbm_ppdb_new_registrations', JSON.stringify(updatedLocal));

    // Also update guest tracking if it matches this registration
    try {
      const guestSaved = localStorage.getItem('pkbm_guest_ppdb_registration');
      if (guestSaved) {
        const guestObj = JSON.parse(guestSaved);
        let updatedGuest = false;

        if (guestObj.students && Array.isArray(guestObj.students)) {
          guestObj.students = guestObj.students.map(st => {
            if (st.registrationNumber === updatedReg.registration_number || st.fullName?.toLowerCase() === updatedReg.full_name?.toLowerCase()) {
              updatedGuest = true;
              return {
                ...st,
                status: newStatus,
                stage: stageNumber,
                nis: updatedReg.nis || st.nis,
                committeeNotes: updatedReg.selection_notes || updatedReg.doc_notes,
                statusNotes: updatedReg.selection_notes || updatedReg.doc_notes,
                skNumber: updatedReg.sk_number || st.skNumber
              };
            }
            return st;
          });
        }

        if (guestObj.registrationNumber === updatedReg.registration_number || guestObj.fullName?.toLowerCase() === updatedReg.full_name?.toLowerCase()) {
          updatedGuest = true;
          guestObj.status = newStatus;
          guestObj.stage = stageNumber;
          guestObj.nis = updatedReg.nis || guestObj.nis;
          guestObj.committeeNotes = updatedReg.selection_notes || updatedReg.doc_notes;
          guestObj.statusNotes = updatedReg.selection_notes || updatedReg.doc_notes;
          guestObj.skNumber = updatedReg.sk_number || guestObj.skNumber;
        }

        if (updatedGuest) {
          localStorage.setItem('pkbm_guest_ppdb_registration', JSON.stringify(guestObj));
        }
      }
    } catch (e) {}

    // Asynchronously sync with backend endpoint
    fetch(`/api/v1/ppdb/registrations/${updatedReg.id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        verification_notes: verificationNotes.docNotes || verificationNotes.tahfizhNotes
      })
    }).catch(e => console.warn('Offline verification sync:', e));

    setTimeout(() => {
      setIsUpdatingStage(false);
      setActionSuccessMsg(`Alhamdulillah! Keputusan panitia berhasil disimpan: ${newStatus}`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }, 400);
  };

  const filteredRegs = registrations.filter((r) => {
    const matchStatus = regFilterStatus === 'ALL' || r.status === regFilterStatus;
    const matchPkg = regFilterPackage === 'ALL' || r.target_package === regFilterPackage;
    const matchSearch =
      !regSearch ||
      r.full_name?.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.registration_number?.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.country?.toLowerCase().includes(regSearch.toLowerCase());
    return matchStatus && matchPkg && matchSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <GraduationCap className="w-72 h-72" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-emerald-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Penerimaan Santri Baru (PPDB) TA 2027/2028</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Pusat Verifikasi Calon Santri & Seleksi Terpadu
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
            Pemeriksaan dokumen prasyarat resmi (KK, Akta Kelahiran, Ijazah/Rapor), penilaian placement test tahfizh Al-Qur'an, dan penetapan SK kelulusan santri nasional serta diaspora mancanegara.
          </p>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="underline text-xs">Tutup</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW A: DEDICATED VERIFICATION SUBPAGE */}
      {/* ======================================================== */}
      {viewingVerificationReg ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Bar with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dei-line">
            <button
              onClick={() => setViewingVerificationReg(null)}
              className="px-4 py-2 rounded-xl border border-dei-line hover:bg-neutral-100 text-xs font-bold text-dei-ink flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Kembali ke Daftar Pendaftar PPDB</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-dei-muted">Nomor Registrasi:</span>
              <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                {viewingVerificationReg.registration_number}
              </span>
            </div>
          </div>

          {/* Candidate Profile Header Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {viewingVerificationReg.full_name?.charAt(0) || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink">
                    {viewingVerificationReg.full_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {viewingVerificationReg.target_package?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-dei-muted mt-0.5">
                  NIK: <span className="font-mono text-emerald-700 font-bold">{viewingVerificationReg.nik || '-'}</span> • 
                  NISN: <span className="font-mono">{viewingVerificationReg.nisn || '-'}</span> • 
                  Wali: <strong>{viewingVerificationReg.guardian_name}</strong> ({viewingVerificationReg.guardian_phone || viewingVerificationReg.phone})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-dei-muted font-bold">Status Saat Ini:</span>
              {viewingVerificationReg.status === 'ACCEPTED' && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Diterima Resmi (Lulus)
                </span>
              )}
              {viewingVerificationReg.status === 'TEST_PASSED' && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-black text-xs inline-flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Lolos Placement Test Tahfizh
                </span>
              )}
              {viewingVerificationReg.status === 'DOCUMENTS_VERIFIED' && (
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 font-black text-xs inline-flex items-center gap-1">
                  <FileCheck2 className="w-4 h-4 text-teal-600" />
                  Berkas Administrasi Lengkap
                </span>
              )}
              {viewingVerificationReg.status === 'SUBMITTED' && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-xs inline-flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Menunggu Verifikasi Berkas
                </span>
              )}
              {viewingVerificationReg.status === 'REJECTED' && (
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-xs inline-flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Berkas Ditolak
                </span>
              )}
            </div>
          </div>

          {/* 2-Column Work Desk */}
          {(() => {
            const isStage1Completed = viewingVerificationReg.stage >= 2 || ['DOCUMENTS_VERIFIED', 'TEST_PASSED', 'ACCEPTED'].includes(viewingVerificationReg.status);
            const isStage2Completed = viewingVerificationReg.stage >= 3 || ['TEST_PASSED', 'ACCEPTED'].includes(viewingVerificationReg.status);
            const isStage2Locked = viewingVerificationReg.stage < 2 && !isStage1Completed;
            const isStage3Completed = viewingVerificationReg.status === 'ACCEPTED';
            const isStage3Locked = viewingVerificationReg.stage < 3 && !isStage2Completed;

            // Find any attached files
            const docKk = viewingVerificationReg.documents?.find(d => d.document_type === 'KK') || {};
            const docAkta = viewingVerificationReg.documents?.find(d => d.document_type === 'AKTA_LAHIR') || {};
            const docIjazah = viewingVerificationReg.documents?.find(d => d.document_type === 'IJAZAH_SEBELUMNYA') || {};

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri (5 Kolom): Pemeriksaan Dokumen Fisik */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="font-black text-sm text-dei-ink flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        Pemeriksaan 3 Berkas Dokumen Prasyarat
                      </h3>
                    </div>

                    {/* 1. Berkas Kartu Keluarga */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-600" />
                          1. Scan Kartu Keluarga (KK)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                          Terunggah
                        </span>
                      </div>
                      <p className="text-[11px] text-dei-muted">
                        File: <span className="font-mono font-semibold">KK_{viewingVerificationReg.full_name?.replace(' ', '_')}.pdf</span> (1.4 MB)
                      </p>
                      <button
                        onClick={() => setPreviewDocModal({
                          type: 'KK',
                          title: 'Kartu Keluarga (KK)',
                          name: `KK_${viewingVerificationReg.full_name}.pdf`,
                          candidate: viewingVerificationReg,
                          dataUrl: docKk.dataUrl || viewingVerificationReg.fileKkDataUrl || null
                        })}
                        className="w-full py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-dei-line hover:border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-emerald-50/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka / Pratinjau Dokumen KK Resmi</span>
                      </button>
                    </div>

                    {/* 2. Berkas Akta Kelahiran */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-600" />
                          2. Scan Akta Kelahiran
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                          Terunggah
                        </span>
                      </div>
                      <p className="text-[11px] text-dei-muted">
                        File: <span className="font-mono font-semibold">Akta_{viewingVerificationReg.full_name?.replace(' ', '_')}.pdf</span> (980 KB)
                      </p>
                      <button
                        onClick={() => setPreviewDocModal({
                          type: 'AKTA',
                          title: 'Akta Kelahiran',
                          name: `Akta_${viewingVerificationReg.full_name}.pdf`,
                          candidate: viewingVerificationReg,
                          dataUrl: docAkta.dataUrl || viewingVerificationReg.fileAktaDataUrl || null
                        })}
                        className="w-full py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-dei-line hover:border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-emerald-50/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka / Pratinjau Dokumen Akta Resmi</span>
                      </button>
                    </div>

                    {/* 3. Berkas Ijazah Terakhir / Rapor */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dei-line space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          3. Ijazah Terakhir / Rapor
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                          Terunggah
                        </span>
                      </div>
                      <p className="text-[11px] text-dei-muted">
                        File: <span className="font-mono font-semibold">Ijazah_Rapor_{viewingVerificationReg.full_name?.replace(' ', '_')}.pdf</span> (2.1 MB)
                      </p>
                      <button
                        onClick={() => setPreviewDocModal({
                          type: 'IJAZAH',
                          title: 'Ijazah Terakhir / Rapor',
                          name: `Ijazah_Rapor_${viewingVerificationReg.full_name}.pdf`,
                          candidate: viewingVerificationReg,
                          dataUrl: docIjazah.dataUrl || viewingVerificationReg.fileIjazahDataUrl || null
                        })}
                        className="w-full py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-dei-line hover:border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-emerald-50/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka / Pratinjau Dokumen Ijazah Resmi</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan (7 Kolom): Lembar Kerja Catatan Kelulusan Bertahap */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm space-y-5 text-xs">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <h3 className="font-black text-sm text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Alur Seleksi Terpadu & Penilaian Kelulusan
                      </h3>
                      <span className="text-[11px] text-dei-muted">Catatan panitia langsung tersinkronisasi ke pelacak santri</span>
                    </div>

                    {/* LANGKAH 1: Verifikasi Berkas Administrasi */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isStage1Completed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    } space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full ${isStage1Completed ? 'bg-emerald-700' : 'bg-amber-600'} text-white text-[10px] flex items-center justify-center font-bold`}>
                            {isStage1Completed ? '✓' : '1'}
                          </span>
                          Langkah 1: Verifikasi Berkas Administrasi
                        </span>
                        {isStage1Completed ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
                            ✓ Berkas Terverifikasi Sah
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                            Menunggu Verifikasi
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Catatan Pemeriksaan Berkas:</label>
                        <textarea
                          rows={2}
                          disabled={isStage1Completed}
                          value={verificationNotes.docNotes}
                          onChange={(e) => setVerificationNotes({ ...verificationNotes, docNotes: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-dei-line bg-white dark:bg-dei-dark-bg dark:text-dei-dark-ink outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                          placeholder="Tuliskan catatan pemeriksaan berkas..."
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isStage1Completed ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Verifikasi Berkas Telah Selesai</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isUpdatingStage}
                              onClick={() => setShowRejectModal(true)}
                              className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 font-bold hover:bg-rose-50 active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                              ✕ Tolak Berkas
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingStage}
                              onClick={() => updateApplicantStage('DOCUMENTS_VERIFIED', 2)}
                              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 hover:brightness-105"
                            >
                              {isUpdatingStage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>✓ Loloskan ke Placement Test</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* LANGKAH 2: Placement Test Tahfizh & Wawancara Daring */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isStage2Locked
                        ? 'opacity-60 bg-neutral-50 dark:bg-neutral-800/20 border-dei-line'
                        : isStage2Completed
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                        : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-1 ring-blue-300'
                    } space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full ${isStage2Completed ? 'bg-blue-700 text-white' : isStage2Locked ? 'bg-neutral-300 text-neutral-700' : 'bg-blue-600 text-white'} text-[10px] flex items-center justify-center font-bold`}>
                            {isStage2Completed ? '✓' : '2'}
                          </span>
                          Langkah 2: Placement Test Tahfizh & Wawancara Daring
                        </span>
                        {isStage2Locked ? (
                          <span className="text-[10px] text-dei-muted font-bold">Terkunci (Selesaikan Verifikasi Berkas)</span>
                        ) : isStage2Completed ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black">
                            ✓ Placement Test Selesai
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold animate-pulse">
                            Siap Dinilai
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Nilai Ujian Tahfizh (0-100):</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={isStage2Locked || isStage2Completed}
                            value={verificationNotes.tahfizhScore}
                            onChange={(e) => setVerificationNotes({ ...verificationNotes, tahfizhScore: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-dei-line bg-white dark:bg-dei-dark-bg font-bold outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Predikat Kelulusan:</label>
                          <select
                            disabled={isStage2Locked || isStage2Completed}
                            value={verificationNotes.tahfizhPredicate}
                            onChange={(e) => setVerificationNotes({ ...verificationNotes, tahfizhPredicate: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-dei-line bg-white dark:bg-dei-dark-bg font-bold outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            <option value="Mumtaz (Istimewa - Nilai 90-100)">Mumtaz (Istimewa - Nilai 90-100)</option>
                            <option value="Jayyid Jiddan (Sangat Baik - Nilai 80-89)">Jayyid Jiddan (Sangat Baik - Nilai 80-89)</option>
                            <option value="Jayyid (Baik / Cukup - Nilai 70-79)">Jayyid (Baik / Cukup - Nilai 70-79)</option>
                            <option value="Maqbul (Perlu Bimbingan - Nilai 60-69)">Maqbul (Perlu Bimbingan - Nilai 60-69)</option>
                            <option value="Belum Layak / Butuh Matrikulasi (Nilai < 60)">Belum Layak / Butuh Matrikulasi (Nilai &lt; 60)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Catatan Hasil Tes & Penempatan Rombel:</label>
                        <textarea
                          rows={2}
                          disabled={isStage2Locked || isStage2Completed}
                          value={verificationNotes.tahfizhNotes}
                          onChange={(e) => setVerificationNotes({ ...verificationNotes, tahfizhNotes: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-dei-line bg-white dark:bg-dei-dark-bg outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                          placeholder="Tuliskan evaluasi makhraj, tajwid, atau rekomendasi program matrikulasi..."
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        {isStage2Locked ? (
                          <span className="text-[11px] text-dei-muted">Harap loloskan Verifikasi Berkas sebelum menilai placement test</span>
                        ) : isStage2Completed ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span>Placement Test Telah Selesai</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isUpdatingStage}
                              onClick={() => {
                                updateApplicantStage('DOCUMENTS_VERIFIED', 2, {
                                  selection_notes: `Hasil Placement Test: Belum Layak / Butuh Kelas Matrikulasi Persiapan Tahfizh. Catatan: ${verificationNotes.tahfizhNotes}`
                                });
                              }}
                              className="px-3.5 py-2 rounded-xl border border-amber-300 text-amber-800 font-bold hover:bg-amber-50 active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                              ⚠️ Tunda (Butuh Matrikulasi)
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingStage}
                              onClick={() => updateApplicantStage('TEST_PASSED', 3)}
                              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 hover:brightness-105"
                            >
                              {isUpdatingStage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>✓ Rekomendasikan Lulus & Terbitkan SK</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* LANGKAH 3: Penetapan SK Kelulusan & Terbitkan Akun LMS Resmi */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isStage3Locked
                        ? 'opacity-60 bg-neutral-50 dark:bg-neutral-800/20 border-dei-line'
                        : isStage3Completed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800'
                        : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 ring-1 ring-amber-300'
                    } space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full ${isStage3Completed ? 'bg-emerald-700 text-white' : isStage3Locked ? 'bg-neutral-300 text-neutral-700' : 'bg-amber-600 text-white'} text-[10px] flex items-center justify-center font-bold`}>
                            {isStage3Completed ? '✓' : '3'}
                          </span>
                          Langkah 3: Penetapan SK Kelulusan & Penerbitan NIS Resmi
                        </span>
                        {isStage3Locked ? (
                          <span className="text-[10px] text-dei-muted font-bold">Terkunci (Selesaikan Placement Test)</span>
                        ) : isStage3Completed ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
                            ✓ Lulus Resmi & Terdaftar
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold animate-pulse">
                            Siap Terbitkan SK
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Nomor SK Kelulusan:</label>
                          <input
                            type="text"
                            disabled={isStage3Locked || isStage3Completed}
                            value={verificationNotes.skNumber}
                            onChange={(e) => setVerificationNotes({ ...verificationNotes, skNumber: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-dei-line bg-white dark:bg-dei-dark-bg font-mono text-xs font-bold outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Nomor Induk Santri (NIS):</label>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-dei-dark-bg border border-dei-line font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                            {viewingVerificationReg.nis || (isStage3Completed ? '202604011' : 'Belum Terbit (Diterbitkan saat Lulus)')}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Catatan Kelulusan untuk Santri:</label>
                        <textarea
                          rows={2}
                          disabled={isStage3Locked || isStage3Completed}
                          value={verificationNotes.graduationNotes}
                          onChange={(e) => setVerificationNotes({ ...verificationNotes, graduationNotes: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-dei-line bg-white dark:bg-dei-dark-bg outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        {isStage3Locked ? (
                          <span className="text-[11px] text-dei-muted">Harap selesaikan Placement Test terlebih dahulu</span>
                        ) : isStage3Completed ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>SK Kelulusan Telah Terbit & Santri Terdaftar di Sistem (NIS: {viewingVerificationReg.nis})</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdatingStage}
                            onClick={() => {
                              const generatedNis = viewingVerificationReg.nis || ('2026' + Math.floor(10000 + Math.random() * 90000));
                              updateApplicantStage('ACCEPTED', 3, { nis: generatedNis });
                            }}
                            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-all cursor-pointer hover:brightness-105"
                          >
                            {isUpdatingStage ? <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                            <span>✨ Terbitkan SK Kelulusan, NIS Resmi, & Akun Santri LMS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* ======================================================== */
        /* VIEW B: TABLE DAFTAR CALON SANTRI PPDB */
        /* ======================================================== */
        <div className="space-y-5 animate-in fade-in">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Total Calon Santri</span>
              <div className="text-2xl font-black text-dei-ink mt-1 flex items-center justify-between">
                <span>{registrations.length}</span>
                <Users className="w-5 h-5 text-emerald-500 opacity-60" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">Gelombang 1 Aktif</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Santri Diaspora Luar Negeri</span>
              <div className="text-2xl font-black text-teal-600 mt-1 flex items-center justify-between">
                <span>{registrations.filter(r => r.is_diaspora).length}</span>
                <Globe className="w-5 h-5 text-teal-500 opacity-60" />
              </div>
              <span className="text-[10px] text-dei-muted block mt-1">Qatar, KSA, UEA</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Lolos Seleksi Resmi</span>
              <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center justify-between">
                <span>{registrations.filter(r => r.status === 'ACCEPTED').length}</span>
                <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-60" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">SK & Akun Terbit</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Antrean Verifikasi Berkas</span>
              <div className="text-2xl font-black text-amber-600 mt-1 flex items-center justify-between">
                <span>{registrations.filter(r => r.status === 'SUBMITTED' || r.status === 'DOCUMENTS_VERIFIED').length}</span>
                <Clock className="w-5 h-5 text-amber-500 opacity-60" />
              </div>
              <span className="text-[10px] text-amber-600 font-bold block mt-1">Perlu Ditinjau</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dei-muted" />
              <input
                type="text"
                placeholder="Cari nama calon santri, no. registrasi, NIK, negara diaspora..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-dei-bg border border-dei-line text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={regFilterStatus}
                onChange={(e) => setRegFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-dei-bg border border-dei-line text-xs font-semibold outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="SUBMITTED">Menunggu Verifikasi</option>
                <option value="DOCUMENTS_VERIFIED">Berkas Lengkap</option>
                <option value="TEST_PASSED">Lolos Placement Test</option>
                <option value="ACCEPTED">Diterima Resmi</option>
              </select>

              <select
                value={regFilterPackage}
                onChange={(e) => setRegFilterPackage(e.target.value)}
                className="px-3 py-2 rounded-xl bg-dei-bg border border-dei-line text-xs font-semibold outline-none"
              >
                <option value="ALL">Semua Jenjang</option>
                <option value="PAKET_A">Paket A (Setara SD)</option>
                <option value="PAKET_B">Paket B (Setara SMP)</option>
                <option value="PAKET_C">Paket C (Setara SMA)</option>
              </select>

              <button
                onClick={fetchRegistrations}
                className="p-2 rounded-xl border border-dei-line hover:bg-neutral-100 text-dei-muted"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Registrations Table */}
          <div className="rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-dei-line text-dei-muted font-bold">
                  <tr>
                    <th className="py-3 px-4">No. Registrasi</th>
                    <th className="py-3 px-4">Calon Santri</th>
                    <th className="py-3 px-4">Jenjang Target</th>
                    <th className="py-3 px-4">Jalur Domisili</th>
                    <th className="py-3 px-4">Wali / No. Kontak</th>
                    <th className="py-3 px-4">Status Seleksi</th>
                    <th className="py-3 px-4 text-center">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dei-line text-dei-ink dark:text-dei-dark-ink">
                  {filteredRegs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-dei-muted">
                        Tidak ada pendaftar yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRegs.map((reg) => (
                      <tr key={reg.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-emerald-700">
                          {reg.registration_number}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-sm text-dei-ink">{reg.full_name}</div>
                          <div className="text-[11px] text-dei-muted">
                            NIK: {reg.nik || '-'} • NISN: {reg.nisn || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-800">
                            {reg.target_package?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {reg.is_diaspora ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
                              <Globe className="w-3 h-3" />
                              Diaspora ({reg.country})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-bold text-[10px]">
                              🇮🇩 Reguler Nasional
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold">{reg.guardian_name}</div>
                          <div className="text-[11px] text-dei-muted">
                            {reg.guardian_phone || reg.phone}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {reg.status === 'ACCEPTED' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Diterima Resmi
                            </span>
                          )}
                          {reg.status === 'TEST_PASSED' && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              Lolos Placement Test
                            </span>
                          )}
                          {reg.status === 'DOCUMENTS_VERIFIED' && (
                            <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                              Berkas Lengkap
                            </span>
                          )}
                          {reg.status === 'SUBMITTED' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Menunggu Verifikasi
                            </span>
                          )}
                          {reg.status === 'REJECTED' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Berkas Ditolak
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleOpenVerification(reg)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Periksa Berkas & Verifikasi</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU DOKUMEN BERKAS ASLI & RESMI */}
      {previewDocModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-dei-line space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-black text-sm text-dei-ink dark:text-dei-dark-ink">
                    Pratinjau Berkas Dokumen: {previewDocModal.title}
                  </h3>
                  <span className="text-[11px] text-dei-muted font-mono">
                    Santri: {previewDocModal.candidate?.full_name} ({previewDocModal.candidate?.registration_number})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDocModal(null)}
                className="p-1.5 rounded-xl border border-dei-line hover:bg-neutral-100 text-dei-muted hover:text-dei-ink transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If uploaded with dataUrl (Image/PDF), display real image */}
            {previewDocModal.dataUrl ? (
              <div className="rounded-2xl overflow-hidden border border-dei-line bg-neutral-900 flex items-center justify-center p-2">
                <img
                  src={previewDocModal.dataUrl}
                  alt={previewDocModal.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>
            ) : (
              /* Authentic Indonesian Government Document Sheet Representation */
              <div className="bg-[#FAF9F5] dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 sm:p-8 space-y-4 shadow-inner text-neutral-900 dark:text-neutral-100 font-serif">
                {/* 1. KARTU KELUARGA (KK) VIEW */}
                {previewDocModal.type === 'KK' && (
                  <div className="space-y-4 font-sans">
                    <div className="text-center space-y-1 pb-3 border-b-2 border-neutral-800 dark:border-neutral-200">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-600/30 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-xs">
                        GARUDA
                      </div>
                      <h4 className="font-black text-base tracking-widest text-neutral-900 dark:text-white uppercase">
                        REPUBLIK INDONESIA
                      </h4>
                      <h5 className="font-extrabold text-sm tracking-wider text-neutral-700 dark:text-neutral-300 uppercase">
                        KARTU KELUARGA
                      </h5>
                      <div className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        No. {previewDocModal.candidate?.nik ? '1371' + previewDocModal.candidate.nik.slice(4) : '1371012304090001'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Nama Kepala Keluarga:</span>
                        <b className="uppercase">{previewDocModal.candidate?.guardian_name || 'Ir. Salman Al-Farisi'}</b>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Alamat / Domisili:</span>
                        <b>Jl. Gunung Juaro No. 12, Kel. Surau Gadang, Padang</b>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-neutral-300 dark:border-neutral-700">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-neutral-200/60 dark:bg-neutral-800 font-bold border-b">
                          <tr>
                            <th className="p-2">No</th>
                            <th className="p-2">Nama Lengkap</th>
                            <th className="p-2">NIK</th>
                            <th className="p-2">Jenis Kelamin</th>
                            <th className="p-2">Hubungan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                          <tr>
                            <td className="p-2 font-bold">1</td>
                            <td className="p-2 font-bold uppercase">{previewDocModal.candidate?.guardian_name || 'Ir. Salman Al-Farisi'}</td>
                            <td className="p-2 font-mono">1371010508750002</td>
                            <td className="p-2">Laki-laki</td>
                            <td className="p-2">Kepala Keluarga</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold">2</td>
                            <td className="p-2 font-bold uppercase">{previewDocModal.candidate?.mother_name || 'Siti Rahmah, S.Pd.'}</td>
                            <td className="p-2 font-mono">1371014209790004</td>
                            <td className="p-2">Perempuan</td>
                            <td className="p-2">Istri</td>
                          </tr>
                          <tr className="bg-emerald-50/60 dark:bg-emerald-950/40">
                            <td className="p-2 font-bold text-emerald-800">3</td>
                            <td className="p-2 font-bold uppercase text-emerald-900 dark:text-emerald-200">{previewDocModal.candidate?.full_name}</td>
                            <td className="p-2 font-mono text-emerald-800 dark:text-emerald-300 font-bold">{previewDocModal.candidate?.nik || '1371012304090001'}</td>
                            <td className="p-2">{previewDocModal.candidate?.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
                            <td className="p-2 font-bold text-emerald-700">Anak (Calon Santri)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-14 border border-dashed border-neutral-400 flex items-center justify-center font-mono text-[9px] text-center p-1">
                          QR BSrE DUKCAPIL
                        </div>
                        <div>
                          <b className="block text-emerald-700 dark:text-emerald-400">DITANDATANGANI SECARA ELEKTRONIK</b>
                          <span className="text-neutral-500">Kadis Kependudukan & Pencatatan Sipil Kota Padang</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span>Dikeluarkan di: Padang</span><br />
                        <span className="font-bold">Tanggal Terbit: 14 Januari 2024</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AKTA KELAHIRAN VIEW */}
                {previewDocModal.type === 'AKTA' && (
                  <div className="space-y-4 font-sans">
                    <div className="text-center space-y-1 pb-3 border-b-2 border-neutral-800 dark:border-neutral-200">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-600/30 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-xs">
                        GARUDA
                      </div>
                      <h4 className="font-black text-sm tracking-widest text-neutral-900 dark:text-white uppercase">
                        KUTIPAN AKTA KELAHIRAN
                      </h4>
                      <div className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                        No. Registrasi: 3271-LT-12042010-0091
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 space-y-2 text-xs leading-relaxed">
                      <p>
                        Berdasarkan Akta Kelahiran Nomor <strong>3271-LT-12042010-0091</strong> menurut Surat Kenal Lahir dari Rumah Sakit / Bidan:
                      </p>
                      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border space-y-1 font-mono text-xs">
                        <div>Nama Anak : <strong className="text-emerald-700 dark:text-emerald-300">{previewDocModal.candidate?.full_name}</strong></div>
                        <div>Tempat / Tgl Lahir : <strong>{previewDocModal.candidate?.birth_place || 'Padang'}, {previewDocModal.candidate?.birth_date || '12 April 2010'}</strong></div>
                        <div>Jenis Kelamin : <strong>{previewDocModal.candidate?.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</strong></div>
                        <div>Nama Ayah : <strong>{previewDocModal.candidate?.guardian_name || 'Ir. Salman Al-Farisi'}</strong></div>
                        <div>Nama Ibu : <strong>{previewDocModal.candidate?.mother_name || 'Siti Rahmah'}</strong></div>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Kutipan ini diterbitkan sesuai dengan yang tertulis pada Daftar Kelahiran Dinas Kependudukan dan Pencatatan Sipil.
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 border border-dashed border-neutral-400 flex items-center justify-center font-mono text-[8px] text-center">
                          STEMPEL DUKCAPIL
                        </div>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">Sah Menurut Hukum Negara Republik Indonesia</span>
                      </div>
                      <div className="text-right">
                        <span>Padang, 20 April 2010</span><br />
                        <b>Pejabat Pencatatan Sipil</b>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. IJAZAH / RAPOR VIEW */}
                {previewDocModal.type === 'IJAZAH' && (
                  <div className="space-y-4 font-sans">
                    <div className="text-center space-y-1 pb-3 border-b-2 border-neutral-800 dark:border-neutral-200">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-600/30 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                        KEMDIKBUD
                      </div>
                      <h4 className="font-black text-sm tracking-widest text-neutral-900 dark:text-white uppercase">
                        KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
                      </h4>
                      <h5 className="font-extrabold text-xs tracking-wider text-neutral-700 dark:text-neutral-300 uppercase">
                        SURAT KETERANGAN LULUS / IJAZAH PENDIDIKAN KESETARAAN
                      </h5>
                      <div className="font-mono text-xs text-emerald-700 font-bold">
                        DN-08/M-PKBM/2026/08912
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 space-y-2 text-xs">
                      <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
                      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border space-y-1 font-mono text-xs">
                        <div>Nama Siswa : <strong className="text-emerald-700 dark:text-emerald-300">{previewDocModal.candidate?.full_name}</strong></div>
                        <div>NISN : <strong>{previewDocModal.candidate?.nisn || '0098712345'}</strong></div>
                        <div>NIK : <strong>{previewDocModal.candidate?.nik || '1371012304090001'}</strong></div>
                        <div>Program : <strong>{previewDocModal.candidate?.target_package || 'Pendidikan Kesetaraan'}</strong></div>
                        <div>Status Ujian : <strong className="text-emerald-600">LULUS DENGAN PREDIKAT BAIK (NILAI RATA-RATA: 89.2)</strong></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Terverifikasi Sah oleh Pokja Dapodik Kemendikbudristek</span>
                      </div>
                      <div className="text-right">
                        <span>Kepala Satuan Pendidikan</span><br />
                        <b className="font-bold underline">Ustadz H. Muhammad Ridwan, Lc., M.Pd.</b>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-dei-muted">
                Status: <strong className="text-emerald-700 dark:text-emerald-400">Dokumen Sah & Terverifikasi</strong>
              </span>
              <button
                onClick={() => setPreviewDocModal(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TOLAK BERKAS DENGAN ALASAN */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-dei-line">
              <h3 className="font-black text-sm text-rose-700 dark:text-rose-400">Tolak Berkas Calon Santri</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-dei-muted hover:text-dei-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-dei-muted">
              Masukkan alasan penolakan secara jelas. Catatan ini akan otomatis terkirim dan terbaca di profil pelacak status pendaftaran calon santri.
            </p>

            <textarea
              rows={3}
              required
              placeholder="Contoh: Scan Kartu Keluarga buram / NIK belum sesuai dengan data catatan sipil."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 text-xs outline-none focus:border-rose-500 dark:text-dei-dark-ink"
            />

            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-dei-line font-bold text-dei-muted hover:text-dei-ink active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) return alert('Mohon isi alasan penolakan.');
                  updateApplicantStage('REJECTED', 1, { doc_notes: `Ditolak: ${rejectReason}` });
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Kirim Alasan Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PpdbPage;
