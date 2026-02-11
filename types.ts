
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
  type: 'Pilihan Ganda' | 'Isian'; // New Property
  isHots: boolean; // Menandai apakah soal ini High Order Thinking Skills
  stimulusText?: string; 
  question: string;
  options?: string[]; 
  correctAnswer: string;
  explanation: string;
  imageDescription?: string; // Deskripsi untuk panduan guru mencari/membuat gambar
  imageCaption?: string; // Keterangan Gambar (misal: "Gambar 1.1 Diagram...")
  generatedImage?: string | null; 
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
  uploadedImage?: string | null; 
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
