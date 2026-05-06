# Coding Voca — 일반 사용자 기능 상세 설계

> Phase 9~11 구현 기준 문서.
> 일반 사용자 회원가입/로그인 → 단어장 → 퀴즈 전체 플로우를 정의합니다.

## 서버 구현 현황 (Phase 9~11)

| 항목 | 상태 |
|------|------|
| Prisma 마이그레이션 (`add-user-features`) | ✅ 완료 |
| `middleware/userAuth.ts` | ✅ 완료 |
| `validators/userValidator.ts` | ✅ 완료 |
| `services/userService.ts` | ✅ 완료 |
| `services/wordbookService.ts` | ✅ 완료 |
| `services/quizService.ts` | ✅ 완료 |
| `controllers/` (user, wordbook, quiz) | ✅ 완료 |
| `routes/user/` (auth, wordbooks, quiz) | ✅ 완료 |
| `app.ts` 라우터 마운트 | ✅ 완료 |
| TypeScript 빌드 (`npm run build`) | ✅ 성공 |
| curl 엔드포인트 검증 | ✅ 전체 통과 |

---

## 1. 기능 개요

| 기능 | 설명 |
|------|------|
| 회원가입/로그인 | 이메일 또는 사용자명 기반 JWT 인증 |
| 단어장 (Wordbook) | 관심 단어를 모아 나만의 단어장 생성/관리 |
| 단어 담기 | 단어 목록/상세 페이지에서 단어장에 단어 추가 |
| 퀴즈 | 내 단어장을 기반으로 의미/스펠링 퀴즈 풀기 |
| 퀴즈 기록 | 과거 퀴즈 결과 이력 조회 |

---

## 2. 인증 전략

- **JWT (HS256)**, Bearer 토큰 방식
- Payload: `{ userId: number, username: string, iat, exp }`
- 토큰 유효시간: **7일**
- 클라이언트 저장: `localStorage('user_token')`, `localStorage('user_info')`
- 관리자 JWT (`admin_token`)와 **완전히 분리된** 미들웨어 사용

### 토큰 갱신 전략
- 만료 시 재로그인 유도 (refresh token은 MVP 이후 고려)

---

## 3. 데이터 모델

### 신규 테이블

```
users
├── id (PK)
├── username (unique)
├── email (unique)
├── passwordHash
├── createdAt
└── updatedAt

wordbooks (단어장)
├── id (PK)
├── userId (FK → users.id)
├── name
├── description?
├── isPublic (기본 false)
├── createdAt
└── updatedAt

wordbook_words (단어장 ↔ 단어)
├── id (PK)
├── wordbookId (FK → wordbooks.id, CASCADE DELETE)
├── wordId (FK → words.id, CASCADE DELETE)
├── memo? (사용자 메모)
├── addedAt
└── UNIQUE(wordbookId, wordId)

quiz_sessions (퀴즈 세션)
├── id (PK, UUID)
├── userId (FK → users.id)
├── wordbookId (FK → wordbooks.id)
├── mode (QuizMode enum)
├── totalCount
├── correctCount (기본 0)
├── startedAt
└── completedAt?

quiz_results (문항별 결과)
├── id (PK)
├── sessionId (FK → quiz_sessions.id, CASCADE DELETE)
├── wordId (FK → words.id)
├── isCorrect
├── userAnswer
├── correctAnswer
└── answeredAt
```

### Enum
```
QuizMode: meaning | spelling | mixed
```

### ERD 추가 관계
```
users ──┬── wordbooks ──┬── wordbook_words ──► words
        │               └── quiz_sessions ──► quiz_results ──► words
        └── quiz_sessions
```

### Prisma Schema 추가 (핵심 부분)

