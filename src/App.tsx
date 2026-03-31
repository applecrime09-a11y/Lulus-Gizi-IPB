/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  PenTool, 
  BarChart3, 
  Timer, 
  Flame, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Trophy,
  Target,
  BrainCircuit,
  ArrowRight,
  Github,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import { cn } from './lib/utils';
import { MOCK_QUESTIONS, STUDY_PLAN, HARD_MOTIVATIONS, Question } from './data/mockData';
import { calculateIRTScore, getTargetComparison } from './lib/irt';

// --- Types ---
type Tab = 'dashboard' | 'practice' | 'simulation' | 'analysis' | 'roadmap';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-orange-600 text-white shadow-lg shadow-orange-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-orange-600"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-slate-100", className)}>
    {children}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentDay, setCurrentDay] = useState(() => {
    const saved = localStorage.getItem('utbk_current_day');
    return saved ? parseInt(saved) : 1;
  });
  const [motivation, setMotivation] = useState(HARD_MOTIVATIONS[0]);
  const [user, setUser] = useState<any>(null);
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('utbk_scores');
    return saved ? JSON.parse(saved) : [
      { day: 'Day 1', score: 450 },
      { day: 'Day 5', score: 520 },
      { day: 'Day 10', score: 580 },
      { day: 'Day 15', score: 610 },
    ];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('utbk_current_day', currentDay.toString());
  }, [currentDay]);

  useEffect(() => {
    localStorage.setItem('utbk_scores', JSON.stringify(scores));
  }, [scores]);

  const syncWithServer = async (data: { scores: any[], currentDay: number }) => {
    if (!user) return;
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('Sync failed', err);
    }
  };

  // Auto-sync when data changes and user is logged in
  useEffect(() => {
    if (user) {
      syncWithServer({ scores, currentDay });
    }
  }, [scores, currentDay, user]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        
        // After login, fetch server progress and merge
        const progRes = await fetch('/api/progress');
        if (progRes.ok) {
          const progData = await progRes.json();
          if (progData.scores) {
            setScores(progData.scores);
            setCurrentDay(progData.currentDay);
          }
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (err) {
      console.error('Failed to get auth URL', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const [quizState, setQuizState] = useState<{
    isActive: boolean;
    currentQuestionIndex: number;
    answers: { questionId: string; isCorrect: boolean; difficulty: number }[];
    isFinished: boolean;
  }>({
    isActive: false,
    currentQuestionIndex: 0,
    answers: [],
    isFinished: false
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMotivation(HARD_MOTIVATIONS[Math.floor(Math.random() * HARD_MOTIVATIONS.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentIRTScore = useMemo(() => {
    if (scores.length === 0) return 0;
    return scores[scores.length - 1].score;
  }, [scores]);

  const comparison = getTargetComparison(currentIRTScore);

  const startQuiz = () => {
    setQuizState({
      isActive: true,
      currentQuestionIndex: 0,
      answers: [],
      isFinished: false
    });
  };

  const handleAnswer = (isCorrect: boolean) => {
    const question = MOCK_QUESTIONS[quizState.currentQuestionIndex];
    const newAnswers = [...quizState.answers, { 
      questionId: question.id, 
      isCorrect, 
      difficulty: question.difficulty 
    }];

    if (quizState.currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
        answers: newAnswers
      });
    } else {
      const finalScore = calculateIRTScore(newAnswers);
      setScores([...scores, { day: `Day ${scores.length + 1}`, score: finalScore }]);
      setQuizState({
        ...quizState,
        isFinished: true,
        answers: newAnswers
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white">
            <Target size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Gizi IPB</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">30 Days Mission</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={BookOpen} label="Roadmap" active={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} />
          <SidebarItem icon={PenTool} label="Latihan" active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} />
          <SidebarItem icon={Timer} label="Simulasi IRT" active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')} />
          <SidebarItem icon={BarChart3} label="Analisis" active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
        </nav>

        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <Flame size={18} />
            <span className="font-bold text-sm">Hard Motivation</span>
          </div>
          <p className="text-xs text-orange-800 italic leading-relaxed">
            "{motivation}"
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {activeTab === 'dashboard' && "Selamat Berjuang, Calon Ahli Gizi!"}
              {activeTab === 'roadmap' && "Rencana Tempur 30 Hari"}
              {activeTab === 'practice' && "Asah Kemampuanmu"}
              {activeTab === 'simulation' && "Simulasi Ujian IRT"}
              {activeTab === 'analysis' && "Analisis Kekuatan & Kelemahan"}
            </h2>
            <p className="text-slate-500 mt-1">Target: Ilmu Gizi, Institut Pertanian Bogor (IPB)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Current IRT Score</p>
              <p className={cn("text-2xl font-black", comparison.color)}>{currentIRTScore}</p>
            </div>
            {user ? (
              <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                  <img src={user.avatar_url} alt={user.login} referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-none">{user.name || user.login}</p>
                  <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider">Logout</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-md"
              >
                <Github size={18} />
                Login with GitHub
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Progress Card */}
                <Card className="md:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <BarChart3 className="text-orange-600" size={20} />
                      Progress Skor IRT
                    </h3>
                    <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      +15% vs Last Week
                    </span>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scores}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#ea580c" 
                          strokeWidth={4} 
                          dot={{ r: 6, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Target Card */}
                <Card className="flex flex-col justify-between bg-slate-900 text-white border-none">
                  <div>
                    <div className="flex items-center gap-2 mb-4 opacity-70">
                      <Target size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Target Gizi IPB</span>
                    </div>
                    <div className="mb-6">
                      <p className="text-5xl font-black mb-1">720</p>
                      <p className="text-sm opacity-60">Skor aman UTBK tahun lalu</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-60">Status:</span>
                        <span className={cn("font-bold px-2 py-0.5 rounded", comparison.status === 'AMAN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                          {comparison.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-60">Gap:</span>
                        <span className="font-bold">{comparison.diff > 0 ? `+${comparison.diff}` : comparison.diff} Poin</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-8 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    Kejar Target <ArrowRight size={18} />
                  </button>
                </Card>

                {/* Today's Mission */}
                <Card className="md:col-span-3">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                        <Flame size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Misi Hari Ini: Hari ke-{currentDay}</h3>
                        <p className="text-sm text-slate-500">{STUDY_PLAN[currentDay-1].topic}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {STUDY_PLAN[currentDay-1].tasks.map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-medium text-slate-600">
                          <CheckCircle2 size={14} className="text-slate-300" />
                          {task}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">TPS</p>
                      <p className="text-xl font-black text-blue-900">85%</p>
                      <div className="w-full h-1.5 bg-blue-200 rounded-full mt-2">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                      <p className="text-xs font-bold text-purple-600 uppercase mb-1">Literasi Indo</p>
                      <p className="text-xl font-black text-purple-900">72%</p>
                      <div className="w-full h-1.5 bg-purple-200 rounded-full mt-2">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                      <p className="text-xs font-bold text-amber-600 uppercase mb-1">Literasi Inggris</p>
                      <p className="text-xl font-black text-amber-900">64%</p>
                      <div className="w-full h-1.5 bg-amber-200 rounded-full mt-2">
                        <div className="h-full bg-amber-600 rounded-full" style={{ width: '64%' }}></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Matematika</p>
                      <p className="text-xl font-black text-emerald-900">91%</p>
                      <div className="w-full h-1.5 bg-emerald-200 rounded-full mt-2">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '91%' }}></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {STUDY_PLAN.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setCurrentDay(day.day)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-left group relative overflow-hidden",
                      currentDay === day.day 
                        ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200" 
                        : "bg-white border-slate-200 hover:border-orange-300"
                    )}
                  >
                    <div className="relative z-10">
                      <p className={cn("text-xs font-bold uppercase mb-1", currentDay === day.day ? "text-orange-200" : "text-slate-400")}>Day {day.day}</p>
                      <p className="font-bold text-sm leading-tight line-clamp-2">{day.topic}</p>
                    </div>
                    {day.day < currentDay && (
                      <CheckCircle2 className="absolute top-2 right-2 text-green-500" size={16} />
                    )}
                    <div className={cn(
                      "absolute -bottom-2 -right-2 opacity-10 transition-transform group-hover:scale-110",
                      currentDay === day.day ? "text-white" : "text-slate-200"
                    )}>
                      <BookOpen size={64} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'simulation' && (
              <div className="max-w-3xl mx-auto">
                {!quizState.isActive ? (
                  <Card className="text-center py-12">
                    <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <BrainCircuit size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Siap Simulasi IRT?</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                      Simulasi ini menggunakan algoritma Item Response Theory. Skor ditentukan oleh tingkat kesulitan soal yang berhasil kamu jawab.
                    </p>
                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                      <button 
                        onClick={startQuiz}
                        className="py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-200"
                      >
                        Mulai Simulasi
                      </button>
                      <p className="text-xs text-slate-400">Estimasi waktu: 15 Menit • 20 Soal</p>
                    </div>
                  </Card>
                ) : quizState.isFinished ? (
                  <Card className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Trophy size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Simulasi Selesai!</h3>
                    <div className="my-8">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimasi Skor IRT</p>
                      <p className="text-6xl font-black text-slate-900">{scores[scores.length-1].score}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Benar</p>
                        <p className="text-xl font-bold text-green-600">{quizState.answers.filter(a => a.isCorrect).length}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Salah</p>
                        <p className="text-xl font-bold text-red-600">{quizState.answers.filter(a => !a.isCorrect).length}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                      Kembali ke Dashboard
                    </button>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-400">Soal {quizState.currentQuestionIndex + 1} dari {MOCK_QUESTIONS.length}</span>
                      <div className="flex items-center gap-2 text-orange-600 font-bold">
                        <Timer size={18} />
                        <span>14:52</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-orange-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${((quizState.currentQuestionIndex + 1) / MOCK_QUESTIONS.length) * 100}%` }}
                      />
                    </div>
                    <Card className="p-8">
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full mb-4">
                        {MOCK_QUESTIONS[quizState.currentQuestionIndex].subject}
                      </span>
                      <h4 className="text-xl font-medium leading-relaxed mb-8">
                        {MOCK_QUESTIONS[quizState.currentQuestionIndex].question}
                      </h4>
                      <div className="space-y-3">
                        {MOCK_QUESTIONS[quizState.currentQuestionIndex].options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(idx === MOCK_QUESTIONS[quizState.currentQuestionIndex].correctAnswer)}
                            className="w-full p-4 text-left border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-4 group"
                          >
                            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-medium text-slate-700">{option}</span>
                          </button>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h3 className="font-bold text-lg mb-6">Radar Kemampuan</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Penalaran Umum', A: 85 },
                        { subject: 'Pengetahuan Umum', A: 65 },
                        { subject: 'Memahami Bacaan', A: 70 },
                        { subject: 'Pengetahuan Kuantitatif', A: 90 },
                        { subject: 'Literasi Indo', A: 75 },
                        { subject: 'Literasi Inggris', A: 60 },
                        { subject: 'Penalaran MTK', A: 88 },
                      ]}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar name="Skor" dataKey="A" stroke="#ea580c" fill="#ea580c" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card>
                  <h3 className="font-bold text-lg mb-6">Rekomendasi Fokus</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-red-900">Literasi Bahasa Inggris</p>
                        <p className="text-sm text-red-700 mt-1">Skor kamu di bawah rata-rata target Gizi IPB. Fokus pada Vocabulary & Main Idea.</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-orange-900">Pengetahuan Umum</p>
                        <p className="text-sm text-orange-700 mt-1">Butuh lebih banyak latihan soal logika deduktif.</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-green-900">Penalaran Matematika</p>
                        <p className="text-sm text-green-700 mt-1">Sangat baik! Pertahankan kecepatan pengerjaan.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
