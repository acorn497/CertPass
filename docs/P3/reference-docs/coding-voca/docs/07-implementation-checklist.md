# Coding Voca — 서브에이전트 구성 및 구현 체크리스트

## 구현 단계 개요

총 **8단계**로 나누어 진행합니다. 각 단계는 하나의 서브에이전트 세션에 해당합니다.

```
Phase 1: 프로젝트 초기화 (server + client)
    ↓
Phase 2: DB 스키마 & 시드 데이터
    ↓
Phase 3: 백엔드 API — Public 엔드포인트
    ↓
Phase 4: 백엔드 API — Admin 엔드포인트 + 인증
    ↓
Phase 5: 프론트엔드 — 디자인 시스템 & 레이아웃
    ↓
Phase 6: 프론트엔드 — 학습자 페이지
    ↓
Phase 7: 프론트엔드 — 관리자 페이지
    ↓
Phase 8: 통합 검증 & 마무리
```

---

## Phase 1: 프로젝트 초기화

**목표**: server(Express) + client(React) 두 프로젝트 세팅

### 체크리스트
- [x] `server/` 디렉토리: Node.js + Express + TypeScript 초기화
  - `npm init`, `tsconfig.json`, `nodemon` or `tsx` dev 설정
  - 의존성: `express`, `prisma`, `@prisma/client`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `zod`
  - dev 의존성: `typescript`, `@types/express`, `@types/cors`, `tsx`
- [x] `client/` 디렉토리: Vite + React + TypeScript 초기화
  - `npx -y create-vite@latest ./ --template react-ts`
  - 의존성: `react-router-dom`, `axios`, `prismjs`, `react-icons`
  - `vite.config.ts`에 `/api` 프록시 설정
- [x] `.env` 파일 생성 (`DATABASE_URL`, `JWT_SECRET`, `PORT`)
- [x] 디렉토리 구조 생성 (docs/05-architecture.md 참조)
- [x] 양쪽 dev 서버 실행 확인

### 참고: `docs/05-architecture.md`
### 완료 조건: `server/` dev 서버 3000포트, `client/` dev 서버 5173포트 정상 실행

---

## Phase 2: DB 스키마 & 시드 데이터

**목표**: Prisma 스키마 정의, DB 마이그레이션, 56개 단어 시드

### 체크리스트
- [x] `prisma/schema.prisma` 모델 정의 (6개 테이블)
  - Category, Word, ProgrammingLanguage, WordLanguage, RelatedWord, Admin
- [x] `npx prisma migrate dev --name init` 실행
- [x] `prisma/seed.ts` 작성
  - 5개 카테고리 시드
  - 56개 단어 시드 (docs/06-sample-vocabulary.md 참조)
  - 5개 프로그래밍 언어 시드
  - 관리자 계정 시드 (admin/admin123)
- [x] `npx prisma db seed` 실행 확인 (Phase 3에서 완료)

### 참고: `docs/02-data-model.md`, `docs/06-sample-vocabulary.md`
### 완료 조건: `npx prisma studio`에서 모든 데이터 확인 가능

---

## Phase 3: 백엔드 API — Public 엔드포인트

**목표**: 학습자용 읽기 전용 API 구현

### 체크리스트
- [x] Express 앱 기본 설정 (`app.ts`, `index.ts`, CORS, errorHandler)
- [x] `GET /api/words` — 단어 목록 (검색, 필터, 페이지네이션)
- [x] `GET /api/words/random` — 랜덤 단어
- [x] `GET /api/words/:id` — 단어 상세 (관련 단어, 프로그래밍 언어 포함)
- [x] `GET /api/categories` — 카테고리 목록 (단어 수 포함)
- [x] `GET /api/categories/:id` — 카테고리별 단어
- [x] `GET /api/languages` — 프로그래밍 언어 목록
- [x] Service 레이어 분리 (Controller → Service → Prisma)
- [x] `prisma/schema.prisma` url 필드 수정 (`url = env("DATABASE_URL")`)
- [x] `npx prisma generate` + `npx prisma db seed` 실행 완료 (56단어 확인)

### 참고: `docs/03-api-design.md`
### 완료 조건: Postman/curl로 모든 Public 엔드포인트 정상 응답
### 검증 결과: curl로 전체 엔드포인트 정상 응답 확인 ✅

---

## Phase 4: 백엔드 API — Admin 엔드포인트

**목표**: 관리자 인증 + CRUD API

