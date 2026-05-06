# Coding Voca — Admin API 상세 설계

> Phase 4 구현 기준 문서. 기존 `03-api-design.md`의 Admin 섹션을 구현 수준으로 상세화.

---

## 인증 방식

- **JWT (HS256)**, Bearer 토큰 방식
- 모든 `/api/admin/*` 엔드포인트(로그인 제외)에 `Authorization: Bearer <token>` 헤더 필요
- 토큰 유효시간: **24시간**
- Payload: `{ adminId: number, username: string, iat: number, exp: number }`

### 초기 관리자 계정

| 항목 | 값 |
|------|-----|
| username | `admin` |
| password | `admin123` |
| 비밀번호 해시 | bcrypt (saltRounds=10), seed.ts에서 생성 |

> ⚠️ 프로덕션 배포 전 반드시 비밀번호 변경 필요.

---

## 엔드포인트 목록

### 인증

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/admin/login` | ✗ | 로그인 → JWT 발급 |
| POST | `/api/admin/logout` | ✓ | 로그아웃 (클라이언트 토큰 삭제 안내) |
| GET  | `/api/admin/me` | ✓ | 현재 관리자 정보 |

### 대시보드

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/admin/dashboard` | ✓ | 통계 (단어·카테고리·언어 수, 난이도 분포) |

### 단어 관리

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET    | `/api/admin/words` | ✓ | 전체 단어 목록 (필터/페이지네이션 지원) |
| POST   | `/api/admin/words` | ✓ | 단어 추가 |
| PUT    | `/api/admin/words/:id` | ✓ | 단어 수정 |
| DELETE | `/api/admin/words/:id` | ✓ | 단어 삭제 |

### 카테고리 관리

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST   | `/api/admin/categories` | ✓ | 카테고리 추가 |
| PUT    | `/api/admin/categories/:id` | ✓ | 카테고리 수정 |
| DELETE | `/api/admin/categories/:id` | ✓ | 카테고리 삭제 (소속 단어 있으면 거부) |

### 언어 관리

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST   | `/api/admin/languages` | ✓ | 프로그래밍 언어 추가 |
| PUT    | `/api/admin/languages/:id` | ✓ | 언어 수정 |
| DELETE | `/api/admin/languages/:id` | ✓ | 언어 삭제 (연결 단어 있으면 거부) |

---

## 요청/응답 스키마

### POST `/api/admin/login`

**Request**
```json
{ "username": "admin", "password": "admin123" }
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": 1, "username": "admin" }
}
```

**Response 401** — 잘못된 자격증명
```json
{ "error": { "code": "UNAUTHORIZED", "message": "아이디 또는 비밀번호가 올바르지 않습니다.", "status": 401 } }
```

---

### POST `/api/admin/words` — 단어 추가

**Request Body (Zod 검증)**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `word` | string (1–100) | ✓ | 영어 단어 |
| `pronunciationKr` | string (1–100) | ✓ | 한국어 발음 |
| `ipa` | string | ✗ | IPA 발음 기호 |
| `categoryId` | number (int, min 1) | ✓ | 카테고리 ID |
| `difficulty` | `'beginner'｜'intermediate'｜'advanced'` | ✓ | 난이도 |
| `everydayMeaning` | string (1–500) | ✓ | 일상 의미 |
| `everydayExampleEn` | string | ✗ | 영어 예문 |
| `everydayExampleKr` | string | ✗ | 한국어 예문 |
| `everydayEmoji` | string | ✗ | 이모지 |
| `codingMeaning` | string (1–500) | ✓ | 코딩 의미 |
| `codingExplanation` | string | ✗ | 코딩 설명 |
| `codingEmoji` | string | ✗ | 이모지 |
| `codeExample` | string | ✗ | 코드 예시 |
| `codeLanguage` | string | ✗ | 코드 언어 (python/javascript 등) |
| `codeExplanation` | string | ✗ | 코드 설명 |
| `tags` | string[] | ✗ | 태그 목록 |
| `languageIds` | number[] | ✗ | 프로그래밍 언어 ID 목록 |
| `relatedWordIds` | number[] | ✗ | 관련 단어 ID 목록 |

**Response 201**
```json
{ "data": { /* 생성된 Word 전체 + relations */ } }
```

**Response 409** — 단어 중복
```json
{ "error": { "code": "DUPLICATE", "message": "이미 존재하는 단어입니다.", "status": 409 } }
```

---

### PUT `/api/admin/words/:id` — 단어 수정

**Request Body**: 단어 추가와 동일 (모든 필드 선택적)

**Response 200**
```json
{ "data": { /* 수정된 Word 전체 + relations */ } }
```

---

### DELETE `/api/admin/words/:id`

**Response 200**
```json
{ "message": "단어가 삭제되었습니다." }
```

---