```prisma
model User {
  id           Int           @id @default(autoincrement())
  username     String        @unique @db.VarChar(50)
  email        String        @unique @db.VarChar(255)
  passwordHash String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  wordbooks    Wordbook[]
  quizSessions QuizSession[]
}

model Wordbook {
  id           Int            @id @default(autoincrement())
  userId       Int
  user         User           @relation(fields: [userId], references: [id])
  name         String         @db.VarChar(100)
  description  String?
  isPublic     Boolean        @default(false)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  words        WordbookWord[]
  quizSessions QuizSession[]
}

model WordbookWord {
  id         Int      @id @default(autoincrement())
  wordbookId Int
  wordbook   Wordbook @relation(fields: [wordbookId], references: [id], onDelete: Cascade)
  wordId     Int
  word       Word     @relation(fields: [wordId], references: [id], onDelete: Cascade)
  memo       String?
  addedAt    DateTime @default(now())
  @@unique([wordbookId, wordId])
}

model QuizSession {
  id           String       @id @default(uuid())
  userId       Int
  user         User         @relation(fields: [userId], references: [id])
  wordbookId   Int
  wordbook     Wordbook     @relation(fields: [wordbookId], references: [id])
  mode         QuizMode
  totalCount   Int
  correctCount Int          @default(0)
  startedAt    DateTime     @default(now())
  completedAt  DateTime?
  results      QuizResult[]
}

model QuizResult {
  id            Int         @id @default(autoincrement())
  sessionId     String
  session       QuizSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  wordId        Int
  word          Word        @relation(fields: [wordId], references: [id])
  isCorrect     Boolean
  userAnswer    String
  correctAnswer String
  answeredAt    DateTime    @default(now())
}

enum QuizMode { meaning spelling mixed }
```

---

## 4. API 설계

### 4-1. 사용자 인증 (`/api/auth`)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/auth/register` | ✗ | 회원가입 |
| POST | `/api/auth/login` | ✗ | 로그인 → JWT |
| GET  | `/api/auth/me` | ✓ User | 내 정보 |

**POST `/api/auth/register`**
```json
// Request
{ "username": "hong123", "email": "hong@example.com", "password": "pass1234" }

// Response 201
{ "token": "...", "user": { "id": 1, "username": "hong123", "email": "hong@example.com" } }
```

**POST `/api/auth/login`**
```json
// Request (username 또는 email 중 하나)
{ "credential": "hong123", "password": "pass1234" }

// Response 200
{ "token": "...", "user": { "id": 1, "username": "hong123", "email": "hong@example.com" } }
```

---

### 4-2. 단어장 (`/api/wordbooks`)

모든 엔드포인트는 사용자 인증 필요. 자신의 단어장만 접근 가능.

| Method | Path | 설명 |
|--------|------|------|
| GET    | `/api/wordbooks` | 내 단어장 목록 (단어 수 포함) |
| POST   | `/api/wordbooks` | 단어장 생성 |
| GET    | `/api/wordbooks/:id` | 단어장 상세 + 단어 목록 |
| PUT    | `/api/wordbooks/:id` | 단어장 수정 (이름/설명) |
| DELETE | `/api/wordbooks/:id` | 단어장 삭제 |
| POST   | `/api/wordbooks/:id/words` | 단어 추가 |
| DELETE | `/api/wordbooks/:id/words/:wordId` | 단어 제거 |

**GET `/api/wordbooks`** 응답:
```json
{
  "data": [
    {
      "id": 1,
      "name": "기초 단어 모음",
      "description": "처음 공부하는 단어들",
      "isPublic": false,
      "wordCount": 12,
      "createdAt": "2026-03-09T..."
    }
  ]
}
```

**GET `/api/wordbooks/:id`** 응답:
```json
{
  "data": {
    "id": 1,
    "name": "기초 단어 모음",
    "description": "처음 공부하는 단어들",
    "isPublic": false,
    "words": [
      {
        "id": 5, "word": "array", "pronunciationKr": "어레이",
        "difficulty": "beginner", "everydayMeaning": "...", "codingMeaning": "...",
        "category": { "id": 1, "name": "기초 문법" },
        "addedAt": "2026-03-09T...", "memo": null
      }
    ]
  }
}
```

**POST `/api/wordbooks/:id/words`**:
```json
// Request
{ "wordId": 5, "memo": "헷갈리는 단어" }

// Response 201
{ "message": "단어가 추가되었습니다.", "wordCount": 13 }
```

---

### 4-3. 퀴즈 (`/api/wordbooks/:id/quiz`, `/api/quiz`)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/wordbooks/:id/quiz` | 퀴즈 시작 (문제 생성) |
| POST | `/api/quiz/:sessionId/submit` | 답변 일괄 제출 + 결과 반환 |
| GET  | `/api/quiz/history` | 내 퀴즈 기록 목록 |
| GET  | `/api/quiz/:sessionId` | 특정 세션 결과 |

