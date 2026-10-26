import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  UserCheck,
  Award,
  FileCheck,
  CreditCard,
  Settings,
  LogOut,
  Clock,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Database,
  Cpu,
  Layers,
  Globe,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

import { getAllowedMenusForRole } from '../../utils/rbac';

export const DashboardLayout = ({
  children,
  onNavigateHome,
  activeMenu = 'overview',
  setActiveMenu = () => {}
}) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [timezone, setTimezone] = useState('WIB');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    if (onNavigateHome) onNavigateHome();
  };

  const isGuestPPDB = user?.role_name === 'GUEST_PPDB';

  const guestCategories = [
    {
      title: 'Alur Pendaftaran PPDB',
      items: [
        { id: 'overview', label: 'Formulir Pendaftaran', icon: LayoutDashboard },
        { id: 'status', label: 'Status & Tracking PPDB', icon: UserCheck },
        { id: 'program', label: 'Pilihan Program Kesetaraan', icon: BookOpen },
        { id: 'kurikulum', label: 'Kurikulum & Tahfizh', icon: Award },
        { id: 'berkas', label: 'Unggah Berkas Persyaratan', icon: FileCheck },
        { id: 'biaya', label: 'Informasi Biaya & SPP', icon: CreditCard },
      ],
    },
  ];

  const standardCategories = [
    {
      title: 'Utama',
      items: [
        { id: 'overview', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Akademik & Pembelajaran',
      items: [
        { id: 'kbm', label: 'KBM & Modul Ajar', icon: BookOpen },
        { id: 'presensi', label: 'Presensi & Kehadiran', icon: UserCheck },
        { id: 'tahfizh', label: 'Halaqah & Tahfizh', icon: Award },
      ],
    },
    {
      title: 'Asesmen & Kelulusan',
      items: [
        { id: 'cbt', label: 'CBT & Ujian Online', icon: ShieldCheck },
        { id: 'rapor', label: 'E-Rapor Ber-QR Code', icon: FileCheck },
      ],
    },
    {
      title: 'Administrasi & Operasional',
      items: [
        { id: 'ppdb', label: 'Penerimaan Santri (PPDB)', icon: GraduationCap },
        { id: 'keuangan', label: 'Keuangan & Tagihan SPP', icon: CreditCard },
        { id: 'dapodik', label: 'Sinkronisasi Dapodik', icon: Database },
      ],
    },
    {
      title: 'Mutu & Pengembangan',
      items: [
        { id: 'kemitraan', label: 'Kemitraan & Diaspora', icon: Globe },
        { id: 'mutu', label: 'Penjaminan Mutu & BSC', icon: TrendingUp },
        { id: 'ai-tutor', label: 'Tutor AI & Tanya Ustadz', icon: Sparkles },
      ],
    },
  ];

  // Filter menu secara ketat sesuai peran (Role-Based Menu Scope)
  const allowedMenuIds = getAllowedMenusForRole(user);
  const categories = isGuestPPDB
    ? guestCategories
    : standardCategories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) => allowedMenuIds.includes(item.id)),
        }))
        .filter((cat) => cat.items.length > 0);

  const allNavItems = categories.flatMap((cat) => cat.items);
  const currentActiveItem = allNavItems.find((n) => n.id === activeMenu);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-dei-bg dark:bg-dei-dark-bg text-dei-ink dark:text-dei-dark-ink">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* ======================================================== */}
      {/* 1. SIDEBAR (DOCK KIRI PENUH - TIDAK BISA MENIMPA NAVBAR) */}
      {/* ======================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dei-dark-surface border-r border-dei-line dark:border-dei-dark-line flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
        }`}
      >
        {/* Brand Header di Bagian Atas Sidebar */}
        <div className="h-16 px-4 border-b border-dei-line dark:border-dei-dark-line flex items-center justify-between flex-shrink-0">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-dei-emerald flex items-center justify-center text-white shadow-sm group-hover:bg-dei-emerald-dark transition-colors">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-dei-ink dark:text-dei-dark-ink flex items-center gap-1.5 leading-none">
                PKBM DIGITAL
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-dei-emerald dark:text-dei-emerald-neon">
                  LMS v2.0
                </span>
              </div>
              <p className="text-[10px] text-dei-muted dark:text-dei-dark-muted mt-1 leading-none">
                Portal Pembelajaran & Tahfizh
              </p>
            </div>
          </button>

          {/* Tombol Tutup Khusus Mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg border border-dei-line dark:border-dei-dark-line text-dei-muted hover:text-dei-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daftar Navigasi Menu (Scrollable Mandiri Berdasarkan Kategori) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-1">
              <div className="text-[10px] font-extrabold text-dei-muted dark:text-dei-dark-muted uppercase tracking-wider px-3 py-1">
                {cat.title}
              </div>
              <div className="space-y-0.5">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-item-${item.id}`}
                      onClick={() => {
                        if (setActiveMenu && item.id) {
                          setActiveMenu(item.id);
                        }
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-dei-emerald text-white shadow-sm font-bold'
                          : 'text-dei-ink/80 dark:text-dei-dark-ink/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-dei-ink dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-dei-emerald dark:text-dei-emerald-neon'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Info Stack & Status Server di Bagian Bawah Sidebar */}
        <div className="p-3 border-t border-dei-line dark:border-dei-dark-line flex-shrink-0 bg-neutral-50/60 dark:bg-dei-dark-bg/40">
          <div className="p-2.5 rounded-xl bg-white dark:bg-dei-dark-surface border border-dei-line dark:border-dei-dark-line text-[11px] space-y-1">
            <div className="font-bold flex items-center justify-between text-dei-emerald dark:text-dei-emerald-neon text-[10px] uppercase">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Stack Terkini:
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Air Active
              </span>
            </div>
            <div className="text-dei-muted dark:text-dei-dark-muted flex justify-between text-[10px]">
              <span>Backend:</span>
              <span className="font-semibold text-dei-ink dark:text-dei-dark-ink font-mono">Go Fiber v2</span>
            </div>
            <div className="text-dei-muted dark:text-dei-dark-muted flex justify-between text-[10px]">
              <span>Database:</span>
              <span className="font-semibold text-dei-ink dark:text-dei-dark-ink font-mono">MySQL (GORM)</span>
            </div>
            <div className="text-dei-muted dark:text-dei-dark-muted flex justify-between text-[10px]">
              <span>Frontend:</span>
              <span className="font-semibold text-dei-ink dark:text-dei-dark-ink font-mono">React 18 + Vite</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. KOLOM UTAMA (TOPBAR NAVBAR + KONTEN HALAMAN) */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar Navigation (Mulai dari sebelah kanan sidebar) */}
        <header className="h-16 bg-white dark:bg-dei-dark-surface border-b border-dei-line dark:border-dei-dark-line flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Hanya Muncul di Layar Mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-dei-line dark:border-dei-dark-line text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Halaman Aktif */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-dei-muted dark:text-dei-dark-muted">
              <span>Portal PKBM</span>
              <ChevronRight className="w-3.5 h-3.5 text-dei-line dark:text-dei-dark-line" />
              <span className="font-bold text-dei-ink dark:text-dei-dark-ink">
                {currentActiveItem?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Jam Realtime & Kalender Hijriyah */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-dei-bg dark:bg-dei-dark-bg border border-dei-line dark:border-dei-dark-line text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-dei-emerald dark:text-dei-emerald-neon" />
            <span className="font-mono font-bold text-dei-ink dark:text-dei-dark-ink">{timeStr}</span>
            <span className="text-dei-muted dark:text-dei-dark-muted">({timezone})</span>
            <span className="text-dei-line dark:text-dei-dark-line">|</span>
            <span className="text-dei-gold text-[11px] font-bold">Ahad, 18 Rabi'ul Akhir 1448 H</span>
          </div>

          {/* Baris User & Aksi Kanan */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-dei-line dark:border-dei-dark-line">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center font-bold text-dei-emerald dark:text-dei-emerald-neon text-xs">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold leading-tight truncate max-w-[140px]">
                  {user?.full_name || 'Pengguna'}
                </div>
                <div className="text-[10px] font-semibold text-dei-emerald dark:text-dei-emerald-neon">
                  {isGuestPPDB ? 'CALON SANTRI (PPDB)' : (user?.role_display || user?.role_name || (user?.username === 'admin' ? 'SUPER ADMIN YAYASAN' : 'SANTRI'))}
                </div>
              </div>
            </div>

            {/* Tombol Logout */}
            <button
              onClick={handleLogout}
              title="Keluar dari Portal"
              className="p-2 rounded-xl border border-dei-line dark:border-dei-dark-line hover:border-red-300 text-dei-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Area Konten Halaman (Scrollable Mandiri) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
