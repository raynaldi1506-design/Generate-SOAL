import React, { useState } from 'react';
import { GeneratedExam, Question } from '../types';
import { Printer, ArrowLeft, FileDown, ImagePlus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  data: GeneratedExam;
  onBack: () => void;
}

const ExamOutput: React.FC<Props> = ({ data, onBack }) => {
  const [examData, setExamData] = useState<GeneratedExam>(data);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    const originalTitle = document.title;
    const safeSubject = examData.meta.subject.replace(/[^a-zA-Z0-9]/g, '_');
    const safeClass = examData.meta.classLevel.replace(/[^a-zA-Z0-9]/g, '_');
    const safeType = examData.title.replace(/[^a-zA-Z0-9]/g, '_');
    
    document.title = `${safeType}_${safeSubject}_${safeClass}_SDN14ANDOPAN`;
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
        setIsPrinting(false);
      }, 1000); 
    }, 800);
  };

  const handleQuestionImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedQuestions = [...examData.questions];
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          generatedImage: reader.result as string
        };
        setExamData({ ...examData, questions: updatedQuestions });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQuestionImage = (index: number) => {
    const updatedQuestions = [...examData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      generatedImage: null
    };
    setExamData({ ...examData, questions: updatedQuestions });
  };

  const getCleanLetter = (answer: string) => {
    const match = answer.match(/^[A-D]/i);
    return match ? match[0].toUpperCase() : answer.trim().toUpperCase();
  };

  // Helper untuk render HTML Word
  const renderQuestionToHtml = (q: Question) => {
    let imageHtml = '';
    if (q.generatedImage) {
      imageHtml = `
        <div style="text-align: center; margin-bottom: 5pt; clear: both;">
          <img src="${q.generatedImage}" style="max-width: 100%; height: auto; border: 1px solid #000;" /><br>
          <i style="font-size: 9pt;">${q.imageCaption || ''}</i>
        </div>`;
    } else if (q.imageDescription) {
      imageHtml = `
        <div style="text-align: center; margin-bottom: 5pt; padding: 10pt; border: 1px dashed #000; background-color: #f9f9f9; font-size: 9pt; color: #555;">
          [Tempat Gambar: ${q.imageDescription}]
        </div>
      `;
    }

    const stimulusHtml = q.stimulusText ? `
      <div style="margin-bottom: 5pt; padding: 5pt; border: 1px solid #000; background-color: #fff; line-height: 1.1; border-left: 3px solid #000; font-size: 10pt;">
        ${q.stimulusText}
      </div>
    ` : '';

    const optionsHtml = (q.type === 'Pilihan Ganda' && q.options) ? `
      <table style="width: 100%; border: none; font-family: 'Arial Narrow', sans-serif; font-size: 11pt; margin-top: 2pt; clear: both;">
        ${q.options.map((opt, idx) => `
          <tr>
            <td style="border: none; padding: 2pt; vertical-align: top; width: 18pt; font-weight: bold;">${String.fromCharCode(65 + idx)}.</td>
            <td style="border: none; padding: 2pt; vertical-align: top;">${opt}</td>
          </tr>
        `).join('')}
      </table>
    ` : `
      <div style="margin-top: 8pt; margin-bottom: 8pt; border-bottom: 1px dotted black;"></div>
      <div style="margin-bottom: 8pt; border-bottom: 1px dotted black;"></div>
      <div style="margin-bottom: 8pt; border-bottom: 1px dotted black;"></div>
    `;

    return `
      <div style="margin-bottom: 12pt; break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid;">
        <table style="width: 100%; border: none; font-family: 'Arial Narrow', sans-serif; font-size: 11pt; line-height: 1.1;">
          <tr>
            <td style="border: none; padding: 2pt; width: 20pt; vertical-align: top; text-align: center; font-weight: bold;">${q.number}.</td>
            <td style="border: none; padding: 2pt; vertical-align: top; text-align: justify;">
              ${stimulusHtml}
              ${imageHtml}
              <div style="margin-bottom: 3pt; font-weight: bold;">${q.isHots ? '(HOTS) ' : ''}${q.question}</div>
              ${optionsHtml}
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  const handleDownloadWord = () => {
    const mcqs = examData.questions.filter(q => q.type === 'Pilihan Ganda');
    const essays = examData.questions.filter(q => q.type === 'Isian');

    const mcqHtml = mcqs.length > 0 ? `
      <div style="font-weight: bold; margin-bottom: 10pt; font-size: 12pt;">I. PILIHAN GANDA</div>
      <div style="column-count: 2; -webkit-column-count: 2; -moz-column-count: 2; column-gap: 1cm; width: 100%;">
        ${mcqs.map(renderQuestionToHtml).join('')}
      </div>
    ` : '';

    const essayHtml = essays.length > 0 ? `
      <br clear=all>
      <div style="font-weight: bold; margin-top: 15pt; margin-bottom: 10pt; font-size: 12pt;">II. ISIAN / URAIAN (HOTS)</div>
      <div style="width: 100%;">
        ${essays.map(renderQuestionToHtml).join('')}
      </div>
    ` : '';

    const answerKeyRows = examData.questions.map((q) => `
      <tr>
        <td style="text-align: center; font-weight: bold; border: 1px solid black; padding: 3pt;">${q.number}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid black; padding: 3pt;">
          ${q.type === 'Pilihan Ganda' ? getCleanLetter(q.correctAnswer) : q.correctAnswer}
        </td>
        <td style="text-align: justify; border: 1px solid black; padding: 3pt; font-style: italic; font-size: 10pt;">${q.explanation}</td>
      </tr>
    `).join('');

    const dateStr = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: 210mm 330mm; margin: 15mm; }
          body { font-family: 'Arial Narrow', sans-serif; font-size: 11pt; line-height: 1.0; }
          table { border-collapse: collapse; }
          .meta td { border: none; padding: 0; font-weight: bold; line-height: 1; }
        </style>
      </head>
      <body>
        <div style="text-align: center; border-bottom: 2pt solid black; padding-bottom: 3pt; margin-bottom: 10pt;">
          <span style="font-size: 12pt; font-weight: bold;">PEMERINTAH KABUPATEN SIJUNJUNG</span><br>
          <span style="font-size: 11pt; font-weight: bold;">DINAS PENDIDIKAN DAN KEBUDAYAAN</span><br>
          <span style="font-size: 14pt; font-weight: bold;">SDN 14 ANDOPAN</span><br>
          <i style="font-size: 8pt;">Alamat: Jor. Andopan Nagari Lubuak Tarok Kode pos : 27553</i>
        </div>
        
        <table class="meta" style="width: 100%; margin-bottom: 8pt; font-size: 10pt; line-height: 1;">
          <tr>
            <td style="width: 50%;">Mata Pelajaran: ${examData.meta.subject}</td>
            <td style="width: 50%;">Tahun Ajaran: ${examData.meta.year}</td>
          </tr>
          <tr>
            <td>Kelas / Semester: ${examData.meta.classLevel} / ${examData.meta.semester}</td>
            <td>Topik: ${examData.meta.topic}</td>
          </tr>
        </table>
        
        ${mcqHtml}
        ${essayHtml}
        
        <br clear=all style='page-break-before:always'>
        <div style="text-align: center; font-weight: bold; margin-bottom: 10pt; font-size: 11pt;">KUNCI JAWABAN DAN PEMBAHASAN</div>
        <table style="border: 1px solid black; width: 100%; line-height: 1.1;">
          <tr style="background-color: #f0f0f0;">
            <th width="30" style="border: 1px solid black; padding: 4pt; text-align: center; font-size: 10pt;">NO</th>
            <th width="80" style="border: 1px solid black; padding: 4pt; text-align: center; font-size: 10pt;">KUNCI</th>
            <th style="border: 1px solid black; padding: 4pt; text-align: center; font-size: 10pt;">PEMBAHASAN ANALITIS</th>
          </tr>
          ${answerKeyRows}
        </table>
        <div style="margin-top: 30pt; margin-left: 60%; text-align: center; font-size: 10pt;">
          Andopan, ${dateStr}<br>Guru Kelas<br><br><br><b>NASRIWANTO, S.Pd</b>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${examData.title.replace(/\s+/g, '_')}_sdn14andopan.doc`;
    link.click();
  };

  const mcQuestions = examData.questions.filter(q => q.type === 'Pilihan Ganda');
  const essayQuestions = examData.questions.filter(q => q.type === 'Isian');

  // Render Component for a single question
  const QuestionItem: React.FC<{ q: Question; idx: number }> = ({ q, idx }) => (
    <div key={idx} style={{ marginBottom: '12pt', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Arial Narrow", sans-serif', fontSize: '11pt', lineHeight: '1.1' }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', padding: '2pt', width: '20pt', verticalAlign: 'top', textAlign: 'center', fontWeight: 'bold', color: 'black' }}>{q.number}.</td>
            <td style={{ border: 'none', padding: '2pt', verticalAlign: 'top', textAlign: 'justify', color: 'black' }}>
              {/* Stimulus Text */}
              {q.stimulusText && (
                <div className="stimulus-content" 
                      style={{ marginBottom: '5pt', padding: '5pt', border: '1px solid #000', backgroundColor: '#fff', lineHeight: '1.1', borderLeft: '3px solid #000', fontSize: '10pt', color: 'black' }} 
                      dangerouslySetInnerHTML={{ __html: q.stimulusText }} 
                />
              )}

              {/* Image Logic */}
              {(q.generatedImage || q.imageDescription) && (
                <div className="my-2 clear-both flex flex-col items-center gap-1.5 w-full relative group">
                  {q.generatedImage ? (
                    <div className="text-center relative">
                        <img src={q.generatedImage} alt="Soal" style={{ maxWidth: '100%', height: 'auto', border: '1px solid #000', display: 'inline-block' }} />
                        <div className="text-[9pt] italic mt-1 text-black">{q.imageCaption}</div>
                        <button 
                          onClick={() => removeQuestionImage(q.number - 1)}
                          className="no-print absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus Gambar"
                        >
                          <Trash2 size={12} />
                        </button>
                    </div>
                  ) : (
                      <div className="no-print w-full flex flex-col items-center bg-blue-50/50 p-2 rounded border border-dashed border-blue-300 hover:bg-blue-50 transition-colors">
                        <label className="flex flex-col items-center justify-center cursor-pointer w-full">
                          <div className="flex items-center gap-2 text-blue-600">
                              <ImagePlus size={16} />
                              <span className="text-[10px] font-bold uppercase">Upload</span>
                          </div>
                          <p className="text-[8pt] text-center text-slate-500 italic mt-1 leading-tight px-1">"{q.imageDescription}"</p>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuestionImageUpload(q.number - 1, e)} />
                        </label>
                      </div>
                  )}
                  {/* Visual Placeholder for Print/View consistency if no image uploaded */}
                  {!q.generatedImage && q.imageDescription && (
                      <div className="hidden print:block w-full border border-dashed border-slate-400 p-2 text-center text-[9pt] italic text-slate-500 bg-slate-50">
                        [Tempat Gambar: {q.imageDescription}]
                      </div>
                  )}
                </div>
              )}

              {/* Question Text */}
              <div style={{ marginBottom: '3pt', fontWeight: 'bold' }}>
                {q.isHots && (
                  <span className="no-print inline-flex items-center gap-0.5 bg-red-100 text-red-700 text-[9px] px-1 py-0 rounded border border-red-200 mr-1 align-middle">
                      HOTS
                  </span>
                )}
                <span className="print:hidden text-black">{q.question}</span>
                {/* Format for Print to match Word */}
                <span className="hidden print:inline text-black">{q.isHots ? '(HOTS) ' : ''}{q.question}</span>
              </div>
              
              {/* Options Table (Only for PG) */}
              {q.type === 'Pilihan Ganda' && q.options && q.options.length > 0 ? (
                <table style={{ width: '100%', border: 'none', fontFamily: '"Arial Narrow", sans-serif', fontSize: '11pt', marginTop: '2pt', clear: 'both' }}>
                  <tbody>
                    {q.options.map((opt, oIdx) => (
                      <tr key={oIdx} className="hover:bg-slate-50 transition-colors rounded">
                        <td style={{ border: 'none', padding: '2pt', verticalAlign: 'top', width: '18pt', fontWeight: 'bold', color: 'black' }}>{String.fromCharCode(65 + oIdx)}.</td>
                        <td style={{ border: 'none', padding: '2pt', verticalAlign: 'top', color: 'black' }}>{opt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              {/* Essay Lines (Only for Essay) */}
              {q.type === 'Isian' && (
                <div className="w-full mt-2 space-y-3">
                   <div className="border-b border-black border-dotted w-full h-6"></div>
                   <div className="border-b border-black border-dotted w-full h-6"></div>
                   <div className="border-b border-black border-dotted w-full h-6"></div>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      {/* App Bar */}
      <div className="no-print p-4 flex justify-between items-center bg-slate-900 dark:bg-slate-800 text-white sticky top-0 z-50 shadow-xl border-b border-blue-500/30">
        <button onClick={onBack} className="flex items-center gap-2 font-bold hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="flex gap-3">
          <button onClick={handleDownloadWord} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">
            <FileDown size={18} /> Unduh Word
          </button>
          
          <button 
            type="button"
            onClick={handlePrint} 
            disabled={isPrinting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 cursor-pointer min-w-[160px] justify-center
              ${isPrinting 
                ? 'bg-orange-500 text-white cursor-wait' 
                : 'bg-slate-700 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'}`}
          >
            {isPrinting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="animate-pulse">Menyiapkan...</span>
              </>
            ) : (
              <>
                <Printer size={18} /> Cetak / PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Sheet Container */}
      <div id="printable-area" className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none min-h-screen my-8 print:my-0 text-black dark:text-black" style={{ fontFamily: '"Arial Narrow", sans-serif' }}>
        <div className="p-10 print:p-0">
          {/* Kop Surat Header */}
          <div className="text-center mb-4 border-b-[3px] border-black pb-3 flex items-center justify-center gap-6">
            {examData.uploadedImage && (
               <img src={examData.uploadedImage} className="w-16 h-16 object-contain print:block" alt="Logo" />
            )}
            <div className="flex-grow">
              <h1 className="text-lg font-bold uppercase tracking-tighter text-black">PEMERINTAH KABUPATEN SIJUNJUNG</h1>
              <h2 className="text-base font-bold uppercase tracking-tighter text-black">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
              <h3 className="text-3xl font-black uppercase mt-0.5 text-black">SDN 14 ANDOPAN</h3>
              <p className="text-[10px] italic mt-0.5 text-black font-bold">Alamat: Jor. Andopan Nagari Lubuak Tarok Kode pos : 27553</p>
            </div>
          </div>

          {/* Identity Section */}
          <table className="w-full mb-6 text-[10pt] font-bold border-collapse" style={{ lineHeight: '1' }}>
            <tbody>
              <tr>
                <td className="w-1/2 align-top pb-1 text-black">Mata Pelajaran: {examData.meta.subject}</td>
                <td className="w-1/2 align-top pb-1 text-black">Tahun Ajaran: {examData.meta.year}</td>
              </tr>
              <tr>
                <td className="align-top text-black">Kelas / Semester: {examData.meta.classLevel} / {examData.meta.semester}</td>
                <td className="align-top text-black">Topik: {examData.meta.topic}</td>
              </tr>
            </tbody>
          </table>

          {/* SECTION A: PILIHAN GANDA */}
          {mcQuestions.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-black text-[12pt] mb-2 uppercase border-b border-black inline-block">I. Pilihan Ganda</h3>
              <div style={{ columnCount: 2, columnGap: '1cm', width: '100%' }}>
                {mcQuestions.map((q, idx) => (
                  <QuestionItem key={idx} q={q} idx={idx} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION B: ISIAN */}
          {essayQuestions.length > 0 && (
            <div className="mb-4 mt-6">
              <h3 className="font-bold text-black text-[12pt] mb-4 uppercase border-b border-black inline-block">II. Isian / Uraian (HOTS)</h3>
              <div className="w-full">
                {essayQuestions.map((q, idx) => (
                  <QuestionItem key={idx} q={q} idx={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Answer Key Page */}
          <div className="page-break no-print mt-16"></div>
          <div className="mt-12 pt-6 border-t-4 border-black">
             <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-0.5 bg-black flex-grow"></div>
                <h3 className="text-center font-black text-xl tracking-[0.2em] text-black uppercase">KUNCI JAWABAN</h3>
                <div className="h-0.5 bg-black flex-grow"></div>
             </div>
             
             <table className="w-full border-collapse border-[1.5pt] border-black">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border-[1pt] border-black p-2 w-12 text-center font-black text-black text-sm">NO</th>
                    <th className="border-[1pt] border-black p-2 w-32 text-center font-black text-black text-sm">KUNCI</th>
                    <th className="border-[1pt] border-black p-2 text-center font-black text-black text-sm uppercase">PEMBAHASAN ANALITIS</th>
                  </tr>
                </thead>
                <tbody>
                  {examData.questions.map((q, i) => (
                    <tr key={i} className="bg-white">
                      <td className="border border-black p-2 text-center font-black text-black text-sm">{q.number}</td>
                      <td className="border border-black p-2 text-center font-bold text-sm text-blue-900 print:text-black">
                        {q.type === 'Pilihan Ganda' ? getCleanLetter(q.correctAnswer) : q.correctAnswer}
                      </td>
                      <td className="border border-black p-2 text-justify italic text-[9.5pt] text-black leading-snug">
                        {q.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
             
             <div className="mt-12 flex justify-end">
                <div className="text-center w-64">
                  <p className="font-bold text-black text-sm">Andopan, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                  <p className="mt-2 font-black text-black uppercase tracking-wider text-sm">Guru Kelas / Wali Kelas</p>
                  <div className="h-20"></div>
                  <p className="font-black underline text-lg text-black">NASRIWANTO, S.Pd</p>
                  <p className="text-[9px] font-black text-slate-400">NIP. .....................................</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .stimulus-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          background: white;
        }
        .stimulus-content th, .stimulus-content td {
          border: 1px solid #000;
          padding: 4px 8px;
          text-align: center;
          font-size: 9.5pt;
          color: #000;
        }
        .stimulus-content th {
          background-color: #f8fafc;
          font-weight: 800;
        }
        @media print {
          @page {
            margin: 10mm;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .stimulus-content table { border: 1pt solid black; }
          .stimulus-content th, .stimulus-content td { border: 1pt solid black; color: black; }
          .stimulus-content th { background-color: #eee !important; }
          .text-blue-900 { color: #000 !important; }
        }
      `}</style>
    </div>
  );
};

export default ExamOutput;