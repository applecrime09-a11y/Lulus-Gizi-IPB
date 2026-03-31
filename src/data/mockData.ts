export interface Question {
  id: string;
  subject: 'TPS' | 'Literasi Bahasa Indonesia' | 'Literasi Bahasa Inggris' | 'Penalaran Matematika';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number; // For IRT simulation (0.1 to 1.0)
}

export const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    subject: 'TPS',
    question: 'Jika p = 2 dan q = 3, maka nilai dari p^q - q^p adalah...',
    options: ['-1', '1', '0', '2', '3'],
    correctAnswer: 0,
    explanation: '2^3 - 3^2 = 8 - 9 = -1.',
    difficulty: 0.3
  },
  {
    id: '2',
    subject: 'Penalaran Matematika',
    question: 'Sebuah tangki berisi air 1/3 bagian. Jika ditambah 10 liter, tangki menjadi berisi 1/2 bagian. Kapasitas tangki adalah...',
    options: ['40 liter', '50 liter', '60 liter', '70 liter', '80 liter'],
    correctAnswer: 2,
    explanation: 'Misal kapasitas T. 1/2 T - 1/3 T = 10 -> (3-2)/6 T = 10 -> 1/6 T = 10 -> T = 60.',
    difficulty: 0.5
  },
  {
    id: '3',
    subject: 'Literasi Bahasa Indonesia',
    question: 'Apa ide pokok dari paragraf tersebut?',
    options: ['Pentingnya gizi', 'IPB Kampus Rakyat', 'UTBK Sulit', 'Belajar 30 Hari', 'Masa depan cerah'],
    correctAnswer: 0,
    explanation: 'Teks membahas pentingnya asupan gizi bagi perkembangan otak.',
    difficulty: 0.4
  }
];

export const STUDY_PLAN = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  topic: i % 4 === 0 ? 'TPS: Penalaran Umum' : i % 4 === 1 ? 'Literasi B. Indonesia' : i % 4 === 2 ? 'Literasi B. Inggris' : 'Penalaran Matematika',
  tasks: ['Latihan 20 Soal', 'Review Pembahasan', 'Analisis Kelemahan'],
  isCompleted: false
}));

export const HARD_MOTIVATIONS = [
    "Ilmu Gizi IPB itu ketat. Kalau kamu masih malas, mending cari jurusan lain yang gampang.",
    "Sainganmu sedang belajar 12 jam sehari. Kamu? Masih scroll TikTok?",
    "Orang tuamu berharap kamu sukses. Jangan balas harapan mereka dengan kemalasan.",
    "IPB nggak butuh mahasiswa yang gampang menyerah. Buktikan kamu layak!",
    "Ingat targetmu: ILMU GIZI IPB. Jangan kasih kendor!",
    "Capek? Bagus. Itu artinya otakmu lagi kerja. Jangan manja.",
    "UTBK itu perang. Kalau nggak siap, ya mati di medan tempur."
];
