
export enum ExamCategory {
  REGULAR = 'REGULAR', // Formatif & Sumatif
  TKA = 'TKA' // Tes Kemampuan Akademik
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'Pilihan Ganda',
  COMPLEX_MC = 'Pilihan Ganda Kompleks',
  ESSAY = 'Isian/Uraian'
}

export enum ExamType {
  FORMATIF = 'Formatif',
  SUMATIF = 'Sumatif',
  MID = 'Mid Semester',
  SEMESTER = 'Semester'
}

export interface Question {
  number: number;
  stimulusText?: string; // Teks bacaan, tabel, atau stimulus sebelum soal
  question: string;
  options?: string[]; // For MC
  correctAnswer: string;
  explanation: string;
  imageDescription?: string; // Deskripsi untuk AI image generation
  generatedImage?: string | null; // Base64 string gambar yang dihasilkan
}

export interface GeneratedExam {
  title: string;
  meta: {
    classLevel: string;
    subject: string;
    topic: string;
    semester: string;
    year: string;
  };
  questions: Question[];
  uploadedImage?: string | null; // Global fallback
}

export interface CurriculumMap {
  [classLevel: string]: {
    [semester: string]: {
      name: string;
      topics: string[];
    }[];
  };
}

export const ACADEMIC_YEAR = "2025/2026";
