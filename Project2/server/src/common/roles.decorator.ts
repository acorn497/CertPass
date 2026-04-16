import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const USER_ROLES = ['student', 'instructor', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
