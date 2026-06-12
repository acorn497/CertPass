import api from './client';
import type { ApiResponse, Exam, ExamQuestion } from '../types';

export const examsApi = {
  getByCourse: (courseId: string) =>
    api.get<ApiResponse<Exam[]>>(`/courses/${courseId}/exams`),
  create: (courseId: string, data: { title: string; description?: string; timeLimit?: number | null }) =>
    api.post<ApiResponse<Exam>>(`/courses/${courseId}/exams`, data),
  getQuestions: (examId: string) =>
    api.get<ApiResponse<ExamQuestion[]>>(`/exams/${examId}/questions`),
  addQuestion: (
    examId: string,
    data: {
      content: string;
      options: string[];
      answer: number;
      explanation?: string;
      order: number;
    },
  ) => api.post<ApiResponse<unknown>>(`/exams/${examId}/questions`, data),
  submit: (examId: string, answers: Array<{ questionId: string; selected: number }>) =>
    api.post<ApiResponse<unknown>>(`/exams/${examId}/attempts`, { answers }),
};