### 체크리스트
- [x] JWT 인증 미들웨어 (`middleware/auth.ts`) — `requireAuth`, `Express.Request` 타입 확장
- [x] Zod 유효성 검증 미들웨어 (`middleware/validate.ts`)
- [x] Admin Zod 스키마 (`validators/adminValidator.ts`) — Word/Category/Language 스키마 + `.partial()` 업데이트 스키마
- [x] Admin 서비스 레이어 (`services/adminService.ts`) — 전체 CRUD + 트랜잭션 기반 Word 업데이트
- [x] Admin 컨트롤러 (`controllers/adminController.ts`) — 전체 라우트 핸들러
- [x] `POST /api/admin/login` — 로그인 (JWT 발급, 24h 만료)
- [x] `POST /api/admin/logout` — 로그아웃 (클라이언트 토큰 삭제 안내)
- [x] `GET /api/admin/me` — 현재 관리자 정보
- [x] `GET /api/admin/dashboard` — 통계 (총 단어/카테고리/언어 수, 난이도별 분포, 최근 단어)
- [x] `GET /api/admin/words` — 단어 목록 (검색/필터/페이지네이션, 200개 상한)
- [x] `POST /api/admin/words` — 단어 생성 (언어/관련단어 연결 포함)
- [x] `PUT /api/admin/words/:id` — 단어 수정 (트랜잭션 기반 관계 동기화)
- [x] `DELETE /api/admin/words/:id` — 단어 삭제
- [x] `POST /api/admin/categories` — 카테고리 생성
- [x] `PUT /api/admin/categories/:id` — 카테고리 수정
- [x] `DELETE /api/admin/categories/:id` — 카테고리 삭제 (단어 있으면 409 거부)
- [x] `POST /api/admin/languages` — 언어 생성
- [x] `PUT /api/admin/languages/:id` — 언어 수정
- [x] `DELETE /api/admin/languages/:id` — 언어 삭제 (연결 단어 있으면 409 거부)
- [x] Admin 라우트 파일 5개 생성 및 `app.ts` 마운트

### 초기 관리자 계정
- **username**: `admin`
- **password**: `admin123`
- 상세 내용: `docs/08-admin-api-spec.md` 참조

### 참고: `docs/03-api-design.md`, `docs/08-admin-api-spec.md`
### 완료 조건: JWT 토큰으로 모든 Admin 엔드포인트 정상 응답
### 검증 결과: curl로 전체 엔드포인트 정상 응답 확인 ✅ (`npm run build` TypeScript 빌드 성공)

---

## Phase 5: 프론트엔드 — 디자인 시스템 & 레이아웃

**목표**: 글로벌 스타일, API 클라이언트, 공통 레이아웃

### 체크리스트
- [x] `index.css` — 디자인 토큰 (다크/라이트 모드 CSS 변수, 타이포, 스페이싱, 도트 그리드)
- [x] `api/words.ts`, `api/categories.ts`, `api/languages.ts` — mock 기반 API 호출 함수
  - ※ 현재 mock 데이터 사용. 백엔드 완성 후 Axios 호출로 교체 예정
- [ ] `api/client.ts` — Axios 인스턴스 (백엔드 연동 시 추가)
- [ ] `api/admin.ts` — 관리자 API 호출 함수 (Phase 7에서 추가)
- [x] `types/index.ts` — 프론트엔드 TypeScript 타입 (Word, Category, Language, Difficulty 등)
- [x] `Navbar.tsx` — 공통 네비게이션 (로고, 라우트 링크, 테마 토글)
- [x] `Layout.tsx` — Navbar + main + Footer 래퍼
- [x] `App.tsx` — React Router 설정 (6개 학습자 라우트)
- [x] `context/ThemeContext.tsx` — 다크/라이트 테마 상태 관리 (localStorage 유지)
- [ ] `context/AuthContext.tsx` — 관리자 인증 상태 관리 (Phase 7에서 추가)

### 참고: `docs/04-ui-design.md`, `docs/05-architecture.md`
### 완료 조건: Navbar/Footer 표시, API 연동 확인

---

## Phase 6: 프론트엔드 — 학습자 페이지

**목표**: 모든 학습자 페이지 구현

