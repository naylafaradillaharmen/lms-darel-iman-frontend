import React, { useState, useEffect } from 'react';
import {
  Globe,
  Building,
  Users,
  MapPin,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Send,
  X,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Award
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/v1/partners';

export const KemitraanPage = () => {
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'diaspora-map'
  const [partners, setPartners] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');

  // Modal State
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    partner_type: 'PESANTREN',
    country: 'Indonesia',
    city: 'Padang',
    contact_person: '',
    phone: '',
    email: '',
  });

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedPartnerForEnroll, setSelectedPartnerForEnroll] = useState(null);
  const [enrollCount, setEnrollCount] = useState(5);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState('');

  useEffect(() => {
    fetchPartners();
    fetchAnalytics();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.success && data.data) {
        setPartners(data.data);
      }
    } catch (e) {
      console.error("Gagal load mitra", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/diaspora-map`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Gagal load analytics diaspora", e);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!newPartner.name) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddPartnerModal(false);
        setNewPartner({
          name: '',
          partner_type: 'PESANTREN',
          country: 'Indonesia',
          city: 'Padang',
          contact_person: '',
          phone: '',
          email: '',
        });
        fetchPartners();
      } else {
        alert(data.message || "Gagal menambah mitra");
      }
    } catch (err) {
      alert("Kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEnroll = async (e) => {
    e.preventDefault();
    if (!selectedPartnerForEnroll) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${selectedPartnerForEnroll.id}/bulk-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_count: Number(enrollCount) })
      });
      const data = await res.json();
      if (data.success) {
        setEnrollSuccessMsg(`Alhamdulillah! ${enrollCount} santri binaan berhasil didaftarkan secara kolektif di bawah ${selectedPartnerForEnroll.name}.`);
        setShowEnrollModal(false);
        fetchPartners();
      } else {
        alert(data.message || "Gagal mendaftarkan kolektif");
      }
    } catch (err) {
      alert("Kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchSearch = !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contact_person.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 text-white shadow-lg relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <Globe className="w-72 h-72" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ekspansi Ekosistem, Kemitraan & Diaspora Global</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Jaringan Mitra Lembaga & Persebaran Santri Dunia
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
            Menghubungkan pondok pesantren mitra di tanah air, majelis taklim, serta komunitas diaspora WNI di Timur Tengah, Asia, dan Eropa dengan integrasi kurikulum kesetaraan berijazah resmi nasional.
          </p>

          {analytics?.summary && (
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 flex items-center gap-1.5 font-bold text-emerald-100">
                <Users className="w-3.5 h-3.5 text-amber-300" />
                Total Santri Aktif: {analytics.summary.total_students} Jiwa
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 flex items-center gap-1.5 font-bold text-emerald-100">
                <Globe className="w-3.5 h-3.5 text-emerald-300" />
                Sebaran Diaspora: {analytics.summary.total_diaspora} Santri di {analytics.summary.total_countries} Negara
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {enrollSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{enrollSuccessMsg}</span>
          </div>
          <button onClick={() => setEnrollSuccessMsg('')} className="font-bold underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-dei-line dark:border-dei-dark-line pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'partners'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-dei-muted hover:text-dei-ink dark:hover:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Jaringan Lembaga Mitra</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {partners.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('diaspora-map')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'diaspora-map'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-dei-muted hover:text-dei-ink dark:hover:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Peta Persebaran Diaspora & Zona Waktu</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: JARINGAN LEMBAGA MITRA */}
      {/* ======================================================== */}
      {activeTab === 'partners' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Actions & Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dei-muted" />
              <input
                type="text"
                placeholder="Cari nama pesantren mitra, kota, atau perwakilan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => setShowAddPartnerModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Mitra Baru</span>
            </button>
          </div>

          {/* Partners Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPartners.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm hover:border-emerald-400 dark:hover:border-emerald-600 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 font-bold text-[10px] text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                      {p.partner_type.replace('_', ' ')}
                    </span>
                    <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                      {p.name}
                    </h3>
                    <p className="text-xs text-dei-muted flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.city}, {p.country}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
                      {p.student_count || 0}
                    </span>
                    <span className="text-[10px] text-dei-muted uppercase font-bold">Santri Binaan</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-dei-line dark:border-dei-dark-line grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-dei-muted block">Penanggung Jawab:</span>
                    <span className="font-semibold text-dei-ink dark:text-dei-dark-ink">{p.contact_person}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-dei-muted block">Kontak WhatsApp:</span>
                    <span className="font-semibold text-emerald-600">{p.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-dei-muted flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Status: Lembaga Aktif
                  </span>

                  <button
                    onClick={() => {
                      setSelectedPartnerForEnroll(p);
                      setShowEnrollModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Daftarkan Santri Kolektif</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PETA PERSEBARAN DIASPORA & ZONA WAKTU DUNIA */}
      {/* ======================================================== */}
      {activeTab === 'diaspora-map' && analytics && (
        <div className="space-y-6 animate-in fade-in">
          {/* World Regional Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Santri Domestik RI</span>
              <div className="text-2xl font-black text-dei-ink dark:text-dei-dark-ink mt-1 flex items-center justify-between">
                <span>{analytics.summary.total_domestic}</span>
                <span className="text-xl">🇮🇩</span>
              </div>
              <span className="text-[10px] text-dei-muted block mt-1">Sumatera, Jawa, & Wilayah RI</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Santri Diaspora Luar Negeri</span>
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 flex items-center justify-between">
                <span>{analytics.summary.total_diaspora}</span>
                <Globe className="w-5 h-5 text-teal-500" />
              </div>
              <span className="text-[10px] text-teal-600 font-bold block mt-1">
                Porsi: {analytics.summary.diaspora_percent}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Negara Perwakilan</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center justify-between">
                <span>{analytics.summary.total_countries}</span>
                <Building className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-[10px] text-dei-muted block mt-1">Timur Tengah, Asia, Eropa</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm">
              <span className="text-[11px] font-semibold text-dei-muted block">Zona Waktu Fleksibel</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center justify-between">
                <span>5</span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] text-amber-600 font-bold block mt-1">GMT+3 s/d GMT+9</span>
            </div>
          </div>

          {/* Visual Country Distribution Table & Pin Representation */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  Peta Sebaran Santri Global Berdasarkan Negara & Zona Waktu
                </h3>
                <p className="text-xs text-dei-muted">
                  Menjamin hak pendidikan formal santri anak bangsa di manapun berada dengan sinkronisasi jam belajar yang adaptif.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {analytics.locations.map((loc) => (
                <div
                  key={loc.country}
                  className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-dei-line dark:border-dei-dark-line space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{loc.flag_emoji}</span>
                      <div>
                        <div className="font-bold text-sm text-dei-ink dark:text-dei-dark-ink">{loc.country}</div>
                        <div className="text-[11px] text-dei-muted">{loc.city}</div>
                      </div>
                    </div>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {loc.total_student}
                      <span className="text-[10px] font-normal text-dei-muted"> santri</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-dei-line dark:border-dei-dark-line flex items-center justify-between text-[11px]">
                    <span className="text-dei-muted flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {loc.timezone}
                    </span>
                    <span className="text-teal-700 dark:text-teal-300 font-semibold">
                      Halaqah Terpadu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH MITRA BARU */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dei-dark-surface rounded-3xl max-w-md w-full border border-dei-line shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-dei-ink">Daftarkan Lembaga Mitra Baru</h3>
              <button onClick={() => setShowAddPartnerModal(false)} className="text-dei-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Lembaga / Pesantren:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pondok Pesantren Imam Syafi'i"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Kategori Kemitraan:</label>
                <select
                  value={newPartner.partner_type}
                  onChange={(e) => setNewPartner({ ...newPartner, partner_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none font-semibold"
                >
                  <option value="PESANTREN">Pondok Pesantren Mitra</option>
                  <option value="KOMUNITAS_DIASPORA">Komunitas Diaspora WNI Luar Negeri</option>
                  <option value="MAJELIS_TAKLIM">Majelis Taklim / Komunitas Belajar</option>
                  <option value="LEMBAGA_BEASISWA">Lembaga Donatur & Beasiswa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Negara:</label>
                  <input
                    type="text"
                    required
                    value={newPartner.country}
                    onChange={(e) => setNewPartner({ ...newPartner, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Kota:</label>
                  <input
                    type="text"
                    required
                    value={newPartner.city}
                    onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Penanggung Jawab (PIC):</label>
                <input
                  type="text"
                  required
                  placeholder="Ustadz / Nama Perwakilan"
                  value={newPartner.contact_person}
                  onChange={(e) => setNewPartner({ ...newPartner, contact_person: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">No. WhatsApp:</label>
                <input
                  type="text"
                  required
                  placeholder="+628... atau +966..."
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Simpan Lembaga Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PENDAFTARAN KOLEKTIF SANTRI MITRA */}
      {showEnrollModal && selectedPartnerForEnroll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dei-dark-surface rounded-3xl max-w-md w-full border border-dei-line shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">ENROLLMENT KOLEKTIF</span>
                <h3 className="font-black text-base text-dei-ink">{selectedPartnerForEnroll.name}</h3>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-dei-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkEnroll} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Jumlah Santri yang Didaftarkan Kolektif:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={enrollCount}
                  onChange={(e) => setEnrollCount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-dei-bg border outline-none font-bold text-sm"
                />
              </div>

              <p className="text-dei-muted text-[11px] leading-relaxed">
                Santri yang didaftarkan melalui lembaga mitra ini akan otomatis tercatat di bawah binaan <b>{selectedPartnerForEnroll.name}</b> dan memperoleh pembagian rombel serta akses pembelajaran kesetaraan PKBM Digital.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Konfirmasi Pendaftaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KemitraanPage;
