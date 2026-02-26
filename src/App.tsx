/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Layers, FileCheck, Hourglass, Loader2, Route, Check,
  CheckCircle2, CheckSquare, Landmark, CircleDot, Square, Clock, Lock,
  UserCircle, LogOut, Users, Bell, ShieldCheck, Activity, Settings, Trash2, X
} from 'lucide-react';

// --- Types & Constants ---
type User = { name: string; id: string; isAdmin?: boolean };
type VoteRecord = { id: string; name: string; comment?: string };
type Votes = Record<number, VoteRecord[]>;
type Notification = { id: string; message: string; time: Date };

const TOTAL_MEMBERS = 7;
const BOARD_MEMBERS = [
  { id: '1077394771', name: 'د. حامد إبراهيم البلوي' },
  { id: '1026898955', name: 'د. علي محمد الفردوس' },
  { id: '1017569672', name: 'د. يوسف صالح العلاوي' },
  { id: '1054208309', name: 'أ. عايشه ناصر خلف' },
  { id: '1064258351', name: 'أ. فاطمة صالح السلمي' },
  { id: '1060048459', name: 'د. أماني عايش العنزي' },
  { id: '1114934381', name: 'م. عبدالله وليد الضيوفي', isAdmin: true },
];

const PHASES = [
  {
    id: 1,
    title: 'التشخيص الاستراتيجي',
    tools: ['PESTLE', 'SWOT', 'McKinsey 7S'],
    drafts: ['المسودة 1: وثيقة تحليل الوضع الراهن'],
    gate: 'مراجعة ومصادقة',
  },
  {
    id: 2,
    title: 'هندسة الهوية',
    tools: ['Golden Circle', 'Collins-Porras'],
    drafts: ['المسودة 2: الرؤية', 'المسودة 3: الرسالة', 'المسودة 4: القيم'],
    gate: 'عصف ذهني واعتماد مبدئي',
  },
  {
    id: 3,
    title: 'التصميم التشغيلي',
    tools: ['Non-Profit Canvas', 'V2MOM'],
    drafts: ['المسودة 5: نموذج العمل', 'المسودة 6: الخطة التشغيلية'],
    gate: 'مراجعة الجدوى وتوزيع الموارد',
  },
  {
    id: 4,
    title: 'الحوكمة والإخراج',
    tools: ['تجميع', 'إخراج بصري', 'مراجعة قانونية'],
    drafts: ['الوثيقة الشاملة'],
    gate: 'التوقيع الختامي',
  },
];