### 체크리스트
- [x] `WordCard` 컴포넌트 — 상단 그라디언트 스트립, 난이도 점, 카테고리 뱃지, 일상/코딩 의미 행, 언어 칩
- [x] `MeaningComparison` 컴포넌트 — 일상(핑크) vs 코딩(민트) 나란히 비교 패널
- [x] `CodeBlock` 컴포넌트 — 수동 구문 강조 (kw/str/num/cm/fn 클래스), 복사 버튼, 언어 레이블
- [x] `SearchBar` 컴포넌트 — 검색 입력, ⌘K 단축키 표시, 포커스 글로우
- [x] `CategoryBadge` 컴포넌트 — 카테고리 컬러 기반 pill 뱃지
- [x] `HomePage` — 히어로 + 플로팅 단어 버블 (7개) + 오늘의 단어 (날짜 기반) + 카테고리 쇼트컷 + 통계 스트립
- [x] `WordListPage` — 사이드바 필터 (카테고리/언어/난이도 체크박스) + 드롭다운 + 단어 카드 그리드 + 페이지네이션 + URL 쿼리 파라미터 동기화
- [x] `WordDetailPage` — 단어 히어로 (그라디언트 텍스트) + MeaningComparison + CodeBlock + 언어/관련 단어 메타 카드 + 이전/다음 내비게이션
- [x] `CategoryPage` — 카테고리 카드 그리드 (auto-fill) + 왼쪽 accent bar + 검색/정렬 컨트롤 + 탐색 배너
- [x] `LanguagePage` — 언어별 카드 (컬러 액센트) + 단어 수 + 미리보기 칩
- [x] `AboutPage` — 앱 소개 + 사용법 + 색상 의미 안내

### 참고: `docs/04-ui-design.md`
### 완료 조건: 모든 페이지 mock 데이터 연동 및 클라이언트 사이드 필터링 동작
### 빌드 상태: `npm run build` ✅ 성공 (304 KB JS, 41 KB CSS)

---

## Phase 7: 프론트엔드 — 관리자 페이지

**목표**: 관리자 로그인 + CRUD UI

### 라우트 설계
- `/admin/login` — 독립 로그인 페이지 (공개 Navbar 없음)
- `/admin/dashboard` — 통계 대시보드 (인증 필요)
- `/admin/words` — 단어 관리 (인증 필요)
- `/admin/categories` — 카테고리 관리 (인증 필요)
- `/admin/languages` — 언어 관리 (인증 필요)
- 공개 페이지에서 관리자 링크 노출 없음

### 체크리스트
- [x] `api/admin.ts` — 관리자 API 호출 함수 (axios, JWT interceptor), 전체 CRUD 함수
- [x] `context/AuthContext.tsx` — JWT 인증 상태 (localStorage `admin_token`/`admin_info` 유지)
- [x] `AdminLayout` — 좌측 사이드바 (대시보드/단어/카테고리/언어 NavLink) + 사용자 정보 + 로그아웃 버튼
- [x] `LoginPage` — 로그인 폼 → JWT 저장 → `/admin/dashboard` 이동 (학습자 페이지로 돌아가기 링크 포함)
- [x] `DashboardPage` — 통계 카드 (단어/카테고리/언어 수), 난이도 분포 바, 최근 단어 목록
- [x] `WordManagePage` — 검색/난이도 필터 + 페이지네이션 테이블 + 추가/수정/삭제 모달 (전체 필드 + 언어 체크박스)
- [x] `CategoryManagePage` — 카테고리 테이블 + 추가/수정/삭제 모달 (색상 피커 포함)
- [x] `LanguageManagePage` — 언어 테이블 + 추가/수정/삭제 모달 (색상 피커 포함)
- [x] `RequireAuth` 가드 — 미인증 시 `/admin/login` 리다이렉트
- [x] `PublicAdminRoute` 가드 — 이미 인증된 경우 `/admin/dashboard`로 리다이렉트
- [x] `App.tsx` 리팩터링 — 공개 라우트(`<Layout>`) + 관리자 라우트(`<AdminLayout>`) 완전 분리
  - 공개 Navbar에 관리자 링크 없음 (`/admin/*`는 별도 URL로만 접근)

### 참고: `docs/08-admin-api-spec.md` (프론트엔드 라우팅 설계 섹션)
### 완료 조건: 관리자 로그인 → 단어 추가 → 학습자 페이지에서 확인
### 빌드 상태: `npm run build` ✅ 성공 (370 KB JS, 53 KB CSS)

---

## Phase 8: 통합 검증 & 마무리

**목표**: 전체 기능 점검, 빌드 테스트

### 체크리스트
- [x] 백엔드 `npm run build` 성공 (Phase 4 완료 기준)
- [x] 프론트엔드 `npm run build` 성공
- [x] 전체 56개 단어 정상 표시 확인 (mock 데이터 기준)
- [x] 검색 기능 (영어/한국어/발음) 정상 동작
- [ ] 관리자 단어 CRUD 전체 흐름 확인
- [ ] 반응형 레이아웃 (360px, 768px, 1440px)
- [ ] 링크 깨짐 없는지 확인
- [ ] README.md 작성 (설치/실행 가이드)

