
import { GoogleGenAI, Type } from "@google/genai";
import { ExamType, QuestionType, GeneratedExam, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateQuestions = async (
  category: 'REGULAR' | 'TKA',
  details: {
    year: string;
    semester?: string;
    classLevel?: string;
    subject?: string;
    topic: string;
    examType?: ExamType;
    questionType?: QuestionType; 
    count: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
  }
): Promise<GeneratedExam> => {

  const model = "gemini-3-flash-preview";
  let prompt = "";
  let title = "";

  if (category === 'REGULAR') {
    title = (details.examType || "ASESMEN").toUpperCase();
    
    prompt = `
      Bertindaklah sebagai Pakar Pembuat Soal Kurikulum Merdeka (Asesmen Nasional/AKM) untuk SD.
      
      TUGAS UTAMA:
      Buat satu paket ujian yang terdiri dari DUA BAGIAN:
      1. BAGIAN A: ${details.count} soal Pilihan Ganda (PG).
      2. BAGIAN B: WAJIB ADA 5 soal Isian Singkat/Uraian (Essay) yang semuanya bersifat HOTS (High Order Thinking Skills).
      
      Konteks:
      - Mapel: ${details.subject}
      - Kelas: ${details.classLevel} (${details.semester})
      - Topik: ${details.topic}
      
      ATURAN PENTING:
      - Struktur JSON 'questions' harus mencakup PG dan Isian.
      - Gunakan field 'type': 'Pilihan Ganda' atau 'Isian'.
      - Untuk PG, 'correctAnswer' adalah satu huruf (A-D).
      - Untuk Isian, 'correctAnswer' adalah kata kunci jawaban singkat.
      - Bagian Isian harus menuntut analisis (C4-C6), stimulus bisa berupa studi kasus pendek.
    `;
  } else {
    title = `TES KEMAMPUAN AKADEMIK (TKA) - ${details.topic}`;
    prompt = `
      Bertindaklah sebagai Pembuat Soal TKA level SD Kelas 6.
      Buatkan ${details.count} butir soal Pilihan Ganda DAN 5 soal Isian Singkat (Logika/Analisis).
      Topik: ${details.topic}.
      
      Aturan:
      - Soal Isian harus menguji logika (HOTS).
      - Output format JSON sama.
    `;
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.INTEGER },
                type: { type: Type.STRING, enum: ['Pilihan Ganda', 'Isian'] },
                isHots: { type: Type.BOOLEAN },
                stimulusText: { type: Type.STRING, description: "Teks bacaan/data (HTML allowed)" },
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Kosongkan array ini jika tipe soal Isian"
                },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                imageDescription: { type: Type.STRING },
                imageCaption: { type: Type.STRING }
              },
              required: ["number", "type", "isHots", "question", "correctAnswer", "explanation"]
            }
          }
        }
      }
    }
  });

  const rawJSON = response.text;
  if (!rawJSON) throw new Error("Gagal mengambil data dari AI");

  let allQuestions: Question[] = JSON.parse(rawJSON).questions;

  // Pisahkan PG dan Isian
  let mcqs = allQuestions.filter(q => q.type === 'Pilihan Ganda' || (q.options && q.options.length > 0));
  let essays = allQuestions.filter(q => q.type === 'Isian' || (!q.options || q.options.length === 0));
  
  // Pastikan tipe data konsisten jika AI salah tagging
  mcqs = mcqs.map(q => ({...q, type: 'Pilihan Ganda' as const}));
  essays = essays.map(q => ({...q, type: 'Isian' as const}));

  // Shuffle Logic: Hanya acak PG, Isian tetap di bawah (atau acak isian tersendiri)
  if (details.shuffleOptions) {
    mcqs = mcqs.map(q => {
      if (q.options && q.options.length > 0) {
        const correctLetter = q.correctAnswer.trim().toUpperCase();
        const correctIdx = correctLetter.charCodeAt(0) - 65;
        
        if (correctIdx >= 0 && correctIdx < q.options.length) {
          const correctText = q.options[correctIdx];
          const shuffledOptions = shuffleArray(q.options);
          const newCorrectIdx = shuffledOptions.indexOf(correctText);
          
          return {
            ...q,
            options: shuffledOptions,
            correctAnswer: String.fromCharCode(65 + newCorrectIdx)
          };
        }
      }
      return q;
    });
  }

  if (details.shuffleQuestions) {
    mcqs = shuffleArray(mcqs);
    // Essays biasanya tidak diacak agar urutan logis (jika ada cerita bersambung), 
    // tapi kalau mau diacak: essays = shuffleArray(essays);
  }

  // Gabungkan kembali: PG dulu, baru Isian
  const finalQuestions = [...mcqs, ...essays].map((q, idx) => ({
    ...q,
    number: idx + 1
  }));

  return {
    title: title,
    meta: {
      classLevel: details.classLevel || "Kelas 6",
      subject: details.subject || "TKA",
      topic: details.topic,
      semester: details.semester || "-",
      year: details.year
    },
    questions: finalQuestions
  };
};

export const generateIllustration = async (description: string): Promise<string | null> => {
  return null;
};
