import { z } from 'zod';
import { APPLICATION_STATUSES } from '../schemas/instructor-application.schema';

export const CreateApplicationSchema = z.object({
  motivation: z.string().min(10, '신청 사유를 10자 이상 입력해주세요'),
});

export const ReviewApplicationSchema = z.object({
  reviewNote: z.string().optional(),
});

export const ListApplicationsQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
});

export type CreateApplicationDto = z.infer<typeof CreateApplicationSchema>;
export type ReviewApplicationDto = z.infer<typeof ReviewApplicationSchema>;
