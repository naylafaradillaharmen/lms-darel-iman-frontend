import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = ({ onNavigateDashboard }) => {
  const {
    user,
    isAuthenticated,
    login,
    register,
    ppdbGuestLogin,
    demoAccounts,
    theme,
    toggleTheme,
    logout
  } = useAuth();

  // State: 'home' | 'login' | 'daftar'
  const [authView, setAuthView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProgram, setRegProgram] = useState('Paket C (setara SMA)');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Demo selector state
  const [showAllDemos, setShowAllDemos] = useState(false);
  const [selectedDemoCat, setSelectedDemoCat] = useState('Semua');

  const handleOpenAuth = (mode) => {
    if (mode === 'daftar') {
      handlePPDBGuestEntry();
      return;
    }
    setAuthView(mode);
    setLoginError('');
    setLoginSuccess('');
    setRegError('');
    setRegSuccess('');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setAuthView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    setLoginLoading(true);

    const res = await login(loginUser, loginPass);
    setLoginLoading(false);

    if (res.success) {
      setLoginSuccess(res.message);
      setTimeout(() => {
        if (onNavigateDashboard) onNavigateDashboard();
      }, 500);
    } else {
      setLoginError(res.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setRegError('');
    setRegSuccess('');
    setRegLoading(true);

    const res = await register({
      fullName: regName,
      email: regEmail,
      program: regProgram,
      password: regPassword,
    });
    setRegLoading(false);

    if (res.success) {
      setRegSuccess(res.message + ' Akun telah aktif. Mengalihkan ke sistem...');
      // Auto login with the newly created account immediately
      login(regEmail, regPassword).then((loginRes) => {
        if (loginRes.success) {
          setTimeout(() => {
            if (onNavigateDashboard) onNavigateDashboard();
          }, 600);
        } else {
          setAuthView('login');
          setLoginUser(regEmail);
          setLoginPass(regPassword);
        }
      });
    } else {
      setRegError(res.message);
    }
  };

  // 1-Click PPDB Guest Access (No email/password needed upfront)
  const handlePPDBGuestEntry = async () => {
    const res = await ppdbGuestLogin();
    if (res.success) {
      if (onNavigateDashboard) onNavigateDashboard();
    }
  };

  const handleSelectDemo = (demo) => {
    setLoginUser(demo.username);
    setLoginPass(demo.password);
    setLoginError('');
    login(demo.username, demo.password).then((res) => {
      if (res.success) {
        setLoginSuccess(`Login demo sebagai ${demo.role_display} berhasil!`);
        setTimeout(() => {
          if (onNavigateDashboard) onNavigateDashboard();
        }, 400);
      }
    });
  };

  const quickRoles = [
    { title: 'Super Admin', user: 'admin', pass: 'admin123', icon: '👑' },
    { title: 'Direktur PKBM', user: 'direktur', pass: 'direktur123', icon: '🎓' },
    { title: 'Tutor PAI', user: 'tutor.ahmad', pass: 'tutor123', icon: '📖' },
    { title: 'Santri Paket C', user: 'santri.ziyad', pass: 'santri123', icon: '🎒' },
    { title: 'Wali Kelas', user: 'wali.kelas', pass: 'walikelas123', icon: '📋' },
    { title: 'Manajer IT', user: 'manajer.it', pass: 'teknologi123', icon: '💻' },
  ];

  const categories = ['Semua', 'Pimpinan', 'Akademik', 'Kesiswaan', 'Teknologi', 'Keuangan'];

  const filteredDemos = demoAccounts.filter((d) => {
    if (selectedDemoCat === 'Semua') return true;
    return d.category === selectedDemoCat;
  });

  return (
    <div>
      {/* Header matching original PKBM Digital Dar El Iman (1).html */}
      <header className="site-header" id="top">
        <div className="wrap nav">
          <div className="brand" onClick={handleBackToHome}>
            <span className="mark" aria-hidden="true">إ</span>
            <span>
              PKBM Digital
              <small>Dar El Iman</small>
            </span>
          </div>

          <nav className={`links ${mobileMenuOpen ? 'open' : ''}`} aria-label="Navigasi utama">
            <a href="#beranda" onClick={handleBackToHome}>Beranda</a>
            <a href="#program" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('program')?.scrollIntoView(), 50); }}>Program Pendidikan</a>
            <a href="#fitur" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('fitur')?.scrollIntoView(), 50); }}>Fitur Pembelajaran</a>
            <a href="#tentang" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('tentang')?.scrollIntoView(), 50); }}>Tentang Kami</a>
            <a href="#faq" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('faq')?.scrollIntoView(), 50); }}>Bantuan</a>
            <div className="m-act">
              {isAuthenticated ? (
                <button className="btn btn-p" onClick={onNavigateDashboard}>
                  Dashboard ({user?.role_name})
                </button>
              ) : (
                <>
                  <button className="btn btn-s" onClick={() => handleOpenAuth('login')}>Masuk</button>
                  <button className="btn btn-p" onClick={handlePPDBGuestEntry}>Daftar</button>
                </>
              )}
            </div>
          </nav>

          <div className="actions">
            {isAuthenticated ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-p" onClick={onNavigateDashboard}>
                  Buka Dashboard ({user?.role_name})
                </button>
                <button className="btn btn-s" onClick={logout} style={{ minHeight: '40px', padding: '0 12px' }}>
                  Keluar
                </button>
              </div>
            ) : (
              <>
                <button id="btn-header-login" className="btn btn-g" onClick={() => handleOpenAuth('login')}>Masuk</button>
                <button id="btn-header-daftar" className="btn btn-p" onClick={handlePPDBGuestEntry}>Daftar Santri Baru</button>
              </>
            )}
          </div>

          <button
            className="theme-btn"
            id="theme"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          <button
            className="burger-btn"
            id="burger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Buka menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Conditional: HOME VIEW vs AUTH VIEW */}
      {authView === 'home' ? (
        <main id="home">
          {/* Hero Section */}
          <div id="beranda" className="hero">
            <div className="wrap">
              <div>
                <span className="ar" lang="ar" dir="rtl">اقرأ باسم ربك</span>
                <h1>Pendidikan kesetaraan yang bisa Anda ikuti dari mana saja.</h1>
                <p className="lead">
                  PKBM Digital Dar El Iman menghadirkan Paket A, B, dan C dengan pembelajaran daring yang terarah, bersama tutor yang mendampingi, di Indonesia maupun di luar negeri.
                </p>
                <div className="cta">
                  <button id="btn-hero-daftar" className="btn btn-p" onClick={handlePPDBGuestEntry}>
                    Daftar Santri Baru (Online) →
                  </button>
                  <button id="btn-hero-login" className="btn btn-s" onClick={() => handleOpenAuth('login')}>
                    Masuk ke LMS
                  </button>
                </div>
                <p className="note">Sudah punya akun? Gunakan tombol Masuk di kanan atas.</p>
              </div>

              {/* Interactive Preview Panel */}
              <div className="panel" aria-label="Contoh tampilan ruang belajar">
                <div className="panel-h">
                  <span>Ruang belajar peserta didik</span>
                  <span className="tag">Contoh tampilan</span>
                </div>
                <div className="row">
                  <b>08.00</b>
                  <span>Matematika<em>Kelas online bersama tutor</em></span>
                  <i className="pill">Live</i>
                </div>
                <div className="row">
                  <b>10.00</b>
                  <span>Bahasa Indonesia<em>Tugas: ringkasan teks</em></span>
                  <i className="pill">Tugas</i>
                </div>
                <div className="row">
                  <b>16.00</b>
                  <span>Setoran Tahfizh<em>Bersama pembimbing tahfizh</em></span>
                  <i className="pill">Tahfizh</i>
                </div>
                <div className="prog">
                  Progres belajar minggu ini
                  <div className="bar">
                    <i style={{ width: '68%' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Program Section */}
          <section id="program" className="alt">
            <div className="wrap">
              <div className="head">
                <h2>Program Pendidikan</h2>
                <p>
                  Tiga jenjang pendidikan kesetaraan yang setara dengan pendidikan formal. Pilih sesuai jenjang yang sedang Anda butuhkan.
                </p>
              </div>
              <div className="prg">
                <div className="prg-item">
                  <h3>
                    Paket A
                    <small>Setara SD</small>
                  </h3>
                  <p>
                    Dasar membaca, menulis, berhitung, dan wawasan keagamaan bagi peserta didik yang belum menamatkan pendidikan dasar.
                  </p>
                  <div className="ph">
                    <span>Terdaftar Resmi Kemendikbud</span>
                    <span>Kurikulum Merdeka & Adab Sunnah</span>
                  </div>
                </div>
                <div className="prg-item">
                  <h3>
                    Paket B
                    <small>Setara SMP</small>
                  </h3>
                  <p>
                    Memperkuat kemampuan akademik dan karakter untuk melanjutkan ke jenjang menengah atas atau dunia kerja.
                  </p>
                  <div className="ph">
                    <span>Kurikulum Merdeka + Diniyyah</span>
                    <span>Tahfizh 5 - 10 Juz Bersanad</span>
                  </div>
                </div>
                <div className="prg-item">
                  <h3>
                    Paket C
                    <small>Setara SMA</small>
                  </h3>
                  <p>
                    Menyiapkan peserta didik menuntaskan pendidikan menengah untuk studi lanjut, bekerja, atau berwirausaha.
                  </p>
                  <div className="ph">
                    <span>Peminatan MIPA & IPS</span>
                    <span>Persiapan PTN & Luar Negeri</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="fitur">
            <div className="wrap">
              <div className="head">
                <h2>Fitur Pembelajaran</h2>
                <p>
                  Semua kebutuhan belajar tersedia dalam satu akun, dapat diakses dari ponsel maupun komputer.
                </p>
              </div>
              <div className="feat">
                <div className="f big">
                  <div>
                    <span className="ar" lang="ar" dir="rtl">تحفيظ القرآن</span>
                    <h3>Tahfizh</h3>
                  </div>
                  <p>
                    Peserta didik menyetor hafalan dan memantau capaiannya bersama pembimbing, berdampingan dengan pelajaran akademik.
                  </p>
                </div>
                <div className="f">
                  <h3>Materi pembelajaran</h3>
                  <p>Materi, modul, dan bahan ajar tersusun per mata pelajaran, tersedia kapan pun Anda ingin mengulang.</p>
                </div>
                <div className="f">
                  <h3>Jadwal dan kelas online</h3>
                  <p>Lihat jadwal belajar dan ikuti kelas bersama tutor tanpa harus datang ke lokasi.</p>
                </div>
                <div className="f">
                  <h3>Tugas dan penilaian</h3>
                  <p>Kerjakan tugas, kirim jawaban, dan lihat nilai serta masukan dari tutor.</p>
                </div>
                <div className="f">
                  <h3>Ujian online</h3>
                  <p>Ikuti ujian secara daring sesuai jadwal yang ditetapkan lembaga.</p>
                </div>
                <div className="f">
                  <h3>Progres dan laporan belajar</h3>
                  <p>Pantau perkembangan belajar, baik oleh peserta didik sendiri maupun pihak yang berwenang mendampingi.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Steps Section */}
          <section className="alt">
            <div className="wrap">
              <div className="head">
                <h2>Alur belajar</h2>
                <p>Empat langkah sederhana untuk mulai menggunakan platform.</p>
              </div>
              <div className="steps">
                <div className="step">
                  <h3>Daftar atau masuk</h3>
                  <p>Buat akun baru, atau masuk jika Anda sudah memiliki akun.</p>
                </div>
                <div className="step">
                  <h3>Akses sesuai hak akses</h3>
                  <p>Program dan informasi yang tampil menyesuaikan peran dan status akun Anda.</p>
                </div>
                <div className="step">
                  <h3>Belajar dan kerjakan tugas</h3>
                  <p>Ikuti kelas, pelajari materi, dan selesaikan tugas yang diberikan.</p>
                </div>
                <div className="step">
                  <h3>Pantau perkembangan</h3>
                  <p>Lihat progres belajar dan hasil penilaian secara berkala.</p>
                </div>
              </div>
              <p className="callout">
                Membuat akun belum berarti otomatis diterima sebagai peserta didik. Status penerimaan ditetapkan oleh lembaga.
              </p>
            </div>
          </section>

          {/* About Section */}
          <section id="tentang">
            <div className="wrap about">
              <div>
                <h2>Tentang PKBM Digital Dar El Iman</h2>
                <p>
                  Pusat Kegiatan Belajar Masyarakat yang menyelenggarakan pendidikan kesetaraan secara digital, dengan pembelajaran akademik yang berjalan bersama pembinaan nilai-nilai Islam.
                </p>
                <p>
                  Platform ini dirancang agar mudah digunakan oleh peserta didik, orang tua, dan tutor, termasuk bagi mereka yang berada di luar negeri.
                </p>
              </div>
              <dl className="facts" style={{ margin: 0 }}>
                <div>
                  <dt>Visi</dt>
                  <dd>Membentuk generasi pembelajar mandiri yang beradab sunnah dan berdaya saing global.</dd>
                </div>
                <div>
                  <dt>Misi</dt>
                  <dd>Menyelenggarakan pendidikan kesetaraan terakreditasi berbasis teknologi dan sanad Al-Qur'an.</dd>
                </div>
                <div>
                  <dt>Penyelenggara</dt>
                  <dd>Yayasan Dar El Iman Padang, Sumatera Barat</dd>
                </div>
                <div>
                  <dt>Pimpinan</dt>
                  <dd>Ustadz H. Ridwan Abu Ziyad, Lc., M.Pd. (Direktur PKBM)</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="alt">
            <div className="wrap">
              <div className="head">
                <h2>Pertanyaan yang sering diajukan</h2>
              </div>
              <div className="faq">
                <details open>
                  <summary>Apa itu PKBM Digital Dar El Iman?</summary>
                  <div>
                    Lembaga pendidikan kesetaraan yang menyelenggarakan Paket A, B, dan C dengan pembelajaran digital melalui LMS terpadu.
                  </div>
                </details>
                <details>
                  <summary>Apa perbedaan Paket A, B, dan C?</summary>
                  <div>
                    Paket A setara SD, Paket B setara SMP, dan Paket C setara SMA. Pilihlah jenjang sesuai pendidikan terakhir Anda. Ijazah resmi negara ber-QR code dapat digunakan untuk studi lanjut (PTN/PTS) maupun dunia kerja.
                  </div>
                </details>
                <details>
                  <summary>Bagaimana cara mendaftar?</summary>
                  <div>
                    Pilih tombol <b>Daftar Sekarang</b>. Anda bisa langsung masuk ke Portal PPDB sebagai Guest Calon Santri untuk melengkapi formulir dan berkas tanpa kendala awal.
                  </div>
                </details>
                <details>
                  <summary>Bagaimana cara masuk ke LMS?</summary>
                  <div>
                    Pilih <b>Masuk</b>, lalu gunakan email/username dan kata sandi Anda. Anda juga dapat menggunakan tombol demo akun untuk menguji simulasi sistem.
                  </div>
                </details>
                <details>
                  <summary>Bagaimana jika saya mengalami kendala akses?</summary>
                  <div>
                    Hubungi sekretariat yayasan via WhatsApp di <b>+62 821-7000-0000</b> atau gunakan bantuan akun demo yang tersedia.
                  </div>
                </details>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* AUTH SCREEN (LOGIN & REGISTER with 18 DEMO ACCOUNTS) */
        <div id="auth">
          <div className="wrap">
            <div className="card">
              <span className="back" onClick={handleBackToHome}>
                ← Kembali ke beranda
              </span>

              {authView === 'login' ? (
                <div>
                  <h1>Masuk ke LMS</h1>
                  <p className="sub">Gunakan akun yang sudah terdaftar atau uji coba peran demo.</p>

                  {/* 18-Role Demo Quick Bar */}
                  <div style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Sparkles size={14} color="var(--gold)" />
                        AKUN DEMO CEPAT (1-KLIK LOGIN):
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--em)', fontWeight: 600 }}>Pilih langsung masuk</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {quickRoles.map((role) => (
                        <button
                          key={role.user}
                          id={`btn-demo-${role.user.replace('.', '-')}`}
                          type="button"
                          onClick={() => handleSelectDemo({ username: role.user, password: role.pass, role_display: role.title })}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>{role.icon}</span>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {role.title}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                              {role.user}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Expand all 18 demo roles */}
                    <button
                      type="button"
                      onClick={() => setShowAllDemos(!showAllDemos)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--em)',
                        fontSize: '12px',
                        fontWeight: 700,
                        width: '100%',
                        padding: '8px 0 0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      {showAllDemos ? (
                        <>Tutup Katalog Lengkap Demo <ChevronUp size={14} /></>
                      ) : (
                        <>Lihat Semua 18 Peran Demo (Pimpinan, IT, Mutu, dll) <ChevronDown size={14} /></>
                      )}
                    </button>

                    {showAllDemos && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {categories.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setSelectedDemoCat(c)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                border: '1px solid var(--line)',
                                background: selectedDemoCat === c ? 'var(--em)' : 'var(--surface)',
                                color: selectedDemoCat === c ? '#fff' : 'var(--muted)',
                                cursor: 'pointer'
                              }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>

                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {filteredDemos.map((demo) => (
                            <div
                              key={demo.username}
                              onClick={() => handleSelectDemo(demo)}
                              style={{
                                padding: '8px 10px',
                                background: 'var(--surface)',
                                border: '1px solid var(--line)',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>{demo.icon}</span>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>{demo.full_name}</div>
                                  <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{demo.role_display} • <code>{demo.username}</code></div>
                                </div>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--em)' }}>Masuk →</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {loginError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <AlertCircle size={16} />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {loginSuccess && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <CheckCircle2 size={16} />
                      <span>{loginSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit}>
                    <label htmlFor="le">Email atau Username</label>
                    <input
                      id="le"
                      type="text"
                      required
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      placeholder="admin, santri.ziyad, atau email Anda..."
                    />

                    <label htmlFor="lp">Kata sandi</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="lp"
                        type={showLoginPass ? 'text' : 'password'}
                        required
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--muted)'
                        }}
                      >
                        {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button id="btn-submit-login" className="btn btn-p" type="submit" disabled={loginLoading}>
                      {loginLoading ? 'Memverifikasi...' : 'Masuk ke LMS'}
                    </button>
                  </form>

                  <p className="swap" style={{ marginTop: '20px' }}>
                    Belum punya akun? Ingin daftar santri baru?{' '}
                    <a onClick={handlePPDBGuestEntry} style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--em)' }}>
                      Daftar Langsung (Guest PPDB) →
                    </a>
                  </p>
                </div>
              ) : (
                /* REDIRECT TO GUEST PPDB */
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <h1>Pendaftaran Santri Baru (PPDB)</h1>
                  <p className="sub" style={{ marginBottom: '20px' }}>
                    Pendaftaran santri baru dilakukan langsung melalui formulir online tanpa perlu membuat akun & kata sandi di awal.
                  </p>
                  <button
                    type="button"
                    onClick={handlePPDBGuestEntry}
                    className="btn btn-p"
                    style={{ width: '100%', minHeight: '44px', fontSize: '14px', fontWeight: 700 }}
                  >
                    Buka Dashboard Formulir PPDB Sekarang →
                  </button>
                  <p className="swap" style={{ marginTop: '20px' }}>
                    Sudah punya akun resmi? <a onClick={() => handleOpenAuth('login')}>Masuk ke LMS</a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer matching PKBM Digital Dar El Iman (1).html */}
      <footer className="site-footer">
        <div className="wrap">
          <div className="g">
            <div>
              <h4>PKBM Digital Dar El Iman</h4>
              <p>Pendidikan kesetaraan Paket A, B, dan C dengan pembelajaran digital dan bimbingan tahfizh bersanad.</p>
            </div>
            <div>
              <h4>Navigasi</h4>
              <a href="#program" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('program')?.scrollIntoView(), 50); }}>Program Pendidikan</a>
              <a href="#fitur" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('fitur')?.scrollIntoView(), 50); }}>Fitur Pembelajaran</a>
              <a href="#tentang" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('tentang')?.scrollIntoView(), 50); }}>Tentang Kami</a>
              <a href="#faq" onClick={() => { handleBackToHome(); setTimeout(() => document.getElementById('faq')?.scrollIntoView(), 50); }}>Bantuan</a>
            </div>
            <div>
              <h4>Kontak</h4>
              <span className="ph-inline">Padang, Sumatera Barat</span><br />
              <span className="ph-inline">pkbm@darel-iman.or.id</span><br />
              <span className="ph-inline">+62 821-7000-0000</span><br />
              <span className="ph-inline">Akreditasi A Kemendikbudristek</span>
            </div>
          </div>
          <p className="copy">© 2026 PKBM Digital Dar El Iman. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
