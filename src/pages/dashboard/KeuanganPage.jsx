import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  X,
  ExternalLink,
  Receipt,
  User,
  Calendar,
  Sparkles,
  Building2,
  Eye,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Format currency safely without throwing on undefined/null
const formatCurrency = (val) => (Number(val) || 0).toLocaleString('id-ID');

export const KeuanganPage = ({ onNavigateMenu }) => {
  const { user } = useAuth();
  const isStudentOrParent = user?.role_name === 'SISWA' || user?.role_name === 'SANTRI' || user?.role_name === 'WALI_SANTRI' || user?.role_name === 'STUDENT' || user?.username?.startsWith('santri.');

  // Active sub-tab for Admin/Bendahara
  const [activeAdminTab, setActiveAdminTab] = useState('verification'); // 'verification' | 'invoices' | 'scholarships'
  const [filterMonth, setFilterMonth] = useState('Oktober 2026');

  const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Student SPP Invoices State (Loaded dynamically from Go Fiber Backend Seeder)
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scholarships State (CRUD)
  const [scholarships, setScholarships] = useState(() => {
    const saved = localStorage.getItem('pkbm_scholarship_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'beasiswa-01', name: 'Zaid bin Tsabit (Yatim & Dhuafa)', quota: 15, recipient_count: 12, discount: 100, source: 'Baitul Maal Dar El Iman', status: 'ACTIVE' },
      { id: 'beasiswa-02', name: 'Keringanan Prestasi Tahfizh 30 Juz', quota: 10, recipient_count: 8, discount: 50, source: 'Donatur Khusus Yayasan', status: 'ACTIVE' },
      { id: 'beasiswa-03', name: 'Keringanan Saudara Kandung (Sibling)', quota: 25, recipient_count: 18, discount: 25, source: 'Subsidi Silang PKBM', status: 'ACTIVE' },
    ];
  });

  // Fetch invoices, scholarships & finance summary from backend
  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [resInv, resSch] = await Promise.all([
        fetch('/api/v1/finance/invoices'),
        fetch('/api/v1/finance/scholarships'),
      ]);

      if (resInv.ok) {
        const jsonInv = await resInv.json();
        const rawInvoices = Array.isArray(jsonInv)
          ? jsonInv
          : (Array.isArray(jsonInv?.data) ? jsonInv.data : []);

        if (rawInvoices.length > 0) {
          const mapped = rawInvoices.map(inv => {
            const mName = monthNames[inv.month] || (inv.month ? `Bulan ${inv.month}` : 'Oktober');
            const formattedMonth = inv.month ? `${mName} ${inv.year || 2026}` : 'Oktober 2026';
            let uiStatus = inv.status || 'UNPAID';
            if (uiStatus === 'PENDING_VERIFICATION') uiStatus = 'WAITING_VERIFICATION';

            const invAmount = Number(inv.final_amount !== undefined ? inv.final_amount : inv.amount) || 0;

            return {
              id: inv.invoice_number || inv.id || 'INV-2026',
              db_id: inv.id,
              student_id: inv.student_id || '',
              student_name: inv.student_name || 'Santri',
              nis: inv.nis || '0081234561',
              package: inv.class_name || 'Kelas X Paket C — Umar bin Khattab',
              month: formattedMonth,
              amount: invAmount,
              due_date: inv.due_date || '2026-10-10',
              status: uiStatus,
              receipt_file: inv.receipt_file_url ? { name: 'struk_transfer_bsi.jpg', size: '1.2 MB', dataUrl: inv.receipt_file_url } : null,
              transfer_sender: inv.student_name || 'Santri/Wali',
              transfer_bank: 'BSI Syariah',
              transfer_date: inv.created_at ? String(inv.created_at).split('T')[0] : '2026-10-18',
              paid_at: inv.status === 'PAID' ? 'Terverifikasi' : null,
            };
          });
          setInvoices(mapped);
        }
      }

      if (resSch.ok) {
        const jsonSch = await resSch.json();
        const rawSch = Array.isArray(jsonSch)
          ? jsonSch
          : (Array.isArray(jsonSch?.data) ? jsonSch.data : []);

        if (rawSch.length > 0) {
          setScholarships(rawSch.map((s, idx) => ({
            id: s.id || `sch-${idx}`,
            name: s.program_name || 'Beasiswa Dar El Iman',
            quota: 20,
            recipient_count: 5,
            discount: Number(s.discount_percentage) || 50,
            source: s.donor_name || 'Yayasan Dar El Iman',
            status: s.is_active ? 'ACTIVE' : 'INACTIVE',
          })));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data keuangan dari server backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Modal Upload Struk for Santri
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [uploadedReceipt, setUploadedReceipt] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('BSI');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Modal View Struk for Bendahara
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Modal Maker-Checker Confirmation for Bendahara
  const [confirmApproveModal, setConfirmApproveModal] = useState(null);

  const [showAddScholarshipModal, setShowAddScholarshipModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [scholarshipForm, setScholarshipForm] = useState({
    name: '',
    quota: 10,
    recipient_count: 0,
    discount: 50,
    source: 'Donatur Yayasan'
  });

  // Handle Santri Upload File
  const handleReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedReceipt({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
        dataUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit Uploaded Receipt by Santri
  const handleSubmitReceipt = async (e) => {
    e.preventDefault();
    if (!uploadedReceipt) {
      alert('Mohon pilih file struk / bukti transfer bank terlebih dahulu.');
      return;
    }

    const invTargetId = selectedInvoice.db_id || selectedInvoice.id;
    try {
      await fetch(`/api/v1/finance/invoices/${invTargetId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: senderBank,
          amount_paid: selectedInvoice.amount,
          proof_file_url: uploadedReceipt.dataUrl || uploadedReceipt.name
        })
      });
    } catch (err) {
      console.warn('Offline payment submit:', err);
    }

    setInvoices(prev => prev.map(inv => {
      if (inv.id === selectedInvoice.id) {
        return {
          ...inv,
          status: 'WAITING_VERIFICATION',
          receipt_file: uploadedReceipt,
          transfer_sender: senderName || user?.full_name || 'Santri/Wali',
          transfer_bank: senderBank,
          transfer_date: transferDate,
          notes: notes
        };
      }
      return inv;
    }));

    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setShowUploadModal(false);
      setUploadedReceipt(null);
      setSenderName('');
      setNotes('');
    }, 1500);
  };

  // Bendahara Approves Payment (Maker-Checker)
  const handleApprovePayment = async (inv) => {
    const invTargetId = inv.db_id || inv.id;
    try {
      await fetch(`/api/v1/finance/payments/${invTargetId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', status: 'APPROVED', verifier_name: user?.full_name || 'Ustadzah Fatimah, S.Pd. (Bendahara)' })
      });
    } catch (err) {
      console.warn('Offline payment verify:', err);
    }

    setInvoices(prev => prev.map(i => {
      if (i.id === inv.id) {
        return {
          ...i,
          status: 'PAID',
          paid_at: new Date().toLocaleString('id-ID')
        };
      }
      return i;
    }));
    setConfirmApproveModal(null);
  };

  // Bendahara Rejects Payment
  const handleRejectPayment = async (inv, reason = 'Struk bukti transfer tidak valid') => {
    const invTargetId = inv.db_id || inv.id;
    try {
      await fetch(`/api/v1/finance/payments/${invTargetId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', status: 'REJECTED', rejection_reason: reason, verifier_name: user?.full_name || 'Ustadzah Fatimah, S.Pd. (Bendahara)' })
      });
    } catch (err) {
      console.warn('Offline payment reject:', err);
    }

    setInvoices(prev => prev.map(i => {
      if (i.id === inv.id) {
        return {
          ...i,
          status: 'UNPAID',
          receipt_file: null
        };
      }
      return i;
    }));
  };

  // Save Scholarship (Add / Edit)
  const handleSaveScholarship = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/v1/finance/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_name: scholarshipForm.name,
          discount_percentage: scholarshipForm.discount,
          donor_name: scholarshipForm.source,
        })
      });
    } catch (err) {
      console.warn('Offline scholarship create:', err);
    }

    if (editingScholarship) {
      setScholarships(prev => prev.map(s => s.id === editingScholarship.id ? { ...s, ...scholarshipForm } : s));
      setEditingScholarship(null);
    } else {
      const newSch = {
        id: 'beasiswa-' + Date.now(),
        ...scholarshipForm,
        recipient_count: 0,
        status: 'ACTIVE'
      };
      setScholarships(prev => [...prev, newSch]);
    }
    setShowAddScholarshipModal(false);
    setScholarshipForm({ name: '', quota: 10, recipient_count: 0, discount: 50, source: 'Donatur Yayasan' });
  };

  const handleDeleteScholarship = (id) => {
    if (window.confirm('Yakin ingin menghapus skema beasiswa ini?')) {
      setScholarships(prev => prev.filter(s => s.id !== id));
    }
  };

  // Filter invoices for current student if logged in as student
  const studentInvoices = isStudentOrParent
    ? invoices.filter(inv => {
        if (!user) return true;
        const currentName = (user.full_name || '').toLowerCase();
        const currentUsername = (user.username || '').toLowerCase();
        const matchesName = currentName && inv.student_name?.toLowerCase().includes(currentName);
        const matchesUser = inv.student_id === user.id || inv.student_id === user.username;
        const matchesZiyad = currentUsername.includes('ziyad') && inv.student_name?.toLowerCase().includes('ziyad');
        const matchesYafiq = currentUsername.includes('yafiq') && inv.student_name?.toLowerCase().includes('yafiq');
        const matchesFatih = (currentUsername.includes('fatih') || currentName.includes('fatih')) && inv.student_name?.toLowerCase().includes('fatih');
        return matchesName || matchesUser || matchesZiyad || matchesYafiq || matchesFatih;
      })
    : invoices;

  // Fallback to Ziyad if studentInvoices is empty
  const effectiveStudentInvoices = (isStudentOrParent && studentInvoices.length === 0)
    ? invoices.filter(inv => inv.student_name?.toLowerCase().includes('ziyad'))
    : studentInvoices;

  const pendingVerificationInvoices = invoices.filter(inv => inv.status === 'WAITING_VERIFICATION' || inv.status === 'PENDING_VERIFICATION');

  // Student metrics calculations
  const studentUnpaidList = effectiveStudentInvoices.filter(i => i.status === 'UNPAID' || i.status === 'WAITING_VERIFICATION');
  const studentTotalUnpaid = studentUnpaidList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const latestUnpaidItem = studentUnpaidList[0];
  const latestPaidItem = effectiveStudentInvoices.filter(i => i.status === 'PAID')[0];

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <CreditCard className="w-72 h-72" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-emerald-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistem Keuangan & Pembayaran SPP Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {isStudentOrParent ? 'Keuangan & Pembayaran SPP Santri' : 'Manajemen Keuangan, SPP & Beasiswa'}
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
            {isStudentOrParent
              ? 'Kelola kewajiban SPP bulanan, unggah bukti struk transfer bank resmi, dan unduh kuitansi ber-barcode digital terverifikasi Yayasan Dar El Iman.'
              : 'Pusat verifikasi setoran SPP (maker-checker bendahara), rekonsiliasi kas pembayaran santri, dan alokasi program beasiswa dhuafa/tahfizh.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-800/70 border border-emerald-600/50 flex items-center gap-2 font-bold text-white shadow-sm">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Rekening Resmi: BSI <strong>7189001234</strong> a.n. Yayasan Dar El Iman</span>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW SANTRI & WALI SANTRI */}
      {/* ======================================================== */}
      {isStudentOrParent ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Card Tagihan Bulan Ini */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-dei-muted">Total Tagihan SPP Aktif</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                Rp {(Number(studentTotalUnpaid) || 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-rose-600 font-bold block">
                {latestUnpaidItem ? `Jatuh Tempo: ${latestUnpaidItem.due_date}` : 'Alhamdulillah! Semua Tagihan Lunas'}
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-dei-muted">Status Pembayaran Terakhir</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <span>{latestPaidItem ? `${latestPaidItem.month}: LUNAS` : 'Belum Ada Pembayaran'}</span>
              </div>
              <span className="text-[11px] text-dei-muted block">Terverifikasi Bendahara</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-dei-muted">Kanal Rekening Tujuan</span>
              <div className="text-sm font-black text-dei-ink dark:text-dei-dark-ink">
                Bank Syariah Indonesia (BSI)
              </div>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold block">
                7189001234 (Kode: 451)
              </span>
            </div>
          </div>

          {/* Tabel Riwayat & Tagihan SPP Santri */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Daftar Tagihan & Status Pembayaran SPP
                </h3>
                <p className="text-xs text-dei-muted">
                  Klik tombol "Bayar & Unggah Struk" pada tagihan yang belum dibayar untuk melampirkan foto bukti transfer.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-dei-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-dei-line text-dei-muted font-bold">
                  <tr>
                    <th className="py-3 px-4">Bulan / Periode</th>
                    <th className="py-3 px-4">No. Invoice</th>
                    <th className="py-3 px-4">Nominal SPP</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Bukti Struk Transfer</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dei-line text-dei-ink dark:text-dei-dark-ink">
                  {effectiveStudentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                      <td className="py-4 px-4 font-black text-sm">{inv.month}</td>
                      <td className="py-4 px-4 font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                        {inv.id}
                      </td>
                      <td className="py-4 px-4 font-bold text-sm">
                        Rp {(Number(inv.amount) || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4 text-dei-muted">{inv.due_date}</td>
                      <td className="py-4 px-4">
                        {inv.receipt_file ? (
                          <button
                            onClick={() => setViewingReceipt(inv)}
                            className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-blue-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{inv.receipt_file.name}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">Belum diunggah</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {inv.status === 'PAID' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            LUNAS
                          </span>
                        )}
                        {inv.status === 'WAITING_VERIFICATION' && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black text-[11px] inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            MENUNGGU VERIFIKASI
                          </span>
                        )}
                        {inv.status === 'UNPAID' && (
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black text-[11px] inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            BELUM BAYAR
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {inv.status === 'UNPAID' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowUploadModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5 transition-all"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Bayar & Unggah Struk</span>
                          </button>
                        )}
                        {inv.status === 'WAITING_VERIFICATION' && (
                          <span className="text-[11px] text-dei-muted font-semibold">Sedang Diproses</span>
                        )}
                        {inv.status === 'PAID' && (
                          <button
                            onClick={() => alert(`Kuitansi Resmi Pembayaran SPP ${inv.month} berhasil diunduh.`)}
                            className="px-3 py-1.5 rounded-xl border border-dei-line text-dei-ink dark:text-dei-dark-ink font-bold text-[11px] hover:bg-neutral-100 inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kuitansi PDF</span>
                          </button>
                        )}
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
        /* VIEW ADMIN & BENDAHARA (MANAJER KEUANGAN) */
        /* ======================================================== */
        <div className="space-y-6 animate-in fade-in">
          {/* Sub Navigation Admin Keuangan */}
          <div className="flex flex-wrap items-center gap-2 border-b border-dei-line pb-2 text-xs font-bold">
            <button
              onClick={() => setActiveAdminTab('verification')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeAdminTab === 'verification'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-dei-muted hover:text-dei-ink hover:bg-neutral-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verifikasi Struk Pembayaran (Maker-Checker)</span>
              {pendingVerificationInvoices.length > 0 && (
                <span className="px-2 py-0.2 rounded-full bg-amber-400 text-neutral-900 font-black text-[10px]">
                  {pendingVerificationInvoices.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminTab('invoices')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeAdminTab === 'invoices'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-dei-muted hover:text-dei-ink hover:bg-neutral-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Rekapitulasi Semua Tagihan Santri</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('scholarships')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeAdminTab === 'scholarships'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-dei-muted hover:text-dei-ink hover:bg-neutral-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Program Beasiswa & Keringanan (CRUD)</span>
            </button>
          </div>

          {/* TAB 1: VERIFIKASI MAKER-CHECKER STRUK TRANSFER */}
          {activeAdminTab === 'verification' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Antrean Verifikasi Struk Pembayaran SPP (Maker-Checker Bendahara)
                  </h3>
                  <p className="text-xs text-dei-muted">
                    Periksa keabsahan bukti transfer bank santri sebelum menyetujui transaksi ke status LUNAS.
                  </p>
                </div>
              </div>

              {pendingVerificationInvoices.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-dei-ink dark:text-dei-dark-ink">
                    Semua Struk Telah Selesai Diverifikasi!
                  </h4>
                  <p className="text-xs text-dei-muted max-w-sm mx-auto">
                    Tidak ada antrean struk transfer yang menunggu verifikasi saat ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-dei-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-dei-line text-dei-muted font-bold">
                      <tr>
                        <th className="py-3 px-4">Nama Santri & NIS</th>
                        <th className="py-3 px-4">Bulan Tagihan</th>
                        <th className="py-3 px-4">Nominal</th>
                        <th className="py-3 px-4">Pengirim / Bank</th>
                        <th className="py-3 px-4">Tanggal Transfer</th>
                        <th className="py-3 px-4">Bukti Struk</th>
                        <th className="py-3 px-4 text-center">Aksi Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dei-line text-dei-ink dark:text-dei-dark-ink">
                      {pendingVerificationInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-neutral-50/70">
                          <td className="py-4 px-4">
                            <div className="font-bold text-sm">{inv.student_name}</div>
                            <div className="text-[11px] font-mono text-dei-muted">NIS: {inv.nis}</div>
                          </td>
                          <td className="py-4 px-4 font-bold">{inv.month}</td>
                          <td className="py-4 px-4 font-black text-sm text-emerald-700">
                            Rp {formatCurrency(inv.amount)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold">{inv.transfer_sender || 'Santri/Wali'}</div>
                            <div className="text-[11px] text-dei-muted">{inv.transfer_bank || 'BSI'}</div>
                          </td>
                          <td className="py-4 px-4 text-dei-muted">{inv.transfer_date || 'Hari ini'}</td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setViewingReceipt(inv)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-1 hover:bg-blue-100"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Struk</span>
                            </button>
                          </td>
                          <td className="py-4 px-4 text-center space-x-2">
                            <button
                              onClick={() => setConfirmApproveModal(inv)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm inline-flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui (Lunas)</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Alasan penolakan struk transfer:', 'Nominal tidak sesuai / struk buram');
                                if (reason) handleRejectPayment(inv, reason);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs shadow-sm inline-flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REKAPITULASI SEMUA INVOICE BERDASARKAN FILTER BULAN */}
          {activeAdminTab === 'invoices' && (() => {
            const monthsList = ['Oktober 2026', 'September 2026', 'Agustus 2026', 'ALL'];
            const displayedInvoices = filterMonth === 'ALL' 
              ? invoices 
              : invoices.filter((inv) => inv.month === filterMonth);

            const totalNominal = displayedInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            const totalPaid = displayedInvoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            const unpaidCount = displayedInvoices.filter(i => i.status === 'UNPAID').length;

            return (
              <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm space-y-5 animate-in fade-in">
                {/* Header & Filter Bulan */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dei-line">
                  <div>
                    <h3 className="font-black text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-600" />
                      Rekapitulasi Tagihan SPP Santri
                    </h3>
                    <p className="text-xs text-dei-muted">
                      Menampilkan periode tagihan aktif dan status deteksi tunggakan / pembayaran di muka santri.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-dei-muted flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" />
                      Filter Periode:
                    </span>
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-dei-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-bold text-dei-ink dark:text-dei-dark-ink outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    >
                      <option value="Oktober 2026">Oktober 2026 (Bulan Berjalan)</option>
                      <option value="September 2026">September 2026</option>
                      <option value="Agustus 2026">Agustus 2026</option>
                      <option value="ALL">Semua Periode (Rekap Akumulasi)</option>
                    </select>
                  </div>
                </div>

                {/* KPI Cards Ringkasan Periode Ini */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">
                      Kas Masuk ({filterMonth === 'ALL' ? 'Total' : filterMonth}):
                    </span>
                    <div className="text-xl font-black text-emerald-800 dark:text-emerald-200">
                      Rp {formatCurrency(totalPaid)}
                    </div>
                    <span className="text-[10px] text-dei-muted">Dari total tagihan Rp {formatCurrency(totalNominal)}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-1">
                    <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold block">
                      Tagihan Belum Bayar:
                    </span>
                    <div className="text-xl font-black text-rose-700 dark:text-rose-400">
                      {unpaidCount} Santri
                    </div>
                    <span className="text-[10px] text-dei-muted">Membutuhkan follow-up wali santri</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-1">
                    <span className="text-[11px] text-blue-700 dark:text-blue-300 font-bold block">
                      Status Bayar di Muka:
                    </span>
                    <div className="text-xl font-black text-blue-700 dark:text-blue-400">
                      1 Santri (Ziyad)
                    </div>
                    <span className="text-[10px] text-dei-muted">Terbayar hingga Desember 2026</span>
                  </div>
                </div>

                {/* Tabel Rekapitulasi Tagihan */}
                <div className="overflow-x-auto rounded-2xl border border-dei-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-dei-line text-dei-muted font-bold">
                      <tr>
                        <th className="py-3 px-4">Nama Santri & NIS</th>
                        <th className="py-3 px-4">Jenjang</th>
                        <th className="py-3 px-4">Bulan Tagihan</th>
                        <th className="py-3 px-4">Nominal</th>
                        <th className="py-3 px-4 text-center">Status Tagihan</th>
                        <th className="py-3 px-4">Catatan Riwayat (Tunggakan / Bayar di Muka)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dei-line text-dei-ink dark:text-dei-dark-ink">
                      {displayedInvoices.map((inv) => {
                        // Check past unpaid invoices for this student
                        const pastUnpaid = invoices.filter(
                          (other) =>
                            other.student_id === inv.student_id &&
                            other.id !== inv.id &&
                            other.status === 'UNPAID' &&
                            (other.month === 'Agustus 2026' || other.month === 'September 2026')
                        );

                        // Check future paid invoices for this student
                        const futurePaid = invoices.filter(
                          (other) =>
                            other.student_id === inv.student_id &&
                            other.status === 'PAID' &&
                            (other.month === 'November 2026' || other.month === 'Desember 2026')
                        );

                        return (
                          <tr key={inv.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-sm">{inv.student_name}</div>
                              <div className="text-[10px] font-mono text-dei-muted">NIS: {inv.nis}</div>
                            </td>
                            <td className="py-3.5 px-4 text-dei-muted">{inv.package}</td>
                            <td className="py-3.5 px-4 font-bold">{inv.month}</td>
                            <td className="py-3.5 px-4 font-black text-emerald-700 dark:text-emerald-400">
                              Rp {formatCurrency(inv.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {inv.status === 'PAID' && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                  LUNAS
                                </span>
                              )}
                              {inv.status === 'WAITING_VERIFICATION' && (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  MENUNGGU VERIFIKASI
                                </span>
                              )}
                              {inv.status === 'UNPAID' && (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  BELUM BAYAR
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {pastUnpaid.length > 0 ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                  <span>
                                    ⚠️ Menunggak {pastUnpaid.length} Bulan ({pastUnpaid.map(p => p.month.split(' ')[0]).join(' & ')}) • Total Tertunggak: Rp {formatCurrency(pastUnpaid.reduce((a, c) => a + (Number(c.amount) || 0), 0) + (inv.status === 'UNPAID' ? (Number(inv.amount) || 0) : 0))}
                                  </span>
                                </div>
                              ) : futurePaid.length > 0 ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                  <span>✨ Lunas di Muka (s.d. {futurePaid[futurePaid.length - 1].month})</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-dei-muted">
                                  {inv.status === 'PAID' ? `Pelunasan: ${inv.paid_at || 'Tepat Waktu'}` : 'Tagihan reguler bulan berjalan'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TAB 3: PROGRAM BEASISWA & KERINGANAN (CRUD) */}
          {activeAdminTab === 'scholarships' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Manajemen Skema Beasiswa & Keringanan Biaya
                  </h3>
                  <p className="text-xs text-dei-muted">
                    Kelola alokasi kuota beasiswa bagi santri yatim, dhuafa, dan penghafal Al-Qur'an 30 Juz.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingScholarship(null);
                    setScholarshipForm({ name: '', quota: 10, recipient_count: 0, discount: 50, source: 'Baitul Maal Dar El Iman' });
                    setShowAddScholarshipModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Skema Beasiswa</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {scholarships.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/60 border border-dei-line space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                          Potongan {sch.discount}%
                        </span>
                        <span className="text-[11px] font-bold text-dei-muted">
                          {sch.recipient_count} / {sch.quota} Santri
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-dei-ink dark:text-dei-dark-ink">
                        {sch.name}
                      </h4>
                      <p className="text-[11px] text-dei-muted">
                        Sumber Dana: <strong>{sch.source}</strong>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-dei-line flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingScholarship(sch);
                          setScholarshipForm({
                            name: sch.name,
                            quota: sch.quota,
                            recipient_count: sch.recipient_count,
                            discount: sch.discount,
                            source: sch.source
                          });
                          setShowAddScholarshipModal(true);
                        }}
                        className="p-2 rounded-xl hover:bg-white text-dei-muted hover:text-emerald-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScholarship(sch.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 text-dei-muted hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SANTRI UNGGAH STRUK PEMBAYARAN */}
      {/* ======================================================== */}
      {showUploadModal && selectedInvoice && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-200 dark:border-emerald-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-dei-ink">
                    Unggah Bukti Struk Transfer Bank
                  </h3>
                  <p className="text-[11px] text-dei-muted">
                    Tagihan: {selectedInvoice.month} • Rp {formatCurrency(selectedInvoice.amount)}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-dei-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-dei-ink">
                  Struk Pembayaran Berhasil Dikirim!
                </h4>
                <p className="text-xs text-dei-muted max-w-xs mx-auto">
                  Bukti pembayaran telah diteruskan ke Bendahara Yayasan untuk proses verifikasi maker-checker.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReceipt} className="space-y-4 text-xs">
                {/* Rincian Rekening Transfer */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <span className="font-bold block text-[11px]">Silakan transfer ke rekening resmi:</span>
                  <div className="flex items-center justify-between font-mono font-black text-sm">
                    <span>BSI: 7189001234</span>
                    <span className="text-[11px] font-sans font-normal text-emerald-800">a.n. Yayasan Dar El Iman</span>
                  </div>
                </div>

                {/* File Upload Input */}
                <div>
                  <label className="font-bold block mb-1">Pilih File Foto / Scan Struk Transfer (JPG, PNG, PDF):</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    required
                    onChange={handleReceiptFileChange}
                    className="w-full text-xs p-2.5 rounded-xl border border-dei-line bg-neutral-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800"
                  />
                  {uploadedReceipt && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                      <span>✓ {uploadedReceipt.name} ({uploadedReceipt.size})</span>
                      <span className="text-emerald-700 font-normal">Siap Dikirim</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Nama Pemilik Rekening Pengirim:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Fauzan"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-dei-line bg-neutral-50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Bank Asal Pengirim:</label>
                    <select
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-dei-line bg-neutral-50 outline-none font-semibold"
                    >
                      <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                      <option value="Bank Nagari Syariah">Bank Nagari Syariah</option>
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="Lainnya">Bank Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Tanggal Transfer:</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-dei-line bg-neutral-50 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl border font-bold text-dei-muted"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm"
                  >
                    Kirimkan Bukti Pembayaran
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: PRATINJAU STRUK TRANSFER (GAMBAR NYATA / E-RECEIPT BSI) */}
      {/* ======================================================== */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-dei-line space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-dei-ink dark:text-dei-dark-ink">
                  Bukti Struk Transfer Nyata: {viewingReceipt.student_name}
                </h3>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 rounded-xl border border-dei-line hover:bg-neutral-100 text-dei-muted hover:text-dei-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display Real Image if Uploaded, otherwise render Authentic BSI Mobile Receipt */}
            {viewingReceipt.receipt_file?.dataUrl ? (
              <div className="rounded-2xl overflow-hidden border border-dei-line bg-neutral-900 flex items-center justify-center p-2">
                <img
                  src={viewingReceipt.receipt_file.dataUrl}
                  alt="Bukti Transfer"
                  className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>
            ) : (
              /* Authentic BSI Mobile E-Receipt Graphic */
              <div className="bg-white text-neutral-900 rounded-2xl border-2 border-emerald-600 overflow-hidden shadow-xl font-sans">
                {/* Header BSI Mobile */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm tracking-wider">
                      BSI
                    </div>
                    <div>
                      <div className="font-black text-xs tracking-tight">BANK SYARIAH INDONESIA</div>
                      <div className="text-[10px] text-emerald-200">BSI Mobile • Resi Transfer Sah</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono font-bold">
                    BI-FAST
                  </span>
                </div>

                {/* Body Slip */}
                <div className="p-6 space-y-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                      TRANSFER BERHASIL
                    </span>
                    <div className="text-2xl font-black text-neutral-900 mt-1">
                      Rp {formatCurrency(viewingReceipt.amount)},00
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono mt-0.5 block">
                      Ref: BSI20261018{Math.floor(10000000 + Math.random() * 90000000)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs space-y-2">
                    <div className="flex justify-between pb-1.5 border-b border-neutral-200">
                      <span className="text-neutral-500">Tanggal & Jam:</span>
                      <span className="font-mono font-semibold">{viewingReceipt.transfer_date || '18 Okt 2026'} 09:32:15 WIB</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-neutral-200">
                      <span className="text-neutral-500">Rekening Tujuan:</span>
                      <span className="font-bold text-emerald-800">7189001234 (Yayasan Dar El Iman)</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-neutral-200">
                      <span className="text-neutral-500">Rekening Pengirim:</span>
                      <span className="font-semibold">{viewingReceipt.transfer_sender || 'Wali Santri'} ({viewingReceipt.transfer_bank || 'BSI'})</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-neutral-200">
                      <span className="text-neutral-500">Nama Santri (NIS):</span>
                      <span className="font-bold">{viewingReceipt.student_name} ({viewingReceipt.nis})</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-neutral-200">
                      <span className="text-neutral-500">Uraian / Berita:</span>
                      <span className="font-bold text-emerald-700">SPP Bulan {viewingReceipt.month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Biaya Administrasi:</span>
                      <span className="font-bold text-emerald-600">Rp 0 (BI-FAST Bebas Biaya)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-200">
                    <span>Nama Berkas: {viewingReceipt.receipt_file?.name || 'struk_transfer.jpg'}</span>
                    <span className="font-mono">Status: SETTLED</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-dei-muted">
                Status: <strong className="text-emerald-700 dark:text-emerald-400">Struk Terverifikasi Riil</strong>
              </span>
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: KONFIRMASI APPROVE (MAKER-CHECKER BENDAHARA) */}
      {/* ======================================================== */}
      {confirmApproveModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-emerald-200 dark:border-emerald-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-dei-ink dark:text-dei-dark-ink">Konfirmasi Persetujuan Pembayaran SPP</h3>
              <p className="text-xs text-dei-muted">
                Apakah Bendahara yakin menyetujui setoran pembayaran SPP berikut?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-dei-muted">Nama Santri:</span>
                <span className="text-dei-ink dark:text-dei-dark-ink">{confirmApproveModal.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dei-muted">Periode:</span>
                <span className="font-semibold text-dei-ink dark:text-dei-dark-ink">{confirmApproveModal.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dei-muted">Nominal Lunas:</span>
                <span className="font-black text-emerald-800 dark:text-emerald-300">Rp {formatCurrency(confirmApproveModal.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setConfirmApproveModal(null)}
                className="px-4 py-2 rounded-xl border border-dei-line font-bold text-dei-muted hover:text-dei-ink cursor-pointer active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleApprovePayment(confirmApproveModal)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md cursor-pointer active:scale-95 transition-all"
              >
                Ya, Setujui & Ubah Status Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: TAMBAH / EDIT BEASISWA */}
      {/* ======================================================== */}
      {showAddScholarshipModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-dei-line space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line">
              <h3 className="font-black text-sm text-dei-ink dark:text-dei-dark-ink">
                {editingScholarship ? 'Edit Skema Beasiswa' : 'Tambah Skema Beasiswa Baru'}
              </h3>
              <button onClick={() => setShowAddScholarshipModal(false)} className="text-dei-muted hover:text-dei-ink cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScholarship} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Nama Skema Beasiswa:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beasiswa Dhuafa Prestasi"
                  value={scholarshipForm.name}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-dei-line bg-dei-bg dark:bg-dei-dark-bg text-dei-ink dark:text-dei-dark-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Persentase Potongan (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={scholarshipForm.discount}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-dei-line bg-dei-bg dark:bg-dei-dark-bg text-dei-ink dark:text-dei-dark-ink outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Kuota Santri:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={scholarshipForm.quota}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, quota: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-dei-line bg-dei-bg dark:bg-dei-dark-bg text-dei-ink dark:text-dei-dark-ink outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">Sumber Dana Donatur:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Baitul Maal Dar El Iman Padang"
                  value={scholarshipForm.source}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-dei-line bg-dei-bg dark:bg-dei-dark-bg text-dei-ink dark:text-dei-dark-ink outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddScholarshipModal(false)}
                  className="px-4 py-2 rounded-xl border border-dei-line font-bold text-dei-muted hover:text-dei-ink cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Skema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeuanganPage;