### 완료 조건: 모든 체크리스트 통과, 프로덕션 빌드 성공

---

## Phase 9: 일반 사용자 인증

**목표**: 회원가입 / 로그인 / JWT 인증 (서버 + 클라이언트)

### 참고: `docs/09-user-feature-spec.md` §2, §3(User), §4-1, §7

### 서버 체크리스트
- [x] `prisma/schema.prisma` — `User` 모델 추가, `npx prisma migrate dev --name add-user-features` 완료
- [x] `middleware/userAuth.ts` — `requireUserAuth` (사용자 JWT, `req.user` 주입, `adminId` 없으면 거부)
- [x] `validators/userValidator.ts` — `registerSchema` (username 영문/숫자/언더스코어), `loginSchema` (credential=username|email)
- [x] `services/userService.ts` — `register()` (중복 체크), `login()` (bcrypt + JWT 7일), `getMe()`
- [x] `controllers/userController.ts` — `register`, `login`, `me` 핸들러
- [x] `routes/user/auth.ts` — POST /register, POST /login, GET /me
- [x] `app.ts` — `/api/auth` 라우터 마운트

### 클라이언트 체크리스트
- [x] `api/user.ts` — `register()`, `login()`, `getMe()` API 함수
- [x] `context/UserAuthContext.tsx` — 사용자 인증 상태 (`user_token` localStorage)
- [x] `pages/auth/UserLoginPage/` — 로그인 폼 (credential + password)
- [x] `pages/auth/RegisterPage/` — 회원가입 폼 (username + email + password)
- [x] `App.tsx` — `/login`, `/register` 라우트 추가 (공개 페이지, Navbar에 버튼 연결)
- [x] `Navbar.tsx` — 비로그인: [로그인][회원가입] / 로그인: [내 단어장] + 사용자명 드롭다운

### 완료 조건: 회원가입 → 로그인 → JWT 발급 → `/api/auth/me` 정상 응답
### 서버 검증: curl로 전체 Auth 엔드포인트 정상 응답 확인 ✅
### 클라이언트 빌드: `npm run build` ✅ 성공

---

## Phase 10: 단어장 기능

**목표**: 단어장 CRUD + 단어 담기/빼기 (서버 + 클라이언트)

### 참고: `docs/09-user-feature-spec.md` §3(Wordbook), §4-2, §7, §8, §10

### 서버 체크리스트
- [x] `prisma/schema.prisma` — `Wordbook`, `WordbookWord` 모델 추가 (동일 마이그레이션)
- [x] `Word` 모델에 `wordbookWords`, `quizResults` 역방향 관계 추가
- [x] `services/wordbookService.ts` — 전체 CRUD + 단어 추가/제거, `assertOwner()` 소유권 검증
- [x] `controllers/wordbookController.ts`
- [x] `routes/user/wordbooks.ts` — 단어장 CRUD 5개 + 단어 추가/제거 2개 + 퀴즈 시작 1개
- [x] `app.ts` — `/api/wordbooks` 라우터 마운트

### 클라이언트 체크리스트
- [x] `api/user.ts` — 단어장 CRUD + 단어 추가/제거 함수
- [x] `components/AddToWordbookButton/` — 단어장 선택 드롭다운 (로그인 시 활성), `e.preventDefault()+e.stopPropagation()`
- [x] `pages/wordbook/MyWordbooksPage/` — 단어장 카드 그리드 + 새 단어장 생성 모달
- [x] `pages/wordbook/WordbookDetailPage/` — 담긴 단어 목록 + 제거 버튼 + [퀴즈 시작]
- [x] `WordCard.tsx` — 북마크 버튼 추가 (로그인 시)
- [x] `WordDetailPage.tsx` — [+ 단어장에 추가] 버튼 + 단어장 선택 드롭다운
- [x] `App.tsx` — `/my/wordbooks`, `/my/wordbooks/:id` 라우트 추가

### 완료 조건: 단어 담기 → 단어장 조회 → 단어 제거 정상 동작
### 서버 검증: curl로 전체 Wordbook 엔드포인트 정상 응답 확인 ✅
### 클라이언트 빌드: `npm run build` ✅ 성공

---

## Phase 11: 퀴즈 기능

**목표**: 퀴즈 생성 / 진행 / 채점 / 결과 저장 (서버 + 클라이언트)

