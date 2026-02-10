
import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Sparkles, ImagePlus, X, CheckCircle2, Shuffle, Zap, Calendar } from 'lucide-react';
import Marquee from './components/Marquee';
import ExamOutput from './components/ExamOutput';
import AnimatedMascot from './components/AnimatedMascot';
import { generateQuestions, generateIllustration } from './services/geminiService';
import { ACADEMIC_YEAR, ExamCategory, ExamType, GeneratedExam, QuestionType } from './types';
import { CURRICULUM_DATA, TKA_TOPICS } from './constants';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ExamCategory>(ExamCategory.REGULAR);
  const [generatedData, setGeneratedData] = useState<GeneratedExam | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>(""); 
  const [progress, setProgress] = useState(0); 
  const [imageProgress, setImageProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Shuffle Settings
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  // Form State - Regular (Locked to Semester 2)
  const [year] = useState(ACADEMIC_YEAR);
  const [semester] = useState<string>("Semester 2");
  const [classLevel, setClassLevel] = useState<string>("Kelas 4");
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

  // Helper for filtering TKA topics
  const getFilteredTkaTopics = () => {
    if (tkaSubject === "Gabungan") return TKA_TOPICS;
    if (tkaSubject === "Bahasa Indonesia") return TKA_TOPICS.filter(t => t.startsWith("Verbal"));
    if (tkaSubject === "Matematika") return TKA_TOPICS.filter(t => !t.startsWith("Verbal"));
    return [];
  };

  const handleTkaTopicToggle = (topic: string) => {
    setSelectedTkaTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  // Logic to determine available topics for Regular
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === ExamCategory.REGULAR && (!subject || !topic)) {
      setError("Mohon pilih Mata Pelajaran dan Materi");
      return;
    }
    if (activeTab === ExamCategory.TKA && tkaTopicMode === 'SPECIFIC' && selectedTkaTopics.length === 0) {
      setError("Mohon pilih minimal satu topik TKA");
      return;
    }

    setLoading(true);
    setLoadingStage("text");
    setImageProgress(null);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => prev >= 95 ? 95 : prev + (prev > 70 ? 0.5 : 2));
    }, 200);

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
      
      const questionsWithImages = result.questions.filter(q => !!q.imageDescription);
      if (questionsWithImages.length > 0) {
        setLoadingStage("images");
        setImageProgress({ current: 0, total: questionsWithImages.length });
        let completed = 0;
        await Promise.all(result.questions.map(async (q) => {
          if (q.imageDescription) {
            try {
              const img = await generateIllustration(q.imageDescription);
              if (img) q.generatedImage = img;
            } finally {
              completed++;
              setImageProgress({ current: completed, total: questionsWithImages.length });
            }
          }
          return q;
        }));
      }

      await new Promise(r => setTimeout(r, 600)); 
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-100">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 shadow-sm z-30 border-b border-slate-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg">
                <Zap size={24} className="fill-current" />
             </div>
             <div>
               <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                 AI EXAM <span className="teks-anim-glow text-blue-600">GENERATOR</span>
               </h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SDN 14 ANDOPAN • KURIKULUM MERDEKA</p>
             </div>
          </div>
        </div>
      </header>

      <Marquee />

      <main className="flex-grow p-4 md:p-8 relative">
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue-100/40 rounded-full blur-3xl -z-10 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-100/40 rounded-full blur-3xl -z-10 animate-float" style={{animationDelay: '1.5s'}}></div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="flex bg-slate-50/50 p-1.5 m-3 rounded-2xl border border-slate-100">
            <button
              onClick={() => setActiveTab(ExamCategory.REGULAR)}
              className={`flex-1 py-3.5 text-sm rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2
                ${activeTab === ExamCategory.REGULAR ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <BookOpen size={18} /> SUMATIF / FORMATIF
            </button>
            <button
              onClick={() => setActiveTab(ExamCategory.TKA)}
              className={`flex-1 py-3.5 text-sm rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2
                ${activeTab === ExamCategory.TKA ? 'bg-white text-purple-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <GraduationCap size={18} /> TKA KELAS 6
            </button>
          </div>

          <div className="p-6 md:p-10 pt-4">
            <form onSubmit={handleGenerate} className="space-y-8">
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                  <X className="shrink-0" size={18} />
                  <span className="text-sm font-semibold">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeTab === ExamCategory.REGULAR ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tingkat Kelas</label>
                      <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-semibold">
                        {["Kelas 4", "Kelas 5", "Kelas 6"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Semester</label>
                      <div className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center gap-2 text-blue-700 font-bold">
                        <Calendar size={18} />
                        {semester}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mata Pelajaran</label>
                      <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-semibold">
                        <option value="">-- Pilih --</option>
                        {availableSubjects.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Jenis Ujian</label>
                      <select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-semibold">
                        {Object.values(ExamType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Topik Utama (Materi Sem 2)</label>
                      <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-semibold truncate">
                        <option value="">-- Pilih Materi --</option>
                        {topicOptions.map((t, idx) => <option key={idx} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Kategori (Filter)</label>
                      <select value={tkaSubject} onChange={(e) => setTkaSubject(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white transition-all outline-none font-semibold">
                        <option value="Gabungan">Gabungan (Semua)</option>
                        <option value="Bahasa Indonesia">Bahasa Indonesia (Verbal)</option>
                        <option value="Matematika">Matematika (Numerik/Logika/Spasial)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mode Materi</label>
                      <div className="flex gap-2">
                         <button type="button" onClick={() => setTkaTopicMode('ALL')} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${tkaTopicMode === 'ALL' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>SEMUA</button>
                         <button type="button" onClick={() => setTkaTopicMode('SPECIFIC')} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${tkaTopicMode === 'SPECIFIC' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>PILIH</button>
                      </div>
                    </div>
                    
                    {tkaTopicMode === 'SPECIFIC' && (
                      <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {getFilteredTkaTopics().map(t => (
                          <label key={t} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors group">
                             <input type="checkbox" checked={selectedTkaTopics.includes(t)} onChange={() => handleTkaTopicToggle(t)} className="w-4 h-4 accent-purple-600 rounded" />
                             <span className="text-xs font-bold text-slate-600 group-hover:text-purple-700">{t}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Jumlah Soal</label>
                      <select value={tkaCount} onChange={(e) => setTkaCount(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white transition-all outline-none font-semibold">
                        {[10, 15, 20].map(n => <option key={n} value={n}>{n} Soal</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipe Soal TKA</label>
                      <select value={tkaQuestionType} onChange={(e) => setTkaQuestionType(e.target.value as QuestionType)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white transition-all outline-none font-semibold">
                        {Object.values(QuestionType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === ExamCategory.REGULAR && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Kuantitas Soal</label>
                    <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-semibold">
                      {[10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n} Soal</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ilustrasi Tambahan</label>
                  <label className={`w-full h-[52px] flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${uploadedImage ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200 hover:border-blue-400'}`}>
                    <ImagePlus size={18} className={uploadedImage ? 'text-blue-600' : 'text-slate-400'} />
                    <span className={`text-sm font-bold ${uploadedImage ? 'text-blue-700' : 'text-slate-500'}`}>{uploadedImage ? 'GAMBAR SIAP' : 'UPLOAD GAMBAR'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                <div className="md:col-span-2 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row gap-6 items-center justify-center">
                   <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShuffleQuestions(!shuffleQuestions)}>
                      <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${shuffleQuestions ? 'bg-blue-600' : 'bg-slate-300'}`}>
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${shuffleQuestions ? 'left-7' : 'left-1'}`}></div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Acak Soal</span>
                   </div>
                   <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShuffleOptions(!shuffleOptions)}>
                      <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${shuffleOptions ? 'bg-purple-600' : 'bg-slate-300'}`}>
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${shuffleOptions ? 'left-7' : 'left-1'}`}></div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Acak Pilihan</span>
                   </div>
                </div>
              </div>

              <div className="relative pt-4">
                {loading ? (
                  <div className="space-y-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
                     <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500" style={{width: `${progress}%`}}></div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                           <span className="text-sm font-black text-blue-900 uppercase">AI sedang memproses soal...</span>
                        </div>
                        <span className="text-xl font-black text-blue-600">{Math.floor(progress)}%</span>
                     </div>
                     {loadingStage === 'images' && imageProgress && (
                        <div className="mt-2 space-y-2 border-t border-slate-200 pt-4">
                           <p className="text-xs font-bold text-purple-600 flex items-center gap-2 italic">
                             <Sparkles size={14} /> GENERATING ILUSTRASI: {imageProgress.current} / {imageProgress.total}
                           </p>
                           <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-600 transition-all duration-500" style={{width: `${(imageProgress.current / imageProgress.total) * 100}%`}}></div>
                           </div>
                        </div>
                     )}
                  </div>
                ) : (
                  <button type="submit" className={`group w-full py-5 rounded-2xl text-white font-black text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden active:scale-95 ${activeTab === ExamCategory.REGULAR ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                    <Sparkles size={24} className="group-hover:animate-bounce" /> 
                    <span className="tracking-widest">GENERATE SEKARANG</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center bg-white border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          Copyright © 2025 Bank Soal SDN 14 Andopan • Powered by Gemini AI
        </p>
      </footer>

      <AnimatedMascot />
    </div>
  );
}

export default App;
