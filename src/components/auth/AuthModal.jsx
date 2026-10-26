import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Mail,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = ({ isOpen, onClose, initialTab = 'login', onLoginSuccess }) => {
  const { login, register, demoAccounts } = useAuth();
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProgram, setRegProgram] = useState('Paket C (Setara SMA - MIPA)');
  const [regPassword, setRegPassword] = useState('');
  const [showAllDemos, setShowAllDemos] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const res = await login(username, password);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        onClose();
        if (onLoginSuccess) onLoginSuccess(res.user);
      }, 700);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const res = await register({
      fullName: regFullName,
      email: regEmail,
      program: regProgram,
      password: regPassword,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message + ' Silakan masuk dengan akun baru Anda.');
      setTimeout(() => {
        setTab('login');
        setUsername(regEmail);
        setPassword(regPassword);
      }, 1200);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSelectDemo = (demo) => {
    setUsername(demo.username);
    setPassword(demo.password);
    setErrorMessage('');
    // Auto submit demo login for instant seamless testing
    login(demo.username, demo.password).then((res) => {
      if (res.success) {
        setSuccessMessage(`Login demo sebagai ${demo.role_display} berhasil!`);
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) onLoginSuccess(res.user);
        }, 500);
      }
    });
  };

  const quickRoles = [
    { title: 'Super Admin', user: 'admin', pass: 'admin123', icon: '👑', color: 'border-emerald-300 dark:border-emerald-700' },
    { title: 'Direktur PKBM', user: 'direktur', pass: 'direktur123', icon: '🎓', color: 'border-blue-300 dark:border-blue-700' },
    { title: 'Tutor PAI', user: 'tutor.ahmad', pass: 'tutor123', icon: '📖', color: 'border-teal-300 dark:border-teal-700' },
    { title: 'Santri Paket C', user: 'santri.ziyad', pass: 'santri123', icon: '🎒', color: 'border-amber-300 dark:border-amber-700' },
    { title: 'Wali Kelas', user: 'wali.kelas', pass: 'walikelas123', icon: '📋', color: 'border-purple-300 dark:border-purple-700' },
    { title: 'Manajer IT', user: 'manajer.it', pass: 'teknologi123', icon: '💻', color: 'border-indigo-300 dark:border-indigo-700' },
  ];

  const categories = ['Semua', 'Pimpinan', 'Akademik', 'Kesiswaan', 'Teknologi', 'Keuangan'];

  const filteredDemos = demoAccounts.filter((d) => {
    if (selectedCategory === 'Semua') return true;
    return d.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-dei-dark-surface rounded-2xl shadow-2xl border border-dei-line dark:border-dei-dark-line overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-dei-emerald to-dei-emerald-dark text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Portal Digital Dar El Iman</h3>
              <p className="text-xs text-emerald-100">Pendidikan Kesetaraan Sunnah & Tahfizh Bersanad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-dei-line dark:border-dei-dark-line px-6 pt-3 bg-dei-bg dark:bg-dei-dark-bg/60">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(''); }}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              tab === 'login'
                ? 'border-dei-emerald text-dei-emerald dark:border-dei-emerald-neon dark:text-dei-emerald-neon'
                : 'border-transparent text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-dei-dark-ink'
            }`}
          >
            <Lock className="w-4 h-4" />
            Masuk ke Portal
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMessage(''); }}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              tab === 'register'
                ? 'border-dei-emerald text-dei-emerald dark:border-dei-emerald-neon dark:text-dei-emerald-neon'
                : 'border-transparent text-dei-muted dark:text-dei-dark-muted hover:text-dei-ink dark:hover:text-dei-dark-ink'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Pendaftaran Baru (PPDB)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {tab === 'login' ? (
            <>
              {/* Quick Demo Role Shortcuts */}
              <div className="bg-dei-bg dark:bg-dei-dark-bg p-4 rounded-xl border border-dei-line dark:border-dei-dark-line">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-dei-gold" />
                    1-Klik Masuk Akun Demo:
                  </span>
                  <span className="text-[11px] text-dei-emerald dark:text-dei-emerald-neon font-medium">Klik langsung login</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickRoles.map((role) => (
                    <button
                      key={role.user}
                      type="button"
                      onClick={() => handleSelectDemo({ username: role.user, password: role.pass, role_display: role.title })}
                      className="flex items-center gap-2 p-2 bg-white dark:bg-dei-dark-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border rounded-lg text-left text-xs transition-all hover:scale-[1.02] shadow-sm"
                    >
                      <span className="text-base">{role.icon}</span>
                      <div className="truncate">
                        <div className="font-semibold text-dei-ink dark:text-dei-dark-ink truncate">{role.title}</div>
                        <div className="text-[10px] text-dei-muted dark:text-dei-dark-muted font-mono">{role.user}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Button to view all 18 demo roles */}
                <button
                  type="button"
                  onClick={() => setShowAllDemos(!showAllDemos)}
                  className="mt-3 w-full py-1.5 text-xs text-dei-emerald dark:text-dei-emerald-neon font-semibold flex items-center justify-center gap-1.5 hover:underline"
                >
                  {showAllDemos ? (
                    <>Tutup Katalog Lengkap Demo <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Buka Katalog Lengkap 18 Peran Demo (Pimpinan, Tutor, Mutu, IT, dll) <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>

                {/* Full 18-Role Catalog Drawer */}
                {showAllDemos && (
                  <div className="mt-3 pt-3 border-t border-dei-line dark:border-dei-dark-line space-y-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            selectedCategory === cat
                              ? 'bg-dei-emerald text-white'
                              : 'bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line text-dei-muted dark:text-dei-dark-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {filteredDemos.map((demo) => (
                        <div
                          key={demo.username}
                          onClick={() => handleSelectDemo(demo)}
                          className="flex items-center justify-between p-2.5 bg-white dark:bg-dei-dark-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-dei-line dark:border-dei-dark-line rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{demo.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-dei-ink dark:text-dei-dark-ink">{demo.full_name}</div>
                              <div className="text-[11px] text-dei-muted dark:text-dei-dark-muted">{demo.role_display} • <span className="font-mono text-dei-emerald dark:text-dei-emerald-neon">{demo.username}</span></div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-dei-emerald dark:text-dei-emerald-neon flex items-center gap-1">
                            Masuk <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                    Nama Pengguna (Username) atau Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dei-muted">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: admin atau santri.ziyad"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-dei-ink dark:text-dei-dark-ink text-sm focus:outline-none focus:ring-2 focus:ring-dei-emerald transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dei-muted">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-dei-ink dark:text-dei-dark-ink text-sm focus:outline-none focus:ring-2 focus:ring-dei-emerald transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-dei-muted hover:text-dei-ink"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl emerald-gradient-btn font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Memverifikasi akun...</span>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Registration Tab */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Nama Lengkap Calon Santri
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dei-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Contoh: Muhammad Abdullah Ziyad"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-dei-ink dark:text-dei-dark-ink text-sm focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Email atau Nomor WhatsApp Aktif
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dei-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Contoh: santribaru@darel-iman.or.id"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-dei-ink dark:text-dei-dark-ink text-sm focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Pilihan Jenjang Pendidikan Kesetaraan
                </label>
                <select
                  value={regProgram}
                  onChange={(e) => setRegProgram(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-dei-ink dark:text-dei-dark-ink text-sm focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                >
                  <option value="Paket A (Setara SD)">Paket A (Setara SD) — Program Tahfizh & Adab</option>
                  <option value="Paket B (Setara SMP)">Paket B (Setara SMP) — Kurikulum Merdeka + Diniyyah</option>
                  <option value="Paket C (Setara SMA - MIPA)">Paket C (Setara SMA) — Peminatan MIPA</option>
                  <option value="Paket C (Setara SMA - IPS)">Paket C (Setara SMA) — Peminatan IPS</option>
                  <option value="Santri Diaspora Luar Negeri">Santri Diaspora (Online Luar Negeri & Lintas Waktu)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dei-muted dark:text-dei-dark-muted mb-1.5">
                  Kata Sandi Akun Baru (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dei-muted">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Buat kata sandi akun..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line bg-white dark:bg-dei-dark-surface text-dei-ink dark:text-dei-dark-ink text-sm focus:outline-none focus:ring-2 focus:ring-dei-emerald"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl gold-gradient-btn font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Mendaftarkan santri...' : 'Kirim Pendaftaran Santri Baru'}
              </button>
            </form>
          )}

          {/* Security & System Info Footer */}
          <div className="pt-2 border-t border-dei-line dark:border-dei-dark-line flex items-center justify-between text-[11px] text-dei-muted dark:text-dei-dark-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-dei-emerald dark:text-dei-emerald-neon" />
              Sistem Terenkripsi JWT & GORM MySQL
            </span>
            <span className="font-mono">PKBM v2.0 • Go Fiber</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
