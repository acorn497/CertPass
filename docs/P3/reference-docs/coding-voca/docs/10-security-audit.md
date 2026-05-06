# 보안 감사 리포트

**감사 일자:** 2026-03-10
**감사 범위:** server/src/*, client/src/* 전체 코드베이스

---

## 요약

| 심각도 | 발견 | 수정완료 | 수정실패 | 미수정(수동조치필요) |
|--------|------|----------|----------|---------------------|
| CRITICAL | 3 | 1 | 0 | 2 |
| HIGH | 4 | 4 | 0 | 0 |
| MEDIUM | 5 | 5 | 0 | 0 |
| LOW | 3 | 3 | 0 | 0 |
| **합계** | **15** | **13** | **0** | **2** |

---

## CRITICAL

### 1. JWT_SECRET 기본값 폴백 (`'default-secret'`)
- **파일:** `server/src/config/env.ts:7`
- **문제:** JWT_SECRET 환경변수 미설정 시 `'default-secret'`로 폴백 → 토큰 위조 가능
- **수정:** 환경변수 미설정 시 서버 시작 차단 (throw Error)
- **상태: ✅ 수정완료**

### 2. .env 파일에 하드코딩된 JWT_SECRET
- **파일:** `server/.env`
- **문제:** `JWT_SECRET="coding-voca-super-secret-key-change-in-production"` — 예측 가능한 시크릿
- **권장:** `crypto.randomBytes(32).toString('hex')`로 생성한 강력한 시크릿으로 교체
- **상태: ⚠️ 수동 조치 필요** (사용자가 직접 시크릿 값 변경 필요)

### 3. .env 파일에 DB 비밀번호 노출
- **파일:** `server/.env`
- **문제:** `DATABASE_URL`에 `postgres:postgres` 기본 자격증명 포함
- **권장:** 강력한 DB 비밀번호로 변경, .env를 .gitignore에 추가
- **부분 조치:** 루트 `.gitignore`에 `.env` 추가 완료
- **상태: ⚠️ 수동 조치 필요** (DB 비밀번호 변경 필요)

---

## HIGH

### 4. 보안 헤더 미설정 (Helmet.js 없음)
- **파일:** `server/src/app.ts`
- **문제:** X-Frame-Options, X-Content-Type-Options, HSTS 등 보안 헤더 누락
- **수정:** `helmet` 패키지 설치 및 적용
- **상태: ✅ 수정완료**

### 5. CORS 무제한 허용
- **파일:** `server/src/app.ts:19`
- **문제:** `cors()` 기본값 → 모든 origin 허용
- **수정:** `env.CLIENT_URL` (기본값 `http://localhost:5173`)로 origin 제한
- **상태: ✅ 수정완료**

### 6. 인증 엔드포인트 Rate Limiting 없음
- **파일:** `server/src/routes/admin/auth.ts`, `server/src/routes/user/auth.ts`
- **문제:** 로그인/회원가입 무제한 요청 가능 → 브루트포스 공격 취약
- **수정:** `express-rate-limit` 설치, 15분당 20회 제한 적용 (admin/login, auth/login, auth/register)
- **상태: ✅ 수정완료**

### 7. bcrypt salt rounds 부족 (10회)
- **파일:** `server/src/services/userService.ts:21`
- **문제:** salt rounds 10회 → 현대 하드웨어에서 크래킹 위험
- **수정:** 12회로 증가
- **상태: ✅ 수정완료**

---

## MEDIUM

### 8. Admin/User JWT 토큰 구분 없음
- **파일:** `server/src/middleware/auth.ts`, `server/src/middleware/userAuth.ts`
- **문제:** 동일한 JWT_SECRET 사용, audience 클레임 없음 → 토큰 교차 사용 가능성
- **수정:** admin 토큰에 `audience: 'admin'`, user 토큰에 `audience: 'user'` 추가. 검증 시 audience 확인
- **상태: ✅ 수정완료**

### 9. 검색 쿼리 길이 제한 없음
- **파일:** `server/src/services/wordService.ts:53-61`
- **문제:** 매우 긴 검색 문자열로 DB 성능 저하 가능
- **수정:** `search.trim().slice(0, 100)`으로 100자 제한
- **상태: ✅ 수정완료**

### 10. 비밀번호 복잡도 규칙 부족
- **파일:** `server/src/validators/userValidator.ts:10`
- **문제:** 최소 8자만 요구, 복잡도 없음 → `"12345678"` 같은 약한 비밀번호 허용
- **수정:** 영문자 + 숫자 필수 조건 추가
- **상태: ✅ 수정완료**

### 11. 라우트 파라미터 ID 양수 검증 누락
- **파일:** `server/src/controllers/adminController.ts` (여러 곳)
- **문제:** `isNaN()` 체크만 수행, 음수 ID 허용
- **수정:** `isNaN(id) || id <= 0` 조건으로 강화
- **상태: ✅ 수정완료**

### 12. 클라이언트 localStorage JSON.parse 에러 처리 없음
- **파일:** `client/src/context/AuthContext.tsx:19`, `client/src/context/UserAuthContext.tsx:20`
- **문제:** 손상된 localStorage 데이터 시 앱 크래시
- **수정:** try-catch 추가, 파싱 실패 시 해당 키 제거 후 null 반환
- **상태: ✅ 수정완료**

---

## LOW

### 13. Request Body 크기 제한 없음
- **파일:** `server/src/app.ts:20`
- **문제:** `express.json()` 기본값 → 대용량 페이로드로 메모리 고갈 가능
- **수정:** `express.json({ limit: '1mb' })` 적용
- **상태: ✅ 수정완료**

### 14. 프로덕션 환경에서 에러 스택 트레이스 노출
- **파일:** `server/src/middleware/errorHandler.ts:18`
- **문제:** 모든 환경에서 `err.stack` 콘솔 출력, 500 에러 시 내부 메시지 응답
- **수정:** development에서만 stack 출력, 500 에러 시 일반 메시지(`"서버 내부 오류가 발생했습니다."`) 반환
- **상태: ✅ 수정완료**

### 15. 루트 .gitignore에 .env 미등록
- **파일:** (루트 .gitignore 없었음)
- **문제:** .env 파일이 git에 커밋될 위험
- **수정:** 루트에 `.gitignore` 생성, `.env`, `.env.local`, `.env.production` 등록
- **상태: ✅ 수정완료**

---

## 긍정적 발견사항 (잘 구현된 부분)

1. **SQL Injection 방어:** Prisma ORM 사용으로 Raw SQL 없음
2. **입력 검증:** 모든 POST/PUT 엔드포인트에 Zod 스키마 검증 적용
3. **로그인 에러 메시지:** 아이디/비밀번호 구분 없는 통합 에러 메시지 (사용자 열거 방지)
4. **소유권 검증:** 단어장/퀴즈에 userId 기반 접근 제어 구현
5. **XSS 방어:** CodeBlock의 `dangerouslySetInnerHTML` 사용 전 HTML 이스케이프 처리

---

## 수동 조치 필요 사항

> 아래 항목은 코드 수정만으로 해결할 수 없으며, 운영자가 직접 조치해야 합니다.

### 1. JWT_SECRET 교체
```bash
# 강력한 시크릿 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 출력된 값을 server/.env의 JWT_SECRET에 설정
```

### 2. DB 비밀번호 변경
PostgreSQL 비밀번호를 강력한 값으로 변경 후 `server/.env`의 `DATABASE_URL` 업데이트

### 3. 프로덕션 배포 시
- `CLIENT_URL` 환경변수를 실제 프론트엔드 도메인으로 설정
- HTTPS 적용 (Helmet의 HSTS가 자동 활성화됨)
- JWT 토큰을 httpOnly 쿠키로 마이그레이션 검토

---

## 설치된 보안 패키지

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `helmet` | latest | HTTP 보안 헤더 자동 설정 |
| `express-rate-limit` | latest | API Rate Limiting |

---

## 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `server/src/config/env.ts` | JWT_SECRET 필수 검증, CLIENT_URL 추가 |
| `server/src/app.ts` | helmet, CORS 제한, rate limiting, body size limit 추가 |
| `server/src/services/userService.ts` | bcrypt 12회, JWT audience:'user' |
| `server/src/services/adminService.ts` | JWT audience:'admin' |
| `server/src/middleware/auth.ts` | JWT audience 검증 |
| `server/src/middleware/userAuth.ts` | JWT audience 검증 |
| `server/src/validators/userValidator.ts` | 비밀번호 복잡도 규칙 추가 |
| `server/src/controllers/adminController.ts` | ID 양수 검증 |
| `server/src/services/wordService.ts` | 검색 쿼리 100자 제한 |
| `server/src/middleware/errorHandler.ts` | 프로덕션 스택 트레이스 숨김 |
| `client/src/context/AuthContext.tsx` | JSON.parse try-catch |
| `client/src/context/UserAuthContext.tsx` | JSON.parse try-catch |
| `.gitignore` | 신규 생성 (.env 보호) |
