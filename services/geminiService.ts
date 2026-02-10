
import { GoogleGenAI, Type } from "@google/genai";
import { ExamType, QuestionType, GeneratedExam, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Utility to shuffle an array
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
    questionType?: QuestionType; // specific for TKA
    count: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
  }
): Promise<GeneratedExam> => {

  const model = "gemini-3-flash-preview";

  let prompt = "";
  let title = "";

  if (category === 'REGULAR') {
    const typeLabel = details.examType?.toUpperCase() || "UJIAN";
    title = `${typeLabel} - ${details.subject}`;
    
    prompt = `
      Bertindaklah sebagai Pakar Pembuat Soal Kurikulum Merdeka (Asesmen Nasional/AKM).
      Buatkan ${details.count} butir soal untuk mata pelajaran ${details.subject} Kelas ${details.classLevel}, Semester ${details.semester}, Tahun Ajaran ${details.year}.
      Topik Utama: ${details.topic}. Jenis Ujian: ${details.examType}.
      
      PEDOMAN STIMULUS (SANGAT KRITIKAL):
      1. ANALISIS KEBUTUHAN: 
         - Jika soal hanya menanyakan fakta langsung/hafalan, JANGAN buat stimulus (biarkan stimulusText kosong).
         - Jika soal menguji penalaran, literasi, atau numerasi (HOTS), BUATKAN stimulus yang mendalam.
      2. FORMAT STIMULUS:
         - TEKS/CERITA: Gunakan paragraf narasi, deskripsi tokoh, atau berita singkat.
         - TABEL: Jika menyajikan data, gunakan format HTML sederhana <table><tr><td>...</td></tr></table>.
         - VISUAL: Jika butuh gambar pendukung (grafik, diagram, ilustrasi kejadian), jelaskan di 'imageDescription'.
      3. KOMBINASI: Sebuah soal bisa memiliki 'stimulusText' (teks/tabel) DAN 'imageDescription' (gambar) sekaligus untuk konteks yang kuat.
      4. KUNCI JAWABAN: Harus tepat dan berikan 'explanation' yang menjelaskan alur logika jawaban.
    `;
  } else {
    title = `TES KEMAMPUAN AKADEMIK (TKA) - ${details.topic}`;
    prompt = `
      Bertindaklah sebagai Pembuat Soal TKA (Tes Potensi Akademik) profesional level SD Kelas 6.
      Buatkan ${details.count} butir soal TKA dengan Topik: ${details.topic}.
      Bentuk Soal: ${details.questionType}.
      
      ATURAN STIMULUS TKA:
      - Untuk soal Verbal/Logika: Buat stimulus berupa cerita pendek atau premis silogisme di 'stimulusText'.
      - Untuk soal Numerik: Berikan tabel data atau pola angka di 'stimulusText'.
      - Untuk soal Spasial: Berikan deskripsi detail gambar di 'imageDescription'.
      - Gunakan format HTML <table> jika butuh tabel.
      - Jika soal sangat sederhana, kosongkan stimulus.
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
                stimulusText: { 
                  type: Type.STRING, 
                  description: "Bacaan/Cerita/Tabel HTML. Kosongkan jika soal tidak memerlukan stimulus teks/data." 
                },
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "4 pilihan jawaban. Kosongkan jika Essay." 
                },
                correctAnswer: { type: Type.STRING, description: "Huruf (A-D) atau kunci isian singkat." },
                explanation: { type: Type.STRING, description: "Pembahasan logis." },
                imageDescription: { 
                  type: Type.STRING, 
                  description: "Deskripsi visual jika soal butuh stimulus gambar." 
                }
              },
              required: ["number", "question", "correctAnswer", "explanation"]
            }
          }
        }
      }
    }
  });

  const rawJSON = response.text;
  if (!rawJSON) throw new Error("Gagal mengambil data dari AI");

  let questions: Question[] = JSON.parse(rawJSON).questions;

  // Handle shuffling options (preserving correct answer mapping)
  if (details.shuffleOptions) {
    questions = questions.map(q => {
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

  // Handle shuffling questions order
  if (details.shuffleQuestions) {
    questions = shuffleArray(questions);
  }

  // Re-numbering
  questions = questions.map((q, idx) => ({
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
    questions: questions
  };
};

export const generateIllustration = async (description: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Clear educational black and white line art illustration for primary school. Subject: ${description}. Plain white background, professional textbook style.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    const base64String = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64String) {
      return `data:image/jpeg;base64,${base64String}`;
    }
    return null;
  } catch (error) {
    console.error("Gagal generate gambar:", error);
    return null;
  }
};
