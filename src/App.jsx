import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import KbmPage from './pages/dashboard/KbmPage';
import PresensiPage from './pages/dashboard/PresensiPage';
import TahfizhPage from './pages/dashboard/TahfizhPage';
import CbtPage from './pages/dashboard/CbtPage';
import RaporPage from './pages/dashboard/RaporPage';
import PpdbPage from './pages/dashboard/PpdbPage';
import KeuanganPage from './pages/dashboard/KeuanganPage';
import DapodikPage from './pages/dashboard/DapodikPage';
import KemitraanPage from './pages/dashboard/KemitraanPage';
import MutuBscPage from './pages/dashboard/MutuBscPage';
import AiTutorPage from './pages/dashboard/AiTutorPage';
import { Sparkles, Construction, ArrowLeft, ShieldAlert } from 'lucide-react';
import { getAllowedMenusForRole } from './utils/rbac';

export const App = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    return isAuthenticated ? 'dashboard' : 'landing';
  });
  const [activeMenu, setActiveMenu] = useState(() => {
    const hash = window.location.hash.replace('#', '').trim();
    const validMenus = ['kbm', 'presensi', 'tahfizh', 'cbt', 'rapor', 'overview', 'ppdb', 'keuangan', 'dapodik', 'kemitraan', 'mutu', 'ai-tutor', 'status', 'program', 'kurikulum', 'berkas', 'biaya'];
    if (validMenus.includes(hash)) {
      return hash;
    }
    return 'overview';
  });

  const handleSetActiveMenu = (menu) => {
    setActiveMenu(menu);
    window.location.hash = menu;
  };

  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validMenus = ['kbm', 'presensi', 'tahfizh', 'cbt', 'rapor', 'overview', 'ppdb', 'keuangan', 'dapodik', 'kemitraan', 'mutu', 'ai-tutor', 'status', 'program', 'kurikulum', 'berkas', 'biaya'];
      if (validMenus.includes(hash)) {
        setActiveMenu(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
      const allowed = getAllowedMenusForRole(user);
      if (!allowed.includes(activeMenu)) {
        setActiveMenu('overview');
      }
    } else {
      setCurrentView('landing');
      setActiveMenu('overview');
    }
  }, [isAuthenticated, user?.role_name]);

  const renderDashboardContent = () => {
    if (user?.role_name === 'GUEST_PPDB') {
      return (
        <OverviewPage
          onNavigateHome={() => setCurrentView('landing')}
          onNavigateMenu={(menu) => handleSetActiveMenu(menu)}
          activeMenu={activeMenu}
        />
      );
    }

    // Role-based boundary guard
    const allowed = getAllowedMenusForRole(user);
    if (!allowed.includes(activeMenu)) {
      return (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-dei-ink dark:text-dei-dark-ink">
              Akses Terbatas untuk Peran Anda
            </h2>
            <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed max-w-md mx-auto">
              Modul ini bukan bagian dari wewenang atau tugas fungsi akun Anda. Silakan pilih modul kerja yang tersedia pada bilah navigasi samping.
            </p>
          </div>
          <button
            onClick={() => setActiveMenu('overview')}
            className="px-4 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Ringkasan
          </button>
        </div>
      );
    }

    switch (activeMenu) {
      case 'kbm':
        return <KbmPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'presensi':
        return <PresensiPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'tahfizh':
        return <TahfizhPage />;
      case 'cbt':
        return <CbtPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'rapor':
        return <RaporPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'ppdb':
        return <PpdbPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'keuangan':
        return <KeuanganPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'dapodik':
        return <DapodikPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'kemitraan':
        return <KemitraanPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'mutu':
        return <MutuBscPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'ai-tutor':
        return <AiTutorPage onNavigateMenu={(menu) => handleSetActiveMenu(menu)} />;
      case 'overview':
        return (
          <OverviewPage
            onNavigateHome={() => setCurrentView('landing')}
            onNavigateMenu={(menu) => handleSetActiveMenu(menu)}
          />
        );
      default:
        return (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line shadow-sm text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Construction className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modul Dalam Pengembangan</span>
              </div>
              <h2 className="text-xl font-extrabold text-dei-ink dark:text-dei-dark-ink">
                Modul Sedang Dipersiapkan
              </h2>
              <p className="text-xs text-dei-muted dark:text-dei-dark-muted leading-relaxed max-w-md mx-auto">
                Fitur ini sedang dalam proses konfigurasi lanjutan. Silakan gunakan modul kerja lain yang tersedia pada bilah navigasi samping.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleSetActiveMenu('kbm')}
                className="px-4 py-2.5 rounded-xl bg-dei-emerald text-white text-xs font-bold hover:bg-dei-emerald-dark transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                Buka KBM & Modul Ajar
              </button>
              <button
                onClick={() => handleSetActiveMenu('tahfizh')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                Buka Halaqah Tahfizh
              </button>
              <button
                onClick={() => handleSetActiveMenu('overview')}
                className="px-4 py-2.5 rounded-xl border border-dei-line dark:border-dei-dark-line text-dei-ink dark:text-dei-dark-ink text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Ringkasan
              </button>
            </div>
          </div>
        );
    }
  };

  if (isAuthenticated && currentView === 'dashboard') {
    return (
      <DashboardLayout
        onNavigateHome={() => setCurrentView('landing')}
        activeMenu={activeMenu}
        setActiveMenu={handleSetActiveMenu}
      >
        {renderDashboardContent()}
      </DashboardLayout>
    );
  }

  return (
    <LandingPage onNavigateDashboard={() => setCurrentView('dashboard')} />
  );
};

export default App;
