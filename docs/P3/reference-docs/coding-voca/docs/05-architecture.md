# Coding Voca — 기술 스택 및 아키텍처

## 기술 스택

### 프론트엔드

| 기술 | 역할 |
|---|---|
| **Vite** | 빌드 도구 |
| **React + TypeScript** | UI 프레임워크 |
| **React Router** | SPA 라우팅 |
| **Vanilla CSS** | 스타일링 (디자인 토큰 기반) |
| **Axios** | HTTP 클라이언트 |
| **PrismJS** | 코드 구문 강조 |
| **React Icons** | 아이콘 |

### 백엔드

| 기술 | 역할 |
|---|---|
| **Node.js + Express** | REST API 서버 |
| **TypeScript** | 타입 안전성 |
| **Prisma** | ORM (PostgreSQL) |
| **JWT + bcrypt** | 인증/비밀번호 해싱 |
| **Zod** | 요청 유효성 검증 |
| **dotenv** | 환경변수 |
| **cors** | CORS 처리 |

### 인프라

| 기술 | 역할 |
|---|---|
| **PostgreSQL** | 관계형 데이터베이스 |
| **Docker (선택)** | 개발 환경 일관성 |

---

## 프로젝트 디렉토리 구조

```
p1/
├── docs/                           # 설계 문서
│
├── server/                         # 백엔드 (Express)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        # DB URL, JWT_SECRET 등
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma 스키마
│   │   ├── migrations/             # DB 마이그레이션
│   │   └── seed.ts                 # 초기 데이터 시드
│   └── src/
│       ├── index.ts                # 서버 진입점
│       ├── app.ts                  # Express 앱 설정
│       ├── config/
│       │   └── env.ts              # 환경변수 로드
│       ├── middleware/
│       │   ├── auth.ts             # JWT 인증 미들웨어
│       │   ├── errorHandler.ts     # 에러 핸들러
│       │   └── validate.ts         # Zod 유효성 검증
│       ├── routes/
│       │   ├── public/
│       │   │   ├── words.ts        # GET /api/words
│       │   │   ├── categories.ts   # GET /api/categories
│       │   │   └── languages.ts    # GET /api/languages
│       │   └── admin/
│       │       ├── auth.ts         # POST /api/admin/login
│       │       ├── words.ts        # CRUD /api/admin/words
│       │       ├── categories.ts   # CRUD /api/admin/categories
│       │       ├── languages.ts    # CRUD /api/admin/languages
│       │       └── dashboard.ts    # GET /api/admin/dashboard
│       ├── controllers/
│       │   ├── wordController.ts
│       │   ├── categoryController.ts
│       │   ├── languageController.ts
│       │   └── authController.ts
│       ├── services/
│       │   ├── wordService.ts
│       │   ├── categoryService.ts
│       │   ├── languageService.ts
│       │   └── authService.ts
│       ├── validators/
│       │   ├── wordValidator.ts    # Zod 스키마
│       │   ├── categoryValidator.ts
│       │   └── authValidator.ts
│       └── types/
│           └── index.ts
│
├── client/                         # 프론트엔드 (React)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                 # 라우터 설정
│       ├── index.css               # 글로벌 스타일
│       ├── api/                    # API 클라이언트
│       │   ├── client.ts           # Axios 인스턴스
│       │   ├── words.ts            # 단어 API 호출
│       │   ├── categories.ts       # 카테고리 API
│       │   ├── languages.ts        # 언어 API
│       │   └── admin.ts            # 관리자 API
│       ├── components/             # 공통 컴포넌트
│       │   ├── Layout/
│       │   │   ├── Navbar.tsx + .css
│       │   │   └── Footer.tsx + .css
│       │   ├── WordCard/
│       │   │   └── WordCard.tsx + .css
│       │   ├── SearchBar/
│       │   │   └── SearchBar.tsx + .css
│       │   ├── CodeBlock/
│       │   │   └── CodeBlock.tsx + .css
│       │   ├── MeaningComparison/
│       │   │   └── MeaningComparison.tsx + .css
│       │   └── CategoryBadge/
│       │       └── CategoryBadge.tsx + .css
│       ├── pages/                  # 학습자 페이지
│       │   ├── HomePage/
│       │   ├── WordListPage/
│       │   ├── WordDetailPage/
│       │   ├── CategoryPage/
│       │   ├── LanguagePage/
│       │   └── AboutPage/
│       ├── admin/                  # 관리자 페이지
│       │   ├── AdminLayout.tsx
│       │   ├── LoginPage/
│       │   ├── DashboardPage/
│       │   ├── WordManagePage/
│       │   ├── CategoryManagePage/
│       │   └── LanguageManagePage/
│       ├── hooks/
│       │   ├── useAuth.ts          # 관리자 인증 상태
│       │   ├── useWords.ts
│       │   └── useSearch.ts
│       ├── context/
│       │   └── AuthContext.tsx      # 인증 컨텍스트
│       ├── utils/
│       │   └── helpers.ts
│       └── types/
│           └── index.ts
│
└── README.md
```

---

## 시스템 아키텍처

```
┌────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  React SPA (Vite)                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │ 학습자    │  │ 관리자    │  │ API Client       │ │ │
│  │  │ Pages    │  │ Pages    │  │ (Axios)          │ │ │
│  │  └──────────┘  └──────────┘  └────────┬─────────┘ │ │
│  └───────────────────────────────────────┼───────────┘ │
└──────────────────────────────────────────┼─────────────┘
                                           │ HTTP
┌──────────────────────────────────────────┼─────────────┐
│  Express Server                          │             │
│  ┌──────────────────────────────────────▼───────────┐ │
│  │  Middleware (CORS → Auth → Validate)              │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Routes → Controllers → Services                 │ │
│  ├──────────────────────────────────────────────────┤ │
│  │  Prisma ORM                                       │ │
│  └──────────────────────────────────────┬───────────┘ │
└──────────────────────────────────────────┼─────────────┘
                                           │ TCP
┌──────────────────────────────────────────┼─────────────┐
│  PostgreSQL                              ▼             │
│  ┌──────────────────────────────────────────────────┐ │
│  │  words │ categories │ languages │ admins          │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 데이터 흐름

```
[학습자 검색]
1. 사용자 검색어 입력 → debounce(300ms)
2. GET /api/words?search=배리 → Express
3. Prisma: words ILIKE '%배리%' → PostgreSQL
4. 결과 JSON → React 렌더링

[관리자 단어 추가]
1. 관리자 로그인 → JWT 토큰 수신 → localStorage 저장
2. 단어 폼 작성 → POST /api/admin/words (Authorization: Bearer <token>)
3. Zod 유효성 검증 → Prisma: words.create → PostgreSQL
4. 201 Created → 단어 목록 갱신
```

---

## 개발 서버 구성

| 서버 | 포트 | 명령어 |
|---|---|---|
| 프론트엔드 (Vite) | 5173 | `cd client && npm run dev` |
| 백엔드 (Express) | 3000 | `cd server && npm run dev` |
| PostgreSQL | 5432 | 로컬 설치 또는 Docker |

프론트엔드에서 `/api/*` 요청을 백엔드로 프록시하는 설정을 `vite.config.ts`에 추가합니다.
