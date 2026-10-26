import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  User,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  PlusCircle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Compass,
  FileText,
  UserCheck,
  Globe,
  Share2,
  Key,
  Settings,
  X,
  Search,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  MessageCircle,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AiMarkdownRenderer from '../../components/common/AiMarkdownRenderer';
const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Asatidzah Reference List
const USTADZ_DIRECTORY = [
  {
    id: 'ust-001',
    name: 'Ustadz Ahmad Fauzi, Lc.',
    subject: "Tahfizh Al-Qur'an & Ulumul Syar'i",
    avatar: 'AF',
    color: 'bg-emerald-700',
    status: 'online',
    lastSeen: 'online'
  },
  {
    id: 'ust-002',
    name: 'Ustadz Ilham Pratama, S.Pd., M.Si.',
    subject: 'Matematika & Sains Terpadu',
    avatar: 'IP',
    color: 'bg-blue-700',
    status: 'online',
    lastSeen: 'online'
  },
  {
    id: 'ust-003',
    name: 'Ustadzah Fatimah Azzahra, M.Pd.',
    subject: 'Bahasa Arab & Sastra Inggris',
    avatar: 'FA',
    color: 'bg-teal-700',
    status: 'online',
    lastSeen: 'hari ini pukul 11:20'
  },
  {
    id: 'ust-004',
    name: 'Ustadz Dr. Salman Al-Farisi',
    subject: 'Konseling Akademik & Diaspora',
    avatar: 'SA',
    color: 'bg-amber-700',
    status: 'online',
    lastSeen: 'hari ini pukul 09:45'
  }
];

// Santri Reference List (For Ustadz View & Two-Way Interaction)
const SANTRI_DIRECTORY = [
  {
    id: 'st-001',
    name: 'Ziyad Abdullah',
    package: 'Paket B (Setara SMP)',
    avatar: 'ZA',
    color: 'bg-emerald-600',
    status: 'online',
    lastSeen: 'online'
  },
  {
    id: 'st-002',
    name: 'Muhammad Fatih',
    package: 'Paket C (Setara SMA)',
    avatar: 'MF',
    color: 'bg-blue-600',
    status: 'online',
    lastSeen: 'online'
  },
  {
    id: 'st-003',
    name: 'Aisyah Humaira',
    package: 'Paket B (Setara SMP)',
    avatar: 'AH',
    color: 'bg-teal-600',
    status: 'online',
    lastSeen: 'hari ini pukul 09:30'
  },
  {
    id: 'st-004',
    name: 'Ridho Pratama',
    package: 'Paket C (Setara SMA)',
    avatar: 'RP',
    color: 'bg-amber-600',
    status: 'online',
    lastSeen: 'kemarin'
  }
];

