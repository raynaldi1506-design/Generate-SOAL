
import React from 'react';
import { GeneratedExam } from '../types';
import { Download, Printer, ArrowLeft, FileDown, Image as ImageIcon } from 'lucide-react';

interface Props {
  data: GeneratedExam;
  onBack: () => void;
}

const ExamOutput: React.FC<Props> = ({ data, onBack }) => {

  const handlePrint = () => {
    window.print();
  };

  const isTKA = data.title.toUpperCase().includes('TKA');

  const handleDownloadWord = () => {
    const questionsHtml = `
      <table style="width: 100%; border-collapse: collapse; font-family: 'Arial Narrow', sans-serif; font-size: 11pt; line-height: 1.15;">
        ${data.questions.map((q) => {
          let imageHtml = '';
          if (q.generatedImage) {
            imageHtml = `<img src="${q.generatedImage}" style="float: right; margin-left: 10pt; margin-bottom: 5pt; max-width: 150pt; height: auto; border: 1px solid #ddd;" />`;
          } else if (q.imageDescription) {
            imageHtml = `
              <div style="float: right; margin-left: 10pt; margin-bottom: 5pt; width: 140pt; min-height: 100pt; border: 1.5pt dashed #999; background-color: #fafafa; padding: 8pt; text-align: center; font-size: 9pt; color: #444;">
                 <div style="font-weight: bold; margin-bottom: 4pt; color: #000; text-transform: uppercase; font-size: 8pt;">[ ILUSTRASI ]</div>
                 <div style="font-style: italic; color: #666; line-height: 1.2;">"${q.imageDescription}"</div>
              </div>
            `;
          }

          const stimulusHtml = q.stimulusText ? `
            <div style="margin-bottom: 8pt; padding: 10pt; border: 0.5pt solid #555; background-color: #fefefe; line-height: 1.4; border-left: 3pt solid #000;">
              ${q.stimulusText}
            </div>
          ` : '';

          return `
          <tr style="page-break-inside: avoid;">
            <td style="border: none; padding: 4pt; width: 25pt; vertical-align: top; text-align: center; font-weight: bold;">${q.number}.</td>
            <td style="border: none; padding: 4pt; vertical-align: top; text-align: justify;">
              
              ${imageHtml}
              ${stimulusHtml}

              <div style="margin-bottom: 6pt; font-weight: bold;">${q.question}</div>
              
              ${q.options && q.options.length > 0 ? `
                <table style="width: 100%; border: none; font-family: 'Arial Narrow', sans-serif; font-size: 11pt; margin-top: 5pt; clear: both;">
                  ${q.options.map((opt, idx) => `
                    <tr>
                      <td style="border: none; padding: 1pt; vertical-align: top; width: 18pt; font-weight: bold;">${String.fromCharCode(65 + idx)}.</td>
                      <td style="border: none; padding: 1pt; vertical-align: top;">${opt}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : '<div style="clear: both; min-height: 30pt; border-bottom: 0.5pt dotted #000; margin-top: 10pt;"></div>'}
            </td>
          </tr>
        `}).join('')}
      </table>
    `;

    const answerKeyRows = data.questions.map((q) => `
      <tr>
        <td style="text-align: center; font-weight: bold; border: 1px solid black;">${q.number}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid black;">${q.correctAnswer}</td>
        <td style="text-align: justify; border: 1px solid black;">${q.explanation}</td>
      </tr>
    `).join('');

    const dateStr = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: 210mm 330mm; margin: 15mm; }
          body { font-family: 'Arial Narrow', sans-serif; font-size: 11pt; line-height: 1.15; }
          table { width: 100%; border-collapse: collapse; }
          .meta td { border: none; padding: 0; font-weight: bold; }
          /* Tabel di dalam stimulus */
          .stimulus-box table { border: 1px solid black; margin: 5pt 0; width: 100%; }
          .stimulus-box table td, .stimulus-box table th { border: 1px solid black; padding: 3pt; text-align: center; }
        </style>
      </head>
      <body>
        <div style="text-align: center; border-bottom: 2pt solid black; padding-bottom: 5pt; margin-bottom: 15pt;">
          <span style="font-size: 12pt; font-weight: bold;">PEMERINTAH KABUPATEN SIJUNJUNG</span><br>
          <span style="font-size: 12pt; font-weight: bold;">DINAS PENDIDIKAN DAN KEBUDAYAAN</span><br>
          <span style="font-size: 16pt; font-weight: bold;">SDN 14 ANDOPAN</span><br>
          <i style="font-size: 9pt;">Alamat: Jor. Andopan Nagari Lubuak Tarok Kode pos : 27553</i>
        </div>
        <div style="text-align: center; text-decoration: underline; margin-bottom: 10pt; font-weight: bold; font-size: 12pt;">${data.title}</div>
        <table class="meta" style="margin-bottom: 15pt;">
          <tr><td width="300">Mata Pelajaran: ${data.meta.subject}</td><td>Tahun Ajaran: ${data.meta.year}</td></tr>
          <tr><td>Kelas / Semester: ${data.meta.classLevel} / ${data.meta.semester}</td><td>Topik: ${data.meta.topic}</td></tr>
        </table>
        ${questionsHtml}
        <br clear=all style='page-break-before:always'>
        <div style="text-align: center; font-weight: bold; margin-bottom: 15pt; font-size: 12pt;">KUNCI JAWABAN DAN PEMBAHASAN</div>
        <table style="border: 1px solid black; width: 100%;">
          <tr style="background-color: #f0f0f0;"><th width="40" style="border: 1px solid black;">No</th><th width="60" style="border: 1px solid black;">Kunci</th><th style="border: 1px solid black;">Pembahasan</th></tr>
          ${answerKeyRows}
        </table>
        <div style="margin-top: 50pt; margin-left: 60%; text-align: center;">
          Andopan, ${dateStr}<br>Guru Kelas<br><br><br><br><b>NASRIWANTO, S.Pd</b>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/\s+/g, '_')}_sdn14andopan.doc`;
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
            <FileDown size={18} /> Unduh (.doc)
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">
            <Printer size={18} /> Cetak / PDF
          </button>
        </div>
      </div>

      {/* Main Sheet Container */}
      <div className="p-12 print:p-0 bg-white">
        {/* Kop Surat Header */}
        <div className="text-center mb-8 border-b-[4px] border-black pb-5">
          <h1 className="text-xl font-bold uppercase tracking-tighter">PEMERINTAH KABUPATEN SIJUNJUNG</h1>
          <h2 className="text-lg font-bold uppercase tracking-tighter">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
          <h3 className="text-4xl font-black uppercase mt-1">SDN 14 ANDOPAN</h3>
          <p className="text-xs italic mt-1 text-slate-700 font-bold">Alamat: Jor. Andopan Nagari Lubuak Tarok Kode pos : 27553</p>
        </div>

        {/* Exam Title & Meta */}
        <div className="mb-10">
          <h4 className="text-center font-bold text-2xl uppercase underline mb-8 decoration-2 underline-offset-8">{data.title}</h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-12 font-bold text-[11.5pt] border-y border-slate-100 py-4">
             <div className="flex"><span className="w-36 text-slate-500">Mata Pelajaran</span><span className="mr-3">:</span>{data.meta.subject}</div>
             <div className="flex"><span className="w-36 text-slate-500">Tahun Ajaran</span><span className="mr-3">:</span>{data.meta.year}</div>
             <div className="flex"><span className="w-36 text-slate-500">Kelas / Sem</span><span className="mr-3">:</span>{data.meta.classLevel} / {data.meta.semester}</div>
             <div className="flex"><span className="w-36 text-slate-500">Topik</span><span className="mr-3">:</span>{data.meta.topic}</div>
          </div>
        </div>

        {/* Questions Body */}
        <div className="space-y-8">
          {data.questions.map((q, idx) => (
            <div key={idx} className="flex gap-4 avoid-break group">
              <div className="w-10 shrink-0 text-center font-black text-lg bg-slate-50 rounded-lg py-1">{q.number}.</div>
              <div className="flex-grow">
                
                {/* AI Visual Stimulus */}
                {q.generatedImage && (
                  <div className="float-right ml-6 mb-6">
                     <img src={q.generatedImage} className="max-w-[220px] border-4 border-slate-100 p-2 bg-white shadow-xl rounded-xl rotate-1" alt="Stimulus Visual" />
                  </div>
                )}

                {/* AI Textual/Data Stimulus */}
                {q.stimulusText && (
                  <div className="mb-6 p-5 bg-slate-50 border-l-4 border-slate-900 rounded-r-2xl text-slate-900 leading-relaxed shadow-sm stimulus-content">
                     {!isTKA && <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">✦ STIMULUS BACAAN/DATA ✦</div>}
                     <div dangerouslySetInnerHTML={{ __html: q.stimulusText }} />
                  </div>
                )}

                {/* Question Text */}
                <div className="text-justify mb-4 font-bold text-[11.5pt] leading-relaxed text-slate-900">
                  {q.question}
                </div>
                
                {/* MC Options */}
                {q.options && q.options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-4 clear-both">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-4 items-start group-hover:bg-slate-50 transition-colors rounded-lg p-1.5 -ml-1.5">
                        <span className="font-black shrink-0 w-6 h-6 flex items-center justify-center bg-white border-2 border-slate-100 rounded text-sm">{String.fromCharCode(65 + oIdx)}</span>
                        <span className="text-justify leading-snug">{opt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="clear-both h-16 border-b-2 border-dotted border-slate-200 mt-6 mb-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Key Page */}
        <div className="page-break no-print mt-24"></div>
        <div className="mt-20 pt-10 border-t-8 border-slate-900">
           <h3 className="text-center font-black text-3xl mb-10 tracking-widest text-slate-900">KUNCI JAWABAN & ANALISIS</h3>
           <table className="w-full border-collapse border-4 border-slate-900">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border-2 border-slate-800 p-4 w-20 text-center font-black">NO</th>
                  <th className="border-2 border-slate-800 p-4 w-24 text-center font-black">KUNCI</th>
                  <th className="border-2 border-slate-800 p-4 text-left font-black">PEMBAHASAN ANALITIS</th>
                </tr>
              </thead>
              <tbody>
                {data.questions.map((q, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border-2 border-slate-200 p-4 text-center font-black text-xl">{q.number}</td>
                    <td className="border-2 border-slate-200 p-4 text-center font-black text-2xl text-blue-600">{q.correctAnswer}</td>
                    <td className="border-2 border-slate-200 p-4 text-justify italic text-sm text-slate-700 leading-relaxed">
                      {q.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
           
           {/* Final Signature Section */}
           <div className="mt-20 flex justify-end">
              <div className="text-center w-80">
                <p className="font-bold text-slate-600">Andopan, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                <p className="mt-3 font-black text-slate-900 uppercase tracking-wider">Guru Kelas / Wali Kelas</p>
                <div className="h-32"></div>
                <p className="font-black underline text-xl decoration-4 underline-offset-4 text-slate-900">NASRIWANTO, S.Pd</p>
                <p className="text-sm font-black text-slate-400 mt-1">NIP. .....................................</p>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        .stimulus-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stimulus-content th, .stimulus-content td {
          border: 1px solid #cbd5e1;
          padding: 10px;
          text-align: center;
          font-size: 10.5pt;
        }
        .stimulus-content th {
          background-color: #f1f5f9;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          font-size: 9pt;
        }
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          body { background: white; padding: 0; }
          .stimulus-content table { border: 1.5pt solid black; }
          .stimulus-content th, .stimulus-content td { border: 1pt solid black; color: black; }
          .stimulus-content th { background-color: #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default ExamOutput;
