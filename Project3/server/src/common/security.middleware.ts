import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const blockedKeys = new Set(['$where', '$regex', '$gt', '$gte', '$lt', '$lte', '$ne', '$nin']);

function cleanObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => cleanObject(item));
  if (!value || typeof value !== 'object') return value;

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.') || blockedKeys.has(key)) continue;
    result[key] = cleanObject(nested);
  }
  return result;
}

function sanitizeString(value: string) {
  try {
    const sanitizeHtml = require('sanitize-html');
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
  } catch {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '');
  }
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, sanitizeValue(nested)]),
  );
}

@Injectable()
export class NoSqlInjectionMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    req.body = cleanObject(req.body) as Request['body'];
    next();
  }
}

@Injectable()
export class XssSanitizerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    req.body = sanitizeValue(req.body) as Request['body'];
    next();
  }
}