### POST `/api/admin/categories` — 카테고리 추가

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string (1–100) | ✓ | 한국어 이름 |
| `nameEn` | string (1–100) | ✓ | 영어 이름 |
| `description` | string | ✗ | 설명 |
| `icon` | string | ✗ | 이모지 아이콘 |
| `color` | string (hex `#rrggbb`) | ✗ | 대표 색상 |
| `sortOrder` | number | ✗ | 정렬 순서 (기본 0) |

---

### POST `/api/admin/languages` — 언어 추가

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string (1–50) | ✓ | 언어 이름 |
| `nameEn` | string (1–50) | ✓ | 영어 이름 |
| `icon` | string | ✗ | 이모지 아이콘 |
| `color` | string (hex) | ✗ | 대표 색상 |
| `sortOrder` | number | ✗ | 정렬 순서 |

---

### GET `/api/admin/dashboard`

**Response 200**
```json
{
  "data": {
    "totalWords": 56,
    "totalCategories": 5,
    "totalLanguages": 5,
    "byDifficulty": {
      "beginner": 30,
      "intermediate": 18,
      "advanced": 8
    },
    "recentWords": [
      { "id": 56, "word": "syntax", "createdAt": "2026-03-09T00:00:00.000Z" }
    ]
  }
}
```

---

## Zod 유효성 검증 규칙 요약

```typescript
// 공통
const difficulty = z.enum(['beginner', 'intermediate', 'advanced']);
const hexColor   = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();

// 단어 생성
const createWordSchema = z.object({
  word:             z.string().min(1).max(100),
  pronunciationKr:  z.string().min(1).max(100),
  categoryId:       z.number().int().min(1),
  difficulty,
  everydayMeaning:  z.string().min(1).max(500),
  codingMeaning:    z.string().min(1).max(500),
  // ...선택 필드들
  languageIds:      z.array(z.number().int()).optional().default([]),
  relatedWordIds:   z.array(z.number().int()).optional().default([]),
});

// 단어 수정 — 모든 필드 선택적
const updateWordSchema = createWordSchema.partial();
```

---

## 미들웨어 파이프라인 (Admin)

```
POST /api/admin/words
  └─ cors()
  └─ express.json()
  └─ requireAuth     ← JWT 검증, req.admin 주입
  └─ validate(schema) ← Zod 검증, req.body 정제
  └─ controller      ← 비즈니스 로직
  └─ errorHandler    ← 표준 에러 응답
```

---

## 파일 구조

```
server/src/
├── middleware/
│   ├── auth.ts          ← JWT requireAuth 미들웨어
│   └── validate.ts      ← Zod validate 팩토리
├── validators/
│   └── adminValidator.ts ← 모든 Admin Zod 스키마
├── services/
│   └── adminService.ts  ← 인증·CRUD 비즈니스 로직
├── controllers/
│   └── adminController.ts ← 라우트 핸들러
└── routes/
    └── admin/
        ├── auth.ts
        ├── words.ts
        ├── categories.ts
        ├── languages.ts
        └── dashboard.ts
```

---

## 프론트엔드 관리자 라우팅 (Phase 7)

### 라우트 구조

| 경로 | 설명 | 레이아웃 |
|------|------|---------|
| `/admin/login` | 관리자 로그인 (공개) | 없음 (독립 페이지) |
| `/admin` | 대시보드로 리다이렉트 | AdminLayout |
| `/admin/dashboard` | 통계 대시보드 (인증 필요) | AdminLayout |
| `/admin/words` | 단어 CRUD (인증 필요) | AdminLayout |
| `/admin/categories` | 카테고리 CRUD (인증 필요) | AdminLayout |
| `/admin/languages` | 언어 CRUD (인증 필요) | AdminLayout |

- 공개 사용자 페이지(`/`, `/words`, `/categories` 등)에는 관리자 링크 **노출 없음**
- `/admin/*` 진입 시 미인증이면 `/admin/login`으로 자동 리다이렉트
- 로그인 성공 시 JWT를 `localStorage('admin_token')`에 저장

### 클라이언트 파일 구조

```
client/src/
├── api/
│   └── admin.ts              ← 관리자 API 호출 함수 (axios)
├── context/
│   └── AuthContext.tsx       ← JWT 인증 상태 관리 (로그인/로그아웃/토큰)
├── components/
│   └── AdminLayout/
│       ├── AdminLayout.tsx   ← 사이드바 + 메인 영역 레이아웃
│       └── AdminLayout.css
└── pages/admin/
    ├── LoginPage/            ← 독립 로그인 폼
    ├── DashboardPage/        ← 통계 카드 + 최근 단어
    ├── WordManagePage/       ← 단어 테이블 + 추가/수정/삭제 모달
    ├── CategoryManagePage/   ← 카테고리 CRUD
    └── LanguageManagePage/   ← 언어 CRUD
```
