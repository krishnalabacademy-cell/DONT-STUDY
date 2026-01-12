export type Tab = 'focus' | 'coach' | 'analyze' | 'test' | 'report';

export type Subject = 'Maths' | 'Physics' | 'Chemistry' | 'Biology' | 'Social Science' | 'English' | 'IT';

export interface StudySession {
  date: string; // YYYY-MM-DD
  duration: number; // in seconds
  subject: Subject;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  year?: string;
}

export interface TestResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  year?: string;
}

export interface IncorrectAnswerRecord {
    [question: string]: number; // count of incorrect answers
}


export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: Sender;
  image?: string | null;
}

export interface VoiceTurn {
    user: string;
    ai: string;
}