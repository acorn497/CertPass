# Coding Voca — API 설계

## 기술 스택: Node.js + Express + TypeScript

| 기술 | 역할 |
|---|---|
| **Node.js + Express** | REST API 서버 |
| **TypeScript** | 타입 안전성 |
| **Prisma** | ORM (PostgreSQL 연동) |
| **JWT** | 관리자 인증 |
| **bcrypt** | 비밀번호 해싱 |
| **cors** | 프론트엔드 CORS 허용 |
| **dotenv** | 환경변수 관리 |

---

## API 엔드포인트

### 📖 Public API (학습자용 — 인증 불필요)

#### 단어

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/words` | 전체 단어 목록 (필터/검색/페이지네이션) |
| GET | `/api/words/:id` | 단어 상세 (관련 단어 포함) |
| GET | `/api/words/random` | 랜덤 단어 1개 (오늘의 단어) |

**GET `/api/words` 쿼리 파라미터:**

| 파라미터 | 타입 | 설명 | 예시 |
|---|---|---|---|
| `search` | string | 검색어 (영어/한국어) | `?search=배리` |
| `category` | number | 카테고리 ID | `?category=1` |
| `language` | number | 프로그래밍 언어 ID | `?language=2` |
| `difficulty` | string | 난이도 | `?difficulty=beginner` |
| `page` | number | 페이지 번호 (기본 1) | `?page=2` |
| `limit` | number | 페이지 크기 (기본 20) | `?limit=10` |
| `sort` | string | 정렬 기준 | `?sort=word` or `?sort=newest` |

**응답 예시:**
```json
{
  "data": [
    {
      "id": 1,
      "word": "variable",
      "pronunciationKr": "배리어블",
      "everydayMeaning": "변하기 쉬운, 가변적인",
      "everydayEmoji": "🌦️",
      "codingMeaning": "변수 — 데이터를 저장하는 공간",
      "codingEmoji": "📦",
      "difficulty": "beginner",
      "category": { "id": 1, "name": "기초 문법", "color": "#7c5cfc" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 56,
    "totalPages": 3
  }
}
```

#### 카테고리

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/categories` | 전체 카테고리 목록 (단어 수 포함) |
| GET | `/api/categories/:id` | 카테고리 상세 + 소속 단어 목록 |

#### 프로그래밍 언어

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/languages` | 전체 프로그래밍 언어 목록 |

---

### 🔒 Admin API (관리자용 — JWT 인증 필요)

#### 인증

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/admin/login` | 관리자 로그인 → JWT 토큰 반환 |
| POST | `/api/admin/logout` | 로그아웃 (클라이언트 토큰 삭제) |
| GET | `/api/admin/me` | 현재 로그인 관리자 정보 |

**POST `/api/admin/login` 요청:**
```json
{
  "username": "admin",
  "password": "securepassword"
}
```
**응답:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "id": 1, "username": "admin" }
}
```

#### 단어 관리

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/admin/words` | 단어 추가 |
| PUT | `/api/admin/words/:id` | 단어 수정 |
| DELETE | `/api/admin/words/:id` | 단어 삭제 |

**POST `/api/admin/words` 요청 바디:**
```json
{
  "word": "variable",
  "pronunciationKr": "배리어블",
  "ipa": "/ˈvɛr.i.ə.bəl/",
  "categoryId": 1,
  "difficulty": "beginner",
  "everydayMeaning": "변하기 쉬운, 가변적인",
  "everydayExampleEn": "The weather is very variable today.",
  "everydayExampleKr": "오늘 날씨가 매우 변덕스럽다.",
  "everydayEmoji": "🌦️",
  "codingMeaning": "변수 — 데이터를 저장하는 공간",
  "codingExplanation": "값을 담아두는 상자와 같습니다...",
  "codingEmoji": "📦",
  "codeExample": "name = \"홍길동\"\nage = 15",
  "codeLanguage": "python",
  "codeExplanation": "name과 age라는 변수에 값을 저장합니다.",
  "tags": ["기초", "필수"],
  "relatedWordIds": [2, 3, 4],
  "languageIds": [1, 2]
}
```

