
import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Sparkles, ImagePlus, X, CheckCircle2, Zap, Calendar, Eye, FileText, Moon, Sun } from 'lucide-react';
import Marquee from './components/Marquee';
import ExamOutput from './components/ExamOutput';
import AnimatedMascot from './components/AnimatedMascot';
import { generateQuestions } from './services/geminiService';
import { ACADEMIC_YEAR, ExamCategory, ExamType, GeneratedExam, QuestionType } from './types';
import { CURRICULUM_DATA, TKA_TOPICS } from './constants';

function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<ExamCategory>(ExamCategory.REGULAR);
  const [generatedData, setGeneratedData] = useState<GeneratedExam | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [error, setError] = useState<string | null>(null);

  // Preview State
  const [previewData, setPreviewData] = useState<GeneratedExam | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Global Image Upload (Header/Watermark/Common)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Shuffle Settings
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  // Form State - Regular (Locked to Kelas 6 & Semester 2)
  const [year] = useState(ACADEMIC_YEAR);
  const [semester] = useState<string>("Semester 2");
  const [classLevel] = useState<string>("Kelas 6"); 
  const [subject, setSubject] = useState<string>("");
  const [topic, setTopic] = useState<string>(""); 
  const [examType, setExamType] = useState<ExamType>(ExamType.FORMATIF);
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Form State - TKA
  const [tkaSubject, setTkaSubject] = useState<string>("Gabungan");
  const [tkaTopicMode, setTkaTopicMode] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedTkaTopics, setSelectedTkaTopics] = useState<string[]>([]);
  const [tkaQuestionType, setTkaQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [tkaCount, setTkaCount] = useState<number>(10);

  // Apply Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getFilteredTkaTopics = () => {
    if (tkaSubject === "Gabungan") return TKA_TOPICS;
    if (tkaSubject === "Bahasa Indonesia") return TKA_TOPICS.filter(t => t.startsWith("Verbal"));
    if (tkaSubject === "Matematika") return TKA_TOPICS.filter(t => !t.startsWith("Verbal"));
    return [];
  };

  const handleTkaTopicToggle = (topic: string) => {
    setSelectedTkaTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const availableSubjects = CURRICULUM_DATA[classLevel]?.[semester] || [];
  const currentSubjectData = availableSubjects.find(s => s.name === subject);
  const rawTopics = currentSubjectData?.topics || [];

  const getTopicOptions = () => {
    if (!subject) return [];
    if (examType === ExamType.MID) {
      const midIndex = Math.ceil(rawTopics.length / 2);
      const relevantTopics = rawTopics.slice(0, midIndex);
      return [{ label: `Tengah Semester (Bab 1 - Bab ${midIndex})`, value: relevantTopics.join(', ') }];
    } 
    if (examType === ExamType.SEMESTER) {
      return [{ label: `Akhir Semester (Seluruh Materi)`, value: rawTopics.join(', ') }];
    }
    return rawTopics.map(t => ({ label: t, value: t }));
  };

  const topicOptions = getTopicOptions();

  useEffect(() => {
    if (topicOptions.length > 0) {
      if (examType === ExamType.MID || examType === ExamType.SEMESTER) {
        setTopic(topicOptions[0].value);
      } else {
        const exists = topicOptions.some(opt => opt.value === topic);
        if (!exists) setTopic("");
      }
    } else {
      setTopic("");
    }
  }, [examType, subject, classLevel, semester]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (activeTab === ExamCategory.REGULAR && (!subject || !topic)) {
      setError("Mohon pilih Mata Pelajaran dan Materi");
      return false;
    }
    if (activeTab === ExamCategory.TKA && tkaTopicMode === 'SPECIFIC' && selectedTkaTopics.length === 0) {
      setError("Mohon pilih minimal satu topik TKA");
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validateForm()) return;

    setPreviewLoading(true);
    setError(null);

    try {
      let result: GeneratedExam;
      const previewCount = 2; 

      if (activeTab === ExamCategory.REGULAR) {
         result = await generateQuestions(ExamCategory.REGULAR, {
           year, semester, classLevel, subject, topic, examType, count: previewCount,
           shuffleQuestions: false, shuffleOptions: false
         });
      } else {
        let finalTkaTopic = tkaTopicMode === 'ALL' ? `Topik TKA ${tkaSubject}` : selectedTkaTopics.join(", ");
        result = await generateQuestions(ExamCategory.TKA, {
          year, count: previewCount, topic: finalTkaTopic, questionType: tkaQuestionType,
          subject: tkaSubject === "Gabungan" ? "TKA" : `TKA - ${tkaSubject}`,
          shuffleQuestions: false, shuffleOptions: false
        });
      }
      
      setPreviewData(result);
      setShowPreviewModal(true);
    } catch (err: any) {
      setError(err.message || "Gagal membuat pratinjau.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => prev >= 95 ? 95 : prev + (prev > 70 ? 0.5 : 2));
    }, 150);

    try {
      let result: GeneratedExam;
      if (activeTab === ExamCategory.REGULAR) {
         result = await generateQuestions(ExamCategory.REGULAR, {
           year, semester, classLevel, subject, topic, examType, count: questionCount,
           shuffleQuestions, shuffleOptions
         });
      } else {
        let finalTkaTopic = tkaTopicMode === 'ALL' ? `Topik TKA ${tkaSubject}` : selectedTkaTopics.join(", ");
        result = await generateQuestions(ExamCategory.TKA, {
          year, count: tkaCount, topic: finalTkaTopic, questionType: tkaQuestionType,
          subject: tkaSubject === "Gabungan" ? "TKA" : `TKA - ${tkaSubject}`,
          shuffleQuestions, shuffleOptions
        });
      }

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 400)); 
      setGeneratedData({ ...result, uploadedImage });
    } catch (err: any) {
      setError(err.message || "Gagal membuat soal. Coba lagi.");
      clearInterval(progressInterval);
    } finally {
      setLoading(false);
    }
  };

  if (generatedData) {
    return <ExamOutput data={generatedData} onBack={() => setGeneratedData(null)} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-100 dark:selection:bg-blue-900 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 shadow-sm z-30 border-b border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg">
                <Zap size={24} className="fill-current" />
             </div>
             <div>
               <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                 AI EXAM <span className="teks-anim-glow text-blue-600 dark:text-blue-400">GENERATOR</span>
               </h1>
               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">SDN 14 ANDOPAN • KURIKULUM MERDEKA</p>
             </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <Marquee />

      <main className="flex-grow p-4 md:p-8 relative">
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue-100/40 dark:bg-blue-500/10 rounded-full blur-3xl -z-10 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-100/40 dark:bg-purple-500/10 rounded-full blur-3xl -z-10 animate-float" style={{animationDelay: '1.5s'}}></div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
          <div className="flex bg-slate-50/50 dark:bg-slate-900/50 p-1.5 m-3 rounded-2xl border border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setActiveTab(ExamCategory.REGULAR)}
              className={`flex-1 py-3.5 text-sm rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2
                ${activeTab === ExamCategory.REGULAR ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <BookOpen size={18} /> SUMATIF / FORMATIF
            </button>
            <button
              onClick={() => setActiveTab(ExamCategory.TKA)}
              className={`flex-1 py-3.5 text-sm rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2
                ${activeTab === ExamCategory.TKA ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-md scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <GraduationCap size={18} /> TKA KELAS 6
            </button>
          </div>

          <div className="p-6 md:p-10 pt-4">
            <form onSubmit={handleGenerate} className="space-y-8">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-3">
                  <X className="shrink-0" size={18} />
                  <span className="text-sm font-semibold">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeTab === ExamCategory.REGULAR ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tingkat Kelas</label>
                      <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold opacity-80">
                         <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
                         {classLevel}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Semester</label>
                      <div className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                        <Calendar size={18} />
                        {semester}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Mata Pelajaran</label>
                      <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-semibold text-slate-900 dark:text-slate-100">
                        <option value="">-- Pilih --</option>
                        {availableSubjects.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Jenis Ujian</label>
                      <select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-semibold text-slate-900 dark:text-slate-100">
                        {Object.values(ExamType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Topik Utama (Materi Sem 2)</label>
                      <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-semibold truncate text-slate-900 dark:text-slate-100">
                        <option value="">-- Pilih Materi --</option>
                        {topicOptions.map((t, idx) => <option key={idx} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Kategori (Filter)</label>
                      <select value={tkaSubject} onChange={(e) => setTkaSubject(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-semibold text-slate-900 dark:text-slate-100">
                        <option value="Gabungan">Gabungan (Semua)</option>
                        <option value="Bahasa Indonesia">Bahasa Indonesia (Verbal)</option>
                        <option value="Matematika">Matematika (Numerik/Logika/Spasial)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Mode Materi</label>
                      <div className="flex gap-2">
                         <button type="button" onClick={() => setTkaTopicMode('ALL')} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${tkaTopicMode === 'ALL' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400'}`}>SEMUA</button>
                         <button type="button" onClick={() => setTkaTopicMode('SPECIFIC')} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${tkaTopicMode === 'SPECIFIC' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400'}`}>PILIH</button>
                      </div>
                    </div>
                    
                    {tkaTopicMode === 'SPECIFIC' && (
                      <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {getFilteredTkaTopics().map(t => (
                          <label key={t} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                             <input type="checkbox" checked={selectedTkaTopics.includes(t)} onChange={() => handleTkaTopicToggle(t)} className="w-4 h-4 accent-purple-600 rounded" />
                             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">{t}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Jumlah Soal</label>
                      <select value={tkaCount} onChange={(e) => setTkaCount(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-semibold text-slate-900 dark:text-slate-100">
                        {[10, 15, 20].map(n => <option key={n} value={n}>{n} Soal</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tipe Soal TKA</label>
                      <select value={tkaQuestionType} onChange={(e) => setTkaQuestionType(e.target.value as QuestionType)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-semibold text-slate-900 dark:text-slate-100">
                        {Object.values(QuestionType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === ExamCategory.REGULAR && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Kuantitas Soal</label>
                    <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-semibold text-slate-900 dark:text-slate-100">
                      {[10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n} Soal</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Logo Instansi (Opsional)</label>
                  <label className={`w-full h-[52px] flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${uploadedImage ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'}`}>
                    <ImagePlus size={18} className={uploadedImage ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    <span className={`text-sm font-bold ${uploadedImage ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-500'}`}>{uploadedImage ? 'LOGO SIAP' : 'UPLOAD LOGO'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                <div className="md:col-span-2 p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 rounded-3xl border border-slate-100 dark:border-slate-600 flex flex-col sm:flex-row gap-6 items-center justify-center">
                   <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShuffleQuestions(!shuffleQuestions)}>
                      <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${shuffleQuestions ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-500'}`}>
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${shuffleQuestions ? 'left-7' : 'left-1'}`}></div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Acak Soal</span>
                   </div>
                   <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShuffleOptions(!shuffleOptions)}>
                      <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${shuffleOptions ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-500'}`}>
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${shuffleOptions ? 'left-7' : 'left-1'}`}></div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Acak Pilihan</span>
                   </div>
                </div>
              </div>

              <div className="relative pt-4">
                {loading ? (
                  <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 relative">
                     <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500" style={{width: `${progress}%`}}></div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                           <span className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase">AI sedang merancang soal teks...</span>
                        </div>
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400">{Math.floor(progress)}%</span>
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-4">
                    <button 
                      type="button" 
                      onClick={handlePreview}
                      disabled={previewLoading}
                      className="group flex-1 py-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-lg shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {previewLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Eye size={22} />}
                      <span className="tracking-widest uppercase text-base">Pratinjau</span>
                    </button>
                    
                    <button 
                      type="submit" 
                      className={`group flex-[2] py-5 rounded-2xl text-white font-black text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden active:scale-95 ${activeTab === ExamCategory.REGULAR ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600' : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'}`}
                    >
                      <Sparkles size={24} className="group-hover:animate-bounce" /> 
                      <span className="tracking-widest uppercase">Generate Soal</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* PREVIEW MODAL */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-700">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Pratinjau Soal (Sampel)</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Topik: {previewData.meta.topic}</p>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {previewData.questions.map((q, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800 shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0 text-sm">
                      {q.number}
                    </div>
                    <div className="flex-grow space-y-3">
                      {q.stimulusText && (
                        <div className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border-l-2 border-slate-400 dark:border-slate-500 text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: q.stimulusText }} />
                      )}
                      
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {q.isHots && <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1 py-0.5 rounded border border-red-200 dark:border-red-800 mr-2 font-black align-middle">HOTS</span>}
                        {q.question}
                      </div>

                      {q.options && (
                        <div className="grid grid-cols-1 gap-1.5 ml-1">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-bold w-4 text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + i)}.</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2 bg-green-50/50 dark:bg-green-900/10 p-2 rounded">
                        <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-green-700 dark:text-green-400">Kunci: {q.correctAnswer}</span>
                          <p className="text-slate-500 dark:text-slate-400 mt-1 italic">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center text-xs text-slate-400 italic">
                Ini hanya contoh 2 soal. Klik "Generate Soal" untuk membuat paket lengkap sesuai pengaturan.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              >
                Tutup & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 text-center bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
          Copyright © 2025 Bank Soal SDN 14 Andopan • Powered by Gemini AI
        </p>
      </footer>

      <AnimatedMascot />
    </div>
  );
}

export default App;