// Initial Two-Way Chat Threads Keyed by santriId__ustadzId
const INITIAL_THREADS = {
  'st-001__ust-001': [
    {
      id: 'm-za-1',
      senderRole: 'santri',
      senderName: 'Ziyad Abdullah',
      text: "Assalamu'alaikum Ustadz Fauzi. Izin konsultasi, untuk setoran hafalan surah Al-Mulk ayat 1-15 apakah bisa dijadwalkan besok bada ashar?",
      time: '08:20',
      status: 'read'
    },
    {
      id: 'm-za-2',
      senderRole: 'ustadz',
      senderName: 'Ustadz Ahmad Fauzi, Lc.',
      text: "Wa'alaikumsalam warahmatullah Ziyad. Na'am, insyaAllah besok halaqah bada ashar kita buka di Google Meet. Siapkan makhraj huruf 'Ain dan Ha' dengan mutqin ya.",
      time: '08:25',
      status: 'read'
    }
  ],
  'st-002__ust-001': [
    {
      id: 'm-mf-1',
      senderRole: 'santri',
      senderName: 'Muhammad Fatih',
      text: "Assalamu'alaikum Ustadz. Izin bertanya mengenai bacaan Mad Lazim Mutsaqqal Kilmi di Surah Al-Haqqah, apakah wajib dibaca 6 harakat?",
      time: '08:32',
      status: 'read'
    },
    {
      id: 'm-mf-2',
      senderRole: 'ustadz',
      senderName: 'Ustadz Ahmad Fauzi, Lc.',
      text: "Wa'alaikumsalam Fatih. Barakallahu feek. Benar ananda, wajib dipanjangkan 6 harakat penuh, dan ada penekanan lembut (nabr) pada huruf yang bertasydid setelah huruf mad ya.",
      time: '08:35',
      status: 'read'
    }
  ],
  'st-002__ust-002': [
    {
      id: 'm-mf-math-1',
      senderRole: 'santri',
      senderName: 'Muhammad Fatih',
      text: "Ustadz, di modul KBM aljabar nomor 4 metode eliminasi, apakah variabel x harus selalu dihilangkan dulu?",
      time: '09:18',
      status: 'read'
    },
    {
      id: 'm-mf-math-2',
      senderRole: 'ustadz',
      senderName: 'Ustadz Ilham Pratama, S.Pd.',
      text: "Tidak harus x, ananda bisa memilih variabel mana saja yang koefisiennya lebih sederhana atau memiliki tanda berlawanan (+ dan -) agar perhitungannya lebih cepat.",
      time: '09:20',
      status: 'read'
    }
  ],
  'st-003__ust-003': [
    {
      id: 'm-ah-1',
      senderRole: 'santri',
      senderName: 'Aisyah Humaira',
      text: "Assalamu'alaikum Ustadzah Fatimah. Izin bertanya perbedaan penggunaan dhomir 'Huma' dan 'Hum' dalam percakapan sehari-hari.",
      time: '10:10',
      status: 'read'
    },
    {
      id: 'm-ah-2',
      senderRole: 'ustadz',
      senderName: 'Ustadzah Fatimah Azzahra, M.Pd.',
      text: "Wa'alaikumsalam Aisyah. Dhomir 'Huma' (هما) khusus untuk dua orang (mutsanna), sedangkan 'Hum' (هم) untuk tiga orang atau lebih (jamak mudzakkar) ya ananda.",
      time: '10:15',
      status: 'read'
    }
  ],
  'st-004__ust-001': [
    {
      id: 'm-rp-1',
      senderRole: 'santri',
      senderName: 'Ridho Pratama',
      text: "Assalamu'alaikum ustadz, konfirmasi kesiapan jadwal wawancara dan placement test daring tahfizh.",
      time: 'Kemarin',
      status: 'read'
    }
  ]
};