#### 카테고리 관리

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/admin/categories` | 카테고리 추가 |
| PUT | `/api/admin/categories/:id` | 카테고리 수정 |
| DELETE | `/api/admin/categories/:id` | 카테고리 삭제 |

#### 프로그래밍 언어 관리

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/admin/languages` | 프로그래밍 언어 추가 |
| PUT | `/api/admin/languages/:id` | 프로그래밍 언어 수정 |
| DELETE | `/api/admin/languages/:id` | 프로그래밍 언어 삭제 |

#### 대시보드

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/admin/dashboard` | 통계 (단어 수, 카테고리 수, 언어 수) |

---

### 👤 User API (일반 사용자 — Phase 9~11)

> 상세 스펙: `docs/09-user-feature-spec.md` 참조

#### 인증

| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| POST | `/api/auth/register` | ✗ | 회원가입 (username, email, password) |
| POST | `/api/auth/login` | ✗ | 로그인 → JWT (7일) |
| GET  | `/api/auth/me` | ✓ User | 내 정보 |

#### 단어장

| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| GET    | `/api/wordbooks` | ✓ User | 내 단어장 목록 |
| POST   | `/api/wordbooks` | ✓ User | 단어장 생성 |
| GET    | `/api/wordbooks/:id` | ✓ User | 단어장 상세 + 단어 목록 |
| PUT    | `/api/wordbooks/:id` | ✓ User | 단어장 수정 |
| DELETE | `/api/wordbooks/:id` | ✓ User | 단어장 삭제 |
| POST   | `/api/wordbooks/:id/words` | ✓ User | 단어 추가 |
| DELETE | `/api/wordbooks/:id/words/:wordId` | ✓ User | 단어 제거 |

#### 퀴즈

| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| POST | `/api/wordbooks/:id/quiz` | ✓ User | 퀴즈 시작 (문제 생성, sessionId 반환) |
| POST | `/api/quiz/:sessionId/submit` | ✓ User | 답변 일괄 제출 + 결과 반환 |
| GET  | `/api/quiz/history` | ✓ User | 내 퀴즈 기록 목록 |
| GET  | `/api/quiz/:sessionId` | ✓ User | 특정 세션 결과 |

---

## 미들웨어

```
Request Flow:
  ┌──────┐    ┌──────┐    ┌────────────────┐    ┌────────────┐    ┌──────────┐
  │Client│───►│CORS  │───►│Auth Check      │───►│Validation  │───►│Controller│
  └──────┘    └──────┘    │requireAdminAuth│    │(Zod)       │    └──────────┘
                          │requireUserAuth │    └────────────┘
                          └────────────────┘
```

| 미들웨어 | 역할 |
|---|---|
| CORS | 프론트엔드 origin 허용 |
| requireAdminAuth | `/api/admin/*` — 관리자 JWT 검증 |
| requireUserAuth | `/api/wordbooks/*`, `/api/quiz/*`, `/api/auth/me` — 사용자 JWT 검증 |
| Validation | 요청 바디 유효성 검사 (Zod) |
| Error Handler | 에러 응답 표준화 |

---

## 에러 응답 형식

```json
{
  "error": {
    "code": "WORD_NOT_FOUND",
    "message": "해당 단어를 찾을 수 없습니다.",
    "status": 404
  }
}
```

| 코드 | HTTP | 설명 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 요청 데이터 유효성 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `CREDENTIAL_INVALID` | 401 | 아이디/비밀번호 불일치 |
| `FORBIDDEN` | 403 | 권한 부족 (본인 리소스 아님) |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `DUPLICATE` | 409 | 중복 데이터 |
| `WORDBOOK_WORD_EXISTS` | 409 | 이미 담긴 단어 |
| `QUIZ_INSUFFICIENT_WORDS` | 422 | 퀴즈 시작 시 단어 부족 |
| `QUIZ_ALREADY_SUBMITTED` | 409 | 이미 제출된 퀴즈 세션 |
| `SERVER_ERROR` | 500 | 서버 내부 오류 |
