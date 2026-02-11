
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
      Bertindaklah sebagai Pakar Pembuat Soal Kurikulum Merdeka (Asesmen Nasional/AKM) untuk tingkat Sekolah Dasar.
      Buatkan ${details.count} butir soal untuk mata pelajaran ${details.subject} Kelas ${details.classLevel}, Semester ${details.semester}, Tahun Ajaran ${details.year}.
      Topik: ${details.topic}. Jenis Ujian: ${details.examType}.
      
      ATURAN KRITIKAL:
      1. KUNCI JAWABAN: Properti 'correctAnswer' HARUS HANYA berisi SATU HURUF saja (A, B, C, atau D). JANGAN menuliskan teks jawaban di properti ini.
      2. KLASIFIKASI HOTS: Variasikan soal LOTS dan HOTS. Tandai HOTS dengan 'isHots: true'.
      3. STIMULUS GAMBAR: Hanya soal HOTS yang boleh memiliki 'imageDescription'. Soal LOTS biarkan kosong.
      4. STIMULUS TEKS: Gunakan 'stimulusText' (format HTML table jika data angka) untuk soal literasi/numerasi.
      5. KUALITAS: Soal harus menantang logika siswa SD. 'explanation' harus mendalam.
    `;
  } else {
    title = `TES KEMAMPUAN AKADEMIK (TKA) - ${details.topic}`;
    prompt = `
      Bertindaklah sebagai Pembuat Soal TKA (Tes Potensi Akademik) level SD Kelas 6.
      Buatkan ${details.count} butir soal TKA dengan Topik: ${details.topic}.
      Bentuk Soal: ${details.questionType}.
      
      ATURAN KUNCI JAWABAN:
      - Properti 'correctAnswer' HARUS HANYA berisi SATU HURUF saja (A, B, C, atau D).
      - Jika isian (Essay), tuliskan kata kunci jawabannya secara singkat.
      
      ATURAN STIMULUS:
      - Gunakan 'isHots: true' untuk soal logika/spasial.
      - Berikan 'imageDescription' HANYA jika visual sangat diperlukan.
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
                isHots: { type: Type.BOOLEAN },
                stimulusText: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.STRING, description: "HANYA HURUF (A, B, C, atau D)" },
                explanation: { type: Type.STRING },
                imageDescription: { type: Type.STRING },
                imageCaption: { type: Type.STRING }
              },
              required: ["number", "isHots", "question", "correctAnswer", "explanation"]
            }
          }
        }
      }
    }
  });

  const rawJSON = response.text;
  if (!rawJSON) throw new Error("Gagal mengambil data dari AI");

  let questions: Question[] = JSON.parse(rawJSON).questions;

  if (details.shuffleOptions) {
    questions = questions.map(q => {
      if (q.options && q.options.length > 0) {
        // Find original correct text before shuffling
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
    questions = shuffleArray(questions);
  }

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
  return null;
};