**POST `/api/wordbooks/:id/quiz`** (퀴즈 시작)
```json
// Request
{ "mode": "meaning", "count": 10 }

// Response 200
{
  "sessionId": "uuid-xxx",
  "mode": "meaning",
  "questions": [
    {
      "no": 1,
      "wordId": 5,
      "mode": "meaning",
      "prompt": "array",
      "promptSub": "어레이",
      "choices": ["배열", "함수", "반복문", "조건문"]
    },
    {
      "no": 2,
      "wordId": 12,
      "mode": "spelling",
      "prompt": "순환 / 반복하다",
      "promptSub": "루프"
    }
  ]
}
```

> **의미 맞추기 (meaning)**: `prompt` = 영어 단어, `choices` = 4지선다 한국어 의미
> **단어 맞추기 (spelling)**: `prompt` = 한국어 의미, 답 = 영어 단어 직접 입력
> **혼합 (mixed)**: 각 문항 `mode` 필드가 `meaning` 또는 `spelling`
> `choices`가 없으면 spelling 문항

**보기 생성 규칙 (의미 맞추기):**
- 정답 1개 + 오답 3개 (같은 단어장에서 우선, 부족하면 전체 DB에서 랜덤)
- 단어장에 단어 4개 미만이면 의미 맞추기 비활성화

**POST `/api/quiz/:sessionId/submit`** (답변 제출)
```json
// Request
{
  "answers": [
    { "no": 1, "answer": "배열" },
    { "no": 2, "answer": "loop" }
  ]
}

// Response 200
{
  "sessionId": "uuid-xxx",
  "score": 8,
  "total": 10,
  "percentage": 80,
  "results": [
    {
      "no": 1,
      "wordId": 5,
      "word": "array",
      "isCorrect": true,
      "userAnswer": "배열",
      "correctAnswer": "배열",
      "mode": "meaning"
    },
    {
      "no": 2,
      "wordId": 12,
      "word": "loop",
      "isCorrect": false,
      "userAnswer": "loop",
      "correctAnswer": "loop",
      "mode": "spelling"
    }
  ]
}
```

**스펠링 채점 규칙:**
- 대소문자 무시 (`toLowerCase()`)
- 앞뒤 공백 제거 (`trim()`)

**GET `/api/quiz/history`** 응답:
```json
{
  "data": [
    {
      "sessionId": "uuid-xxx",
      "wordbookName": "기초 단어 모음",
      "mode": "meaning",
      "score": 8,
      "total": 10,
      "percentage": 80,
      "completedAt": "2026-03-09T..."
    }
  ]
}
```

---

## 5. Zod 유효성 검증 규칙

```typescript
// 회원가입
const registerSchema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

// 로그인
const loginSchema = z.object({
  credential: z.string().min(1),  // username 또는 email
  password:   z.string().min(1),
});

// 단어장 생성/수정
const wordbookSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic:    z.boolean().optional().default(false),
});

// 단어 추가
const addWordSchema = z.object({
  wordId: z.number().int().min(1),
  memo:   z.string().max(200).optional(),
});

// 퀴즈 시작
const quizStartSchema = z.object({
  mode:  z.enum(['meaning', 'spelling', 'mixed']),
  count: z.number().int().min(1).max(50).default(10),
});
```

---

## 6. 미들웨어 파이프라인

```
POST /api/wordbooks/:id/words
  └─ cors()
  └─ express.json()
  └─ requireUserAuth   ← 사용자 JWT 검증, req.user 주입
  └─ validate(schema)  ← Zod 검증
  └─ controller        ← 자신의 리소스인지 검증 포함
  └─ errorHandler
```

### 소유권 검증
단어장/퀴즈 조회 시 `wordbook.userId !== req.user.userId`이면 `FORBIDDEN 403` 반환.

---

## 7. 서버 파일 구조 (신규)

```
server/src/
├── middleware/
│   └── userAuth.ts              ← requireUserAuth 미들웨어
├── validators/
│   └── userValidator.ts         ← 사용자 기능 Zod 스키마
├── services/
│   ├── userService.ts           ← 회원가입/로그인
│   ├── wordbookService.ts       ← 단어장 CRUD
│   └── quizService.ts           ← 퀴즈 생성/채점
├── controllers/
│   ├── userController.ts
│   ├── wordbookController.ts
│   └── quizController.ts
└── routes/
    └── user/
        ├── auth.ts              ← /api/auth/*
        ├── wordbooks.ts         ← /api/wordbooks/*
        └── quiz.ts              ← /api/quiz/*
```

---

## 8. 클라이언트 구조 (신규)

