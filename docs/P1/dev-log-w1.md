# 개발 일지

## 프로젝트: CertPass (P1 MVP)

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-26 |
| 기간 | 2026-03-16 ~ 2026-03-23 |

---

3주간 NestJS 기반 백엔드 서버와 React 기반 프론트엔드 클라이언트를 구축했다. 프로젝트 초기 세팅부터 인증, 강의, 수강 신청, 학습 진도 API를 모두 구현하고, 프론트엔드에서는 레이아웃 구성과 인증, 강의 목록 및 상세 페이지까지 연동했다.

---

## 2. 단계 별 작업 내용

### Week 2 (3/16~3/17) — 프로젝트 세팅 및 인증

**환경 구성**
NestJS + TypeScript + Mongoose 조합으로 프로젝트를 초기 세팅하고, `.env` 파일 기반으로 MongoDB 연결을 구성했다.

**스키마 설계 및 정의**
도메인 모델 6개를 Mongoose 스키마로 정의했다.

| 스키마 | 주요 필드 |
|--------|----------|
| User | 이메일, 비밀번호(해시), 이름, 역할(student/instructor) |
| Course | 제목, 강사, 카테고리, 가격, 공개 여부 |
| Section | 강의 챕터, Course 참조 |
| Episode | 영상 URL, 재생 시간, 섹션/강의 참조 |
| Enrollment | User ↔ Course 수강 관계, 복합 유니크 인덱스 |
| Progress | 에피소드별 시청 완료 여부, 마지막 재생 위치 |

**인증 API 구현**
- `POST /api/v1/auth/register` — bcrypt 해싱 후 회원 저장
- `POST /api/v1/auth/login` — JWT 발급 (payload: userId, email, role)
- `JwtGuard` — Bearer 토큰 검증, 이후 모든 인증 엔드포인트에서 재사용
- `@CurrentUser()` 데코레이터 — 컨트롤러에서 인증된 유저 정보 주입

---

### Week 3 (3/18~3/20) — 기능 API 전체 구현

**사용자 프로필** (`GET/PATCH /api/v1/users/me`)
인증된 유저 본인의 프로필 조회 및 수정. 비밀번호는 응답에서 제외.

**카테고리** (`GET /api/v1/categories`)
인증 불필요한 공개 엔드포인트. 전체 카테고리 목록 반환.

**강의 목록/상세** (`GET /api/v1/courses`, `GET /api/v1/courses/:id`)
카테고리·레벨 필터링 지원. 상세 조회 시 섹션·에피소드 목록 포함(populate).

**에피소드 영상 조회** (`GET /api/v1/courses/:courseId/episodes/:episodeId`)
수강 신청 여부를 서비스 레이어에서 검사 후 접근 제어. 미수강 시 403 반환.

**수강 신청** (`POST /api/v1/enrollments`, `GET /api/v1/enrollments/me`)
중복 신청 방지 처리. 내 수강 목록 조회 시 강의 정보 populate 및 진도율 함께 응답.

**학습 진도** (`POST /api/v1/progress`, `GET /api/v1/progress/:courseId`)
에피소드별 시청 완료 여부 저장. 동일 에피소드 재요청 시 upsert 처리. 강의 전체 진도율 계산하여 응답.

**시드 스크립트**
`npm run seed` 명령으로 카테고리 6개, 샘플 강의 5개, 섹션/에피소드 데이터 삽입.

---

### Week 4 (3/23) — 프론트엔드 기초 세팅

**프로젝트 초기화**
Vite + React 19 + TypeScript 기반으로 프로젝트를 생성하고, Tailwind CSS v4.1을 `@tailwindcss/vite` 플러그인으로 연동했다.

**패키지 구성**

| 패키지 | 용도 |
|--------|------|
| React Router v6 | 클라이언트 라우팅 |
| TanStack Query v5 | 서버 상태 관리 |
| Zustand | 클라이언트 인증 상태 |
| Axios | HTTP 클라이언트 |
| React Hook Form + Zod | 폼 관리 및 유효성 검사 |

**Axios 인터셉터 및 인증 스토어**
- `api/client.ts` — JWT Bearer 토큰 자동 주입, 401 응답 시 자동 로그아웃
- `stores/authStore.ts` — Zustand로 토큰/유저 상태 관리, localStorage 동기화

**레이아웃 구성**
Header(네비게이션, 로그인/로그아웃), Footer, Layout 래퍼 컴포넌트 구현. React Router `<Outlet>`으로 페이지 교체.

---

### Week 5 (3/24) — 인증 페이지 및 강의 목록/상세 페이지

**로그인 / 회원가입 페이지**
React Hook Form + Zod로 폼 유효성 검사. TanStack Query `useMutation`으로 API 연동. 성공 시 Zustand 스토어에 토큰·유저 저장 후 홈으로 리다이렉트.

**강의 목록 페이지** (`/courses`)
- TanStack Query `useQuery`로 `GET /api/v1/courses` 연동
- 카테고리 필터 버튼(전체 + 6개 분야)으로 실시간 필터링
- 페이지네이션 UI (이전/다음 + 페이지 번호)
- `CourseCard` 컴포넌트 — 썸네일, 제목, 강사, 카테고리/레벨 배지, 무료 표시

**강의 상세 페이지** (`/courses/:courseId`)
- `GET /api/v1/courses/:courseId`로 섹션·에피소드 포함 상세 정보 조회
- 수강 신청 여부 확인 후 버튼 상태 분기(신청/수강 중)
- 섹션별 에피소드 목록과 재생 시간 표시
- 미로그인 상태에서 수강 신청 시 로그인 페이지로 리다이렉트

---

## 3. 미완료 및 보완 필요 사항 (3/21~3/26)

| 항목 | 내용 |
|------|------|
| 강의 플레이어 | YouTube iframe 임베드, 에피소드 사이드바, 진도 API 연동 미구현 |
| 내 강의실 | 수강 강의 목록 및 진도율 표시 페이지 미구현 |
| 마이페이지 | 프로필 수정, 비밀번호 변경 폼 미구현 |
| API 테스트 | Thunder Client / Postman 컬렉션 미작성 |
| 에러 핸들링 | 전역 Exception Filter 미적용 → 응답 형식 불일관 가능성 |
| 반응형 UI | 모바일 레이아웃 검수 미완료 |

---

## 4. 진행 현황 (3/26 기준)

| 주차 | 내용 | 상태 |
|------|------|------|
| Week 1 | 설계 및 문서화 | 완료 |
| Week 2 | 백엔드 기초 | 완료 |
| Week 3 | 백엔드 기능 API | 구현 완료 / 테스트 미완 |
| Week 4 | 프론트엔드 기초 | 완료 |
| Week 5 | 프론트엔드 핵심 기능 | 인증·강의 목록·상세 완료 / 플레이어·내 강의실 미완 |
| Week 6 | 마무리 및 제출 | 미시작 |