### 참고: `docs/09-user-feature-spec.md` §3(Quiz), §4-3, §11

### 서버 체크리스트
- [x] `prisma/schema.prisma` — `QuizSession` (UUID PK, `questionsData` JSON), `QuizResult`, `QuizMode` enum 추가 (동일 마이그레이션)
- [x] `services/quizService.ts`
  - `startQuiz()` — 문제 생성 (의미: 4지선다 랜덤, 단어장 우선 + 전체 DB 보완)
  - `submitQuiz()` — 채점 + `$transaction` DB 저장 (meaning: 완전 일치, spelling: 대소문자 무시)
  - `getHistory()` — 완료된 세션 목록 (최대 50개)
  - `getSession()` — 세션 결과 상세
- [x] `controllers/quizController.ts`
- [x] `routes/user/quiz.ts` — `/history` 먼저 등록 (`:sessionId`와 충돌 방지)
- [x] `app.ts` — `/api/quiz` 라우터 마운트

### 클라이언트 체크리스트
- [x] `api/user.ts` — 퀴즈 관련 API 함수 (`startQuiz`, `submitQuiz`, `getHistory`, `getSession`)
- [x] `pages/quiz/QuizSetupPage/` — 모드 선택(의미/철자/혼합) + 문항 수 선택 UI, 최소 단어 수 경고
- [x] `pages/quiz/QuizPlayPage/` — 진행 화면 (프로그레스바, 의미:4지선다, 철자:텍스트입력, 800ms 자동전환, 완료 시 일괄 제출)
- [x] `pages/quiz/QuizResultPage/` — 별점(≥80%=3★) + 점수 표시 + 정답/오답 목록 + 재도전 버튼
- [x] `pages/quiz/QuizHistoryPage/` — 완료된 퀴즈 세션 목록
- [x] `pages/wordbook/WordbookDetailPage/` — [퀴즈 시작] 버튼 → QuizSetupPage 이동 (이미 위에서 완료)
- [x] `App.tsx` — `/my/wordbooks/:id/quiz`, `/my/wordbooks/:id/quiz/play`, `/quiz/:sessionId/result`, `/my/history` 라우트 추가

### 완료 조건: 단어장 선택 → 퀴즈 설정 → 퀴즈 진행 → 결과 저장 → 기록 조회
### 서버 검증: curl로 전체 Quiz 엔드포인트 정상 응답 확인 ✅
### 클라이언트 빌드: `npm run build` ✅ 성공 (TypeScript 에러 0건)

---

## Phase 12: 최종 통합 검증

**목표**: 전체 사용자 기능 + 관리자 기능 통합 검증

### 체크리스트
- [ ] 회원가입 → 로그인 → 단어 담기 → 퀴즈 전체 흐름 E2E 확인
- [ ] 관리자 로그인 → 단어 추가 → 학습자 페이지 반영 확인
- [ ] 미인증 접근 시 리다이렉트 동작 확인
- [ ] 백엔드 + 프론트엔드 최종 빌드 성공
- [ ] README.md 업데이트 (사용자 기능 포함)

---

## 서브에이전트 프롬프트 가이드

| Phase | 핵심 지시 |
|---|---|
| 1 | `docs/05-architecture.md` 참고하여 server + client 프로젝트 초기화 |
| 2 | `docs/02-data-model.md` + `docs/06-sample-vocabulary.md` 참고하여 Prisma 스키마 + 시드 |
| 3 | `docs/03-api-design.md` Public 섹션 참고하여 학습자 API 구현 |
| 4 | `docs/03-api-design.md` Admin 섹션 참고하여 관리자 API + JWT 구현 |
| 5 | `docs/04-ui-design.md` + `docs/05-architecture.md` 참고하여 디자인 시스템 + API 클라이언트 |
| 6 | `docs/04-ui-design.md` 학습자 페이지 섹션 참고하여 모든 학습자 페이지 구현 |
| 7 | `docs/04-ui-design.md` 관리자 페이지 섹션 참고하여 모든 관리자 페이지 구현 |
| 8 | 전체 기능 테스트 + 빌드 확인 + README |
| 9 | `docs/09-user-feature-spec.md` §2,§3(User),§4-1 참고하여 사용자 인증 구현 |
| 10 | `docs/09-user-feature-spec.md` §3(Wordbook),§4-2,§10 참고하여 단어장 기능 구현 |
| 11 | `docs/09-user-feature-spec.md` §3(Quiz),§4-3,§11 참고하여 퀴즈 기능 구현 |
| 12 | 전체 E2E 검증 + 빌드 + README 업데이트 |