export const AiTutorPage = ({ onNavigateMenu }) => {
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState('ai'); // 'ai' | 'consultation'

  // Determine whether current user acts as Ustadz or Santri in WhatsApp chat
  const isActualUstadz = user?.role_name === 'TUTOR' || user?.role_name === 'WALI_KELAS' || user?.role_name === 'GURU' || user?.username?.startsWith('tutor.');
  const isActualSantri = user?.role_name === 'SISWA' || user?.role_name === 'WALI_SANTRI' || user?.username?.startsWith('santri');
  const isStaffOrAdmin = !isActualUstadz && !isActualSantri;

  // Strictly bind role view according to user account
  const [chatRoleView, setChatRoleView] = useState(() => isActualUstadz ? 'ustadz' : 'santri');

  useEffect(() => {
    if (isActualUstadz) {
      setChatRoleView('ustadz');
    } else if (isActualSantri) {
      setChatRoleView('santri');
    }
  }, [isActualUstadz, isActualSantri]);

  // ==========================================
  // GROQ API KEY & MODEL STATE
  // ==========================================
  const [groqApiKey, setGroqApiKey] = useState(() => {
    return localStorage.getItem('pkbm_groq_api_key') || DEFAULT_GROQ_KEY;
  });
  const [groqModel, setGroqModel] = useState(() => {
    const saved = localStorage.getItem('pkbm_groq_model');
    if (saved && saved !== 'llama-3.3-70b-versatile') return saved;
    return 'openai/gpt-oss-120b';
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [inputApiKey, setInputApiKey] = useState(DEFAULT_GROQ_KEY);
  const [apiKeySaveSuccess, setApiKeySaveSuccess] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('pkbm_groq_api_key')) {
      localStorage.setItem('pkbm_groq_api_key', DEFAULT_GROQ_KEY);
    }
    if (!localStorage.getItem('pkbm_groq_model') || localStorage.getItem('pkbm_groq_model') === 'llama-3.3-70b-versatile') {
      localStorage.setItem('pkbm_groq_model', 'openai/gpt-oss-120b');
    }
  }, []);

  // ==========================================
  // AI TUTOR CONVERSATION STATE
  // ==========================================
  const [aiMessages, setAiMessages] = useState([
    {
      id: 'msg-init-1',
      sender_type: 'ASSISTANT',
      content: "Ahlan wa Sahlan! Saya **Tutor AI PKBM Digital Dar El Iman** berbasis **Groq Deep Reasoning Engine**.\n\nSaya asisten belajar cerdas 24/7 yang siap menjawab pertanyaanmu secara komprehensif, akademis, dan bernas seputar Fiqih, Tahfizh/Tajwid, Matematika, IPA, Bahasa Arab, hingga panduan santri diaspora.\n\nApa materi yang ingin kita pelajari bersama hari ini?",
      created_at: new Date().toISOString()
    }
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiChatEndRef = useRef(null);

  // ==========================================
  // TWO-WAY WHATSAPP CONSULTATION CHAT STATE
  // ==========================================
  const [allThreads, setAllThreads] = useState(() => {
    const saved = localStorage.getItem('pkbm_whatsapp_threads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed['st-001__ust-001']) return parsed;
      } catch (e) {}
    }
    return INITIAL_THREADS;
  });

  // Selected contact states
  const [selectedSantriId, setSelectedSantriId] = useState(() => {
    if (user?.full_name?.toLowerCase().includes('ziyad')) return 'st-001';
    if (user?.full_name?.toLowerCase().includes('fatih')) return 'st-002';
    if (user?.full_name?.toLowerCase().includes('aisyah')) return 'st-003';
    if (user?.full_name?.toLowerCase().includes('ridho')) return 'st-004';
    return 'st-001'; // Default: Ziyad Abdullah
  });
  const [selectedUstadzId, setSelectedUstadzId] = useState('ust-001'); // Default: Ustadz Ahmad Fauzi, Lc.
  const [chatInputText, setChatInputText] = useState('');
  const [consultNotice, setConsultNotice] = useState('');
  const consultChatEndRef = useRef(null);

  const selectedUstadz = USTADZ_DIRECTORY.find(u => u.id === selectedUstadzId) || USTADZ_DIRECTORY[0];
  const selectedSantri = SANTRI_DIRECTORY.find(s => s.id === selectedSantriId) || SANTRI_DIRECTORY[0];

  const activeThreadKey = `${selectedSantriId}__${selectedUstadzId}`;
  const activeChatMessages = allThreads[activeThreadKey] || [];

  useEffect(() => {
    localStorage.setItem('pkbm_whatsapp_threads', JSON.stringify(allThreads));
  }, [allThreads]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiLoading]);

  useEffect(() => {
    consultChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allThreads, activeThreadKey]);

  // ==========================================
  // REAL GROQ API CALL WITH MULTI-MODEL FALLBACK
  // ==========================================
  const handleSendAiMessage = async (customPrompt) => {
    const prompt = customPrompt || aiInputText;
    if (!prompt.trim() || isAiLoading) return;

    const userMessage = {
      id: 'msg-' + Date.now(),
      sender_type: 'USER',
      content: prompt.trim(),
      created_at: new Date().toISOString()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInputText('');
    setIsAiLoading(true);

    const activeKey = groqApiKey || DEFAULT_GROQ_KEY;
    const systemPrompt = `Anda adalah Tutor AI Resmi PKBM Digital Dar El Iman Padang (Pusat Kegiatan Belajar Masyarakat berasaskan Sunnah dan Kurikulum Merdeka Kemendikbudristek).
Karakteristik & Ketentuan Jawaban:
1. Jawab secara cerdas, mendalam, akademis, dan ramah seperti ChatGPT/GPT-4o.
2. Gunakan sapaan dan adab santun Islami (Ahlan wa sahlan, Barakallahu feek jika relevan).
3. Berikan rincian terstruktur dengan poin-poin jelas, langkah pengerjaan matematika/IPA yang runut, atau dalil Al-Qur'an/Hadits shahih bila terkait fiqih.
4. Jangan pernah menolak pertanyaan pembelajaran santri Paket A, B, atau C.`;

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...aiMessages.slice(-5).map(m => ({
        role: m.sender_type === 'USER' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: prompt.trim() }
    ];

    // Priority sequence of models to try
    const modelsToTry = [
      groqModel || 'openai/gpt-oss-120b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b'
    ];
    const uniqueModels = [...new Set(modelsToTry)];

    for (const modelCandidate of uniqueModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`
          },
          body: JSON.stringify({
            model: modelCandidate,
            messages: messagesPayload,
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (res.ok) {
          const data = await res.json();
          const responseText = data.choices?.[0]?.message?.content;
          if (responseText) {
            setAiMessages(prev => [
              ...prev,
              {
                id: 'msg-' + (Date.now() + 1),
                sender_type: 'ASSISTANT',
                content: responseText,
                created_at: new Date().toISOString(),
                source: `Groq Cloud (${modelCandidate.split('/')[1] || modelCandidate})`
              }
            ]);
            setIsAiLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(`Groq candidate ${modelCandidate} failed:`, err);
      }
    }

    // High quality offline fallback if network/Groq quota is exhausted
    setTimeout(() => {
      setAiMessages(prev => [
        ...prev,
        {
          id: 'msg-' + (Date.now() + 1),
          sender_type: 'ASSISTANT',
          content: `Barakallahu feek atas pertanyaanmu mengenai: **"${prompt}"**.\n\nDalam kurikulum Merdeka Terpadu PKBM Dar El Iman, topik ini mencakup pemahaman konsep esensial, pembiasaan akhlaq karimah, dan penerapan studi mandiri. Silakan telaah modul terkait pada menu KBM atau berkonsultasi langsung dengan ustadz pengampu di tab sebelah!`,
          created_at: new Date().toISOString(),
          source: 'Offline Fallback'
        }
      ]);
      setIsAiLoading(false);
    }, 600);
  };

  // ==========================================
  // WHATSAPP TWO-WAY SEND MESSAGE (NO INSTANT BOT)
  // ==========================================
  const handleSendConsultMessage = (customText) => {
    const text = customText || chatInputText;
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const currentThread = allThreads[activeThreadKey] || [];

    if (chatRoleView === 'santri') {
      // Sent by Santri to Ustadz
      const newMsg = {
        id: 'm-' + Date.now(),
        senderRole: 'santri',
        senderName: selectedSantri.name,
        text: text.trim(),
        time: timeStr,
        status: 'sent'
      };

      const updated = [...currentThread, newMsg];
      setAllThreads(prev => ({ ...prev, [activeThreadKey]: updated }));
      setChatInputText('');

      // Helpful feedback note explaining the 2-way manual dynamic
      setConsultNotice(`Pesan terkirim ke ${selectedUstadz.name}! Menunggu balasan manual ustadz (Beralih ke "Mode Ustadz" di kanan atas untuk membalas).`);
      setTimeout(() => setConsultNotice(''), 7000);

    } else {
      // Sent by Ustadz manually to Santri
      // Mark all previous santri messages as read (double blue check)
      const readPrior = currentThread.map(m => m.senderRole === 'santri' ? { ...m, status: 'read' } : m);

      const newMsg = {
        id: 'm-' + Date.now(),
        senderRole: 'ustadz',
        senderName: selectedUstadz.name,
        text: text.trim(),
        time: timeStr,
        status: 'read'
      };

      const updated = [...readPrior, newMsg];
      setAllThreads(prev => ({ ...prev, [activeThreadKey]: updated }));
      setChatInputText('');

      setConsultNotice(`Balasan manual berhasil dikirim ke ${selectedSantri.name}!`);
      setTimeout(() => setConsultNotice(''), 5000);
    }
  };

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dei-emerald-dark via-dei-emerald to-emerald-900 p-6 sm:p-7 text-white shadow-lg border border-emerald-700/30">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <Bot className="w-72 h-72" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Layanan Bimbingan Cerdas & Konsultasi Asatidzah 24/7</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Bot className="w-8 h-8 text-amber-300" />
              Tutor AI Cerdas & Chat Konsultasi Asatidzah
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Tanya jawab bebas kurikulum, latihan soal, dan kajian fiqih ditenagai <b>Groq Generative AI (GPT-OSS 120B / Qwen 27B)</b>, atau chat langsung bersama Asatidzah dua arah layaknya WhatsApp resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setInputApiKey(groqApiKey);
                setShowApiKeyModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Key className="w-4 h-4 text-amber-300" />
              <span>Model: {groqModel.split('/')[1] || groqModel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Navigasi Dua Tab Utama & Switcher Mode Konsultasi */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dei-line pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab('ai')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeMainTab === 'ai'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-dei-muted hover:text-dei-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Bot className="w-4 h-4 text-amber-300" />
            <span>🤖 Asisten AI 24/7 (Groq Cloud)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('consultation')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeMainTab === 'consultation'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-dei-muted hover:text-dei-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>💬 Chat Konsultasi Dua Arah (WhatsApp Room)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

        {/* Secure Role Identification Badge for WhatsApp Room */}
        {activeMainTab === 'consultation' && (
          <div>
            {isActualSantri && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 rounded-2xl text-xs font-bold border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>🎓 Portal Santri: {user?.full_name || 'Muhammad Abdullah Ziyad'}</span>
              </div>
            )}
            {isActualUstadz && (
              <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 px-4 py-2 rounded-2xl text-xs font-bold border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>👳 Portal Asatidzah Pembimbing: {user?.full_name || 'Ustadz Ahmad Fauzi, Lc.'}</span>
              </div>
            )}
            {isStaffOrAdmin && (
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <span className="text-[11px] text-dei-muted px-2 hidden sm:inline">Supervisi Admin Yayasan:</span>
                <button
                  type="button"
                  onClick={() => setChatRoleView('santri')}
                  className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                    chatRoleView === 'santri'
                      ? 'bg-emerald-700 text-white shadow-md'
                      : 'text-dei-muted hover:text-dei-ink'
                  }`}
                >
                  <span>🎓 Sisi Santri</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatRoleView('ustadz')}
                  className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                    chatRoleView === 'ustadz'
                      ? 'bg-teal-700 text-white shadow-md'
                      : 'text-dei-muted hover:text-dei-ink'
                  }`}
                >
                  <span>👳 Sisi Asatidzah</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ASISTEN AI 24/7 (POWERED BY REAL GROQ API) */}
      {/* ======================================================== */}
      {activeMainTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in fade-in">
          {/* Kolom Kiri: Riwayat Sesi & Model Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-dei-dark-surface border border-dei-line rounded-3xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-dei-muted uppercase tracking-wider text-[10px]">
                  Model AI Aktif
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Groq Cloud
                </span>
              </div>
              <div className="font-black text-sm text-emerald-800 dark:text-emerald-300">
                {groqModel}
              </div>
              <p className="text-[11px] text-dei-muted leading-relaxed">
                Generative reasoning berkecepatan tinggi dengan pemahaman kurikulum Merdeka, adab Islam, serta matematika & sains.
              </p>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="w-full py-2 rounded-xl border border-emerald-300 text-emerald-700 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                Ganti Model & Kunci API
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="bg-white dark:bg-dei-dark-surface border border-dei-line rounded-3xl p-5 shadow-sm space-y-2 text-xs">
              <span className="font-bold text-dei-muted uppercase tracking-wider text-[10px] block">
                Contoh Pertanyaan Cepat:
              </span>
              <button
                onClick={() => handleSendAiMessage('Jelaskan rukun wudhu dan sunnahnya sesuai hadits shahih.')}
                className="w-full text-left p-2.5 rounded-xl border border-dei-line hover:border-emerald-500 font-semibold text-dei-ink hover:text-emerald-700 transition-colors"
              >
                📖 Rukun Wudhu & Dalil Sunnah
              </button>
              <button
                onClick={() => handleSendAiMessage('Bagaimana cara menyelesaikan sistem persamaan linier aljabar Paket C?')}
                className="w-full text-left p-2.5 rounded-xl border border-dei-line hover:border-emerald-500 font-semibold text-dei-ink hover:text-emerald-700 transition-colors"
              >
                📐 Aljabar & SPLDV Paket C
              </button>
              <button
                onClick={() => handleSendAiMessage('Bagaimana aturan perbedaan waktu CBT bagi santri diaspora di Timur Tengah?')}
                className="w-full text-left p-2.5 rounded-xl border border-dei-line hover:border-emerald-500 font-semibold text-dei-ink hover:text-emerald-700 transition-colors"
              >
                🌍 Kebijakan Waktu Santri Diaspora
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Main Chat Box */}
          <div className="lg:col-span-3 bg-white dark:bg-dei-dark-surface border border-dei-line rounded-3xl shadow-sm overflow-hidden flex flex-col h-[650px]">
            {/* Top Bar Chat */}
            <div className="p-4 border-b border-dei-line flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-md">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-dei-ink dark:text-dei-dark-ink flex items-center gap-2">
                    Tutor AI Kurikulum & Syar'i
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                      {groqModel.split('/')[1] || groqModel}
                    </span>
                  </h3>
                  <p className="text-[11px] text-dei-muted">
                    Respon cerdas, akurat, mendalam, dan bebas template kaku
                  </p>
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {aiMessages.map((msg, index) => {
                const isAi = msg.sender_type === 'ASSISTANT';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex gap-3 max-w-3xl ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isAi ? 'bg-emerald-700 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'
                      }`}
                    >
                      {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isAi
                          ? 'bg-neutral-50 dark:bg-neutral-800 text-dei-ink dark:text-dei-dark-ink border border-neutral-200 dark:border-neutral-700 shadow-sm'
                          : 'bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      <div className="font-normal space-y-1">
                        {isAi ? (
                          <AiMarkdownRenderer content={msg.content} />
                        ) : (
                          <div className="whitespace-pre-line">{msg.content}</div>
                        )}
                      </div>

                      <div
                        className={`text-[10px] mt-2 flex items-center gap-1 ${
                          isAi ? 'text-neutral-400' : 'text-emerald-200 justify-end'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : 'Baru saja'}
                        </span>
                        {isAi && msg.source && (
                          <span className="ml-2 font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">• {msg.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex gap-3 max-w-xl mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-3 text-xs text-dei-muted flex items-center gap-2 border border-neutral-200 dark:border-neutral-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Tutor AI sedang berpikir dan merumuskan jawaban mendalam...</span>
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-dei-line bg-white dark:bg-dei-dark-surface">
              <div className="flex items-center gap-2">
                <textarea
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Ketik pertanyaan pelajaran, dalil fiqih, atau latihan soal di sini..."
                  className="flex-1 resize-none px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs sm:text-sm border border-transparent focus:border-emerald-600 focus:outline-none transition-all"
                />
                <button
                  onClick={() => handleSendAiMessage()}
                  disabled={!aiInputText.trim() || isAiLoading}
                  className="p-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold transition-all shadow-md flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-dei-muted px-2 pt-2">
                <span>Tekan <b>Enter</b> untuk mengirim, <b>Shift+Enter</b> untuk baris baru.</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Terhubung ke Groq Cloud ({groqModel.split('/')[1] || groqModel})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WHATSAPP-STYLE CONSULTATION CHAT ROOM (TWO-WAY MANUAL) */}
      {/* ======================================================== */}
      {activeMainTab === 'consultation' && (
        <div className="bg-[#f0f2f5] dark:bg-neutral-900 rounded-3xl border border-neutral-300 dark:border-neutral-800 overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 h-[680px] animate-in fade-in">
          {/* Kolom Kiri: Sidebar Kontak WhatsApp (4 Kolom) */}
          <div className="md:col-span-4 bg-white dark:bg-dei-dark-surface border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full">
            {/* Header Profil Pengguna */}
            <div className="p-3.5 bg-[#f0f2f5] dark:bg-neutral-800 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full ${chatRoleView === 'santri' ? selectedSantri.color : selectedUstadz.color} text-white font-black text-sm flex items-center justify-center shadow`}>
                  {chatRoleView === 'santri' ? selectedSantri.avatar : selectedUstadz.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-dei-ink dark:text-dei-dark-ink">
                    {chatRoleView === 'santri' ? selectedSantri.name : selectedUstadz.name}
                  </h4>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {chatRoleView === 'santri' ? selectedSantri.package : 'Ustadz Pembimbing'}
                  </span>
                </div>
              </div>

              {/* Santri Switcher Dropdown (Only for Admin Supervision) */}
              {isStaffOrAdmin && chatRoleView === 'santri' && (
                <select
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="text-[11px] bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-2 py-1 font-bold text-emerald-700 dark:text-emerald-300 outline-none"
                  title="Supervisi: Ganti Profil Santri yang Konsultasi"
                >
                  {SANTRI_DIRECTORY.map(s => (
                    <option key={s.id} value={s.id}>{s.name.split(' ')[0]} ({s.package.split(' ')[0]})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Sub-label informasi dua arah */}
            <div className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
              <span>{chatRoleView === 'santri' ? 'Daftar Asatidzah Pembimbing:' : 'Daftar Santri Bimbingan:'}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded">Manual Reply</span>
            </div>

            {/* List Kontak Chat */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
              {chatRoleView === 'santri' ? (
                /* Daftar Ustadz untuk Santri */
                USTADZ_DIRECTORY.map((ust) => {
                  const isSelected = ust.id === selectedUstadzId;
                  const threadKey = `${selectedSantriId}__${ust.id}`;
                  const chatList = allThreads[threadKey] || [];
                  const lastMsg = chatList[chatList.length - 1];

                  return (
                    <button
                      key={ust.id}
                      onClick={() => setSelectedUstadzId(ust.id)}
                      className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-[#f0f2f5] dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full ${ust.color} text-white font-bold text-sm flex items-center justify-center shadow`}>
                          {ust.avatar}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{ust.name}</h4>
                          <span className="text-[10px] text-neutral-400">{lastMsg?.time || '10:00'}</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">{ust.subject}</p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {lastMsg ? lastMsg.text : 'Klik untuk mulai konsultasi...'}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                /* Daftar Santri untuk Ustadz */
                SANTRI_DIRECTORY.map((st) => {
                  const isSelected = st.id === selectedSantriId;
                  const threadKey = `${st.id}__${selectedUstadzId}`;
                  const chatList = allThreads[threadKey] || [];
                  const lastMsg = chatList[chatList.length - 1];
                  const hasUnread = lastMsg && lastMsg.senderRole === 'santri' && lastMsg.status !== 'read';

                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedSantriId(st.id)}
                      className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-[#f0f2f5] dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full ${st.color} text-white font-bold text-sm flex items-center justify-center shadow`}>
                          {st.avatar}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{st.name}</h4>
                          <span className="text-[10px] text-neutral-400">{lastMsg?.time || '09:00'}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-bold block">{st.package}</span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {lastMsg ? lastMsg.text : 'Belum ada percakapan baru...'}
                        </p>
                      </div>

                      {hasUnread && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                          1
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Jendela Percakapan WhatsApp (8 Kolom) */}
          <div className="md:col-span-8 flex flex-col h-full bg-[#efeae2] dark:bg-neutral-950 relative">
            {/* WhatsApp Top Header Bar */}
            <div className="p-3 bg-[#f0f2f5] dark:bg-neutral-800 flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${chatRoleView === 'santri' ? selectedUstadz.color : selectedSantri.color} text-white font-black text-sm flex items-center justify-center shadow`}>
                  {chatRoleView === 'santri' ? selectedUstadz.avatar : selectedSantri.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                    {chatRoleView === 'santri' ? selectedUstadz.name : selectedSantri.name}
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                      {chatRoleView === 'santri' ? selectedUstadz.subject : selectedSantri.package}
                    </span>
                  </h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Aktif • Konsultasi Terjadwal</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-200 hidden sm:block">
                  Percakapan: <b>{selectedSantri.name.split(' ')[0]}</b> ⇄ <b>{selectedUstadz.name.split(' ')[1] || 'Fauzi'}</b>
                </div>
              </div>
            </div>

            {/* Quick Topic Chips for WhatsApp */}
            <div className="p-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-neutral-500 font-bold flex-shrink-0">
                {chatRoleView === 'santri' ? 'Topik Santri:' : 'Template Ustadz:'}
              </span>
              {chatRoleView === 'santri' ? (
                <>
                  <button
                    onClick={() => handleSendConsultMessage("Assalamu'alaikum Ustadz, mohon koreksi bacaan tajwid surah Al-Mulk ayat 1-15.")}
                    className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-neutral-700 dark:text-neutral-300 font-semibold flex-shrink-0 transition-colors"
                  >
                    📖 Setoran Tahfizh
                  </button>
                  <button
                    onClick={() => handleSendConsultMessage("Ustadz, rumus di latihan modul matematika nomor 4 masih kurang saya pahami.")}
                    className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-neutral-700 dark:text-neutral-300 font-semibold flex-shrink-0 transition-colors"
                  >
                    📐 Tanya Soal Modul
                  </button>
                  <button
                    onClick={() => handleSendConsultMessage("Assalamu'alaikum, bagaimana penyesuaian jam ujian CBT untuk santri diaspora?")}
                    className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-neutral-700 dark:text-neutral-300 font-semibold flex-shrink-0 transition-colors"
                  >
                    🌍 Jam Diaspora
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSendConsultMessage("Wa'alaikumsalam warahmatullah ananda. Na'am, insyaAllah besok bada ashar kita buka halaqah virtual ya.")}
                    className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-semibold flex-shrink-0 transition-colors"
                  >
                    ✓ Konfirmasi Bada Ashar
                  </button>
                  <button
                    onClick={() => handleSendConsultMessage("Barakallahu feek ananda, makhraj dan mad sudah mutqin. Lanjutkan hafalan halaman berikutnya.")}
                    className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-semibold flex-shrink-0 transition-colors"
                  >
                    ✓ Apresiasi Mutqin
                  </button>
                  <button
                    onClick={() => handleSendConsultMessage("Untuk modul tersebut, perhatikan kembali tanda minus (-) pada kedua ruas sebelum substitusi ya.")}
                    className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-semibold flex-shrink-0 transition-colors"
                  >
                    ✓ Petunjuk Rumus
                  </button>
                </>
              )}
            </div>

            {/* Notification Banner */}
            {consultNotice && (
              <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top">
                <span>{consultNotice}</span>
                <button onClick={() => setConsultNotice('')} className="p-0.5 hover:bg-white/20 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Chat Bubble Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {activeChatMessages.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-xs">Belum ada percakapan antara <b>{selectedSantri.name}</b> dan <b>{selectedUstadz.name}</b>.</p>
                  <p className="text-[11px] text-neutral-500">Ketik pesan di bawah untuk memulai konsultasi bimbingan.</p>
                </div>
              ) : (
                activeChatMessages.map((msg) => {
                  const isMe = msg.senderRole === chatRoleView;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-md ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed relative ${
                          isMe
                            ? 'bg-[#d9fdd3] dark:bg-emerald-950 text-neutral-900 dark:text-emerald-100 rounded-tr-none'
                            : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-none border border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        {!isMe && (
                          <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-400 block mb-0.5">
                            {msg.senderName}
                          </span>
                        )}
                        <span className="font-normal">{msg.text}</span>

                        <div className="flex items-center justify-end gap-1 text-[9px] text-neutral-400 mt-1">
                          <span>{msg.time}</span>
                          {isMe && (
                            msg.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" title="Dibaca" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-neutral-400" title="Terkirim (Menunggu dibaca)" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={consultChatEndRef} />
            </div>

            {/* WhatsApp Input Bar */}
            <div className="p-2.5 bg-[#f0f2f5] dark:bg-neutral-800 border-t border-neutral-300 dark:border-neutral-700 flex items-center gap-2">
              <Smile className="w-5 h-5 text-neutral-500 cursor-pointer hidden sm:block" />
              <Paperclip className="w-5 h-5 text-neutral-500 cursor-pointer hidden sm:block" />
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendConsultMessage();
                  }
                }}
                placeholder={
                  chatRoleView === 'santri'
                    ? `Kirim pesan konsultasi ke ${selectedUstadz.name}...`
                    : `Ketik balasan ustadz untuk ${selectedSantri.name}...`
                }
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-neutral-700 text-xs text-neutral-900 dark:text-white outline-none shadow-sm"
              />
              <button
                onClick={() => handleSendConsultMessage()}
                disabled={!chatInputText.trim()}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white flex items-center justify-center shadow transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PENGATURAN GROQ API KEY & MODEL */}
      {/* ======================================================== */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dei-dark-surface w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-200 dark:border-emerald-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dei-line dark:border-dei-dark-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
                  <Key className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-dei-ink dark:text-dei-dark-ink">
                    Pengaturan Mesin Generative AI Groq
                  </h3>
                  <p className="text-[11px] text-dei-muted">
                    Kunci aktif: {groqApiKey ? `${groqApiKey.substring(0, 10)}...${groqApiKey.substring(groqApiKey.length - 4)}` : 'Belum diisi'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-dei-muted hover:text-dei-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            {apiKeySaveSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Kunci Groq API & Model berhasil disimpan dan aktif seketika!</span>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const cleanKey = inputApiKey.trim();
              if (cleanKey) {
                localStorage.setItem('pkbm_groq_api_key', cleanKey);
                setGroqApiKey(cleanKey);
                localStorage.setItem('pkbm_groq_model', groqModel);
                setApiKeySaveSuccess(true);
                setTimeout(() => {
                  setApiKeySaveSuccess(false);
                  setShowApiKeyModal(false);
                }, 1200);
              }
            }} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">
                  Groq API Key Anda:
                </label>
                <input
                  type="text"
                  required
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dei-line dark:border-dei-dark-line font-mono text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-dei-ink dark:text-dei-dark-ink">
                  Pilihan Model Generative AI:
                </label>
                <select
                  value={groqModel}
                  onChange={(e) => {
                    setGroqModel(e.target.value);
                    localStorage.setItem('pkbm_groq_model', e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dei-line dark:border-dei-dark-line font-semibold outline-none"
                >
                  <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Deep Reasoning 120B — Sangat Cerdas & Komprehensif)</option>
                  <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (Qwen 3.8 27B — Cepat, Ahli Bahasa Arab & Fiqih)</option>
                  <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (GPT-OSS 20B — Ultra Fast Instant Response)</option>
                  <option value="allam-2-7b">allam-2-7b (Allam 2 7B — Spesialis Studi Islam & Arab)</option>
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (LLaMA-3.3 70B)</option>
                </select>
                <p className="text-[10px] text-dei-muted mt-1 leading-relaxed">
                  Rekomendasi utama: <b>openai/gpt-oss-120b</b> dan <b>qwen/qwen3.8-27b</b> terbukti aktif dan bebas kendala error 404 pada API key Anda.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-dei-line dark:border-dei-dark-line">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-dei-muted hover:text-dei-ink"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiTutorPage;