export default function App() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [votes, setVotes] = useState<Votes>({ 1: [], 2: [], 3: [], 4: [] });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  // --- Load/Save State ---
  useEffect(() => {
    const savedUser = localStorage.getItem('board_user');
    const savedVotes = localStorage.getItem('board_votes');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedVotes) {
      try {
        const parsed = JSON.parse(savedVotes);
        if (parsed[1] && typeof parsed[1][0] === 'string') {
          setVotes({ 1: [], 2: [], 3: [], 4: [] });
        } else {
          setVotes(parsed);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('board_user', JSON.stringify(user));
    localStorage.setItem('board_votes', JSON.stringify(votes));
  }, [user, votes]);

  // --- Derived State ---
  let activePhase = 1;
  if (votes[1].length === TOTAL_MEMBERS) activePhase = 2;
  if (votes[2].length === TOTAL_MEMBERS) activePhase = 3;
  if (votes[3].length === TOTAL_MEMBERS) activePhase = 4;
  if (votes[4].length === TOTAL_MEMBERS) activePhase = 5; // All completed

  const totalVotesCast = Object.values(votes).reduce((acc, curr) => acc + curr.length, 0);
  const overallProgress = Math.round((totalVotesCast / (4 * TOTAL_MEMBERS)) * 100);
  
  const completedDraftsCount = PHASES.slice(0, activePhase - 1).reduce((acc, phase) => acc + phase.drafts.length, 0);
  const totalDraftsCount = PHASES.reduce((acc, phase) => acc + phase.drafts.length, 0);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const member = BOARD_MEMBERS.find(m => m.id === loginId.trim());
    if (member) {
      setUser({ name: member.name, id: member.id, isAdmin: member.isAdmin });
      setLoginError('');
    } else {
      setLoginError('رقم الهوية غير مسجل في النظام.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginId('');
    setLoginError('');
    localStorage.removeItem('board_user');
  };

  const castVote = (phaseId: number, voterId: string, voterName: string, isExternal = false, comment?: string) => {
    const existingVote = votes[phaseId].find(v => v.id === voterId);
    
    if (existingVote) {
      if (comment && !existingVote.comment) {
        setVotes(prev => ({
          ...prev,
          [phaseId]: prev[phaseId].map(v => v.id === voterId ? { ...v, comment } : v)
        }));
      }
      return;
    }
    
    setVotes(prev => ({
      ...prev,
      [phaseId]: [...prev[phaseId], { id: voterId, name: voterName, comment }]
    }));

    if (isExternal) {
      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        message: `قام ${voterName} بالتصويت بالموافقة على المرحلة ${phaseId}`,
        time: new Date()
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    }
  };

  const removeVote = (phaseId: number, voterId: string) => {
    setVotes(prev => ({
      ...prev,
      [phaseId]: prev[phaseId].filter(v => v.id !== voterId)
    }));
  };

  const resetPhase = (phaseId: number) => {
    setVotes(prev => ({
      ...prev,
      [phaseId]: []
    }));
  };

  const renderVoters = (phaseVotes: VoteRecord[]) => {
    if (phaseVotes.length === 0) return null;
    return (
      <div className="mt-4 pt-4 border-t border-slate-200/60">
        <p className="text-xs text-slate-500 mb-2 font-medium">الأعضاء المصوتين ({phaseVotes.length} من {TOTAL_MEMBERS}):</p>
        <div className="flex flex-wrap gap-2">
          {phaseVotes.map(v => (
            <div key={v.id} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md text-xs text-slate-600 shadow-sm" title={v.name}>
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                {v.name.replace(/^(د\.|م\.|أ\.)\s*/, '').charAt(0)}
              </div>
              <span className="truncate max-w-[120px]">{v.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComments = (phaseVotes: VoteRecord[]) => {
    const comments = phaseVotes.filter(v => v.comment);
    if (comments.length === 0) return null;
    return (
      <div className="mt-4 pt-4 border-t border-slate-200/60">
        <p className="text-xs text-slate-500 mb-3 font-medium">تعليقات الأعضاء:</p>
        <div className="space-y-2">
          {comments.map(v => (
            <div key={v.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                  {v.name.replace(/^(د\.|م\.|أ\.)\s*/, '').charAt(0)}
                </div>
                <span className="text-xs font-bold text-slate-700">{v.name}</span>
              </div>
              <p className="text-sm text-slate-600 mr-7">{v.comment}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (!showAdminPanel) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              إدارة النظام (صلاحيات المدير)
            </h2>
            <button onClick={() => setShowAdminPanel(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {PHASES.map(phase => (
              <div key={phase.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">المرحلة {phase.id}: {phase.title}</h3>
                  <button 
                    onClick={() => resetPhase(phase.id)}
                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    إلغاء جميع الأصوات
                  </button>
                </div>
                {votes[phase.id].length === 0 ? (
                  <p className="text-sm text-slate-500">لا توجد أصوات في هذه المرحلة.</p>
                ) : (
                  <div className="space-y-2">
                    {votes[phase.id].map(v => (
                      <div key={v.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {v.name.replace(/^(د\.|م\.|أ\.)\s*/, '').charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{v.name}</span>
                        </div>
                        <button 
                          onClick={() => removeVote(phase.id, v.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                          title="إلغاء صوت العضو"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- Render Login ---
  if (!user) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100"
        >
          <div className="flex flex-col items-center justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="جمعية آزِر لمرضى الأورام بتبوك | AZER" 
              className="h-24 w-auto object-contain mb-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-sm font-bold text-indigo-600 mb-1">جمعية آزِر لمرضى الأورام بتبوك | AZER</h2>
            <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">بوابة مجلس الإدارة</h1>
            <p className="text-center text-slate-500 text-sm">نظام المسودات المتصاعدة - تسجيل الدخول</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهوية الوطنية</label>
              <input 
                type="text" 
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center tracking-widest font-mono text-lg"
                placeholder="10XXXXXX"
                maxLength={10}
              />
            </div>
            {loginError && (
              <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>
            )}
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors mt-4 flex items-center justify-center gap-2"
            >
              دخول للنظام <Lock className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- Render Dashboard ---
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <img 
                  src="/logo.png" 
                  alt="جمعية آزِر لمرضى الأورام بتبوك | AZER" 
                  className="h-14 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <LineChart className="w-6 h-6" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">جمعية آزِر لمرضى الأورام بتبوك | AZER</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-indigo-600">نظام المسودات المتصاعدة</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                  <span className="text-xs text-slate-500 hidden sm:block">لوحة القيادة الاستراتيجية</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user.isAdmin && (
                <button 
                  onClick={() => setShowAdminPanel(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-full text-sm font-medium transition-colors"
                  title="إدارة النظام"
                >
                  <Settings className="w-4 h-4" />
                  <span>إدارة النظام</span>
                </button>
              )}

              <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <UserCircle className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{user.name}</span>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700 ml-1" title="تسجيل خروج">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Toast Area */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border border-indigo-100 shadow-lg rounded-lg p-3 flex items-start gap-3 w-80"
            >
              <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-full shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">{notif.time.toLocaleTimeString('ar-SA')}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {renderAdminPanel()}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overall Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">التقدم الإجمالي للخطة الاستراتيجية</h2>
              <p className="text-sm text-slate-500">يعتمد على تصويت أعضاء مجلس الإدارة ({TOTAL_MEMBERS} أعضاء)</p>
            </div>
            <span className="text-3xl font-black text-blue-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <motion.div 
              className="bg-blue-500 h-3 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">إجمالي المراحل</p>
              <p className="text-2xl font-bold text-slate-800">4</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">المسودات المعتمدة</p>
              <p className="text-2xl font-bold text-slate-800">{completedDraftsCount} <span className="text-sm text-slate-400 font-normal">من {totalDraftsCount}</span></p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">إجمالي التصويتات</p>
              <p className="text-2xl font-bold text-slate-800">{totalVotesCast} <span className="text-sm text-slate-400 font-normal">من 28</span></p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              {activePhase <= 4 ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">المرحلة النشطة</p>
              <p className="text-lg font-bold text-blue-600 mt-1">{activePhase <= 4 ? `المرحلة ${activePhase}` : 'مكتملة بالكامل'}</p>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Route className="w-6 h-6 text-slate-400" />
            المخطط الزمني للمراحل والاعتمادات
          </h2>
          {user.isAdmin && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="md:hidden flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white rounded-full text-xs font-medium"
            >
              <Settings className="w-3 h-3" /> إدارة
            </button>
          )}
        </div>

        <div className="relative py-4 before:content-[''] before:absolute before:top-0 before:bottom-0 before:right-1/2 before:w-0.5 before:bg-slate-200 before:translate-x-1/2 max-md:before:right-6">
          
          {PHASES.map((phase) => {
            const phaseVotes = votes[phase.id];
            const isCompleted = phaseVotes.length === TOTAL_MEMBERS;
            const isActive = activePhase === phase.id;
            const isLocked = activePhase < phase.id;
            const userHasVoted = phaseVotes.some(v => v.id === user.id);
            const votePercentage = (phaseVotes.length / TOTAL_MEMBERS) * 100;

            return (
              <div key={phase.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-12 ${isLocked ? 'opacity-60' : ''}`}>
                
                {/* Center Icon */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 max-md:mr-0 transition-colors
                  ${isCompleted ? 'bg-emerald-500 text-white' : 
                    isActive ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 
                    'bg-slate-200 text-slate-400'}`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : 
                   isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                   <Lock className="w-5 h-5" />}
                </div>

                {/* Card */}
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-xl shadow-sm bg-white border transition-all
                  ${isActive ? 'border-2 border-blue-400 shadow-md' : 'border-slate-200'}`}>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold flex items-center ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                      <span className={`text-sm ml-1 flex items-center gap-1 ${isCompleted ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <CircleDot className="w-4 h-4" /> : null}
                        المرحلة {phase.id}:
                      </span>
                      {phase.title}
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border 
                      ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        isActive ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' : 
                        'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {isCompleted ? 'مكتملة' : isActive ? 'نشطة الآن' : 'قادمة'}
                    </span>
                  </div>
                  
                  {/* Tools */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">الأدوات المنهجية</p>
                    <div className="flex flex-wrap gap-2">
                      {phase.tools.map(tool => (
                        <span key={tool} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded border border-slate-200">{tool}</span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Drafts */}
                  <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">المسودات</p>
                    <ul className="space-y-2">
                      {phase.drafts.map((draft, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          {isCompleted ? <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5" /> : 
                           isActive ? <Square className="w-4 h-4 text-slate-300 mt-0.5" /> : 
                           <Lock className="w-4 h-4 text-slate-300 mt-0.5" />}
                          <span className={`${isCompleted ? 'text-slate-500 line-through' : isActive ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                            {draft}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Board Portal / Voting Area */}
                  <div className={`p-4 rounded-lg border ${
                    isCompleted ? 'bg-emerald-50 border-emerald-200' : 
                    isActive ? 'bg-blue-50 border-blue-200' : 
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Landmark className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-800' : isActive ? 'text-blue-800' : 'text-slate-600'}`}>
                        بوابة مجلس الإدارة: {phase.gate}
                      </p>
                    </div>

                    {isLocked && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">بانتظار اكتمال المراحل السابقة</p>
                        <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-500 font-bold">مغلقة</span>
                      </div>
                    )}

                    {isCompleted && (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-emerald-700">تم اعتماد المرحلة بالإجماع ({TOTAL_MEMBERS}/{TOTAL_MEMBERS})</p>
                          <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> معتمدة</span>
                        </div>
                        {renderVoters(phaseVotes)}
                        {renderComments(phaseVotes)}
                      </div>
                    )}

                    {isActive && (
                      <div className="space-y-4">
                        {/* Progress Bar for Votes */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-blue-700 font-medium">تقدم التصويت</span>
                            <span className="text-blue-700 font-bold">{phaseVotes.length} من {TOTAL_MEMBERS}</span>
                          </div>
                          <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="bg-blue-600 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${votePercentage}%` }}
                            />
                          </div>
                        </div>

                        {renderVoters(phaseVotes)}
                        {renderComments(phaseVotes)}

                        {/* Voting Action */}
                        <div className="pt-2 border-t border-blue-100">
                          {!userHasVoted ? (
                            <button 
                              onClick={() => castVote(phase.id, user.id, user.name)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              تصويت بالموافقة والاعتماد
                            </button>
                          ) : (
                            <div>
                              <div className="w-full bg-emerald-100 text-emerald-700 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 border border-emerald-200 mb-3">
                                <Check className="w-5 h-5" />
                                تم تسجيل تصويتك بنجاح
                              </div>
                              {!phaseVotes.find(v => v.id === user.id)?.comment && (
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="إضافة تعليق (اختياري)..." 
                                    value={commentInputs[phase.id] || ''}
                                    onChange={e => setCommentInputs({...commentInputs, [phase.id]: e.target.value})}
                                    className="flex-1 px-3 py-2 rounded-md border border-emerald-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                  <button 
                                    onClick={() => castVote(phase.id, user.id, user.name, false, commentInputs[phase.id])}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-md text-sm font-medium transition-colors"
                                  >
                                    إرسال
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </main>
    </div>
  );
}
