import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  FileCheck2,
  TrendingUp,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  PieChart,
  BarChart3,
  Layers,
  Building,
  Check,
  HelpCircle,
  BookOpen,
  DollarSign,
  HeartHandshake,
  GraduationCap
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/v1/quality';

export const MutuBscPage = () => {
  const [activeTab, setActiveTab] = useState('accreditation'); // 'accreditation' | 'bsc' | 'sop-risk'
  const [loading, setLoading] = useState(false);

  // Accreditation state
  const [accreditationData, setAccreditationData] = useState(null);

  // BSC state
  const [bscData, setBscData] = useState(null);

  // SOP & Risk state
  const [sops, setSops] = useState([]);
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [newRisk, setNewRisk] = useState({
    risk_title: '',
    category: 'OPERASIONAL',
    severity_level: 'MEDIUM',
    mitigation_plan: '',
    status: 'OPEN'
  });
  const [riskAddSuccess, setRiskAddSuccess] = useState('');

  useEffect(() => {
    fetchAccreditation();
    fetchBSC();
    fetchSOPs();
  }, []);

  const fetchAccreditation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/accreditation/checklist`);
      const data = await res.json();
      if (data.success) {
        setAccreditationData(data);
      }
    } catch (e) {
      console.error("Gagal load akreditasi", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBSC = async () => {
    try {
      const res = await fetch(`${API_BASE}/bsc/dashboard`);
      const data = await res.json();
      if (data.success) {
        setBscData(data);
      }
    } catch (e) {
      console.error("Gagal load BSC", e);
    }
  };

  const fetchSOPs = async () => {
    try {
      const res = await fetch(`${API_BASE}/sops`);
      const data = await res.json();
      if (data.success && data.data) {
        setSops(data.data);
      }
    } catch (e) {
      console.error("Gagal load SOP", e);
    }
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    if (!newRisk.risk_title) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/risks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRisk)
      });
      const data = await res.json();
      if (data.success) {
        setRiskAddSuccess("Alhamdulillah! Risiko mutu dan rencana mitigasi berhasil dicatat ke sistem.");
        setShowAddRiskModal(false);
        setNewRisk({
          risk_title: '',
          category: 'OPERASIONAL',
          severity_level: 'MEDIUM',
          mitigation_plan: '',
          status: 'OPEN'
        });
      }
    } catch (err) {
      alert("Kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner - Clean Emerald & Gold Theme */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <Award className="w-72 h-72" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Penjaminan Mutu Pendidikan & Akreditasi BAN-PDM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Standar Mutu Lembaga & Dashboard Kinerja
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
            Halaman ini memuat kesiapan akreditasi resmi BAN-PDM Kemendikbudristek (8 Standar Pendidikan Nasional), bukti fisik digital (eviden), dan ringkasan kesehatan operasional PKBM Digital Dar El Iman secara bersih dan transparan.
          </p>

          {accreditationData?.metrics && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2 font-bold text-white shadow-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Skor Kesiapan Akreditasi: <strong className="text-amber-300 font-mono text-sm">{accreditationData.metrics.simulated_score} / 4.00</strong></span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center gap-2 font-bold text-amber-300 shadow-sm">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Proyeksi Akreditasi: <strong>Grade A (Unggul)</strong></span>
              </span>
            </div>
          )}
        </div>
      </div>

      {riskAddSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{riskAddSuccess}</span>
          </div>
          <button onClick={() => setRiskAddSuccess('')} className="font-bold underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs - Emerald Active Accent */}
      <div className="flex flex-wrap items-center gap-2 border-b border-dei-line dark:border-dei-dark-line pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('accreditation')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'accreditation'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
              : 'text-dei-muted hover:text-dei-ink dark:hover:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>8 Standar Akreditasi BAN-PDM</span>
        </button>

        <button
          onClick={() => setActiveTab('bsc')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'bsc'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
              : 'text-dei-muted hover:text-dei-ink dark:hover:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Kinerja Lembaga (Balanced Scorecard)</span>
        </button>

        <button
          onClick={() => setActiveTab('sop-risk')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'sop-risk'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
              : 'text-dei-muted hover:text-dei-ink dark:hover:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Katalog SOP & Manajemen Risiko</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INSTRUMEN AKREDITASI BAN-PDM */}
      {/* ======================================================== */}
      {activeTab === 'accreditation' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Simple Explanation Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black text-emerald-800 dark:text-emerald-300 mb-1">
                Tentang Akreditasi BAN-PDM (Badan Akreditasi Nasional Pendidikan Anak Usia Dini, Dasar, & Menengah):
              </strong>
              <span>
                BAN-PDM adalah badan resmi pemerintah yang mengevaluasi kelayakan seluruh sekolah dan PKBM di Indonesia. PKBM Digital Dar El Iman mengimplementasikan 8 Standar Nasional Pendidikan (SNP) agar seluruh ijazah Paket A, B, dan C sah diakui untuk melanjutkan kuliah negeri/swasta maupun masuk dunia kerja.
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          {accreditationData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
                <span className="text-[11px] font-semibold text-dei-muted block">Standar Terpenuhi</span>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-between">
                  <span>8 / 8</span>
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">100% Standar Aktif</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
                <span className="text-[11px] font-semibold text-dei-muted block">Eviden Dokumen Sah</span>
                <div className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1 flex items-center justify-between">
                  <span>{accreditationData.metrics?.fulfilled_items || 32}</span>
                  <FileCheck2 className="w-7 h-7 text-teal-500" />
                </div>
                <span className="text-[10px] text-dei-muted block mt-1">Bukti Digital Tersedia</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
                <span className="text-[11px] font-semibold text-dei-muted block">Siap Audit Asesor</span>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center justify-between">
                  <span>{accreditationData.metrics?.ready_audit_items || 8}</span>
                  <Clock className="w-7 h-7 text-amber-500" />
                </div>
                <span className="text-[10px] text-amber-600 font-bold block mt-1">Penelaahan Lapangan</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
                <span className="text-[11px] font-semibold text-dei-muted block">Simulasi Skor Akhir</span>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-between">
                  <span>95.5</span>
                  <Award className="w-7 h-7 text-emerald-600" />
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Grade A (Unggul)</span>
              </div>
            </div>
          )}

          {/* 8 Standards Accordion */}
          {accreditationData && (
            <div className="space-y-3">
              {accreditationData.standards.map((std) => (
                <div
                  key={std.id}
                  className="rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line overflow-hidden shadow-sm"
                >
                  <div className="p-4 sm:p-5 flex items-center justify-between bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-dei-line dark:border-dei-dark-line">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                        {std.code}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                          {std.standard_name}
                        </h3>
                        <p className="text-xs text-dei-muted">{std.component_name}</p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Skor: 4.00 / 4.00
                    </span>
                  </div>

                  <div className="p-4 divide-y divide-dei-line dark:divide-dei-dark-line text-xs">
                    {std.items && std.items.map((item) => (
                      <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">Butir {item.item_number}:</span>
                            <span className="font-bold text-dei-ink dark:text-dei-dark-ink">{item.indicator_description}</span>
                          </div>
                          <p className="text-[11px] text-dei-muted">
                            Catatan Audit Internal: <i>"{item.notes}"</i>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.fulfillment_status === 'FULFILLED' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Terpenuhi
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
                              Siap Audit
                            </span>
                          )}

                          <a
                            href={item.evidence_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 text-[11px]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Lihat Eviden Dokumen</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: EXECUTIVE DASHBOARD BALANCED SCORECARD (BSC) */}
      {/* ======================================================== */}
      {activeTab === 'bsc' && bscData && (
        <div className="space-y-6 animate-in fade-in">
          {/* Simple Explanation Card */}
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-start gap-3 text-xs text-teal-900 dark:text-teal-200">
            <HelpCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black text-teal-800 dark:text-teal-300 mb-1">
                Tentang Balanced Scorecard (BSC):
              </strong>
              <span>
                Balanced Scorecard adalah metode manajemen modern untuk melihat keberhasilan sekolah dari 4 sisi seimbang: (1) Kesehatan Keuangan & SPP, (2) Kepuasan Santri & Wali Murid, (3) Efektivitas Belajar & Modul KBM Digital, serta (4) Peningkatan Mutu Asatidzah & Guru Pembimbing.
              </span>
            </div>
          </div>

          {/* Executive Overall Summary */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider block">
                  CAPAIAN KINERJA STRATEGIS PKBM DAR EL IMAN TA 2026/2027
                </span>
                <h2 className="text-xl font-black text-dei-ink dark:text-dei-dark-ink mt-0.5">
                  Indeks Kesehatan Lembaga: <span className="text-emerald-600 font-mono">{bscData.summary.overall_score}%</span>
                </h2>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {bscData.summary.evaluation_label}
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                Laporan untuk Dewan Pembina & Yayasan
              </div>
            </div>
          </div>

          {/* 4 Perspectives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(bscData.perspectives).map(([key, p]) => (
              <div
                key={key}
                className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-dei-line pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      {key === 'FINANCIAL' && <DollarSign className="w-4 h-4" />}
                      {key === 'CUSTOMER' && <HeartHandshake className="w-4 h-4" />}
                      {key === 'INTERNAL_PROCESS' && <BookOpen className="w-4 h-4" />}
                      {key === 'LEARNING_GROWTH' && <GraduationCap className="w-4 h-4" />}
                    </div>
                    <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                      {p.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800">
                    {p.achievement} Capaian
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {p.indicators.map((ind) => (
                    <div key={ind.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-dei-ink dark:text-dei-dark-ink">{ind.indicator_name}</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {ind.current_value} {ind.unit} / {ind.target_value} {ind.unit}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (ind.current_value / ind.target_value) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: KATALOG SOP & REGISTER RISIKO MUTU */}
      {/* ======================================================== */}
      {activeTab === 'sop-risk' && (
        <div className="space-y-6 animate-in fade-in">
          {/* SOP Repository */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Katalog Standar Operasional Prosedur (SOP) Resmi
            </h3>
            <p className="text-xs text-dei-muted">
              Dokumen acuan baku kerja untuk Ustadz, Tenaga Administrasi, dan Layanan Santri PKBM Digital Dar El Iman.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {sops.map((sop) => (
                <div
                  key={sop.id}
                  className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-dei-line space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] text-emerald-700 dark:text-emerald-400">{sop.code}</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-[10px] font-semibold">
                      v{sop.version}
                    </span>
                  </div>
                  <h4 className="font-bold text-dei-ink dark:text-dei-dark-ink text-xs line-clamp-2">
                    {sop.title}
                  </h4>
                  <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                    <span className="text-dei-muted">Divisi: {sop.department}</span>
                    <a
                      href={sop.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Buka Panduan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Registers Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Register Risiko Operasional & Mitigasi Pencegahan
                </h3>
                <p className="text-xs text-dei-muted">
                  Daftar potensi risiko teknis/akademik beserta rencana mitigasi terukur yang diterapkan lembaga.
                </p>
              </div>

              <button
                onClick={() => setShowAddRiskModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Risiko Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-dei-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b text-dei-muted font-bold">
                  <tr>
                    <th className="py-3 px-4">Judul Risiko</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Tingkat Dampak</th>
                    <th className="py-3 px-4">Rencana Mitigasi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dei-line text-dei-ink dark:text-dei-dark-ink">
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-bold max-w-xs">
                      Gangguan koneksi internet santri saat ujian CBT online
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">TEKNOLOGI</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600">MEDIUM</td>
                    <td className="py-3 px-4 text-[11px] text-dei-muted max-w-sm">
                      Sistem auto-save jawaban lokal per 5 detik dan penerbitan token ujian susulan.
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        TERMITIGASI
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-bold max-w-xs">
                      Kelengkapan berkas NIK/NISN santri diaspora untuk Dapodik
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">OPERASIONAL</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">HIGH</td>
                    <td className="py-3 px-4 text-[11px] text-dei-muted max-w-sm">
                      Pemeriksaan pra-submit formulir dan penerimaan surat keterangan dari KBRI/KJRI setempat.
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        TERMITIGASI
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-bold max-w-xs">
                      Keterlambatan pembayaran SPP santri mandiri
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold text-[10px]">KEUANGAN</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600">MEDIUM</td>
                    <td className="py-3 px-4 text-[11px] text-dei-muted max-w-sm">
                      Pengingat otomatis WhatsApp H-3 jatuh tempo dan rekomendasi skema Beasiswa Dhuafa.
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        TERBUKA (OPEN)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IDENTIFIKASI RISIKO BARU */}
      {showAddRiskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dei-dark-surface rounded-3xl max-w-md w-full border border-dei-line shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-dei-ink">Catat Risiko Mutu Baru</h3>
              <button onClick={() => setShowAddRiskModal(false)} className="text-dei-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Judul Risiko / Potensi Kendala:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Keterlambatan pengiriman ijazah fisik santri diaspora"
                  value={newRisk.risk_title}
                  onChange={(e) => setNewRisk({ ...newRisk, risk_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Kategori:</label>
                  <select
                    value={newRisk.category}
                    onChange={(e) => setNewRisk({ ...newRisk, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none font-semibold"
                  >
                    <option value="OPERASIONAL">Operasional</option>
                    <option value="TEKNOLOGI">Teknologi & Server</option>
                    <option value="KEUANGAN">Keuangan & SPP</option>
                    <option value="REPUTASI">Reputasi & Layanan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Tingkat Dampak:</label>
                  <select
                    value={newRisk.severity_level}
                    onChange={(e) => setNewRisk({ ...newRisk, severity_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none font-semibold"
                  >
                    <option value="LOW">Rendah (Low)</option>
                    <option value="MEDIUM">Sedang (Medium)</option>
                    <option value="HIGH">Tinggi (High)</option>
                    <option value="CRITICAL">Kritis (Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Rencana Mitigasi / Penanganan:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Langkah nyata antisipasi dan pencegahan yang disiapkan lembaga..."
                  value={newRisk.mitigation_plan}
                  onChange={(e) => setNewRisk({ ...newRisk, mitigation_plan: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dei-bg border outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRiskModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 shadow-sm"
                >
                  Simpan Risiko
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MutuBscPage;