```
client/src/
├── api/
│   └── user.ts                  ← 사용자 API 호출 함수
├── context/
│   └── UserAuthContext.tsx      ← 사용자 인증 상태 (AdminAuthContext와 분리)
├── components/
│   ├── AddToWordbookButton/     ← 단어장 추가 버튼 컴포넌트 (상세/목록 페이지 공용)
│   └── QuizCard/                ← 퀴즈 문항 카드
└── pages/
    ├── auth/
    │   ├── UserLoginPage/       ← /login
    │   └── RegisterPage/        ← /register
    ├── wordbook/
    │   ├── MyWordbooksPage/     ← /my/wordbooks
    │   ├── WordbookDetailPage/  ← /my/wordbooks/:id
    │   └── WordbookNewPage/     ← /my/wordbooks/new (또는 모달)
    └── quiz/
        ├── QuizSetupPage/       ← /my/wordbooks/:id/quiz
        ├── QuizPlayPage/        ← /my/wordbooks/:id/quiz/play
        └── QuizResultPage/      ← /quiz/:sessionId/result
```

---

## 9. 라우팅 설계

| 경로 | 설명 | 인증 |
|------|------|------|
| `/login` | 사용자 로그인 | 공개 (로그인 시 /my/wordbooks 이동) |
| `/register` | 회원가입 | 공개 |
| `/my/wordbooks` | 내 단어장 목록 | 필요 |
| `/my/wordbooks/:id` | 단어장 상세 + 단어 목록 | 필요 (본인만) |
| `/my/wordbooks/:id/quiz` | 퀴즈 설정 | 필요 |
| `/my/wordbooks/:id/quiz/play` | 퀴즈 진행 | 필요 |
| `/quiz/:sessionId/result` | 퀴즈 결과 | 필요 |
| `/my/history` | 퀴즈 기록 | 필요 |

**Navbar 변경사항:**
- 비로그인: [로그인] [회원가입] 버튼 표시
- 로그인: [내 단어장] + 사용자명 드롭다운 (로그아웃 포함) 표시

---

## 10. 단어장에 단어 담기 UX

### 단어 목록 페이지 (`/words`)
- 각 단어 카드 우상단에 ♡ 버튼 (로그인 시 활성화)
- 클릭 → 단어장 선택 드롭다운 또는 "단어장 없음" 안내

### 단어 상세 페이지 (`/words/:id`)
- 단어 히어로 영역에 [+ 단어장에 추가] 버튼
- 클릭 → 내 단어장 목록 모달 → 선택 → 추가 완료 토스트

### 미로그인 시
- 버튼 클릭 → `/login`으로 안내

---

## 11. 퀴즈 UX 플로우

```
[단어장 상세] → [퀴즈 시작] 버튼
  ↓
[퀴즈 설정] ← 모드 선택 (의미/스펠링/혼합) + 문항 수
  ↓
POST /api/wordbooks/:id/quiz → sessionId + questions
  ↓
[퀴즈 진행] ← 1문항씩 표시 (프로그레스바, 타이머 선택)
  - 의미 맞추기: 4개 선택지 카드
  - 단어 맞추기: 텍스트 입력 + 제출 버튼
  ↓
[모든 답변 완료] → POST /api/quiz/:sessionId/submit
  ↓
[결과 화면] ← 점수 + 정답/오답 목록 + "다시 하기" / "단어장으로"
```

**단어 수 제약:**
| 모드 | 최소 단어 수 |
|------|-------------|
| spelling | 1개 이상 |
| meaning | 4개 이상 (보기 3개 + 정답 1개) |
| mixed | 4개 이상 |

---

## 12. 초기 계정 정책

- 회원가입은 누구나 가능 (이메일 인증 없음 — MVP)
- 비밀번호: 최소 8자
- username: 영문/숫자/언더스코어만 허용, 2~30자
- 소셜 로그인은 MVP 이후 고려

---

## 13. 에러 코드 추가

| 코드 | HTTP | 설명 |
|------|------|------|
| `USER_NOT_FOUND` | 404 | 사용자 없음 |
| `CREDENTIAL_INVALID` | 401 | 아이디/비밀번호 불일치 |
| `WORDBOOK_NOT_FOUND` | 404 | 단어장 없음 |
| `WORDBOOK_WORD_EXISTS` | 409 | 이미 담긴 단어 |
| `QUIZ_SESSION_NOT_FOUND` | 404 | 퀴즈 세션 없음 |
| `QUIZ_ALREADY_SUBMITTED` | 409 | 이미 제출된 세션 |
| `QUIZ_INSUFFICIENT_WORDS` | 422 | 단어 수 부족 |
