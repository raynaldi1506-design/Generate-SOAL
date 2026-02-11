
import React, { useState } from 'react';
import { GeneratedExam, Question } from '../types';
import { Download, Printer, ArrowLeft, FileDown, ImagePlus, Trash2, CheckCircle2, Zap } from 'lucide-react';

interface Props {
  data: GeneratedExam;
  onBack: () => void;
}

const ExamOutput: React.FC<Props> = ({ data, onBack }) => {
  const [examData, setExamData] = useState<GeneratedExam>(data);

  const handlePrint = () => {
    window.print();
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

  const handleDownloadWord = () => {
    const questionsHtml = `
      <table style="width: 100%; border-collapse: collapse; font-family: 'Arial Narrow', sans-serif; font-size: 11pt; line-height: 1.0;">
        ${examData.questions.map((q) => {
          let imageHtml = '';
          if (q.generatedImage) {
            imageHtml = `
              <div style="text-align: center; margin-bottom: 3pt; clear: both;">
                <img src="${q.generatedImage}" style="max-width: 200pt; height: auto; border: 0.5pt solid #555;" /><br>
                <i style="font-size: 8pt;">${q.imageCaption || ''}</i>
              </div>`;
          }

          const stimulusHtml = q.stimulusText ? `
            <div style="margin-bottom: 5pt; padding: 6pt; border: 0.5pt solid #555; background-color: #fefefe; line-height: 1.1; border-left: 2pt solid #000;">
              ${q.stimulusText}
            </div>
          ` : '';

          return `
          <tr style="page-break-inside: avoid;">
            <td style="border: none; padding: 2pt; width: 20pt; vertical-align: top; text-align: center; font-weight: bold;">${q.number}.</td>
            <td style="border: none; padding: 2pt; vertical-align: top; text-align: justify;">
              ${stimulusHtml}
              ${imageHtml}
              <div style="margin-bottom: 3pt; font-weight: bold;">${q.isHots ? '(HOTS) ' : ''}${q.question}</div>
              ${q.options && q.options.length > 0 ? `
                <table style="width: 100%; border: none; font-family: 'Arial Narrow', sans-serif; font-size: 11pt; margin-top: 2pt; clear: both;">
                  ${q.options.map((opt, idx) => `
                    <tr>
                      <td style="border: none; padding: 0.5pt; vertical-align: top; width: 15pt; font-weight: bold;">${String.fromCharCode(65 + idx)}.</td>
                      <td style="border: none; padding: 0.5pt; vertical-align: top;">${opt}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : '<div style="clear: both; min-height: 20pt; border-bottom: 0.5pt dotted #000; margin-top: 5pt;"></div>'}
            </td>
          </tr>
        `}).join('')}
      </table>
    `;

    const answerKeyRows = examData.questions.map((q) => `
      <tr>
        <td style="text-align: center; font-weight: bold; border: 1px solid black; padding: 3pt;">${q.number}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid black; padding: 3pt;">${getCleanLetter(q.correctAnswer)}</td>
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
          table { width: 100%; border-collapse: collapse; }
          .meta td { border: none; padding: 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div style="text-align: center; border-bottom: 2pt solid black; padding-bottom: 3pt; margin-bottom: 10pt;">
          <span style="font-size: 12pt; font-weight: bold;">PEMERINTAH KABUPATEN SIJUNJUNG</span><br>
          <span style="font-size: 11pt; font-weight: bold;">DINAS PENDIDIKAN DAN KEBUDAYAAN</span><br>
          <span style="font-size: 14pt; font-weight: bold;">SDN 14 ANDOPAN</span><br>
          <i style="font-size: 8pt;">Alamat: Jor. Andopan Nagari Lubuak Tarok Kode pos : 27553</i>
        </div>
        <div style="text-align: center; text-decoration: underline; margin-bottom: 8pt; font-weight: bold; font-size: 11pt;">${examData.title}</div>
        <table class="meta" style="margin-bottom: 10pt; font-size: 10pt;">
          <tr><td width="300">Mata Pelajaran: ${examData.meta.subject}</td><td>Tahun Ajaran: ${examData.meta.year}</td></tr>
          <tr><td>Kelas / Semester: ${examData.meta.classLevel} / ${examData.meta.semester}</td><td>Topik: ${examData.meta.topic}</td></tr>
        </table>
        ${questionsHtml}
        <br clear=all style='page-break-before:always'>
        <div style="text-align: center; font-weight: bold; margin-bottom: 10pt; font-size: 11pt;">KUNCI JAWABAN DAN PEMBAHASAN</div>
        <table style="border: 1px solid black; width: 100%; line-height: 1.1;">
          <tr style="background-color: #f0f0f0;">
            <th width="30" style="border: 1px solid black; padding: 4pt; text-align: center; font-size: 10pt;">NO</th>
            <th width="50" style="border: 1px solid black; padding: 4pt; text-align: center; font-size: 10pt;">KUNCI</th>
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

  return (
    <div className="max-w-[210mm] mx-auto bg-white min-h-screen shadow-2xl print:shadow-none" style={{ fontFamily: '"Arial Narrow", sans-serif' }}>
      {/* App Bar */}
      <div className="no-print p-4 flex justify-between items-center bg-slate-900 text-white sticky top-0 z-50 shadow-xl border-b border-blue-500/30">
        <button onClick={onBack} className="flex items-center gap-2 font-bold hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
          <ArrowLeft size={20} /> Kembali
        </button>
        <div className="flex gap-3">
          <button onClick={handleDownloadWord} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">
            <FileDown size={18} /> Unduh Word
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">
            <Printer size={18} /> Cetak / PDF
          </button>
        </div>
      </div>

      {/* Main Sheet Container */}
      <div className="p-10 print:p-0 bg-white">
        {/* Kop Surat Header */}
        <div className="text-center mb-6 border-b-[3px] border-black pb-4 flex items-center justify-center gap-6">
          {examData.uploadedImage && (
             <img src={examData.uploadedImage} className="w-16 h-16 object-contain print:block" alt="Logo" />
          )}
          <div className="flex-grow">
            <h1 className="text-lg font-bold uppercase tracking-tighter text-black">PEMERINTAH KABUPATEN SIJUNJUNG</h1>
            <h2 className="text-base font-bold uppercase tracking-tighter text-black">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
            <h3 className="text-3xl font-black uppercase mt-0.5 text-black">SDN 14 ANDOPAN</h3>
            <p className="text-[10px] italic mt-0.5 text-slate-700 font-bold">Alamat: Jor. Andopan Nagari Lubuak Tarok Kode pos : 27553</p>
          </div>
        </div>

        {/* Exam Title & Meta */}
        <div className="mb-6">
          <h4 className="text-center font-bold text-xl uppercase underline mb-6 decoration-2 underline-offset-4 text-black">{examData.title}</h4>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-10 font-bold text-[11pt] border-y border-slate-100 py-3">
             <div className="flex"><span className="w-32 text-slate-500">Mata Pelajaran</span><span className="mr-2">:</span>{examData.meta.subject}</div>
             <div className="flex"><span className="w-32 text-slate-500">Tahun Ajaran</span><span className="mr-2">:</span>{examData.meta.year}</div>
             <div className="flex"><span className="w-32 text-slate-500">Kelas / Sem</span><span className="mr-2">:</span>{examData.meta.classLevel} / {examData.meta.semester}</div>
             <div className="flex"><span className="w-32 text-slate-500">Topik</span><span className="mr-2">:</span>{examData.meta.topic}</div>
          </div>
        </div>

        {/* Questions Body - Compact Spacing */}
        <div className="space-y-4">
          {examData.questions.map((q, idx) => (
            <div key={idx} className="flex gap-3 avoid-break group relative">
              <div className="w-8 shrink-0 text-center font-black text-base bg-slate-50 rounded py-0.5 text-black">{q.number}.</div>
              <div className="flex-grow">
                
                {/* AI Textual/Data Stimulus - Compact */}
                {q.stimulusText && (
                  <div className="mb-3 p-3 bg-slate-50 border-l-3 border-slate-900 rounded-r-xl text-slate-900 text-sm leading-snug shadow-sm stimulus-content">
                     <div dangerouslySetInnerHTML={{ __html: q.stimulusText }} />
                  </div>
                )}

                {/* Stimulus Gambar Container - Compact */}
                {q.imageDescription && (
                  <div className="my-4 clear-both flex flex-col items-center gap-1.5">
                    {q.generatedImage ? (
                      <div className="relative group w-full flex flex-col items-center">
                        <img src={q.generatedImage} className="max-w-[70%] border border-slate-200 p-0.5 bg-white shadow-sm rounded" alt="Stimulus" />
                        <p className="mt-1 text-[10px] italic font-bold text-slate-900">{q.imageCaption}</p>
                        <button 
                          onClick={() => removeQuestionImage(idx)}
                          className="no-print absolute top-1 right-[15%] bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="no-print w-full flex flex-col items-center bg-blue-50/50 p-4 rounded-2xl border-2 border-dashed border-blue-200">
                        <label className="flex flex-col items-center justify-center cursor-pointer group">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                             <ImagePlus size={24} className="text-blue-500" />
                          </div>
                          <span className="text-[10px] font-black text-blue-700 mt-2 uppercase tracking-wider">Upload Gambar</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuestionImageUpload(idx, e)} />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Question Text */}
                <div className="text-justify mb-2 font-bold text-[11pt] leading-tight text-black flex items-start gap-2">
                  {q.isHots && (
                    <span className="shrink-0 bg-red-600 text-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm flex items-center gap-0.5 mt-0.5">
                      <Zap size={7} className="fill-current" /> HOTS
                    </span>
                  )}
                  <span>{q.question}</span>
                </div>
                
                {/* MC Options - Compact Grid */}
                {q.options && q.options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-2 clear-both">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2.5 items-start group-hover:bg-slate-50 transition-colors rounded p-0.5">
                        <span className="font-black shrink-0 w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded text-[10pt] text-black">{String.fromCharCode(65 + oIdx)}</span>
                        <span className="text-justify leading-tight text-black text-[10.5pt]">{opt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="clear-both h-12 border-b-2 border-dotted border-slate-200 mt-4 mb-1"></div>
                )}
              </div>
            </div>
          ))}
        </div>

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
                  <th className="border-[1pt] border-black p-2 w-16 text-center font-black text-black text-sm">KUNCI</th>
                  <th className="border-[1pt] border-black p-2 text-center font-black text-black text-sm uppercase">PEMBAHASAN ANALITIS</th>
                </tr>
              </thead>
              <tbody>
                {examData.questions.map((q, i) => (
                  <tr key={i} className="bg-white">
                    <td className="border border-black p-2 text-center font-black text-black text-sm">{q.number}</td>
                    <td className="border border-black p-2 text-center font-black text-xl text-blue-700">
                      {getCleanLetter(q.correctAnswer)}
                    </td>
                    <td className="border border-black p-2 text-justify italic text-[9.5pt] text-slate-800 leading-snug">
                      {q.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
           
           <div className="mt-12 flex justify-end">
              <div className="text-center w-64">
                <p className="font-bold text-slate-600 text-sm">Andopan, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                <p className="mt-2 font-black text-black uppercase tracking-wider text-sm">Guru Kelas / Wali Kelas</p>
                <div className="h-20"></div>
                <p className="font-black underline text-lg text-black">NASRIWANTO, S.Pd</p>
                <p className="text-[9px] font-black text-slate-400">NIP. .....................................</p>
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
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          body { background: white; padding: 0; line-height: 1.0; }
          .stimulus-content table { border: 1pt solid black; }
          .stimulus-content th, .stimulus-content td { border: 1pt solid black; color: black; }
          .stimulus-content th { background-color: #eee !important; }
          .text-blue-700 { color: #000 !important; }
        }
      `}</style>
    </div>
  );
};

export default ExamOutput;
